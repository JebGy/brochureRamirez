// Define DEFAULT_ITEMS in the client-side script
const DEFAULT_ITEMS = [
  { label: 'A', weight: 1 },
  { label: 'B', weight: 2 },
  { label: 'C', weight: 3 },
  { label: 'D', weight: 4 },
];

const wheelG = document.getElementById('wheel');
const spinBtn = document.getElementById('spinBtn');
const fastBtn = document.getElementById('fastBtn');
const resetBtn = document.getElementById('resetBtn');
const resultEl = document.getElementById('result');
const oddsEl = document.getElementById('odds');
const historyEl = document.getElementById('history');
const itemsTblBody = document.querySelector('#itemsTbl tbody');
const totalLegend = document.getElementById('totalLegend');
const labelInput = document.getElementById('labelInput');
const weightInput = document.getElementById('weightInput');
const colorInput = document.getElementById('colorInput');
const addBtn = document.getElementById('addBtn');
const seedBtn = document.getElementById('seedBtn');
const clearBtn = document.getElementById('clearBtn');

let state = {
  items: [], // {label, weight, color}
  rotation: 0, // grados actuales
  spinning: false,
  draws: {}, // conteo por label
};

function save(){ localStorage.setItem('weighted-wheel', JSON.stringify(state.items)); }
function load(){
  const raw = localStorage.getItem('weighted-wheel');
  if (raw){ try { state.items = JSON.parse(raw); } catch(e){} }
  if (!state.items || state.items.length === 0){ state.items = [...DEFAULT_ITEMS].map((it,i)=> ({...it, color: pickColor(i)})); }
}

function pickColor(i){ const h = Math.round((i*360/12)%360); return `hsl(${h} 70% 50%)`; }

function toRadians(deg){ return deg * Math.PI / 180; }
function polarToXY(cx, cy, r, angleDeg){ const a = toRadians(angleDeg); return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }; }

function arcPath(cx, cy, r, a0, a1){
  // sector de pastel desde centro (a0 -> a1, sentido horario)
  const start = polarToXY(cx, cy, r, a0);
  const end = polarToXY(cx, cy, r, a1);
  const large = (a1 - a0) % 360 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`;
}

function normalizedWeights(){
  const items = state.items.filter(it=> (it.weight||0) > 0);
  const total = items.reduce((s,it)=> s + Number(it.weight), 0);
  return { items, total };
}

function drawWheel(){
  wheelG.innerHTML = '';
  const { items, total } = normalizedWeights();
  const cx=250, cy=250, r=230;
  if (items.length === 0 || total <= 0){
    const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', r);
    circle.setAttribute('fill', '#0d1326'); circle.setAttribute('stroke', '#334155'); circle.setAttribute('stroke-width', '2');
    wheelG.appendChild(circle);
    oddsEl.textContent = 'Agrega ítems con peso > 0.';
    totalLegend.textContent = '';
    return;
  }
  let angle = -90; // 12 en punto
  const slices = [];
  items.forEach((it, i)=>{
    const sweep = (it.weight / total) * 360;
    const a0 = angle; const a1 = angle + sweep;
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', arcPath(cx, cy, r, a0, a1));
    path.setAttribute('fill', it.color || pickColor(i));
    path.setAttribute('stroke', '#0b1020');
    path.setAttribute('stroke-width', '1');
    wheelG.appendChild(path);

    // etiqueta
    const mid = a0 + sweep/2;
    const label = document.createElementNS('http://www.w3.org/2000/svg','text');
    label.setAttribute('x', cx); label.setAttribute('y', cy);
    label.setAttribute('font-size', '14');
    label.setAttribute('fill', '#0b1020');
    label.setAttribute('font-weight', '800');
    label.setAttribute('text-anchor','middle');
    label.setAttribute('dominant-baseline','middle');
    label.setAttribute('transform', `rotate(${mid} ${cx} ${cy}) translate(0 -${r*0.6}) rotate(${-mid} ${cx} ${cy})`);
    label.textContent = it.label;
    wheelG.appendChild(label);

    slices.push({ a0, a1, mid, item: it });
    angle = a1;
  });
  // guardar para usar en spin
  wheelG.dataset.slices = JSON.stringify(slices);

  // probabilidades
  oddsEl.textContent = items.map(it=> `${it.label}: ${(it.weight/total*100).toFixed(2)}%`).join(' • ');
  totalLegend.textContent = `Total de peso: ${total}`;
}

function renderTable(){
  const { items, total } = normalizedWeights();
  itemsTblBody.innerHTML = '';
  state.items.forEach((it, idx)=>{
    const tr = document.createElement('tr');
    const p = total>0 ? (it.weight>0 ? (it.weight/total*100) : 0) : 0;
    tr.innerHTML = `
      <td><input data-k="label" data-i="${idx}" type="text" value="${it.label}"/></td>
      <td><input data-k="weight" data-i="${idx}" type="number" step="0.01" min="0" value="${it.weight}"/></td>
      <td>${p.toFixed(2)}%</td>
      <td style="text-align:right;">
        <input data-k="color" data-i="${idx}" type="color" value="${it.color||pickColor(idx)}" title="Color"/>
        <button data-del="${idx}" class="btn danger" style="padding:.3rem .5rem; margin-left:.3rem;">✕</button>
      </td>
    `;
    itemsTblBody.appendChild(tr);
  });
}

function rebuild(){ drawWheel(); renderTable(); save(); updateButtons(); }

function updateButtons(){
  const { total } = normalizedWeights();
  const can = total>0;
  spinBtn.disabled = !can; fastBtn.disabled = !can;
}

function addItem(label, weight, color){
  if (!label) label = `Ítem ${state.items.length+1}`;
  const w = Number(weight);
  state.items.push({ label, weight: isFinite(w) && w>=0 ? w : 1, color: color || pickColor(state.items.length) });
  rebuild();
}

function removeItem(i){ state.items.splice(i,1); rebuild(); }

function weightedPick(){
  const { items, total } = normalizedWeights();
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (let i=0;i<items.length;i++){
    r -= items[i].weight;
    if (r <= 0) return items[i];
  }
  return items[items.length-1];
}

function findSliceForLabel(label){
  const slices = JSON.parse(wheelG.dataset.slices||'[]');
  return slices.find(s=> s.item.label === label);
}

function spin(durationMs=3600){
  if (state.spinning) return;
  const pick = weightedPick();
  if (!pick) return;
  const slice = findSliceForLabel(pick.label);
  const targetMid = slice.mid; // grados absolutos del centro del sector (con 0° a la derecha, pero nuestro 12 en punto es -90°)
  // Queremos que targetMid termine en -90° (aguja arriba). Entonces rotación final = rotación actual + delta.
  // delta = (-90 - targetMid) mod 360 + k*360 (k vueltas extra)
  const k = 5 + Math.floor(Math.random()*3); // 5-7 vueltas extra
  let delta = (-90 - targetMid - state.rotation) % 360;
  if (delta < 0) delta += 360;
  const finalRotation = state.rotation + delta + k*360;

  wheelG.style.transitionDuration = `${durationMs}ms`;
  state.spinning = true;
  // forzar reflow
  wheelG.getBoundingClientRect();
  wheelG.style.transform = `rotate(${finalRotation}deg)`;

  const onEnd = ()=>{
    wheelG.removeEventListener('transitionend', onEnd);
    state.spinning = false;
    state.rotation = finalRotation % 360; // mantener rotación acumulada en 0..359
    resultEl.innerHTML = `Resultado: <span class="pill">${pick.label}</span>`;
    // historial & conteo
    state.draws[pick.label] = (state.draws[pick.label]||0)+1;
    const entries = Object.entries(state.draws).sort((a,b)=> b[1]-a[1]);
    historyEl.innerHTML = entries.map(([lab,c])=> `${lab}: ${c}`).join(' • ');
  };
  wheelG.addEventListener('transitionend', onEnd);
}

// Eventos UI
addBtn?.addEventListener('click', ()=>{
  if (labelInput && weightInput && colorInput) {
    addItem(labelInput.value.trim(), Number(weightInput.value), colorInput.value);
    labelInput.value = ''; 
    weightInput.value = ''; 
    labelInput.focus();
  }
});
seedBtn?.addEventListener('click', ()=>{
  state.items = [...DEFAULT_ITEMS].map((it,i)=> ({...it, color: pickColor(i)}));
  rebuild();
});
clearBtn?.addEventListener('click', ()=>{ state.items = []; rebuild(); });
resetBtn?.addEventListener('click', ()=>{ 
  state.rotation = 0; 
  if (wheelG) wheelG.style.transform = 'rotate(0deg)'; 
  if (resultEl) resultEl.textContent=''; 
  if (historyEl) historyEl.textContent=''; 
  state.draws = {}; 
});
spinBtn?.addEventListener('click', ()=> spin(3600));
fastBtn?.addEventListener('click', ()=> spin(1600));

itemsTblBody?.addEventListener('input', (e)=>{
  const target = e.target;
  if (!target?.dataset) return;
  
  const i = Number(target.dataset.i);
  const k = target.dataset.k;
  if (!Number.isInteger(i) || !k || !state.items[i]) return;
  
  if (k === 'label') state.items[i].label = target.value;
  if (k === 'weight') state.items[i].weight = Number(target.value);
  if (k === 'color') state.items[i].color = target.value;
  rebuild();
});

itemsTblBody?.addEventListener('click', (e)=>{
  const target = e.target;
  if (!target?.dataset) return;
  
  const del = target.dataset.del;
  if (del !== undefined){ removeItem(Number(del)); }
});

// Init
load();
rebuild();