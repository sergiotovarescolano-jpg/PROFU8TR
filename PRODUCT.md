# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Un único usuario: un jugador de fútbol amateur que entrena varios días por semana y juega
un partido el fin de semana (día variable). Usa la app sobre todo en el vestuario o el
gimnasio, en el móvil, antes/después de entrenar — sesiones cortas, una mano libre, poca
paciencia para interfaces lentas o con texto pequeño.

## Product Purpose

Planificar la carga semanal de entrenamiento alrededor del día de partido (MD-4…MD+2),
registrar lo que realmente se hace en cada sesión (RPE, sensaciones, fatiga, molestias) y
los partidos jugados, y ver la evolución (carga semanal, ratio agudo:crónico, progresión de
peso por ejercicio). Éxito = el usuario lo abre cada día de entreno sin fricción y confía en
los datos para no pasarse de carga.

## Positioning

No es una app de fitness genérica ni un CRM de club: está organizada específicamente
alrededor del día de partido variable de una sola persona, con biblioteca y rutinas propias
editables libremente. Cero coste, cero cuenta, cero servidor — todos los datos viven solo en
su dispositivo.

## Operating Context

Vestuario y gimnasio, con el móvil en la mano, muchas veces con las manos sudadas o entre
series. Offline frecuente (gimnasios con mala cobertura). Sesión de uso típica: 10-30
segundos para marcar un ejercicio hecho o mirar el día de hoy.

## Capabilities and Constraints

- 100% cliente: sin backend, sin BD en la nube, sin claves de API de pago. Datos en
  IndexedDB (Dexie.js), funciona offline, instalable como PWA.
- Stack confirmado: Vite + React + TypeScript + Tailwind CSS, Dexie.js, react-router-dom
  (HashRouter, para desplegar en GitHub Pages/Netlify sin backend), dnd-kit, Recharts,
  date-fns, vite-plugin-pwa.
- Despliegue objetivo: GitHub Pages o Netlify (gratis).
- Integración futura (Fase 6, aún no construida): sincronización bidireccional con Google
  Calendar vía OAuth client-side (sin backend), que el usuario configurará él mismo en
  Google Cloud Console.
- Todo el texto de la interfaz en español.

## Brand Commitments

Sin marca externa que respetar — es una herramienta personal. Nombre de trabajo:
"Fútbol Planner". El verde césped como acento ya está establecido como identidad visual
deseada (ver Fase 0 de la conversación original); el resto de la dirección visual (si el
rediseño la reemplaza o la expande) se decide en new-work, no aquí.

## Evidence on Hand

Sin contenido real que preservar (sin testimonios, casos de cliente, prensa). El propio
código de las Fases 1-2 ya construidas es la evidencia del sistema incumbente: planificador
semanal, biblioteca de ~40 ejercicios de fútbol precargados, rutinas con drag&drop,
registro de sesiones y partidos.

## Product Principles

- La carga de trabajo real (física y cognitiva) manda sobre cualquier adorno visual: una
  mano, pulgar, gimnasio, prisa.
- Editable sin fricción: ejercicios, rutinas y sesiones se tocan y cambian constantemente,
  nunca hay un estado "bloqueado".
- Los datos del usuario no salen de su dispositivo salvo que él mismo los exporte o conecte
  explícitamente un servicio externo (Calendar, Fase 6).
- Coste cero y cero dependencia de infraestructura ajena es un principio de producto, no
  solo técnico: el usuario no quiere una cuenta ni una suscripción más.

## Accessibility & Inclusion

Sin requisito de accesibilidad específico confirmado por el usuario más allá de lo ya
pedido: texto claro y grande, botones grandes para una sola mano (uso en vestuario/gym).
