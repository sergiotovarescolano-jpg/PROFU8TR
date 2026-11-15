import type { SessionType } from '../types/models'

// Cada tipo de sesión es una ficha de un color en la pizarra táctica.
export const SESSION_TYPE_INFO: Record<SessionType, { label: string; icon: string; piece: string; glow: string }> = {
  entreno_equipo: { label: 'Entreno equipo', icon: '⚽', piece: 'from-pitch-300 to-pitch-600', glow: 'rgba(63,189,97,0.55)' },
  gimnasio: { label: 'Gimnasio', icon: '🏋️', piece: 'from-amber-300 to-amber-600', glow: 'rgba(245,158,11,0.5)' },
  carrera: { label: 'Carrera', icon: '🏃', piece: 'from-sky-300 to-sky-600', glow: 'rgba(56,189,248,0.5)' },
  movilidad: { label: 'Movilidad', icon: '🧘', piece: 'from-violet-300 to-violet-600', glow: 'rgba(167,139,250,0.5)' },
  descanso: { label: 'Descanso', icon: '😴', piece: 'from-slate-400 to-slate-600', glow: 'rgba(148,163,184,0.4)' },
}

export const SESSION_TYPE_OPTIONS = Object.entries(SESSION_TYPE_INFO).map(([value, info]) => ({
  value,
  label: `${info.icon} ${info.label}`,
}))
