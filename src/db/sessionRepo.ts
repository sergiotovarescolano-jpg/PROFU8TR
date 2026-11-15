import { db } from './db'
import { addPendingDelete } from '../utils/gcal/state'
import type { Session, SessionType } from '../types/models'

// Los ejercicios se copian de la rutina: retocar la sesión de un día no cambia la rutina base.
export async function createSession(params: {
  weekId: number
  dayIndex: number
  type: SessionType
  title: string
  startTime?: string
  sourceRoutineId?: number
  plannedExercises?: Session['plannedExercises']
}): Promise<number> {
  let plannedExercises = params.plannedExercises
  if (!plannedExercises && params.sourceRoutineId) {
    const routine = await db.routines.get(params.sourceRoutineId)
    plannedExercises = routine?.exercises
  }

  const now = new Date().toISOString()
  return db.sessions.add({
    weekId: params.weekId,
    dayIndex: params.dayIndex,
    type: params.type,
    title: params.title,
    startTime: params.startTime,
    sourceRoutineId: params.sourceRoutineId,
    plannedExercises: plannedExercises ?? [],
    doneExercises: [],
    status: 'planificada',
    pain: [],
    createdAt: now,
    updatedAt: now,
  })
}

// Cada cambio marca updatedAt: así la sincronización sabe que el evento de Google está desfasado.
export async function updateSession(id: number, changes: Partial<Session>): Promise<void> {
  await db.sessions.update(id, { ...changes, updatedAt: new Date().toISOString() })
}

export async function deleteSession(id: number): Promise<void> {
  const session = await db.sessions.get(id)
  if (session?.gcalEventId) addPendingDelete(session.gcalEventId)
  await db.sessions.delete(id)
}
