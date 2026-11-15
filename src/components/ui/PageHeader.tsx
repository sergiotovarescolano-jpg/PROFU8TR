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
    <header className="mb-4">
      {back && (
        <Link
          to={back.to}
          className="font-condensed mb-1 inline-flex min-h-10 items-center gap-1 text-base font-bold tracking-wide text-gold-300 uppercase active:text-gold-200"
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
          <h1 className="font-condensed text-[2.75rem] leading-[0.92] font-extrabold break-words text-white uppercase">{breakAtSlashes(title)}</h1>
        </div>
        {aside}
      </div>
    </header>
  )
}

/** Insignia dorada con una cifra grande, para el lado derecho de la cabecera. */
export function CountBadge({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="shrink-0 rounded-2xl border border-gold-400/30 bg-gold-400/10 px-3 py-1.5 text-right" aria-live="polite">
      <p className="font-condensed text-3xl leading-none font-extrabold text-gold-300 tabular-nums">{value}</p>
      <p className="text-[11px] text-white/55">{label}</p>
    </div>
  )
}

/** Título de sección en condensada con un trazo dorado delante. */
export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="h-5 w-1 rounded-full bg-gradient-to-b from-gold-300 to-gold-600" aria-hidden="true" />
      <h2 className="font-condensed text-xl font-bold tracking-wide text-white uppercase">{children}</h2>
      {aside && <span className="ml-auto">{aside}</span>}
    </div>
  )
}
