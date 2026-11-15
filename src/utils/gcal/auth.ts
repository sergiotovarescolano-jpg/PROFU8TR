import { getConfig, loadToken, saveToken, type StoredToken } from './state'

// Permiso mínimo: crear calendarios propios y gestionar solo los eventos de esos calendarios.
// La app no puede leer ni tocar el resto del calendario del usuario.
export const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created'

const GIS_SRC = 'https://accounts.google.com/gsi/client'

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void
}

interface GoogleOAuth {
  initTokenClient: (config: {
    client_id: string
    scope: string
    callback: (response: TokenResponse) => void
    error_callback?: (error: { type: string; message?: string }) => void
  }) => TokenClient
  hasGrantedAllScopes: (response: TokenResponse, ...scopes: string[]) => boolean
  revoke: (token: string, done?: () => void) => void
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth } }
  }
}

export class GcalAuthError extends Error {}

let gisLoading: Promise<GoogleOAuth> | null = null

/** Carga la librería oficial de Google (Identity Services) solo cuando hace falta. */
function loadGis(): Promise<GoogleOAuth> {
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google.accounts.oauth2)
  if (gisLoading) return gisLoading
  gisLoading = new Promise<GoogleOAuth>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.onload = () => {
      const oauth2 = window.google?.accounts?.oauth2
      if (oauth2) resolve(oauth2)
      else reject(new GcalAuthError('No se pudo cargar el inicio de sesión de Google.'))
    }
    script.onerror = () => {
      gisLoading = null
      reject(new GcalAuthError('Sin conexión con Google. Comprueba internet e inténtalo de nuevo.'))
    }
    document.head.appendChild(script)
  })
  return gisLoading
}

/**
 * Devuelve un token válido. Si no hay uno guardado, abre la ventana de Google: debe llamarse
 * desde un toque del usuario (botón), o el navegador bloqueará la ventana emergente.
 */
export async function getAccessToken({ interactive }: { interactive: boolean }): Promise<string> {
  const stored = loadToken()
  if (stored) return stored.accessToken
  if (!interactive) throw new GcalAuthError('Hay que volver a conectar con Google.')

  const { clientId } = getConfig()
  if (!clientId) throw new GcalAuthError('Falta el Client ID de Google en Ajustes.')
  const oauth2 = await loadGis()

  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: GCAL_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new GcalAuthError(describeAuthError(response.error)))
          return
        }
        if (!oauth2.hasGrantedAllScopes(response, GCAL_SCOPE)) {
          reject(new GcalAuthError('Hace falta aceptar el permiso del calendario para sincronizar.'))
          return
        }
        const token: StoredToken = {
          accessToken: response.access_token,
          expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
        }
        saveToken(token)
        resolve(token.accessToken)
      },
      error_callback: (error) => {
        reject(
          new GcalAuthError(
            error.type === 'popup_closed'
              ? 'Se cerró la ventana de Google antes de terminar.'
              : error.type === 'popup_failed_to_open'
                ? 'El navegador bloqueó la ventana de Google. Permite ventanas emergentes para esta web.'
                : 'No se pudo conectar con Google.',
          ),
        )
      },
    })
    // prompt vacío: si ya diste permiso antes, Google no vuelve a preguntar.
    client.requestAccessToken({ prompt: '' })
  })
}

function describeAuthError(code?: string): string {
  if (code === 'access_denied') return 'Has rechazado el permiso. Sin él no se puede sincronizar.'
  if (code === 'invalid_client' || code === 'unauthorized_client')
    return 'El Client ID no es válido o esta dirección no está autorizada en Google Cloud.'
  return 'Google no ha dado acceso. Revisa el Client ID y vuelve a intentarlo.'
}

/** Revoca el permiso en Google y olvida el token. */
export async function revokeAccess(): Promise<void> {
  const stored = loadToken()
  saveToken(null)
  if (!stored) return
  try {
    const oauth2 = await loadGis()
    await new Promise<void>((resolve) => oauth2.revoke(stored.accessToken, resolve))
  } catch {
    // sin conexión: el token caduca solo en menos de una hora
  }
}
