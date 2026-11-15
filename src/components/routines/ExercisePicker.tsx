import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { ExerciseForm } from '../exercises/ExerciseForm'
import { ExerciseRow } from '../exercises/ExerciseRow'
import { ExerciseFilters, type CategoryFilter } from '../exercises/ExerciseFilters'
import { createExercise } from '../../db/exerciseRepo'
import { useExercises } from '../../hooks/useExercises'
import type { Exercise } from '../../types/models'

interface ExercisePickerProps {
  title?: string
  onClose: () => void
  onPick: (exercise: Exercise) => void
}

export function ExercisePicker({ title = 'Añadir ejercicio', onClose, onPick }: ExercisePickerProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('todas')
  const [creating, setCreating] = useState(false)
  const exercises = useExercises(search, category)

  function pickAndClose(exercise: Exercise) {
    onPick(exercise)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={title}>
      {/* La biblioteca empieza vacía: se puede crear el ejercicio aquí mismo y entra directo */}
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="font-hud mb-3 flex min-h-12 w-full items-center justify-center gap-2 btn-neon btn-pulse rounded-xl text-lg font-bold tracking-[0.08em] uppercase"
      >
        <span aria-hidden="true">＋</span> Crear ejercicio nuevo{search.trim() && `: «${search.trim()}»`}
      </button>

      <ExerciseFilters search={search} onSearchChange={setSearch} category={category} onCategoryChange={setCategory} />
      <div className="space-y-2">
        {exercises.map((ex) => (
          <ExerciseRow key={ex.id} exercise={ex} onClick={() => pickAndClose(ex)} />
        ))}
        {exercises.length === 0 && (
          <p className="py-6 text-center text-sm text-white/45">
            {search.trim() || category !== 'todas'
              ? 'No hay ejercicios con esos filtros. Créalo con el botón de arriba.'
              : 'Tu biblioteca está vacía. Crea tu primer ejercicio con el botón de arriba.'}
          </p>
        )}
      </div>

      {creating && (
        <ExerciseForm
          open
          defaultName={search.trim()}
          onClose={() => setCreating(false)}
          onSave={async (data) => {
            const id = await createExercise(data)
            pickAndClose({ ...data, id, createdAt: new Date().toISOString() })
          }}
        />
      )}
    </Modal>
  )
}
