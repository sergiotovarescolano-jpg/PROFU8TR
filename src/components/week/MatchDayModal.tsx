import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ConfirmButton } from '../ui/ConfirmButton'
import { Input, Select } from '../ui/Field'
import { DAY_NAMES_ES } from '../../utils/dateUtils'
import type { MatchDayInfo } from '../../types/models'

interface MatchDayModalProps {
  open: boolean
  onClose: () => void
  initialDayIndex: number
  initial: MatchDayInfo | null
  hasMatchRecord: boolean
  onSave: (info: MatchDayInfo) => void
  onClear: () => void
}

export function MatchDayModal({ open, onClose, initialDayIndex, initial, hasMatchRecord, onSave, onClear }: MatchDayModalProps) {
  // Manda el día pulsado, no el guardado: así "Marcar partido" en otro día mueve el partido.
  const [dayIndex, setDayIndex] = useState(initialDayIndex)
  const [rival, setRival] = useState(initial?.rival ?? '')
  const [time, setTime] = useState(initial?.time ?? '')
  const [homeAway, setHomeAway] = useState<'casa' | 'fuera'>(initial?.homeAway ?? 'casa')

  function handleSave() {
    onSave({ dayIndex, rival: rival.trim(), time, homeAway })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Día de partido">
      <Select
        label="Día de la semana"
        value={String(dayIndex)}
        onChange={(e) => setDayIndex(Number(e.target.value))}
        options={DAY_NAMES_ES.map((name, i) => ({ value: String(i), label: name }))}
      />
      <Input label="Rival" placeholder="Nombre del rival" value={rival} onChange={(e) => setRival(e.target.value)} />
      <Input label="Hora" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      <Select
        label="Casa / Fuera"
        value={homeAway}
        onChange={(e) => setHomeAway(e.target.value as 'casa' | 'fuera')}
        options={[
          { value: 'casa', label: 'Casa' },
          { value: 'fuera', label: 'Fuera' },
        ]}
      />
      <div className="mt-2 flex gap-2">
        {initial && (
          <ConfirmButton
            confirmLabel={hasMatchRecord ? '¿Borrar registro?' : '¿Seguro?'}
            onConfirm={() => {
              onClear()
              onClose()
            }}
          >
            Quitar
          </ConfirmButton>
        )}
        <Button fullWidth onClick={handleSave}>
          Guardar
        </Button>
      </div>
    </Modal>
  )
}
