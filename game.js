const CANVAS_W = 800;
const CANVAS_H = 600;

const MAX_DT = 1 / 30; // limita el delta para evitar saltos

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let lastTime = 0;

function update(dt) {
  // se rellena en los pasos siguientes
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
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
