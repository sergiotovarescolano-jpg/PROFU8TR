import { useState } from 'react'
import { useExercises } from '../hooks/useExercises'
import { ExerciseCard } from '../components/exercises/ExerciseCard'
import { ExerciseFilters, type CategoryFilter } from '../components/exercises/ExerciseFilters'
import { ExerciseForm } from '../components/exercises/ExerciseForm'
import { CountBadge, PageHeader } from '../components/ui/PageHeader'
import { createExercise, deleteExercise, updateExercise } from '../db/exerciseRepo'
import type { Exercise } from '../types/models'
import { EXERCISE_CATEGORY_INFO } from '../utils/exerciseCategoryInfo'

export function ExercisesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('todas')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)

  const exercises = useExercises(search, category)
  const categoryLabel = search.trim()
    ? exercises.length === 1
      ? 'encontrado'
      : 'encontrados'
    : category === 'todas'
      ? 'en total'
      : `de ${EXERCISE_CATEGORY_INFO[category].label.toLowerCase()}`

  return (
    <div className="p-4 pb-28">
      <PageHeader kicker="Biblioteca" title="Ejercicios" aside={<CountBadge value={exercises.length} label={categoryLabel} />} />

      <ExerciseFilters search={search} onSearchChange={setSearch} category={category} onCategoryChange={setCategory} />

      {/* La clave por categoría reinicia la entrada escalonada al cambiar de filtro */}
      <div key={category} className="space-y-3">
        {exercises.map((ex, i) => (
          <ExerciseCard key={ex.id} exercise={ex} index={i} onEdit={() => setEditing(ex)} />
        ))}
        {exercises.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="text-5xl opacity-40" aria-hidden="true">
              🔎
            </span>
            <p className="font-condensed text-xl font-bold text-white/70 uppercase">Nada por aquí</p>
            <p className="text-sm text-white/45">Prueba otra palabra o cambia de categoría.</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setCreating(true)}
        aria-label="Nuevo ejercicio"
        className="fixed right-4 bottom-24 flex h-14 w-14 items-center justify-center rounded-full border border-pitch-700/60 bg-gradient-to-b from-pitch-400 to-pitch-600 text-3xl font-bold text-white shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_10px_24px_-6px_rgba(42,161,74,0.65)] transition-transform active:translate-y-px active:scale-95"
      >
        +
      </button>

      {creating && <ExerciseForm open onClose={() => setCreating(false)} onSave={(data) => createExercise(data)} />}

      {editing && (
        <ExerciseForm
          key={editing.id}
          open
          onClose={() => setEditing(null)}
          initial={editing}
          onSave={(data) => updateExercise(editing.id, data)}
          onDelete={() => deleteExercise(editing.id)}
        />
      )}
    </div>
  )
}
