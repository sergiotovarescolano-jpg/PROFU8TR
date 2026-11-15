import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Exercise, ExerciseCategory } from '../types/models'

// Sin acentos ni mayúsculas: en el móvil se busca "nordicos" tan a menudo como "Nórdicos".
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function useExercises(search: string, category: ExerciseCategory | 'todas'): Exercise[] {
  const exercises = useLiveQuery(async () => {
    const all = await db.exercises.orderBy('name').toArray()
    const term = normalize(search.trim())
    return all.filter((e) => {
      const matchesCategory = category === 'todas' || e.category === category
      const matchesSearch = !term || normalize(e.name).includes(term) || normalize(e.muscleGroup).includes(term)
      return matchesCategory && matchesSearch
    })
  }, [search, category])

  return exercises ?? []
}

export function useExercisesById(ids: number[]): Map<number, Exercise> {
  const exercises = useLiveQuery(async () => {
    if (ids.length === 0) return []
    return db.exercises.where('id').anyOf(ids).toArray()
  }, [ids.join(',')])

  const map = new Map<number, Exercise>()
  for (const e of exercises ?? []) map.set(e.id, e)
  return map
}
