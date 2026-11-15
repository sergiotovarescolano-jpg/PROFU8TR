import type { Match, Session } from '../types/models'

/** Carga de una sesión = RPE (1-10) x duración en minutos. */
export function calcSessionLoad(rpe: number | undefined, durationMin: number | undefined): number {
  if (!rpe || !durationMin) return 0
  return rpe * durationMin
}

/** Misma fórmula que una sesión, para que los minutos de partido sumen en las mismas unidades. */
export function calcMatchLoad(match: Pick<Match, 'minutesPlayed' | 'rpe'>): number {
  return calcSessionLoad(match.rpe, match.minutesPlayed)
}

export interface WeekSummary {
  load: number
  minutes: number
  sessionsDone: number
  sessionsPlanned: number
  avgRpe: number | null
}

// Solo cuenta lo terminado: una sesión en curso guarda su carga, pero no suma hasta acabarla.
export function summarizeWeek(sessions: Session[], match: Match | null): WeekSummary {
  const done = sessions.filter((s) => s.status === 'hecha')
  const rpes = [...done.map((s) => s.rpe), match?.rpe].filter((r): r is number => r !== undefined)

  return {
    load: done.reduce((sum, s) => sum + (s.loadScore ?? 0), 0) + (match ? calcMatchLoad(match) : 0),
    minutes: done.reduce((sum, s) => sum + (s.durationMin ?? 0), 0) + (match?.minutesPlayed ?? 0),
    sessionsDone: done.length,
    sessionsPlanned: sessions.filter((s) => s.type !== 'descanso').length,
    avgRpe: rpes.length > 0 ? rpes.reduce((sum, r) => sum + r, 0) / rpes.length : null,
  }
}

/**
 * Ratio agudo:crónico simplificado: carga de esta semana vs. media de las 4 semanas anteriores.
 * Devuelve null si no hay suficientes datos previos para comparar.
 */
export function calcAcwrAlert(
  currentWeekLoad: number,
  previousWeeksLoads: number[],
): { ratio: number; percentOver: number; isAlert: boolean } | null {
  const validPrevious = previousWeeksLoads.filter((l) => l > 0)
  if (validPrevious.length === 0) return null

  const chronicAvg = validPrevious.reduce((sum, l) => sum + l, 0) / validPrevious.length
  if (chronicAvg === 0) return null

  const ratio = currentWeekLoad / chronicAvg
  const percentOver = (ratio - 1) * 100
  return { ratio, percentOver, isAlert: percentOver > 30 }
}
