import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Semana', icon: '📅' },
  { to: '/ejercicios', label: 'Ejercicios', icon: '🏋️' },
  { to: '/rutinas', label: 'Rutinas', icon: '📋' },
  { to: '/estadisticas', label: 'Estadísticas', icon: '📊' },
  { to: '/ajustes', label: 'Ajustes', icon: '⚙️' },
]

export function BottomNav() {
  return (
    <nav className="board-frame fixed inset-x-0 bottom-0 z-40 rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `font-condensed relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[13px] font-bold tracking-normal uppercase transition-colors ${
                isActive ? 'text-gold-300' : 'text-white/45 active:text-white/70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none transition-all ${
                    isActive ? 'scale-110 bg-gold-400/15 shadow-[0_0_14px_rgba(245,181,68,0.5)]' : ''
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
                {isActive && <span className="absolute -top-px h-0.5 w-8 rounded-full bg-gold-400 shadow-[0_0_8px_rgba(245,181,68,0.9)]" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
