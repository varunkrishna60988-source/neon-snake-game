const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const speedEl = document.getElementById("speed");
const messageEl = document.getElementById("message");
const restartButton = document.getElementById("restart");

const tileCount = 24;
const tileSize = canvas.width / tileCount;
const startSnake = [{ x: 11, y: 12 }, { x: 10, y: 12 }, { x: 9, y: 12 }];

let snake, direction, nextDirection, food, score, running, gameOver, lastMoveTime, moveDelay, animationFrame;

function resetGame() {
  snake = startSnake.map((part) => ({ ...part }));
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  running = false;
  gameOver = false;
  lastMoveTime = 0;
  moveDelay = 140;
  food = spawnFood();
  scoreEl.textContent = "0";
  speedEl.textContent = "1x";
  messageEl.classList.remove("is-hidden");
  messageEl.querySelector("h1").textContent = "Neon Snake";
  messageEl.querySelector("p").textContent = "Press any arrow key or WASD to start.";
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(gameLoop);
}

function spawnFood() {
  let newFood;
  do {
    newFood = { x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount) };
  } while (snake.some((part) => part.x === newFood.x && part.y === newFood.y));
  return newFood;
}

function gameLoop(timestamp) {
  draw(timestamp);
  if (running && !gameOver && timestamp - lastMoveTime >= moveDelay) {
    moveSnake();
    lastMoveTime = timestamp;
  }
  animationFrame = requestAnimationFrame(gameLoop);
}

function moveSnake() {
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const hitWall = head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount;
  const hitSelf = snake.some((part) => part.x === head.x && part.y === head.y);
  if (hitWall || hitSelf) {
    endGame();
    return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 1;
    scoreEl.textContent = score;
    updateSpeed();
    food = spawnFood();
  } else {
    snake.pop();
  }
}

function updateSpeed() {
  const level = Math.floor(score / 3);
  moveDelay = Math.max(58, 140 - level * 16);
  speedEl.textContent = String(level + 1) + "x";
}

function endGame() {
  gameOver = true;
  running = false;
  messageEl.classList.remove("is-hidden");
  messageEl.querySelector("h1").textContent = "Game Over";
  messageEl.querySelector("p").textContent = "Final score: " + score + ". Press Restart to play again.";
}

function draw(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawFood(timestamp);
  drawSnake();
}

function drawBackground() {
  ctx.fillStyle = "#040711";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(25, 212, 255, 0.12)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= tileCount; i += 1) {
    const pos = i * tileSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((part, index) => {
    const inset = index === 0 ? 2 : 4;
    const x = part.x * tileSize + inset;
    const y = part.y * tileSize + inset;
    const size = tileSize - inset * 2;
    const alpha = Math.max(0.45, 1 - index * 0.035);
    ctx.shadowColor = "#39ff14";
    ctx.shadowBlur = index === 0 ? 28 : 18;
    ctx.fillStyle = index === 0 ? "#baffb0" : "rgba(57, 255, 20, " + alpha + ")";
    roundRect(x, y, size, size, 7);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = index === 0 ? 2 : 1;
    ctx.stroke();
  });
}

function drawFood(timestamp) {
  const flicker = 0.55 + Math.abs(Math.sin(timestamp / 95)) * 0.45;
  const centerX = food.x * tileSize + tileSize / 2;
  const centerY = food.y * tileSize + tileSize / 2;
  const radius = tileSize * (0.23 + flicker * 0.12);
  ctx.shadowColor = "#d93cff";
  ctx.shadowBlur = 22 + flicker * 20;
  ctx.fillStyle = "rgba(217, 60, 255, " + (0.62 + flicker * 0.38) + ")";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "#ff4dff";
  ctx.shadowBlur = 12;
  ctx.strokeStyle = "rgba(255, 255, 255, " + (0.5 + flicker * 0.35) + ")";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, tileSize * 0.34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

function setDirection(newDirection) {
  const isOpposite = newDirection.x === -direction.x && newDirection.y === -direction.y;
  if (isOpposite) return;
  nextDirection = newDirection;
  if (!gameOver) {
    running = true;
    messageEl.classList.add("is-hidden");
  }
}

window.addEventListener("keydown", (event) => {
  const keys = {
    ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 }
  };
  if (keys[event.key]) {
    event.preventDefault();
    setDirection(keys[event.key]);
  }
});

restartButton.addEventListener("click", resetGame);
resetGame();
