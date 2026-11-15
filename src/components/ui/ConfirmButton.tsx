import { useState, type ReactNode } from 'react'
import { Button } from './Button'

interface ConfirmButtonProps {
  children: ReactNode
  confirmLabel?: string
  onConfirm: () => void
  fullWidth?: boolean
}

/** Botón destructivo de dos toques: el primero pide confirmación y el segundo ejecuta. */
export function ConfirmButton({ children, confirmLabel = '¿Seguro?', onConfirm, fullWidth }: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false)
  return (
    <Button
      variant="danger"
      fullWidth={fullWidth}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      onBlur={() => setArmed(false)}
    >
      {armed ? confirmLabel : children}
    </Button>
  )
}
