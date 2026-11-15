import { useDraggable } from '@dnd-kit/core'
import { Link } from 'react-router-dom'
import { SESSION_TYPE_INFO } from '../../utils/sessionTypeInfo'
import type { Routine } from '../../types/models'

export function RoutineChip({ routine }: { routine: Routine }) {
  const info = SESSION_TYPE_INFO[routine.sessionType ?? 'gimnasio']
  return (
    <span className="piece font-condensed flex items-center gap-2 whitespace-nowrap rounded-full border border-gold-400/30 bg-surface-2 py-1.5 pl-1.5 pr-3 text-base font-bold tracking-wide text-white uppercase">
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b text-sm shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] ${info.piece}`}
        style={{ filter: `drop-shadow(0 0 5px ${info.glow})` }}
      >
        {info.icon}
      </span>
      {routine.name}
    </span>
  )
}

function DraggableRoutine({ routine }: { routine: Routine }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `routine-${routine.id}`,
    data: { routine },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`shrink-0 cursor-grab touch-manipulation select-none transition-opacity ${isDragging ? 'opacity-30' : ''}`}
      style={{ WebkitTouchCallout: 'none' }}
    >
      <RoutineChip routine={routine} />
    </div>
  )
}

/** Bandeja de rutinas: se arrastran hasta un día para crear ahí la sesión. */
export function RoutineTray({ routines }: { routines: Routine[] }) {
  if (routines.length === 0) {
    return (
      <p className="mt-2 text-center text-sm text-white/50">
        Aún no tienes rutinas.{' '}
        <Link to="/rutinas" className="font-medium text-gold-300">
          Crear una
        </Link>
      </p>
    )
  }

  return (
    <div className="mt-2">
      <p className="mb-1.5 text-xs text-white/50">Mantén pulsada una rutina y arrástrala a un día</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {routines.map((routine) => (
          <DraggableRoutine key={routine.id} routine={routine} />
        ))}
      </div>
    </div>
  )
}
