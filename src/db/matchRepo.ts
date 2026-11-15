import { db } from './db'
import type { Match } from '../types/models'

/** Cada semana tiene como mucho un partido: si ya está registrado, se actualiza. */
export async function saveMatch(data: Omit<Match, 'id' | 'createdAt'>): Promise<void> {
  const existing = await db.matches.where({ weekId: data.weekId }).first()
  if (existing) await db.matches.update(existing.id, data)
  else await db.matches.add({ ...data, createdAt: new Date().toISOString() })
}

export async function deleteMatch(id: number): Promise<void> {
  await db.matches.delete(id)
}
