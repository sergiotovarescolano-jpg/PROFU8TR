import { formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useGcalConfig, useGcalHasToken, useGcalSyncStatus } from '../../hooks/useGcalSync'
import { runSync } from '../../utils/gcal/sync'

/** Estado de Google Calendar en la cabecera de la semana. Tocarlo sincroniza (y reconecta si hace falta). */
export function SyncChip() {
  const config = useGcalConfig()
  const status = useGcalSyncStatus()
  const hasToken = useGcalHasToken()
  if (!config.enabled) return null

  const needsReconnect = status.needsReconnect || !hasToken
  const label = status.running
    ? 'Sincronizando…'
    : needsReconnect
      ? 'Reconectar Google Calendar'
      : status.error
        ? 'Error al sincronizar · reintentar'
        : `Google Calendar · ${config.lastSyncAt ? formatDistanceToNow(parseISO(config.lastSyncAt), { locale: es, addSuffix: true }) : 'pendiente'}`
  const tone =
    needsReconnect || status.error
      ? 'border-[#ff4b3e]/45 bg-[#ff4b3e]/10 text-[#ffc4bc]'
      : 'border-white/10 bg-black/25 text-white/60'

  return (
    <div className="mt-1 flex justify-center">
      <button
        type="button"
        onClick={() => runSync({ interactive: true }).catch(() => {})}
        disabled={status.running}
        title={status.error ?? undefined}
        className={`flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-transform active:scale-95 ${tone}`}
      >
        <span aria-hidden="true" className={status.running ? 'animate-spin' : ''}>
          {status.running ? '↻' : needsReconnect || status.error ? '⚠️' : '📆'}
        </span>
        {label}
      </button>
    </div>
  )
}
