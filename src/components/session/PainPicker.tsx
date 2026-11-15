import { useState } from 'react'
import { Button } from '../ui/Button'
import { ScalePicker } from '../ui/ScalePicker'
import type { PainEntry } from '../../types/models'

const COMMON_ZONES = ['Isquios', 'Cuádriceps', 'Aductor', 'Gemelo', 'Rodilla', 'Tobillo', 'Cadera', 'Pubis', 'Lumbar', 'Hombro']

interface PainPickerProps {
  initial: PainEntry[]
  onChange: (pain: PainEntry[]) => void
}

export function PainPicker({ initial, onChange }: PainPickerProps) {
  const [rows, setRows] = useState<PainEntry[]>(initial)

  // Una molestia sin zona todavía se está escribiendo: se muestra, pero no se guarda.
  function update(next: PainEntry[]) {
    setRows(next)
    onChange(next.filter((r) => r.zone.trim() !== '').map((r) => ({ ...r, zone: r.zone.trim() })))
  }

  return (
    <div className="mb-4">
      <p className="mb-1.5 text-sm font-medium text-white/70">Molestias o dolor</p>
      <datalist id="pain-zones">
        {COMMON_ZONES.map((zone) => (
          <option key={zone} value={zone} />
        ))}
      </datalist>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface-2 p-3">
            <div className="mb-3 flex items-center gap-2">
              <input
                list="pain-zones"
                value={row.zone}
                placeholder="Zona (ej. Isquios)"
                aria-label="Zona de la molestia"
                onChange={(e) => update(rows.map((r, j) => (j === i ? { ...r, zone: e.target.value } : r)))}
                className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-base placeholder:text-white/35 focus:border-pitch-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => update(rows.filter((_, j) => j !== i))}
                aria-label="Quitar molestia"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-white/50 active:bg-white/10"
              >
                ×
              </button>
            </div>
            <ScalePicker
              label="Intensidad"
              max={10}
              value={row.intensity}
              onChange={(intensity) =>
                update(rows.map((r, j) => (j === i ? { ...r, intensity: intensity ?? r.intensity } : r)))
              }
            />
          </div>
        ))}
      </div>

      <Button variant="secondary" fullWidth className={rows.length > 0 ? 'mt-2' : ''} onClick={() => update([...rows, { zone: '', intensity: 3 }])}>
        + Añadir molestia
      </Button>
    </div>
  )
}
