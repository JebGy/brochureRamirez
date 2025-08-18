const W = 600,
  H = 600;
const canvas = document.getElementById("maze");
const ctx = canvas.getContext("2d");
const sizeSel = document.getElementById("sizeSel");
const seedInput = document.getElementById("seedInput");
const speedSel = document.getElementById("speedSel");
const truckInput = document.getElementById("truckInput");
const newBtn = document.getElementById("newBtn");
const resetBtn = document.getElementById("resetBtn");
const solveBtn = document.getElementById("solveBtn");
const menuBtn = document.getElementById("menuBtn");
const statsEl = document.getElementById("stats");

// RNG con semilla
function mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function strSeed(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const truck = new Image();
truck.crossOrigin = "anonymous";
truck.src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8vj9JhyUyR5wdfKKK3X4c0rp6jCr4VRIjiw&s";

let N = parseInt(sizeSel.value, 10);
let rng = Math.random;
let grid,
  cellSize,
  walls,
  player,
  goal,
  anim = { t: 0, from: null, to: null, dur: 120 }, // Animación media predefinida
  solutionPath;
let moves = 0,
  startTime = 0,
  finished = false;

function resetRng() {
  const seed = seedInput.value.trim();
  rng = seed ? mulberry32(strSeed(seed)) : Math.random;
}

function init() {
  resetRng();
  N = parseInt(sizeSel.value, 10);
  cellSize = Math.floor(Math.min(W, H) / N);
  buildMaze(N, N);
  player = { r: 0, c: 0, angle: 0 };
  goal = { r: N - 1, c: N - 1 };
  anim.dur = parseInt(speedSel.value, 10);
  moves = 0;
  startTime = performance.now();
  finished = false;
  solutionPath = null;
  draw();
}

// Generación (backtracker)
function buildMaze(rows, cols) {
  grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ visited: false }))
  );
  walls = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => [true, true, true, true])
  );
  const stack = [];
  let r = 0,
    c = 0;
  grid[r][c].visited = true;
  let total = rows * cols,
    visited = 1;
  while (visited < total) {
    const neigh = [];
    if (r > 0 && !grid[r - 1][c].visited) neigh.push([r - 1, c, 0]);
    if (c < cols - 1 && !grid[r][c + 1].visited) neigh.push([r, c + 1, 1]);
    if (r < rows - 1 && !grid[r + 1][c].visited) neigh.push([r + 1, c, 2]);
    if (c > 0 && !grid[r][c - 1].visited) neigh.push([r, c - 1, 3]);
    if (neigh.length) {
      stack.push([r, c]);
      const [nr, nc, dir] = neigh[Math.floor(rng() * neigh.length)];
      walls[r][c][dir] = false;
      const opp = (dir + 2) % 4;
      walls[nr][nc][opp] = false;
      r = nr;
      c = nc;
      grid[r][c].visited = true;
      visited++;
    } else {
      [r, c] = stack.pop();
    }
  }
}

function cellCenter(r, c) {
  return { x: c * cellSize + cellSize / 2, y: r * cellSize + cellSize / 2 };
}

function drawGrid() {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate((W - N * cellSize) / 2, (H - N * cellSize) / 2);
  ctx.fillStyle = "#0b1326";
  ctx.fillRect(0, 0, N * cellSize, N * cellSize);
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 2;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const x = c * cellSize,
        y = r * cellSize;
      const w = walls[r][c];
      ctx.beginPath();
      if (w[0]) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + cellSize, y);
      }
      if (w[1]) {
        ctx.moveTo(x + cellSize, y);
        ctx.lineTo(x + cellSize, y + cellSize);
      }
      if (w[2]) {
        ctx.moveTo(x, y + cellSize);
        ctx.lineTo(x + cellSize, y + cellSize);
      }
      if (w[3]) {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + cellSize);
      }
      ctx.stroke();
    }
  }
  const start = cellCenter(0, 0),
    end = cellCenter(N - 1, N - 1);
  ctx.fillStyle = "rgba(34,197,94,.15)";
  ctx.beginPath();
  ctx.arc(start.x, start.y, cellSize * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(59,130,246,.15)";
  ctx.beginPath();
  ctx.arc(end.x, end.y, cellSize * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.translate((W - N * cellSize) / 2, (H - N * cellSize) / 2);
  const cur =
    anim.t > 0
      ? {
          r: anim.from.r + (anim.to.r - anim.from.r) * anim.t,
          c: anim.from.c + (anim.to.c - anim.from.c) * anim.t,
        }
      : player;
  const { x, y } = cellCenter(cur.r, cur.c);
  const size = cellSize * 0.75;
  ctx.translate(x, y);
  ctx.rotate(player.angle);
  if (truck.complete) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(truck, -size / 2, -size / 2, size, size);
  } else {
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(-size / 2, -size / 2, size, size);
  }
  ctx.restore();
}

function drawSolution() {
  if (!solutionPath) return;
  ctx.save();
  ctx.translate((W - N * cellSize) / 2, (H - N * cellSize) / 2);
  ctx.strokeStyle = "rgba(168,85,247,.65)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  solutionPath.forEach((p, i) => {
    const { x, y } = cellCenter(p.r, p.c);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function draw() {
  drawGrid();
  drawSolution();
  drawPlayer();
  const t = Math.max(0, Math.floor((performance.now() - startTime) / 1000));
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(t % 60).padStart(2, "0");
  statsEl.innerHTML = `<strong>Movimientos:</strong> ${moves} • <strong>Tiempo:</strong> ${mm}:${ss}${
    finished ? " • ✅ Completado" : ""
  }`;
}

function canMove(dir) {
  const r = player.r,
    c = player.c;
  if (dir === 0 && !walls[r][c][0]) return true;
  if (dir === 1 && !walls[r][c][1]) return true;
  if (dir === 2 && !walls[r][c][2]) return true;
  if (dir === 3 && !walls[r][c][3]) return true;
  return false;
}

function step(dir) {
  if (finished) return false;
  if (!canMove(dir)) return false;
  const dr = [-1, 0, 1, 0][dir];
  const dc = [0, 1, 0, -1][dir];
  const to = { r: player.r + dr, c: player.c + dc };
  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
  player.angle = angles[dir];
  moves++;
  if (anim.dur > 0) {
    anim.from = { r: player.r, c: player.c };
    anim.to = to;
    anim.t = 0;
    const start = performance.now();
    return new Promise((resolve) => {
      const tick = (now) => {
        const k = Math.min(1, (now - start) / anim.dur);
        anim.t = k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k;
        draw();
        if (k < 1) requestAnimationFrame(tick);
        else {
          player = to;
          anim.t = 0;
          checkGoal();
          draw();
          resolve(true);
        }
      };
      requestAnimationFrame(tick);
    });
  } else {
    player = to;
    checkGoal();
    draw();
    return Promise.resolve(true);
  }
}

function checkGoal() {
  if (player.r === N - 1 && player.c === N - 1) finished = true;
}

// --- Control por puntero ---
function canvasToCell(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (canvas.width / rect.width);
  const y = (clientY - rect.top) * (canvas.height / rect.height);
  const tx = (W - N * cellSize) / 2,
    ty = (H - N * cellSize) / 2;
  const gx = x - tx,
    gy = y - ty;
  const c = Math.max(0, Math.min(N - 1, Math.floor(gx / cellSize)));
  const r = Math.max(0, Math.min(N - 1, Math.floor(gy / cellSize)));
  return { r, c };
}

let dragging = false;
let lastTarget = null;
let capturedId = null;
let stepping = false;

async function followToward(target) {
  // Avanza paso a paso hacia la celda objetivo sin atravesar paredes.
  if (stepping) return; // evita reentradas
  stepping = true;
  let guard = 0;
  while (
    dragging &&
    (player.r !== target.r || player.c !== target.c) &&
    guard < N * N
  ) {
    const dr = target.r - player.r;
    const dc = target.c - player.c;
    // prioridad al eje con mayor distancia
    const tryDirs = [];
    if (Math.abs(dr) >= Math.abs(dc)) {
      if (dr < 0) tryDirs.push(0);
      if (dr > 0) tryDirs.push(2);
      if (dc > 0) tryDirs.push(1);
      if (dc < 0) tryDirs.push(3);
    } else {
      if (dc > 0) tryDirs.push(1);
      if (dc < 0) tryDirs.push(3);
      if (dr < 0) tryDirs.push(0);
      if (dr > 0) tryDirs.push(2);
    }
    let moved = false;
    for (const d of tryDirs) {
      if (canMove(d)) {
        await step(d);
        moved = true;
        break;
      }
    }
    if (!moved) break; // bloqueado por paredes
    guard++;
  }
  stepping = false;
}

function onPointer(e) {
  const target = canvasToCell(e.clientX, e.clientY);
  lastTarget = target;
  followToward(target);
}

canvas.addEventListener("pointerdown", (e) => {
  dragging = true;
  capturedId = e.pointerId;
  canvas.setPointerCapture(capturedId);
  onPointer(e);
});
canvas.addEventListener("pointermove", (e) => {
  if (dragging) onPointer(e);
});
function stopDrag(e) {
  dragging = false;
  if (capturedId !== null) {
    try {
      canvas.releasePointerCapture(capturedId);
    } catch {}
    capturedId = null;
  }
}
canvas.addEventListener("pointerup", stopDrag);
canvas.addEventListener("pointercancel", stopDrag);
canvas.addEventListener("pointerleave", stopDrag);

// Solución (BFS)
function solve() {
  const q = [[0, 0]];
  const prev = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => null)
  );
  const seen = Array.from({ length: N }, () =>
    Array.from({ length: N }, () => false)
  );
  seen[0][0] = true;
  while (q.length) {
    const [r, c] = q.shift();
    if (r === N - 1 && c === N - 1) break;
    for (let d = 0; d < 4; d++) {
      if (!walls[r][c][d]) {
        const nr = r + [-1, 0, 1, 0][d];
        const nc = c + [0, 1, 0, -1][d];
        if (!seen[nr][nc]) {
          seen[nr][nc] = true;
          prev[nr][nc] = [r, c];
          q.push([nr, nc]);
        }
      }
    }
  }
  const path = [];
  let r = N - 1,
    c = N - 1;
  while (r !== null && c !== null) {
    path.push({ r, c });
    const p = prev[r][c];
    if (!p) break;
    [r, c] = p;
  }
  solutionPath = path.reverse();
  draw();
}

// UI
newBtn.addEventListener("click", init);
resetBtn.addEventListener("click", () => {
  dragging = false;
  player = { r: 0, c: 0, angle: 0 };
  moves = 0;
  startTime = performance.now();
  finished = false;
  draw();
});
solveBtn.addEventListener("click", solve);
menuBtn.addEventListener("click", () => {
  // Redirigir al menú principal
  window.location.href = "/";
});

// Primera carga
init();
