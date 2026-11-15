interface ChartTooltipProps {
  value: string
  label: string
}

/** El valor manda y la etiqueta acompaña: quien pasa el dedo ya sabe qué serie mira. */
export function ChartTooltip({ value, label }: ChartTooltipProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 shadow-lg">
      <p className="text-base font-bold text-white">{value}</p>
      <p className="text-xs text-white/60">{label}</p>
    </div>
  )
}
