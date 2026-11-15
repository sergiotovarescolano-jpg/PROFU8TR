import { GcalAuthError } from './auth'
import { saveToken } from './state'

// Cliente mínimo de la API REST de Google Calendar v3 (sin librerías ni API key: basta el token).
const BASE = 'https://www.googleapis.com/calendar/v3'

export interface GEventTime {
  date?: string | null // 'YYYY-MM-DD' en eventos de día completo
  dateTime?: string | null // RFC 3339 en eventos con hora
  timeZone?: string | null
}

export interface GEvent {
  id: string
  status?: 'confirmed' | 'tentative' | 'cancelled'
  summary?: string
  description?: string
  start?: GEventTime
  end?: GEventTime
  updated?: string
  extendedProperties?: { private?: Record<string, string> }
}

export type GEventInput = Omit<GEvent, 'id' | 'updated' | 'status'>

export class GcalApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new GcalApiError(0, 'Sin conexión con Google Calendar.')
  }
  if (response.status === 401) {
    saveToken(null)
    throw new GcalAuthError('La sesión con Google ha caducado. Vuelve a conectar.')
  }
  if (!response.ok) {
    let detail = ''
    try {
      detail = ((await response.json()) as { error?: { message?: string } }).error?.message ?? ''
    } catch {
      // respuesta sin JSON
    }
    throw new GcalApiError(response.status, detail || `Google Calendar respondió con un error (${response.status}).`)
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

function clearOpposite(time: GEventTime): GEventTime {
  return time.date ? { date: time.date, dateTime: null, timeZone: null } : { ...time, date: null }
}

export function calendarApi(token: string) {
  const cal = (calendarId: string) => `/calendars/${encodeURIComponent(calendarId)}`

  return {
    createCalendar: (summary: string, timeZone: string) =>
      request<{ id: string }>(token, 'POST', '/calendars', { summary, timeZone, description: 'Entrenos y partidos de Fútbol Planner.' }),

    getCalendar: (calendarId: string) => request<{ id: string; summary: string }>(token, 'GET', cal(calendarId)),

    async listEvents(calendarId: string, timeMin: string, timeMax: string): Promise<GEvent[]> {
      const events: GEvent[] = []
      let pageToken: string | undefined
      do {
        const query = new URLSearchParams({ timeMin, timeMax, showDeleted: 'true', singleEvents: 'true', maxResults: '2500' })
        if (pageToken) query.set('pageToken', pageToken)
        const page = await request<{ items?: GEvent[]; nextPageToken?: string }>(token, 'GET', `${cal(calendarId)}/events?${query}`)
        events.push(...(page.items ?? []))
        pageToken = page.nextPageToken
      } while (pageToken)
      return events
    },

    /** Un evento concreto (también si está cancelado); null si ya no existe. */
    async getEvent(calendarId: string, eventId: string): Promise<GEvent | null> {
      try {
        return await request<GEvent>(token, 'GET', `${cal(calendarId)}/events/${encodeURIComponent(eventId)}`)
      } catch (e) {
        if (e instanceof GcalApiError && (e.status === 404 || e.status === 410)) return null
        throw e
      }
    },

    insertEvent: (calendarId: string, event: GEventInput) => request<GEvent>(token, 'POST', `${cal(calendarId)}/events`, event),

    // PATCH fusiona los objetos anidados: al pasar de "con hora" a "día completo" (o al revés)
    // hay que borrar explícitamente la clave contraria con null, o Google rechaza el evento.
    patchEvent: (calendarId: string, eventId: string, event: GEventInput) =>
      request<GEvent>(token, 'PATCH', `${cal(calendarId)}/events/${encodeURIComponent(eventId)}`, {
        ...event,
        ...(event.start ? { start: clearOpposite(event.start) } : {}),
        ...(event.end ? { end: clearOpposite(event.end) } : {}),
      }),

    async deleteEvent(calendarId: string, eventId: string): Promise<void> {
      try {
        await request<void>(token, 'DELETE', `${cal(calendarId)}/events/${encodeURIComponent(eventId)}`)
      } catch (e) {
        // ya borrado en Google: es justo lo que queríamos
        if (!(e instanceof GcalApiError && (e.status === 404 || e.status === 410))) throw e
      }
    },
  }
}

export type CalendarApi = ReturnType<typeof calendarApi>
