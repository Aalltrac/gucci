const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const zenBar = document.getElementById("zen-bar");
const promptEl = document.getElementById("prompt");
const promptTextEl = document.getElementById("prompt-text");
const journalEl = document.getElementById("journal");
const questsEl = document.getElementById("quests");
const toastsEl = document.getElementById("toasts");
const tintEl = document.getElementById("tint");
const btnJournal = document.getElementById("btn-journal");

const settingsEl = document.getElementById("settings");
const btnSettings = document.getElementById("btn-settings");
const mobileControlsEl = document.getElementById("mobile-controls");
const joystickEl = document.getElementById("mc-joystick");
const joyStickKnobEl = joystickEl.querySelector(".mc-joy-stick");
const buttonsEl = document.getElementById("mc-buttons");
const mcInteractBtn = document.getElementById("mc-btn-interact");
const mcJournalBtn = document.getElementById("mc-btn-journal");
const chkMCEnable = document.getElementById("toggle-mobile-controls");
const chkMCEdit = document.getElementById("toggle-edit-controls");
const rangeMCSize = document.getElementById("controls-size");
const btnResetControls = document.getElementById("btn-reset-controls");

const keys = new Set();
let lastTime = 0;
const TILE = 64;
const MAP_W = 80;
const MAP_H = 60;

const virtualInput = {
  dx: 0,
  dy: 0,
  joyActive: false,
  pointerId: null,
  center: { x: 0, y: 0 },
};

const state = {
  world: null,
  player: {
    x: MAP_W * TILE * 0.5,
    y: MAP_H * TILE * 0.55,
    speed: 160,
    dir: "down",
    flip: false,
    animTimer: 0,
    animIndex: 0,
    inWater: false,
    zen: 70,
  },
  camera: { x: 0, y: 0 },
  interact: null,
  quests: [
    { id:"flowers", label:"Renifler 5 fleurs", target:5, count:0, done:false, emoji:"🌸" },
    { id:"berries", label:"Grignoter 3 baies", target:3, count:0, done:false, emoji:"🫐" },
    { id:"nap", label:"Faire une sieste", target:1, count:0, done:false, emoji:"😴" },
    { id:"swim", label:"Se tremper dans l’étang", target:1, count:0, done:false, emoji:"💧" },
    { id:"trinkets", label:"Trouver 3 breloques brillantes", target:3, count:0, done:false, emoji:"✨" },
  ],
  particles: [],
  emotes: [],
};

const images = {};
const loadImage = (src) =>
  new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

async function loadAssets() {
  const names = [
    ["mouse","gucci_mouse_sprites.png"],
    ["tiles","tileset_nature.png"],
    ["flower","flower_patch.png"],
    ["berries","berry_bush.png"],
    ["blanket","picnic_blanket.png"],
    ["log","cozy_log.png"],
  ];
  const loads = names.map(async ([k, src]) => (images[k] = await loadImage(src)));
  await Promise.all(loads);
}

function makeWorld() {
  const tiles = new Uint8Array(MAP_W * MAP_H).fill(0);

  let x = Math.floor(MAP_W * 0.2);
  for (let y = Math.floor(MAP_H*0.3); y < MAP_H*0.9; y++) {
    x += Math.round((Math.random()-0.5)*2);
    x = Math.max(3, Math.min(MAP_W-4, x));
    for (let dx=-1; dx<=1; dx++) tiles[y*MAP_W + (x+dx)] = 1;
  }

  const cx = Math.floor(MAP_W*0.7), cy = Math.floor(MAP_H*0.45);
  const rx = 8, ry = 6;
  for (let j=cy-ry-1; j<=cy+ry+1; j++){
    for (let i=cx-rx-1; i<=cx+rx+1; i++){
      const nx = (i-cx)/rx, ny = (j-cy)/ry;
      const d = nx*nx + ny*ny + (Math.random()*0.08-0.04);
      if (d < 1.0) tiles[j*MAP_W + i] = 2;
    }
  }

  const props = [];
  for (let k=0; k<40; k++){
    const px = 6 + Math.floor(Math.random()*(MAP_W-12));
    const py = 6 + Math.floor(Math.random()*(MAP_H-12));
    if (tiles[py*MAP_W+px] !== 2) {
      props.push({type:"flower", x:px*TILE+8, y:py*TILE+8, r:42, action: sniffFlower});
    }
  }
  for (let k=0; k<12; k++){
    const px = 6 + Math.floor(Math.random()*(MAP_W-12));
    const py = 6 + Math.floor(Math.random()*(MAP_H-12));
    if (tiles[py*MAP_W+px] === 0) {
      props.push({type:"berries", x:px*TILE+16, y:py*TILE+16, r:50, action: eatBerry, qty: 3});
    }
  }
  props.push({type:"blanket", x:(cx-8)*TILE, y:(cy+ry+2)*TILE, r:90, action: napTime});
  props.push({type:"log", x:(cx-14)*TILE, y:(cy-ry-2)*TILE, r:70, action: sitAndBreathe});

  const trinkets = [];
  for (let k=0; k<6; k++){
    const px = 4 + Math.floor(Math.random()*(MAP_W-8));
    const py = 4 + Math.floor(Math.random()*(MAP_H-8));
    if (tiles[py*MAP_W+px] !== 2) {
      trinkets.push({x:px*TILE+32, y:py*TILE+32, taken:false});
    }
  }

  return { tiles, props, trinkets };
}

function sniffFlower(p) {
  addEmote("🌸");
  bumpZen(4);
  addQuestProgress("flowers", 1);
}
function eatBerry(p) {
  if (p.qty>0) {
    p.qty--;
    addEmote("🫐");
    bumpZen(6);
    addQuestProgress("berries", 1);
    spawnParticles("crumb", playerScreenX(), playerScreenY()+8, 10);
  } else {
    showToast("Plus de baies ici…", 1600);
  }
}
function napTime() {
  addEmote("😴");
  fadePause(1600).then(()=>{
    bumpZen(12);
    addQuestProgress("nap", 1);
    showToast("Quelle sieste parfaite.", 1800);
  });
}
function sitAndBreathe() {
  addEmote("🍃");
  bumpZen(3);
  showToast("Gucci respire… tout va bien.", 1500);
}

function addEmote(txt) {
  state.emotes.push({t:0, txt, x: state.player.x, y: state.player.y-30});
}
function bumpZen(v) {
  state.player.zen = Math.max(0, Math.min(100, state.player.zen + v));
}
function addQuestProgress(id, n=1){
  const q = state.quests.find(q=>q.id===id);
  if(!q || q.done) return;
  q.count += n;
  if (q.count >= q.target) {
    q.done = true;
    addEmote("✨");
    showToast(`Objectif terminé: ${q.label}`, 2200);
  }
  saveProgress();
  renderQuests();
}

function saveProgress() {
  const data = {
    quests: state.quests.map(q=>({id:q.id,count:q.count,done:q.done})),
    zen: state.player.zen
  };
  localStorage.setItem("gucci-save", JSON.stringify(data));
}
function loadProgress() {
  try{
    const data = JSON.parse(localStorage.getItem("gucci-save")||"null");
    if(!data) return;
    state.player.zen = data.zen ?? state.player.zen;
    for (const r of data.quests||[]) {
      const q = state.quests.find(q=>q.id===r.id);
      if (q) { q.count = r.count; q.done = r.done; }
    }
  }catch(e){}
}

window.addEventListener("keydown", e=>{
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","Tab"].includes(e.key)) e.preventDefault();
  keys.add(e.key.toLowerCase());
  if (e.key.toLowerCase()==="j") togglePanel(journalEl);
  if (e.key.toLowerCase()==="e") tryInteract();
});
window.addEventListener("keyup", e=>keys.delete(e.key.toLowerCase()));
document.querySelectorAll(".close").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const sel = btn.getAttribute("data-close");
    document.querySelector(sel).hidden = true;
  });
});
btnJournal.addEventListener("click", ()=>togglePanel(journalEl));

function joySetVector(x, y){
  const maxR = 48;
  const len = Math.hypot(x,y);
  const nx = len>0 ? x/Math.max(len,1e-6) : 0;
  const ny = len>0 ? y/Math.max(len,1e-6) : 0;
  const k = Math.min(1, len / maxR);
  virtualInput.dx = nx * k;
  virtualInput.dy = ny * k;
  joyStickKnobEl.style.transform = `translate(${nx*maxR*0.9}px, ${ny*maxR*0.9}px)`;
}
function joyReset(){
  virtualInput.dx = 0; virtualInput.dy = 0; virtualInput.joyActive = false; virtualInput.pointerId = null;
  joyStickKnobEl.style.transform = `translate(0px,0px)`;
}
joystickEl.addEventListener("touchstart", (e)=>{
  if (controlsState.edit) return;
  const t = e.changedTouches[0];
  virtualInput.joyActive = true; virtualInput.pointerId = t.identifier;
  const rect = joystickEl.getBoundingClientRect();
  virtualInput.center = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
  joySetVector(t.clientX - virtualInput.center.x, t.clientY - virtualInput.center.y);
  e.preventDefault();
}, {passive:false});
joystickEl.addEventListener("touchmove", (e)=>{
  if (!virtualInput.joyActive) return;
  for (const t of e.changedTouches) {
    if (t.identifier === virtualInput.pointerId){
      joySetVector(t.clientX - virtualInput.center.x, t.clientY - virtualInput.center.y);
      e.preventDefault();
      break;
    }
  }
}, {passive:false});
joystickEl.addEventListener("touchend", (e)=>{
  for (const t of e.changedTouches) if (t.identifier===virtualInput.pointerId){ joyReset(); }
});
joystickEl.addEventListener("touchcancel", ()=> joyReset());

let mouseJoyActive = false;
joystickEl.addEventListener("mousedown", (e)=>{
  if (controlsState.edit) return;
  mouseJoyActive = true;
  const rect = joystickEl.getBoundingClientRect();
  virtualInput.center = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
  joySetVector(e.clientX - virtualInput.center.x, e.clientY - virtualInput.center.y);
  e.preventDefault();
});
window.addEventListener("mousemove", (e)=>{
  if (!mouseJoyActive) return;
  joySetVector(e.clientX - virtualInput.center.x, e.clientY - virtualInput.center.y);
});
window.addEventListener("mouseup", ()=>{
  if (!mouseJoyActive) return;
  mouseJoyActive = false;
  joyReset();
});

mcInteractBtn.addEventListener("touchstart", (e)=>{ if (!controlsState.edit){ tryInteract(); e.preventDefault(); } }, {passive:false});
mcJournalBtn.addEventListener("touchstart", (e)=>{ if (!controlsState.edit){ togglePanel(journalEl); e.preventDefault(); } }, {passive:false});

mcInteractBtn.addEventListener("click", ()=>{ if (!controlsState.edit){ tryInteract(); } });
mcJournalBtn.addEventListener("click", ()=>{ if (!controlsState.edit){ togglePanel(journalEl); } });

function makeDraggable(el, key){
  let dragging = false;
  let start = { x:0, y:0 };
  let orig = { left:null, right:null, top:null, bottom:null };

  const onStart = (clientX, clientY)=>{
    if (!controlsState.edit) return;
    dragging = true;
    start = { x: clientX, y: clientY };
    const rect = el.getBoundingClientRect();
    const rootRect = canvas.getBoundingClientRect();
    orig = {
      left: rect.left - rootRect.left,
      right: rootRect.right - rect.right,
      top: rect.top - rootRect.top,
      bottom: rootRect.bottom - rect.bottom,
    };
  };
  const onMove = (clientX, clientY)=>{
    if (!dragging) return;
    const dx = clientX - start.x;
    const dy = clientY - start.y;
    const pos = controlsState.positions[key];
    ["left","right","top","bottom"].forEach(k=> el.style[k]="");
    if (pos.left!=null){ el.style.left = Math.max(0, orig.left + dx) + "px"; }
    if (pos.right!=null){ el.style.right = Math.max(0, orig.right - dx) + "px"; }
    if (pos.top!=null){ el.style.top = Math.max(0, orig.top + dy) + "px"; }
    if (pos.bottom!=null){ el.style.bottom = Math.max(0, orig.bottom - dy) + "px"; }
  };
  const onEnd = ()=>{
    if (!dragging) return;
    dragging = false;
    const style = getComputedStyle(el);
    const newPos = {};
    ["left","right","top","bottom"].forEach(k=>{
      const v = parseFloat(style[k]);
      if (!Number.isNaN(v)) newPos[k] = Math.max(0, Math.round(v));
    });
    controlsState.positions[key] = newPos;
    saveControlsState();
  };

  el.addEventListener("mousedown", (e)=>{ if (controlsState.edit){ e.preventDefault(); onStart(e.clientX, e.clientY);} });
  window.addEventListener("mousemove", (e)=> onMove(e.clientX, e.clientY));
  window.addEventListener("mouseup", onEnd);
  el.addEventListener("touchstart", (e)=>{ if (!controlsState.edit) return; const t=e.changedTouches[0]; onStart(t.clientX, t.clientY); }, {passive:false});
  el.addEventListener("touchmove", (e)=>{ if (!controlsState.edit) return; const t=e.changedTouches[0]; onMove(t.clientX, t.clientY); e.preventDefault(); }, {passive:false});
  el.addEventListener("touchend", onEnd);
}
makeDraggable(joystickEl, "joystick");
makeDraggable(buttonsEl, "buttons");

const controlsState = {
  enabled: true,
  edit: false,
  scale: 1,
  positions: {
    joystick: { left: 16, bottom: 16 },
    buttons:  { right: 16, bottom: 16 },
  }
};

function loadControlsState(){
  try{
    const s = JSON.parse(localStorage.getItem("gucci-controls")||"null");
    if (s) {
      Object.assign(controlsState, s);
      controlsState.positions.joystick ||= {left:16,bottom:16};
      controlsState.positions.buttons ||= {right:16,bottom:16};
    }
  }catch(e){}
}
function saveControlsState(){
  localStorage.setItem("gucci-controls", JSON.stringify(controlsState));
}
function applyControlsState(){
  mobileControlsEl.classList.toggle("hidden", !controlsState.enabled);
  mobileControlsEl.classList.toggle("edit", !!controlsState.edit);
  mobileControlsEl.style.setProperty("--mc-scale", String(controlsState.scale));
  const js = controlsState.positions.joystick;
  const bs = controlsState.positions.buttons;
  ["left","right","top","bottom"].forEach(k=>{ joystickEl.style[k] = ""; buttonsEl.style[k] = ""; });
  Object.entries(js).forEach(([k,v])=> joystickEl.style[k] = v+"px");
  Object.entries(bs).forEach(([k,v])=> buttonsEl.style[k] = v+"px");
  chkMCEnable.checked = controlsState.enabled;
  chkMCEdit.checked = controlsState.edit;
  rangeMCSize.value = controlsState.scale;
}
function resetControlsState(){
  controlsState.positions.joystick = { left: 16, bottom: 16 };
  controlsState.positions.buttons  = { right: 16, bottom: 16 };
  controlsState.scale = 1;
  controlsState.edit = false;
  saveControlsState();
  applyControlsState();
}

btnSettings.addEventListener("click", ()=> togglePanel(settingsEl));
chkMCEnable.addEventListener("change", ()=>{
  controlsState.enabled = chkMCEnable.checked;
  saveControlsState(); applyControlsState();
});
chkMCEdit.addEventListener("change", ()=>{
  controlsState.edit = chkMCEdit.checked;
  saveControlsState(); applyControlsState();
});
rangeMCSize.addEventListener("input", ()=>{
  controlsState.scale = parseFloat(rangeMCSize.value);
  saveControlsState(); applyControlsState();
});
btnResetControls.addEventListener("click", resetControlsState);

function update(dt){
  const p = state.player;
  let kdx = 0, kdy = 0;
  if (keys.has("arrowup")||keys.has("z")) kdy -= 1;
  if (keys.has("arrowdown")||keys.has("s")) kdy += 1;
  if (keys.has("arrowleft")||keys.has("q")) kdx -= 1;
  if (keys.has("arrowright")||keys.has("d")) kdx += 1;

  let dx = kdx + virtualInput.dx;
  let dy = kdy + virtualInput.dy;

  const mag = Math.hypot(dx,dy) || 1;
  dx/=mag; dy/=mag;

  const speedMult = isPathAt(p.x+32,p.y+32) ? 1.07 : 1.0;
  const inWater = isWaterAt(p.x+32, p.y+56);
  p.inWater = inWater;
  const sp = p.speed * (inWater ? 0.6 : 1.0) * speedMult;

  p.x += dx * sp * dt;
  p.y += dy * sp * dt;

  p.x = Math.max(0, Math.min(MAP_W*TILE - 64, p.x));
  p.y = Math.max(0, Math.min(MAP_H*TILE - 64, p.y));

  const moving = Math.abs(dx)>0.01 || Math.abs(dy)>0.01;
  p.moving = moving;

  if (moving){
    p.animTimer += dt;
    const step = 0.12;
    while (p.animTimer >= step){
      p.animTimer -= step;
      p.animIndex = (p.animIndex + 1) % 4;
    }
    if (p.inWater) spawnParticles("ripple", p.x+32, p.y+50, 1);

    if (Math.abs(dx)>Math.abs(dy)) { p.dir = "side"; p.flip = dx<0; }
    else { p.dir = dy>0 ? "down" : "up"; }
  } else {
  }

  const t = performance.now()/1000;
  const tint = 0.35 + 0.25*Math.sin(t*0.05);
  tintEl.style.opacity = String(tint);

  zenBar.style.width = `${p.zen}%`;

  const cx = p.x + 32, cy = p.y + 32;
  const candidates = [...state.world.props];
  state.interact = null;
  let bestD = 1e9, best=null;
  for (const it of candidates) {
    const d = Math.hypot(cx-(it.x+48), cy-(it.y+48));
    if (d < Math.max(40, it.r) && d < bestD) { bestD=d; best=it; }
  }
  if (best) {
    state.interact = best;
    showPromptFor(best);
  } else if (p.inWater) {
    addQuestProgress("swim", 1);
    hidePrompt();
  } else {
    hidePrompt();
  }

  for (const tr of state.world.trinkets) {
    if (!tr.taken && Math.hypot(cx-(tr.x), cy-(tr.y))<36) {
      tr.taken = true;
      addEmote("✨");
      bumpZen(5);
      addQuestProgress("trinkets", 1);
    }
  }

  state.camera.x = Math.floor(p.x + 32 - W/2);
  state.camera.y = Math.floor(p.y + 32 - H/2);
  state.camera.x = Math.max(0, Math.min(MAP_W*TILE - W, state.camera.x));
  state.camera.y = Math.max(0, Math.min(MAP_H*TILE - H, state.camera.y));
}

function dist(x1,y1,x2,y2){ return Math.hypot(x1-x2,y1-y2); }

function showPromptFor(it){
  promptTextEl.textContent = ({
    flower:"Renifler",
    berries:"Grignoter",
    blanket:"Sieste",
    log:"S’asseoir"
  })[it.type] || "Interagir";
  promptEl.hidden = false;
}
function hidePrompt(){ promptEl.hidden = true; }

function tryInteract(){
  const it = state.interact;
  if (!it) return;
  it.action?.(it);
}

function drawTile(tileId, sx, sy){
  const ts = images.tiles;
  const s = TILE;
  const row = tileId;
  let col = 0;
  if (row===0) col = ((sx>>6)+(sy>>6))%4;
  if (row===1) col = 0;
  if (row===2) col = ((sx>>6)+2*(sy>>6))%4;
  ctx.drawImage(ts, col*s, row*s, s, s, sx, sy, s, s);
}

function drawProp(p){
  const px = p.x - state.camera.x;
  const py = p.y - state.camera.y;
  let img = null, ox=0, oy=0;
  if (p.type==="flower") img = images.flower;
  if (p.type==="berries") img = images.berries;
  if (p.type==="blanket") img = images.blanket;
  if (p.type==="log") img = images.log;
  if (!img) return;
  ctx.drawImage(img, px, py);
}

function drawPlayer(){
  ctx.imageSmoothingEnabled = false;

  const img = images.mouse;
  if (!img || !img.width || !img.height) return;

  const cols = 4;
  const rows = 3;
  const frameW = Math.floor(img.width / cols);
  const frameH = Math.floor(img.height / rows);

  const row = 2;

  const WALK_FRAMES = [0, 1, 2, 1];
  const frame = state.player.moving ? WALK_FRAMES[state.player.animIndex % WALK_FRAMES.length] : 1;

  const baseX = playerScreenX() + 32;
  const baseY = playerScreenY() + 56;

  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(baseX, baseY-4, 18, 8, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(baseX, baseY);
  if (state.player.dir==="side" && state.player.flip) {
    ctx.scale(-1, 1);
  }
  ctx.drawImage(
    img,
    frame * frameW, row * frameH, frameW, frameH,
    -Math.floor(frameW/2), -frameH, frameW, frameH
  );
  ctx.restore();
}

function spawnParticles(kind, x,y, n){
  for(let i=0;i<n;i++){
    state.particles.push({
      kind,
      x: x + (Math.random()*20-10),
      y: y + (Math.random()*10-5),
      vx: (Math.random()-0.5)*40,
      vy: -20 - Math.random()*30,
      t: 0,
      life: 0.7 + Math.random()*0.4
    });
  }
}
function drawParticles(dt){
  for (let i=state.particles.length-1; i>=0; i--){
    const p = state.particles[i];
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 50*dt;
    let alpha = Math.max(0, 1 - p.t/p.life);
    ctx.globalAlpha = alpha;
    if (p.kind==="crumb"){
      ctx.fillStyle = "#7a5135";
      ctx.beginPath();
      ctx.arc(p.x - state.camera.x, p.y - state.camera.y, 2.5, 0, Math.PI*2);
      ctx.fill();
    } else if (p.kind==="ripple"){
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1.5;
      const r = 6 + p.t*30;
      ctx.beginPath();
      ctx.arc(p.x - state.camera.x, p.y - state.camera.y, r, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (p.t>=p.life) state.particles.splice(i,1);
  }
}

function drawEmotes(dt){
  for(let i=state.emotes.length-1;i>=0;i--){
    const e = state.emotes[i];
    e.t += dt;
    const a = Math.max(0, 1 - e.t/1.4);
    ctx.globalAlpha = a;
    const px = state.player.x - state.camera.x;
    const py = state.player.y - 30 - 20*e.t - state.camera.y;
    ctx.font = "24px system-ui, Segoe UI Emoji";
    ctx.textAlign = "center";
    ctx.fillText(e.txt, px+32, py);
    ctx.globalAlpha = 1;
    if (e.t>1.4) state.emotes.splice(i,1);
  }
}

function showToast(text, time=1400) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  toastsEl.appendChild(el);
  setTimeout(()=> el.remove(), time);
}

function fadePause(ms){
  return new Promise(res=>{
    const start = performance.now();
    const step = (t)=>{
      const k = Math.min(1, (t-start)/ms);
      tintEl.style.background = `radial-gradient(200px 200px at 50% 50%, transparent ${Math.max(0,100-100*k)}%, rgba(0,0,0,0.6))`;
      if (k<1) requestAnimationFrame(step); else {
        setTimeout(()=>{
          tintEl.style.background = "";
          res();
        }, 200);
      }
    };
    requestAnimationFrame(step);
  });
}

function draw(){
  ctx.clearRect(0,0,W,H);

  const x0 = Math.floor(state.camera.x / TILE);
  const y0 = Math.floor(state.camera.y / TILE);
  const x1 = Math.ceil((state.camera.x + W) / TILE);
  const y1 = Math.ceil((state.camera.y + H) / TILE);

  for (let gy=y0; gy<y1; gy++){
    for (let gx=x0; gx<x1; gx++){
      const id = state.world.tiles[gy*MAP_W + gx];
      drawTile(id, gx*TILE - state.camera.x, gy*TILE - state.camera.y);
    }
  }

  for (const tr of state.world.trinkets) {
    if (tr.taken) continue;
    const sx = tr.x - state.camera.x, sy = tr.y - state.camera.y;
    const tw = (Math.sin(performance.now()/300 + (tr.x+tr.y)) + 1)/2;
    const r = 3 + tw*2;
    ctx.fillStyle = `rgba(255,255,255,${0.7+0.3*tw})`;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.fill();
  }

  for (const p of state.world.props) drawProp(p);

  drawPlayer();

  drawParticles(0);

  drawEmotes(0);
}

function loop(t){
  const dt = Math.min(0.033, (t - lastTime)/1000 || 0);
  lastTime = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function renderQuests(){
  questsEl.innerHTML = "";
  for (const q of state.quests) {
    const li = document.createElement("li");
    if (q.done) li.classList.add("done");
    li.innerHTML = `
      <span>${q.emoji} ${q.label}</span>
      <span class="pill">${Math.min(q.count,q.target)} / ${q.target}</span>
    `;
    questsEl.appendChild(li);
  }
}

function togglePanel(el, onOpen){
  const willOpen = el.hidden;
  document.querySelectorAll(".panel").forEach(p=>p.hidden = true);
  el.hidden = !willOpen ? true : false;
  if (willOpen && onOpen) onOpen();
}

function playerScreenX(){ return state.player.x - state.camera.x; }
function playerScreenY(){ return state.player.y - state.camera.y; }

function tileAt(x,y){
  const gx = Math.floor(x / TILE);
  const gy = Math.floor(y / TILE);
  if (gx<0||gy<0||gx>=MAP_W||gy>=MAP_H) return 0;
  return state.world.tiles[gy*MAP_W+gx];
}
function isWaterAt(x,y){ return tileAt(x,y)===2; }
function isPathAt(x,y){ return tileAt(x,y)===1; }

let started = false;
async function start(){
  if (started) return;
  started = true;
  await loadAssets();
  state.world = makeWorld();
  loadProgress();

  loadControlsState();
  applyControlsState();

  renderQuests();
  requestAnimationFrame(loop);
}

start();
