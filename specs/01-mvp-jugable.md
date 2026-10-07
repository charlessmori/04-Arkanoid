# SPEC 01 — MVP jugable de Arkanoid

> **Estado:** Implementado
> **Depende de:** ninguno (reutiliza `assets/spritesheet.js` y los sonidos existentes)
> **Fecha:** 2026-10-06
> **Objetivo:** Una página con un canvas de 800x600 donde se juega un único nivel de Arkanoid con pala, bola, bloques, 3 vidas, game over y victoria.

## Alcance

**Dentro:**

- `index.html` en la raíz del proyecto con un `<canvas>` de 800x600 que carga `assets/spritesheet.js` y `game.js` como scripts globales.
- Pala controlada con teclado (flechas izquierda/derecha y A/D) y con ratón, ambos a la vez.
- Una bola que sale pegada a la pala y se lanza con Espacio o clic.
- Un único nivel fijo: cuadrícula de 10 columnas por 6 filas de bloques de colores.
- Rebote en paredes izquierda, derecha y techo, en la pala y en los bloques.
- Rotura de bloques al primer golpe, sin animación de explosión.
- 3 vidas, con el contador visible en el canvas.
- Mensaje "Game over" al perder la última vida y mensaje "Has ganado" al destruir todos los bloques.
- Reinicio de la partida con Espacio desde ambas pantallas finales.
- Sonidos `ball-bounce.mp3` (paredes y pala) y `break-sound.mp3` (bloque roto).

**Fuera de alcance (para specs futuros):**

- Puntuación, récord y cualquier persistencia entre sesiones.
- Varios niveles y editor de niveles.
- Bloques grises resistentes (2 golpes).
- Animación de explosión (`EXPLOSION_FRAMES`).
- Power-ups, pausa, menú de inicio, ajustes de volumen.
- Controles táctiles y adaptación a móvil.
- Tests automáticos, sistema de build y gestor de paquetes.

## Modelo de datos

Estado global en `game.js`, sin módulos. Coordenadas con origen arriba a la izquierda y unidades en píxeles y píxeles/segundo.

```js
const CANVAS_W = 800;
const CANVAS_H = 600;

const BLOCK_W = 64;          // sprite 32x16 escalado x2
const BLOCK_H = 32;
const BLOCK_COLS = 10;       // 10 x 64 = 640 px, margen lateral de 80 px
const BLOCK_ROWS = 6;
const BLOCK_ORIGIN = { x: 80, y: 60 };
const ROW_COLORS = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'];

const PADDLE = { w: 120, h: 16, y: 560, speed: 600 };  // speed: teclado, px/s
const BALL_SIZE = 16;
const BALL_SPEED = 420;      // módulo constante, px/s
const MAX_BOUNCE_ANGLE = 60; // grados respecto a la vertical

const state = {
  phase: 'ready',            // 'ready' | 'playing' | 'gameover' | 'won'
  lives: 3,
  paddle: { x: 340 },        // esquina izquierda; y fija en PADDLE.y
  ball: { x: 0, y: 0, vx: 0, vy: 0 },
  blocks: [/* { x, y, color, alive } */],
};
```

Convenciones:

- La fase `ready` mantiene la bola pegada al centro de la pala.
- La velocidad de la bola mantiene siempre el módulo `BALL_SPEED`.
- El movimiento usa el delta de tiempo de `requestAnimationFrame`, limitado a 1/30 s para evitar saltos.
- Los sprites se dibujan con `drawSprite`. La pala (162x14) se escala a 120x16.

## Plan de implementación

1. Crear `index.html` con el canvas 800x600 y los scripts. Crear `game.js` con `loadSpritesheet`, un bucle `requestAnimationFrame` y el fondo. Prueba manual: abrir la página, ver el canvas sin errores en consola.
2. Dibujar la pala y moverla con teclado y ratón, limitada a los bordes del canvas. Prueba manual: mover la pala con flechas, A/D y ratón.
3. Generar los bloques desde `ROW_COLORS` y dibujarlos. Prueba manual: ver 10x6 bloques con 6 colores por filas.
4. Añadir la bola pegada a la pala (fase `ready`) y su lanzamiento con Espacio o clic. Prueba manual: la bola sigue a la pala y sale hacia arriba al lanzar.
5. Implementar el rebote en paredes y techo, y el rebote en la pala con ángulo según el punto de impacto. Añadir `ball-bounce.mp3`. Prueba manual: golpear con el centro y con los extremos de la pala.
6. Implementar la colisión bola-bloque: el bloque desaparece y la bola rebota por el eje de menor penetración. Añadir `break-sound.mp3`. Prueba manual: romper bloques y ver el rebote.
7. Implementar vidas: al salir la bola por abajo se resta una vida y se vuelve a `ready`. Mostrar "Vidas: N" en el canvas. Prueba manual: perder la bola y ver el contador bajar.
8. Implementar las pantallas `gameover` y `won` con su mensaje y el reinicio con Espacio. Prueba manual: perder 3 vidas, reiniciar, destruir todos los bloques, reiniciar.

## Criterios de aceptación

- [ ] Abrir `index.html` en el navegador carga el juego sin errores en la consola.
- [ ] El canvas mide exactamente 800x600 píxeles.
- [ ] Se ven 60 bloques en 10 columnas y 6 filas, con un color distinto por fila.
- [ ] La pala se mueve con flechas, con A/D y con el ratón, y nunca sale del canvas.
- [ ] Al empezar y tras perder una vida, la bola está pegada a la pala y no se mueve hasta pulsar Espacio o hacer clic.
- [ ] Un impacto en el centro de la pala envía la bola en vertical y un impacto en el extremo la envía con 60° respecto a la vertical.
- [ ] La velocidad de la bola es la misma antes y después de cada rebote.
- [ ] La bola rebota en las paredes izquierda y derecha y en el techo.
- [ ] Un bloque golpeado desaparece al primer impacto y la bola rebota.
- [ ] Se oye `ball-bounce.mp3` al rebotar en paredes y pala, y `break-sound.mp3` al romper un bloque.
- [ ] Al salir la bola por el borde inferior, "Vidas" baja en 1 y la bola vuelve a la pala.
- [ ] Al perder la tercera vida aparece el mensaje "Game over" y la bola no se mueve.
- [ ] Al destruir los 60 bloques aparece el mensaje "Has ganado".
- [ ] Pulsar Espacio en "Game over" o "Has ganado" empieza una partida nueva con 3 vidas y los 60 bloques.
- [ ] El juego no usa módulos ES, bundler ni dependencias externas.

## Decisiones

- **Sí:** teclado y ratón a la vez. Cubre ambos estilos de juego sin coste real.
- **Sí:** un único nivel fijo definido en código. Los niveles múltiples van en otro spec.
- **Sí:** bloques escalados x2 (64x32) en 10 columnas. Es la cuadrícula pedida y encaja en 800 px con márgenes iguales.
- **Sí:** 6 filas con los 6 colores no grises. Los grises quedan reservados para el bloque resistente de un spec futuro.
- **Sí:** la fila superior es roja y el orden sigue `ROW_COLORS`. Es una elección visual sin consecuencias; se puede cambiar.
- **Sí:** rebote en la pala con ángulo según el punto de impacto y velocidad constante. Da control al jugador y una física predecible.
- **No:** rebote espejo puro en la pala. El jugador no controla la dirección y la bola puede entrar en bucles.
- **Sí:** bola pegada a la pala hasta lanzarla con Espacio o clic. Es lo clásico del género y da tiempo al jugador.
- **No:** lanzamiento automático por temporizador. Quita control al jugador.
- **Sí:** mensajes de texto simples y reinicio con Espacio. Sin reinicio habría que recargar la página para volver a jugar.
- **No:** puntuación en esta versión. No se pidió en el MVP.
- **No:** animación de explosión. Añade complejidad que no hace falta para que sea jugable.
- **Sí:** movimiento basado en delta de tiempo y no en píxeles por frame. La velocidad es la misma en monitores de 60 Hz y de más.
- **Sí:** `game.js` en la raíz junto a `index.html`. Mantiene las rutas relativas de `loadSpritesheet` y de los sonidos sin cambios.

## Riesgos identificados

| Riesgo                                                          | Mitigación                                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| La bola atraviesa bloques o pala a alta velocidad               | Delta de tiempo limitado a 1/30 s y velocidad de 420 px/s (14 px por paso como máximo). |
| El navegador bloquea el audio hasta que hay interacción         | El primer sonido llega tras Espacio o clic, que cuenta como interacción del usuario.   |
| Abrir `index.html` con `file://` puede dar problemas de carga   | La imagen se carga con `Image` y se copia a un canvas; si falla, probar con un servidor local estático. |
| La bola queda en un bucle horizontal casi sin componente vertical | El ángulo máximo de 60° con la vertical mantiene siempre `vy` distinto de cero.        |

## Qué **no** entra en este spec

- Puntuación, récord y persistencia.
- Varios niveles.
- Bloques resistentes y animación de explosión.
- Power-ups, pausa y menús.
- Controles táctiles y versión móvil.
