import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
  children: ReactNode
}

// Tubos de neón (index.css): rosa = la acción a hacer (late), ámbar = apoyo, rojo = peligro.
const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'btn-neon btn-pulse',
  secondary: 'btn-neon-cyan',
  ghost: 'bg-transparent text-neon-300 active:bg-neon-400/10 active:[text-shadow:0_0_8px_rgb(34_225_255/0.8)]',
  danger: 'btn-neon-danger',
}

export function Button({ variant = 'primary', fullWidth, className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`font-hud min-h-12 rounded-xl px-5 text-lg font-bold tracking-[0.08em] uppercase ${VARIANT_CLASSES[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
