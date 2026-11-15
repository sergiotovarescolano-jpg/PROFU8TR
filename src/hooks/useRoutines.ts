import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Routine, WeekTemplate } from '../types/models'

export function useRoutines(): Routine[] {
  const routines = useLiveQuery(() => db.routines.orderBy('name').toArray(), [])
  return routines ?? []
}

/** undefined mientras carga, null si no existe. */
export function useRoutine(id: number): Routine | null | undefined {
  return useLiveQuery(async () => (await db.routines.get(id)) ?? null, [id])
}

export function useWeekTemplates(): WeekTemplate[] {
  const templates = useLiveQuery(() => db.weekTemplates.orderBy('name').toArray(), [])
  return templates ?? []
}
