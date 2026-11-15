import { useState, type CSSProperties } from 'react'
import { EXERCISE_CATEGORY_INFO } from '../../utils/exerciseCategoryInfo'
import type { Exercise } from '../../types/models'
import './library.css'

interface ExerciseCardProps {
  exercise: Exercise
  index: number // para escalonar la animación de entrada
  onEdit: () => void
}

function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v4.5h-4.5" />
    </svg>
  )
}

/** Tarjeta de ejercicio: al tocarla gira en 3D y muestra los detalles por detrás. */
export function ExerciseCard({ exercise, index, onEdit }: ExerciseCardProps) {
  const [flipped, setFlipped] = useState(false)
  const info = EXERCISE_CATEGORY_INFO[exercise.category]
  const hasDetails = Boolean(exercise.description || exercise.notes || exercise.videoUrl)
  // "Ninguno" no aporta nada en la tarjeta: solo se muestra el material cuando hace falta alguno.
  const equipment = exercise.equipment && !/^ningun/i.test(exercise.equipment.trim()) ? exercise.equipment : null

  return (
    <div className="flip-card lib-enter" data-flipped={flipped} style={{ '--i': index } as CSSProperties}>
      <div className="flip-inner">
        {/* Delante */}
        <button
          type="button"
          className="flip-face exercise-front flex w-full flex-col p-4 pl-5 text-left"
          onClick={() => setFlipped(true)}
          aria-label={`${exercise.name}. Ver detalles`}
          inert={flipped}
        >
          <span className="watermark" aria-hidden="true">
            {info.icon}
          </span>

          <div className="flex items-center gap-3">
            <span className="emblem flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl" aria-hidden="true">
              {info.icon}
            </span>
            <span className="font-hud text-sm font-bold tracking-[0.18em] text-neon-300 uppercase">{info.label}</span>
          </div>

          <p className="font-hud mt-2 line-clamp-2 text-[1.75rem] leading-[1.05] font-bold text-white uppercase">{exercise.name}</p>
          {exercise.description && <p className="mt-1 line-clamp-1 pr-8 text-sm text-white/50">{exercise.description}</p>}

          <div className="mt-auto flex items-end justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {exercise.muscleGroup && (
                <span className="truncate rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium text-white/80">{exercise.muscleGroup}</span>
              )}
              {equipment && (
                <span className="truncate rounded-full border border-neon-400/30 px-2.5 py-1 text-xs text-neon-200">{equipment}</span>
              )}
            </div>
            <span className="flip-hint flex shrink-0 items-center gap-1 text-xs font-semibold text-neon-300">
              <FlipIcon /> Detalles
            </span>
          </div>
        </button>

        {/* Detrás: tocar el fondo vuelve a girarla */}
        <div className="flip-face flip-back exercise-back flex flex-col p-4" onClick={() => setFlipped(false)} inert={!flipped}>
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">
              {info.icon}
            </span>
            <p className="font-hud truncate text-lg font-bold text-neon-200 uppercase">{exercise.name}</p>
          </div>

          <div className="mt-1.5 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 text-sm" onClick={(e) => e.stopPropagation()}>
            {exercise.description && <p className="leading-snug text-white/80">{exercise.description}</p>}
            {exercise.notes && (
              <p className="rounded-lg border-l-2 border-neon-400 bg-neon-400/10 px-2.5 py-1.5 text-white/75">
                <span className="font-semibold text-neon-200">Nota: </span>
                {exercise.notes}
              </p>
            )}
            {!hasDetails && <p className="text-white/45">Sin descripción todavía. Pulsa «Editar» para añadir cómo se hace o un vídeo.</p>}
          </div>

          <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {exercise.videoUrl && (
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-10 items-center gap-1.5 rounded-full bg-white/10 px-3 text-sm font-semibold text-white active:scale-95"
              >
                <span aria-hidden="true">▶</span> Vídeo
              </a>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="flex min-h-10 items-center rounded-full border border-neon-400/60 px-4 text-sm font-semibold text-neon-200 active:scale-95"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              className="flip-hint ml-auto flex min-h-10 items-center gap-1 px-2 text-sm font-semibold text-white/60"
            >
              <FlipIcon /> Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
