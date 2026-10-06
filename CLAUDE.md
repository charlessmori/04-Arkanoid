# CLAUDE.md

Este archivo ofrece orientación a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Estado del proyecto

Un juego tipo Arkanoid/Breakout en fase inicial. Todavía no hay código del juego, sistema de build, gestor de paquetes, tests ni repositorio git. `README.md` está vacío. El único código es el helper de sprites en `assets/spritesheet.js`, pensado para cargarse desde una página de navegador simple con un `<canvas>` y scripts globales, sin módulos ni bundler. Aún no existe `index.html`.

## Assets

- `assets/spritesheet-breakout.png`: spritesheet único. Las coordenadas están en `assets/spritesheet.js`.
- `assets/sounds/ball-bounce.mp3` y `assets/sounds/break-sound.mp3`: efectos de sonido.

### `assets/spritesheet.js` (globales, sin exports)

- `SPRITES`: rectángulos de origen (`sx, sy, sw, sh`) para `paddle`, `ball` y `blocks.<color>`. Colores de bloque: gray, red, yellow, cyan, magenta, hotpink y green. Todos los bloques miden 32x16.
- `EXPLOSION_FRAMES`: 4 frames de animación por color de bloque. `EXPLOSION_DURATION` es 150.
- Los frames de explosión de `gray` reutilizan las coordenadas de `red`, así que los bloques grises explotan en rojo.
- `loadSpritesheet(cb)`: carga el PNG desde la ruta relativa `assets/spritesheet-breakout.png`, por lo que la página debe estar en la raíz del proyecto. Copia la imagen a un canvas fuera de pantalla y encola los callbacks. Hay que llamarla antes de dibujar.
- `drawSprite(ctx, name, x, y, w, h)`: los nombres de bloque llevan el prefijo `block_`, p. ej. `block_red`. Los demás nombres indexan `SPRITES` directamente. No hace nada, sin avisar, hasta que el spritesheet se haya cargado.
- `drawFrame(ctx, frame, x, y, w, h)`: dibuja un frame arbitrario, p. ej. una entrada de `EXPLOSION_FRAMES`.

## Flujo de trabajo basado en specs

`.agents/skills/` define dos skills, `spec` y `spec-impl`. Ambas solo las invoca el usuario. `skills-lock.json` las fija.

- `/spec <descripción>`: hace preguntas aclaratorias y luego escribe `specs/NN-slug.md` a partir de `.agents/skills/spec/template.md`. Nunca escribe código, y crea `specs/.spec-config.yml` si no existe.
- `/spec-impl <NN-slug>`: implementa un spec solo si su estado significa "Aprobado". Ese estado lo cambia una persona, nunca el agente.
  - Crea y cambia a la rama `spec-NN-slug`. Requiere git, que aún no está inicializado aquí. `AutoCreateBranch` en `specs/.spec-config.yml` controla si pregunta antes.
  - Implementa un paso del plan cada vez y se detiene tras cada paso para revisar el diff.
  - Nunca hace commit salvo que se lo pidan, y no sale del alcance del spec.
  - Los specs se escriben en el idioma del prompt del usuario.
