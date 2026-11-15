interface ScalePickerProps {
  label: string
  max: number
  value: number | undefined
  onChange: (value: number | undefined) => void
  hint?: string
}

/**
 * Escala de botones grandes (RPE, fatiga, valoración). Pulsar el valor activo lo quita.
 * Cada botón lleva una barrita dorada que crece con el número: se lee la intensidad de un vistazo.
 */
export function ScalePicker({ label, max, value, onChange, hint }: ScalePickerProps) {
  return (
    <div className="mb-4" role="group" aria-label={label}>
      <p className="font-condensed mb-1.5 text-base font-bold tracking-wider text-gold-200/85 uppercase">{label}</p>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
          const active = value === n
          return (
            <button
              key={n}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? undefined : n)}
              className={`font-condensed relative flex min-h-14 flex-col items-center justify-center overflow-hidden rounded-xl border text-2xl font-extrabold transition-all active:scale-95 ${
                active
                  ? 'border-pitch-300 bg-gradient-to-b from-pitch-400 to-pitch-600 text-white shadow-[0_0_14px_-2px_rgba(63,189,97,0.7)]'
                  : 'border-border bg-surface-2 text-white/75'
              }`}
            >
              {n}
              <span
                className={`absolute bottom-1.5 left-1/2 h-1 -translate-x-1/2 rounded-full ${active ? 'bg-white/70' : 'bg-gold-400/70'}`}
                style={{ width: `${20 + (n / max) * 60}%` }}
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs text-white/45">{hint}</p>}
    </div>
  )
}
