import { EXERCISE_CATEGORY_INFO } from '../../utils/exerciseCategoryInfo'
import type { Exercise } from '../../types/models'
import './library.css'

interface ExerciseRowProps {
  exercise: Exercise
  onClick: () => void
}

/** Fila compacta para elegir un ejercicio (selector de rutinas): un toque y listo, sin giro. */
export function ExerciseRow({ exercise, onClick }: ExerciseRowProps) {
  const info = EXERCISE_CATEGORY_INFO[exercise.category]
  return (
    <button
      type="button"
      onClick={onClick}
      className="exercise-front relative flex w-full items-center gap-3 rounded-2xl p-3 pl-4 text-left transition-transform active:scale-[0.98]"
    >
      <span className="emblem flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl" aria-hidden="true">
        {info.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-condensed block truncate text-xl leading-tight font-bold text-white uppercase">{exercise.name}</span>
        <span className="block truncate text-xs text-white/55">
          <span className="text-gold-300">{info.label}</span>
          {exercise.muscleGroup && ` · ${exercise.muscleGroup}`}
        </span>
      </span>
      <span className="font-condensed shrink-0 text-2xl font-bold text-gold-300" aria-hidden="true">
        +
      </span>
    </button>
  )
}
