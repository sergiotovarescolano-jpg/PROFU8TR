import type { MdTag } from '../types/models'

// Orden cíclico de etiquetas a partir del día de partido (diff = días desde el MD, 0-6).
const TAGS_BY_DIFF: MdTag[] = ['MD', 'MD+1', 'MD+2', 'MD-4', 'MD-3', 'MD-2', 'MD-1']

export function getMdTagForDay(matchDayIndex: number, dayIndex: number): MdTag {
  const diff = (dayIndex - matchDayIndex + 7) % 7
  return TAGS_BY_DIFF[diff]
}

export interface MdTagInfo {
  tag: MdTag
  color: string // clase de fondo Tailwind
  textColor: string
  focus: string
}

export const MD_TAG_INFO: Record<MdTag, Omit<MdTagInfo, 'tag'>> = {
  'MD-4': {
    color: 'bg-red-500/20 border-red-500/40',
    textColor: 'text-red-300',
    focus: 'Fuerza / alta intensidad',
  },
  'MD-3': {
    color: 'bg-orange-500/20 border-orange-500/40',
    textColor: 'text-orange-300',
    focus: 'Resistencia / volumen',
  },
  'MD-2': {
    color: 'bg-yellow-500/20 border-yellow-500/40',
    textColor: 'text-yellow-300',
    focus: 'Velocidad / táctica',
  },
  'MD-1': {
    color: 'bg-sky-500/20 border-sky-500/40',
    textColor: 'text-sky-300',
    focus: 'Activación / poco volumen',
  },
  MD: {
    color: 'bg-pitch-500/25 border-pitch-400/50',
    textColor: 'text-pitch-200',
    focus: 'Día de partido',
  },
  'MD+1': {
    color: 'bg-violet-500/20 border-violet-500/40',
    textColor: 'text-violet-300',
    focus: 'Recuperación / movilidad',
  },
  'MD+2': {
    color: 'bg-teal-500/20 border-teal-500/40',
    textColor: 'text-teal-300',
    focus: 'Carga progresiva / transición',
  },
}

export function getMdTagInfo(tag: MdTag): MdTagInfo {
  return { tag, ...MD_TAG_INFO[tag] }
}
