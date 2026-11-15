import { db } from './db'
import { exercisesSeed } from '../data/exercisesSeed'

export async function seedExercises(): Promise<void> {
  const now = new Date().toISOString()
  await db.exercises.bulkAdd(exercisesSeed.map((e) => ({ ...e, createdAt: now })))
}

export async function seedDatabaseIfEmpty(): Promise<void> {
  if ((await db.exercises.count()) > 0) return
  await seedExercises()
}
