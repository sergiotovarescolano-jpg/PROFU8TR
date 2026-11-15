import { addDays, addWeeks, format, isValid, parseISO, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

export const DAY_NAMES_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const DAY_NAMES_SHORT_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** Lunes (ISO) de la semana que contiene `date`, como 'YYYY-MM-DD'. */
export function getMondayISO(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export function todayMondayISO(): string {
  return getMondayISO(new Date())
}

/** Fecha de hoy en formato yyyy-MM-dd, comparable con las de getWeekDates. */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Interpreta el parámetro ?semana= de la URL; null si no es una fecha válida. */
export function parseWeekParam(param: string | null): string | null {
  if (!param || !/^\d{4}-\d{2}-\d{2}$/.test(param)) return null
  const date = parseISO(param)
  return isValid(date) ? getMondayISO(date) : null
}

export function shiftWeek(mondayISO: string, deltaWeeks: number): string {
  return format(addWeeks(parseISO(mondayISO), deltaWeeks), 'yyyy-MM-dd')
}

/** Las 7 fechas (lunes a domingo) de la semana, como 'YYYY-MM-DD'. */
export function getWeekDates(mondayISO: string): string[] {
  const monday = parseISO(mondayISO)
  return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'))
}

export function formatWeekRange(mondayISO: string): string {
  const monday = parseISO(mondayISO)
  const sunday = addDays(monday, 6)
  const sameMonth = monday.getMonth() === sunday.getMonth()
  const startLabel = sameMonth ? format(monday, 'd', { locale: es }) : format(monday, "d 'de' MMMM", { locale: es })
  const endLabel = format(sunday, "d 'de' MMMM", { locale: es })
  return `${startLabel} – ${endLabel}`
}

export function formatDayLong(dateISO: string): string {
  return format(parseISO(dateISO), "EEEE d 'de' MMMM", { locale: es })
}

export function formatDayShort(dateISO: string): string {
  return format(parseISO(dateISO), 'd MMM', { locale: es })
}
