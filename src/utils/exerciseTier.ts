import type { ExerciseTier } from '../types/models'

export const TIER_ORDER: ExerciseTier[] = ['main', 'secondary', 'accessory']

// Podio: oro para el básico, plata para el complementario, bronce para los accesorios.
// La letra es la notación de gimnasio (A1, A2, B1…) que aparece en las medallas.
export const TIER_INFO: Record<ExerciseTier, { label: string; short: string; hint: string; letter: string; medal: string }> = {
  main: {
    label: 'Main lift',
    short: 'Main',
    hint: 'Básico pesado, va primero',
    letter: 'A',
    medal: 'from-[#fff3b0] to-[#e0a800] text-[#2a1d00]',
  },
  secondary: {
    label: 'Secondary lift',
    short: 'Secondary',
    hint: 'Complementa al principal',
    letter: 'B',
    medal: 'from-[#eef0f3] to-[#8d939e] text-[#1b1d21]',
  },
  accessory: {
    label: 'Accesorio',
    short: 'Accesorio',
    hint: 'Prevención, aislamiento, core',
    letter: 'C',
    medal: 'from-[#eab084] to-[#8a4f24] text-[#2a1508]',
  },
}

export function tierOf(item: { tier?: ExerciseTier }): ExerciseTier {
  return item.tier ?? 'accessory'
}

/** Ordena por nivel (main, secondary, accesorio) sin cambiar el orden dentro de cada nivel. */
export function sortByTier<T extends { tier?: ExerciseTier }>(items: T[]): T[] {
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => TIER_ORDER.indexOf(tierOf(a.item)) - TIER_ORDER.indexOf(tierOf(b.item)) || a.i - b.i)
    .map(({ item }) => item)
}

/** Etiqueta A1, A2, B1… de cada posición de la lista, numerando dentro de su nivel. */
export function tierLabels(items: { tier?: ExerciseTier }[]): string[] {
  const counts: Record<ExerciseTier, number> = { main: 0, secondary: 0, accessory: 0 }
  return items.map((item) => {
    const tier = tierOf(item)
    counts[tier] += 1
    return `${TIER_INFO[tier].letter}${counts[tier]}`
  })
}
