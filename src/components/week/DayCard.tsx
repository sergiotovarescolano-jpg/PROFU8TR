import type { CSSProperties } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { DAY_NAMES_ES, todayISO } from '../../utils/dateUtils'
import { calcMatchLoad } from '../../utils/loadCalc'
import type { MdTagInfo } from '../../utils/mdTag'
import { SESSION_TYPE_INFO } from '../../utils/sessionTypeInfo'
import { DayTypePicker } from './DayTypePicker'
import { SessionCard } from './SessionCard'
import type { Match, Session, SessionType } from '../../types/models'
import './dayPicker.css'

interface DayCardProps {
  dayIndex: number
  dateISO: string
  mdTag: MdTagInfo | null
  isMatchDay: boolean
  matchSummary?: string
  sessions: Session[]
  onAddSession: () => void
  onQuickAdd: (type: SessionType) => void // ficha "¿Qué toca?": crea la sesión al momento
  onClearRest: () => void // quita el descanso y vuelve a las fichas
  onEditSession: (session: Session) => void
  onMarkMatchDay: () => void
  match: Match | null
  onRegisterMatch: () => void
}

function MatchStat({ value, label }: { value: string | number; label: string }) {
  return (
    <span className="flex flex-col items-center">
      <span className="font-hud text-2xl leading-none font-extrabold text-white tabular-nums">{value}</span>
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
  onQuickAdd,
  onClearRest,
  match,
  onEditSession,
  onMarkMatchDay,
  onRegisterMatch,
}: DayCardProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dayIndex}`, data: { dayIndex } })
  const date = parseISO(dateISO)
  const isToday = todayISO() === dateISO
  const hasScore = match?.goalsFor !== undefined && match?.goalsAgainst !== undefined

  // Estado del día: vacío (fichas), descanso (modo noche) o con entreno (teñido de su color).
  const isEmpty = sessions.length === 0
  const isRest = !isEmpty && !isMatchDay && sessions.every((s) => s.type === 'descanso')
  const mainType = sessions.find((s) => s.type !== 'descanso')?.type
  const mainInfo = mainType ? SESSION_TYPE_INFO[mainType] : null
  const dayState = isEmpty ? 'empty' : isRest ? 'rest' : `with-${mainType ?? 'match'}`
  // Color del neón del día: borde y nombre se encienden con el color de lo que toca.
  const neonRgb = isMatchDay ? '245 43 124' : isRest ? '110 190 255' : (mainInfo?.rgb ?? '255 159 34')

  return (
    <div
      ref={setNodeRef}
      className={`board-frame relative overflow-hidden rounded-2xl p-4 transition-all duration-200 ${isRest ? 'day-rest' : ''} ${
        isOver
          ? 'scale-[1.015] border-neon-300/80 shadow-[0_0_0_2px_rgba(255,159,34,0.45),0_20px_36px_-12px_rgba(255,159,34,0.45)]'
          : isMatchDay
            ? 'border-pitch-400/50 shadow-[0_0_0_1px_rgba(245,43,124,0.35),0_0_24px_-4px_rgba(245,43,124,0.45),var(--board-shadow-rest)]'
            : isToday
              ? 'border-ice-400/60 shadow-[0_0_0_1px_rgba(64,220,255,0.35),0_0_24px_-6px_rgba(64,220,255,0.5),var(--board-shadow-rest)]'
              : ''
      }`}
      style={
        {
          boxShadow: isOver || isMatchDay || isToday ? undefined : 'var(--board-shadow-rest)',
          '--edge': neonRgb,
          '--glow-rgb': neonRgb,
        } as CSSProperties
      }
    >
      {/* Tinte e icono gigante del tipo de entreno del día */}
      {mainInfo && !isRest && (
        <>
          <div className="day-tint" style={{ '--glow': mainInfo.glow } as CSSProperties} aria-hidden="true" />
          <span className="day-type-mark" aria-hidden="true">
            {mainInfo.icon}
          </span>
        </>
      )}

      {/* Número del día gigante de fondo */}
      <span className="bg-watermark -top-3 right-2 text-[7.5rem]" aria-hidden="true">
        {format(date, 'd')}
      </span>

      <div className="relative mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="neon-title text-[2.15rem]">{DAY_NAMES_ES[dayIndex]}</p>
            {isToday && (
              <span className="font-hud rounded-md bg-ice-400 px-1.5 py-0.5 text-xs font-bold tracking-[0.15em] text-[#04202b] uppercase shadow-[0_0_12px_rgba(64,220,255,0.9)]">
                Hoy
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs font-medium text-white/50">{format(date, "d 'de' MMMM", { locale: es })}</p>
        </div>
        {mdTag && (
          <div
            className={`chalk-label rounded-lg border px-2.5 py-1 text-right ${mdTag.color} ${
              isMatchDay ? 'shadow-[0_0_14px_-2px_rgba(245,43,124,0.8)]' : ''
            }`}
          >
            <p className={`font-hud text-lg leading-none font-extrabold ${mdTag.textColor}`}>{mdTag.tag}</p>
          </div>
        )}
      </div>

      {mdTag && <p className={`relative mb-3 text-sm font-medium ${mdTag.textColor}`}>{mdTag.focus}</p>}

      {/* Línea de tiza bajo la cabecera */}
      <div
        className="pointer-events-none relative mb-3 h-px"
        style={{ background: 'linear-gradient(90deg, rgb(var(--glow-rgb) / 0.8), rgb(var(--glow-rgb) / 0.15) 60%, transparent)', boxShadow: '0 0 6px rgb(var(--glow-rgb) / 0.7)' }}
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
            <span className="font-hud block truncate text-xl leading-tight font-bold text-white uppercase">{matchSummary}</span>
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
            className="font-hud btn-neon btn-pulse relative mb-3 min-h-12 w-full rounded-xl px-3 text-lg font-bold tracking-[0.08em] uppercase"
          >
            Registrar partido
          </button>
        ))}

      {/* La clave por estado hace que el contenido nuevo entre con animación al elegir */}
      <div key={dayState} className="day-morph relative">
        {isEmpty && !isMatchDay ? (
          <DayTypePicker
            label={isToday ? '¿Qué toca hoy?' : '¿Qué toca?'}
            onPick={(choice) => (choice === 'partido' ? onMarkMatchDay() : onQuickAdd(choice))}
          />
        ) : isRest ? (
          <div className="flex items-center gap-4">
            <span className="day-rest__moon" aria-hidden="true">
              🌙
            </span>
            <div className="min-w-0 flex-1">
              <p className="neon-title neon-title--ice text-[1.75rem]">Día de descanso</p>
              <p className="mt-1 text-sm text-white/60">Recupera: sueño, hidratación y, si te apetece, movilidad suave.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} onClick={() => onEditSession(s)} />
            ))}
          </div>
        )}

        {!(isEmpty && !isMatchDay) && (
          <div className={`flex gap-2 ${isEmpty ? '' : 'mt-3'}`}>
            {isRest ? (
              <>
                <button
                  onClick={onClearRest}
                  className="font-hud btn-neon-cyan min-h-12 flex-1 rounded-xl text-base font-bold tracking-[0.08em] uppercase"
                >
                  ↺ Cambiar
                </button>
                <button
                  onClick={onAddSession}
                  className="font-hud min-h-12 rounded-xl border border-dashed border-white/20 px-4 text-base font-bold tracking-wide text-white/60 uppercase active:scale-[0.98] active:bg-white/5"
                >
                  + Añadir
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onAddSession}
                  className="font-hud min-h-12 flex-1 rounded-xl border border-dashed border-neon-400/60 text-base font-bold tracking-[0.08em] text-neon-200 uppercase transition-all active:scale-[0.98] active:border-solid active:bg-neon-400/15 active:shadow-[0_0_18px_-4px_rgba(255,159,34,0.9)]"
                >
                  + Sesión
                </button>
                {!isMatchDay && (
                  <button
                    onClick={onMarkMatchDay}
                    className="font-hud min-h-12 rounded-xl border border-dashed border-white/20 px-3 text-base font-bold tracking-wide text-white/50 uppercase active:scale-[0.98] active:bg-white/5"
                  >
                    🏆 Partido
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
