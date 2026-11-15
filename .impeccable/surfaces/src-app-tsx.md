---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

## Direction contract

THESIS: La app deja de ser tarjetas planas y pasa a ser una pizarra táctica de vestuario real: cada sesión es una ficha imantada con peso físico, no un rectángulo con texto. Se niega la estética de "app de fitness genérica" (tarjetas redondeadas, sombra suave uniforme, icono + texto) que la propia Fase 1-2 ya construyó.

OWN-WORLD: Fondo casi negro grafito con textura de pizarra sutil; una sola fuente de luz cenital que proyecta sombra coherente en toda ficha elevada. Líneas de formación en blanco tiza semitransparente bajo las columnas de días. Fichas circulares biseladas (gradiente radial + borde claro superior / oscuro inferior) en verde césped (fuerza/partido), ámbar (gimnasio), azul (carrera), violeta (movilidad), gris (descanso). MD-tags como etiquetas "escritas a tiza" rotadas ligeramente. Tipografía: Space Grotesk para números/MD-tags (carácter de rotulador grueso), Inter para texto largo.

STORY: El usuario abre la semana y ve su pizarra de vestuario con el día de partido marcado como el punto de referencia; arrastra una rutina de la bandeja y la ficha "cae" con peso sobre el día, se inclina al agarrarla y se asienta con un golpe seco al soltarla. Las estadísticas son una gráfica trazada a tiza sobre la pizarra.

FIRST VIEWPORT: Cabecera con el rango de semana en rotulador grueso sobre una placa oscura con tornillos/esquinas biseladas (como el marco real de una pizarra). Debajo, la columna de 7 días como "casillas" de la pizarra con perspectiva sutil (perspective + rotateX de pocos grados en el contenedor, no en cada tarjeta individual, para que siga siendo legible). El día de partido lleva un marco iluminado en verde césped con brillo (glow), como un marcador electrónico.

FORM: Mi propio candidato #1 de un ranking de 7 (pizarra táctica de vestuario / tablero magnético), ofrecido como IMPECCABLE'S PICK frente al índice asignado por el guion (#6, alineación oficial impresa) — elegido por el usuario sobre ambas alternativas y el estándar. Seed key: 458c3156.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
