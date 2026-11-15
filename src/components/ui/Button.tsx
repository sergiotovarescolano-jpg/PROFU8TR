import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
  children: ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-pitch-400 to-pitch-600 text-white shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_10px_18px_-6px_rgba(42,161,74,0.55)] border border-pitch-700/60 active:translate-y-px active:shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_3px_6px_-2px_rgba(42,161,74,0.45)] disabled:from-pitch-900 disabled:to-pitch-900 disabled:text-pitch-500 disabled:shadow-none disabled:border-pitch-800',
  // Secundario en dorado: el color cálido de apoyo; el verde queda para la acción principal.
  secondary:
    'bg-gradient-to-b from-[#2a251e] to-[#1a1714] text-gold-100 border border-gold-400/40 shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_6px_14px_-6px_rgba(0,0,0,0.6)] active:translate-y-px active:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_2px_4px_-2px_rgba(0,0,0,0.5)]',
  ghost: 'bg-transparent text-gold-300 active:bg-white/5',
  danger:
    'bg-gradient-to-b from-red-500/20 to-red-600/10 text-red-300 border border-red-500/40 shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] active:translate-y-px active:from-red-500/30',
}

export function Button({ variant = 'primary', fullWidth, className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`font-condensed min-h-12 rounded-xl px-5 text-lg font-bold tracking-wide uppercase transition-all duration-150 ${VARIANT_CLASSES[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
