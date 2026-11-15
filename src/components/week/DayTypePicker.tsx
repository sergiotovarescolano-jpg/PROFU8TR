import type { CSSProperties } from 'react'
import { SESSION_TYPE_INFO } from '../../utils/sessionTypeInfo'
import type { SessionType } from '../../types/models'
import './dayPicker.css'

export type DayChoice = SessionType | 'partido'

const CHOICES: { value: DayChoice; label: string; icon: string; piece: string; glow: string }[] = [
  { value: 'entreno_equipo', label: 'Equipo', ...pick('entreno_equipo') },
  { value: 'gimnasio', label: 'Gimnasio', ...pick('gimnasio') },
  { value: 'carrera', label: 'Carrera', ...pick('carrera') },
  { value: 'movilidad', label: 'Movilidad', ...pick('movilidad') },
  { value: 'descanso', label: 'Descanso', ...pick('descanso') },
  { value: 'partido', label: 'Partido', icon: '🏆', piece: 'orb orb--partido', glow: 'rgba(255,236,160,0.6)' },
]

function pick(type: SessionType) {
  const { icon, piece, glow } = SESSION_TYPE_INFO[type]
  return { icon, piece, glow }
}

interface DayTypePickerProps {
  onPick: (choice: DayChoice) => void
  selected?: DayChoice
  withMatch?: boolean // la ficha "Partido" solo tiene sentido en el día, no en la ventana de sesión
  label?: string
}

/** Fichas grandes para elegir qué toca: un toque y el día (o la sesión) cambia de tipo. */
export function DayTypePicker({ onPick, selected, withMatch = true, label = '¿Qué toca?' }: DayTypePickerProps) {
  const choices = withMatch ? CHOICES : CHOICES.filter((c) => c.value !== 'partido')
  return (
    <div role="group" aria-label={label}>
      <p className="font-hud mb-2 text-sm font-bold tracking-[0.2em] text-neon-300 uppercase">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {choices.map((c, i) => (
          <button
            key={c.value}
            type="button"
            className="type-token"
            style={{ '--i': i, '--glow': c.glow } as CSSProperties}
            aria-pressed={selected !== undefined ? selected === c.value : undefined}
            onClick={() => onPick(c.value)}
          >
            <span className={`type-token__piece ${c.piece}`} aria-hidden="true">
              {c.icon}
            </span>
            <span className="font-hud text-sm font-bold tracking-wide text-white/85 uppercase">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
