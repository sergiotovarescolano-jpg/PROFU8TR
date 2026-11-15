import { addDays, addMinutes, format, parseISO } from 'date-fns'
import { dayDateForIndex } from '../../db/weekRepo'
import { TIER_INFO, TIER_ORDER, tierLabels, tierOf } from '../exerciseTier'
import { calcMatchLoad } from '../loadCalc'
import { SESSION_TYPE_INFO } from '../sessionTypeInfo'
import type { ExerciseTier, Match, MdTag, Session, SessionExercisePlanned, SessionType, Week } from '../../types/models'
import type { GEvent, GEventInput } from './api'

const SESSION_DEFAULT_MIN = 60
const MATCH_MIN = 105
const PLAN_MAX_CHARS = 1000 // límite de Google por propiedad privada (1024)

export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function timeRange(dateISO: string, startTime: string | undefined, minutes: number): Pick<GEventInput, 'start' | 'end'> {
  if (!startTime) {
    // Día completo: Google usa fin exclusivo (el día siguiente).
    return { start: { date: dateISO }, end: { date: format(addDays(parseISO(dateISO), 1), 'yyyy-MM-dd') } }
  }
  const start = parseISO(`${dateISO}T${startTime}`)
  const timeZone = localTimeZone()
  return {
    start: { dateTime: format(start, "yyyy-MM-dd'T'HH:mm:ss"), timeZone },
    end: { dateTime: format(addMinutes(start, minutes), "yyyy-MM-dd'T'HH:mm:ss"), timeZone },
  }
}

function formatPlan(p: SessionExercisePlanned): string {
  const parts = [
    p.sets && p.reps ? `${p.sets}×${p.reps}` : p.sets ? `${p.sets} series` : p.reps ? `${p.reps} reps` : '',
    p.weightKg !== undefined ? `${p.weightKg} kg` : '',
    p.durationSec !== undefined ? `${p.durationSec} s` : '',
  ].filter(Boolean)
  return parts.length ? ` — ${parts.join(' · ')}` : ''
}

// Plan compacto en las propiedades privadas del evento: permite reconstruir la sesión
// (por ejemplo al restaurar en otro móvil) aunque la descripción la haya editado el usuario.
const TIER_CODES: Record<ExerciseTier, string> = { main: 'm', secondary: 's', accessory: 'a' }
type PlanRow = [number, string, number | null, number | null, number | null, number | null, number | null]

function encodePlan(planned: SessionExercisePlanned[]): string | undefined {
  const rows: PlanRow[] = planned.map((p) => [
    p.exerciseId,
    p.tier ? TIER_CODES[p.tier] : '',
    p.sets ?? null,
    p.reps ?? null,
    p.weightKg ?? null,
    p.durationSec ?? null,
    p.restSec ?? null,
  ])
  const json = JSON.stringify(rows)
  return json.length <= PLAN_MAX_CHARS ? json : undefined
}

export function decodePlan(json: string | undefined): SessionExercisePlanned[] | null {
  if (!json) return null
  try {
    const rows = JSON.parse(json) as PlanRow[]
    if (!Array.isArray(rows)) return null
    const tierByCode = Object.fromEntries(Object.entries(TIER_CODES).map(([tier, code]) => [code, tier as ExerciseTier]))
    return rows
      .filter((r) => Array.isArray(r) && typeof r[0] === 'number')
      .map((r, i) => ({
        exerciseId: r[0],
        order: i,
        tier: tierByCode[r[1]],
        sets: r[2] ?? undefined,
        reps: r[3] ?? undefined,
        weightKg: r[4] ?? undefined,
        durationSec: r[5] ?? undefined,
        restSec: r[6] ?? undefined,
      }))
  } catch {
    return null
  }
}

export function buildSessionEvent(
  session: Session,
  mondayISO: string,
  mdTag: MdTag | null,
  exerciseNames: Map<number, string>,
  appUrl: string,
): GEventInput {
  const info = SESSION_TYPE_INFO[session.type]
  const dateISO = dayDateForIndex(mondayISO, session.dayIndex)
  const name = (id: number) => exerciseNames.get(id) ?? 'Ejercicio'
  const lines: string[] = [`${info.label}${mdTag ? ` · ${mdTag}` : ''}`]

  const planned = session.plannedExercises
  if (planned.length > 0) {
    lines.push('')
    const grouped = session.type === 'gimnasio' && planned.some((p) => p.tier !== undefined)
    if (grouped) {
      const labels = tierLabels(planned)
      for (const tier of TIER_ORDER) {
        const rows = planned.map((p, i) => ({ p, i })).filter(({ p }) => tierOf(p) === tier)
        if (rows.length === 0) continue
        lines.push(TIER_INFO[tier].label.toUpperCase())
        rows.forEach(({ p, i }) => lines.push(`${labels[i]} ${name(p.exerciseId)}${formatPlan(p)}`))
      }
    } else {
      planned.forEach((p) => lines.push(`• ${name(p.exerciseId)}${formatPlan(p)}`))
    }
  }

  if (session.status === 'hecha') {
    lines.push('', `✓ Hecha · RPE ${session.rpe ?? '—'} · ${session.durationMin ?? '—'} min · carga ${session.loadScore ?? '—'}`)
  } else if (session.status === 'saltada') {
    lines.push('', '✗ Saltada')
  }
  lines.push('', `Abrir en Fútbol Planner: ${appUrl}#/sesion/${session.id}`)

  const plan = encodePlan(planned)
  return {
    summary: `${session.status === 'hecha' ? '✓ ' : ''}${info.icon} ${session.title}`,
    description: lines.join('\n'),
    ...timeRange(dateISO, session.startTime, session.durationMin ?? SESSION_DEFAULT_MIN),
    extendedProperties: { private: { fp: 'session', fpType: session.type, ...(plan ? { fpPlan: plan } : {}) } },
  }
}

export function buildMatchEvent(week: Week, match: Match | null): GEventInput | null {
  const md = week.matchDay
  if (!md || week.isNoMatchWeek) return null
  const where = md.homeAway === 'casa' ? 'Casa' : 'Fuera'
  const lines = ['Día de partido (MD)']
  if (match) {
    const score = match.goalsFor !== undefined && match.goalsAgainst !== undefined ? `${match.goalsFor}-${match.goalsAgainst} · ` : ''
    lines.push(`${score}${match.minutesPlayed} min · ${match.goals} goles · ${match.assists} asist. · carga ${calcMatchLoad(match)}`)
  }
  return {
    summary: `⚽ Partido${md.rival ? ` vs ${md.rival}` : ''} (${where})`,
    description: lines.join('\n'),
    ...timeRange(dayDateForIndex(week.mondayISO, md.dayIndex), /^\d{2}:\d{2}$/.test(md.time) ? md.time : undefined, MATCH_MIN),
    extendedProperties: { private: { fp: 'match', fpWeek: week.mondayISO } },
  }
}

export interface ParsedEvent {
  dateISO: string
  startTime?: string
  title: string
  iconType?: SessionType // tipo deducido del icono del título, si lo lleva
}

/** Lee fecha, hora y título de un evento (deshaciendo el "✓" y el icono que pone la app). */
export function parseEvent(event: GEvent): ParsedEvent | null {
  let dateISO: string
  let startTime: string | undefined
  if (event.start?.date) {
    dateISO = event.start.date
  } else if (event.start?.dateTime) {
    const start = new Date(event.start.dateTime) // se muestra en la zona horaria del móvil
    if (Number.isNaN(start.getTime())) return null
    dateISO = format(start, 'yyyy-MM-dd')
    startTime = format(start, 'HH:mm')
  } else {
    return null
  }

  let title = (event.summary ?? '').trim().replace(/^✓\s*/, '')
  let iconType: SessionType | undefined
  for (const [type, info] of Object.entries(SESSION_TYPE_INFO) as [SessionType, (typeof SESSION_TYPE_INFO)[SessionType]][]) {
    if (title.startsWith(info.icon)) {
      iconType = type
      title = title.slice(info.icon.length).trim()
      break
    }
  }
  return { dateISO, startTime, title: title || 'Sesión', iconType }
}
