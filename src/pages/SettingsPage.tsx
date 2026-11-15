import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '../components/ui/Button'
import { ConfirmButton } from '../components/ui/ConfirmButton'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { GoogleCalendarSection } from '../components/settings/GoogleCalendarSection'
import { downloadBackup, getLastExportDate, parseBackup, resetAllData, restoreBackup, type BackupFile } from '../utils/exportImport'
import { canPromptInstall, isRunningInstalled, promptInstall, subscribeInstallPrompt } from '../utils/installPrompt'

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="board-frame relative mb-4 overflow-hidden rounded-2xl p-4">
      <span className="bg-watermark -right-2 -bottom-4 text-[5.5rem] opacity-60 grayscale" aria-hidden="true">
        {icon}
      </span>
      <div className="relative mb-2 flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full emblem text-xl"
          aria-hidden="true"
        >
          {icon}
        </span>
        <h2 className="font-hud text-2xl font-bold text-white uppercase">{title}</h2>
      </div>
      <div className="relative">{children}</div>
    </section>
  )
}

function describeLastExport(iso: string | null): string {
  if (!iso) return 'Todavía no has hecho ninguna copia.'
  const date = parseISO(iso)
  const days = differenceInCalendarDays(new Date(), date)
  const when = days === 0 ? 'hoy' : days === 1 ? 'ayer' : `hace ${days} días`
  return `Última copia: ${when} (${format(date, "d 'de' MMMM", { locale: es })}).`
}

export function SettingsPage() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [lastExport, setLastExport] = useState(getLastExportDate())
  const [pending, setPending] = useState<BackupFile | null>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [persistRefused, setPersistRefused] = useState(false)
  const canInstall = useSyncExternalStore(subscribeInstallPrompt, canPromptInstall)
  const installed = isRunningInstalled()

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted)
  }, [])

  async function handleExport() {
    await downloadBackup()
    setLastExport(getLastExportDate())
    setMessage({ kind: 'ok', text: 'Copia descargada. Guárdala fuera del móvil (Drive, correo…).' })
  }

  async function handleFile(file: File) {
    setMessage(null)
    try {
      setPending(parseBackup(await file.text()))
    } catch (e) {
      setMessage({ kind: 'error', text: (e as Error).message })
    }
  }

  async function handleRestore() {
    if (!pending) return
    try {
      await restoreBackup(pending)
      setMessage({ kind: 'ok', text: 'Datos importados.' })
    } catch (e) {
      setMessage({ kind: 'error', text: (e as Error).message })
    }
    setPending(null)
  }

  async function handleReset() {
    await resetAllData()
    setMessage({ kind: 'ok', text: 'Datos borrados. La app está vacía, como recién instalada.' })
  }

  async function handlePersist() {
    const granted = (await navigator.storage?.persist?.()) ?? false
    setPersisted(granted)
    setPersistRefused(!granted)
  }

  const counts = pending?.data

  return (
    <div className="p-4 pb-24">
      <PageHeader kicker="Tu app y tus datos" title="Ajustes" />

      {message && (
        <p
          role="status"
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            message.kind === 'ok' ? 'border-pitch-400/40 bg-pitch-500/10 text-pitch-200' : 'border-red-500/40 bg-red-500/10 text-red-200'
          }`}
        >
          {message.text}
        </p>
      )}

      <Section title="Copia de seguridad" icon="💾">
        <p className="mb-3 text-sm text-white/60">
          Tus datos solo viven en este dispositivo. Exporta una copia de vez en cuando y, si cambias de móvil, impórtala en el nuevo.
        </p>
        <p className="mb-3 text-sm text-white/50">{describeLastExport(lastExport)}</p>
        <div className="flex flex-col gap-2">
          <Button fullWidth onClick={handleExport}>
            Exportar datos (JSON)
          </Button>
          <Button variant="secondary" fullWidth onClick={() => fileInput.current?.click()}>
            Importar copia…
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) handleFile(file)
            }}
          />
        </div>
      </Section>

      <Section title="Google Calendar" icon="📆">
        <GoogleCalendarSection />
      </Section>

      <Section title="Instalar la app" icon="📲">
        {installed ? (
          <p className="text-sm text-white/60">Ya la estás usando instalada. Funciona sin conexión.</p>
        ) : canInstall ? (
          <>
            <p className="mb-3 text-sm text-white/60">Añádela a la pantalla de inicio para abrirla como una app y usarla sin conexión.</p>
            <Button fullWidth onClick={() => promptInstall()}>
              Instalar
            </Button>
          </>
        ) : (
          <div className="space-y-1 text-sm text-white/60">
            <p>
              <span className="font-semibold text-white">iPhone (Safari):</span> botón Compartir → «Añadir a pantalla de inicio».
            </p>
            <p>
              <span className="font-semibold text-white">Android (Chrome):</span> menú ⋮ → «Instalar aplicación» o «Añadir a pantalla
              de inicio».
            </p>
          </div>
        )}
      </Section>

      <Section title="Proteger los datos" icon="🛡️">
        {persisted ? (
          <p className="text-sm text-white/60">El navegador no borrará tus datos aunque el móvil se quede sin espacio.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-white/60">
              Si el móvil se queda sin espacio, el navegador puede borrar datos de webs. Pide que los de esta app se conserven.
            </p>
            <Button variant="secondary" fullWidth onClick={handlePersist} disabled={!navigator.storage?.persist}>
              Proteger datos
            </Button>
            {persistRefused && (
              <p className="mt-2 text-xs text-white/40">
                Si el navegador lo rechaza, suele concederlo cuando la app está instalada. Mientras tanto, exporta copias.
              </p>
            )}
          </>
        )}
      </Section>

      <Section title="Borrar todo" icon="🧹">
        <p className="mb-3 text-sm text-white/60">
          Elimina semanas, sesiones, partidos, rutinas, plantillas y tus ejercicios: la app queda vacía. No se puede
          deshacer: exporta antes una copia si la quieres conservar.
        </p>
        <ConfirmButton fullWidth confirmLabel="Pulsa otra vez para borrarlo todo" onConfirm={handleReset}>
          Borrar todos los datos
        </ConfirmButton>
      </Section>

      <p className="text-center text-xs text-white/30">Fútbol Planner · todo se guarda en este dispositivo</p>

      <Modal open={pending !== null} onClose={() => setPending(null)} title="¿Importar esta copia?">
        {counts && (
          <>
            <p className="mb-2 text-sm text-white/70">
              {pending.exportedAt && `Copia del ${format(parseISO(pending.exportedAt), "d 'de' MMMM yyyy", { locale: es })}. `}
              Sustituirá <span className="font-semibold text-white">todos</span> tus datos actuales por:
            </p>
            <ul className="mb-4 space-y-0.5 text-sm text-white/70">
              <li>{counts.weeks.length} semanas y {counts.sessions.length} sesiones</li>
              <li>{counts.matches.length} partidos</li>
              <li>
                {counts.routines.length} rutinas, {counts.weekTemplates.length} plantillas y {counts.exercises.length} ejercicios
              </li>
            </ul>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setPending(null)}>
                Cancelar
              </Button>
              <Button fullWidth onClick={handleRestore}>
                Importar
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
