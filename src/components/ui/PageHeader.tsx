import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { breakAtSlashes } from '../../utils/breakAtSlashes'

interface PageHeaderProps {
  kicker: string
  title: string
  back?: { to: string; label: string }
  aside?: ReactNode // contador, insignia… a la derecha del título
}

/** Cabecera común: antetítulo dorado + título grande en condensada, estilo dorsal. */
export function PageHeader({ kicker, title, back, aside }: PageHeaderProps) {
  return (
    <header className="mt-[env(safe-area-inset-top)] mb-4">
      {back && (
        <Link
          to={back.to}
          className="font-hud mb-1 inline-flex min-h-10 items-center gap-1 text-base font-bold tracking-wide text-neon-300 uppercase active:text-white"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ‹
          </span>
          {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="kicker">{kicker}</p>
          <h1 className="neon-title mt-1 text-[2.8rem] break-words">{breakAtSlashes(title)}</h1>
        </div>
        {aside}
      </div>
    </header>
  )
}

/** Insignia dorada con una cifra grande, para el lado derecho de la cabecera. */
export function CountBadge({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="shrink-0 rounded-2xl border border-neon-400/50 bg-neon-400/[0.07] px-3 py-1.5 text-right shadow-[0_0_18px_-6px_rgba(255,159,34,0.8),inset_0_0_12px_-6px_rgba(255,159,34,0.8)]" aria-live="polite">
      <p className="font-hud text-3xl leading-none font-bold text-neon-200 tabular-nums [text-shadow:0_0_10px_rgba(255,159,34,0.85)]">{value}</p>
      <p className="text-[11px] text-white/55">{label}</p>
    </div>
  )
}

/** Título de sección en condensada con un trazo dorado delante. */
export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="h-5 w-1 rounded-full bg-gradient-to-b from-neon-300 to-flare-500 shadow-[0_0_8px_rgba(255,159,34,0.9)]" aria-hidden="true" />
      <h2 className="font-hud text-lg font-bold tracking-[0.14em] text-white uppercase">{children}</h2>
      {aside && <span className="ml-auto">{aside}</span>}
    </div>
  )
}
