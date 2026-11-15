import { useEffect, useRef, type CSSProperties } from 'react'
import './appBackground.css'

const EMBER_COUNT = 12

// Ascuas con posiciones "aleatorias" pero fijas (generador determinista): no saltan entre renders.
const EMBERS = (() => {
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  return Array.from({ length: EMBER_COUNT }, () => {
    const dur = 18 + rand() * 16
    return {
      left: `${rand() * 100}%`,
      size: `${2 + rand() * 3}px`,
      '--dur': `${dur}s`,
      '--delay': `${-rand() * dur}s`, // negativo: arrancan ya repartidas por la pantalla
      '--drift': `${(rand() - 0.5) * 80}px`,
      '--alpha': `${0.2 + rand() * 0.35}`,
    }
  })
})()

/** Fondo 3D de toda la app: estadio de noche con focos cálidos, césped en perspectiva y ascuas. */
export function AppBackground() {
  const ref = useRef<HTMLDivElement>(null)

  // Paralaje suave con el puntero (en móvil, con el dedo). Como mucho un cambio por fotograma.
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
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
        <div className="app-bg__glow" />
        <div className="app-bg__perspective">
          <div className="app-bg__floor">
            <div className="app-bg__grid" />
          </div>
        </div>
        <div className="app-bg__stands" />
        <div className="app-bg__beam app-bg__beam--left" />
        <div className="app-bg__beam app-bg__beam--right" />
        {EMBERS.map(({ left, size, ...vars }, i) => (
          <span key={i} className="app-bg__ember" style={{ left, width: size, height: size, ...vars } as CSSProperties} />
        ))}
      </div>
      <div className="app-bg__veil" />
      <div className="app-bg__grain" />
      <div className="app-bg__lamp app-bg__lamp--left" />
      <div className="app-bg__lamp app-bg__lamp--right" />
    </div>
  )
}
