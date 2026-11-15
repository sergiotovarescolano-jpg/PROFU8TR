import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDayShort } from '../../utils/dateUtils'
import type { WeightPoint } from '../../hooks/useStats'
import { CHART } from './chartTheme'
import { ChartTooltip } from './ChartTooltip'

function formatKg(kg: number): string {
  return `${kg.toLocaleString('es-ES')} kg`
}

export function WeightProgressChart({ points }: { points: WeightPoint[] }) {
  // Con un solo registro una línea no dice nada: se muestra el dato.
  if (points.length === 1) {
    return (
      <p className="py-4 text-center text-sm text-white/60">
        Un registro hasta ahora: <span className="font-bold text-white">{formatKg(points[0].weightKg)}</span> el{' '}
        {formatDayShort(points[0].date)}. Registra más sesiones para ver la evolución.
      </p>
    )
  }

  const data = points.map((p) => ({ label: formatDayShort(p.date), weightKg: p.weightKg }))
  const first = points[0].weightKg
  const last = points[points.length - 1].weightKg
  const diff = last - first

  return (
    <div>
      <p className="mb-2 text-sm text-white/60">
        Último: <span className="font-bold text-white">{formatKg(last)}</span>
        {diff !== 0 && (
          <span>
            {' '}
            · {diff > 0 ? '+' : '−'}
            {formatKg(Math.abs(diff))} desde el primer registro
          </span>
        )}
      </p>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="label" tick={{ fill: CHART.axisText, fontSize: 11 }} tickLine={false} axisLine={{ stroke: CHART.grid }} minTickGap={16} />
            <YAxis
              tick={{ fill: CHART.axisText, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 5', 'dataMax + 5']}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: CHART.axisText, strokeWidth: 1 }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <ChartTooltip value={formatKg(Number(payload[0].value))} label={payload[0].payload.label} />
                ) : null
              }
            />
            <Line
              type="monotone"
              dataKey="weightKg"
              stroke={CHART.series}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={{ r: 4, fill: CHART.series, stroke: CHART.surface, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: CHART.series, stroke: CHART.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-2 text-sm">
        <summary className="min-h-10 cursor-pointer py-2 text-white/60">Ver como tabla</summary>
        <table className="w-full text-left tabular-nums">
          <thead className="text-xs text-white/50">
            <tr>
              <th className="py-1 font-medium">Fecha</th>
              <th className="py-1 text-right font-medium">Peso máximo</th>
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map((p) => (
              <tr key={p.date} className="border-t border-border">
                <td className="py-1.5">{formatDayShort(p.date)}</td>
                <td className="py-1.5 text-right">{formatKg(p.weightKg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
