// Colores de las gráficas, validados (dataviz validate_palette, modo oscuro) contra el cristal
// de las tarjetas (#26101a). La serie es el rosa neón de acción, más profundo que el de la UI
// para que funcione como relleno; el límite de sobrecarga va en ámbar oscuro (pasa la prueba de
// daltonismo frente al rosa; el rojo de alerta de la UI no la pasaba).
export const CHART = {
  series: '#d42a6f',
  deemphasis: '#5e1534',
  warning: '#bf7f00',
  surface: '#26101a',
  grid: '#4a2228',
  axisText: '#c09088',
  labelText: '#f2d6cc',
} as const
