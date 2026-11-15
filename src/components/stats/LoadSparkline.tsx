import { CHART } from './chartTheme'

interface LoadSparklineProps {
  loads: number[] // de la semana más antigua a la elegida (la última)
  limit: number | null
}

const W = 160
const H = 40
const GAP = 3

/** Mini gráfica de barras de las últimas semanas: la elegida en verde y el límite +30 % en coral. */
export function LoadSparkline({ loads: rawLoads, limit: rawLimit }: LoadSparklineProps) {
  // Sin historial la media sale NaN: se trata como "sin dato" para no pintar atributos NaN.
  const loads = rawLoads.map((v) => (Number.isFinite(v) ? v : 0))
  const limit = rawLimit !== null && Number.isFinite(rawLimit) ? rawLimit : null
  const max = Math.max(1, limit ?? 0, ...loads)
  const barW = (W - GAP * (loads.length - 1)) / loads.length
  const y = (v: number) => H - (v / max) * (H - 2)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-10 w-full" preserveAspectRatio="none" aria-hidden="true">
      {loads.map((v, i) => {
        const h = Math.max(v > 0 ? 2 : 1, H - y(v))
        return (
          <rect
            key={i}
            x={i * (barW + GAP)}
            y={H - h}
            width={barW}
            height={h}
            rx={2}
            fill={i === loads.length - 1 ? CHART.series : v > 0 ? '#3f5478' : '#1c2640'}
          />
        )
      })}
      {limit !== null && (
        <line x1={0} x2={W} y1={y(limit)} y2={y(limit)} stroke={CHART.warning} strokeWidth={1} strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  )
}
