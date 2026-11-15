interface ComingSoonPageProps {
  title: string
  phase: string
}

/** Pantalla provisional para secciones que se construyen en una fase posterior. */
export function ComingSoonPage({ title, phase }: ComingSoonPageProps) {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-white/50">Se construye en la {phase}.</p>
    </div>
  )
}
