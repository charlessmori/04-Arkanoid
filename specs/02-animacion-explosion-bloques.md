# SPEC 02 — Animación de explosión de bloques

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-07
> **Objetivo:** Al romper un bloque se reproduce su animación de explosión de 4 frames (`EXPLOSION_FRAMES`) en su posición, sin afectar a la física de la bola.

## Alcance

**Dentro:**

- Al golpear un bloque, este deja de colisionar al instante y se crea una explosión en su posición con su color.
- La explosión recorre los 4 frames de `EXPLOSION_FRAMES[color]`, 150 ms por frame (600 ms en total), y después desaparece.
- Las explosiones se dibujan en el mismo rectángulo del bloque (64x32), usando `drawFrame`.
- Solo se usan recursos que ya existen en `assets/`: los frames de `EXPLOSION_FRAMES` y `EXPLOSION_DURATION` y la función `drawFrame` de `assets/spritesheet.js`, sobre el spritesheet `assets/spritesheet-breakout.png`. No se crean ni se modifican archivos de `assets/`.
- Varias explosiones pueden convivir a la vez.
- Nueva fase `clearing`: al romper el último bloque la bola se detiene y la victoria (`won`) se declara cuando termina la última explosión.
- Al reiniciar la partida se descartan las explosiones en curso.
- `EXPLOSION_DURATION` se interpreta como la duración de cada frame.

**Fuera de alcance (para specs futuros):**

- Bloques grises resistentes y su explosión (los frames de `gray` ya reutilizan los de `red`).
- Partículas, temblor de pantalla u otros efectos visuales.
- Cambios en los sonidos: `break-sound.mp3` sigue sonando al golpear el bloque.
- Explosiones que interactúen con la bola o con otros bloques.
- Ajustes de velocidad o duración configurables por el usuario.

## Modelo de datos

Se añade una lista de explosiones al estado de `game.js`. No se modifican `blocks` ni sus campos.

```js
const EXPLOSION_FRAME_COUNT = 4; // longitud de EXPLOSION_FRAMES[color]

const state = {
  // ...campos existentes
  phase: 'ready', // 'ready' | 'playing' | 'clearing' | 'gameover' | 'won'
  explosions: [/* { x, y, color, elapsed } */], // elapsed en ms desde que empezó
};
```

Convenciones:

- `elapsed` se incrementa en `dt * 1000` en cada `update`, con el mismo `dt` limitado a 1/30 s.
- Frame actual: `Math.floor(elapsed / EXPLOSION_DURATION)`. La explosión termina cuando ese índice llega a `EXPLOSION_FRAME_COUNT`, y entonces se elimina de la lista.
- Las explosiones avanzan en todas las fases, también en `gameover`, para que ninguna se quede congelada a medias.
- La fase `clearing` mantiene la bola parada (`vx = vy = 0`), ignora Espacio y clic, y pasa a `won` cuando `explosions` queda vacío.

## Plan de implementación

1. Añadir `explosions: []` a `state`, la constante `EXPLOSION_FRAME_COUNT` y, en `bounceOffBlocks`, crear una explosión `{ x, y, color, elapsed: 0 }` cuando un bloque pasa a `alive = false`. Vaciar `explosions` en `restartGame`. Prueba manual: el juego funciona igual que antes, sin errores en consola.
2. Avanzar `elapsed` en `update`, eliminar las explosiones terminadas y dibujarlas en `draw` con `drawFrame` en el rectángulo del bloque, antes de la bola y la pala. Prueba manual: al romper un bloque se ve la animación de 4 frames y desaparece a los 600 ms.
3. Añadir la fase `clearing`: al romper el último bloque, detener la bola y pasar a `won` solo cuando `explosions` esté vacío. Prueba manual: destruir el último bloque, ver su explosión completa y después el mensaje "Has ganado".

## Criterios de aceptación

- [ ] Al romper un bloque se ve su explosión en el mismo lugar, con los frames del color de ese bloque.
- [ ] La animación usa únicamente `EXPLOSION_FRAMES`, `EXPLOSION_DURATION` y `drawFrame` de `assets/spritesheet.js`, y `git status` no muestra cambios en `assets/`.
- [ ] La animación dura 600 ms (4 frames de 150 ms) y después no queda rastro del bloque.
- [ ] La bola atraviesa el espacio de una explosión en curso sin rebotar.
- [ ] Romper varios bloques seguidos muestra varias explosiones a la vez, cada una con su propio avance.
- [ ] `break-sound.mp3` suena al golpear el bloque, igual que en el SPEC 01.
- [ ] Al romper el último bloque la bola se detiene y "Has ganado" aparece al terminar su explosión, no antes.
- [ ] Durante `clearing` no se puede perder una vida ni lanzar la bola.
- [ ] Si se pierde la última vida con explosiones en curso, estas terminan su animación y aparece "Game over".
- [ ] Al reiniciar con Espacio no queda ninguna explosión en pantalla y hay 60 bloques.
- [ ] No hay errores en la consola y el juego sigue sin módulos ES, bundler ni dependencias externas.

## Decisiones

- **Sí:** 150 ms por fotograma (600 ms en total). Es una animación visible sin retrasar el juego; 150 ms en total pasaría casi inadvertida.
- **Sí:** el bloque deja de colisionar al instante y la explosión es solo visual. Mantiene el comportamiento de un golpe por bloque del SPEC 01 y evita rebotes extra.
- **No:** colisión con el bloque durante la explosión. Complica el rebote sin aportar jugabilidad.
- **Sí:** reutilizar los frames y la función de dibujo que ya existen en `assets/spritesheet.js`. Es un requisito explícito: no se añaden sprites ni se edita la carpeta `assets/`.
- **No:** crear sprites nuevos o animar por código (fundidos, escalados) en lugar de usar los frames del spritesheet.
- **Sí:** lista `state.explosions` separada de `state.blocks`. No toca el modelo de bloques ni la detección de victoria basada en `alive`.
- **Sí:** nueva fase `clearing` para esperar a la última explosión. Si la bola siguiera activa podría caer y quitar una vida cuando ya no quedan bloques.
- **No:** declarar la victoria al golpear el último bloque. Cortaría la explosión o la dejaría bajo el mensaje.
- **Sí:** las explosiones también avanzan en `gameover`. Evita que queden congeladas en pantalla.
- **Sí:** sin cambios de sonido. `break-sound.mp3` ya acompaña el golpe.
- **No:** bloques grises en este spec. No existen aún en el nivel; su explosión roja ya está resuelta en `EXPLOSION_FRAMES`.

## Riesgos identificados

| Riesgo                                                        | Mitigación                                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Pestaña en segundo plano: el `dt` limitado alarga la animación | Aceptado: con `dt` máximo de 1/30 s la explosión avanza más lenta pero termina siempre.          |
| Explosión que se dibuja encima de la bola o de la pala        | Se dibuja antes que la bola y la pala, justo después del fondo.                                  |
| `clearing` deja el juego bloqueado si `explosions` no se vacía | La explosión se elimina por tiempo, no por evento, así que `clearing` siempre termina en 600 ms. |

## Qué **no** entra en este spec

- Bloques grises resistentes.
- Partículas, temblor de pantalla y otros efectos.
- Cambios en los sonidos.
- Puntuación, power-ups y menús.
