// Genera los iconos PNG de la PWA sin dependencias: dibuja un campo de fútbol con
// supermuestreo (antialiasing) y escribe el PNG a mano con zlib. Uso: npm run icons
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { crc32, deflateSync } from 'node:zlib'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

const BG = [10, 10, 12] // grafito de la app
const FIELD = [31, 128, 57] // pitch-600
const FIELD_STRIPE = [36, 141, 64]
const LINE = [238, 245, 240]

function roundedRect(x, y, left, top, right, bottom, radius) {
  if (x < left || x > right || y < top || y > bottom) return false
  const cx = Math.min(Math.max(x, left + radius), right - radius)
  const cy = Math.min(Math.max(y, top + radius), bottom - radius)
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2
}

/**
 * Color de un punto en coordenadas normalizadas 0-1. `inset` encoge el campo para que quepa
 * en la zona segura de los iconos "maskable" (Android recorta hasta un círculo del 80%).
 */
function sample(x, y, { maskable }) {
  const inset = maskable ? 0.2 : 0.14
  if (!maskable && !roundedRect(x, y, 0, 0, 1, 1, 0.22)) return null
  const left = inset + 0.06
  const right = 1 - inset - 0.06
  const top = inset
  const bottom = 1 - inset
  if (!roundedRect(x, y, left, top, right, bottom, 0.04)) return BG

  const w = (right - left) * 0.035 // grosor de línea relativo al campo
  const stripes = Math.floor(((y - top) / (bottom - top)) * 6) % 2 === 0
  const cx = (left + right) / 2
  const cy = (top + bottom) / 2
  const r = (right - left) * 0.2
  const d = Math.hypot(x - cx, y - cy)
  const pad = w * 1.6
  const inLeft = left + pad
  const inRight = right - pad
  const inTop = top + pad
  const inBottom = bottom - pad
  const boxW = (inRight - inLeft) * 0.28
  const boxH = (inBottom - inTop) * 0.16

  const onLine =
    // banda exterior
    (x >= inLeft && x <= inRight && y >= inTop && y <= inBottom &&
      (x - inLeft < w || inRight - x < w || y - inTop < w || inBottom - y < w)) ||
    // línea de medio campo, círculo central y punto central
    (Math.abs(y - cy) < w / 2 && x >= inLeft && x <= inRight) ||
    Math.abs(d - r) < w / 2 ||
    d < w * 1.3 ||
    // áreas grandes
    (Math.abs(x - cx) <= boxW && ((y >= inTop && y <= inTop + boxH) || (y <= inBottom && y >= inBottom - boxH)) &&
      (boxW - Math.abs(x - cx) < w || Math.abs(y - (inTop + boxH)) < w / 2 || Math.abs(y - (inBottom - boxH)) < w / 2))

  if (onLine) return LINE
  return stripes ? FIELD : FIELD_STRIPE
}

function render(size, opts) {
  const SS = 4 // 4x4 submuestras por píxel
  const rgba = Buffer.alloc(size * size * 4)
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = sample((px + (sx + 0.5) / SS) / size, (py + (sy + 0.5) / SS) / size, opts)
          if (!c) continue
          r += c[0]; g += c[1]; b += c[2]; a += 1
        }
      }
      const i = (py * size + px) * 4
      // Color premultiplicado de vuelta: los bordes semitransparentes no se oscurecen.
      rgba[i] = a ? Math.round(r / a) : 0
      rgba[i + 1] = a ? Math.round(g / a) : 0
      rgba[i + 2] = a ? Math.round(b / a) : 0
      rgba[i + 3] = Math.round((a / (SS * SS)) * 255)
    }
  }
  return rgba
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function encodePng(size, rgba) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bits por canal
  header[9] = 6 // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filtro "none" por fila
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync(OUT_DIR, { recursive: true })
const icons = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon-180.png', size: 180, maskable: true }, // iOS no admite transparencia
]
for (const { file, size, maskable } of icons) {
  writeFileSync(join(OUT_DIR, file), encodePng(size, render(size, { maskable })))
  console.log(`✓ public/icons/${file}`)
}
