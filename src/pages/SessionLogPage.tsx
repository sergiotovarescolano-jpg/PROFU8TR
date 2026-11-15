import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PainPicker } from '../components/session/PainPicker'
import { Button } from '../components/ui/Button'
import { ConfirmButton } from '../components/ui/ConfirmButton'
import { Input, Textarea } from '../components/ui/Field'
import { NumberField } from '../components/ui/NumberField'
import { PageHeader, SectionTitle } from '../components/ui/PageHeader'
import { ScalePicker } from '../components/ui/ScalePicker'
import { db } from '../db/db'
import { updateSession } from '../db/sessionRepo'
import { useExercisesById } from '../hooks/useExercises'
import { dayDateForIndex } from '../db/weekRepo'
import { formatDayLong } from '../utils/dateUtils'
import { TIER_INFO, TIER_ORDER, tierLabels, tierOf } from '../utils/exerciseTier'
import { calcSessionLoad } from '../utils/loadCalc'
import { SESSION_TYPE_INFO } from '../utils/sessionTypeInfo'
import type { PainEntry, Session, SessionExerciseDone, SessionExercisePlanned, Week } from '../types/models'

export function SessionLogPage() {
  const id = Number(useParams().id)
  const data = useLiveQuery(async () => {
    const session = await db.sessions.get(id)
    if (!session) return null
    return { session, week: await db.weeks.get(session.weekId) }
  }, [id])

  if (data === undefined) return <div className="p-6 text-center text-white/50">Cargando sesión…</div>
  if (data === null) {
    return (
      <div className="p-6 text-center text-white/50">
        Esta sesión ya no existe.{' '}
        <Link to="/" className="text-gold-300">
          Volver a la semana
        </Link>
      </div>
    )
  }
  return <SessionLogger key={data.session.id} session={data.session} week={data.week} />
}

interface Row extends SessionExerciseDone {
  done: boolean
}

interface Draft {
  rows: Row[]
  rpe?: number
  durationMin?: number
  feeling: string
  fatigue?: number
  pain: PainEntry[]
}

// Cada fila arranca con lo planificado: si sale como estaba previsto, basta con un toque.
function buildRows(session: Session): Row[] {
  const seen = new Map<number, number>()
  return session.plannedExercises.map((planned) => {
    const occurrence = seen.get(planned.exerciseId) ?? 0
    seen.set(planned.exerciseId, occurrence + 1)
    const logged = session.doneExercises.find((d) => d.exerciseId === planned.exerciseId && d.occurrence === occurrence)
    if (logged) return { ...logged, done: true }
    return {
      exerciseId: planned.exerciseId,
      occurrence,
      done: false,
      setsDone: planned.sets,
      repsDone: planned.reps,
      weightUsedKg: planned.weightKg,
      timeUsedSec: planned.durationSec,
    }
  })
}

function toSessionChanges(draft: Draft): Partial<Session> {
  return {
    doneExercises: draft.rows.filter((r) => r.done).map(({ done: _done, ...entry }) => entry),
    rpe: draft.rpe,
    durationMin: draft.durationMin,
    feeling: draft.feeling,
    fatigue: draft.fatigue,
    pain: draft.pain,
    loadScore: calcSessionLoad(draft.rpe, draft.durationMin) || undefined,
  }
}

const EMPTY_LOG: Partial<Session> = {
  doneExercises: [],
  rpe: undefined,
  durationMin: undefined,
  feeling: undefined,
  fatigue: undefined,
  pain: [],
  loadScore: undefined,
}

function formatPlan(planned: SessionExercisePlanned): string {
  const parts = [
    planned.sets && planned.reps ? `${planned.sets} × ${planned.reps}` : planned.sets ? `${planned.sets} series` : planned.reps ? `${planned.reps} reps` : '',
    planned.weightKg !== undefined ? `${planned.weightKg} kg` : '',
    planned.durationSec !== undefined ? `${planned.durationSec} s` : '',
    planned.restSec !== undefined ? `descanso ${planned.restSec} s` : '',
  ]
  return parts.filter(Boolean).join(' · ')
}

function SessionLogger({ session, week }: { session: Session; week: Week | undefined }) {
  const navigate = useNavigate()
  const exercisesById = useExercisesById(session.plannedExercises.map((p) => p.exerciseId))
  const [draft, setDraft] = useState<Draft>(() => ({
    rows: buildRows(session),
    rpe: session.rpe,
    durationMin: session.durationMin,
    feeling: session.feeling ?? '',
    fatigue: session.fatigue,
    pain: session.pain,
  }))
  const [error, setError] = useState('')

  const weekPath = week ? `/?semana=${week.mondayISO}` : '/'
  const load = calcSessionLoad(draft.rpe, draft.durationMin)
  const doneCount = draft.rows.filter((r) => r.done).length
  const isOpen = session.status === 'planificada'
  const info = SESSION_TYPE_INFO[session.type]
  // Gimnasio con niveles asignados: se agrupa por Main / Secondary / Accesorio como en la rutina.
  const grouped = session.type === 'gimnasio' && session.plannedExercises.some((p) => p.tier !== undefined)
  const labels = tierLabels(session.plannedExercises)

  // Se guarda con cada cambio: en el gimnasio el móvil se bloquea y la página puede recargarse.
  function change(changes: Partial<Draft>) {
    const next = { ...draft, ...changes }
    setDraft(next)
    setError('')
    updateSession(session.id, toSessionChanges(next))
  }

  function changeRow(index: number, changes: Partial<Row>) {
    change({ rows: draft.rows.map((row, i) => (i === index ? { ...row, ...changes } : row)) })
  }

  async function handleFinish() {
    if (!load) {
      setError('Indica el RPE y la duración para calcular la carga.')
      return
    }
    await updateSession(session.id, { ...toSessionChanges(draft), status: 'hecha' })
    navigate(weekPath)
  }

  async function handleReset(status: 'saltada' | 'planificada') {
    await updateSession(session.id, { ...EMPTY_LOG, status })
    navigate(weekPath)
  }

  function renderRow(i: number) {
    const row = draft.rows[i]
    const planned = session.plannedExercises[i]
    const name = exercisesById.get(row.exerciseId)?.name ?? 'Ejercicio eliminado'
    const plan = formatPlan(planned)
    return (
      <div
        key={i}
        className={`rounded-xl border p-3 transition-colors ${row.done ? 'border-pitch-400/60 bg-pitch-500/10' : 'border-border bg-surface-2'}`}
      >
        <button
          type="button"
          aria-pressed={row.done}
          onClick={() => changeRow(i, { done: !row.done })}
          className="mb-2 flex min-h-12 w-full items-center gap-3 text-left"
        >
          <span
            className={`flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full border-2 px-1 text-lg font-bold transition-all ${
              row.done
                ? 'scale-105 border-pitch-300 bg-gradient-to-b from-pitch-400 to-pitch-600 text-white shadow-[0_0_12px_-2px_rgba(63,189,97,0.8)]'
                : grouped
                  ? `border-transparent bg-gradient-to-b ${TIER_INFO[tierOf(planned)].medal}`
                  : 'border-gold-400/50 text-gold-300'
            }`}
          >
            {row.done ? '✓' : <span className="font-condensed text-lg font-extrabold">{grouped ? labels[i] : i + 1}</span>}
          </span>
          <span className="min-w-0">
            <span className="font-condensed block text-xl leading-tight font-bold text-white uppercase">{name}</span>
            {plan && (
              <span className="block text-xs text-white/55">
                Plan: <b className="text-gold-200">{plan}</b>
              </span>
            )}
            {planned.notes && <span className="block text-xs text-white/50">{planned.notes}</span>}
          </span>
        </button>
        <div className="grid grid-cols-4 gap-2">
          <NumberField label="Series" value={row.setsDone} onChange={(setsDone) => changeRow(i, { setsDone, done: true })} />
          <NumberField label="Reps" value={row.repsDone} onChange={(repsDone) => changeRow(i, { repsDone, done: true })} />
          <NumberField label="Kg" value={row.weightUsedKg} onChange={(weightUsedKg) => changeRow(i, { weightUsedKg, done: true })} />
          <NumberField label="Seg" value={row.timeUsedSec} onChange={(timeUsedSec) => changeRow(i, { timeUsedSec, done: true })} />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24">
      <PageHeader
        kicker={week ? formatDayLong(dayDateForIndex(week.mondayISO, session.dayIndex)) : info.label}
        title={session.title}
        back={{ to: weekPath, label: 'Semana' }}
        aside={
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-b text-3xl shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_4px_10px_rgba(0,0,0,0.5)] ${info.piece}`}
            style={{ filter: `drop-shadow(0 0 10px ${info.glow})` }}
            aria-hidden="true"
          >
            {info.icon}
          </span>
        }
      />

      {session.status === 'saltada' && (
        <p className="mb-4 rounded-lg border border-[#ff6b5b]/40 bg-[#ff6b5b]/10 px-3 py-2 text-sm text-[#ff9a8e]">Marcada como saltada.</p>
      )}

      {draft.rows.length > 0 && (
        <>
          <SectionTitle
            aside={
              <span className="font-condensed text-lg font-bold text-gold-300 tabular-nums">
                {doneCount}/{draft.rows.length}
              </span>
            }
          >
            Ejercicios
          </SectionTitle>
          <div
            className="mb-3 h-2.5 overflow-hidden rounded-full bg-black/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
            role="progressbar"
            aria-label="Ejercicios hechos"
            aria-valuemin={0}
            aria-valuemax={draft.rows.length}
            aria-valuenow={doneCount}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300 shadow-[0_0_10px_rgba(245,181,68,0.6)] transition-[width] duration-500"
              style={{ width: `${(doneCount / draft.rows.length) * 100}%` }}
            />
          </div>
          {grouped ? (
            <div className="mb-6 space-y-5">
              {TIER_ORDER.map((tier) => {
                const indices = draft.rows.map((_, i) => (tierOf(session.plannedExercises[i]) === tier ? i : -1)).filter((i) => i >= 0)
                if (indices.length === 0) return null
                const tierInfo = TIER_INFO[tier]
                const tierDone = indices.filter((i) => draft.rows[i].done).length
                return (
                  <section key={tier} aria-label={tierInfo.label}>
                    <div className="mb-2 flex items-center gap-2.5">
                      <span
                        className={`font-condensed flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b text-xl font-extrabold shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_3px_8px_rgba(0,0,0,0.5)] ${tierInfo.medal}`}
                        aria-hidden="true"
                      >
                        {tierInfo.letter}
                      </span>
                      <p className="font-condensed flex-1 text-xl leading-none font-extrabold text-white uppercase">{tierInfo.label}</p>
                      <span className="font-condensed text-lg font-bold text-white/50 tabular-nums">
                        {tierDone}/{indices.length}
                      </span>
                    </div>
                    <div className="space-y-2">{indices.map((i) => renderRow(i))}</div>
                  </section>
                )
              })}
            </div>
          ) : (
            <div className="mb-6 space-y-2">{draft.rows.map((_, i) => renderRow(i))}</div>
          )}
        </>
      )}

      <SectionTitle>Al terminar</SectionTitle>
      <ScalePicker
        label="RPE (esfuerzo percibido)"
        max={10}
        value={draft.rpe}
        onChange={(rpe) => change({ rpe })}
        hint="1 muy suave · 5 exigente · 10 máximo"
      />
      <Input
        label="Duración (minutos)"
        inputMode="numeric"
        defaultValue={draft.durationMin ?? ''}
        onChange={(e) => {
          const minutes = Number(e.target.value.replace(',', '.'))
          change({ durationMin: Number.isFinite(minutes) && minutes > 0 ? minutes : undefined })
        }}
      />

      <div className="board-frame mb-4 flex items-center justify-between rounded-2xl px-4 py-3">
        <div>
          <p className="kicker">Carga de la sesión</p>
          <p className="text-xs text-white/45">RPE × minutos</p>
        </div>
        <span
          className={`font-condensed text-5xl leading-none font-extrabold tabular-nums ${
            load ? 'text-pitch-400 [text-shadow:0_0_18px_rgba(63,189,97,0.45)]' : 'text-white/25'
          }`}
        >
          {load || '—'}
        </span>
      </div>

      <ScalePicker label="Fatiga" max={5} value={draft.fatigue} onChange={(fatigue) => change({ fatigue })} hint="1 fresco · 5 agotado" />
      <Textarea label="Sensaciones" value={draft.feeling} onChange={(e) => change({ feeling: e.target.value })} placeholder="¿Cómo te has sentido?" />
      <PainPicker initial={draft.pain} onChange={(pain) => change({ pain })} />

      {error && <p className="mb-3 text-sm text-red-300">{error}</p>}

      <Button fullWidth onClick={handleFinish}>
        {session.status === 'hecha' ? 'Guardar y volver' : 'Terminar sesión'}
      </Button>

      <div className="mt-3">
        {isOpen ? (
          <ConfirmButton fullWidth confirmLabel="Pulsa otra vez para saltarla" onConfirm={() => handleReset('saltada')}>
            Saltar sesión
          </ConfirmButton>
        ) : (
          <ConfirmButton fullWidth confirmLabel="Pulsa otra vez: se borra el registro" onConfirm={() => handleReset('planificada')}>
            Volver a planificada
          </ConfirmButton>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-white/40">El progreso se guarda automáticamente.</p>
    </div>
  )
}
