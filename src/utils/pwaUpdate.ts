import { registerSW } from 'virtual:pwa-register'

/*
 * Actualización automática de la app instalada.
 * Con registerType 'autoUpdate', cuando el service worker nuevo toma el control la página se
 * recarga sola con la versión recién publicada. Antes solo se registraba el service worker y la
 * pantalla abierta (o la app instalada en el móvil) seguía enseñando la versión vieja.
 * Además se busca versión nueva al volver a la app y cada 30 minutos con ella abierta.
 */
const CHECK_EVERY_MS = 30 * 60 * 1000

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    const check = () => {
      if (navigator.onLine) registration.update().catch(() => {})
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
    setInterval(check, CHECK_EVERY_MS)
  },
})
