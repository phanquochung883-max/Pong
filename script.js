// Simple Pong game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  // use CSS size and scale for high-DPI
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game constants
const cw = canvas.clientWidth;
const ch = canvas.clientHeight;

const paddle = {
  width: 12,
  height: Math.max(60, ch * 0.18),
  speed: 6,
};

let leftPaddleY = (ch - paddle.height) / 2;
let rightPaddleY = (ch - paddle.height) / 2;

const ball = {
  x: cw / 2,
  y: ch / 2,
  r: 8,
  speed: 5,
  vx: 5,
  vy: 2,
};

let playerScore = 0, aiScore = 0;
const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');

// Input
let keys = { ArrowUp:false, ArrowDown:false };
let mouseY = null;
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseY = e.clientY - rect.top;
});
canvas.addEventListener('mouseleave', () => { mouseY = null; });

// Keyboard
window.addEventListener('keydown', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { keys[e.key] = true; e.preventDefault(); } });
window.addEventListener('keyup', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { keys[e.key] = false; e.preventDefault(); } });

// Helpers
function clamp(v, a, b){ return Math.min(b, Math.max(a, v)); }
function resetBall(direction = 1){
  ball.x = cw / 2;
  ball.y = ch / 2;
  ball.speed = 5;
  const angle = (Math.random() * Math.PI/4) - Math.PI/8; // small random angle
  ball.vx = direction * ball.speed * Math.cos(angle);
  ball.vy = ball.speed * Math.sin(angle);
}

// Collision with paddles
function paddleCollision(pX, pY, pW, pH){
  // returns true if ball intersects rect
  return ball.x - ball.r < pX + pW && ball.x + ball.r > pX &&
         ball.y - ball.r < pY + pH && ball.y + ball.r > pY;
}

// Game loop
let last = performance.now();
let paused = false;
resetBall(Math.random() < 0.5 ? 1 : -1);

function update(dt){
  // Player paddle: mouse or keys
  if (mouseY !== null){
    // center paddle on mouse Y
    leftPaddleY = clamp(mouseY - paddle.height/2, 0, ch - paddle.height);
  } else {
    if (keys.ArrowUp) leftPaddleY -= paddle.speed * (dt/16);
    if (keys.ArrowDown) leftPaddleY += paddle.speed * (dt/16);
    leftPaddleY = clamp(leftPaddleY, 0, ch - paddle.height);
  }

  // AI paddle: follow ball with max speed
  const aiCenter = rightPaddleY + paddle.height/2;
  const diff = ball.y - aiCenter;
  const aiMaxSpeed = 4 * (dt/16);
  rightPaddleY += clamp(diff, -aiMaxSpeed, aiMaxSpeed);
  rightPaddleY = clamp(rightPaddleY, 0, ch - paddle.height);

  // Move ball
  ball.x += ball.vx * (dt/16);
  ball.y += ball.vy * (dt/16);

  // Top/bottom collisions
  if (ball.y - ball.r <= 0){
    ball.y = ball.r;
    ball.vy = -ball.vy;
  } else if (ball.y + ball.r >= ch){
    ball.y = ch - ball.r;
    ball.vy = -ball.vy;
  }

  // Left paddle collision
  const leftPaddleX = 8;
  const rightPaddleX = cw - paddle.width - 8;
  if (ball.vx < 0 && paddleCollision(leftPaddleX, leftPaddleY, paddle.width, paddle.height)){
    // calculate where it hit on paddle (-1 to 1)
    const paddleCenter = leftPaddleY + paddle.height/2;
    const hitPos = (ball.y - paddleCenter) / (paddle.height/2);
    const maxBounce = Math.PI/3; // 60 degrees
    const angle = hitPos * maxBounce;
    const speedIncrease = 0.4;
    ball.speed = Math.min(12, ball.speed + speedIncrease);
    ball.vx = Math.abs(ball.speed * Math.cos(angle));
    ball.vy = ball.speed * Math.sin(angle);
    // nudge ball outside paddle to avoid sticking
    ball.x = leftPaddleX + paddle.width + ball.r + 0.5;
  }

  // Right paddle collision
  if (ball.vx > 0 && paddleCollision(rightPaddleX, rightPaddleY, paddle.width, paddle.height)){
    const paddleCenter = rightPaddleY + paddle.height/2;
    const hitPos = (ball.y - paddleCenter) / (paddle.height/2);
    const maxBounce = Math.PI/3;
    const angle = hitPos * maxBounce;
    const speedIncrease = 0.4;
    ball.speed = Math.min(12, ball.speed + speedIncrease);
    ball.vx = -Math.abs(ball.speed * Math.cos(angle));
    ball.vy = ball.speed * Math.sin(angle);
    ball.x = rightPaddleX - ball.r - 0.5;
  }

  // Score check
  if (ball.x < -ball.r){
    // AI scores
    aiScore++;
    aiScoreEl.textContent = aiScore;
    resetBall(1);
    paused = true;
    setTimeout(()=> paused = false, 800);
  } else if (ball.x > cw + ball.r){
    // Player scores
    playerScore++;
    playerScoreEl.textContent = playerScore;
    resetBall(-1);
    paused = true;
    setTimeout(()=> paused = false, 800);
  }
}

function draw(){
  // clear
  ctx.clearRect(0,0,cw,ch);

  // center dashed line
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(cw/2, 0);
  ctx.lineTo(cw/2, ch);
  ctx.stroke();
  ctx.setLineDash([]);

  // paddles
  ctx.fillStyle = '#dde6ff';
  const leftPaddleX = 8;
  const rightPaddleX = cw - paddle.width - 8;
  roundRect(ctx, leftPaddleX, leftPaddleY, paddle.width, paddle.height, 6);
  roundRect(ctx, rightPaddleX, rightPaddleY, paddle.width, paddle.height, 6);

  // ball
  ctx.beginPath();
  ctx.fillStyle = '#ffd28a';
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
  ctx.fill();

  // overlay scores already handled by DOM; optional HUD
  // small FPS/controls could be added here
}

// utility for rounded rect
function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  ctx.fill();
}

function loop(now){
  const dt = Math.min(40, now - last);
  last = now;
  if (!paused){
    update(dt);
  }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// allow click to toggle pause
canvas.addEventListener('click', () => { paused = !paused; });

// ensure canvas size values used by logic match computed size when loaded
window.addEventListener('load', () => {
  // re-calc sizes once loaded
  const rect = canvas.getBoundingClientRect();
  // update cw, ch references by resizing variables (we used cw/ch as constants earlier)
  // but to keep it simple, ensure ball/paddle positions scale on initial load:
  ball.x = rect.width/2;
  ball.y = rect.height/2;
});

// Optional: keyboard shortcut to reset scores (R)
window.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'r'){
    playerScore = 0; aiScore = 0;
    playerScoreEl.textContent = playerScore;
    aiScoreEl.textContent = aiScore;
    resetBall(Math.random() < 0.5 ? 1 : -1);
  }
});