import { calcAcwrAlert } from '../../utils/loadCalc'
import { CHART } from './chartTheme'

interface RiskGaugeProps {
  currentLoad: number
  previousLoads: number[] // las 4 semanas anteriores
  isCurrentWeek: boolean
}

const RATIO_MAX = 2 // el arco va de 0 a 2 veces tu media
const CX = 110
const CY = 118
const R = 84

// t = 0 es el extremo izquierdo del semicírculo y t = 1 el derecho.
function point(t: number, r = R): [number, number] {
  const angle = Math.PI * (1 - t)
  return [CX + r * Math.cos(angle), CY - r * Math.sin(angle)]
}

function arc(t0: number, t1: number, r = R): string {
  const [x0, y0] = point(t0, r)
  const [x1, y1] = point(t1, r)
  return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`
}

/** Medidor semicircular de la carga frente a la media de las 4 semanas anteriores. */
export function RiskGauge({ currentLoad, previousLoads, isCurrentWeek }: RiskGaugeProps) {
  const acwr = calcAcwrAlert(currentLoad, previousLoads)

  if (!acwr) {
    return (
      <p className="text-sm text-white/60">
        Aún no hay semanas anteriores con carga registrada para comparar. El medidor aparece cuando tengas historial.
      </p>
    )
  }

  const percent = Math.round(acwr.percentOver)
  const signed = `${percent > 0 ? '+' : percent < 0 ? '−' : ''}${Math.abs(percent)} %`
  const ratio = acwr.ratio.toLocaleString('es-ES', { maximumFractionDigits: 2 })
  const t = Math.min(acwr.ratio / RATIO_MAX, 1)
  const limitT = 1.3 / RATIO_MAX
  const color = acwr.isAlert ? CHART.warning : CHART.series
  const edge = acwr.isAlert ? '#9c3b31' : '#1f6b37'
  const [mx0, my0] = point(0.5, R - 12)
  const [mx1, my1] = point(0.5, R + 12)

  return (
    <div>
      <svg
        viewBox="0 0 220 142"
        className="gauge-3d mx-auto block w-full max-w-[260px]"
        role="img"
        aria-label={`Carga ${signed} sobre tu media de 4 semanas`}
      >
        {/* canto del anillo: la misma forma desplazada hacia abajo, más oscura */}
        <g transform="translate(0 5)">
          <path d={arc(0, 1)} fill="none" stroke="#111214" strokeWidth={14} strokeLinecap="round" />
          {t > 0 && <path d={arc(0, t)} fill="none" stroke={edge} strokeWidth={14} strokeLinecap="round" />}
        </g>
        <path d={arc(0, 1)} fill="none" stroke={CHART.grid} strokeWidth={14} strokeLinecap="round" />
        {/* zona de sobrecarga, por fuera del arco */}
        <path d={arc(limitT, 1, R + 12)} fill="none" stroke={CHART.warning} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
        {t > 0 && <path d={arc(0, t)} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" />}
        {/* marca de tu media (ratio 1) */}
        <line x1={mx0} y1={my0} x2={mx1} y2={my1} stroke="rgb(255 255 255 / 0.45)" strokeWidth={2} />
        <text x={CX} y={CY - 30} textAnchor="middle" className="font-display" fontSize={30} fontWeight={700} fill="#fff">
          {signed}
        </text>
        <text x={CX} y={CY - 10} textAnchor="middle" fontSize={11} fill={CHART.axisText}>
          vs tu media de 4 semanas
        </text>
        <text x={point(0)[0]} y={CY + 16} textAnchor="middle" fontSize={10} fill={CHART.axisText}>
          0
        </text>
        <text x={CX} y={my1 - 4} textAnchor="middle" fontSize={10} fill={CHART.axisText}>
          media
        </text>
        <text x={point(1)[0]} y={CY + 16} textAnchor="middle" fontSize={10} fill={CHART.axisText}>
          ×2
        </text>
      </svg>

      {acwr.isAlert ? (
        <div role="alert" className="mt-2 rounded-xl border border-[#ff6b5b]/50 bg-[#ff6b5b]/10 px-3 py-2">
          <p className="text-sm font-bold text-white">
            <span aria-hidden="true">⚠️</span> Sobrecarga
          </p>
          <p className="mt-0.5 text-sm text-white/70">
            Ratio agudo:crónico {ratio}. Subir más de un 30 % de golpe aumenta el riesgo de lesión: baja volumen o intensidad en lo
            que queda de semana.
          </p>
        </div>
      ) : (
        <div className="mt-2 rounded-xl border border-border bg-surface-2 px-3 py-2">
          <p className="text-sm font-bold text-white">
            <span aria-hidden="true">✓</span> En rango
          </p>
          <p className="mt-0.5 text-sm text-white/60">
            Ratio agudo:crónico {ratio}. El límite está en +30 %.
            {isCurrentWeek && percent < 0 && ' La semana aún no ha terminado: la carga irá subiendo según registres sesiones.'}
          </p>
        </div>
      )}
    </div>
  )
}
