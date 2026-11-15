import { Link } from 'react-router-dom'
import { SESSION_TYPE_INFO } from '../../utils/sessionTypeInfo'
import type { Session } from '../../types/models'

interface SessionCardProps {
  session: Session
  onClick: () => void
}

// Verde = hecho (estado); dorado = pendiente de registrar; coral = saltada.
const LOG_LINK: Record<Session['status'], { label: string; className: string }> = {
  planificada: { label: 'Registrar', className: 'border-gold-400/70 bg-gold-400/10 text-gold-200' },
  hecha: { label: '✓ Hecha', className: 'border-pitch-400/50 bg-pitch-500/15 text-pitch-300' },
  saltada: { label: 'Saltada', className: 'border-[#ff6b5b]/40 bg-[#ff6b5b]/10 text-[#ff9a8e]' },
}

export function SessionCard({ session, onClick }: SessionCardProps) {
  const info = SESSION_TYPE_INFO[session.type]
  const link = LOG_LINK[session.status]

  return (
    <div className="piece flex items-stretch gap-2 rounded-xl border border-border bg-surface-2 p-1.5">
      <button onClick={onClick} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 text-left active:scale-[0.98] active:bg-white/5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b text-lg shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_2px_4px_rgba(0,0,0,0.4)] ${info.piece}`}
          style={{ filter: `drop-shadow(0 0 6px ${info.glow})` }}
        >
          {info.icon}
        </span>
        <span className="min-w-0">
          <span className="font-condensed block truncate text-xl leading-tight font-bold text-white uppercase">
            {session.startTime && <span className="mr-1.5 text-gold-300 tabular-nums">{session.startTime}</span>}
            {session.title}
          </span>
          {session.status === 'hecha' && session.loadScore !== undefined ? (
            <span className="block text-xs text-white/55">
              RPE <b className="text-white">{session.rpe}</b> · {session.durationMin} min · carga <b className="text-pitch-300">{session.loadScore}</b>
            </span>
          ) : (
            <span className="block text-xs text-white/45">{info.label}</span>
          )}
        </span>
      </button>
      {session.type !== 'descanso' && (
        <Link
          to={`/sesion/${session.id}`}
          className={`font-condensed flex shrink-0 items-center rounded-lg border px-3 text-base font-bold tracking-wide uppercase active:translate-y-px ${link.className}`}
        >
          {link.label}
        </Link>
      )}
    </div>
  )
}
