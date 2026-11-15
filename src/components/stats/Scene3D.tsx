import { useEffect, useRef, useState, type CSSProperties } from 'react'
import './dashboard3d.css'

export interface Bar3D {
  key: string
  value: number
  tone: 'accent' | 'neutral' | 'ghost'
  label: string // pintado en el suelo, delante de la barra
  sublabel?: string
  ariaLabel: string
}

interface Scene3DProps {
  bars: Bar3D[]
  maxValue: number // valor que corresponde a la altura máxima
  limit?: number | null // altura del plano de sobrecarga, en las mismas unidades
  floorWidth?: number
  selectedKey?: string
  onSelect?: (key: string) => void
  ariaLabel: string
  compact?: boolean // versión pequeña para un bloque del mosaico
}

const TILT_Z_DEFAULT = -24

/** Barras 3D sobre un campo en perspectiva. Se gira arrastrando en horizontal. */
export function Scene3D({ bars, maxValue, limit, floorWidth = 280, selectedKey, onSelect, ariaLabel, compact = false }: Scene3DProps) {
  const maxHeight = compact ? 92 : 135
  const heightFor = (value: number, max: number) => (max > 0 ? Math.round((value / max) * maxHeight) : 0)
  const [tiltZ, setTiltZ] = useState(TILT_Z_DEFAULT)
  const [grown, setGrown] = useState(false)
  const drag = useRef<{ x: number; tilt: number; moved: boolean } | null>(null)
  const justDragged = useRef(false)

  // Las barras crecen desde el suelo al aparecer.
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const slotWidth = floorWidth / bars.length
  const sceneStyle = { '--tilt-z': `${tiltZ}deg`, '--floor-w': `${floorWidth}px` } as CSSProperties

  return (
    <div
      className="scene-3d"
      data-size={compact ? 'compact' : undefined}
      style={sceneStyle}
      role="group"
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, tilt: tiltZ, moved: false }
      }}
      onPointerMove={(e) => {
        if (!drag.current) return
        const dx = e.clientX - drag.current.x
        if (Math.abs(dx) > 6) drag.current.moved = true
        if (drag.current.moved) setTiltZ(Math.max(-70, Math.min(10, drag.current.tilt + dx * 0.35)))
      }}
      onPointerUp={() => {
        justDragged.current = drag.current?.moved ?? false
        drag.current = null
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
      onDoubleClick={() => setTiltZ(TILT_Z_DEFAULT)}
    >
      <div className="floor-3d">
        {limit != null && limit > 0 && (
          <div className="limit-plane-3d" style={{ '--h': `${grown ? heightFor(limit, maxValue) : 0}px` } as CSSProperties} />
        )}

        {bars.map((bar, i) => {
          const h = grown ? heightFor(bar.value, maxValue) : 0
          const selected = bar.key === selectedKey
          return (
            <button
              key={bar.key}
              type="button"
              className="slot-3d"
              style={{ left: i * slotWidth, width: slotWidth }}
              aria-label={bar.ariaLabel}
              aria-pressed={onSelect ? selected : undefined}
              onClick={() => {
                if (justDragged.current) {
                  justDragged.current = false
                  return
                }
                onSelect?.(bar.key)
              }}
            >
              <div className="prism-3d" data-tone={bar.tone} style={{ '--h': `${h}px` } as CSSProperties}>
                {bar.tone === 'accent' && <div className="light-pool" />}
                {h > 0 && <div className="cast-shadow" />}
                <div className="face-back" />
                <div className="face-left" />
                <div className="face-right" />
                <div className="face-front" />
                <div className="face-top" />
              </div>

              {bar.value > 0 && (
                <span
                  className={`billboard-3d font-hud font-bold tabular-nums ${compact ? 'text-[11px]' : 'text-[13px]'} ${selected ? 'text-white' : 'text-white/60'}`}
                  style={{ '--z': `${h + 6}px` } as CSSProperties}
                >
                  {bar.value.toLocaleString('es-ES')}
                </span>
              )}

              <span className="billboard-3d text-center leading-tight" data-anchor="below">
                <span className={`font-hud block font-bold ${compact ? 'text-[11px]' : 'text-[13px]'} ${selected ? 'text-white' : 'text-white/60'}`}>
                  {bar.label}
                </span>
                {bar.sublabel && <span className={`block text-white/40 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>{bar.sublabel}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
