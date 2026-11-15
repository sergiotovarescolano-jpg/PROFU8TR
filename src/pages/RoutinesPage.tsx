import { useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { CountBadge, PageHeader } from '../components/ui/PageHeader'
import { breakAtSlashes } from '../utils/breakAtSlashes'
import { tierLabels } from '../utils/exerciseTier'
import { createRoutine } from '../db/routineRepo'
import { useExercisesById } from '../hooks/useExercises'
import { useRoutines } from '../hooks/useRoutines'
import { SESSION_TYPE_INFO } from '../utils/sessionTypeInfo'
import '../components/exercises/library.css'

const PREVIEW_COUNT = 3

export function RoutinesPage() {
  const routines = useRoutines()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const exercisesById = useExercisesById([...new Set(routines.flatMap((r) => r.exercises.map((e) => e.exerciseId)))])

  async function handleCreate() {
    if (!name.trim()) return
    const id = await createRoutine({ name: name.trim(), exercises: [] })
    navigate(`/rutinas/${id}`)
  }

  return (
    <div className="p-4 pb-28">
      <PageHeader kicker="Tu plan" title="Rutinas" aside={<CountBadge value={routines.length} label={routines.length === 1 ? 'rutina' : 'rutinas'} />} />

      <div className="space-y-3">
        {routines.map((routine, i) => {
          const info = SESSION_TYPE_INFO[routine.sessionType ?? 'gimnasio']
          const preview = routine.exercises.slice(0, PREVIEW_COUNT)
          const showTiers = routine.sessionType === 'gimnasio' && routine.exercises.some((e) => e.tier !== undefined)
          const labels = tierLabels(routine.exercises)
          const rest = routine.exercises.length - preview.length
          return (
            <Link
              key={routine.id}
              to={`/rutinas/${routine.id}`}
              className="exercise-front lib-enter relative block overflow-hidden rounded-2xl p-4 pl-5 transition-transform active:scale-[0.98]"
              style={{ '--i': i } as CSSProperties}
            >
              <span className="watermark" aria-hidden="true">
                {info.icon}
              </span>

              <div className="relative flex items-center gap-3">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${info.piece}`}
                  style={{ filter: `drop-shadow(0 0 8px ${info.glow})` }}
                  aria-hidden="true"
                >
                  {info.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-hud text-sm font-bold tracking-[0.18em] text-neon-300 uppercase">{info.label}</p>
                  <p className="font-hud line-clamp-2 text-[1.75rem] leading-[1.05] font-bold break-words text-white uppercase">{breakAtSlashes(routine.name)}</p>
                </div>
                {routine.suggestedTag && (
                  <span className="chalk-label font-hud shrink-0 rounded-lg border border-neon-400/50 bg-neon-400/10 px-2.5 py-1 text-lg font-extrabold text-neon-200">
                    {routine.suggestedTag}
                  </span>
                )}
              </div>

              <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
                {preview.map((item, j) => (
                  <span key={j} className="max-w-full truncate rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium text-white/80">
                    {showTiers && <b className="font-hud mr-1 text-sm text-neon-300">{labels[j]}</b>}
                    {exercisesById.get(item.exerciseId)?.name ?? 'Ejercicio'}
                  </span>
                ))}
                {rest > 0 && <span className="rounded-full border border-neon-400/30 px-2.5 py-1 text-xs text-neon-200">+{rest} más</span>}
                {routine.exercises.length === 0 && <span className="text-xs text-white/45">Sin ejercicios todavía: toca para añadir.</span>}
              </div>
            </Link>
          )
        })}
        {routines.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="text-5xl opacity-50" aria-hidden="true">
              📋
            </span>
            <p className="font-hud text-xl font-bold text-white/75 uppercase">Aún no hay rutinas</p>
            <p className="text-sm text-white/45">Crea la primera, por ejemplo «Gym MD-4» o «Activación MD-1».</p>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          setName('')
          setCreating(true)
        }}
        aria-label="Nueva rutina"
        className="fixed right-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] flex h-14 w-14 items-center justify-center rounded-full btn-neon btn-pulse text-3xl font-bold active:scale-95"
      >
        +
      </button>

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva rutina">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Gym MD-4" />
        <Button fullWidth disabled={!name.trim()} onClick={handleCreate}>
          Crear
        </Button>
      </Modal>
    </div>
  )
}
