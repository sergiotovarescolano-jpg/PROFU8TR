# Design

<!-- impeccable:design-schema 1 -->

## World

Pizarra táctica de vestuario. La app no es una lista de tarjetas: es un tablero casi negro,
iluminado desde arriba, donde cada sesión de entreno es una ficha imantada con peso físico
real (bisel, sombra proyectada, se levanta al tocarla) y cada panel (cabecera, tarjeta de
día, modal, barra inferior) es una placa de pizarra con su propio marco biselado.

Ruta de construcción: code-led (sin generación de imágenes disponible en esta máquina).

## Palette

Estrategia de color: Restrained — fondo grafito casi negro con un único acento dominante
(verde césped) reservado para partido/estado activo, más colores de "ficha" por tipo de
sesión que solo aparecen en los círculos de icono, nunca como fondo de panel.

- `--color-bg` `#0a0a0c` — fondo de toda la app
- `--color-surface` `#16171b` / `--color-surface-2` `#1d1f24` — placas y campos
- `--color-border` `#2c2e35`
- Verde césped `pitch-300…900` (`#6bd184` → `#19622e`) — acento de marca, partido, carga, foco activo
- Fichas por tipo de sesión (`src/utils/sessionTypeInfo.ts`): ámbar (gimnasio), azul cielo
  (carrera), violeta (movilidad), gris pizarra (descanso), verde césped (entreno de equipo)
- Etiquetas MD (`src/utils/mdTag.ts`): rojo (MD-4), naranja (MD-3), amarillo (MD-2), azul
  (MD-1), verde (MD), violeta (MD+1), teal (MD+2) — ya eran así desde la Fase 1, conservadas

## Type

- Display/números (`--font-display`, Space Grotesk): títulos de pantalla, cabecera de
  semana, etiquetas MD, cifras de carga/estadísticas — el "rotulador grueso" de la pizarra
- Texto (`--font-sans`, Inter): todo lo demás

## Material language

- **Luz única cenital**: toda sombra/bisel de la app nace de las mismas tres variables CSS
  (`--board-shadow-rest`, `--board-shadow-lift`, `--board-shadow-inset` en `src/index.css`).
  No se improvisan sombras sueltas fuera de estos tokens y de `.piece`/`.board-frame`.
- **`.board-frame`** (clase global, `src/index.css`): el marco de pizarra — gradiente sutil
  + borde + `--board-shadow-rest`. Se usa en cabeceras, modales, tarjetas de día, tarjetas de
  estadística y secciones de ajustes.
- **`.piece`** (clase global): la ficha imantada — sombra de reposo, y `.piece-lift` /
  `:active` la levanta (translateY + sombra ampliada) al arrastrar o pulsar.
- **Líneas de tiza**: separador punteado (`repeating-linear-gradient`) bajo la cabecera de
  cada `DayCard`, y `.chalk-label` (ligera rotación -1.5°) para las etiquetas MD y las
  etiquetas de rutina.
- **Día de partido**: único elemento con resplandor (`box-shadow` verde difuso), como un
  marcador electrónico — nunca se usa resplandor en otro sitio salvo el ítem activo de la
  barra inferior.
- **Botones**: degradado vertical + highlight superior + sombra inferior + `active:translate-y-px`
  que colapsa la sombra, para una pulsación física real (`src/components/ui/Button.tsx`).
- **Campos**: sombra interior (`inset 0 2px 5px`) para leer como "grabados" en la placa, con
  halo verde al enfocar (`src/components/ui/Field.tsx`, `NumberField.tsx`).

## Motion

- `animate-snap-in` (`src/index.css`): entrada de modales — decelera fuerte sin rebote
  (`cubic-bezier(0.16, 1, 0.3, 1)`, sin overshoot; el detector mecánico marcó la versión con
  rebote como antipatrón y se corrigió).
- Arrastrar una rutina a un día (`DragOverlay` en `WeekPage.tsx`): la ficha se inclina 3° y
  usa `.piece-lift`, el día bajo el cursor (`isOver` en `DayCard`) se ilumina y escala
  ligeramente — el "imán" encontrando su sitio.
- Pulsaciones: `active:scale-[0.98]` / `active:translate-y-px` en vez de easings elásticos.

## Coverage

Aplicado end-to-end en: primitivas de UI (`Button`, `Modal`, `Field`, `BottomNav`),
Semana (`WeekHeader`, `DayCard`, `SessionCard`, `RoutineTray`/`RoutineChip`), Ejercicios
(`ExerciseCard`, `ExerciseFilters`), Rutinas (lista y `ExerciseListEditor` — la fila
arrastrable), Estadísticas (`StatTile` y secciones) y Ajustes (`Section`). Las pantallas de
detalle de sesión/partido y los pickers heredan el sistema a través de esas mismas
primitivas pero no se retocaron pieza a pieza.

## Dorado y tipografía condensada (segunda paleta, a petición del usuario)

El usuario pidió un color cálido que acompañe al negro y "todo más visual y fácil de ver".

- **Reparto 60-30-10 de la app**: 60 % negro grafito (fondo), 30 % dorado de trofeo
  `gold-*` (`--color-gold-400` `#f5b544`, escala 100–950 en `src/index.css`) para emblemas,
  rótulos, filtros activos, bordes y vetas; 10 % verde césped solo para acción y estado
  (botón de crear, hoy, hecho, cifra principal del dashboard).
- **Alerta = coral** `#ff6b5b` (`CHART.warning`): como el dorado ya es decorativo, la
  sobrecarga deja de ser ámbar para no confundirse. Siempre con icono y texto.
- **Fondo**: brillo dorado arriba a la izquierda y verde tenue arriba a la derecha (`body`).
- **Tipografía**: `--font-condensed` Barlow Condensed (600/700/800), estilo dorsal, en
  mayúsculas para títulos y nombres de ejercicio. Space Grotesk sigue para cifras del
  dashboard e Inter para el texto corrido.

### Fondo 3D de la app (`src/components/layout/AppBackground.tsx`, `appBackground.css`)

Petición del usuario: "un fondo 3D supervisual, de color cálido". Estadio de noche, solo CSS,
fijo detrás de todo (`z-index: -1`, sin eventos de puntero). Capas de atrás adelante:
cielo negro tostado que se calienta hacia el horizonte (40 % de la altura) · resplandor ámbar
que "respira" · grada en el horizonte con lucecitas que titilan · césped en perspectiva
(`perspective: 480px`, `rotateX(76deg)`) con franjas de corte ámbar, rejilla dorada y una línea
central brillante, que avanza hacia el espectador en bucle (traslación de un módulo exacto) ·
dos haces de foco que oscilan (`mix-blend-mode: screen`) · 22 ascuas que suben (posiciones fijas
con generador determinista) · viñeta y velo para que el contenido siempre gane · focos
brillantes en las esquinas superiores.

- **Versión suave** (el usuario pidió bajarlo): luces a ~la mitad (horizonte, focos, grada),
  líneas del césped al 50 %, césped que avanza en 6,5 s por módulo, focos que oscilan en
  28–33 s, 12 ascuas tenues y lentas (18–34 s) y velo más denso. Es el fondo, no el
  protagonista: si hay que subirlo, tocar primero las opacidades de `.app-bg__grid` y
  `.app-bg__beam`.
- Paralaje leve con el puntero/dedo (variables `--px`/`--py`, un cambio por fotograma).
- Rendimiento: todo se anima con `transform`/`opacity`; el plano del césped mide solo lo que
  la cámara ve (460 px de fondo; más allá queda detrás de la perspectiva) para no gastar
  memoria de GPU; `contain: strict`.
- `prefers-reduced-motion`: todo quieto y sin ascuas.
- `--color-bg` pasa a negro tostado `#0b0806`; `theme-color` y el manifest, igual.

### Extensión a toda la app

- **Superficies cálidas**: `--color-surface` `#181613`, `--color-surface-2` `#201d19`,
  `--color-border` `#36312a`; `.board-frame` en negro tostado con borde dorado al 14 % y un
  brillo dorado en la esquina. Así el dorado entra en todas las pantallas sin repintarlas.
- **Utilidades nuevas** (`src/index.css`): `.kicker` (antetítulo dorado espaciado) y
  `.bg-watermark` (cifra o icono gigante y tenue de fondo).
- **`PageHeader` / `CountBadge` / `SectionTitle`** (`src/components/ui/PageHeader.tsx`):
  cabecera común (antetítulo + título condensado de 44 px + enlace de vuelta opcional),
  insignia con cifra dorada y título de sección con trazo dorado. `breakAtSlashes` permite
  partir nombres como "ESPALDA/BICEPS" tras la barra.
- **Primitivas**: `Button` en condensada mayúscula (primario verde = acción; secundario
  dorado), etiquetas de campo en condensada dorada, foco dorado, título de modal condensado,
  `ScalePicker` con botones grandes y una barrita dorada que crece con el número (elegido =
  verde), `BottomNav` en condensada con el activo en dorado.
- **Semana**: cabecera con antetítulo y rango en condensada, herramientas con icono (la
  activa en dorado), resumen con carga grande y barra de progreso dorada de sesiones,
  tarjeta de día con número gigante de fondo, insignia HOY dorada, día de partido con su
  bloque verde y estadísticas del partido en cifras grandes, botones "+ Sesión" dorados.
  `SessionCard`: Registrar = dorado, Hecha = verde, Saltada = coral.
- **Rutinas**: tarjetas con ficha de tipo, nombre condensado, etiqueta MD dorada y los
  primeros ejercicios como pastillas; editor con ejercicios numerados en medallas doradas.
- **Niveles de ejercicio en gimnasio** (`src/utils/exerciseTier.ts`): Main lift / Secondary
  lift / Accesorio, con colores de podio (oro, plata, bronce) y notación de gimnasio A1, B1,
  C1 en las medallas. Solo se activa con tipo de sesión "gimnasio" (en rutinas y en la
  ventana de sesión); en el resto la lista es plana. El editor agrupa en tres bloques con
  "+ Añadir …" por bloque, selector de nivel en cada fila y arrastre solo dentro del bloque;
  la lista se guarda ordenada por nivel. El registro de sesión agrupa igual, con contador
  hechos/total por bloque. Sin nivel = accesorio.
- **Registro de sesión**: cabecera con ficha del tipo, barra de progreso dorada de
  ejercicios, filas numeradas que pasan a verde al hacerlas y carga en cifra grande.
- **Ajustes**: secciones con medalla de icono dorada y marca de agua.
- **Google Calendar** (Fase 6): sección en Ajustes con caja dorada "Origen a autorizar"
  (botón Copiar), estado conectado en caja verde (estado = 10 %) y errores en coral.
  `SyncChip` en la cabecera de Semana: pastilla neutra "📆 Google Calendar · hace X" que pasa a
  coral "⚠️ Reconectar…" si el token caducó; tocarla sincroniza. La hora opcional de la sesión
  aparece en dorado delante del título en `SessionCard`.
- El título de la semana (`WeekHeader`) puede ocupar dos líneas (`text-balance`) en semanas que
  cruzan de mes; nunca se corta con puntos suspensivos.

### Biblioteca de ejercicios (`src/components/exercises/`, `library.css`)

- Cabecera "BIBLIOTECA / EJERCICIOS" en condensada grande + contador dorado que cambia
  con el filtro y la búsqueda.
- Búsqueda con lupa dorada y botón de borrar; filtros como fichas con disco de icono, la
  activa rellena de dorado.
- **`ExerciseCard` gira en 3D** (`.flip-card`, `rotateY(180deg)`, `backface-visibility`):
  delante emblema-medalla dorado, categoría, nombre en condensada, una línea de
  descripción, músculo y material (se oculta "Ninguno") y una marca de agua con el icono;
  detrás descripción completa, nota en caja dorada, vídeo, Editar y Volver. La cara oculta
  lleva `inert`.
- Entrada escalonada (`.lib-enter`) al cambiar de categoría.
- **`ExerciseRow`**: fila compacta con el mismo estilo para el selector de rutinas
  (`ExercisePicker`), donde un toque elige el ejercicio sin girar.
- `prefers-reduced-motion` quita giro, entrada y transiciones.

## Dashboard 3D (pestaña Estadísticas)

Petición del usuario: dashboard "bastante visual (3D)" con regla de color 60-30-10. 3D solo
con CSS (sin WebGL: 0 KB extra, fluido en cualquier móvil). Estilos en
`src/components/stats/dashboard3d.css`, importado solo desde `Scene3D.tsx` (chunk de
Estadísticas, no carga en el resto de la app).

- **60-30-10**: 60 % grafito (`--color-bg` y el suelo de las escenas), 30 % placas
  (`surface`/`surface-2`/`border` y los prismas neutros `#3a3d45`/`#2c2e35`/`#212329`),
  10 % verde césped (cifra principal, día o semana destacada, prisma de acento
  `#4cc46c`/`#34b057`/`#24803e`). Los colores de tipo de sesión y de etiqueta MD **no**
  aparecen en el dashboard: las etiquetas MD van como texto. El coral `#ff6b5b` (antes ámbar) es estado
  (límite de sobrecarga, medidor en alerta), siempre con icono y texto, no cuenta en el reparto.
- **`Scene3D`**: suelo con franjas de corte en grafito y canto delantero de tablero
  (`perspective: 650px`, `rotateX(54deg) rotateZ(var(--tilt-z))`, giro inicial −24°),
  prismas de 5 caras de 24 px y hasta 135 px de alto. Luz cenital ligeramente frontal: cara
  superior clara con brillo diagonal, caras laterales que se oscurecen hacia la base
  (oclusión), sombra proyectada hacia el fondo proporcional a la altura (`.cast-shadow`) y,
  solo bajo la barra de acento, un charco de luz verde en el césped (`.light-pool`). Crecen
  desde el suelo al montar. Arrastre horizontal gira el campo (−70°…10°), doble toque lo
  recoloca. `touch-action: pan-y` para no romper el scroll.
- **Cifra principal** (`.extruded-3d`): extruida con 6 capas de `text-shadow` en verdes
  oscuros, dentro del 10 % de acento.
- **Medidor** (`.gauge-3d`): inclinado 18° hacia atrás, con un segundo anillo desplazado y
  más oscuro como canto.
- **Etiquetas "valla"** (`.billboard-3d`): deshacen el giro del suelo para quedar siempre de
  frente. Cifras encima de cada barra; rótulos (día + MD, o fecha) de pie en la banda
  delantera, desplazados con `tan(var(--tilt-z))` para quedar bajo su barra a cualquier giro.
- **Plano de límite** (`.limit-plane-3d`): plano ámbar translúcido a la altura de +30 % sobre
  la media de 4 semanas; la barra que lo atraviesa es sobrecarga.
- **`.plate-3d`**: placa inclinada 14° con canto de 7 px (sombras apiladas de 1 px) para las
  cifras; al pulsarla baja y se aplana. Es la única excepción a "sombras solo desde los
  tokens", limitada al dashboard.
- **Legibilidad**: el 3D es escenario, no dato. Cada barra lleva su número en plano y ambas
  escenas tienen "Ver como tabla". La progresión de peso se queda en 2D (Recharts).
- `prefers-reduced-motion` desactiva el crecimiento de barras y las transiciones.

## Known gaps / next pass

- `SessionLogPage`, `MatchForm`, `PainPicker`, `ScalePicker`, `TemplatesModal`,
  `ExercisePicker` heredan tokens y primitivas pero no se confirmaron visualmente una por
  una en esta pasada — probable que estén bien por herencia, pendiente de repaso rápido.
- Esta build se hizo en paralelo a otra sesión completando la Fase 2-4 funcional sobre el
  mismo repositorio; no hubo ronda de revisión con el agente `impeccable-finish-reviewer` ni
  documentador automático por el riesgo de choque de ediciones — este archivo se escribió a
  mano como cierre mínimo. Vale la pena un `/impeccable polish` cuando el repo esté estable.
