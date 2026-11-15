import Dexie, { type EntityTable } from 'dexie'
import type { Exercise, Match, Routine, Session, Week, WeekTemplate } from '../types/models'

// Ejercicios que la app traía de serie hasta que el usuario pidió empezar con la biblioteca vacía.
// Solo se usan en la migración a la versión 2 para reconocerlos y quitarlos.
const LEGACY_SEED_NAMES = new Set([
  'Sentadilla trasera', 'Peso muerto rumano', 'Press de banca', 'Zancada búlgara', 'Hip thrust', 'Press militar',
  'Sprint 20m', 'Sprint 40m', 'Skipping alto', 'ABC de carrera', 'Arrancadas', 'Sprints en cuesta',
  'Carrera continua', 'Series 400m', 'Fartlek', 'Bicicleta estática', 'Circuito aeróbico con balón', 'Carrera en umbral',
  'Rondos', 'Control y pase', 'Remate a portería', 'Conducción con cambios de ritmo', 'Centros y finalización',
  'Posesión en espacio reducido', 'Movilidad de cadera', 'Movilidad de tobillo', 'Estiramientos dinámicos', 'Foam roller',
  'Movilidad torácica', 'Flexibilidad general', 'Nórdicos', 'Copenhague (plancha aductores)', 'Estabilidad de tobillo',
  'Core lumbar', 'Propiocepción en superficie inestable', 'Fortalecimiento de hombro', 'Activación de glúteo medio',
  'Plancha frontal', 'Plancha lateral', 'Dead bug', 'Pallof press', 'Russian twist', 'Elevación de piernas colgado',
])

class FutbolPlannerDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  routines!: EntityTable<Routine, 'id'>
  weeks!: EntityTable<Week, 'id'>
  sessions!: EntityTable<Session, 'id'>
  matches!: EntityTable<Match, 'id'>
  weekTemplates!: EntityTable<WeekTemplate, 'id'>

  constructor() {
    super('futbol-planner')
    const stores = {
      exercises: '++id, category, name',
      routines: '++id, name',
      weeks: '++id, &mondayISO',
      sessions: '++id, weekId, dayIndex, status',
      matches: '++id, weekId, date',
      weekTemplates: '++id, name',
    }
    this.version(1).stores(stores)

    // v2: la biblioteca empieza vacía. Se quitan los ejercicios de serie, pero solo los que
    // ninguna rutina, sesión o plantilla usa: así nunca se rompe nada que haya creado el usuario.
    this.version(2)
      .stores(stores)
      .upgrade(async (tx) => {
        const [routines, sessions, templates] = await Promise.all([
          tx.table<Routine>('routines').toArray(),
          tx.table<Session>('sessions').toArray(),
          tx.table<WeekTemplate>('weekTemplates').toArray(),
        ])
        const used = new Set<number>([
          ...routines.flatMap((r) => r.exercises.map((e) => e.exerciseId)),
          ...sessions.flatMap((s) => [...s.plannedExercises, ...s.doneExercises].map((e) => e.exerciseId)),
          ...templates.flatMap((t) => t.days.flatMap((d) => d.plannedExercises.map((e) => e.exerciseId))),
        ])
        await tx
          .table<Exercise>('exercises')
          .filter((e) => LEGACY_SEED_NAMES.has(e.name) && !used.has(e.id))
          .delete()
      })
  }
}

export const db = new FutbolPlannerDB()
