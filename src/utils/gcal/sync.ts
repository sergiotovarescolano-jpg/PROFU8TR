import { db } from '../../db/db'
import { ensureWeek } from '../../db/weekRepo'
import { getMondayISO, shiftWeek, todayMondayISO } from '../dateUtils'
import { getMdTagForDay } from '../mdTag'
import { SESSION_TYPE_INFO } from '../sessionTypeInfo'
import type { Session, SessionType, Week } from '../../types/models'
import { calendarApi, GcalApiError, type CalendarApi, type GEvent } from './api'
import { getAccessToken, GcalAuthError } from './auth'
import { buildMatchEvent, buildSessionEvent, decodePlan, localTimeZone, parseEvent } from './events'
import { GCAL_UNLINKED, getConfig, saveConfig, type SyncSummary } from './state'

const CALENDAR_NAME = 'Fútbol Planner'
// Ventana que se sincroniza: 4 semanas atrás y 12 por delante.
const WEEKS_BACK = 4
const WEEKS_AHEAD = 12

// --- Estado observable para la interfaz -------------------------------------------------

export interface SyncStatus {
  running: boolean
  error: string | null
  needsReconnect: boolean
}

let status: SyncStatus = { running: false, error: null, needsReconnect: false }
const listeners = new Set<() => void>()

function setStatus(changes: Partial<SyncStatus>) {
  status = { ...status, ...changes }
  listeners.forEach((l) => l())
}

export function getSyncStatus(): SyncStatus {
  return status
}

export function subscribeSyncStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// --- Utilidades ---------------------------------------------------------------------------

function windowMondays(): { from: string; to: string } {
  const today = todayMondayISO()
  return { from: shiftWeek(today, -WEEKS_BACK), to: shiftWeek(today, WEEKS_AHEAD) }
}

function appUrl(): string {
  return `${location.origin}${location.pathname}`
}

function mdTagFor(week: Week, dayIndex: number) {
  return week.matchDay && !week.isNoMatchWeek ? getMdTagForDay(week.matchDay.dayIndex, dayIndex) : null
}

function normalizeName(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

/** ¿Debe tener evento? Descansos no (nada que recordar) y las quitadas del calendario tampoco. */
function belongsInCalendar(session: Session): boolean {
  return session.type !== 'descanso' && session.gcalEventId !== GCAL_UNLINKED
}

function isLinked(session: Session): boolean {
  return Boolean(session.gcalEventId) && session.gcalEventId !== GCAL_UNLINKED
}

// Dos relojes, nunca mezclados: lo local se compara con la hora del móvil (updatedAt vs
// gcalSyncedAt) y lo remoto con la de Google (event.updated vs gcalRemoteUpdated). Así un
// móvil con el reloj desfasado no pierde cambios.
function isDirty(session: Session): boolean {
  return (session.updatedAt ?? '') > (session.gcalSyncedAt ?? '')
}

/** Campos que dejan la sesión "en paz" con su evento tras sincronizar. */
function syncedWith(event: GEvent) {
  const now = new Date().toISOString()
  return { gcalEventId: event.id, gcalRemoteUpdated: event.updated, gcalSyncedAt: now, updatedAt: now }
}

const UNLINK = { gcalSyncedAt: undefined, gcalRemoteUpdated: undefined }

/** Devuelve el calendario "Fútbol Planner", creándolo si no existe (o si se borró en Google). */
async function ensureCalendar(api: CalendarApi): Promise<{ id: string; created: boolean }> {
  const { calendarId } = getConfig()
  if (calendarId) {
    try {
      await api.getCalendar(calendarId)
      return { id: calendarId, created: false }
    } catch (e) {
      if (!(e instanceof GcalApiError && (e.status === 404 || e.status === 410))) throw e
    }
  }
  const created = await api.createCalendar(CALENDAR_NAME, localTimeZone())
  saveConfig({ calendarId: created.id })
  return { id: created.id, created: true }
}

// --- Sincronización -----------------------------------------------------------------------

let inFlight: Promise<SyncSummary> | null = null

/**
 * Sincroniza en los dos sentidos. Con `interactive` puede abrir la ventana de Google para
 * pedir permiso (solo desde un toque del usuario); sin él, falla si el token ha caducado.
 */
export function runSync({ interactive }: { interactive: boolean }): Promise<SyncSummary> {
  if (inFlight) return inFlight
  inFlight = (async () => {
    setStatus({ running: true, error: null })
    try {
      const token = await getAccessToken({ interactive })
      const summary = await syncWith(calendarApi(token))
      saveConfig({ enabled: true, lastSyncAt: new Date().toISOString(), lastSummary: summary })
      setStatus({ needsReconnect: false })
      return summary
    } catch (e) {
      setStatus({ error: (e as Error).message, needsReconnect: e instanceof GcalAuthError })
      throw e
    } finally {
      setStatus({ running: false })
      inFlight = null
    }
  })()
  return inFlight
}

async function syncWith(api: CalendarApi): Promise<SyncSummary> {
  const summary: SyncSummary = { created: 0, updated: 0, deleted: 0, imported: 0, removed: 0 }
  const calendar = await ensureCalendar(api)

  // Calendario nuevo (primera vez o borrado en Google): los enlaces antiguos ya no valen.
  // Se vuelve a subir todo en lugar de interpretar que los eventos se han borrado.
  if (calendar.created) {
    await db.sessions.toCollection().modify((s) => {
      if (s.gcalEventId !== GCAL_UNLINKED) delete s.gcalEventId
      delete s.gcalSyncedAt
      delete s.gcalRemoteUpdated
    })
    saveConfig({ matchEvents: {}, pendingDeletes: [] })
  }

  const { from, to } = windowMondays()
  const remote = await api.listEvents(calendar.id, new Date(`${from}T00:00:00`).toISOString(), new Date(`${to}T00:00:00`).toISOString())
  const remoteById = new Map(remote.map((e) => [e.id, e]))

  // 1. Sesiones borradas en la app → borrar su evento.
  const pending = getConfig().pendingDeletes
  const stillPending: string[] = []
  for (const eventId of pending) {
    try {
      await api.deleteEvent(calendar.id, eventId)
      summary.deleted++
    } catch {
      stillPending.push(eventId)
    }
  }
  saveConfig({ pendingDeletes: stillPending })
  const deletedHere = new Set(pending)

  const [weeks, routines, exercises] = await Promise.all([db.weeks.toArray(), db.routines.toArray(), db.exercises.toArray()])
  const weekById = new Map(weeks.map((w) => [w.id, w]))
  const exerciseNames = new Map(exercises.map((e) => [e.id, e.name]))
  const exerciseIds = new Set(exercises.map((e) => e.id))
  const sessionByEvent = new Map((await db.sessions.toArray()).filter(isLinked).map((s) => [s.gcalEventId!, s]))

  async function weekOf(weekId: number): Promise<Week | undefined> {
    const known = weekById.get(weekId)
    if (known) return known
    const loaded = await db.weeks.get(weekId)
    if (loaded) weekById.set(loaded.id, loaded)
    return loaded
  }

  async function push(session: Session, existing?: GEvent): Promise<void> {
    const week = await weekOf(session.weekId)
    if (!week) return
    const body = buildSessionEvent(session, week.mondayISO, mdTagFor(week, session.dayIndex), exerciseNames, appUrl())
    const saved = existing ? await api.patchEvent(calendar.id, existing.id, body) : await api.insertEvent(calendar.id, body)
    await db.sessions.update(session.id, syncedWith(saved))
  }

  /** Aplica un evento remoto a su sesión enlazada (o la sube si el cambio más reciente es de la app). */
  async function reconcile(event: GEvent, local: Session): Promise<void> {
    if (event.status === 'cancelled') {
      // Pendiente → se borra; ya registrada → se conserva el registro fuera del calendario.
      if (local.status === 'planificada') await db.sessions.delete(local.id)
      else await db.sessions.update(local.id, { gcalEventId: GCAL_UNLINKED, ...UNLINK })
      summary.removed++
      return
    }
    const parsed = parseEvent(event)
    if (!parsed) return
    const remoteChanged = (event.updated ?? '') > (local.gcalRemoteUpdated ?? '')
    // Si cambiaron los dos lados, gana el más reciente (único punto donde se cruzan los relojes).
    if (remoteChanged && (!isDirty(local) || (event.updated ?? '') >= (local.updatedAt ?? ''))) {
      const noon = new Date(`${parsed.dateISO}T12:00:00`)
      const week = await ensureWeek(getMondayISO(noon))
      weekById.set(week.id, week)
      await db.sessions.update(local.id, {
        weekId: week.id,
        dayIndex: (noon.getDay() + 6) % 7,
        startTime: parsed.startTime,
        title: parsed.title,
        ...syncedWith(event),
      })
      summary.imported++
    } else if (isDirty(local)) {
      await push(local, event)
      summary.updated++
    }
  }

  // 2. Cambios hechos en Google dentro de la ventana.
  const handled = new Set<string>()
  for (const event of remote) {
    const kind = event.extendedProperties?.private?.fp
    if (kind === 'match' || deletedHere.has(event.id)) continue
    handled.add(event.id)
    const local = sessionByEvent.get(event.id)
    if (local) {
      await reconcile(event, local)
      continue
    }
    if (event.status === 'cancelled') continue

    // Evento sin sesión en la app: creado a mano en Google (o desde otro móvil) → nueva sesión.
    const parsed = parseEvent(event)
    if (!parsed) continue
    const routine = routines.find((r) => normalizeName(r.name) === normalizeName(parsed.title))
    const typeFromEvent = event.extendedProperties?.private?.fpType
    const type: SessionType =
      (typeFromEvent && typeFromEvent in SESSION_TYPE_INFO ? (typeFromEvent as SessionType) : undefined) ??
      routine?.sessionType ??
      parsed.iconType ??
      'entreno_equipo'
    const planned = (decodePlan(event.extendedProperties?.private?.fpPlan) ?? routine?.exercises ?? []).filter((p) =>
      exerciseIds.has(p.exerciseId),
    )
    const noon = new Date(`${parsed.dateISO}T12:00:00`)
    const week = await ensureWeek(getMondayISO(noon))
    weekById.set(week.id, week)
    const id = await db.sessions.add({
      weekId: week.id,
      dayIndex: (noon.getDay() + 6) % 7,
      type,
      title: parsed.title,
      startTime: parsed.startTime,
      sourceRoutineId: routine?.id,
      plannedExercises: planned,
      doneExercises: [],
      status: 'planificada',
      pain: [],
      createdAt: new Date().toISOString(),
      ...syncedWith(event),
    })
    summary.imported++
    // Creado a mano: se reescribe con el formato de la app (icono y ejercicios en la descripción).
    if (kind !== 'session') {
      const created = await db.sessions.get(id)
      if (created && created.type !== 'descanso') await push(created, event)
    }
  }

  // 3. Sesiones enlazadas cuyo evento no salió en la lista: se movió fuera de la ventana o se
  //    borró hace tiempo. Se consulta directamente antes de decidir nada.
  for (const [eventId, local] of sessionByEvent) {
    if (handled.has(eventId) || deletedHere.has(eventId)) continue
    const week = await weekOf(local.weekId)
    if (!week || week.mondayISO < from || week.mondayISO >= to) continue
    const event = await api.getEvent(calendar.id, eventId)
    if (event) await reconcile(event, local)
    else await db.sessions.update(local.id, { gcalEventId: undefined, ...UNLINK }) // se volverá a crear
  }

  // 4. Cambios hechos en la app.
  for (const session of await db.sessions.toArray()) {
    const week = await weekOf(session.weekId)
    if (!week || week.mondayISO < from || week.mondayISO >= to) continue

    if (session.type === 'descanso') {
      // Pasó a "descanso": su evento sobra.
      if (isLinked(session)) {
        await api.deleteEvent(calendar.id, session.gcalEventId!)
        await db.sessions.update(session.id, { gcalEventId: undefined, ...UNLINK })
        summary.deleted++
      }
      continue
    }
    if (!belongsInCalendar(session)) continue
    if (!session.gcalEventId) {
      await push(session)
      summary.created++
    } else if (isDirty(session)) {
      const existing = remoteById.get(session.gcalEventId) ?? (await api.getEvent(calendar.id, session.gcalEventId))
      if (existing && existing.status !== 'cancelled') {
        await push(session, existing)
        summary.updated++
      }
    }
  }

  // 5. Partidos (solo de la app a Google).
  const matchEvents = { ...getConfig().matchEvents }
  const matches = await db.matches.toArray()
  for (const week of await db.weeks.where('mondayISO').between(from, to, true, false).toArray()) {
    const body = buildMatchEvent(week, matches.find((m) => m.weekId === week.id) ?? null)
    const stored = matchEvents[week.mondayISO]
    if (!body) {
      if (stored) {
        await api.deleteEvent(calendar.id, stored.eventId)
        delete matchEvents[week.mondayISO]
        summary.deleted++
      }
      continue
    }
    const hash = JSON.stringify(body)
    const remoteEvent = stored ? remoteById.get(stored.eventId) : undefined
    if (!stored || !remoteEvent || remoteEvent.status === 'cancelled') {
      const saved = await api.insertEvent(calendar.id, body)
      matchEvents[week.mondayISO] = { eventId: saved.id, hash }
      summary.created++
    } else if (stored.hash !== hash) {
      await api.patchEvent(calendar.id, stored.eventId, body)
      matchEvents[week.mondayISO] = { eventId: stored.eventId, hash }
      summary.updated++
    }
  }
  saveConfig({ matchEvents })

  return summary
}

/** ¿Hay algo en la app que todavía no está en Google? Lo usa la sincronización automática. */
export async function hasLocalChanges(): Promise<boolean> {
  const config = getConfig()
  if (!config.enabled || !config.calendarId) return false
  if (config.pendingDeletes.length > 0) return true
  const { from, to } = windowMondays()
  const weeks = await db.weeks.where('mondayISO').between(from, to, true, false).toArray()
  const weekIds = weeks.map((w) => w.id)
  const sessions = await db.sessions.where('weekId').anyOf(weekIds).toArray()
  const sessionDirty = sessions.some((s) =>
    s.type === 'descanso' ? isLinked(s) : belongsInCalendar(s) && (!s.gcalEventId || isDirty(s)),
  )
  if (sessionDirty) return true
  const matches = await db.matches.where('weekId').anyOf(weekIds).toArray()
  return weeks.some((w) => {
    const body = buildMatchEvent(w, matches.find((m) => m.weekId === w.id) ?? null)
    const stored = config.matchEvents[w.mondayISO]
    return body ? !stored || stored.hash !== JSON.stringify(body) : Boolean(stored)
  })
}
