import Dexie, { type EntityTable } from 'dexie'
import type { Exercise, Match, Routine, Session, Week, WeekTemplate } from '../types/models'

class FutbolPlannerDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  routines!: EntityTable<Routine, 'id'>
  weeks!: EntityTable<Week, 'id'>
  sessions!: EntityTable<Session, 'id'>
  matches!: EntityTable<Match, 'id'>
  weekTemplates!: EntityTable<WeekTemplate, 'id'>

  constructor() {
    super('futbol-planner')
    this.version(1).stores({
      exercises: '++id, category, name',
      routines: '++id, name',
      weeks: '++id, &mondayISO',
      sessions: '++id, weekId, dayIndex, status',
      matches: '++id, weekId, date',
      weekTemplates: '++id, name',
    })
  }
}

export const db = new FutbolPlannerDB()
