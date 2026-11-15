import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { ExerciseRow } from '../exercises/ExerciseRow'
import { ExerciseFilters, type CategoryFilter } from '../exercises/ExerciseFilters'
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
  const exercises = useExercises(search, category)

  return (
    <Modal open onClose={onClose} title={title}>
      <ExerciseFilters search={search} onSearchChange={setSearch} category={category} onCategoryChange={setCategory} />
      <div className="space-y-2">
        {exercises.map((ex) => (
          <ExerciseRow
            key={ex.id}
            exercise={ex}
            onClick={() => {
              onPick(ex)
              onClose()
            }}
          />
        ))}
        {exercises.length === 0 && <p className="py-8 text-center text-sm text-white/40">No hay ejercicios con esos filtros.</p>}
      </div>
    </Modal>
  )
}
