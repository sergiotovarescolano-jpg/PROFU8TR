import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ConfirmButton } from '../ui/ConfirmButton'
import { Input } from '../ui/Field'
import { applyTemplateToWeek, deleteWeekTemplate, saveWeekAsTemplate } from '../../db/weekRepo'
import { useWeekTemplates } from '../../hooks/useRoutines'

interface TemplatesModalProps {
  weekId: number
  sessionCount: number
  onClose: () => void
}

export function TemplatesModal({ weekId, sessionCount, onClose }: TemplatesModalProps) {
  const templates = useWeekTemplates()
  const [name, setName] = useState('')

  async function handleSave() {
    await saveWeekAsTemplate(weekId, name.trim())
    setName('')
  }

  return (
    <Modal open onClose={onClose} title="Plantillas de semana">
      {sessionCount > 0 ? (
        <>
          <Input
            label="Guardar esta semana como plantilla"
            placeholder="Ej. Semana tipo partido en sábado"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button fullWidth disabled={!name.trim()} onClick={handleSave}>
            Guardar plantilla
          </Button>
        </>
      ) : (
        <p className="text-sm text-white/50">Añade sesiones a esta semana para poder guardarla como plantilla.</p>
      )}

      <h3 className="mb-2 mt-5 text-sm font-bold">Aplicar a esta semana</h3>
      {sessionCount > 0 && templates.length > 0 && (
        <p className="mb-2 text-xs text-white/50">Se añaden a las {sessionCount} sesiones que ya tiene la semana.</p>
      )}
      <div className="space-y-2">
        {templates.map((template) => (
          <div key={template.id} className="rounded-xl border border-border bg-surface-2 p-3">
            <p className="font-semibold">{template.name}</p>
            <p className="mb-2 text-sm text-white/50">
              {template.days.length} {template.days.length === 1 ? 'sesión' : 'sesiones'}
            </p>
            <div className="flex gap-2">
              <ConfirmButton onConfirm={() => deleteWeekTemplate(template.id)}>Eliminar</ConfirmButton>
              <Button
                fullWidth
                onClick={async () => {
                  await applyTemplateToWeek(template, weekId)
                  onClose()
                }}
              >
                Aplicar
              </Button>
            </div>
          </div>
        ))}
        {templates.length === 0 && <p className="text-sm text-white/40">Todavía no hay plantillas guardadas.</p>}
      </div>
    </Modal>
  )
}
