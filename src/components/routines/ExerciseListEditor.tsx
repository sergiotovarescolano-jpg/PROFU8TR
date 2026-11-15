import { useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '../ui/Button'
import { NumberField } from '../ui/NumberField'
import { ExercisePicker } from './ExercisePicker'
import { useExercisesById } from '../../hooks/useExercises'
import { TIER_INFO, TIER_ORDER, sortByTier, tierLabels, tierOf } from '../../utils/exerciseTier'
import type { ExerciseTier, RoutineExercise } from '../../types/models'

interface ExerciseListEditorProps {
  items: RoutineExercise[]
  onChange: (items: RoutineExercise[]) => void
  // Gimnasio: agrupa en Main lift / Secondary lift / Accesorio y numera A1, B1, C1…
  grouped?: boolean
}

/** Editor de una lista de ejercicios. Lo comparten las rutinas y las sesiones de cada día. */
export function ExerciseListEditor({ items, onChange, grouped = false }: ExerciseListEditorProps) {
  // undefined = selector cerrado; null = añadir sin nivel (lista plana)
  const [pickingTier, setPickingTier] = useState<ExerciseTier | null | undefined>(undefined)
  const exercisesById = useExercisesById(items.map((i) => i.exerciseId))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Incluye la posición porque un mismo ejercicio puede aparecer dos veces en la lista.
  const ids = items.map((item, i) => `${item.exerciseId}:${i}`)
  const labels = tierLabels(items)

  function emit(next: RoutineExercise[]) {
    // En modo agrupado la lista se guarda siempre ordenada: primero main, luego secondary, luego accesorios.
    onChange((grouped ? sortByTier(next) : next).map((item, i) => ({ ...item, order: i })))
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    // Arrastrar solo reordena dentro del bloque; para cambiar de bloque está el selector de nivel.
    if (grouped && tierOf(items[from]) !== tierOf(items[to])) return
    emit(arrayMove(items, from, to))
  }

  function renderRow(item: RoutineExercise, i: number) {
    return (
      <ExerciseRow
        key={ids[i]}
        id={ids[i]}
        badge={grouped ? labels[i] : String(i + 1)}
        tier={grouped ? tierOf(item) : null}
        name={exercisesById.get(item.exerciseId)?.name ?? 'Ejercicio eliminado'}
        item={item}
        onChange={(changes) => emit(items.map((it, j) => (j === i ? { ...it, ...changes } : it)))}
        onRemove={() => emit(items.filter((_, j) => j !== i))}
      />
    )
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {grouped ? (
          <div className="space-y-5">
            {TIER_ORDER.map((tier) => {
              const info = TIER_INFO[tier]
              const indices = items.map((item, i) => (tierOf(item) === tier ? i : -1)).filter((i) => i >= 0)
              return (
                <section key={tier} aria-label={info.label}>
                  <div className="mb-2 flex items-center gap-2.5">
                    <span
                      className={`font-condensed flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b text-xl font-extrabold shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_3px_8px_rgba(0,0,0,0.5)] ${info.medal}`}
                      aria-hidden="true"
                    >
                      {info.letter}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-condensed text-xl leading-none font-extrabold text-white uppercase">{info.label}</p>
                      <p className="text-xs text-white/45">{info.hint}</p>
                    </div>
                    <span className="font-condensed text-lg font-bold text-white/50 tabular-nums">{indices.length}</span>
                  </div>
                  <SortableContext items={indices.map((i) => ids[i])} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">{indices.map((i) => renderRow(items[i], i))}</div>
                  </SortableContext>
                  <button
                    type="button"
                    onClick={() => setPickingTier(tier)}
                    className="font-condensed mt-2 min-h-11 w-full rounded-xl border border-dashed border-gold-400/40 text-base font-bold tracking-wide text-gold-200 uppercase active:scale-[0.98] active:bg-gold-400/10"
                  >
                    + Añadir {info.label.toLowerCase()}
                  </button>
                </section>
              )
            })}
          </div>
        ) : (
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">{items.map((item, i) => renderRow(item, i))}</div>
          </SortableContext>
        )}
      </DndContext>

      {!grouped && (
        <>
          {items.length === 0 && <p className="py-4 text-center text-sm text-white/40">Todavía no hay ejercicios.</p>}
          <Button variant="secondary" fullWidth className="mt-3" onClick={() => setPickingTier(null)}>
            + Añadir ejercicio
          </Button>
        </>
      )}

      {pickingTier !== undefined && (
        <ExercisePicker
          title={pickingTier ? `Añadir ${TIER_INFO[pickingTier].label.toLowerCase()}` : undefined}
          onClose={() => setPickingTier(undefined)}
          onPick={(exercise) =>
            emit([...items, { exerciseId: exercise.id, order: items.length, ...(pickingTier ? { tier: pickingTier } : {}) }])
          }
        />
      )}
    </div>
  )
}

interface ExerciseRowProps {
  id: string
  badge: string
  tier: ExerciseTier | null // null = lista sin niveles
  name: string
  item: RoutineExercise
  onChange: (changes: Partial<RoutineExercise>) => void
  onRemove: () => void
}

function ExerciseRow({ id, badge, tier, name, item, onChange, onRemove }: ExerciseRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  const medal = tier ? TIER_INFO[tier].medal : TIER_INFO.main.medal

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, boxShadow: isDragging ? 'var(--board-shadow-lift)' : 'var(--board-shadow-rest)' }}
      className={`rounded-xl border p-3 transition-colors ${
        isDragging ? 'relative z-10 scale-[1.02] border-gold-400/70 bg-surface-2' : 'border-border bg-surface-2'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Mover ${name}`}
          className="flex h-10 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-xl text-gold-300/70 active:bg-white/5"
        >
          ⠿
        </button>
        <span
          className={`font-condensed flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b px-1 text-base font-extrabold shadow-[0_1px_0_rgba(255,255,255,0.45)_inset] ${medal}`}
          aria-hidden="true"
        >
          {badge}
        </span>
        <p className="font-condensed min-w-0 flex-1 text-xl leading-tight font-bold text-white uppercase">{name}</p>
        <button
          onClick={onRemove}
          aria-label={`Quitar ${name}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-white/50 active:bg-white/10"
        >
          ×
        </button>
      </div>

      {tier && (
        <div className="mb-2 grid grid-cols-3 gap-1 rounded-lg bg-black/30 p-1" role="group" aria-label={`Nivel de ${name}`}>
          {TIER_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tier === t}
              onClick={() => tier !== t && onChange({ tier: t })}
              className={`font-condensed min-h-9 rounded-md text-sm font-bold tracking-wide uppercase transition-colors ${
                tier === t ? `bg-gradient-to-b ${TIER_INFO[t].medal}` : 'text-white/50 active:bg-white/10'
              }`}
            >
              {TIER_INFO[t].short}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Series" value={item.sets} onChange={(sets) => onChange({ sets })} />
        <NumberField label="Reps" value={item.reps} onChange={(reps) => onChange({ reps })} />
        <NumberField label="Peso (kg)" value={item.weightKg} onChange={(weightKg) => onChange({ weightKg })} />
        <NumberField label="Tiempo (s)" value={item.durationSec} onChange={(durationSec) => onChange({ durationSec })} />
        <NumberField label="Descanso (s)" value={item.restSec} onChange={(restSec) => onChange({ restSec })} />
      </div>
      <input
        value={item.notes ?? ''}
        onChange={(e) => onChange({ notes: e.target.value || undefined })}
        placeholder="Notas"
        aria-label={`Notas de ${name}`}
        className="mt-2 min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm placeholder:text-white/35 focus:border-gold-400 focus:outline-none"
      />
    </div>
  )
}
