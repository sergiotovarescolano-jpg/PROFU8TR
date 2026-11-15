import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Match } from '../types/models'

export function useMatchForWeek(weekId: number | null): Match | null {
  const match = useLiveQuery(
    async () => (weekId ? await db.matches.where({ weekId }).first() : undefined),
    [weekId],
  )
  return match ?? null
}
