import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ConfirmButton } from '../ui/ConfirmButton'
import { Input, Select } from '../ui/Field'
import { ExerciseListEditor } from '../routines/ExerciseListEditor'
import { useRoutines } from '../../hooks/useRoutines'
import { SESSION_TYPE_INFO } from '../../utils/sessionTypeInfo'
import { DayTypePicker } from './DayTypePicker'
import type { RoutineExercise, Session, SessionType } from '../../types/models'

export interface SessionFormData {
  type: SessionType
  title: string
  startTime?: string
  sourceRoutineId?: number
  plannedExercises: RoutineExercise[]
  saveToRoutine: boolean
}

interface SessionFormModalProps {
  onClose: () => void
  initial?: Session
  onSave: (data: SessionFormData) => void
  onDelete?: () => void
}

export function SessionFormModal({ onClose, initial, onSave, onDelete }: SessionFormModalProps) {
  const routines = useRoutines()
  const [type, setType] = useState<SessionType>(initial?.type ?? 'gimnasio')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [startTime, setStartTime] = useState(initial?.startTime ?? '')
  const [touchedTitle, setTouchedTitle] = useState(Boolean(initial?.title))
  const [routineId, setRoutineId] = useState<number | undefined>(initial?.sourceRoutineId)
  const [exercises, setExercises] = useState<RoutineExercise[]>(initial?.plannedExercises ?? [])
  const [saveToRoutine, setSaveToRoutine] = useState(false)
  // Sube al cambiar de rutina: las filas del editor guardan su texto y deben recrearse.
  const [editorVersion, setEditorVersion] = useState(0)

  const sourceRoutine = routines.find((r) => r.id === routineId)
  const isRest = type === 'descanso'

  function handleRoutineChange(value: string) {
    const routine = routines.find((r) => r.id === Number(value))
    setRoutineId(routine?.id)
    if (!routine) return
    setExercises(routine.exercises)
    setEditorVersion((v) => v + 1)
    if (routine.sessionType) setType(routine.sessionType)
    if (!touchedTitle) setTitle(routine.name)
  }

  function handleSave() {
    onSave({
      type,
      title: title.trim() || sourceRoutine?.name || SESSION_TYPE_INFO[type].label,
      startTime: startTime || undefined,
      sourceRoutineId: sourceRoutine?.id,
      plannedExercises: isRest ? [] : exercises,
      saveToRoutine: saveToRoutine && !isRest && exercises.length > 0,
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={initial ? 'Editar sesión' : 'Nueva sesión'}>
      <div className="mb-4">
        <DayTypePicker label="Tipo de sesión" withMatch={false} selected={type} onPick={(choice) => setType(choice as SessionType)} />
      </div>
      <Input
        label="Título"
        placeholder={sourceRoutine?.name ?? SESSION_TYPE_INFO[type].label}
        value={title}
        onChange={(e) => {
          setTouchedTitle(true)
          setTitle(e.target.value)
        }}
      />
      {!isRest && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input label="Hora (opcional)" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          {startTime && (
            <button
              type="button"
              onClick={() => setStartTime('')}
              className="font-hud mb-3 min-h-12 rounded-xl px-3 text-base font-bold text-white/55 uppercase active:bg-white/10"
            >
              Sin hora
            </button>
          )}
        </div>
      )}

      {!isRest && (
        <>
          <Select
            label="Partir de una rutina"
            value={sourceRoutine ? String(sourceRoutine.id) : ''}
            onChange={(e) => handleRoutineChange(e.target.value)}
            options={[
              { value: '', label: 'Sin rutina' },
              ...routines.map((r) => ({ value: String(r.id), label: r.name })),
            ]}
          />

          <h3 className="font-hud mt-4 mb-2 text-xl font-bold tracking-wide text-white uppercase">Ejercicios de este día</h3>
          <ExerciseListEditor key={editorVersion} grouped={type === 'gimnasio'} items={exercises} onChange={setExercises} />

          {exercises.length > 0 && (
            <label className="mt-3 flex min-h-10 items-center gap-3 text-sm text-white/70">
              <input
                type="checkbox"
                checked={saveToRoutine}
                onChange={(e) => setSaveToRoutine(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-[var(--color-neon-400)]"
              />
              {sourceRoutine
                ? `Guardar estos cambios también en la rutina "${sourceRoutine.name}"`
                : 'Guardar también como rutina nueva'}
            </label>
          )}
        </>
      )}

      <div className="mt-4 flex gap-2">
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
