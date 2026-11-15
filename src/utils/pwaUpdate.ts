import { registerSW } from 'virtual:pwa-register'

/*
 * Actualización automática de la app instalada.
 * Con registerType 'autoUpdate' el service worker nuevo se instala solo y toma el control de
 * las pestañas abiertas (skipWaiting + clientsClaim). Cuando eso pasa el navegador lanza
 * `controllerchange`: ahí se recarga la página para que enseñe la versión recién publicada.
 * (El aviso propio de vite-plugin-pwa no siempre llegaba: si la versión nueva se instalaba
 * entre dos cargas, la pantalla se quedaba con la vieja hasta recargar a mano.)
 * Además se busca versión nueva al volver a la app y cada 30 minutos con ella abierta.
 */
const CHECK_EVERY_MS = 30 * 60 * 1000

if ('serviceWorker' in navigator) {
  // Solo si ya había una versión controlando la página: en la primera instalación no hace falta recargar.
  const hadController = !!navigator.serviceWorker.controller
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    reloading = true
    window.location.reload()
  })
}

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
