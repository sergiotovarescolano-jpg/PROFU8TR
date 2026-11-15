// Estado de la conexión con Google Calendar. Vive en el navegador, fuera de IndexedDB:
// no forma parte de las copias de seguridad porque depende de cada dispositivo.

const CONFIG_KEY = 'futbol-planner:gcal'
const TOKEN_KEY = 'futbol-planner:gcal-token'

export interface SyncSummary {
  created: number // eventos creados en Google
  updated: number // eventos actualizados en Google
  deleted: number // eventos borrados en Google
  imported: number // sesiones creadas o cambiadas en la app desde Google
  removed: number // sesiones borradas o desvinculadas en la app
}

export interface GcalConfig {
  clientId: string
  enabled: boolean // true tras la primera sincronización correcta; false al desconectar
  calendarId?: string // se conserva al desconectar para reutilizar el mismo calendario
  lastSyncAt?: string
  lastSummary?: SyncSummary
  pendingDeletes: string[] // eventos de sesiones borradas en la app, pendientes de borrar en Google
  matchEvents: Record<string, { eventId: string; hash: string }> // por lunes de la semana
}

const EMPTY: GcalConfig = { clientId: '', enabled: false, pendingDeletes: [], matchEvents: {} }

export function loadConfig(): GcalConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<GcalConfig>) } : { ...EMPTY }
  } catch {
    return { ...EMPTY }
  }
}

const listeners = new Set<() => void>()
let cached = loadConfig()

export function getConfig(): GcalConfig {
  return cached
}

export function saveConfig(changes: Partial<GcalConfig>): void {
  cached = { ...cached, ...changes }
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cached))
  } catch {
    // sin almacenamiento (modo privado): la conexión dura lo que dure la pestaña
  }
  listeners.forEach((l) => l())
}

export function subscribeConfig(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Valor de gcalEventId para una sesión ya registrada cuyo evento se borró en Google:
// se conserva en la app pero no se vuelve a subir al calendario.
export const GCAL_UNLINKED = 'quitada-del-calendario'

export function addPendingDelete(eventId: string): void {
  if (!cached.calendarId || eventId === GCAL_UNLINKED) return
  saveConfig({ pendingDeletes: [...new Set([...cached.pendingDeletes, eventId])] })
}

// El token de acceso dura ~1 h. Se guarda en sessionStorage: sobrevive a recargar la página
// pero no a cerrar la app, y nunca se escribe en disco de forma permanente.
export interface StoredToken {
  accessToken: string
  expiresAt: number
}

export function loadToken(): StoredToken | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY)
    const token = raw ? (JSON.parse(raw) as StoredToken) : null
    return token && token.expiresAt > Date.now() + 60_000 ? token : null
  } catch {
    return null
  }
}

export function saveToken(token: StoredToken | null): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, JSON.stringify(token))
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignorado: sin sessionStorage habrá que reconectar en cada sincronización
  }
  listeners.forEach((l) => l())
}
