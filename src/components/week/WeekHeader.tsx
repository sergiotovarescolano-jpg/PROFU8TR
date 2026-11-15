import type { ReactNode } from 'react'
import { formatWeekRange } from '../../utils/dateUtils'
import { SyncChip } from './SyncChip'

interface WeekHeaderProps {
  mondayISO: string
  isNoMatchWeek: boolean
  onPrevWeek: () => void
  onNextWeek: () => void
  onToggleNoMatchWeek: (value: boolean) => void
  children?: ReactNode
}

const arrowClass =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-full btn-neon-cyan text-2xl active:scale-95'

export function WeekHeader({ mondayISO, isNoMatchWeek, onPrevWeek, onNextWeek, onToggleNoMatchWeek, children }: WeekHeaderProps) {
  return (
    <div className="board-frame board-frame--solid sticky top-0 z-30 rounded-b-3xl px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-2">
        <button onClick={onPrevWeek} aria-label="Semana anterior" className={arrowClass}>
          ‹
        </button>
        <div className="min-w-0 text-center">
          <p className="kicker">Semana</p>
          <h1 className="neon-title mt-0.5 text-[1.85rem] text-balance">{formatWeekRange(mondayISO)}</h1>
        </div>
        <button onClick={onNextWeek} aria-label="Semana siguiente" className={arrowClass}>
          ›
        </button>
      </div>

      <label className="mt-2 flex min-h-10 cursor-pointer items-center justify-center gap-2 text-sm text-white/65">
        <input
          type="checkbox"
          checked={isNoMatchWeek}
          onChange={(e) => onToggleNoMatchWeek(e.target.checked)}
          className="h-5 w-5 accent-[var(--color-neon-400)]"
        />
        Semana sin partido (planificación libre)
      </label>

      <SyncChip />

      {children}
    </div>
  )
}
