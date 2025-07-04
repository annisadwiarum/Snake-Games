 // --- Game Setup ---
 const canvas = document.getElementById('gameCanvas');
 const ctx = canvas.getContext('2d');
 const scoreEl = document.getElementById('score');
 const highScoreEl = document.getElementById('highScore');

 const messageBox = document.getElementById('messageBox');
 const messageTitle = document.getElementById('messageTitle');
 const messageText = document.getElementById('messageText');
 const messageButton = document.getElementById('messageButton');


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
 let highScore = localStorage.getItem('snakeHighScore') || 0;
 let gameLoop;
 let changingDirection = false;
 let isGameOver = true;

 // --- Initial Setup ---
 window.addEventListener('load', setupCanvas);
 window.addEventListener('resize', setupCanvas);

 function setupCanvas() {
     const container = document.querySelector('.game-container');
     const canvasWidth = Math.floor(container.clientWidth / gridSize) * gridSize;
     canvas.width = canvasWidth;
     canvas.height = canvasWidth; // Keep it square
     
     tileCountX = canvas.width / gridSize;
     tileCountY = canvas.height / gridSize;

     highScoreEl.textContent = highScore;
     showStartMessage();
 }
 
 function showStartMessage() {
     isGameOver = true;
     messageTitle.textContent = "Welcome to Snake!";
     messageText.textContent = "Use Arrow Keys or Buttons to Play.";
     messageButton.textContent = "Start Game";
     messageBox.classList.remove('hidden');
     messageButton.onclick = startGame;
 }
 
 function showGameOverMessage() {
     isGameOver = true;
     messageTitle.textContent = "Game Over!";
     messageText.textContent = `Your score: ${score}`;
     messageButton.textContent = "Play Again";
     messageBox.classList.remove('hidden');
     messageButton.onclick = startGame;
 }


 function startGame() {
     isGameOver = false;
     messageBox.classList.add('hidden');
     
     // Reset game state
     snake = [
         { x: Math.floor(tileCountX / 2), y: Math.floor(tileCountY / 2) },
         { x: Math.floor(tileCountX / 2) - 1, y: Math.floor(tileCountY / 2) },
         { x: Math.floor(tileCountX / 2) - 2, y: Math.floor(tileCountY / 2) },
     ];
     dx = 1;
     dy = 0;
     score = 0;
     scoreEl.textContent = score;
     
     createFood();
     
     if (gameLoop) clearInterval(gameLoop);
     gameLoop = setInterval(mainLoop, 100);
 }

 // --- Game Loop ---
 function mainLoop() {
     if (isGameOver) return;
     changingDirection = false;
     clearCanvas();
     moveSnake();
     drawFood();
     drawSnake();
     checkCollision();
 }

 function clearCanvas() {
     ctx.fillStyle = '#000';
     ctx.fillRect(0, 0, canvas.width, canvas.height);
 }

 // --- Snake Logic ---
 function drawSnake() {
     snake.forEach((part, index) => {
         ctx.fillStyle = index === 0 ? '#48bb78' : '#38a169'; // Head is lighter green
         ctx.strokeStyle = '#1a202c';
         ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
         ctx.strokeRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
     });
 }

 function moveSnake() {
     const head = { x: snake[0].x + dx, y: snake[0].y + dy };
     snake.unshift(head);

     const hasEatenFood = snake[0].x === food.x && snake[0].y === food.y;
     if (hasEatenFood) {
         score += 10;
         scoreEl.textContent = score;
         if (score > highScore) {
             highScore = score;
             highScoreEl.textContent = highScore;
             localStorage.setItem('snakeHighScore', highScore);
         }
         createFood();
     } else {
         snake.pop();
     }
 }

 // --- Food Logic ---
 function createFood() {
     let foodX, foodY;
     while (true) {
         foodX = Math.floor(Math.random() * tileCountX);
         foodY = Math.floor(Math.random() * tileCountY);
         let isFoodOnSnake = snake.some(part => part.x === foodX && part.y === foodY);
         if (!isFoodOnSnake) break;
     }
     food = { x: foodX, y: foodY };
 }

 function drawFood() {
     ctx.fillStyle = '#e53e3e'; // Red
     ctx.strokeStyle = '#9b2c2c';
     ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
     ctx.strokeRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
 }

 // --- Collision Detection ---
 function checkCollision() {
     const head = snake[0];

     // Wall collision
     if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
         gameOver();
         return;
     }

     // Self collision
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
 document.addEventListener('keydown', changeDirection);
 document.getElementById('upBtn').addEventListener('click', () => setDirection(0, -1));
 document.getElementById('downBtn').addEventListener('click', () => setDirection(0, 1));
 document.getElementById('leftBtn').addEventListener('click', () => setDirection(-1, 0));
 document.getElementById('rightBtn').addEventListener('click', () => setDirection(1, 0));

 function setDirection(newDx, newDy) {
      if (isGameOver || changingDirection) return;
     changingDirection = true;
     
     const goingUp = dy === -1;
     const goingDown = dy === 1;
     const goingRight = dx === 1;
     const goingLeft = dx === -1;

     if (newDy === -1 && !goingDown) { dx = 0; dy = -1; } // Up
     if (newDy === 1 && !goingUp) { dx = 0; dy = 1; }    // Down
     if (newDx === -1 && !goingRight) { dx = -1; dy = 0; } // Left
     if (newDx === 1 && !goingLeft) { dx = 1; dy = 0; }   // Right
 }

 function changeDirection(event) {
     const LEFT_KEY = 37;
     const RIGHT_KEY = 39;
     const UP_KEY = 38;
     const DOWN_KEY = 40;

     const keyPressed = event.keyCode;
     
     if (keyPressed === UP_KEY) setDirection(0, -1);
     if (keyPressed === DOWN_KEY) setDirection(0, 1);
     if (keyPressed === LEFT_KEY) setDirection(-1, 0);
     if (keyPressed === RIGHT_KEY) setDirection(1, 0);
 }