import { db } from './db'
import type { Routine } from '../types/models'

export async function createRoutine(data: Omit<Routine, 'id' | 'createdAt'>): Promise<number> {
  return db.routines.add({ ...data, createdAt: new Date().toISOString() })
}

export async function updateRoutine(id: number, changes: Partial<Routine>): Promise<void> {
  await db.routines.update(id, changes)
}

// Las sesiones ya planificadas conservan su copia de los ejercicios: borrar la rutina no las altera.
export async function deleteRoutine(id: number): Promise<void> {
  await db.routines.delete(id)
}
