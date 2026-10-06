const CANVAS_W = 800;
const CANVAS_H = 600;

const PADDLE = { w: 120, h: 16, y: 560, speed: 600 }; // speed: teclado, px/s

const MAX_DT = 1 / 30; // limita el delta para evitar saltos

const state = {
  paddle: { x: 340 }, // esquina izquierda; y fija en PADDLE.y
};

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const keys = {};
let lastTime = 0;

window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = (e.clientX - rect.left) * (CANVAS_W / rect.width);
  state.paddle.x = mouseX - PADDLE.w / 2;
  clampPaddle();
});

function clampPaddle() {
  state.paddle.x = Math.max(0, Math.min(CANVAS_W - PADDLE.w, state.paddle.x));
}

function update(dt) {
  const left = keys.ArrowLeft || keys.KeyA;
  const right = keys.ArrowRight || keys.KeyD;
  state.paddle.x += ((right ? 1 : 0) - (left ? 1 : 0)) * PADDLE.speed * dt;
  clampPaddle();
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
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
