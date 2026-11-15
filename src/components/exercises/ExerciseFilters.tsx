import { EXERCISE_CATEGORY_INFO } from '../../utils/exerciseCategoryInfo'
import type { ExerciseCategory } from '../../types/models'
import './library.css'

export type CategoryFilter = ExerciseCategory | 'todas'

interface ExerciseFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  category: CategoryFilter
  onCategoryChange: (value: CategoryFilter) => void
}

const OPTIONS: { value: CategoryFilter; label: string; icon: string }[] = [
  { value: 'todas', label: 'Todas', icon: '⚽' },
  ...Object.entries(EXERCISE_CATEGORY_INFO).map(([value, info]) => ({ value: value as ExerciseCategory, ...info })),
]

export function ExerciseFilters({ search, onSearchChange, category, onCategoryChange }: ExerciseFiltersProps) {
  return (
    <>
      <div className="relative mb-3">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-neon-300"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Busca ejercicio o músculo…"
          aria-label="Buscar ejercicio o grupo muscular"
          className="min-h-13 w-full rounded-2xl border border-neon-400/25 bg-[#1f0a0d]/85 pr-12 pl-12 text-base placeholder:text-white/35 shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] focus:border-neon-400 focus:shadow-[0_0_0_3px_rgba(255,159,34,0.2)] focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Borrar búsqueda"
            className="absolute top-1/2 right-1.5 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/70 active:scale-90"
          >
            ✕
          </button>
        )}
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-2" role="group" aria-label="Filtrar por categoría">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onCategoryChange(opt.value)}
            aria-pressed={category === opt.value}
            className="cat-chip flex min-h-12 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-[#1f0a0d]/85 py-1 pr-4 pl-1 text-white/75"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-lg" aria-hidden="true">
              {opt.icon}
            </span>
            <span className="font-hud text-lg font-bold tracking-wide uppercase">{opt.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}
