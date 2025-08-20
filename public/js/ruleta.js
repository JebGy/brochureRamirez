const DEFAULT_ITEMS = [
  { label: "Llavero 🔑", weight: 3 },
  { label: "Llavero 🔑", weight: 3 },
  { label: "Llavero 🔑", weight: 3 },
  { label: "Gorro 🧢", weight: 3 },
  { label: "Gorro 🧢", weight: 3 },
  { label: "Vuelve a girar 🎡", weight: 3 },
  { label: "Perdiste 😭", weight: 3 },
  { label: "Libreta 📒", weight: 3 },
  { label: "Libreta 📒", weight: 3 },
  { label: "Libreta 📒", weight: 3 },
  { label: "Shaker 🥤", weight: 3 },
  { label: "Shaker 🥤", weight: 3 },
  { label: "Shaker 🥤", weight: 3 },
  { label: "Perdiste 😭", weight: 3 },
];

const wheelG = document.getElementById("wheel");
const spinBtn = document.getElementById("spinBtn");
const fastBtn = document.getElementById("fastBtn");
const resetBtn = document.getElementById("resetBtn");
const resultEl = document.getElementById("result");
const oddsEl = document.getElementById("odds");
const historyEl = document.getElementById("history");
const itemsTblBody = document.querySelector("#itemsTbl tbody");
const totalLegend = document.getElementById("totalLegend");
const labelInput = document.getElementById("labelInput");
const weightInput = document.getElementById("weightInput");
const colorInput = document.getElementById("colorInput");
const addBtn = document.getElementById("addBtn");
const seedBtn = document.getElementById("seedBtn");
const clearBtn = document.getElementById("clearBtn");

let state = { items: [], rotation: 0, spinning: false, draws: {}, hasResult: false };

function save() {
  localStorage.setItem("weighted-wheel", JSON.stringify(state.items));
}
function load() {
  const raw = localStorage.getItem("weighted-wheel");
  if (raw) {
    try {
      state.items = JSON.parse(raw);
    } catch (e) {}
  }
  state.items = [...DEFAULT_ITEMS].map((it, i) => ({
    ...it,
    color: pickColor(i),
  }));
}

function pickColor(i) {
  const colors = ["#476ACE", "#2DB4A5"];
  return colors[i % colors.length];
}
function toRadians(deg) {
  return (deg * Math.PI) / 180;
}
function polarToXY(cx, cy, r, angleDeg) {
  const a = toRadians(angleDeg);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function arcPath(cx, cy, r, a0, a1) {
  const start = polarToXY(cx, cy, r, a0);
  const end = polarToXY(cx, cy, r, a1);
  const large = (a1 - a0) % 360 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`;
}
function normalizedWeights() {
  const items = state.items.filter((it) => (it.weight || 0) > 0);
  const total = items.reduce((s, it) => s + Number(it.weight), 0);
  return { items, total };
}
function drawWheel() {
  wheelG.innerHTML = "";
  const { items, total } = normalizedWeights();
  // Aumentar el tamaño de la ruleta
  const cx = 350,  // Cambiar de 300 a 350
    cy = 350,      // Cambiar de 300 a 350
    r = 330;       // Cambiar de 280 a 330
  if (items.length === 0 || total <= 0) {
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", r);
    circle.setAttribute("fill", "#0d1326");
    circle.setAttribute("stroke", "#334155");
    circle.setAttribute("stroke-width", "2");
    wheelG.appendChild(circle);
    oddsEl.textContent = "Agrega ítems con peso > 0.";
    totalLegend.textContent = "";
    return;
  }
  let angle = -90;

  const slices = [];
  // CAMBIO PRINCIPAL: Usar pesos en lugar de sectores uniformes

  items.forEach((it, i) => {
    const a0 = angle;
    // Calcular el ángulo basado en el peso del item
    const sweep = (it.weight / total) * 360;
    const a1 = angle + sweep;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", arcPath(cx, cy, r, a0, a1));
    path.setAttribute("fill", it.color || pickColor(i));
    path.setAttribute("stroke", "#0b1020");

    path.setAttribute("stroke-width", "1");
    wheelG.appendChild(path);

    const mid = a0 + sweep / 2;
    const textRadius = r * 0.7;
    const textPos = polarToXY(cx, cy, textRadius, mid);
    
    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.setAttribute("x", textPos.x);
    label.setAttribute("y", textPos.y);
    label.setAttribute("font-size", "14");
    label.setAttribute("z-index", "99999");
    label.setAttribute("fill", "#ffffff");
    label.setAttribute("font-weight", "700");
    label.setAttribute("font-family", "Arial, sans-serif");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    label.setAttribute("stroke", "#000000");
    label.setAttribute("stroke-width", "0.3");
    label.setAttribute("paint-order", "stroke fill");
    label.setAttribute(
      "transform",
      `rotate(${mid} ${textPos.x} ${textPos.y})`
    );

    const text = it.label;
    if (text.includes("\n")) {
      const lines = text.split("\n");
      label.innerHTML = "";
      lines.forEach((line, index) => {
        const tspan = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "tspan"
        );
        tspan.setAttribute("x", textPos.x);
        tspan.setAttribute("dy", index === 0 ? "0" : "0.2em");
        tspan.textContent = line;
        label.appendChild(tspan);
      });
    
    } else {
      label.textContent = text;
    }
    wheelG.appendChild(label);
    slices.push({ a0, a1, mid, item: it });
    angle = a1; // Actualizar el ángulo para el siguiente sector
  });
  wheelG.dataset.slices = JSON.stringify(slices);
  oddsEl.textContent = items
    .map((it) => `${it.label}: ${((it.weight / total) * 100).toFixed(2)}%`)
    .join(" • ");
  totalLegend.textContent = `Total de peso: ${total}`;
}
function renderTable() {
  const { items, total } = normalizedWeights();
  itemsTblBody.innerHTML = "";
  state.items.forEach((it, idx) => {
    const tr = document.createElement("tr");
    const p = total > 0 ? (it.weight > 0 ? (it.weight / total) * 100 : 0) : 0;
    tr.innerHTML = `
          <td><input data-k="label" data-i="${idx}" type="text" value="${
      it.label
    }"/></td>
          <td><input data-k="weight" data-i="${idx}" type="number" step="0.01" min="0" value="${
      it.weight
    }"/></td>
          <td>${p.toFixed(2)}%</td>
          <td style="text-align:right;">
            <input data-k="color" data-i="${idx}" type="color" value="${
      it.color || pickColor(idx)
    }" title="Color"/>
            <button data-del="${idx}" class="btn danger" style="padding:.3rem .5rem; margin-left:.3rem;">✕</button>
          </td>
        `;
    itemsTblBody.appendChild(tr);
  });
}
function rebuild() {
  drawWheel();
  renderTable();
  save();
  updateButtons();
}
function updateButtons() {
  const { total } = normalizedWeights();
  const can = total > 0 && !state.spinning && !state.hasResult;
  if (spinBtn) spinBtn.disabled = !can;
  fastBtn.disabled = !can;
  // Durante el giro o después de mostrar resultado, solo permitir el botón de reiniciar
  resetBtn.disabled = false;
}
function addItem(label, weight, color) {
  if (!label) label = `Ítem ${state.items.length + 1}`;
  const w = Number(weight);
  state.items.push({
    label,
    weight: isFinite(w) && w >= 0 ? w : 1,
    color: color || pickColor(state.items.length),
  });
  rebuild();
}
function removeItem(i) {
  state.items.splice(i, 1);
  rebuild();
}
function weightedPick() {
  const { items, total } = normalizedWeights();
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= items[i].weight;
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
function findSliceForLabel(label) {
  const slices = JSON.parse(wheelG.dataset.slices || "[]");
  return slices.find((s) => s.item.label === label);
}
function spin(durationMs = 3600) {
  if (state.spinning) return;
  const pick = weightedPick();
  if (!pick) return;
  const slice = findSliceForLabel(pick.label);
  if (!slice) return;
  
  // El puntero está en la parte superior (-90°)
  // Necesitamos que el centro del slice seleccionado quede en esa posición
  const targetMid = slice.mid;
  const baseRotations = 3 * 360; // 3 vueltas completas
  
  // Calculamos el ángulo necesario para que targetMid llegue a -90°
  let neededRotation = -90 - targetMid;
  
  // Normalizamos para obtener la rotación más corta
  while (neededRotation <= -180) neededRotation += 360;
  while (neededRotation > 180) neededRotation -= 360;
  
  // Calculamos la rotación final
  const finalRotation = state.rotation + baseRotations + neededRotation;

  wheelG.style.transitionDuration = `${durationMs}ms`;
  wheelG.style.transitionTimingFunction = "cubic-bezier(0.25, 0.1, 0.25, 1)";
  state.spinning = true;
  
  // Deshabilitar botones durante el giro
  updateButtons();
  
  wheelG.getBoundingClientRect();
  wheelG.style.transform = `rotate(${finalRotation}deg)`;

  const onEnd = () => {
    wheelG.removeEventListener("transitionend", onEnd);
    state.spinning = false;
    state.hasResult = true; // Marcar que ya hay un resultado
    state.rotation = finalRotation % 360;
    resultEl.innerHTML = `Resultado: <span class="pill">${pick.label}</span>`;
    state.draws[pick.label] = (state.draws[pick.label] || 0) + 1;
    const entries = Object.entries(state.draws).sort((a, b) => b[1] - a[1]);
    historyEl.innerHTML = entries.map(([lab, c]) => `${lab}: ${c}`).join(" • ");
    
    // Actualizar botones después del giro (botón permanece deshabilitado)
    updateButtons();
  };
  wheelG.addEventListener("transitionend", onEnd);
}

addBtn?.addEventListener("click", () => {
  if (labelInput && weightInput && colorInput) {
    addItem(
      labelInput.value.trim(),
      Number(weightInput.value),
      colorInput.value
    );
    labelInput.value = "";
    weightInput.value = "";
    labelInput.focus();
  }
});
seedBtn?.addEventListener("click", () => {
  state.items = [...DEFAULT_ITEMS].map((it, i) => ({
    ...it,
    color: pickColor(i),
  }));
  rebuild();
});
clearBtn?.addEventListener("click", () => {
  state.items = [];
  rebuild();
});
resetBtn?.addEventListener("click", () => {
  // Detener cualquier animación en curso
  if (state.spinning) {
    wheelG.style.transition = "none";
    state.spinning = false;
  }
  
  state.rotation = 0;
  state.hasResult = false; // Resetear el estado de resultado
  if (wheelG) {
    wheelG.style.transform = "rotate(0deg)";
    // Restaurar la transición después de un breve delay
    setTimeout(() => {
      wheelG.style.transition = "";
    }, 50);
  }
  if (resultEl) resultEl.textContent = "";
  if (historyEl) historyEl.textContent = "";
  state.draws = {};
  
  // Actualizar estado de botones (rehabilitar botón de giro)
  updateButtons();
});
spinBtn?.addEventListener("click", () => spin(3600));
fastBtn?.addEventListener("click", () => spin(1600));

itemsTblBody?.addEventListener("input", (e) => {
  const target = e.target;
  if (!target?.dataset) return;
  const i = Number(target.dataset.i);
  const k = target.dataset.k;
  if (!Number.isInteger(i) || !k || !state.items[i]) return;
  if (k === "label") state.items[i].label = target.value;
  if (k === "weight") state.items[i].weight = Number(target.value);
  if (k === "color") state.items[i].color = target.value;
  rebuild();
});
itemsTblBody?.addEventListener("click", (e) => {
  const target = e.target;
  if (!target?.dataset) return;
  const del = target.dataset.del;
  if (del !== undefined) {
    removeItem(Number(del));
  }
});

load();
rebuild();
