const CANVAS_W = 800;
const CANVAS_H = 600;

const BLOCK_W = 64; // sprite 32x16 escalado x2
const BLOCK_H = 32;
const BLOCK_COLS = 10; // 10 x 64 = 640 px, margen lateral de 80 px
const BLOCK_ROWS = 6;
const BLOCK_ORIGIN = { x: 80, y: 60 };
const ROW_COLORS = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'];

const PADDLE = { w: 120, h: 16, y: 560, speed: 600 }; // speed: teclado, px/s

const BALL_SIZE = 16;
const BALL_SPEED = 420; // módulo constante, px/s
const MAX_BOUNCE_ANGLE = 60; // grados respecto a la vertical

const MAX_DT = 1 / 30; // limita el delta para evitar saltos

const state = {
  phase: 'ready', // 'ready' | 'playing' | 'gameover' | 'won'
  lives: 3,
  ball: { x: 0, y: 0, vx: 0, vy: 0 },
  paddle: { x: 340 }, // esquina izquierda; y fija en PADDLE.y
  blocks: [], // { x, y, color, alive }
};

function createBlocks() {
  const blocks = [];
  for (let row = 0; row < BLOCK_ROWS; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      blocks.push({
        x: BLOCK_ORIGIN.x + col * BLOCK_W,
        y: BLOCK_ORIGIN.y + row * BLOCK_H,
        color: ROW_COLORS[row],
        alive: true,
      });
    }
  }
  return blocks;
}

state.blocks = createBlocks();

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const bounceSound = new Audio('assets/sounds/ball-bounce.mp3');

const breakSound = new Audio('assets/sounds/break-sound.mp3');

function playSound(sound) {
  sound.currentTime = 0;
  sound.play().catch(() => {}); // el navegador puede bloquear el audio sin interacción
}

const keys = {};
let lastTime = 0;

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space') {
    e.preventDefault();
    if (!e.repeat) {
      if (state.phase === 'gameover' || state.phase === 'won') restartGame();
      else launchBall();
    }
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) * (CANVAS_W / rect.width);
  state.paddle.x = mouseX - PADDLE.w / 2;
  clampPaddle();
});

canvas.addEventListener('mousedown', launchBall);

function stickBallToPaddle() {
  state.ball.x = state.paddle.x + PADDLE.w / 2 - BALL_SIZE / 2;
  state.ball.y = PADDLE.y - BALL_SIZE;
  state.ball.vx = 0;
  state.ball.vy = 0;
}

function launchBall() {
  if (state.phase !== 'ready') return;
  state.phase = 'playing';
  state.ball.vx = 0;
  state.ball.vy = -BALL_SPEED;
}

function bounceOffWalls() {
  const ball = state.ball;
  let bounced = false;
  if (ball.x < 0) {
    ball.x = 0;
    ball.vx = Math.abs(ball.vx);
    bounced = true;
  } else if (ball.x + BALL_SIZE > CANVAS_W) {
    ball.x = CANVAS_W - BALL_SIZE;
    ball.vx = -Math.abs(ball.vx);
    bounced = true;
  }
  if (ball.y < 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
    bounced = true;
  }
  if (bounced) playSound(bounceSound);
}

function bounceOffPaddle() {
  const ball = state.ball;
  const paddle = state.paddle;
  const hit =
    ball.vy > 0 &&
    ball.x + BALL_SIZE > paddle.x &&
    ball.x < paddle.x + PADDLE.w &&
    ball.y + BALL_SIZE > PADDLE.y &&
    ball.y < PADDLE.y + PADDLE.h;
  if (!hit) return;

  // -1 en el extremo izquierdo, 0 en el centro, 1 en el extremo derecho
  const offset = (ball.x + BALL_SIZE / 2 - (paddle.x + PADDLE.w / 2)) / (PADDLE.w / 2);
  const angle = Math.max(-1, Math.min(1, offset)) * MAX_BOUNCE_ANGLE * Math.PI / 180;
  ball.vx = BALL_SPEED * Math.sin(angle);
  ball.vy = -BALL_SPEED * Math.cos(angle);
  ball.y = PADDLE.y - BALL_SIZE;
  playSound(bounceSound);
}

function bounceOffBlocks() {
  const ball = state.ball;
  for (const block of state.blocks) {
    if (!block.alive) continue;
    const overlapX = Math.min(ball.x + BALL_SIZE - block.x, block.x + BLOCK_W - ball.x);
    const overlapY = Math.min(ball.y + BALL_SIZE - block.y, block.y + BLOCK_H - ball.y);
    if (overlapX <= 0 || overlapY <= 0) continue;

    block.alive = false;
    const ballCx = ball.x + BALL_SIZE / 2;
    const ballCy = ball.y + BALL_SIZE / 2;
    // rebota por el eje de menor penetración
    if (overlapX < overlapY) {
      const dir = ballCx < block.x + BLOCK_W / 2 ? -1 : 1;
      ball.vx = Math.abs(ball.vx) * dir;
      ball.x += overlapX * dir;
    } else {
      const dir = ballCy < block.y + BLOCK_H / 2 ? -1 : 1;
      ball.vy = Math.abs(ball.vy) * dir;
      ball.y += overlapY * dir;
    }
    playSound(breakSound);
    return; // un bloque por frame
  }
}

function loseLife() {
  state.lives -= 1;
  if (state.lives <= 0) {
    state.phase = 'gameover';
    state.ball.vx = 0;
    state.ball.vy = 0;
    return;
  }
  state.phase = 'ready';
  stickBallToPaddle();
}

function restartGame() {
  state.lives = 3;
  state.blocks = createBlocks();
  state.phase = 'ready';
  stickBallToPaddle();
}

function clampPaddle() {
  state.paddle.x = Math.max(0, Math.min(CANVAS_W - PADDLE.w, state.paddle.x));
}

function update(dt) {
  const left = keys.ArrowLeft || keys.KeyA;
  const right = keys.ArrowRight || keys.KeyD;
  state.paddle.x += ((right ? 1 : 0) - (left ? 1 : 0)) * PADDLE.speed * dt;
  clampPaddle();

  if (state.phase === 'ready') {
    stickBallToPaddle();
  } else if (state.phase === 'playing') {
    state.ball.x += state.ball.vx * dt;
    state.ball.y += state.ball.vy * dt;
    bounceOffWalls();
    bounceOffPaddle();
    bounceOffBlocks();
    if (state.blocks.every((block) => !block.alive)) {
      state.phase = 'won';
      state.ball.vx = 0;
      state.ball.vy = 0;
    } else if (state.ball.y > CANVAS_H) {
      loseLife();
    }
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  for (const block of state.blocks) {
    if (block.alive) {
      drawSprite(ctx, 'block_' + block.color, block.x, block.y, BLOCK_W, BLOCK_H);
    }
  }
  drawSprite(ctx, 'ball', state.ball.x, state.ball.y, BALL_SIZE, BALL_SIZE);
  for (let i = 0; i < state.lives; i++) {
    const x = CANVAS_W - 10 - BALL_SIZE - i * (BALL_SIZE + 6);
    drawSprite(ctx, 'ball', x, 10, BALL_SIZE, BALL_SIZE);
  }
  if (state.phase === 'gameover' || state.phase === 'won') {
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.phase === 'won' ? 'Has ganado' : 'Game over', CANVAS_W / 2, CANVAS_H / 2);
    ctx.font = '20px sans-serif';
    ctx.fillText('Pulsa Espacio para jugar de nuevo', CANVAS_W / 2, CANVAS_H / 2 + 50);
  }
  drawSprite(ctx, 'paddle', state.paddle.x, PADDLE.y, PADDLE.w, PADDLE.h);
}

function frame(time) {
  const dt = Math.min((time - lastTime) / 1000, MAX_DT);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

loadSpritesheet(() => {
  requestAnimationFrame((time) => {
    lastTime = time;
    requestAnimationFrame(frame);
  });
});
