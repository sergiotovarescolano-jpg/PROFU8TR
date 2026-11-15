import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useSearchParams } from 'react-router-dom'
import { MatchForm, type MatchFormData } from '../components/match/MatchForm'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { WeekHeader } from '../components/week/WeekHeader'
import { DayCard } from '../components/week/DayCard'
import { MatchDayModal } from '../components/week/MatchDayModal'
import { RoutineChip, RoutineTray } from '../components/week/RoutineTray'
import { SessionFormModal, type SessionFormData } from '../components/week/SessionFormModal'
import { TemplatesModal } from '../components/week/TemplatesModal'
import { useRoutines } from '../hooks/useRoutines'
import { useMatchForWeek } from '../hooks/useMatch'
import { useWeek } from '../hooks/useWeek'
import { deleteMatch, saveMatch } from '../db/matchRepo'
import { createRoutine, updateRoutine } from '../db/routineRepo'
import { clearMatchDay, countSessionsInWeek, duplicateWeek, setMatchDay, setNoMatchWeek } from '../db/weekRepo'
import { createSession, deleteSession, updateSession } from '../db/sessionRepo'
import { getWeekDates, parseWeekParam, shiftWeek, todayMondayISO } from '../utils/dateUtils'
import { summarizeWeek } from '../utils/loadCalc'
import { getMdTagForDay, getMdTagInfo } from '../utils/mdTag'
import { SESSION_TYPE_INFO } from '../utils/sessionTypeInfo'
import type { MatchDayInfo, Routine, Session } from '../types/models'

const toolClass =
  'font-hud flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-xs font-bold tracking-[0.12em] uppercase disabled:opacity-35'

export function WeekPage() {
  // La semana vive en la URL: así se conserva al volver de registrar una sesión o de otra pestaña.
  const [searchParams, setSearchParams] = useSearchParams()
  const mondayISO = parseWeekParam(searchParams.get('semana')) ?? todayMondayISO()
  const setMondayISO = (next: string) => setSearchParams({ semana: next }, { replace: true })

  const { week, sessions, loading } = useWeek(mondayISO)
  const match = useMatchForWeek(week?.id ?? null)
  const routines = useRoutines()
  const [matchFormOpen, setMatchFormOpen] = useState(false)

  const [addSessionDay, setAddSessionDay] = useState<number | null>(null)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [matchModalDay, setMatchModalDay] = useState<number | null>(null)
  const [trayOpen, setTrayOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [draggedRoutine, setDraggedRoutine] = useState<Routine | null>(null)
  const [occupiedNextWeekCount, setOccupiedNextWeekCount] = useState<number | null>(null)

  // Ratón directo; en táctil hace falta mantener pulsado para no bloquear el scroll de la bandeja.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  if (loading || !week) {
    return <div className="p-6 text-center text-white/50">Cargando semana…</div>
  }

  const weekId = week.id
  const weekDates = getWeekDates(mondayISO)
  const matchDayIndex = week.isNoMatchWeek ? null : (week.matchDay?.dayIndex ?? null)
  const nextMondayISO = shiftWeek(mondayISO, 1)
  // "Semana sin partido" oculta el partido, así que tampoco suma carga mientras esté activa.
  const countedMatch = week.isNoMatchWeek ? null : match
  const summary = summarizeWeek(sessions, countedMatch)

  async function handleSaveMatch(info: MatchDayInfo) {
    await setMatchDay(weekId, info)
  }

  async function handleSaveMatchRecord(data: MatchFormData) {
    if (!week?.matchDay) return
    await saveMatch({
      ...data,
      weekId,
      date: weekDates[week.matchDay.dayIndex],
      rival: week.matchDay.rival,
      homeAway: week.matchDay.homeAway,
    })
  }

  async function handleSaveSession({ saveToRoutine, ...data }: SessionFormData) {
    let sourceRoutineId = data.sourceRoutineId
    if (saveToRoutine) {
      if (sourceRoutineId) {
        await updateRoutine(sourceRoutineId, { exercises: data.plannedExercises })
      } else {
        sourceRoutineId = await createRoutine({
          name: data.title,
          sessionType: data.type,
          exercises: data.plannedExercises,
        })
      }
    }

    if (editingSession) {
      await updateSession(editingSession.id, { ...data, sourceRoutineId })
    } else if (addSessionDay !== null) {
      await createSession({ weekId, dayIndex: addSessionDay, ...data, sourceRoutineId })
    }
  }

  async function runDuplicate() {
    await duplicateWeek(weekId, nextMondayISO)
    setOccupiedNextWeekCount(null)
    setMondayISO(nextMondayISO)
  }

  async function handleDuplicateClick() {
    const existing = await countSessionsInWeek(nextMondayISO)
    if (existing > 0) setOccupiedNextWeekCount(existing)
    else await runDuplicate()
  }

  function handleDragStart({ active }: DragStartEvent) {
    setDraggedRoutine((active.data.current?.routine as Routine | undefined) ?? null)
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setDraggedRoutine(null)
    const routine = active.data.current?.routine as Routine | undefined
    const dayIndex = over?.data.current?.dayIndex as number | undefined
    if (!routine || dayIndex === undefined) return
    await createSession({
      weekId,
      dayIndex,
      type: routine.sessionType ?? 'gimnasio',
      title: routine.name,
      sourceRoutineId: routine.id,
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggedRoutine(null)}
    >
      <div className="pb-6">
        <WeekHeader
          mondayISO={mondayISO}
          isNoMatchWeek={week.isNoMatchWeek}
          onPrevWeek={() => setMondayISO(shiftWeek(mondayISO, -1))}
          onNextWeek={() => setMondayISO(nextMondayISO)}
          onToggleNoMatchWeek={(value) => setNoMatchWeek(weekId, value)}
        >
          <div className="mt-1 grid grid-cols-3 gap-2">
            <button
              onClick={() => setTrayOpen(!trayOpen)}
              aria-expanded={trayOpen}
              className={`${toolClass} ${
                trayOpen
                  ? 'btn-neon-cyan !bg-neon-400/25 !text-white'
                  : 'btn-neon-cyan'
              }`}
            >
              <span className="text-lg" aria-hidden="true">
                🧩
              </span>
              Rutinas
            </button>
            <button
              onClick={handleDuplicateClick}
              disabled={sessions.length === 0}
              className={`${toolClass} btn-neon-cyan`}
            >
              <span className="text-lg" aria-hidden="true">
                ⧉
              </span>
              Duplicar
            </button>
            <button onClick={() => setTemplatesOpen(true)} className={`${toolClass} btn-neon-cyan`}>
              <span className="text-lg" aria-hidden="true">
                📑
              </span>
              Plantillas
            </button>
          </div>
          {trayOpen && <RoutineTray routines={routines} />}
        </WeekHeader>

        <div className="space-y-3 p-4">
          {(summary.sessionsPlanned > 0 || countedMatch) && (
            <div className="board-frame overflow-hidden rounded-2xl px-4 py-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="kicker">Carga de la semana</p>
                  <p className="font-hud text-5xl leading-none font-extrabold text-pitch-400 tabular-nums [text-shadow:0_0_18px_rgba(245,43,124,0.45)]">
                    {summary.load}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-hud text-3xl leading-none font-extrabold text-white tabular-nums">
                    {summary.sessionsDone}
                    <span className="text-xl text-white/40">/{summary.sessionsPlanned}</span>
                  </p>
                  <p className="text-xs text-white/50">sesiones · {summary.minutes} min</p>
                </div>
              </div>
              {/* Barra de progreso: sesiones hechas sobre planificadas */}
              <div
                className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
                role="progressbar"
                aria-label="Sesiones hechas"
                aria-valuemin={0}
                aria-valuemax={summary.sessionsPlanned}
                aria-valuenow={summary.sessionsDone}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neon-500 to-neon-300 shadow-[0_0_10px_rgba(255,159,34,0.6)] transition-[width] duration-500"
                  style={{ width: `${summary.sessionsPlanned > 0 ? (summary.sessionsDone / summary.sessionsPlanned) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
          {weekDates.map((dateISO, dayIndex) => {
            const mdTag = matchDayIndex !== null ? getMdTagInfo(getMdTagForDay(matchDayIndex, dayIndex)) : null
            const isMatchDay = matchDayIndex === dayIndex
            const matchSummary =
              isMatchDay && week.matchDay
                ? `${week.matchDay.rival || 'Partido'}${week.matchDay.time ? ' · ' + week.matchDay.time : ''} · ${week.matchDay.homeAway === 'casa' ? 'Casa' : 'Fuera'}`
                : undefined

            return (
              <DayCard
                key={dayIndex}
                dayIndex={dayIndex}
                dateISO={dateISO}
                mdTag={mdTag}
                isMatchDay={isMatchDay}
                matchSummary={matchSummary}
                sessions={sessions.filter((s) => s.dayIndex === dayIndex)}
                onAddSession={() => setAddSessionDay(dayIndex)}
                onQuickAdd={(type) => createSession({ weekId, dayIndex, type, title: SESSION_TYPE_INFO[type].label })}
                onClearRest={() =>
                  sessions.filter((s) => s.dayIndex === dayIndex && s.type === 'descanso').forEach((s) => deleteSession(s.id))
                }
                onEditSession={setEditingSession}
                onMarkMatchDay={() => setMatchModalDay(dayIndex)}
                match={countedMatch}
                onRegisterMatch={() => setMatchFormOpen(true)}
              />
            )
          })}
        </div>
      </div>

      <DragOverlay>
        {draggedRoutine && (
          <div className="piece-lift rotate-3">
            <RoutineChip routine={draggedRoutine} />
          </div>
        )}
      </DragOverlay>

      {(addSessionDay !== null || editingSession !== null) && (
        <SessionFormModal
          key={editingSession?.id ?? `new-${addSessionDay}`}
          onClose={() => {
            setAddSessionDay(null)
            setEditingSession(null)
          }}
          initial={editingSession ?? undefined}
          onSave={handleSaveSession}
          onDelete={editingSession ? () => deleteSession(editingSession.id) : undefined}
        />
      )}

      <MatchDayModal
        key={matchModalDay ?? 'closed'}
        open={matchModalDay !== null}
        onClose={() => setMatchModalDay(null)}
        initialDayIndex={matchModalDay ?? 5}
        initial={week.matchDay}
        hasMatchRecord={match !== null}
        onSave={handleSaveMatch}
        onClear={() => clearMatchDay(weekId)}
      />

      {matchFormOpen && (
        <MatchForm
          rival={week.matchDay?.rival ?? ''}
          initial={match}
          onClose={() => setMatchFormOpen(false)}
          onSave={handleSaveMatchRecord}
          onDelete={() => match && deleteMatch(match.id)}
        />
      )}

      {templatesOpen && (
        <TemplatesModal weekId={weekId} sessionCount={sessions.length} onClose={() => setTemplatesOpen(false)} />
      )}

      <Modal
        open={occupiedNextWeekCount !== null}
        onClose={() => setOccupiedNextWeekCount(null)}
        title="La semana siguiente ya tiene sesiones"
      >
        <p className="mb-4 text-sm text-white/70">
          Tiene {occupiedNextWeekCount} {occupiedNextWeekCount === 1 ? 'sesión' : 'sesiones'}. Las de esta semana se
          añadirán a esas, sin borrar nada.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setOccupiedNextWeekCount(null)}>
            Cancelar
          </Button>
          <Button fullWidth onClick={runDuplicate}>
            Añadir
          </Button>
        </div>
      </Modal>
    </DndContext>
  )
}
