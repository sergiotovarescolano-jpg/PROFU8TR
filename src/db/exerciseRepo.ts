import { db } from './db'
import type { Exercise } from '../types/models'

export async function createExercise(data: Omit<Exercise, 'id' | 'createdAt'>): Promise<number> {
  return db.exercises.add({ ...data, createdAt: new Date().toISOString() })
}

export async function updateExercise(id: number, changes: Partial<Exercise>): Promise<void> {
  await db.exercises.update(id, changes)
}

// Se quita de las rutinas para que no queden referencias rotas. Las sesiones no se tocan:
// son historial, y el editor las muestra como "Ejercicio eliminado".
export async function deleteExercise(id: number): Promise<void> {
  await db.transaction('rw', db.exercises, db.routines, async () => {
    const routines = await db.routines.toArray()
    for (const routine of routines) {
      if (routine.exercises.some((e) => e.exerciseId === id)) {
        await db.routines.update(routine.id, {
          exercises: routine.exercises.filter((e) => e.exerciseId !== id).map((e, i) => ({ ...e, order: i })),
        })
      }
    }
    await db.exercises.delete(id)
  })
}
