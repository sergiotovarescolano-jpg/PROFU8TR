import { format } from 'date-fns'
import { db } from '../db/db'
import type {
  Exercise,
  ExerciseCategory,
  ExerciseTier,
  Match,
  Routine,
  RoutineExercise,
  Session,
  SessionStatus,
  SessionType,
  Week,
  WeekTemplate,
} from '../types/models'

const APP_ID = 'futbol-planner'
const SCHEMA_VERSION = 1
const LAST_EXPORT_KEY = 'futbol-planner:last-export'

export interface BackupData {
  exercises: Exercise[]
  routines: Routine[]
  weeks: Week[]
  sessions: Session[]
  matches: Match[]
  weekTemplates: WeekTemplate[]
}

export interface BackupFile {
  app: typeof APP_ID
  schemaVersion: number
  exportedAt: string
  data: BackupData
}

export async function buildBackup(): Promise<BackupFile> {
  const [exercises, routines, weeks, sessions, matches, weekTemplates] = await Promise.all([
    db.exercises.toArray(),
    db.routines.toArray(),
    db.weeks.toArray(),
    db.sessions.toArray(),
    db.matches.toArray(),
    db.weekTemplates.toArray(),
  ])
  return {
    app: APP_ID,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: { exercises, routines, weeks, sessions, matches, weekTemplates },
  }
}

export async function downloadBackup(): Promise<void> {
  const backup = await buildBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `futbol-planner-${format(new Date(), 'yyyy-MM-dd')}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Safari descarga de forma asíncrona: revocar en el acto puede cancelar la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  try {
    localStorage.setItem(LAST_EXPORT_KEY, backup.exportedAt)
  } catch {
    // Sin localStorage (modo privado) solo se pierde el recordatorio del último backup.
  }
}

export function getLastExportDate(): string | null {
  try {
    return localStorage.getItem(LAST_EXPORT_KEY)
  } catch {
    return null
  }
}

// --- Importación: el archivo es entrada externa, así que se valida y normaliza fila a fila. ---

class BackupError extends Error {}

type Raw = Record<string, unknown>

const CATEGORIES: ExerciseCategory[] = ['fuerza', 'velocidad', 'resistencia', 'tecnica', 'movilidad', 'prevencion', 'core']
const SESSION_TYPES: SessionType[] = ['entreno_equipo', 'gimnasio', 'carrera', 'movilidad', 'descanso']
const STATUSES: SessionStatus[] = ['planificada', 'hecha', 'saltada']
const MD_TAGS = ['MD-4', 'MD-3', 'MD-2', 'MD-1', 'MD', 'MD+1', 'MD+2'] as const
const TIERS: readonly ExerciseTier[] = ['main', 'secondary', 'accessory']

function isObject(v: unknown): v is Raw {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}
function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}
function id(row: Raw, table: string): number {
  const value = num(row.id)
  if (value === undefined || !Number.isInteger(value) || value <= 0) throw new BackupError(`Hay un registro sin id válido en "${table}".`)
  return value
}
function isoDate(v: unknown, table: string): string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new BackupError(`Hay una fecha no válida en "${table}".`)
  return v
}

function exerciseList(v: unknown) {
  return arr(v)
    .filter(isObject)
    .filter((e) => num(e.exerciseId) !== undefined)
    .map(
      (e, i): RoutineExercise => ({
        exerciseId: num(e.exerciseId)!,
        order: i,
        tier: TIERS.includes(e.tier as ExerciseTier) ? (e.tier as ExerciseTier) : undefined,
        sets: num(e.sets),
        reps: num(e.reps),
        durationSec: num(e.durationSec),
        weightKg: num(e.weightKg),
        restSec: num(e.restSec),
        notes: typeof e.notes === 'string' ? e.notes : undefined,
      }),
    )
}

function normalize(data: Raw): BackupData {
  const rows = (table: string) => {
    if (!Array.isArray(data[table])) throw new BackupError(`Falta la tabla "${table}" en el archivo.`)
    return (data[table] as unknown[]).filter(isObject)
  }

  return {
    exercises: rows('exercises').map((e) => ({
      id: id(e, 'exercises'),
      name: str(e.name, 'Sin nombre'),
      category: oneOf(e.category, CATEGORIES, 'fuerza'),
      muscleGroup: str(e.muscleGroup),
      equipment: str(e.equipment),
      description: str(e.description),
      notes: str(e.notes),
      videoUrl: typeof e.videoUrl === 'string' && /^https?:\/\//i.test(e.videoUrl) ? e.videoUrl : undefined,
      createdAt: str(e.createdAt, new Date().toISOString()),
    })),
    routines: rows('routines').map((r) => ({
      id: id(r, 'routines'),
      name: str(r.name, 'Rutina'),
      suggestedTag: MD_TAGS.includes(r.suggestedTag as (typeof MD_TAGS)[number]) ? (r.suggestedTag as (typeof MD_TAGS)[number]) : undefined,
      sessionType: SESSION_TYPES.includes(r.sessionType as SessionType) ? (r.sessionType as SessionType) : undefined,
      exercises: exerciseList(r.exercises),
      createdAt: str(r.createdAt, new Date().toISOString()),
    })),
    weeks: rows('weeks').map((w) => {
      const md = isObject(w.matchDay) ? w.matchDay : null
      const dayIndex = md ? num(md.dayIndex) : undefined
      return {
        id: id(w, 'weeks'),
        mondayISO: isoDate(w.mondayISO, 'weeks'),
        matchDay:
          md && dayIndex !== undefined && dayIndex >= 0 && dayIndex <= 6
            ? { dayIndex, rival: str(md.rival), time: str(md.time), homeAway: oneOf(md.homeAway, ['casa', 'fuera'], 'casa') }
            : null,
        isNoMatchWeek: w.isNoMatchWeek === true,
      }
    }),
    sessions: rows('sessions').map((s) => ({
      id: id(s, 'sessions'),
      weekId: num(s.weekId) ?? 0,
      dayIndex: Math.min(6, Math.max(0, num(s.dayIndex) ?? 0)),
      type: oneOf(s.type, SESSION_TYPES, 'gimnasio'),
      title: str(s.title, 'Sesión'),
      sourceRoutineId: num(s.sourceRoutineId),
      plannedExercises: exerciseList(s.plannedExercises),
      doneExercises: arr(s.doneExercises)
        .filter(isObject)
        .filter((d) => num(d.exerciseId) !== undefined)
        .map((d) => ({
          exerciseId: num(d.exerciseId)!,
          occurrence: num(d.occurrence) ?? 0,
          setsDone: num(d.setsDone),
          repsDone: num(d.repsDone),
          weightUsedKg: num(d.weightUsedKg),
          timeUsedSec: num(d.timeUsedSec),
          notes: typeof d.notes === 'string' ? d.notes : undefined,
        })),
      status: oneOf(s.status, STATUSES, 'planificada'),
      rpe: num(s.rpe),
      durationMin: num(s.durationMin),
      feeling: typeof s.feeling === 'string' ? s.feeling : undefined,
      fatigue: num(s.fatigue),
      pain: arr(s.pain)
        .filter(isObject)
        .map((p) => ({ zone: str(p.zone), intensity: num(p.intensity) ?? 1 }))
        .filter((p) => p.zone !== ''),
      loadScore: num(s.loadScore),
      startTime: typeof s.startTime === 'string' && /^\d{2}:\d{2}$/.test(s.startTime) ? s.startTime : undefined,
      createdAt: str(s.createdAt, new Date().toISOString()),
      updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : undefined,
      // El enlace con Google se conserva: al restaurar en otro móvil, las sesiones siguen ligadas a sus eventos.
      gcalEventId: typeof s.gcalEventId === 'string' ? s.gcalEventId : undefined,
      gcalSyncedAt: typeof s.gcalSyncedAt === 'string' ? s.gcalSyncedAt : undefined,
      gcalRemoteUpdated: typeof s.gcalRemoteUpdated === 'string' ? s.gcalRemoteUpdated : undefined,
    })),
    matches: rows('matches').map((m) => ({
      id: id(m, 'matches'),
      weekId: num(m.weekId) ?? 0,
      date: isoDate(m.date, 'matches'),
      rival: str(m.rival),
      homeAway: oneOf(m.homeAway, ['casa', 'fuera'], 'casa'),
      minutesPlayed: num(m.minutesPlayed) ?? 0,
      goalsFor: num(m.goalsFor),
      goalsAgainst: num(m.goalsAgainst),
      rpe: num(m.rpe),
      rating: num(m.rating),
      goals: num(m.goals) ?? 0,
      assists: num(m.assists) ?? 0,
      notes: str(m.notes),
      createdAt: str(m.createdAt, new Date().toISOString()),
    })),
    weekTemplates: rows('weekTemplates').map((t) => ({
      id: id(t, 'weekTemplates'),
      name: str(t.name, 'Plantilla'),
      days: arr(t.days)
        .filter(isObject)
        .map((d) => ({
          dayIndex: Math.min(6, Math.max(0, num(d.dayIndex) ?? 0)),
          sessionType: oneOf(d.sessionType, SESSION_TYPES, 'gimnasio'),
          title: str(d.title, 'Sesión'),
          routineId: num(d.routineId),
          plannedExercises: exerciseList(d.plannedExercises),
        })),
      createdAt: str(t.createdAt, new Date().toISOString()),
    })),
  }
}

/** Lee y valida un archivo de backup. Lanza un Error con un mensaje en español si no es válido. */
export function parseBackup(text: string): BackupFile {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }
  if (!isObject(parsed) || parsed.app !== APP_ID || !isObject(parsed.data)) {
    throw new Error('Este archivo no es un backup de Fútbol Planner.')
  }
  if (typeof parsed.schemaVersion !== 'number' || parsed.schemaVersion > SCHEMA_VERSION) {
    throw new Error('El backup es de una versión más nueva de la app. Actualiza la app e inténtalo otra vez.')
  }
  try {
    return { app: APP_ID, schemaVersion: SCHEMA_VERSION, exportedAt: str(parsed.exportedAt), data: normalize(parsed.data) }
  } catch (e) {
    if (e instanceof BackupError) throw new Error(e.message)
    throw e
  }
}

const ALL_TABLES = [db.exercises, db.routines, db.weeks, db.sessions, db.matches, db.weekTemplates]

/** Sustituye todos los datos por los del backup, todo o nada. */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  const { data } = backup
  try {
    await db.transaction('rw', ALL_TABLES, async () => {
      await Promise.all(ALL_TABLES.map((t) => t.clear()))
      await db.exercises.bulkAdd(data.exercises)
      await db.routines.bulkAdd(data.routines)
      await db.weeks.bulkAdd(data.weeks)
      await db.sessions.bulkAdd(data.sessions)
      await db.matches.bulkAdd(data.matches)
      await db.weekTemplates.bulkAdd(data.weekTemplates)
    })
  } catch {
    // La transacción se deshace entera: los datos que había siguen intactos.
    throw new Error('No se pudo importar: el archivo tiene datos repetidos o incoherentes. Tus datos actuales no se han tocado.')
  }
}

/** Borra todo, incluidos los ejercicios: la app queda vacía, como recién instalada. */
export async function resetAllData(): Promise<void> {
  await db.transaction('rw', ALL_TABLES, async () => {
    await Promise.all(ALL_TABLES.map((t) => t.clear()))
  })
}
