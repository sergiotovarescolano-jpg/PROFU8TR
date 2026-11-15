import { useEffect, useSyncExternalStore } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getConfig, loadToken, subscribeConfig } from '../utils/gcal/state'
import { getSyncStatus, hasLocalChanges, runSync, subscribeSyncStatus } from '../utils/gcal/sync'

const AUTO_SYNC_DELAY_MS = 3000
const POLL_MS = 5 * 60 * 1000

export function useGcalConfig() {
  return useSyncExternalStore(subscribeConfig, getConfig)
}

export function useGcalSyncStatus() {
  return useSyncExternalStore(subscribeSyncStatus, getSyncStatus)
}

/** ¿Hay token válido ahora mismo? (sin abrir ninguna ventana de Google) */
export function useGcalHasToken(): boolean {
  return useSyncExternalStore(subscribeConfig, () => loadToken() !== null)
}

function syncQuietly() {
  runSync({ interactive: false }).catch(() => {
    // el error queda en el estado (useGcalSyncStatus) y se muestra en la interfaz
  })
}

/**
 * Sincronización automática mientras la app está abierta y conectada:
 * - unos segundos después de cada cambio local pendiente de subir,
 * - al volver a la app (para traer lo que se haya tocado en Google),
 * - y cada 5 minutos mientras esté visible.
 * Nunca abre la ventana de Google: si el permiso caducó, la interfaz pide reconectar.
 */
export function useGcalAutoSync(): void {
  const config = useGcalConfig()
  const hasToken = useGcalHasToken()
  const enabled = Boolean(config.enabled && config.clientId && config.calendarId && hasToken)
  const dirty = useLiveQuery(() => (enabled ? hasLocalChanges() : false), [enabled, config])

  useEffect(() => {
    if (!enabled || !dirty) return
    const timer = setTimeout(syncQuietly, AUTO_SYNC_DELAY_MS)
    return () => clearTimeout(timer)
  }, [enabled, dirty])

  useEffect(() => {
    if (!enabled) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncQuietly()
    }
    document.addEventListener('visibilitychange', onVisible)
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') syncQuietly()
    }, POLL_MS)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(timer)
    }
  }, [enabled])
}
