import type { ExerciseCategory } from '../types/models'

export const EXERCISE_CATEGORY_INFO: Record<ExerciseCategory, { label: string; icon: string }> = {
  fuerza: { label: 'Fuerza', icon: '💪' },
  velocidad: { label: 'Velocidad', icon: '⚡' },
  resistencia: { label: 'Resistencia', icon: '🫁' },
  tecnica: { label: 'Técnica', icon: '🎯' },
  movilidad: { label: 'Movilidad', icon: '🧘' },
  prevencion: { label: 'Prevención', icon: '🛡️' },
  core: { label: 'Core', icon: '🔥' },
}

export const EXERCISE_CATEGORY_OPTIONS = Object.entries(EXERCISE_CATEGORY_INFO).map(([value, info]) => ({
  value,
  label: `${info.icon} ${info.label}`,
}))
