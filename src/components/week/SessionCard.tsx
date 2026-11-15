import { Link } from 'react-router-dom'
import { SESSION_TYPE_INFO } from '../../utils/sessionTypeInfo'
import type { Session } from '../../types/models'

interface SessionCardProps {
  session: Session
  onClick: () => void
}

// Tubos de neón: rosa = hecha, ámbar = pendiente de registrar, rojo = saltada.
const LOG_LINK: Record<Session['status'], { label: string; className: string }> = {
  planificada: { label: 'Registrar', className: 'btn-neon-cyan' },
  hecha: { label: '✓ Hecha', className: 'btn-neon' },
  saltada: { label: 'Saltada', className: 'btn-neon-danger' },
}

export function SessionCard({ session, onClick }: SessionCardProps) {
  const info = SESSION_TYPE_INFO[session.type]
  const link = LOG_LINK[session.status]

  return (
    <div className="piece flex items-stretch gap-2 rounded-xl border border-border bg-surface-2 p-1.5">
      <button onClick={onClick} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 text-left active:scale-[0.98] active:bg-white/5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${info.piece}`}
          style={{ filter: `drop-shadow(0 0 6px ${info.glow})` }}
        >
          {info.icon}
        </span>
        <span className="min-w-0">
          <span className="font-hud block truncate text-xl leading-tight font-bold text-white uppercase">
            {session.startTime && <span className="mr-1.5 text-neon-300 tabular-nums">{session.startTime}</span>}
            {session.title}
          </span>
          {session.status === 'hecha' && session.loadScore !== undefined ? (
            <span className="block text-xs text-white/55">
              RPE <b className="text-white">{session.rpe}</b> · {session.durationMin} min · carga <b className="text-pitch-300">{session.loadScore}</b>
            </span>
          ) : session.plannedExercises.length > 0 ? (
            <span className="block text-xs text-white/50">
              {session.title !== info.label && `${info.label} · `}
              {session.plannedExercises.length} {session.plannedExercises.length === 1 ? 'ejercicio' : 'ejercicios'}
            </span>
          ) : session.type === 'descanso' ? (
            <span className="block text-xs text-white/45">{info.label}</span>
          ) : (
            <span className="block text-xs text-neon-300/80">Sin ejercicios · toca para añadir</span>
          )}
        </span>
      </button>
      {session.type !== 'descanso' && (
        <Link
          to={`/sesion/${session.id}`}
          className={`font-hud flex shrink-0 items-center rounded-lg px-3 text-sm font-bold tracking-[0.1em] uppercase ${link.className}`}
        >
          {link.label}
        </Link>
      )}
    </div>
  )
}
