import { useEffect, useRef, type CSSProperties } from 'react'
import './appBackground.css'

// Generador determinista: posiciones "aleatorias" pero fijas, no saltan entre renders.
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

// Borde superior de la grada del fondo (en % de la altura de la pantalla) para un x en %:
// algo más alta en los lados (más cerca) y más baja en el centro, como mirar el estadio desde dentro.
const standTop = (x: number) => 28 + 8 * (1 - ((x - 50) / 50) ** 2)

// Flashes de móviles del público: puntos repartidos por la grada que destellan de vez en cuando.
const FLASHES = (() => {
  const rand = seeded(11)
  return Array.from({ length: 22 }, () => {
    const x = 3 + rand() * 94
    const top = standTop(x) + 1.5
    const y = top + rand() * (55 - top)
    const dur = 5 + rand() * 9
    return {
      left: `${x}%`,
      top: `${y}%`,
      '--dur': `${dur}s`,
      '--delay': `${-rand() * dur}s`,
      '--size': `${2 + rand() * 2.5}px`,
    }
  })
})()

// Torres de focos: dos cerca (lados) y dos más lejos (más pequeñas), con su haz hacia el césped.
const TOWERS = [
  { side: 'left', x: 8, top: 7, h: 21, scale: 1, beam: -24 },
  { side: 'right', x: 92, top: 7, h: 21, scale: 1, beam: 24 },
  { side: 'left', x: 30, top: 20, h: 14.6, scale: 0.6, beam: -10 },
  { side: 'right', x: 70, top: 20, h: 14.6, scale: 0.6, beam: 10 },
] as const

/** Fondo de toda la app: estadio de noche visto desde la grada, con focos, público y césped. */
export function AppBackground() {
  const ref = useRef<HTMLDivElement>(null)

  // Paralaje suave con el ratón. En pantallas táctiles no: cada arrastre al hacer scroll movería
  // todo el estadio y el móvil tendría que recomponerlo sin parar. Como mucho un cambio por fotograma.
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        el.style.setProperty('--px', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3))
        el.style.setProperty('--py', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={ref} className="app-bg" aria-hidden="true">
      <div className="app-bg__stage">
        {/* Césped en perspectiva con sus líneas de cal */}
        <div className="app-bg__perspective">
          <div className="app-bg__pitch">
            <div className="app-bg__lines" />
            <div className="app-bg__circle" />
            <div className="app-bg__pool app-bg__pool--left" />
            <div className="app-bg__pool app-bg__pool--right" />
          </div>
        </div>

        {/* Grada del fondo: silueta con el público y la cubierta iluminada */}
        <div className="app-bg__stand-wrap">
          <div className="app-bg__stand" />
        </div>
        {/* Anillo entre el primer y el segundo piso, con lucecitas */}
        <div className="app-bg__tier" />
        {/* Vallas LED publicitarias a pie de campo, con luz que corre */}
        <div className="app-bg__boards">
          <div className="app-bg__boards-run" />
        </div>
        {FLASHES.map((f, i) => (
          <span key={i} className="app-bg__flash" style={f as CSSProperties} />
        ))}

        <div className="app-bg__haze" />

        {/* Torres de focos con su haz de luz cruzando hacia el campo */}
        {TOWERS.map((t, i) => (
          <div
            key={i}
            className={`app-bg__tower app-bg__tower--${t.side}`}
            style={{ left: `${t.x}%`, top: `${t.top}%`, height: `${t.h}%`, '--s': t.scale, '--beam': `${t.beam}deg`, '--i': i } as CSSProperties}
          >
            <div className="app-bg__beam" />
            <div className="app-bg__lamps" />
          </div>
        ))}
      </div>
      <div className="app-bg__veil" />
      <div className="app-bg__grain" />
    </div>
  )
}
