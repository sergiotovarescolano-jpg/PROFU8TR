// Tipos de dominio compartidos por toda la app. Las fechas se guardan como
// string ISO (YYYY-MM-DD) para que sean comparables, ordenables y serializables sin líos de zona horaria.

export type ExerciseCategory =
  | 'fuerza'
  | 'velocidad'
  | 'resistencia'
  | 'tecnica'
  | 'movilidad'
  | 'prevencion'
  | 'core'

export interface Exercise {
  id: number
  name: string
  category: ExerciseCategory
  muscleGroup: string
  equipment: string
  description: string
  notes: string
  videoUrl?: string
  createdAt: string
}

// Nivel del ejercicio dentro de una sesión de gimnasio: básico pesado, complementario o accesorio.
export type ExerciseTier = 'main' | 'secondary' | 'accessory'

export interface RoutineExercise {
  exerciseId: number
  order: number
  tier?: ExerciseTier // sin valor = accesorio
  sets?: number
  reps?: number
  durationSec?: number
  weightKg?: number
  restSec?: number
  notes?: string
}

export interface Routine {
  id: number
  name: string
  suggestedTag?: MdTag
  sessionType?: SessionType
  exercises: RoutineExercise[]
  createdAt: string
}

// Offset respecto al día de partido (Match Day)
export type MdTag = 'MD-4' | 'MD-3' | 'MD-2' | 'MD-1' | 'MD' | 'MD+1' | 'MD+2'

export interface MatchDayInfo {
  dayIndex: number // 0 = lunes ... 6 = domingo
  rival: string
  time: string // 'HH:mm'
  homeAway: 'casa' | 'fuera'
}

export interface Week {
  id: number
  mondayISO: string // lunes de esa semana, 'YYYY-MM-DD'
  matchDay: MatchDayInfo | null
  isNoMatchWeek: boolean
}

export type SessionType =
  | 'entreno_equipo'
  | 'gimnasio'
  | 'carrera'
  | 'movilidad'
  | 'descanso'

export type SessionStatus = 'planificada' | 'hecha' | 'saltada'

export interface SessionExercisePlanned {
  exerciseId: number
  order: number
  tier?: ExerciseTier
  sets?: number
  reps?: number
  durationSec?: number
  weightKg?: number
  restSec?: number
  notes?: string
}

export interface SessionExerciseDone {
  exerciseId: number
  occurrence: number // 0 = primera vez que aparece en la sesión; distingue un ejercicio repetido
  setsDone?: number
  repsDone?: number
  weightUsedKg?: number
  timeUsedSec?: number
  notes?: string
}

export interface PainEntry {
  zone: string
  intensity: number // 1-10
}

export interface Session {
  id: number
  weekId: number
  dayIndex: number // 0-6
  type: SessionType
  title: string
  sourceRoutineId?: number
  plannedExercises: SessionExercisePlanned[]
  doneExercises: SessionExerciseDone[]
  status: SessionStatus
  rpe?: number // 1-10
  durationMin?: number
  feeling?: string
  fatigue?: number // 1-5
  pain: PainEntry[]
  loadScore?: number // rpe * durationMin
  startTime?: string // 'HH:mm'; sin hora = evento de día completo en Google Calendar
  createdAt: string
  updatedAt?: string // ISO, reloj del móvil; lo usa la sincronización para saber qué cambió en la app
  gcalEventId?: string // evento enlazado en el calendario "Fútbol Planner"
  gcalSyncedAt?: string // ISO, reloj del móvil: última vez que app y evento quedaron iguales
  gcalRemoteUpdated?: string // campo `updated` del evento (reloj de Google) en esa misma sincronización
}

export interface Match {
  id: number
  weekId: number
  date: string // 'YYYY-MM-DD'
  rival: string
  homeAway: 'casa' | 'fuera'
  minutesPlayed: number
  goalsFor?: number
  goalsAgainst?: number
  rpe?: number // 1-10, junto con los minutos da la carga del partido
  rating?: number // 1-10
  goals: number
  assists: number
  notes: string
  createdAt: string
}

export interface WeekTemplateDay {
  dayIndex: number
  sessionType: SessionType
  title: string
  routineId?: number
  plannedExercises: SessionExercisePlanned[]
}

export interface WeekTemplate {
  id: number
  name: string
  days: WeekTemplateDay[]
  createdAt: string
}
