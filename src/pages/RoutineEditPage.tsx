import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ExerciseListEditor } from '../components/routines/ExerciseListEditor'
import { ConfirmButton } from '../components/ui/ConfirmButton'
import { Input, Select } from '../components/ui/Field'
import { PageHeader, SectionTitle } from '../components/ui/PageHeader'
import { deleteRoutine, updateRoutine } from '../db/routineRepo'
import { useRoutine } from '../hooks/useRoutines'
import { MD_TAG_INFO } from '../utils/mdTag'
import { SESSION_TYPE_INFO, SESSION_TYPE_OPTIONS } from '../utils/sessionTypeInfo'
import type { MdTag, Routine, SessionType } from '../types/models'

const TAG_OPTIONS = [
  { value: '', label: 'Sin etiqueta' },
  ...Object.entries(MD_TAG_INFO).map(([tag, info]) => ({ value: tag, label: `${tag} · ${info.focus}` })),
]

export function RoutineEditPage() {
  const id = Number(useParams().id)
  const routine = useRoutine(id)

  if (routine === undefined) return <div className="p-6 text-center text-white/50">Cargando rutina…</div>
  if (routine === null) {
    return (
      <div className="p-6 text-center text-white/50">
        Esta rutina ya no existe.{' '}
        <Link to="/rutinas" className="text-gold-300">
          Volver a rutinas
        </Link>
      </div>
    )
  }
  return <RoutineEditor key={routine.id} routine={routine} />
}

// El borrador local solo se inicializa al montar: cada cambio se guarda al momento y no se
// recarga desde la BD, para que la consulta en vivo no pise lo que se está escribiendo.
function RoutineEditor({ routine }: { routine: Routine }) {
  const navigate = useNavigate()
  const [name, setName] = useState(routine.name)
  const [tag, setTag] = useState(routine.suggestedTag ?? '')
  const [sessionType, setSessionType] = useState<SessionType>(routine.sessionType ?? 'gimnasio')
  const [exercises, setExercises] = useState(routine.exercises)

  return (
    <div className="p-4 pb-24">
      <PageHeader
        kicker={`Rutina · ${SESSION_TYPE_INFO[sessionType].label}`}
        title={name.trim() || routine.name}
        back={{ to: '/rutinas', label: 'Rutinas' }}
        aside={
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-b text-3xl shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_4px_10px_rgba(0,0,0,0.5)] ${SESSION_TYPE_INFO[sessionType].piece}`}
            style={{ filter: `drop-shadow(0 0 10px ${SESSION_TYPE_INFO[sessionType].glow})` }}
            aria-hidden="true"
          >
            {SESSION_TYPE_INFO[sessionType].icon}
          </span>
        }
      />

      <Input
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const trimmed = name.trim() || routine.name
          setName(trimmed)
          updateRoutine(routine.id, { name: trimmed })
        }}
      />
      <Select
        label="Tipo de sesión"
        value={sessionType}
        onChange={(e) => {
          const next = e.target.value as SessionType
          setSessionType(next)
          updateRoutine(routine.id, { sessionType: next })
        }}
        options={SESSION_TYPE_OPTIONS}
      />
      <Select
        label="Etiqueta sugerida"
        value={tag}
        onChange={(e) => {
          setTag(e.target.value as MdTag | '')
          updateRoutine(routine.id, { suggestedTag: (e.target.value as MdTag) || undefined })
        }}
        options={TAG_OPTIONS}
      />

      <div className="mt-6">
        <SectionTitle aside={<span className="font-condensed text-lg font-bold text-gold-300">{exercises.length}</span>}>Ejercicios</SectionTitle>
      </div>
      <ExerciseListEditor
        grouped={sessionType === 'gimnasio'}
        items={exercises}
        onChange={(next) => {
          setExercises(next)
          updateRoutine(routine.id, { exercises: next })
        }}
      />

      <p className="mt-4 text-center text-xs text-white/40">Los cambios se guardan automáticamente.</p>

      <div className="mt-6">
        <ConfirmButton
          fullWidth
          confirmLabel="Pulsa otra vez para eliminar"
          onConfirm={async () => {
            await deleteRoutine(routine.id)
            navigate('/rutinas')
          }}
        >
          Eliminar rutina
        </ConfirmButton>
      </div>
    </div>
  )
}
