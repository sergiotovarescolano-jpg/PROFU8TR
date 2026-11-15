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
        {exercises.length === 0 &&
          (search.trim() || category !== 'todas' ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <span className="text-5xl opacity-40" aria-hidden="true">
                🔎
              </span>
              <p className="font-hud text-xl font-bold text-white/70 uppercase">Nada por aquí</p>
              <p className="text-sm text-white/45">Prueba otra palabra o cambia de categoría.</p>
            </div>
          ) : (
            // Biblioteca vacía: la app ya no trae ejercicios de serie, cada uno añade los suyos.
            <div className="board-frame flex flex-col items-center gap-3 rounded-2xl px-5 py-8 text-center">
              <span className="emblem flex h-16 w-16 items-center justify-center rounded-full text-3xl" aria-hidden="true">
                🏋️
              </span>
              <p className="font-hud text-2xl font-extrabold text-white uppercase">Tu biblioteca, a tu manera</p>
              <p className="text-sm text-white/55">
                Añade los ejercicios que tú haces, con tu material y tus notas. Luego los usas en tus rutinas.
              </p>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="font-hud btn-neon btn-pulse mt-1 min-h-12 rounded-xl px-6 text-lg font-bold tracking-[0.08em] uppercase"
              >
                ＋ Crear mi primer ejercicio
              </button>
            </div>
          ))}
      </div>

      <button
        onClick={() => setCreating(true)}
        aria-label="Nuevo ejercicio"
        className="fixed right-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] flex h-14 w-14 items-center justify-center rounded-full btn-neon btn-pulse text-3xl font-bold active:scale-95"
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
