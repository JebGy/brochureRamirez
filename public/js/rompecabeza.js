const IMAGE_URL =
  "https://ramirezgroup.com.pe/wp-content/uploads/2023/06/logo-RAMIREZ-GROUP.png";
const START_GRID = 4;
const GAME_TIME_LIMIT = 30; // 20 segundos

const board = document.getElementById("board");
const movesEl = document.getElementById("moves");
const timeEl = document.getElementById("time");
const toast = document.getElementById("toast");
const shuffleBtn = document.getElementById("shuffleBtn");
const hintBtn = document.getElementById("hintBtn");
const gridSelect = document.getElementById("gridSelect");
const previewImg = document.getElementById("previewImg");
const timerDisplay = document.getElementById("timerDisplay");
const gameOver = document.getElementById("gameOver");
const restartBtn = document.getElementById("restartBtn");

let N = START_GRID; // celdas por lado
let tiles = []; // arreglo con índices 0..(N*N-1)
let firstPick = null; // índice seleccionado para swap
let moves = 0;
let startTime = null;
let timerId = null;
let gameTimerId = null;
let gameTimeLeft = GAME_TIME_LIMIT;
let gameActive = false;
let showHints = false;

gridSelect.value = String(N);

function setGrid(n) {
  N = n;
  board.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${N}, 1fr)`;
  rebuild();
}

function createTiles() {
  tiles = Array.from({ length: N * N }, (_, i) => i);
}

function startGameTimer() {
  gameTimeLeft = GAME_TIME_LIMIT;
  gameActive = true;
  updateTimerDisplay();
  
  gameTimerId = setInterval(() => {
    gameTimeLeft--;
    updateTimerDisplay();
    
    if (gameTimeLeft <= 0) {
      endGame(false); // Game over por tiempo
    }
  }, 1000);
}

function updateTimerDisplay() {
  timerDisplay.textContent = `${gameTimeLeft}s`;
  
  // Cambiar color cuando quedan 5 segundos o menos
  if (gameTimeLeft <= 5) {
    timerDisplay.classList.add("warning");
  } else {
    timerDisplay.classList.remove("warning");
  }
}

function endGame(won = false) {
  gameActive = false;
  clearInterval(gameTimerId);
  clearInterval(timerId);
  
  if (won) {
    celebrate();
  } else {
    // Mostrar pantalla de game over
    gameOver.classList.add("show");
    // Deshabilitar el tablero
    board.style.pointerEvents = "none";
  }
}

function resetGame() {
  gameActive = false;
  clearInterval(gameTimerId);
  clearInterval(timerId);
  gameOver.classList.remove("show");
  board.style.pointerEvents = "auto";
  gameTimeLeft = GAME_TIME_LIMIT;
  updateTimerDisplay();
  timerDisplay.classList.remove("warning");
}

function shuffle() {
  resetGame();
  
  // Fisher–Yates
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  
  // reinicio stats
  moves = 0;
  movesEl.textContent = moves;
  startTime = Date.now();
  
  // Timer para el tiempo transcurrido
  timerId = setInterval(() => {
    const s = Math.floor((Date.now() - startTime) / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    timeEl.textContent = `${mm}:${ss}`;
  }, 500);
  
  // Iniciar timer del juego
  startGameTimer();
  
  render();
}

function rebuild() {
  resetGame();
  createTiles();
  render(true);
}

function render(initial = false) {
  board.innerHTML = "";
  const size = getComputedStyle(document.documentElement)
    .getPropertyValue("--size")
    .trim();
  const pixels = parseFloat(size);
  const stepX = 100 / (N - 1);
  const stepY = 100 / (N - 1);
  tiles.forEach((tileIndex, posIndex) => {
    const col = posIndex % N;
    const row = Math.floor(posIndex / N);
    const srcCol = tileIndex % N;
    const srcRow = Math.floor(tileIndex / N);
    const tile = document.createElement("button");
    tile.className = "tile";
    tile.setAttribute("role", "gridcell");
    tile.setAttribute("aria-label", `Pieza ${posIndex + 1}`);
    tile.style.backgroundImage = `url(${IMAGE_URL})`;
    // background-position en % basado en la rebanada original
    const x = (srcCol / (N - 1)) * 100;
    const y = (srcRow / (N - 1)) * 100;
    tile.style.backgroundPosition = `${isFinite(x) ? x : 0}% ${
      isFinite(y) ? y : 0
    }%`;
    tile.style.backgroundSize = `calc(var(--size)) calc(var(--size))`;

    // borde verde si está en lugar correcto y está activa la pista
    const correct = tileIndex === posIndex;
    if (showHints && correct) tile.classList.add("correct");

    tile.addEventListener("click", () => onPick(posIndex));
    board.appendChild(tile);
  });
  if (initial) {
    // Mezcla inicial ligera para ver el estado no resuelto
    shuffle();
  }
}

function onPick(index) {
  if (!gameActive) return; // No permitir movimientos si el juego no está activo
  
  if (firstPick === null) {
    firstPick = index;
    board.children[index].style.outline = "3px solid #60a5fa";
    return;
  }
  if (firstPick === index) {
    board.children[index].style.outline = "";
    firstPick = null;
    return;
  }
  // Intercambiar piezas
  [tiles[firstPick], tiles[index]] = [tiles[index], tiles[firstPick]];
  board.children[firstPick].style.outline = "";
  firstPick = null;
  moves++;
  movesEl.textContent = moves;
  render();
  if (isSolved()) endGame(true);
}

function isSolved() {
  return tiles.every((v, i) => v === i);
}

function celebrate() {
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

// Event listeners
shuffleBtn.addEventListener("click", shuffle);
hintBtn.addEventListener("click", () => {
  showHints = !showHints;
  hintBtn.textContent = showHints
    ? "Ocultar pista"
    : "Pista (resaltar piezas correctas)";
  render();
});
gridSelect.addEventListener("change", (e) => {
  setGrid(parseInt(e.target.value, 10));
});
restartBtn.addEventListener("click", () => {
  shuffle();
});

// Inicializar
setGrid(N);
