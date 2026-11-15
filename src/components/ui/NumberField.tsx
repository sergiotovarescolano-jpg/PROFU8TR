import { useState } from 'react'

interface NumberFieldProps {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
}

// Guarda el texto tal cual se teclea para no romper decimales a medias ("82," en teclado español).
export function NumberField({ label, value, onChange }: NumberFieldProps) {
  const [text, setText] = useState(value === undefined ? '' : String(value))

  return (
    <label className="block">
      <span className="font-hud mb-1 block text-sm font-bold tracking-wide text-neon-200/70 uppercase">{label}</span>
      <input
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          const parsed = Number(e.target.value.replace(',', '.'))
          onChange(e.target.value.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined)
        }}
        className="font-hud min-h-11 w-full rounded-lg border border-border bg-surface px-2 text-center text-xl font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] focus:border-neon-400 focus:outline-none"
      />
    </label>
  )
}
