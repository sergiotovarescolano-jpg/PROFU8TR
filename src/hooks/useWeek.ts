import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { db } from '../db/db'
import { ensureWeek } from '../db/weekRepo'
import type { Session, Week } from '../types/models'

/**
 * Carga (y crea si no existe) la semana de `mondayISO`, con sus sesiones y partido en vivo.
 * Devuelve null mientras se resuelve la creación inicial.
 */
export function useWeek(mondayISO: string): {
  week: Week | null
  sessions: Session[]
  loading: boolean
} {
  const [weekId, setWeekId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setWeekId(null)
    ensureWeek(mondayISO).then((week) => {
      if (!cancelled) setWeekId(week.id!)
    })
    return () => {
      cancelled = true
    }
  }, [mondayISO])

  const week = useLiveQuery(async () => (weekId ? await db.weeks.get(weekId) : undefined), [weekId])

  const sessions = useLiveQuery(
    async () => (weekId ? await db.sessions.where({ weekId }).toArray() : []),
    [weekId],
  )

  return {
    week: week ?? null,
    sessions: sessions ?? [],
    loading: weekId === null || week === undefined,
  }
}
