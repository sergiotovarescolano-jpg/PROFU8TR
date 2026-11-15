# Fútbol Planner

PWA 100% cliente (sin backend, coste cero) para planificar y registrar los entrenamientos
semanales de fútbol alrededor del día de partido. Todos los datos se guardan en el propio
dispositivo (IndexedDB vía Dexie.js) y la app funciona offline.

## Estado del proyecto

Construcción por fases:

- [x] Fase 1 — base del proyecto, Dexie y planificador semanal con día de partido
- [x] Fase 2 — biblioteca de ejercicios, rutinas, retoque por día, duplicar semana y plantillas
- [x] Fase 3 — registro de sesiones y partidos, carga semanal (RPE × minutos)
- [x] Fase 4 — estadísticas, exportar/importar y PWA (manifest, service worker, iconos)
- [x] Fase 5 — despliegue gratuito (GitHub Pages o Netlify, pasos más abajo)
- [x] Fase 6 — sincronización bidireccional con Google Calendar (pasos más abajo)

## Desarrollo local

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (por defecto `http://localhost:5173`).

```bash
npm run build    # compila a dist/
npm run preview  # sirve el build de producción en local (con service worker)
npm run icons    # regenera los iconos PNG de public/icons (ya incluidos en el repo)
```

El service worker solo se activa en el build de producción (`npm run build` + `npm run preview`),
no en `npm run dev`.

## Publicarla gratis

Dos opciones, las dos gratuitas y sin tarjeta. **Elige una y quédate con ella**: los datos se
guardan por dirección web, así que si cambias de dirección más adelante tendrás que exportar
la copia en la antigua e importarla en la nueva. La sincronización con Google Calendar también
se configura para una dirección concreta (hay que añadirla como origen autorizado).

### Opción A — GitHub Pages (recomendada)

Se publica sola cada vez que subes cambios. Dirección final:
`https://TU_USUARIO.github.io/futbol-planner/`

1. Crea una cuenta en <https://github.com> si no la tienes.
2. Entra en <https://github.com/new>:
   - **Repository name:** `futbol-planner`
   - **Public** (GitHub Pages gratis exige repositorio público: se ve el código, nunca tus datos,
     que no salen de tu móvil).
   - No marques README, .gitignore ni licencia: el proyecto ya los trae.
   - Pulsa **Create repository**.
3. Abre una terminal en la carpeta del proyecto y ejecuta (cambia `TU_USUARIO`):

   ```bash
   git init
   git add .
   git commit -m "Primera versión"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/futbol-planner.git
   git push -u origin main
   ```

   La primera vez, Windows abre el navegador para que inicies sesión en GitHub.
4. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. Ve a la pestaña **Actions**. Si la primera ejecución sale en rojo es normal: se lanzó antes
   del paso 4. Entra en **Desplegar en GitHub Pages → Run workflow → Run workflow**.
6. Cuando salga en verde (1–2 minutos), abre `https://TU_USUARIO.github.io/futbol-planner/`
   en el móvil e instálala (instrucciones en Ajustes de la propia app).

**Actualizar:** después de cualquier cambio,

```bash
git add .
git commit -m "Describe el cambio"
git push
```

GitHub vuelve a publicar en 1–2 minutos. La app instalada se actualiza sola: si no ves el
cambio, ciérrala del todo y vuelve a abrirla.

### Opción B — Netlify

Dirección final: `https://NOMBRE.netlify.app` (el nombre lo eliges tú en Netlify).

**Con GitHub** (se publica sola en cada `git push`): haz los pasos 1–3 de la opción A, entra en
<https://app.netlify.com>, **Add new site → Import an existing project → GitHub**, elige
`futbol-planner` y pulsa **Deploy**. La configuración la lee de `netlify.toml`. Con Netlify el
repositorio puede ser privado.

**Sin GitHub** (subida manual): ejecuta `npm run build`, inicia sesión en
<https://app.netlify.com/drop> y arrastra la carpeta `dist`. Para actualizar, vuelve a hacer el
build y arrastra `dist` en la pestaña **Deploys** de tu sitio. Sin sesión iniciada, el sitio se
borra a la hora.

### Qué hay ya preparado

- `.github/workflows/deploy.yml`: instala, compila y publica en GitHub Pages en cada push a `main`.
- `netlify.toml`: comando de build, carpeta `dist`, Node 22 y cabeceras para que las
  actualizaciones del service worker lleguen enseguida.
- `base: './'` y rutas con `#`: la app funciona igual en la raíz de un dominio que en una
  subcarpeta, sin configuración extra ni página 404.

## Google Calendar

La app crea en tu cuenta un calendario propio, **«Fútbol Planner»**, y lo mantiene sincronizado
en los dos sentidos. Solo pide el permiso `calendar.app.created`: puede crear ese calendario y
gestionar sus eventos, pero **no puede ver ni tocar el resto de tu calendario**. Todo es gratis:
no hace falta tarjeta ni cuenta de facturación en Google Cloud.

### 1. Crear el Client ID (una sola vez, unos 10 minutos)

1. Entra en <https://console.cloud.google.com/> con tu cuenta de Google y crea un proyecto
   nuevo (selector de proyectos arriba → **Proyecto nuevo** → nombre `Futbol Planner` → **Crear**).
2. Activa la API: abre
   <https://console.cloud.google.com/apis/library/calendar-json.googleapis.com> con ese proyecto
   seleccionado y pulsa **Habilitar**.
3. Abre **Google Auth Platform** (<https://console.cloud.google.com/auth/overview>) → **Empezar**:
   - **Nombre de la aplicación:** `Fútbol Planner`; **correo de asistencia:** el tuyo.
   - **Audiencia:** **Externo**.
   - **Información de contacto:** tu correo → acepta la política → **Crear**.
4. En **Audiencia** → **Usuarios de prueba** → **Añadir usuarios** → tu Gmail → **Guardar**.
   La app se queda en modo «Prueba»: solo la puedes usar tú y Google no exige verificarla.
5. En **Acceso a datos** → **Añadir o quitar permisos** → busca `calendar.app.created`
   («Crear calendarios secundarios de Google…») → márcalo → **Actualizar** → **Guardar**.
6. En **Clientes** → **Crear cliente**:
   - **Tipo de aplicación:** Aplicación web. **Nombre:** `Fútbol Planner web`.
   - **Orígenes de JavaScript autorizados** → **Añadir URI**, uno por cada dirección donde uses la
     app, **sin ruta ni barra final**:
     - GitHub Pages: `https://TU_USUARIO.github.io` (sin `/futbol-planner`)
     - Netlify: `https://NOMBRE.netlify.app`
     - En tu ordenador, para probar: `http://localhost:5173`
     La propia app te muestra el origen exacto (con botón **Copiar**) en Ajustes → Google Calendar.
   - **URIs de redirección:** déjalo vacío. Pulsa **Crear**.
7. Copia el **ID de cliente** (termina en `.apps.googleusercontent.com`). El secreto de cliente
   no hace falta: no lo pegues en ningún sitio.

Los cambios de orígenes pueden tardar unos minutos en aplicarse en Google.

### 2. Conectar la app

1. En la app: **Ajustes → Google Calendar** → pega el Client ID → **Guardar**.
2. **Conectar con Google** → elige tu cuenta. Como la app está en modo prueba, Google avisa de que
   «no ha verificado esta aplicación»: es la tuya, pulsa **Continuar** y acepta el permiso.
3. Se crea el calendario «Fútbol Planner» y se suben tus sesiones y partidos.

### Cómo funciona

- **App → Google:** cada sesión es un evento con su icono y título; la descripción lleva el
  tipo, la etiqueta MD y los ejercicios (agrupados por Main / Secondary / Accesorio en
  gimnasio). Al terminarla, el evento pasa a «✓» con RPE, duración y carga. Con hora es un
  evento normal de la duración prevista (60 min si no hay); sin hora, de día completo. Los
  partidos también se suben. Los descansos no.
- **Google → App:**
  - Mover un evento de día u hora mueve la sesión (también a otra semana). Cambiar el título
    cambia el de la sesión.
  - **Crear en Google un evento con el nombre de una rutina** (p. ej. «Fuerza MD-4») crea esa
    sesión ese día con los ejercicios de la rutina; luego la retocas en la app. Un evento con
    cualquier otro nombre crea una sesión sin ejercicios.
  - Borrar un evento borra la sesión si estaba pendiente; si ya estaba registrada, la conserva
    y la saca del calendario.
- **Conflictos:** si cambias lo mismo en los dos sitios entre dos sincronizaciones, gana el
  cambio más reciente.
- **Partidos:** solo van de la app a Google (edítalos en la app).
- **Ventana:** se sincronizan 4 semanas atrás y 12 por delante.

### Límites (por ser 100 % gratis y sin servidor)

- **Solo sincroniza con la app abierta:** al abrirla, tras cada cambio y cada 5 minutos. Lo que
  muevas en Google con la app cerrada llega la próxima vez que la abras.
- **Google da acceso por 1 hora aprox.** Después, la pastilla de la pantalla Semana pasa a
  «Reconectar Google Calendar»: tócala y acepta (normalmente sin volver a escribir nada).
- **Desconectar** (en Ajustes) revoca el permiso; el calendario sigue en Google y puedes
  ocultarlo o borrarlo allí. Si lo borras y vuelves a conectar, se crea otro y se sube todo.

## Tus datos

La biblioteca de ejercicios **empieza vacía**: añades los tuyos desde Ejercicios o, directamente,
al montar una rutina («+ Crear ejercicio nuevo» en la ventana de añadir ejercicio). Si tenías la
versión anterior instalada, al actualizar se quitan solos los ejercicios que venían de serie,
salvo los que ya uses en alguna rutina, sesión o plantilla.

Todo se guarda en el navegador del dispositivo. Desde **Ajustes** puedes exportar una copia en
JSON, importarla en otro móvil, pedir al navegador que no borre los datos y borrarlo todo.
Importar sustituye todos los datos actuales; si el archivo es inválido, no se toca nada.

## Stack

Vite + React + TypeScript + Tailwind CSS, Dexie.js (IndexedDB), react-router-dom,
dnd-kit, Recharts, date-fns, vite-plugin-pwa. Todo gratuito y open source.
