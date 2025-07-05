// --- Game Setup ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const highScoreNameEl = document.getElementById("highScoreName");
const speedControls = document.getElementById("speedControls");
const speedRadioButtons = document.querySelectorAll('input[name="speed"]');
const pauseBtn = document.getElementById("pauseBtn");

const messageBox = document.getElementById("messageBox");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const messageButton = document.getElementById("messageButton");
const playerNameInput = document.getElementById("playerNameInput");

// --- Game Constants ---
const gridSize = 20;
let tileCountX;
let tileCountY;

// --- Game State ---
let snake = [];
let food = {};
let dx = 1; // direction x
let dy = 0; // direction y
let score = 0;
let highScoreData = JSON.parse(localStorage.getItem("snakeHighScoreData")) || {
  name: "Player",
  score: 0,
};
let gameSpeed = parseInt(localStorage.getItem("snakeGameSpeed")) || 100;
let playerName = localStorage.getItem("snakePlayerName") || "";
let gameLoop;
let changingDirection = false;
let isGameOver = true;
let isPaused = false;
let foodsEatenCount = 0;
let isBonusFoodActive = false;
let bonusFoodTimer = null;

// --- Initial Setup ---
window.addEventListener("load", setupCanvas);
window.addEventListener("resize", setupCanvas);

function setupCanvas() {
  const container = document.querySelector(".game-container");
  const canvasWidth = Math.floor(container.clientWidth / gridSize) * gridSize;
  canvas.width = canvasWidth;
  canvas.height = canvasWidth; // Keep it square

  tileCountX = canvas.width / gridSize;
  tileCountY = canvas.height / gridSize;

  updateHighScoreDisplay();
  setupSpeedControls();
  showStartMessage();
}

function updateHighScoreDisplay() {
  highScoreEl.textContent = highScoreData.score;
  highScoreNameEl.textContent = `by ${highScoreData.name}`;
}

function setupSpeedControls() {
  speedRadioButtons.forEach((radio) => {
    if (parseInt(radio.value) === gameSpeed) {
      radio.checked = true;
    }
    if (radio.checked) {
      radio.nextElementSibling.style.color = "#48bb78";
    } else {
      radio.nextElementSibling.style.color = "";
    }
  });

  speedControls.addEventListener("change", (e) => {
    if (e.target.name === "speed") {
      gameSpeed = parseInt(e.target.value);
      localStorage.setItem("snakeGameSpeed", gameSpeed);
      setupSpeedControls();
    }
  });
}

function toggleSpeedControls(enabled) {
  speedRadioButtons.forEach((radio) => {
    radio.disabled = !enabled;
  });
}

function showStartMessage() {
  isGameOver = true;
  isPaused = false;
  playerNameInput.value = playerName;
  playerNameInput.style.display = "block";
  toggleSpeedControls(true);
  messageTitle.textContent = "Welcome to Snake!";
  messageText.textContent = "Enter your name to play.";
  messageButton.textContent = "Start Game";
  messageBox.classList.remove("hidden");
  messageButton.onclick = startGame;
}

function showGameOverMessage() {
  isGameOver = true;
  isPaused = false;
  toggleSpeedControls(true);
  messageTitle.textContent = "Game Over!";
  messageText.textContent = `${playerName}, your score: ${score}`;
  playerNameInput.style.display = "none";
  messageButton.textContent = "Play Again";
  messageBox.classList.remove("hidden");
  messageButton.onclick = showStartMessage;
}

function startGame() {
  playerName = playerNameInput.value || "Anonymous";
  localStorage.setItem("snakePlayerName", playerName);

  isGameOver = false;
  isPaused = false;
  pauseBtn.textContent = "❚❚";
  toggleSpeedControls(false);
  messageBox.classList.add("hidden");

  snake = [
    { x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) },
    { x: Math.floor(tileCountX / 2) - 1, y: Math.floor(tileCountY / 2) },
    { x: Math.floor(tileCountX / 2) - 2, y: Math.floor(tileCountY / 2) },
  ];
  dx = 1;
  dy = 0;
  score = 0;
  scoreEl.textContent = score;
  foodsEatenCount = 0;
  hideBonusFood();

  createFood();

  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(mainLoop, gameSpeed);
}

// --- Game Loop ---
function mainLoop() {
  if (isGameOver || isPaused) return;
  changingDirection = false;
  clearCanvas();
  moveSnake();
  drawFood();
  drawBonusFood();
  drawSnake();
  checkCollision();
}

function clearCanvas() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --- Snake Logic ---
function drawSnake() {
  snake.forEach((part, index) => {
    ctx.fillStyle = index === 0 ? "#48bb78" : "#38a169";
    ctx.beginPath();
    ctx.arc(
      part.x * gridSize + gridSize / 2,
      part.y * gridSize + gridSize / 2,
      gridSize / 2,
      0,
      2 * Math.PI
    );
    ctx.fill();
  });

  const head = snake[0];
  ctx.fillStyle = "#000";
  const eyeSize = gridSize / 5;
  let eyeX = head.x * gridSize + gridSize / 2;
  let eyeY = head.y * gridSize + gridSize / 2;

  if (dx === 1) {
    eyeX += gridSize / 4;
  } else if (dx === -1) {
    eyeX -= gridSize / 4;
  } else if (dy === 1) {
    eyeY += gridSize / 4;
  } else if (dy === -1) {
    eyeY -= gridSize / 4;
  }

  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeSize, 0, 2 * Math.PI);
  ctx.fill();
}

function moveSnake() {
  const head = { x: snake[0].x + dx, y: snake[0].y + dy };
  snake.unshift(head);

  const hasEatenFood = snake[0].x === food.x && snake[0].y === food.y;
  const hasEatenBonusFood =
    isBonusFoodActive &&
    snake[0].x === bonusFood.x &&
    snake[0].y === bonusFood.y;

  if (hasEatenFood) {
    score += 10;
    foodsEatenCount++;
    if (foodsEatenCount % 5 === 0) {
      createBonusFood();
    }
    createFood();
  } else if (hasEatenBonusFood) {
    score += 50;
    hideBonusFood();
  } else {
    snake.pop();
  }

  scoreEl.textContent = score;
  if (score > highScoreData.score) {
    highScoreData = { name: playerName, score: score };
    localStorage.setItem("snakeHighScoreData", JSON.stringify(highScoreData));
    updateHighScoreDisplay();
  }
}

// --- Food Logic ---
function createFood() {
  let foodX, foodY;
  while (true) {
    foodX = Math.floor(Math.random() * tileCountX);
    foodY = Math.floor(Math.random() * tileCountY);
    let isFoodOnSnake = snake.some(
      (part) => part.x === foodX && part.y === foodY
    );
    let isFoodOnBonus =
      isBonusFoodActive && foodX === bonusFood.x && foodY === bonusFood.y;
    if (!isFoodOnSnake && !isFoodOnBonus) break;
  }
  food = { x: foodX, y: foodY };
}

function drawFood() {
  ctx.fillStyle = "#e53e3e";
  ctx.strokeStyle = "#9b2c2c";
  ctx.beginPath();
  ctx.arc(
    food.x * gridSize + gridSize / 2,
    food.y * gridSize + gridSize / 2,
    gridSize / 2,
    0,
    2 * Math.PI
  );
  ctx.fill();
  ctx.stroke();
}

function createBonusFood() {
  isBonusFoodActive = true;
  let foodX, foodY;
  while (true) {
    foodX = Math.floor(Math.random() * tileCountX);
    foodY = Math.floor(Math.random() * tileCountY);
    let isFoodOnSnake = snake.some(
      (part) => part.x === foodX && part.y === foodY
    );
    let isFoodOnRegular = foodX === food.x && foodY === food.y;
    if (!isFoodOnSnake && !isFoodOnRegular) break;
  }
  bonusFood = { x: foodX, y: foodY };

  if (bonusFoodTimer) clearTimeout(bonusFoodTimer);
  bonusFoodTimer = setTimeout(hideBonusFood, 5000); // Bonus food lasts 5 seconds
}

function hideBonusFood() {
  isBonusFoodActive = false;
  bonusFood = {};
  if (bonusFoodTimer) clearTimeout(bonusFoodTimer);
}

function drawBonusFood() {
  if (!isBonusFoodActive) return;

  // --- Twinkle Effect ---
  // Use a sine wave based on the current time to create a smooth pulse
  const pulse = Math.sin(Date.now() / 150) * 2; // Adjust divisor for speed, multiplier for size
  const radius = (gridSize / 2) * 0.8 + pulse;

  // --- Glow Effect ---
  ctx.shadowColor = "#f6e05e"; // Gold glow
  ctx.shadowBlur = 15;

  // Draw the bonus food
  ctx.fillStyle = "#f6e05e"; // Yellow/Gold
  ctx.strokeStyle = "#d69e2e";
  ctx.beginPath();
  ctx.arc(
    bonusFood.x * gridSize + gridSize / 2,
    bonusFood.y * gridSize + gridSize / 2,
    radius, // Use the dynamic, twinkling radius
    0,
    2 * Math.PI
  );
  ctx.fill();
  ctx.stroke();

  // Reset shadow so it doesn't affect other elements
  ctx.shadowBlur = 0;
}

// --- Collision Detection ---
function checkCollision() {
  const head = snake[0];

  if (
    head.x < 0 ||
    head.x >= tileCountX ||
    head.y < 0 ||
    head.y >= tileCountY
  ) {
    gameOver();
    return;
  }

  for (let i = 4; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      gameOver();
      return;
    }
  }
}

function gameOver() {
  clearInterval(gameLoop);
  showGameOverMessage();
}

// --- Controls ---
function togglePause() {
  if (isGameOver) return;
  isPaused = !isPaused;
  if (isPaused) {
    clearInterval(gameLoop);
    pauseBtn.textContent = "►"; // Play icon
    if (isBonusFoodActive) clearTimeout(bonusFoodTimer); // Pause the bonus food timer
    messageTitle.textContent = "Paused";
    playerNameInput.style.display = "none";
    messageText.textContent = "Press 'P' or the button to resume.";
    messageButton.textContent = "Resume";
    messageBox.classList.remove("hidden");
    messageButton.onclick = togglePause;
  } else {
    if (isBonusFoodActive) {
      // Resume the bonus food timer
      bonusFoodTimer = setTimeout(hideBonusFood, 5000);
    }
    pauseBtn.textContent = "❚❚"; // Pause icon
    messageBox.classList.add("hidden");
    gameLoop = setInterval(mainLoop, gameSpeed);
  }
}

document.addEventListener("keydown", changeDirection);
document
  .getElementById("upBtn")
  .addEventListener("click", () => setDirection(0, -1));
document
  .getElementById("downBtn")
  .addEventListener("click", () => setDirection(0, 1));
document
  .getElementById("leftBtn")
  .addEventListener("click", () => setDirection(-1, 0));
document
  .getElementById("rightBtn")
  .addEventListener("click", () => setDirection(1, 0));
pauseBtn.addEventListener("click", togglePause);

function setDirection(newDx, newDy) {
  if (isGameOver || changingDirection || isPaused) return;
  changingDirection = true;

  const goingUp = dy === -1;
  const goingDown = dy === 1;
  const goingRight = dx === 1;
  const goingLeft = dx === -1;

  if (newDy === -1 && !goingDown) {
    dx = 0;
    dy = -1;
  }
  if (newDy === 1 && !goingUp) {
    dx = 0;
    dy = 1;
  }
  if (newDx === -1 && !goingRight) {
    dx = -1;
    dy = 0;
  }
  if (newDx === 1 && !goingLeft) {
    dx = 1;
    dy = 0;
  }
}

function changeDirection(event) {
  const LEFT_KEY = 37;
  const RIGHT_KEY = 39;
  const UP_KEY = 38;
  const DOWN_KEY = 40;
  const P_KEY = 80;

  const keyPressed = event.keyCode;

  if (keyPressed === P_KEY) {
    togglePause();
    return;
  }

  if (keyPressed === UP_KEY) setDirection(0, -1);
  if (keyPressed === DOWN_KEY) setDirection(0, 1);
  if (keyPressed === LEFT_KEY) setDirection(-1, 0);
  if (keyPressed === RIGHT_KEY) setDirection(1, 0);
}
