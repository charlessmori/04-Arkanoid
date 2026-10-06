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

const MAX_DT = 1 / 30; // limita el delta para evitar saltos

const state = {
  phase: 'ready', // 'ready' | 'playing'
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

const keys = {};
let lastTime = 0;

window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'Space') {
    e.preventDefault();
    if (!e.repeat) launchBall();
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
