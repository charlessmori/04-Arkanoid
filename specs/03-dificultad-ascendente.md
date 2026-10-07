# SPEC 03 — Dificultad ascendente por victorias consecutivas

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-07
> **Objetivo:** Cada victoria consecutiva sube un nivel de dificultad (bola un 10 % más rápida y una fila más de bloques), con una segunda oportunidad en el nivel actual tras un game over y regreso al nivel 1 si se vuelve a perder.

## Por qué existe este spec

El juego tiene un único nivel fijo: ganar solo lleva a repetir exactamente lo mismo. Este spec añade progresión sin tocar assets ni introducir persistencia.

El sonido de rebote en paredes, techo y pala, pedido junto con esta funcionalidad, ya está implementado desde el SPEC 01 (`bounceOffWalls` y `bounceOffPaddle` llaman a `playSound(bounceSound)`). Se excluye de este spec por decisión del usuario.

## Alcance

**Dentro:**

- Contador `level` que empieza en 1 y sube 1 con cada victoria (`won`) al pulsar Espacio.
- La velocidad de la bola crece un 10 % de la velocidad base por nivel, con un máximo de 840 px/s (nivel 11).
- El número de filas de bloques crece en 1 por nivel, con un máximo de 10 filas (nivel 5). Las filas extra repiten el ciclo de `ROW_COLORS`.
- Tras ganar, Espacio inicia el nivel siguiente con las vidas restauradas a 3 y los bloques regenerados con la dificultad nueva.
- Tras un game over, Espacio da una segunda oportunidad en el mismo nivel, con 3 vidas y bloques nuevos. Si se pierde otra vez esa segunda oportunidad, la siguiente partida empieza en el nivel 1.
- Texto "Nivel N" visible en el canvas durante toda la partida.
- Las pantallas `won` y `gameover` indican qué ocurrirá al pulsar Espacio (nivel siguiente, segunda oportunidad o vuelta al nivel 1).
- El progreso vive solo en memoria: recargar la página reinicia en el nivel 1.

**Fuera de alcance (para specs futuros):**

- Persistencia del nivel o de las victorias entre sesiones (`localStorage`).
- Pala más pequeña, bloques grises resistentes y cualquier otro eje de dificultad.
- Niveles con diseños de bloques distintos o editor de niveles.
- Puntuación y récord.
- Cambios en sonidos: el sonido de rebote ya existe (SPEC 01).
- Menú de selección de nivel y ajustes de dificultad.

## Modelo de datos

Se añaden dos campos a `state` y cuatro constantes en `game.js`. `BALL_SPEED` pasa a ser la velocidad base del nivel 1.

```js
const BALL_SPEED_STEP = 0.1;   // +10 % de BALL_SPEED por nivel
const BALL_SPEED_MAX = 840;    // px/s
const BLOCK_ROWS = 6;          // filas del nivel 1 (ya existe)
const BLOCK_ROWS_MAX = 10;     // 10 filas acaban en y = 380

const state = {
  // ...campos existentes
  level: 1,
  retryUsed: false, // true si el nivel actual ya gastó su segunda oportunidad
};
```

Funciones auxiliares (solo descripción):

- `ballSpeed()`: `Math.min(BALL_SPEED * (1 + BALL_SPEED_STEP * (state.level - 1)), BALL_SPEED_MAX)`.
- `blockRows()`: `Math.min(BLOCK_ROWS + state.level - 1, BLOCK_ROWS_MAX)`.
- `createBlocks()` pasa a generar `blockRows()` filas y el color de la fila `r` es `ROW_COLORS[r % ROW_COLORS.length]`.

Convenciones:

- Todo uso de `BALL_SPEED` para lanzar o rebotar la bola (`launchBall`, `bounceOffPaddle`) pasa a usar `ballSpeed()`. El rebote en bloques conserva el módulo porque usa `Math.abs`.
- Tabla de referencia: nivel 1 = 420 px/s y 6 filas; nivel 2 = 462 y 7; nivel 3 = 504 y 8; nivel 5 = 588 y 10; nivel 11 = 840 y 10.
- `retryUsed` solo cambia en la transición desde `gameover` o `won` (al pulsar Espacio), nunca durante el juego.

Reglas de transición al pulsar Espacio:

| Fase actual | `retryUsed` | Resultado                                                         |
| ----------- | ----------- | ----------------------------------------------------------------- |
| `won`       | cualquiera  | `level += 1`, `retryUsed = false`                                 |
| `gameover`  | `false`     | mismo `level`, `retryUsed = true`                                 |
| `gameover`  | `true`      | `level = 1`, `retryUsed = false`                                  |

En los tres casos: vidas a 3, bloques regenerados con `createBlocks()`, explosiones vacías y fase `ready`.

## Plan de implementación

1. Añadir `level`, `retryUsed` y las constantes de velocidad y filas a `game.js`, con `ballSpeed()` y `blockRows()`. Sustituir `BALL_SPEED` por `ballSpeed()` en `launchBall` y `bounceOffPaddle`. Prueba manual: el juego se comporta igual que antes (nivel 1, 420 px/s, 6 filas), sin errores en consola.
2. Hacer que `createBlocks()` use `blockRows()` y el ciclo de colores con módulo. Prueba manual: en el nivel 1 se ven 6 filas; cambiar `state.level` a 5 desde la consola y reiniciar muestra 10 filas con los colores repetidos.
3. Reemplazar `restartGame()` por la lógica de la tabla de transiciones (victoria sube nivel, game over da segunda oportunidad o vuelve al nivel 1). Prueba manual: ganar y pulsar Espacio muestra el nivel 2 con 7 filas y la bola más rápida; perder dos veces seguidas vuelve al nivel 1.
4. Dibujar "Nivel N" en el canvas y añadir a las pantallas `won` y `gameover` el texto de lo que ocurrirá al pulsar Espacio. Prueba manual: ver el texto en partida y en ambas pantallas finales.

## Criterios de aceptación

- [ ] Al cargar la página el juego empieza en "Nivel 1" con 6 filas de bloques y la bola a 420 px/s.
- [ ] "Nivel N" es visible en el canvas en las fases `ready`, `playing`, `clearing`, `gameover` y `won`.
- [ ] Tras ganar y pulsar Espacio, el nivel sube en 1, las vidas son 3 y la cuadrícula tiene una fila más que en el nivel anterior.
- [ ] La velocidad de la bola en el nivel N es `420 * (1 + 0.1 * (N - 1))` px/s: 462 en el nivel 2 y 504 en el nivel 3.
- [ ] La velocidad de la bola nunca supera 840 px/s, aunque el nivel sea mayor que 11.
- [ ] La cuadrícula nunca supera 10 filas, aunque el nivel sea mayor que 5.
- [ ] Las filas añadidas por encima de la sexta repiten los colores de `ROW_COLORS` desde el primero.
- [ ] La velocidad de la bola es la misma antes y después de cada rebote en pala, paredes y bloques, dentro de un mismo nivel.
- [ ] Tras el primer game over de un nivel, Espacio reinicia ese mismo nivel con 3 vidas y bloques completos.
- [ ] Si se pierde esa segunda oportunidad, la pantalla indica la vuelta al nivel 1 y Espacio empieza en el nivel 1 con 6 filas y 420 px/s.
- [ ] Ganar tras una segunda oportunidad sube el nivel con normalidad, y un game over posterior vuelve a dar una segunda oportunidad.
- [ ] Un game over en el nivel 1 también concede una segunda oportunidad en el nivel 1.
- [ ] Recargar la página reinicia en el nivel 1.
- [ ] No hay errores en la consola y el juego sigue sin módulos ES, bundler ni dependencias externas.
- [ ] `git status` no muestra cambios en `assets/`.

## Decisiones

- **Sí:** victorias consecutivas dentro de la sesión como medida de progreso. Es lo más simple y no necesita persistencia.
- **No:** guardar el nivel en `localStorage`. Pide un esquema versionado y manejo de modo privado; va en otro spec si hace falta.
- **Sí:** ejes de dificultad velocidad de la bola y filas de bloques. Se implementan sin assets nuevos y con cambios mínimos en `game.js`.
- **No:** pala más pequeña ni bloques grises resistentes. El usuario no los eligió; los grises son una mecánica nueva que merece su propio spec.
- **Sí:** +10 % de la velocidad base por nivel (crecimiento lineal), con tope de 840 px/s. Da 10 pasos visibles y el tope es el doble de la velocidad inicial.
- **No:** crecimiento compuesto (×1,1 por nivel). Alcanzaría el tope antes y haría el ritmo menos predecible.
- **Sí:** +1 fila por nivel con tope de 10 filas. Con 10 filas los bloques acaban en y = 380, lejos de la pala (y = 560).
- **Sí:** las filas extra reutilizan `ROW_COLORS` cíclicamente. No hacen falta colores nuevos y los grises siguen reservados.
- **Sí:** vidas restauradas a 3 al avanzar de nivel. Cada nivel parte en igualdad de condiciones y la dificultad solo viene de la bola y los bloques.
- **No:** conservar las vidas entre niveles. Penaliza en exceso un juego que ya se vuelve más difícil.
- **Sí:** segunda oportunidad en el mismo nivel tras un game over y regreso al nivel 1 si se pierde otra vez. Lo pidió el usuario; suaviza la caída sin perder la tensión de la racha.
- **Sí:** la segunda oportunidad también aplica en el nivel 1, por simplicidad: la regla es la misma en todos los niveles.
- **Sí:** `retryUsed` se pone a `false` al ganar. Cada nivel superado recupera su segunda oportunidad.
- **Sí:** el sonido de rebote queda fuera. Ya está implementado en el SPEC 01 y el usuario decidió omitirlo.

## Riesgos identificados

| Riesgo                                                                 | Mitigación                                                                                                                                           |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| La bola atraviesa pala o bloques a 840 px/s                            | Con `dt` máximo de 1/30 s avanza 28 px por paso. La zona de colisión con la pala mide 32 px (16 de pala + 16 de bola) y con un bloque 48 px, así que sigue detectándose. Si aparecen fallos, bajar `BALL_SPEED_MAX` o subdividir el paso en otro spec. |
| El texto "Nivel N" se solapa con las vidas dibujadas arriba a la derecha | Colocar "Nivel N" arriba a la izquierda (x = 10, y = 10) y comprobarlo visualmente.                                                                   |
| Las 10 filas se acercan a la bola pegada a la pala                     | 10 filas terminan en y = 380 y la bola en `ready` está en y = 544, con 164 px libres.                                                                 |
| Regenerar bloques con `state.level` desactualizado                     | Actualizar `level` antes de llamar a `createBlocks()` en la transición.                                                                              |

## Qué **no** entra en este spec

- Sonido de rebote (ya existe desde el SPEC 01).
- Persistencia del nivel o de las victorias entre sesiones.
- Pala más pequeña, bloques resistentes y otros ejes de dificultad.
- Diseños de nivel distintos, selección de nivel y menús.
- Puntuación y récord.
