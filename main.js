import * as Tone from "https://cdn.skypack.dev/tone";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let currentZoom = 1;
let targetZoom = 1;
let tunnelTransition = 0;

let stars = [];
function regenerateStars() {
  stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5
    });
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  regenerateStars();
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const worldWidth = 3000;
const worldHeight = 3000;

let cheeseScore = 0;

const player = {
  x: worldWidth / 2,
  y: worldHeight / 2,
  width: 40,
  height: 40,
  speed: 3,
  blinkState: false,
  nutsCollected: 0,
  lastTunnelTime: 0,
  isMoving: false,
  walkCycle: 0,
  idleTime: 0,
  lastMoveTime: Date.now(),
  eatingEndTime: 0,
  isClimbing: false,
  isHiding: false,
  isSleeping: false
};

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  w: false,
  a: false,
  s: false,
  d: false
};
window.addEventListener("keydown", (e) => {
  if (e.key in keys) keys[e.key] = true;
});
window.addEventListener("keyup", (e) => {
  if (e.key in keys) keys[e.key] = false;
});

const cheeses = [];
for (let i = 0; i < 20; i++) {
  cheeses.push({
    x: Math.random() * (worldWidth - 100) + 50,
    y: Math.random() * (worldHeight - 100) + 50,
    radius: 15,
    collected: false,
    scale: 1,
    animate: Math.random() * 6.28
  });
}

const nuts = [];
for (let i = 0; i < 10; i++) {
  nuts.push({
    x: Math.random() * (worldWidth - 100) + 50,
    y: Math.random() * (worldHeight - 100) + 50,
    radius: 10,
    collected: false,
    animate: Math.random() * 6.28
  });
}

const trees = [];
for (let i = 0; i < 50; i++) {
  trees.push({
    x: Math.random() * worldWidth,
    y: Math.random() * worldHeight,
    scale: 0.5 + Math.random() * 1.0
  });
}

const tunnels = [];
for (let i = 0; i < 3; i++) {
  tunnels.push({
    x: Math.random() * (worldWidth - 200) + 100,
    y: Math.random() * (worldHeight - 200) + 100,
    radius: 30
  });
}

const clouds = [];
for (let i = 0; i < 5; i++) {
  clouds.push({
    x: Math.random() * worldWidth,
    y: Math.random() * (canvas.height / 2),
    speed: 0.2 + Math.random() * 0.3,
    scale: 0.5 + Math.random() * 0.5
  });
}

const butterflies = [];
for (let i = 0; i < 3; i++) {
  butterflies.push({
    baseX: Math.random() * worldWidth,
    baseY: Math.random() * worldHeight,
    amplitude: 20 + Math.random() * 20,
    speed: 0.002 + Math.random() * 0.003,
    phase: Math.random() * Math.PI * 2,
    x: 0,
    y: 0
  });
}

const rainDrops = [];
for (let i = 0; i < 100; i++) {
  rainDrops.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: 2 + Math.random() * 3
  });
}

const waterBodies = [
  { x: 1500, y: 2500, radius: 80 },
  { x: 500, y: 500, radius: 60 }
];

const leaves = [];
for (let i = 0; i < 20; i++) {
  leaves.push({
    x: Math.random() * worldWidth,
    y: Math.random() * worldHeight,
    speed: 0.5 + Math.random() * 0.5,
    rotation: Math.random() * Math.PI * 2,
    sway: Math.random() * 0.05
  });
}

const insects = [];
for (let i = 0; i < 5; i++) {
  insects.push({
    baseX: Math.random() * worldWidth,
    baseY: Math.random() * worldHeight,
    amplitude: 15 + Math.random() * 10,
    speed: 0.001 + Math.random() * 0.001,
    phase: Math.random() * Math.PI * 2,
    x: 0,
    y: 0
  });
}

const pushables = [];
for (let i = 0; i < 10; i++) {
  const types = ["acorn", "apple", "leaf"];
  const type = types[Math.floor(Math.random() * types.length)];
  const radius = type === "acorn" ? 8 : (type === "apple" ? 12 : 10);
  pushables.push({
    x: Math.random() * (worldWidth - 100) + 50,
    y: Math.random() * (worldHeight - 100) + 50,
    radius,
    type,
    vx: 0,
    vy: 0
  });
}

const climbZones = [
  { x: 800, y: 1500, width: 100, height: 50 },
  { x: 2200, y: 800, width: 120, height: 50 },
  { x: 1500, y: 2700, width: 80, height: 40 }
];

const hideSpots = [
  { x: 1200, y: 2000, radius: 50 },
  { x: 2500, y: 2500, radius: 60 },
  { x: 1800, y: 1000, radius: 40 }
];

const biomes = [
  { x: 0, y: 0, width: 1500, height: 1500, type: "forest", color: "rgba(34,139,34,0.15)" },
  { x: 1500, y: 0, width: 1500, height: 1500, type: "meadow", color: "rgba(124,252,0,0.15)" },
  { x: 0, y: 1500, width: 1500, height: 1500, type: "riverside", color: "rgba(70,130,180,0.15)" },
  { x: 1500, y: 1500, width: 1500, height: 1500, type: "wheat", color: "rgba(218,165,32,0.15)" }
];

const odorParticles = [];

function lerpColor(a, b, amount) {
  const ah = parseInt(a.replace(/#/g, ""), 16);
  const ar = ah >> 16,
    ag = (ah >> 8) & 0xff,
    ab = ah & 0xff;
  const bh = parseInt(b.replace(/#/g, ""), 16);
  const br = bh >> 16,
    bg = (bh >> 8) & 0xff,
    bb = bh & 0xff;
  const rr = ar + amount * (br - ar);
  const rg = ag + amount * (bg - ag);
  const rb = ab + amount * (bb - ab);
  return (
    "#" +
    (((1 << 24) +
      (Math.round(rr) << 16) +
      (Math.round(rg) << 8) +
      Math.round(rb))
      .toString(16)
      .slice(1))
  );
}

function getDayFactor() {
  const cycleDuration = 60000;
  const cycle = (Date.now() % cycleDuration) / cycleDuration;
  return (Math.sin(cycle * 2 * Math.PI - Math.PI / 2) + 1) / 2;
}

function drawSky() {
  const dayFactor = getDayFactor();
  const dayColor = "#87ceeb";
  const nightColor = "#2c3e50";
  const skyColor = lerpColor(nightColor, dayColor, dayFactor);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (dayFactor < 0.3) {
    stars.forEach((star) => {
      ctx.beginPath();
      ctx.fillStyle = "#fff";
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
}

function drawClouds() {
  const parallaxFactor = 0.5;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  clouds.forEach((cloud) => {
    const screenX = (cloud.x - player.x) * parallaxFactor + canvas.width / 2;
    const screenY = (cloud.y - player.y) * parallaxFactor + canvas.height / 4;
    ctx.beginPath();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.ellipse(
      screenX,
      screenY,
      40 * cloud.scale,
      25 * cloud.scale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
  ctx.restore();
}

function drawTree(tree) {
  ctx.save();
  ctx.translate(tree.x, tree.y);
  ctx.scale(tree.scale, tree.scale);
  ctx.fillStyle = "#8B5A2B";
  ctx.fillRect(-5, 0, 10, 30);
  const leafOffset = Math.sin(Date.now() / 500 + tree.x) * 2;
  ctx.fillStyle = "#228B22";
  ctx.beginPath();
  ctx.arc(0, -5 + leafOffset, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCheese(cheese) {
  ctx.save();
  ctx.translate(cheese.x, cheese.y);
  const pulse = 0.1 * Math.sin(Date.now() / 300 + cheese.animate);
  const scale = cheese.scale + pulse;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#FFC107";
  ctx.beginPath();
  ctx.moveTo(0, -cheese.radius);
  ctx.arc(0, 0, cheese.radius, -Math.PI / 2, Math.PI / 2, false);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#F57C00";
  ctx.beginPath();
  ctx.arc(-cheese.radius / 2, 0, cheese.radius / 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cheese.radius / 4, -cheese.radius / 4, cheese.radius / 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNut(nut) {
  ctx.save();
  ctx.translate(nut.x, nut.y);
  const pulse = 0.08 * Math.sin(Date.now() / 300 + nut.animate);
  const scale = 1 + pulse;
  ctx.scale(scale, scale);
  ctx.fillStyle = "#8B4513";
  ctx.beginPath();
  ctx.arc(0, 0, nut.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTunnel(tunnel) {
  ctx.save();
  ctx.translate(tunnel.x, tunnel.y);
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 4;
  ctx.fillStyle = "rgba(100,100,100,0.3)";
  ctx.beginPath();
  ctx.arc(0, 0, tunnel.radius, Math.PI, 0, false);
  ctx.lineTo(tunnel.radius, 10);
  ctx.arc(0, 10, tunnel.radius, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawButterfly(butterfly) {
  ctx.save();
  ctx.translate(butterfly.x, butterfly.y);
  ctx.rotate(Math.sin(Date.now() / 200 + butterfly.phase) * 0.3);
  ctx.fillStyle = "rgba(255,182,193,0.8)";
  ctx.beginPath();
  ctx.ellipse(-10, 0, 12, 6, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(10, 0, 12, 6, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#555";
  ctx.beginPath();
  ctx.ellipse(0, 0, 4, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(player) {
  ctx.save();
  if (player.isClimbing) {
    ctx.rotate(-0.1);
  }
  if (player.isHiding) {
    ctx.globalAlpha = 0.3;
  }
  ctx.translate(player.x, player.y);
  let legOffset = 0;
  if (player.isMoving) {
    legOffset = Math.sin(player.walkCycle) * 3;
  }
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, 10);
  ctx.lineTo(-10, 10 + legOffset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(10, 10 - legOffset);
  ctx.stroke();
  const tailAngle = Math.sin(Date.now() / 200 + player.walkCycle * 0.1) * 0.3;
  ctx.save();
  ctx.rotate(tailAngle);
  ctx.strokeStyle = "#AAAAAA";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-player.width / 2, 0);
  ctx.quadraticCurveTo(-player.width - 15, 10, -player.width / 2 - 20, 20);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#AAAAAA";
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  let headTilt = 0;
  if (Date.now() < player.eatingEndTime) {
    headTilt = -0.2;
  } else if (!player.isMoving && player.idleTime > 3000) {
    headTilt = 0.2;
  }
  ctx.save();
  ctx.translate(15, -10);
  ctx.rotate(headTilt);
  if (player.isSleeping) {
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = "#D3D3D3";
  ctx.beginPath();
  ctx.arc(20, -18, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(10, -18, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000";
  if (player.blinkState && !player.isSleeping) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(13, -10);
    ctx.lineTo(17, -10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, -10);
    ctx.lineTo(12, -10);
    ctx.stroke();
  } else if (!player.isSleeping) {
    ctx.beginPath();
    ctx.arc(18, -10, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(13, -10, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#FFB6C1";
  ctx.beginPath();
  ctx.arc(15, -6, 2, 0, Math.PI * 2);
  ctx.fill();
  if (player.isSleeping) {
    ctx.fillStyle = "#000";
    ctx.font = "14px sans-serif";
    ctx.fillText("Zz", -25, -25);
  }
  ctx.restore();
}

function drawRain() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.strokeStyle = "rgba(174,194,224,0.5)";
  ctx.lineWidth = 1;
  rainDrops.forEach((drop) => {
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x, drop.y + 10);
    ctx.stroke();
  });
  ctx.restore();
}

function drawWaterBodies() {
  ctx.save();
  ctx.setTransform(
    currentZoom,
    0,
    0,
    currentZoom,
    canvas.width / 2 - player.x * currentZoom,
    canvas.height / 2 - player.y * currentZoom
  );
  waterBodies.forEach((pond) => {
    const grad = ctx.createRadialGradient(
      pond.x,
      pond.y,
      10,
      pond.x,
      pond.y,
      pond.radius
    );
    grad.addColorStop(0, "#a0e9ff");
    grad.addColorStop(1, "#0077be");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pond.x, pond.y, pond.radius, 0, Math.PI * 2);
    ctx.fill();
    const d = Math.hypot(player.x - pond.x, player.y - pond.y);
    if (d < pond.radius + 100) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.arc(pond.x, pond.y, pond.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();
}

function drawLeaves() {
  ctx.save();
  ctx.setTransform(
    currentZoom,
    0,
    0,
    currentZoom,
    canvas.width / 2 - player.x * currentZoom,
    canvas.height / 2 - player.y * currentZoom
  );
  leaves.forEach((leaf) => {
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rotation);
    ctx.fillStyle = "rgba(210,180,140,0.8)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function drawInsects() {
  ctx.save();
  ctx.setTransform(
    currentZoom,
    0,
    0,
    currentZoom,
    canvas.width / 2 - player.x * currentZoom,
    canvas.height / 2 - player.y * currentZoom
  );
  insects.forEach((insect) => {
    ctx.save();
    ctx.translate(insect.x, insect.y);
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function drawPushables() {
  pushables.forEach((obj) => {
    ctx.save();
    ctx.translate(obj.x, obj.y);
    if (obj.type === "acorn") {
      ctx.fillStyle = "#8B4513";
      ctx.beginPath();
      ctx.ellipse(0, 0, obj.radius, obj.radius * 1.3, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (obj.type === "apple") {
      ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#228B22";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -obj.radius);
      ctx.lineTo(0, -obj.radius - 8);
      ctx.stroke();
    } else if (obj.type === "leaf") {
      ctx.fillStyle = "#9ACD32";
      ctx.beginPath();
      ctx.moveTo(0, -obj.radius);
      ctx.quadraticCurveTo(obj.radius, 0, 0, obj.radius);
      ctx.quadraticCurveTo(-obj.radius, 0, 0, -obj.radius);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawClimbZones() {
  climbZones.forEach((zone) => {
    ctx.save();
    ctx.strokeStyle = "#A0522D";
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(160,82,45,0.3)";
    ctx.beginPath();
    ctx.rect(zone.x, zone.y, zone.width, zone.height);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

function drawHideSpots() {
  hideSpots.forEach((spot) => {
    ctx.save();
    ctx.fillStyle = "rgba(34,139,34,0.5)";
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawOdorParticles() {
  odorParticles.forEach((p) => {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,153," + (p.life / p.maxLife * 0.5) + ")";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawBiomes() {
  biomes.forEach((biome) => {
    ctx.save();
    ctx.fillStyle = biome.color;
    ctx.fillRect(biome.x, biome.y, biome.width, biome.height);
    ctx.restore();
  });
}

function drawGrassEffect() {
  if (player.isMoving) {
    for (let i = 0; i < 5; i++) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      ctx.save();
      ctx.strokeStyle = "rgba(0,100,0,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(player.x + offsetX, player.y + offsetY);
      ctx.lineTo(player.x + offsetX + 5, player.y + offsetY - 5);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function draw() {
  drawSky();
  drawClouds();
  ctx.save();
  ctx.setTransform(
    currentZoom,
    0,
    0,
    currentZoom,
    canvas.width / 2 - player.x * currentZoom,
    canvas.height / 2 - player.y * currentZoom
  );
  ctx.fillStyle = "#d0f0c0";
  ctx.fillRect(0, 0, worldWidth, worldHeight);
  drawBiomes();
  drawWaterBodies();
  drawLeaves();
  drawInsects();
  trees.forEach((tree) => {
    drawTree(tree);
  });
  drawClimbZones();
  drawHideSpots();
  drawPushables();
  tunnels.forEach((tunnel) => {
    drawTunnel(tunnel);
  });
  cheeses.forEach((cheese) => {
    if (!cheese.collected) {
      drawCheese(cheese);
    }
  });
  nuts.forEach((nut) => {
    if (!nut.collected) {
      drawNut(nut);
    }
  });
  drawOdorParticles();
  drawGrassEffect();
  butterflies.forEach((butterfly) => {
    drawButterfly(butterfly);
  });
  drawPlayer(player);
  ctx.restore();
  if (getDayFactor() < 0.3) {
    drawRain();
  }
  if (tunnelTransition > 0) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(0,0,0,${tunnelTransition})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();

function update() {
  let dx = 0,
    dy = 0;
  if (keys.ArrowUp || keys.w) dy -= player.speed;
  if (keys.ArrowDown || keys.s) dy += player.speed;
  if (keys.ArrowLeft || keys.a) dx -= player.speed;
  if (keys.ArrowRight || keys.d) dx += player.speed;
  if (dx && dy) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }
  player.x += dx;
  player.y += dy;
  player.isMoving = dx !== 0 || dy !== 0;
  if (player.isMoving) {
    player.lastMoveTime = Date.now();
    player.idleTime = 0;
    player.walkCycle += 0.15;
  } else {
    player.idleTime = Date.now() - player.lastMoveTime;
  }
  player.blinkState = (Date.now() % 4000) < 200;
  cheeses.forEach((cheese) => {
    if (!cheese.collected) {
      const dist = Math.hypot(player.x - cheese.x, player.y - cheese.y);
      if (dist < player.width / 2 + cheese.radius) {
        cheese.collected = true;
        cheeseScore++;
        document.getElementById("score").textContent = cheeseScore;
        synth.triggerAttackRelease("C5", "8n");
        player.eatingEndTime = Date.now() + 300;
      }
    }
  });
  nuts.forEach((nut) => {
    if (!nut.collected) {
      const dist = Math.hypot(player.x - nut.x, player.y - nut.y);
      if (dist < player.width / 2 + nut.radius) {
        nut.collected = true;
        player.nutsCollected++;
        document.getElementById("nutsCount").textContent = player.nutsCollected;
        synth.triggerAttackRelease("D5", "8n");
        player.eatingEndTime = Date.now() + 300;
      }
    }
  });
  tunnels.forEach((tunnel) => {
    const dist = Math.hypot(player.x - tunnel.x, player.y - tunnel.y);
    if (dist < player.width / 2 + tunnel.radius) {
      if (Date.now() - player.lastTunnelTime > 3000) {
        player.x = Math.random() * worldWidth;
        player.y = Math.random() * worldHeight;
        player.lastTunnelTime = Date.now();
        tunnelTransition = 1;
        synth.triggerAttackRelease("G4", "8n");
      }
    }
  });
  clouds.forEach((cloud) => {
    cloud.x += cloud.speed;
    if (cloud.x > worldWidth + 100) {
      cloud.x = -100;
    }
  });
  butterflies.forEach((butterfly) => {
    const t = Date.now();
    butterfly.x =
      butterfly.baseX +
      butterfly.amplitude * Math.sin(t * butterfly.speed + butterfly.phase);
    butterfly.y =
      butterfly.baseY +
      butterfly.amplitude * Math.cos(t * butterfly.speed + butterfly.phase);
  });
  if (
    player.x > worldWidth / 2 - 250 &&
    player.x < worldWidth / 2 + 250 &&
    player.y > worldHeight / 2 - 250 &&
    player.y < worldHeight / 2 + 250
  ) {
    targetZoom = 1.2;
  } else {
    targetZoom = 1;
  }
  currentZoom += (targetZoom - currentZoom) * 0.05;
  const isRaining = getDayFactor() < 0.3;
  if (isRaining) {
    rainDrops.forEach((drop) => {
      drop.y += drop.speed;
      if (drop.y > canvas.height) {
        drop.y = -10;
        drop.x = Math.random() * canvas.width;
      }
    });
  }
  leaves.forEach((leaf) => {
    leaf.y += leaf.speed;
    leaf.rotation += leaf.sway;
    if (leaf.y > worldHeight) {
      leaf.y = -10;
      leaf.x = Math.random() * worldWidth;
    }
  });
  insects.forEach((insect) => {
    const t = Date.now();
    insect.x =
      insect.baseX + insect.amplitude * Math.sin(t * insect.speed + insect.phase);
    insect.y =
      insect.baseY + insect.amplitude * Math.cos(t * insect.speed + insect.phase);
  });
  updatePushables();
  updateOdorParticles();
  updateClimbing();
  updateHiding();
  updateSleeping();
  updateButterfliesRepulsion();
}

function updatePushables() {
  pushables.forEach((obj) => {
    const dx = obj.x - player.x;
    const dy = obj.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < player.width / 2 + obj.radius) {
      const pushForce = 0.5;
      obj.vx += (dx / dist) * pushForce;
      obj.vy += (dy / dist) * pushForce;
    }
    obj.x += obj.vx;
    obj.y += obj.vy;
    obj.vx *= 0.95;
    obj.vy *= 0.95;
    if (obj.x < 0) { obj.x = 0; obj.vx *= -0.5; }
    if (obj.x > worldWidth) { obj.x = worldWidth; obj.vx *= -0.5; }
    if (obj.y < 0) { obj.y = 0; obj.vy *= -0.5; }
    if (obj.y > worldHeight) { obj.y = worldHeight; obj.vy *= -0.5; }
  });
}

function updateOdorParticles() {
  cheeses.forEach((cheese) => {
    const d = Math.hypot(player.x - cheese.x, player.y - cheese.y);
    if (!cheese.collected && d > 300 && Math.random() < 0.01) {
      odorParticles.push({
        x: cheese.x + (Math.random() - 0.5) * 20,
        y: cheese.y + (Math.random() - 0.5) * 20,
        life: 100,
        maxLife: 100
      });
    }
  });
  nuts.forEach((nut) => {
    const d = Math.hypot(player.x - nut.x, player.y - nut.y);
    if (!nut.collected && d > 300 && Math.random() < 0.01) {
      odorParticles.push({
        x: nut.x + (Math.random() - 0.5) * 20,
        y: nut.y + (Math.random() - 0.5) * 20,
        life: 100,
        maxLife: 100
      });
    }
  });
  for (let i = odorParticles.length - 1; i >= 0; i--) {
    const p = odorParticles[i];
    p.life--;
    p.y -= 0.2;
    if (p.life <= 0) {
      odorParticles.splice(i, 1);
    }
  }
}

function updateClimbing() {
  player.isClimbing = false;
  climbZones.forEach((zone) => {
    if (
      player.x > zone.x &&
      player.x < zone.x + zone.width &&
      player.y > zone.y &&
      player.y < zone.y + zone.height
    ) {
      player.isClimbing = true;
    }
  });
}

function updateHiding() {
  player.isHiding = false;
  hideSpots.forEach((spot) => {
    const d = Math.hypot(player.x - spot.x, player.y - spot.y);
    if (d < spot.radius) {
      player.isHiding = true;
    }
  });
}

function updateSleeping() {
  if (player.idleTime > 6000 && !player.isMoving) {
    player.isSleeping = true;
  } else {
    player.isSleeping = false;
  }
}

function updateButterfliesRepulsion() {
  butterflies.forEach((butterfly) => {
    const d = Math.hypot(butterfly.x - player.x, butterfly.y - player.y);
    if (d < 50) {
      butterfly.baseX += (butterfly.x - player.x) * 0.05;
      butterfly.baseY += (butterfly.y - player.y) * 0.05;
    }
  });
}

const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "sine" },
  envelope: { attack: 1, release: 2 }
}).toDestination();

const chordProgression = [
  ["C4", "E4", "G4"],
  ["A3", "C4", "E4"],
  ["F3", "A3", "C4"],
  ["G3", "B3", "D4"]
];

Tone.Transport.scheduleRepeat((time) => {
  const chord = chordProgression.shift();
  chordProgression.push(chord);
  synth.triggerAttackRelease(chord, "2n", time);
}, "2n");
Tone.Transport.start();

document.getElementById("startSound").addEventListener("click", async () => {
  await Tone.start();
  document.getElementById("startSound").style.display = "none";
});