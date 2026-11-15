import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Semana', icon: '📅' },
  { to: '/ejercicios', label: 'Ejercicios', icon: '🏋️' },
  { to: '/rutinas', label: 'Rutinas', icon: '📋' },
  { to: '/estadisticas', label: 'Estadísticas', icon: '📊' },
  { to: '/ajustes', label: 'Ajustes', icon: '⚙️' },
]

/** Barra de cristal: la pestaña activa se enciende como un tubo de neón con su foco encima. */
export function BottomNav() {
  return (
    <nav className="board-frame board-frame--solid fixed inset-x-0 bottom-0 z-40 rounded-t-3xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md px-1">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `font-hud relative flex min-w-0 flex-1 flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-semibold tracking-[0.02em] transition-colors ${
                isActive ? 'text-neon-200 [text-shadow:0_0_8px_rgba(255,159,34,0.85)]' : 'text-white/40 active:text-white/70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Foco: haz de luz que cae sobre la pestaña activa */}
                {isActive && (
                  <span
                    className="pointer-events-none absolute inset-x-1 top-0 h-full rounded-b-2xl bg-[linear-gradient(180deg,rgba(255,159,34,0.22),transparent_75%)]"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`relative flex h-10 w-10 items-center justify-center rounded-2xl text-xl leading-none transition-all duration-300 ${
                    isActive
                      ? 'scale-110 border border-neon-400/80 bg-neon-400/10 shadow-[0_0_16px_-2px_rgba(255,159,34,0.85),inset_0_0_10px_-2px_rgba(255,159,34,0.7)]'
                      : 'border border-transparent grayscale-[0.6]'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="relative max-w-full truncate">{item.label}</span>
                {isActive && (
                  <span className="absolute -top-px h-[3px] w-10 rounded-full bg-neon-300 shadow-[0_0_10px_2px_rgba(255,159,34,0.9)]" aria-hidden="true" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
