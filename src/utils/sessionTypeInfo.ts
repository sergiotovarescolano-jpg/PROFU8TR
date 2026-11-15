import type { SessionType } from '../types/models'

// Cada tipo de sesión es un orbe de neón de un color cálido (clases .orb--* en index.css). Descanso va en azul hielo: la noche, el único tipo frío.
// `glow` es el mismo color en rgba (tintes, halos) y `rgb` en tripleta (bordes y títulos del día).
export const SESSION_TYPE_INFO: Record<SessionType, { label: string; icon: string; piece: string; glow: string; rgb: string }> = {
  entreno_equipo: { label: 'Entreno equipo', icon: '⚽', piece: 'orb orb--equipo', glow: 'rgba(255,64,80,0.6)', rgb: '255 64 80' },
  gimnasio: { label: 'Gimnasio', icon: '🏋️', piece: 'orb orb--gimnasio', glow: 'rgba(255,138,31,0.6)', rgb: '255 138 31' },
  carrera: { label: 'Carrera', icon: '🏃', piece: 'orb orb--carrera', glow: 'rgba(255,214,64,0.6)', rgb: '255 214 64' },
  movilidad: { label: 'Movilidad', icon: '🧘', piece: 'orb orb--movilidad', glow: 'rgba(255,79,208,0.6)', rgb: '255 79 208' },
  descanso: { label: 'Descanso', icon: '😴', piece: 'orb orb--descanso', glow: 'rgba(110,190,255,0.5)', rgb: '110 190 255' },
}

export const SESSION_TYPE_OPTIONS = Object.entries(SESSION_TYPE_INFO).map(([value, info]) => ({
  value,
  label: `${info.icon} ${info.label}`,
}))
