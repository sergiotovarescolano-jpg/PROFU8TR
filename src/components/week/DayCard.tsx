import { useDroppable } from '@dnd-kit/core'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { DAY_NAMES_ES, todayISO } from '../../utils/dateUtils'
import { calcMatchLoad } from '../../utils/loadCalc'
import type { MdTagInfo } from '../../utils/mdTag'
import { SessionCard } from './SessionCard'
import type { Match, Session } from '../../types/models'

interface DayCardProps {
  dayIndex: number
  dateISO: string
  mdTag: MdTagInfo | null
  isMatchDay: boolean
  matchSummary?: string
  sessions: Session[]
  onAddSession: () => void
  onEditSession: (session: Session) => void
  onMarkMatchDay: () => void
  match: Match | null
  onRegisterMatch: () => void
}

function MatchStat({ value, label }: { value: string | number; label: string }) {
  return (
    <span className="flex flex-col items-center">
      <span className="font-condensed text-2xl leading-none font-extrabold text-white tabular-nums">{value}</span>
      <span className="text-[10px] tracking-wide text-white/50 uppercase">{label}</span>
    </span>
  )
}

export function DayCard({
  dayIndex,
  dateISO,
  mdTag,
  isMatchDay,
  matchSummary,
  sessions,
  onAddSession,
  match,
  onEditSession,
  onMarkMatchDay,
  onRegisterMatch,
}: DayCardProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dayIndex}`, data: { dayIndex } })
  const date = parseISO(dateISO)
  const isToday = todayISO() === dateISO
  const hasScore = match?.goalsFor !== undefined && match?.goalsAgainst !== undefined

  return (
    <div
      ref={setNodeRef}
      className={`board-frame relative overflow-hidden rounded-2xl p-4 transition-all duration-200 ${
        isOver
          ? 'scale-[1.015] border-gold-300/80 shadow-[0_0_0_2px_rgba(245,181,68,0.45),0_20px_36px_-12px_rgba(245,181,68,0.45)]'
          : isMatchDay
            ? 'border-pitch-400/50 shadow-[0_0_0_1px_rgba(63,189,97,0.35),0_0_24px_-4px_rgba(63,189,97,0.45),var(--board-shadow-rest)]'
            : isToday
              ? 'border-gold-400/60 shadow-[0_0_0_1px_rgba(245,181,68,0.35),var(--board-shadow-rest)]'
              : ''
      }`}
      style={{ boxShadow: isOver || isMatchDay || isToday ? undefined : 'var(--board-shadow-rest)' }}
    >
      {/* Número del día gigante de fondo */}
      <span className="bg-watermark -top-3 right-2 text-[7.5rem]" aria-hidden="true">
        {format(date, 'd')}
      </span>

      <div className="relative mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-condensed text-[1.75rem] leading-none font-extrabold text-white uppercase">{DAY_NAMES_ES[dayIndex]}</p>
            {isToday && (
              <span className="font-condensed rounded-md bg-gold-400 px-1.5 py-0.5 text-xs font-extrabold tracking-wider text-gold-950 uppercase">
                Hoy
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs font-medium text-white/50">{format(date, "d 'de' MMMM", { locale: es })}</p>
        </div>
        {mdTag && (
          <div
            className={`chalk-label rounded-lg border px-2.5 py-1 text-right ${mdTag.color} ${
              isMatchDay ? 'shadow-[0_0_14px_-2px_rgba(63,189,97,0.8)]' : ''
            }`}
          >
            <p className={`font-condensed text-lg leading-none font-extrabold ${mdTag.textColor}`}>{mdTag.tag}</p>
          </div>
        )}
      </div>

      {mdTag && <p className={`relative mb-3 text-sm font-medium ${mdTag.textColor}`}>{mdTag.focus}</p>}

      {/* Línea de tiza bajo la cabecera */}
      <div
        className="pointer-events-none relative mb-3 h-px opacity-40"
        style={{ background: 'repeating-linear-gradient(90deg, var(--chalk) 0 6px, transparent 6px 11px)' }}
      />

      {isMatchDay && matchSummary && (
        <button
          onClick={onMarkMatchDay}
          className="relative mb-2 flex w-full items-center gap-3 rounded-xl border border-pitch-400/35 bg-gradient-to-r from-pitch-500/25 to-pitch-500/5 px-3 py-2.5 text-left active:bg-pitch-500/25"
        >
          <span className="text-3xl" aria-hidden="true">
            ⚽
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold tracking-[0.2em] text-pitch-300 uppercase">Día de partido</span>
            <span className="font-condensed block truncate text-xl leading-tight font-bold text-white uppercase">{matchSummary}</span>
          </span>
          <span className="text-xs font-semibold text-pitch-300">Editar</span>
        </button>
      )}

      {isMatchDay &&
        (match ? (
          <button
            onClick={onRegisterMatch}
            className="relative mb-3 flex min-h-14 w-full items-center justify-around rounded-xl border border-border bg-surface-2 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] active:translate-y-px"
            aria-label="Editar registro del partido"
          >
            {hasScore && <MatchStat value={`${match.goalsFor}-${match.goalsAgainst}`} label="Resultado" />}
            <MatchStat value={match.minutesPlayed} label="Min" />
            <MatchStat value={match.goals} label="Goles" />
            <MatchStat value={match.assists} label="Asist." />
            <MatchStat value={calcMatchLoad(match)} label="Carga" />
          </button>
        ) : (
          <button
            onClick={onRegisterMatch}
            className="font-condensed relative mb-3 min-h-12 w-full rounded-xl border border-pitch-400/60 bg-pitch-500/10 px-3 text-lg font-bold tracking-wide text-pitch-300 uppercase shadow-[0_0_14px_-4px_rgba(63,189,97,0.6)] active:translate-y-px"
          >
            Registrar partido
          </button>
        ))}

      <div className="relative space-y-2">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} onClick={() => onEditSession(s)} />
        ))}
      </div>

      <div className={`relative flex gap-2 ${sessions.length > 0 ? 'mt-3' : ''}`}>
        <button
          onClick={onAddSession}
          className="font-condensed min-h-12 flex-1 rounded-xl border border-dashed border-gold-400/45 text-base font-bold tracking-wide text-gold-200 uppercase active:scale-[0.98] active:bg-gold-400/10"
        >
          + Sesión
        </button>
        {!isMatchDay && (
          <button
            onClick={onMarkMatchDay}
            className="font-condensed min-h-12 rounded-xl border border-dashed border-white/20 px-3 text-base font-bold tracking-wide text-white/50 uppercase active:scale-[0.98] active:bg-white/5"
          >
            ⚽ Partido
          </button>
        )}
      </div>
    </div>
  )
}
