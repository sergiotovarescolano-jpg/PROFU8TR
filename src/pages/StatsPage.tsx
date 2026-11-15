import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { RiskGauge } from '../components/stats/RiskGauge'
import { Scene3D, type Bar3D } from '../components/stats/Scene3D'
import { WeightProgressChart } from '../components/stats/WeightProgressChart'
import { Select } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { useWeekDays, useWeekStats, useWeightProgress, type DayStat } from '../hooks/useStats'
import { DAY_NAMES_ES, formatDayShort, formatWeekRange, shiftWeek, todayMondayISO } from '../utils/dateUtils'

const WEEKS_SHOWN = 8
const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function todayIndex(): number {
  return (new Date().getDay() + 6) % 7
}

function Plate({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="board-frame plate-3d rounded-2xl px-3 py-3">
      <p className="text-[11px] leading-tight text-white/50">{label}</p>
      <p className="font-condensed mt-1 text-[2rem] leading-none font-extrabold tabular-nums text-white">{value}</p>
      {detail && <p className="text-[11px] leading-tight text-white/40">{detail}</p>}
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="board-frame mt-4 rounded-2xl p-4">
      <h2 className="font-condensed text-2xl font-bold text-white uppercase">{title}</h2>
      {subtitle && <p className="text-xs text-white/50">{subtitle}</p>}
      {children}
    </section>
  )
}

function describeDay(day: DayStat): string {
  const parts = [`${day.sessionsDone} de ${day.sessionsPlanned} sesiones hechas`]
  if (day.isMatchDay) parts.unshift('Partido')
  if (day.minutes > 0) parts.push(`${day.minutes} min`)
  return parts.join(' · ')
}

export function StatsPage() {
  const [mondayISO, setMondayISO] = useState(todayMondayISO())
  const isCurrentWeek = mondayISO === todayMondayISO()
  const [pickedDay, setPickedDay] = useState<number | null>(null)
  const weeks = useWeekStats(mondayISO, WEEKS_SHOWN)
  const days = useWeekDays(mondayISO)
  const progress = useWeightProgress()
  const [exerciseId, setExerciseId] = useState<number | null>(null)

  if (!weeks || !days || !progress) return <div className="p-6 text-center text-white/50">Cargando estadísticas…</div>

  function goToWeek(iso: string) {
    setMondayISO(iso)
    setPickedDay(null)
  }

  const selected = weeks[weeks.length - 1]
  const previousLoads = weeks.slice(-5, -1).map((w) => w.load)
  const validPrevious = previousLoads.filter((l) => l > 0)
  const average = validPrevious.length > 0 ? validPrevious.reduce((a, b) => a + b, 0) / validPrevious.length : null
  const limit = average !== null ? Math.round(average * 1.3) : null
  const chosen = progress.find((p) => p.exerciseId === exerciseId) ?? progress[0]

  // Día destacado: el que toques, o hoy si estás en la semana actual.
  const activeDay = pickedDay ?? (isCurrentWeek ? todayIndex() : null)
  const activeDayStat = activeDay !== null ? days[activeDay] : null

  const dayBars: Bar3D[] = days.map((d) => ({
    key: String(d.dayIndex),
    value: d.load,
    tone: d.dayIndex === activeDay ? 'accent' : d.load === 0 && d.sessionsPlanned > 0 ? 'ghost' : 'neutral',
    label: DAY_LETTERS[d.dayIndex],
    sublabel: d.isMatchDay ? 'PARTIDO' : (d.mdTag ?? undefined),
    ariaLabel: `${DAY_NAMES_ES[d.dayIndex]}${d.mdTag ? `, ${d.mdTag}` : ''}: carga ${d.load}`,
  }))
  const dayMax = Math.max(...days.map((d) => d.load))

  const weekBars: Bar3D[] = weeks.map((w, i) => ({
    key: w.mondayISO,
    value: w.load,
    tone: i === weeks.length - 1 ? 'accent' : 'neutral',
    label: format(parseISO(w.mondayISO), 'd/M'),
    ariaLabel: `Semana del ${formatDayShort(w.mondayISO)}: carga ${w.load}`,
  }))
  const weekMax = Math.max(limit ?? 0, ...weeks.map((w) => w.load))
  const deltaText =
    average !== null
      ? `${selected.load >= average ? '+' : '−'}${Math.abs(Math.round((selected.load / average - 1) * 100))} % sobre tu media`
      : 'Sin historial para comparar'

  return (
    <div className="p-4 pb-24">
      <PageHeader kicker="Rendimiento" title="Estadísticas" />

      <div className="board-frame mb-4 flex items-center justify-between rounded-2xl px-1 py-1">
        <button
          onClick={() => goToWeek(shiftWeek(mondayISO, -1))}
          aria-label="Semana anterior"
          className="flex h-11 w-11 items-center justify-center rounded-full text-xl active:bg-white/10"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="font-condensed text-xl font-bold text-white uppercase">{formatWeekRange(mondayISO)}</p>
          {!isCurrentWeek && (
            <button onClick={() => goToWeek(todayMondayISO())} className="text-xs font-semibold text-gold-300">
              Ir a esta semana
            </button>
          )}
        </div>
        <button
          onClick={() => goToWeek(shiftWeek(mondayISO, 1))}
          aria-label="Semana siguiente"
          className="flex h-11 w-11 items-center justify-center rounded-full text-xl active:bg-white/10"
        >
          ›
        </button>
      </div>

      {/* Cifra principal + campo de la semana */}
      <section className="board-frame overflow-hidden rounded-2xl p-4 pb-2">
        <p className="text-xs text-white/50">Carga de la semana</p>
        <p className="font-condensed extruded-3d mt-1 mb-2 text-7xl leading-none font-extrabold text-pitch-400 tabular-nums">
          {selected.load.toLocaleString('es-ES')}
        </p>
        <p className="mt-1 text-xs text-white/50">RPE × minutos · {deltaText}</p>

        <div className="relative -mx-4">
          <Scene3D
            bars={dayBars}
            maxValue={Math.max(dayMax, 1)}
            selectedKey={activeDay !== null ? String(activeDay) : undefined}
            onSelect={(key) => setPickedDay(Number(key))}
            ariaLabel="Carga por día de la semana"
          />
          {dayMax === 0 && (
            <p className="pointer-events-none absolute inset-x-0 top-6 text-center text-xs text-white/40">
              Las barras crecen al terminar sesiones
            </p>
          )}
        </div>

        <div className="flex min-h-12 items-center justify-between gap-3 border-t border-border pt-2">
          {activeDayStat ? (
            <>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {DAY_NAMES_ES[activeDayStat.dayIndex]}
                  {activeDayStat.mdTag && <span className="font-display ml-1.5 text-white/50">{activeDayStat.mdTag}</span>}
                  <span className="font-display ml-1.5 tabular-nums text-white/80">· {activeDayStat.load} de carga</span>
                </p>
                <p className="truncate text-xs text-white/50">{describeDay(activeDayStat)}</p>
              </div>
              <Link to={`/?semana=${mondayISO}`} className="shrink-0 text-xs font-semibold text-gold-300">
                Ver en Semana ›
              </Link>
            </>
          ) : (
            <p className="text-xs text-white/40">Toca una barra para ver el día · arrastra para girar el campo</p>
          )}
        </div>

        <details className="text-sm">
          <summary className="min-h-10 cursor-pointer py-2 text-white/60">Ver como tabla</summary>
          <table className="mb-2 w-full text-left tabular-nums">
            <thead className="text-xs text-white/50">
              <tr>
                <th className="py-1 font-medium">Día</th>
                <th className="py-1 text-right font-medium">Carga</th>
                <th className="py-1 text-right font-medium">Minutos</th>
                <th className="py-1 text-right font-medium">Hechas</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.dayIndex} className="border-t border-border">
                  <td className="py-1.5">
                    {DAY_NAMES_ES[d.dayIndex]} {d.mdTag && <span className="text-white/40">{d.mdTag}</span>}
                  </td>
                  <td className="py-1.5 text-right">{d.load}</td>
                  <td className="py-1.5 text-right">{d.minutes}</td>
                  <td className="py-1.5 text-right">
                    {d.sessionsDone}/{d.sessionsPlanned}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Plate label="Sesiones" value={`${selected.sessionsDone}/${selected.sessionsPlanned}`} detail="hechas" />
        <Plate label="Minutos" value={String(selected.minutes)} detail="con partido" />
        <Plate
          label="RPE medio"
          value={selected.avgRpe === null ? '—' : selected.avgRpe.toLocaleString('es-ES', { maximumFractionDigits: 1 })}
          detail="de 10"
        />
      </div>

      <Section title="Riesgo de sobrecarga" subtitle="Carga de esta semana frente a la media de las 4 anteriores">
        <div className="mt-3">
          <RiskGauge currentLoad={selected.load} previousLoads={previousLoads} isCurrentWeek={isCurrentWeek} />
        </div>
      </Section>

      <Section title="Últimas 8 semanas" subtitle="Toca una barra para ir a esa semana">
        <div className="-mx-4">
          <Scene3D
            bars={weekBars}
            maxValue={Math.max(weekMax, 1)}
            limit={limit}
            floorWidth={272}
            selectedKey={mondayISO}
            onSelect={goToWeek}
            ariaLabel="Carga de las últimas 8 semanas"
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#34b057]" aria-hidden="true" /> Semana elegida
          </span>
          {limit !== null && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-3.5 rounded-sm border border-dashed border-[#ff6b5b] bg-[#ff6b5b]/10" aria-hidden="true" />
              Límite +30 %: <span className="tabular-nums">{limit.toLocaleString('es-ES')}</span>
            </span>
          )}
        </div>

        <details className="mt-1 text-sm">
          <summary className="min-h-10 cursor-pointer py-2 text-white/60">Ver como tabla</summary>
          <table className="w-full text-left tabular-nums">
            <thead className="text-xs text-white/50">
              <tr>
                <th className="py-1 font-medium">Semana del</th>
                <th className="py-1 text-right font-medium">Carga</th>
                <th className="py-1 text-right font-medium">Minutos</th>
              </tr>
            </thead>
            <tbody>
              {[...weeks].reverse().map((w) => (
                <tr key={w.mondayISO} className="border-t border-border">
                  <td className="py-1.5">{formatDayShort(w.mondayISO)}</td>
                  <td className="py-1.5 text-right">{w.load}</td>
                  <td className="py-1.5 text-right">{w.minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Section>

      <Section title="Progresión de peso">
        <div className="mt-2">
          {progress.length === 0 ? (
            <p className="text-sm text-white/50">Aparecerá cuando termines sesiones con kilos registrados en algún ejercicio.</p>
          ) : (
            <>
              <Select
                label="Ejercicio"
                value={String(chosen.exerciseId)}
                onChange={(e) => setExerciseId(Number(e.target.value))}
                options={progress.map((p) => ({ value: String(p.exerciseId), label: p.name }))}
              />
              <WeightProgressChart key={chosen.exerciseId} points={chosen.points} />
            </>
          )}
        </div>
      </Section>
    </div>
  )
}
