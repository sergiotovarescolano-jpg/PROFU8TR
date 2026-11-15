import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { LoadSparkline } from '../components/stats/LoadSparkline'
import { RiskMini } from '../components/stats/RiskMini'
import { Scene3D, type Bar3D } from '../components/stats/Scene3D'
import { WeightProgressChart } from '../components/stats/WeightProgressChart'
import { Select } from '../components/ui/Field'
import { PageHeader } from '../components/ui/PageHeader'
import { useWeekDays, useWeekStats, useWeightProgress } from '../hooks/useStats'
import { DAY_NAMES_ES, formatDayShort, formatWeekRange, shiftWeek, todayMondayISO } from '../utils/dateUtils'
import { calcAcwrAlert } from '../utils/loadCalc'

const WEEKS_SHOWN = 8
const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function todayIndex(): number {
  return (new Date().getDay() + 6) % 7
}

/** Bloque del mosaico: placa con su rótulo dorado arriba. */
function Tile({ label, aside, className = '', children }: { label: string; aside?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`board-frame relative flex flex-col overflow-hidden rounded-2xl p-3 ${className}`} aria-label={label}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="font-hud text-xs font-bold tracking-[0.2em] text-neon-400 uppercase">{label}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** Cifra pequeña con relieve (placa gruesa), para la columna izquierda del mosaico. */
function StatPlate({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="board-frame plate-3d col-span-2 flex flex-col justify-center rounded-2xl px-3 py-2.5">
      <p className="font-hud text-xs font-bold tracking-[0.2em] text-neon-400 uppercase">{label}</p>
      <p className="font-hud text-[2rem] leading-none font-extrabold text-white tabular-nums">{value}</p>
      <p className="text-[11px] leading-tight text-white/45">{detail}</p>
    </div>
  )
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
  const acwr = calcAcwrAlert(selected.load, previousLoads)
  const average = acwr ? selected.load / acwr.ratio : null
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
    sublabel: d.isMatchDay ? 'MD' : (d.mdTag ?? undefined),
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
  const percent = acwr ? Math.round(acwr.percentOver) : null

  return (
    // Ancho máximo: el mosaico está pensado para el móvil; en pantallas anchas se centra sin estirarse.
    <div className="mx-auto max-w-xl p-4 pb-24">
      <PageHeader kicker="Rendimiento" title="Estadísticas" />

      <div className="board-frame mb-3 flex items-center justify-between rounded-2xl px-1 py-1">
        <button
          onClick={() => goToWeek(shiftWeek(mondayISO, -1))}
          aria-label="Semana anterior"
          className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-neon-200 active:bg-white/10"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="font-hud text-xl font-bold text-white uppercase">{formatWeekRange(mondayISO)}</p>
          {!isCurrentWeek && (
            <button onClick={() => goToWeek(todayMondayISO())} className="text-xs font-semibold text-neon-300">
              Ir a esta semana
            </button>
          )}
        </div>
        <button
          onClick={() => goToWeek(shiftWeek(mondayISO, 1))}
          aria-label="Semana siguiente"
          className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-neon-200 active:bg-white/10"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {/* Fila 1: carga (protagonista) + riesgo */}
        <Tile label="Carga" className="col-span-4">
          <p className="font-hud extruded-3d text-6xl leading-none font-extrabold text-pitch-400 tabular-nums">
            {selected.load.toLocaleString('es-ES')}
          </p>
          <p className="mt-1.5 text-[11px] text-white/55">
            RPE × min
            {percent !== null && (
              <>
                {' · '}
                <b className={acwr?.isAlert ? 'text-[#ffa094]' : 'text-white/80'}>
                  {percent > 0 ? '+' : percent < 0 ? '−' : ''}
                  {Math.abs(percent)} %
                </b>{' '}
                vs media
              </>
            )}
          </p>
          <div className="mt-auto pt-2">
            <LoadSparkline loads={weeks.map((w) => w.load)} limit={limit} />
            <p className="mt-0.5 text-[10px] text-white/40">Últimas {WEEKS_SHOWN} semanas</p>
          </div>
        </Tile>

        <Tile label="Riesgo" className="col-span-2">
          <RiskMini acwr={acwr} />
        </Tile>

        {acwr?.isAlert && (
          <p role="alert" className="col-span-6 rounded-xl border border-[#ff4b3e]/45 bg-[#ff4b3e]/10 px-3 py-2 text-sm text-white/80">
            <b className="text-[#ffc4bc]">⚠️ Sobrecarga:</b> subir más de un 30 % de golpe aumenta el riesgo de lesión. Baja volumen o
            intensidad en lo que queda de semana.
          </p>
        )}

        {/* Bloque central: tres cifras a la izquierda + campo 3D de la semana a la derecha */}
        <StatPlate label="Sesiones" value={`${selected.sessionsDone}/${selected.sessionsPlanned}`} detail="hechas" />

        <Tile label="Tu semana" className="col-span-4 row-span-3" aside={<span className="text-[10px] text-white/35">↔ gira</span>}>
          <div className="relative -mx-3">
            <Scene3D
              compact
              bars={dayBars}
              maxValue={Math.max(dayMax, 1)}
              floorWidth={186}
              selectedKey={activeDay !== null ? String(activeDay) : undefined}
              onSelect={(key) => setPickedDay(Number(key))}
              ariaLabel="Carga por día de la semana"
            />
            {dayMax === 0 && (
              <p className="pointer-events-none absolute inset-x-0 top-3 text-center text-[11px] text-white/40">
                Las barras crecen al terminar sesiones
              </p>
            )}
          </div>
          <div className="mt-auto flex min-h-10 items-end justify-between gap-2 border-t border-border pt-1.5">
            {activeDayStat ? (
              <>
                <p className="min-w-0 text-xs leading-tight">
                  <span className="font-hud block text-base font-bold text-white uppercase">
                    {DAY_NAMES_ES[activeDayStat.dayIndex]}
                    {activeDayStat.mdTag && <span className="ml-1 text-white/45">{activeDayStat.mdTag}</span>}
                  </span>
                  <span className="text-white/55">
                    carga <b className="text-white tabular-nums">{activeDayStat.load}</b> · {activeDayStat.sessionsDone}/
                    {activeDayStat.sessionsPlanned} hechas
                  </span>
                </p>
                <Link to={`/?semana=${mondayISO}`} className="shrink-0 text-xs font-semibold text-neon-300">
                  Semana ›
                </Link>
              </>
            ) : (
              <p className="text-[11px] text-white/40">Toca una barra para ver el día</p>
            )}
          </div>
        </Tile>

        <StatPlate label="Minutos" value={String(selected.minutes)} detail="con partido" />
        <StatPlate
          label="RPE"
          value={selected.avgRpe === null ? '—' : selected.avgRpe.toLocaleString('es-ES', { maximumFractionDigits: 1 })}
          detail="medio, de 10"
        />

        {/* Tendencia: las 8 semanas en 3D a todo el ancho */}
        <Tile label={`Últimas ${WEEKS_SHOWN} semanas`} className="col-span-6" aside={<span className="text-[10px] text-white/35">toca para ir</span>}>
          <div className="-mx-3">
            <Scene3D
              bars={weekBars}
              maxValue={Math.max(weekMax, 1)}
              limit={limit}
              floorWidth={272}
              selectedKey={mondayISO}
              onSelect={goToWeek}
              ariaLabel={`Carga de las últimas ${WEEKS_SHOWN} semanas`}
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#a51750]" aria-hidden="true" /> Semana elegida
            </span>
            {limit !== null && (
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-3.5 rounded-sm border border-dashed border-[#ff4b3e] bg-[#ff4b3e]/10" aria-hidden="true" />
                Límite +30 %: <span className="tabular-nums">{limit.toLocaleString('es-ES')}</span>
              </span>
            )}
          </div>
        </Tile>

        {/* Plegados: no ocupan la primera pantalla */}
        <details className="board-frame group col-span-6 rounded-2xl px-3">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between">
            <span className="font-hud text-xs font-bold tracking-[0.2em] text-neon-400 uppercase">Progresión de peso</span>
            <span className="text-neon-300 transition-transform group-open:rotate-90" aria-hidden="true">
              ›
            </span>
          </summary>
          <div className="pb-3">
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
        </details>

        <details className="board-frame group col-span-6 rounded-2xl px-3 text-sm">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between">
            <span className="font-hud text-xs font-bold tracking-[0.2em] text-neon-400 uppercase">Ver datos en tabla</span>
            <span className="text-neon-300 transition-transform group-open:rotate-90" aria-hidden="true">
              ›
            </span>
          </summary>
          <table className="mb-3 w-full text-left tabular-nums">
            <caption className="pb-1 text-left text-xs text-white/50">Esta semana, por día</caption>
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
          <table className="mb-3 w-full text-left tabular-nums">
            <caption className="pb-1 text-left text-xs text-white/50">Últimas {WEEKS_SHOWN} semanas</caption>
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
      </div>
    </div>
  )
}
