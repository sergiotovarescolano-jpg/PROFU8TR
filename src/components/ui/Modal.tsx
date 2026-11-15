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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-[2px] sm:items-center" onClick={onClose}>
      <div
        className="board-frame animate-snap-in max-h-[90vh] w-full overflow-y-auto rounded-t-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gold-400/40 sm:hidden" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-condensed text-2xl leading-tight font-extrabold text-white uppercase">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-2 text-xl text-white/60 shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] active:translate-y-px"
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
