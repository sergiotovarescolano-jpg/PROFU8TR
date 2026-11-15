// Colores de las gráficas, validados contra la superficie oscura de las tarjetas (#16171b):
// el verde de acento de la UI (#3fbd61) es demasiado claro para rellenos de datos en modo oscuro.
export const CHART = {
  series: '#34b057',
  deemphasis: '#1f6b37',
  // Coral, no ámbar: el dorado es ahora el color cálido decorativo de la app y no puede significar "alerta".
  warning: '#ff6b5b',
  surface: '#16171b',
  grid: '#2c2e35',
  axisText: '#898781',
  labelText: '#c3c2b7',
} as const
