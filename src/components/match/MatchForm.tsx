import { useState } from 'react'
import { Button } from '../ui/Button'
import { ConfirmButton } from '../ui/ConfirmButton'
import { Textarea } from '../ui/Field'
import { Modal } from '../ui/Modal'
import { NumberField } from '../ui/NumberField'
import { ScalePicker } from '../ui/ScalePicker'
import { calcMatchLoad } from '../../utils/loadCalc'
import type { Match } from '../../types/models'

export type MatchFormData = Pick<Match, 'minutesPlayed' | 'goalsFor' | 'goalsAgainst' | 'rpe' | 'rating' | 'goals' | 'assists' | 'notes'>

interface MatchFormProps {
  rival: string
  initial: Match | null
  onClose: () => void
  onSave: (data: MatchFormData) => void
  onDelete: () => void
}

export function MatchForm({ rival, initial, onClose, onSave, onDelete }: MatchFormProps) {
  const [minutes, setMinutes] = useState(initial?.minutesPlayed)
  const [goalsFor, setGoalsFor] = useState(initial?.goalsFor)
  const [goalsAgainst, setGoalsAgainst] = useState(initial?.goalsAgainst)
  const [rpe, setRpe] = useState<number | undefined>(initial?.rpe ?? 8)
  const [rating, setRating] = useState(initial?.rating)
  const [goals, setGoals] = useState<number | undefined>(initial?.goals)
  const [assists, setAssists] = useState<number | undefined>(initial?.assists)
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [error, setError] = useState('')

  function handleSave() {
    if (minutes === undefined) {
      setError('Indica los minutos jugados (0 si no has jugado).')
      return
    }
    onSave({
      minutesPlayed: minutes,
      goalsFor,
      goalsAgainst,
      rpe,
      rating,
      goals: goals ?? 0,
      assists: assists ?? 0,
      notes: notes.trim(),
    })
    onClose()
  }

  const load = minutes !== undefined ? calcMatchLoad({ minutesPlayed: minutes, rpe }) : 0

  return (
    <Modal open onClose={onClose} title={rival ? `Partido contra ${rival}` : 'Registrar partido'}>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <NumberField label="Minutos jugados" value={minutes} onChange={setMinutes} />
        <NumberField label="Goles tu equipo" value={goalsFor} onChange={setGoalsFor} />
        <NumberField label="Goles rival" value={goalsAgainst} onChange={setGoalsAgainst} />
        <NumberField label="Tus goles" value={goals} onChange={setGoals} />
        <NumberField label="Tus asistencias" value={assists} onChange={setAssists} />
      </div>
      {error && <p className="-mt-2 mb-3 text-sm text-red-300">{error}</p>}

      <ScalePicker label="RPE del partido" max={10} value={rpe} onChange={setRpe} hint="Con los minutos da la carga que suma a la semana." />

      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3">
        <span className="text-sm text-white/60">Carga del partido</span>
        <span className="font-condensed text-4xl leading-none font-extrabold text-pitch-400 tabular-nums">{load || '—'}</span>
      </div>

      <ScalePicker label="Tu valoración personal" max={10} value={rating} onChange={setRating} />
      <Textarea label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Qué ha ido bien, qué mejorar…" />

      <div className="mt-2 flex gap-2">
        {initial && (
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
