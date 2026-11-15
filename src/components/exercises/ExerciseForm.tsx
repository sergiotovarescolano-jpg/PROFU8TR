import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ConfirmButton } from '../ui/ConfirmButton'
import { Input, Select, Textarea } from '../ui/Field'
import { EXERCISE_CATEGORY_OPTIONS } from '../../utils/exerciseCategoryInfo'
import type { Exercise, ExerciseCategory } from '../../types/models'

interface ExerciseFormProps {
  open: boolean
  onClose: () => void
  initial?: Exercise
  onSave: (data: Omit<Exercise, 'id' | 'createdAt'>) => void
  onDelete?: () => void
}

// Solo http(s): el enlace puede venir de un backup importado y no debe ejecutar nada.
function isSafeLink(url: string): boolean {
  return /^https?:\/\//i.test(url.trim())
}

export function ExerciseForm({ open, onClose, initial, onSave, onDelete }: ExerciseFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<ExerciseCategory>(initial?.category ?? 'fuerza')
  const [muscleGroup, setMuscleGroup] = useState(initial?.muscleGroup ?? '')
  const [equipment, setEquipment] = useState(initial?.equipment ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? '')
  const [error, setError] = useState('')

  function handleSave() {
    if (!name.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    onSave({
      name: name.trim(),
      category,
      muscleGroup: muscleGroup.trim(),
      equipment: equipment.trim(),
      description: description.trim(),
      notes: notes.trim(),
      videoUrl: videoUrl.trim() || undefined,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar ejercicio' : 'Nuevo ejercicio'}>
      <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Sentadilla trasera" />
      {error && <p className="-mt-2 mb-3 text-sm text-red-300">{error}</p>}
      <Select
        label="Categoría"
        value={category}
        onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
        options={EXERCISE_CATEGORY_OPTIONS}
      />
      <Input label="Grupo muscular" value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)} placeholder="Ej. Cuádriceps, glúteo" />
      <Input label="Material" value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Ej. Barra, rack" />
      <Textarea label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cómo se ejecuta" />
      <Textarea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas personales" />
      <Input
        label="Vídeo (YouTube, opcional)"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="https://youtube.com/..."
      />
      {isSafeLink(videoUrl) && (
        <a
          href={videoUrl.trim()}
          target="_blank"
          rel="noopener noreferrer"
          className="-mt-1 mb-3 block text-sm font-medium text-gold-300"
        >
          ▶ Ver vídeo
        </a>
      )}
      <div className="mt-2 flex gap-2">
        {onDelete && (
          <ConfirmButton
            onConfirm={() => {
              onDelete()
              onClose()
            }}
          >
            Eliminar
          </ConfirmButton>
        )}
        <Button fullWidth onClick={handleSave}>
          Guardar
        </Button>
      </div>
    </Modal>
  )
}
