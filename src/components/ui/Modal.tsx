import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b0304]/85 sm:items-center" onClick={onClose}>
      <div
        className="board-frame board-frame--solid animate-snap-in max-h-[90vh] w-full overflow-y-auto rounded-t-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-neon-400/70 shadow-[0_0_10px_rgba(255,159,34,0.9)] sm:hidden" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="neon-title text-[1.95rem]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="btn-neon-cyan flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
