import { CHART } from './chartTheme'

export interface Acwr {
  ratio: number
  percentOver: number
  isAlert: boolean
}

const RATIO_MAX = 2 // el arco va de 0 a 2 veces tu media
const CX = 60
const CY = 56
const R = 44

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

function formatPercent(percentOver: number): string {
  const p = Math.round(percentOver)
  return `${p > 0 ? '+' : p < 0 ? '−' : ''}${Math.abs(p)} %`
}

/** Medidor compacto de riesgo para el mosaico: semicírculo con canto, cifra y estado. */
export function RiskMini({ acwr }: { acwr: Acwr | null }) {
  if (!acwr) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-hud text-3xl font-extrabold text-white/30">—</p>
        <p className="text-[11px] leading-tight text-white/45">Sin historial para comparar</p>
      </div>
    )
  }

  const t = Math.min(acwr.ratio / RATIO_MAX, 1)
  const color = acwr.isAlert ? CHART.warning : CHART.series
  const edge = acwr.isAlert ? '#7a1f55' : '#5a0d2c'
  const signed = formatPercent(acwr.percentOver)

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
      <svg viewBox="0 0 120 66" className="gauge-3d w-full" role="img" aria-label={`Carga ${signed} sobre tu media de 4 semanas`}>
        <g transform="translate(0 4)">
          <path d={arc(0, 1)} fill="none" stroke="#200a0d" strokeWidth={10} strokeLinecap="round" />
          {t > 0 && <path d={arc(0, t)} fill="none" stroke={edge} strokeWidth={10} strokeLinecap="round" />}
        </g>
        <path d={arc(0, 1)} fill="none" stroke={CHART.grid} strokeWidth={10} strokeLinecap="round" />
        <path d={arc(1.3 / RATIO_MAX, 1, R + 8)} fill="none" stroke={CHART.warning} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
        {t > 0 && <path d={arc(0, t)} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" />}
        <line x1={CX} y1={CY - R - 7} x2={CX} y2={CY - R + 7} stroke="rgb(255 255 255 / 0.5)" strokeWidth={1.5} />
        <text x={CX} y={CY - 2} textAnchor="middle" className="font-hud" fontSize={22} fontWeight={800} fill="#fff">
          {signed}
        </text>
      </svg>
      <p className={`font-hud text-sm font-bold tracking-wide uppercase ${acwr.isAlert ? 'text-[#ffa094]' : 'text-white/75'}`}>
        <span aria-hidden="true">{acwr.isAlert ? '⚠️ ' : '✓ '}</span>
        {acwr.isAlert ? 'Sobrecarga' : 'En rango'}
      </p>
      <p className="text-[10px] leading-none text-white/45">
        ratio {acwr.ratio.toLocaleString('es-ES', { maximumFractionDigits: 2 })} · límite +30 %
      </p>
    </div>
  )
}
