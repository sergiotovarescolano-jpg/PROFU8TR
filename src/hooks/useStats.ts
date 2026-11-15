import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { dayDateForIndex } from '../db/weekRepo'
import type { MdTag } from '../types/models'
import { shiftWeek } from '../utils/dateUtils'
import { calcMatchLoad, summarizeWeek, type WeekSummary } from '../utils/loadCalc'
import { getMdTagForDay } from '../utils/mdTag'

export interface DayStat {
  dayIndex: number
  load: number
  minutes: number
  sessionsDone: number
  sessionsPlanned: number // sin contar descansos
  isMatchDay: boolean
  mdTag: MdTag | null
}

/** Carga día a día de una semana. No crea la semana si no existe (solo se está consultando). */
export function useWeekDays(mondayISO: string): DayStat[] | undefined {
  return useLiveQuery(async () => {
    const week = await db.weeks.where('mondayISO').equals(mondayISO).first()
    const sessions = week ? await db.sessions.where('weekId').equals(week.id).toArray() : []
    const matchDay = week && !week.isNoMatchWeek ? week.matchDay : null
    const match = week && matchDay ? await db.matches.where('weekId').equals(week.id).first() : undefined

    return Array.from({ length: 7 }, (_, dayIndex) => {
      const daySessions = sessions.filter((s) => s.dayIndex === dayIndex)
      const done = daySessions.filter((s) => s.status === 'hecha')
      const isMatchDay = matchDay?.dayIndex === dayIndex
      const matchHere = isMatchDay && match ? match : null
      return {
        dayIndex,
        load: done.reduce((sum, s) => sum + (s.loadScore ?? 0), 0) + (matchHere ? calcMatchLoad(matchHere) : 0),
        minutes: done.reduce((sum, s) => sum + (s.durationMin ?? 0), 0) + (matchHere?.minutesPlayed ?? 0),
        sessionsDone: done.length,
        sessionsPlanned: daySessions.filter((s) => s.type !== 'descanso').length,
        isMatchDay,
        mdTag: matchDay ? getMdTagForDay(matchDay.dayIndex, dayIndex) : null,
      }
    })
  }, [mondayISO])
}

export interface WeekStat extends WeekSummary {
  mondayISO: string
}

/** Resumen de las `count` semanas que acaban en `lastMondayISO`, de la más antigua a la más reciente. */
export function useWeekStats(lastMondayISO: string, count: number): WeekStat[] | undefined {
  return useLiveQuery(async () => {
    const mondays = Array.from({ length: count }, (_, i) => shiftWeek(lastMondayISO, i - count + 1))
    const weeks = await db.weeks.where('mondayISO').anyOf(mondays).toArray()
    const weekIds = weeks.map((w) => w.id)
    const [sessions, matches] = await Promise.all([
      db.sessions.where('weekId').anyOf(weekIds).toArray(),
      db.matches.where('weekId').anyOf(weekIds).toArray(),
    ])

    return mondays.map((mondayISO) => {
      const week = weeks.find((w) => w.mondayISO === mondayISO)
      if (!week) return { mondayISO, load: 0, minutes: 0, sessionsDone: 0, sessionsPlanned: 0, avgRpe: null }
      const match = week.isNoMatchWeek ? null : (matches.find((m) => m.weekId === week.id) ?? null)
      return { mondayISO, ...summarizeWeek(sessions.filter((s) => s.weekId === week.id), match) }
    })
  }, [lastMondayISO, count])
}

export interface WeightPoint {
  date: string
  weightKg: number
}

export interface ExerciseProgress {
  exerciseId: number
  name: string
  points: WeightPoint[]
}

/** Peso máximo usado por fecha en cada ejercicio, solo de sesiones terminadas con kilos registrados. */
export function useWeightProgress(): ExerciseProgress[] | undefined {
  return useLiveQuery(async () => {
    const [sessions, weeks, exercises] = await Promise.all([
      db.sessions.where('status').equals('hecha').toArray(),
      db.weeks.toArray(),
      db.exercises.toArray(),
    ])
    const mondayById = new Map(weeks.map((w) => [w.id, w.mondayISO]))
    const byExercise = new Map<number, Map<string, number>>()

    for (const session of sessions) {
      const monday = mondayById.get(session.weekId)
      if (!monday) continue
      const date = dayDateForIndex(monday, session.dayIndex)
      for (const done of session.doneExercises) {
        if (!done.weightUsedKg) continue
        const dates = byExercise.get(done.exerciseId) ?? new Map<string, number>()
        dates.set(date, Math.max(dates.get(date) ?? 0, done.weightUsedKg))
        byExercise.set(done.exerciseId, dates)
      }
    }

    return [...byExercise.entries()]
      .map(([exerciseId, dates]) => ({
        exerciseId,
        name: exercises.find((e) => e.id === exerciseId)?.name ?? 'Ejercicio eliminado',
        points: [...dates.entries()].map(([date, weightKg]) => ({ date, weightKg })).sort((a, b) => a.date.localeCompare(b.date)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [])
}
