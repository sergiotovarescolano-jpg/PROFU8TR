import { db } from './db'
import type { MatchDayInfo, Session, Week, WeekTemplate } from '../types/models'
import { getWeekDates, shiftWeek } from '../utils/dateUtils'

// Llamadas concurrentes a ensureWeek con el mismo mondayISO (p. ej. el doble efecto de
// React StrictMode en desarrollo) comparten esta misma promesa en vez de competir por
// crear la fila dos veces y chocar con el índice único de mondayISO.
const weekCreationInFlight = new Map<string, Promise<Week>>()

/** Devuelve la semana para esa fecha, creándola vacía si no existe todavía. */
export async function ensureWeek(mondayISO: string): Promise<Week> {
  const existing = await db.weeks.where({ mondayISO }).first()
  if (existing) return existing

  const pending = weekCreationInFlight.get(mondayISO)
  if (pending) return pending

  const creation = (async (): Promise<Week> => {
    try {
      const id = await db.weeks.add({ mondayISO, matchDay: null, isNoMatchWeek: false })
      return { id, mondayISO, matchDay: null, isNoMatchWeek: false }
    } catch {
      const createdByOther = await db.weeks.where({ mondayISO }).first()
      if (createdByOther) return createdByOther
      throw new Error(`No se pudo crear ni recuperar la semana ${mondayISO}`)
    } finally {
      weekCreationInFlight.delete(mondayISO)
    }
  })()

  weekCreationInFlight.set(mondayISO, creation)
  return creation
}

// Si el partido ya está registrado, su fecha y rival siguen a los del día de partido.
export async function setMatchDay(weekId: number, matchDay: MatchDayInfo): Promise<void> {
  await db.transaction('rw', db.weeks, db.matches, async () => {
    await db.weeks.update(weekId, { matchDay, isNoMatchWeek: false })
    const week = await db.weeks.get(weekId)
    if (!week) return
    await db.matches.where({ weekId }).modify({
      date: dayDateForIndex(week.mondayISO, matchDay.dayIndex),
      rival: matchDay.rival,
      homeAway: matchDay.homeAway,
    })
  })
}

export async function clearMatchDay(weekId: number): Promise<void> {
  await db.transaction('rw', db.weeks, db.matches, async () => {
    await db.weeks.update(weekId, { matchDay: null })
    await db.matches.where({ weekId }).delete()
  })
}

/**
 * Activar "semana sin partido" solo oculta el MD y las etiquetas (ver WeekPage), no borra
 * los datos del partido guardado: si se desactiva, el partido sigue ahí tal cual estaba.
 */
export async function setNoMatchWeek(weekId: number, isNoMatchWeek: boolean): Promise<void> {
  await db.weeks.update(weekId, { isNoMatchWeek })
}

/** Copia todas las sesiones (sin estado de "hecho") de una semana a otra. */
export async function duplicateWeek(sourceWeekId: number, targetMondayISO: string): Promise<number> {
  const targetWeek = await ensureWeek(targetMondayISO)
  const targetWeekId = targetWeek.id!
  const sourceSessions = await db.sessions.where({ weekId: sourceWeekId }).toArray()

  const now = new Date().toISOString()
  const copies: Omit<Session, 'id'>[] = sourceSessions.map((s) => ({
    weekId: targetWeekId,
    dayIndex: s.dayIndex,
    type: s.type,
    title: s.title,
    startTime: s.startTime,
    sourceRoutineId: s.sourceRoutineId,
    plannedExercises: s.plannedExercises,
    doneExercises: [],
    status: 'planificada',
    pain: [],
    createdAt: now,
    updatedAt: now,
  }))

  if (copies.length > 0) await db.sessions.bulkAdd(copies)
  return targetWeekId
}

/** Sesiones que ya tiene la semana de `mondayISO`, sin crearla si no existe. */
export async function countSessionsInWeek(mondayISO: string): Promise<number> {
  const week = await db.weeks.where({ mondayISO }).first()
  return week ? db.sessions.where({ weekId: week.id }).count() : 0
}

// La plantilla guarda una copia de los ejercicios para respetar los retoques hechos en la semana.
export async function saveWeekAsTemplate(weekId: number, name: string): Promise<void> {
  const sessions = await db.sessions.where({ weekId }).toArray()
  const days = sessions.map((s) => ({
    dayIndex: s.dayIndex,
    sessionType: s.type,
    title: s.title,
    routineId: s.sourceRoutineId,
    plannedExercises: s.plannedExercises,
  }))
  await db.weekTemplates.add({ name, days, createdAt: new Date().toISOString() })
}

export async function deleteWeekTemplate(id: number): Promise<void> {
  await db.weekTemplates.delete(id)
}

export async function applyTemplateToWeek(template: WeekTemplate, weekId: number): Promise<void> {
  const now = new Date().toISOString()
  const sessions: Omit<Session, 'id'>[] = template.days.map((day) => ({
    weekId,
    dayIndex: day.dayIndex,
    type: day.sessionType,
    title: day.title,
    sourceRoutineId: day.routineId,
    plannedExercises: day.plannedExercises,
    doneExercises: [],
    status: 'planificada',
    pain: [],
    createdAt: now,
    updatedAt: now,
  }))

  if (sessions.length > 0) await db.sessions.bulkAdd(sessions)
}

/** Fechas reales (YYYY-MM-DD) de los últimos N lunes, incluyendo el de `mondayISO`. */
export function getPastMondays(mondayISO: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftWeek(mondayISO, -i))
}

export function dayDateForIndex(mondayISO: string, dayIndex: number): string {
  return getWeekDates(mondayISO)[dayIndex]
}
