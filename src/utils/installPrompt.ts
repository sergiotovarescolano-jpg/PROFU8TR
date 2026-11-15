// Chrome/Android lanza `beforeinstallprompt` una sola vez y muy pronto: hay que guardarlo al
// arrancar la app para poder ofrecer "Instalar" más tarde desde Ajustes.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e as BeforeInstallPromptEvent
  listeners.forEach((l) => l())
})

window.addEventListener('appinstalled', () => {
  deferred = null
  listeners.forEach((l) => l())
})

export function canPromptInstall(): boolean {
  return deferred !== null
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function promptInstall(): Promise<void> {
  if (!deferred) return
  const event = deferred
  deferred = null
  await event.prompt()
  await event.userChoice
  listeners.forEach((l) => l())
}

export function isRunningInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}
