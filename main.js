import * as Tone from "https://cdn.skypack.dev/tone";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let currentZoom = 1;
let targetZoom = 1;
let tunnelTransition = 0;
let stars = [];
let flowers = [];

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
  isSleeping: false,
  isSniffing: false,
  isDrinking: false,
  drinkEndTime: 0,
  isDigging: false,
  digEndTime: 0,
  treasureCount: 0,
  sleepingManual: false,
  sleepEndTime: 0,
  accessory: "Aucun",
  nestBuilt: false,
  furColor: "#F5DEB3",
  furPattern: "Aucun",
  tailLength: "Standard",
  earShape: "Standard",
  isHappy: false,
  isCurious: false,
  isSneezing: false,
  justRained: false,
  wasRaining: false,
  isInWater: false
};

let controls = {
  up: { primary: "ArrowUp", secondary: "w" },
  down: { primary: "ArrowDown", secondary: "s" },
  left: { primary: "ArrowLeft", secondary: "a" },
  right: { primary: "ArrowRight", secondary: "d" },
  interact: { primary: "e" },
  dig: { primary: "f" },
  sleep: { primary: "r" },
  nest: { primary: "n" }
};

let controlsPressed = {
  up: false,
  down: false,
  left: false,
  right: false,
  interact: false,
  dig: false,
  sleep: false,
  nest: false
};

window.addEventListener("keydown", (e) => {
  let key = e.key;
  if(key === controls.up.primary || key === controls.up.secondary) {
    controlsPressed.up = true;
  } else if(key === controls.down.primary || key === controls.down.secondary) {
    controlsPressed.down = true;
  } else if(key === controls.left.primary || key === controls.left.secondary) {
    controlsPressed.left = true;
  } else if(key === controls.right.primary || key === controls.right.secondary) {
    controlsPressed.right = true;
  } else if(key === controls.interact.primary) {
    controlsPressed.interact = true;
  } else if(key === controls.dig.primary) {
    controlsPressed.dig = true;
  } else if(key === controls.sleep.primary) {
    controlsPressed.sleep = true;
  } else if(key === controls.nest.primary) {
    controlsPressed.nest = true;
  }
});

window.addEventListener("keyup", (e) => {
  let key = e.key;
  if(key === controls.up.primary || key === controls.up.secondary) {
    controlsPressed.up = false;
  } else if(key === controls.down.primary || key === controls.down.secondary) {
    controlsPressed.down = false;
  } else if(key === controls.left.primary || key === controls.left.secondary) {
    controlsPressed.left = false;
  } else if(key === controls.right.primary || key === controls.right.secondary) {
    controlsPressed.right = false;
  } else if(key === controls.interact.primary) {
    controlsPressed.interact = false;
  } else if(key === controls.dig.primary) {
    controlsPressed.dig = false;
  } else if(key === controls.sleep.primary) {
    controlsPressed.sleep = false;
  } else if(key === controls.nest.primary) {
    controlsPressed.nest = false;
  }
});

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

function generateFlowers() {
  flowers = [];
  for (let i = 0; i < 30; i++) {
    flowers.push({
      x: Math.random() * worldWidth,
      y: Math.random() * worldHeight,
      color: "hsl(" + (Math.random() * 360) + ", 70%, 80%)",
      radius: 3 + Math.random() * 2
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

const biomes = [
  { x: 0, y: 0, width: 1500, height: 1500, type: "forest", color: "rgba(34,139,34,0.15)" },
  { x: 1500, y: 0, width: 1500, height: 1500, type: "meadow", color: "rgba(124,252,0,0.15)" },
  { x: 0, y: 1500, width: 1500, height: 1500, type: "riverside", color: "rgba(70,130,180,0.15)" },
  { x: 1500, y: 1500, width: 1500, height: 1500, type: "wheat", color: "rgba(218,165,32,0.15)" }
];
biomes.push(
  { x: 500, y: 200, width: 500, height: 500, type: "jardin", color: "rgba(200,255,200,0.15)" },
  { x: 2200, y: 100, width: 400, height: 400, type: "cuisine", color: "rgba(255,225,200,0.15)" },
  { x: 2600, y: 2600, width: 500, height: 500, type: "grenier", color: "rgba(200,200,200,0.15)" },
  { x: 100, y: 2600, width: 600, height: 500, type: "fleurs", color: "rgba(255,220,220,0.15)" }
);

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
    scale: 0.5 + Math.random()
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

const odorParticles = [];

const digZones = [
  { x: 1000, y: 2000, width: 200, height: 200 },
  { x: 1800, y: 600, width: 150, height: 150 },
  { x: 2500, y: 2500, width: 300, height: 300 }
];
let treasures = [];
const animals = [
  { type: "bird", x: 800, y: 1200, direction: 1 },
  { type: "rabbit", x: 2200, y: 1800, direction: 1 },
  { type: "snail", x: 1600, y: 2500, direction: 1 }
];
const nestZone = { x: 150, y: 150, radius: 40 };

const questSuggestions = [
  "Peut-être devrais-tu chercher un champ de fleurs colorées...",
  "Il paraît qu'il y a un grand arbre creux dans la forêt...",
  "Essaye de trouver le fromage le plus parfumé...",
  "Regarde les nuages passer pendant un moment...",
  "Un coin paisible près de l'eau pourrait être parfait pour une sieste..."
];

function shadeColor(color, percent) {
  let num = parseInt(color.slice(1), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
  return "#" + (
    0x1000000 +
    (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)
  ).toString(16).slice(1);
}

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
  const skyColor = lerpColor("#2C3E50", "#FFFAF0", dayFactor);
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
    ctx.fillStyle = "rgba(255,255,255,0.6)";
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
  let trunkGrad = ctx.createLinearGradient(0, 0, 0, 40);
  trunkGrad.addColorStop(0, "#7D5A45");
  trunkGrad.addColorStop(0.5, "#8B5A2B");
  trunkGrad.addColorStop(1, "#5D3A1A");
  ctx.fillStyle = trunkGrad;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(5, 0);
  ctx.lineTo(7, 30);
  ctx.lineTo(-7, 30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#228B22";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(15, -20, 20, -40, 0, -50);
  ctx.bezierCurveTo(-20, -40, -15, -20, 0, 0);
  ctx.closePath();
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
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-cheese.radius/3, -cheese.radius/4, cheese.radius/8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cheese.radius/4, cheese.radius/6, cheese.radius/10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#F57C00";
  ctx.lineWidth = 1;
  ctx.stroke();
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
  ctx.fillStyle = "#A0522D";
  ctx.beginPath();
  ctx.arc(0, 0, nut.radius/2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#556B2F";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -nut.radius);
  ctx.lineTo(0, -nut.radius-3);
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
  if (player.isClimbing) { ctx.rotate(-0.1); }
  if (player.isHiding) { ctx.globalAlpha = 0.3; }
  let verticalBounce = player.isHappy ? Math.sin(Date.now()/100)*2 : 0;
  ctx.translate(player.x, player.y + verticalBounce);
  
  let bodyGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 20);
  let furColor = player.furColor || "#F5DEB3";
  bodyGrad.addColorStop(0, furColor);
  bodyGrad.addColorStop(1, shadeColor(furColor, -15));
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  if (player.furPattern !== "Aucun") {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    if(player.furPattern === "Taches") {
      ctx.beginPath();
      ctx.arc(-5, -3, 3, 0, Math.PI * 2);
      ctx.arc(4, 2, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if(player.furPattern === "Rayures") {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 2;
      ctx.moveTo(-10, -5);
      ctx.lineTo(10, -5);
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.moveTo(-10, 5);
      ctx.lineTo(10, 5);
      ctx.stroke();
    }
    ctx.restore();
  }
  
  ctx.beginPath();
  let tailAmplitude = Math.sin(Date.now() / 300) * 0.5;
  let tailStartX = -15;
  let tailStartY = 5;
  let tailLengthFactor = 1;
  if(player.tailLength === "Courte") tailLengthFactor = 0.7;
  else if(player.tailLength === "Longue") tailLengthFactor = 1.3;
  else if(player.tailLength === "Touffue") tailLengthFactor = 1.1;
  ctx.moveTo(tailStartX, tailStartY);
  let cpX = tailStartX - 15 * tailLengthFactor;
  let cpY = tailStartY + tailAmplitude * 10;
  let endX = tailStartX - 10 * tailLengthFactor;
  let endY = tailStartY - 5;
  ctx.quadraticCurveTo(cpX, cpY, endX, endY);
  ctx.strokeStyle = furColor;
  ctx.lineWidth = 4;
  ctx.stroke();
  if(player.tailLength === "Touffue") {
    ctx.save();
    ctx.strokeStyle = shadeColor(furColor, -10);
    for(let i = 0; i < 3; i++){
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - 3, endY - 3 - i);
      ctx.stroke();
    }
    ctx.restore();
  }
  
  ctx.save();
  let earOffset = Math.sin(Date.now() / 300) * 2;
  let leftEarX = -12;
  let leftEarY = -15 + earOffset;
  ctx.translate(leftEarX, leftEarY);
  if(player.earShape === "Standard" || player.earShape === "Rondes") {
    let radius = player.earShape === "Rondes" ? 8 : 6;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = furColor;
    ctx.fill();
    ctx.strokeStyle = "#D2B48C";
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if(player.earShape === "Pointues") {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-4, -10);
    ctx.lineTo(4, -10);
    ctx.closePath();
    ctx.fillStyle = furColor;
    ctx.fill();
    ctx.strokeStyle = "#D2B48C";
    ctx.stroke();
  } else if(player.earShape === "Tombantes") {
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 9, Math.PI/4, 0, Math.PI * 2);
    ctx.fillStyle = furColor;
    ctx.fill();
    ctx.strokeStyle = "#D2B48C";
    ctx.stroke();
  }
  ctx.restore();
  
  ctx.save();
  let rightEarX = 12;
  let rightEarY = -15 - earOffset;
  ctx.translate(rightEarX, rightEarY);
  if(player.earShape === "Standard" || player.earShape === "Rondes") {
    let radius = player.earShape === "Rondes" ? 8 : 6;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = furColor;
    ctx.fill();
    ctx.strokeStyle = "#D2B48C";
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if(player.earShape === "Pointues") {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-4, -10);
    ctx.lineTo(4, -10);
    ctx.closePath();
    ctx.fillStyle = furColor;
    ctx.fill();
    ctx.strokeStyle = "#D2B48C";
    ctx.stroke();
  } else if(player.earShape === "Tombantes") {
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 9, -Math.PI/4, 0, Math.PI * 2);
    ctx.fillStyle = furColor;
    ctx.fill();
    ctx.strokeStyle = "#D2B48C";
    ctx.stroke();
  }
  ctx.restore();
  
  ctx.fillStyle = "#000";
  if (player.blinkState && !player.isSleeping) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -5);
    ctx.lineTo(12, -5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, -5);
    ctx.lineTo(-8, -5);
    ctx.stroke();
  } else if (!player.isSleeping) {
    let eyeSize = player.isSniffing ? 3 : (player.isCurious ? 4 : 2);
    ctx.beginPath();
    ctx.arc(10, -5, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-10, -5, eyeSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  let noseWiggle = player.isSniffing ? Math.sin(Date.now()/100) * 1.5 : 0;
  ctx.fillStyle = "#FFB6C1";
  ctx.beginPath();
  ctx.arc(0 + noseWiggle, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  
  if (Date.now() < player.eatingEndTime) {
    let chewOffset = Math.sin(Date.now()/100) * 2;
    ctx.beginPath();
    ctx.moveTo(-5, 5);
    ctx.quadraticCurveTo(0, 5 + chewOffset, 5, 5);
    ctx.strokeStyle = "#ff8c00";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-5, 3, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffe4e1";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-3, 0);
  ctx.quadraticCurveTo(-12, 0, -18, -2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-3, 2);
  ctx.quadraticCurveTo(-12, 2, -18, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, 0);
  ctx.quadraticCurveTo(12, 0, 18, -2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, 2);
  ctx.quadraticCurveTo(12, 2, 18, 4);
  ctx.stroke();
  
  let legOffset = 0;
  if (player.isMoving) { legOffset = Math.sin(player.walkCycle) * 3; }
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, 10);
  ctx.lineTo(-10, 10 + legOffset);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(10, 10 - legOffset);
  ctx.stroke();
  
  if (player.isSleeping) {
    ctx.fillStyle = "#000";
    ctx.font = "italic 18px cursive";
    ctx.fillText("Zz", -25, -25);
    ctx.fillStyle = "rgba(173,216,230,0.5)";
    ctx.beginPath();
    ctx.arc(10, -30, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20, -45, 3, 0, Math.PI*2);
    ctx.fill();
  }
  
  if (player.isSneezing) {
    ctx.fillStyle = "rgba(255,0,0,0.8)";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("Achoo!", -20, -35);
  }
  
  if (player.justRained) {
    ctx.save();
    ctx.fillStyle = "rgba(135,206,250,0.7)";
    ctx.beginPath();
    ctx.arc(-10, 0, 2, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, 2, 2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  
  if (player.accessory !== "Aucun") {
    ctx.save();
    ctx.fillStyle = "#556B2F";
    if (player.accessory === "Chapeau") {
      ctx.beginPath();
      ctx.moveTo(-10, -25);
      ctx.lineTo(0, -35);
      ctx.lineTo(10, -25);
      ctx.closePath();
      ctx.fill();
    } else if (player.accessory === "Ruban") {
      ctx.beginPath();
      ctx.moveTo(-15, 5);
      ctx.lineTo(-5, 5);
      ctx.lineTo(-5, 10);
      ctx.lineTo(-15, 10);
      ctx.closePath();
      ctx.fill();
    } else if (player.accessory === "Foulard") {
      ctx.beginPath();
      ctx.rect(-10, -20, 20, 5);
      ctx.fill();
    } else if (player.accessory === "Fleur") {
      ctx.beginPath();
      ctx.arc(0, -25, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#FF69B4";
      ctx.fill();
    } else if (player.accessory === "Sac") {
      ctx.beginPath();
      ctx.rect(-8, 5, 16, 10);
      ctx.fillStyle = "#8B4513";
      ctx.fill();
    }
    ctx.restore();
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
    const waveOffset = Math.sin(Date.now() / 500 + pond.x) * 3;
    const grad = ctx.createRadialGradient(pond.x, pond.y, 10, pond.x, pond.y, pond.radius);
    grad.addColorStop(0, "#a0e9ff");
    grad.addColorStop(1, "#0077be");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(pond.x, pond.y, pond.radius + waveOffset, pond.radius, 0, 0, Math.PI * 2);
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
    let opacity = (p.life / p.maxLife * (player.isSniffing ? 0.8 : 0.5));
    ctx.fillStyle = "rgba(255,204,229," + opacity + ")";
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
      ctx.strokeStyle = "rgba(34,139,34,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(player.x + offsetX, player.y + offsetY);
      ctx.lineTo(player.x + offsetX + 5, player.y + offsetY - 5);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawFlowers() {
  ctx.save();
  ctx.setTransform(
    currentZoom,
    0,
    0,
    currentZoom,
    canvas.width / 2 - player.x * currentZoom,
    canvas.height / 2 - player.y * currentZoom
  );
  flowers.forEach((flower) => {
    ctx.save();
    ctx.translate(flower.x, flower.y);
    let flowerOsc = Math.sin(Date.now() / 500 + flower.x) * 0.05;
    for (let i = 0; i < 5; i++) {
      ctx.rotate((2 * Math.PI) / 5 + flowerOsc);
      ctx.beginPath();
      ctx.ellipse(0, flower.radius, flower.radius * 1.2, flower.radius, 0, 0, Math.PI * 2);
      ctx.fillStyle = flower.color;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, flower.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD700";
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function updateSleeping() {
  if (player.sleepingManual || (player.idleTime > 6000 && !player.isMoving)) {
    player.isSleeping = true;
  } else {
    player.isSleeping = false;
  }
}

function updateAnimals() {
  animals.forEach(animal => {
    if (animal.type === "bird") {
      animal.x += animal.direction * 0.5;
      const d = Math.hypot(animal.x - player.x, animal.y - player.y);
      if (d < 100) { animal.direction = 1; }
      if (animal.x > worldWidth) animal.x = 0;
    } else if (animal.type === "rabbit") {
      animal.x += animal.direction * 0.3;
      const d = Math.hypot(animal.x - player.x, animal.y - player.y);
      if (d < 100) { animal.direction = -animal.direction; }
      if (animal.x > worldWidth || animal.x < 0) animal.direction *= -1;
    } else if (animal.type === "snail") {
      animal.x += animal.direction * 0.1;
      if (Math.random() < 0.01) { animal.direction *= -1; }
      if (animal.x > worldWidth || animal.x < 0) animal.direction *= -1;
    }
  });
}

function drawAnimals() {
  ctx.save();
  ctx.setTransform(
    currentZoom,
    0,
    0,
    currentZoom,
    canvas.width / 2 - player.x * currentZoom,
    canvas.height / 2 - player.y * currentZoom
  );
  animals.forEach(animal => {
    ctx.save();
    ctx.translate(animal.x, animal.y);
    if (animal.type === "bird") {
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(10, -10);
      ctx.lineTo(20, 0);
      ctx.closePath();
      ctx.fill();
    } else if (animal.type === "rabbit") {
      ctx.fillStyle = "#FFF8DC";
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFF8DC";
      ctx.beginPath();
      ctx.ellipse(-3, -8, 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(3, -8, 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (animal.type === "snail") {
      ctx.fillStyle = "#8B4513";
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#CD853F";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
  ctx.restore();
}

function drawTreasures() {
  ctx.save();
  ctx.setTransform(
    currentZoom,
    0,
    0,
    currentZoom,
    canvas.width / 2 - player.x * currentZoom,
    canvas.height / 2 - player.y * currentZoom
  );
  treasures.forEach(treasure => {
    if (!treasure.collected) {
      ctx.save();
      ctx.translate(treasure.x, treasure.y);
      if (treasure.type === "seed") {
        ctx.fillStyle = "#8B4513";
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (treasure.type === "insect") {
        ctx.fillStyle = "#556B2F";
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (treasure.type === "leaf") {
        ctx.fillStyle = "#9ACD32";
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.quadraticCurveTo(4, 0, 0, 4);
        ctx.quadraticCurveTo(-4, 0, 0, -4);
        ctx.fill();
      } else if (treasure.type === "feather") {
        ctx.fillStyle = "#FFB6C1";
        ctx.beginPath();
        ctx.ellipse(0, 0, 3, 6, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  });
  ctx.restore();
}

function drawNest() {
  if (!player.nestBuilt) return;
  ctx.save();
  ctx.setTransform(
    currentZoom,
    0,
    0,
    currentZoom,
    canvas.width / 2 - nestZone.x * currentZoom,
    canvas.height / 2 - nestZone.y * currentZoom
  );
  ctx.fillStyle = "#8B4513";
  ctx.beginPath();
  ctx.arc(nestZone.x, nestZone.y, nestZone.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#D2B48C";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function updateQuestText() {
  const questDiv = document.getElementById("quest");
  const suggestion = questSuggestions[Math.floor(Math.random() * questSuggestions.length)];
  questDiv.textContent = suggestion;
}
setInterval(updateQuestText, 20000);

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
  trees.forEach((tree) => { drawTree(tree); });
  drawClimbZones();
  drawHideSpots();
  drawPushables();
  tunnels.forEach((tunnel) => { drawTunnel(tunnel); });
  cheeses.forEach((cheese) => { if (!cheese.collected) { drawCheese(cheese); } });
  nuts.forEach((nut) => { if (!nut.collected) { drawNut(nut); } });
  drawOdorParticles();
  drawGrassEffect();
  butterflies.forEach((butterfly) => { drawButterfly(butterfly); });
  drawFlowers();
  drawAnimals();
  drawTreasures();
  drawPlayer(player);
  ctx.restore();
  if (getDayFactor() < 0.3) { drawRain(); }
  if (tunnelTransition > 0) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(0,0,0,${tunnelTransition})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  drawNest();
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

function update() {
  let dx = 0, dy = 0;
  if (controlsPressed.up) dy -= player.speed;
  if (controlsPressed.down) dy += player.speed;
  if (controlsPressed.left) dx -= player.speed;
  if (controlsPressed.right) dx += player.speed;
  if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
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
  
  if (!player.isMoving && player.idleTime > 5000 && Math.random() < 0.001) {
    player.isCurious = true;
    setTimeout(() => { player.isCurious = false; }, 1000);
  }
  if (!player.isMoving && player.idleTime > 7000 && Math.random() < 0.001) {
    player.isSneezing = true;
    setTimeout(() => { player.isSneezing = false; }, 500);
  }
  
  cheeses.forEach((cheese) => {
    if (!cheese.collected) {
      const dist = Math.hypot(player.x - cheese.x, player.y - cheese.y);
      if (dist < player.width / 2 + cheese.radius) {
        cheese.collected = true;
        cheeseScore++;
        document.getElementById("score").textContent = cheeseScore;
        synth.triggerAttackRelease("C5", "8n");
        player.eatingEndTime = Date.now() + 300;
        player.isHappy = true;
        setTimeout(() => { player.isHappy = false; }, 1000);
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
        player.isHappy = true;
        setTimeout(() => { player.isHappy = false; }, 1000);
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
    if (cloud.x > worldWidth + 100) { cloud.x = -100; }
  });
  
  butterflies.forEach((butterfly) => {
    const t = Date.now();
    butterfly.x = butterfly.baseX + butterfly.amplitude * Math.sin(t * butterfly.speed + butterfly.phase);
    butterfly.y = butterfly.baseY + butterfly.amplitude * Math.cos(t * butterfly.speed + butterfly.phase);
  });
  
  if (player.x > worldWidth / 2 - 250 && player.x < worldWidth / 2 + 250 &&
      player.y > worldHeight / 2 - 250 && player.y < worldHeight / 2 + 250) {
    targetZoom = 1.2;
  } else { 
    targetZoom = 1; 
  }
  currentZoom += (targetZoom - currentZoom) * 0.05;
  
  const isRaining = getDayFactor() < 0.3;
  if (isRaining) {
    rainDrops.forEach((drop) => {
      drop.y += drop.speed;
      if (drop.y > canvas.height) { drop.y = -10; drop.x = Math.random() * canvas.width; }
    });
  }
  
  if (player.wasRaining && !isRaining) {
    player.justRained = true;
    setTimeout(() => { player.justRained = false; }, 1000);
  }
  player.wasRaining = isRaining;
  
  leaves.forEach((leaf) => {
    leaf.y += leaf.speed;
    leaf.rotation += leaf.sway;
    if (leaf.y > worldHeight) { leaf.y = -10; leaf.x = Math.random() * worldWidth; }
  });
  
  insects.forEach((insect) => {
    const t = Date.now();
    insect.x = insect.baseX + insect.amplitude * Math.sin(t * insect.speed + insect.phase);
    insect.y = insect.baseY + insect.amplitude * Math.cos(t * insect.speed + insect.phase);
  });
  
  updatePushables();
  updateOdorParticles();
  updateClimbing();
  updateHiding();
  updateSleeping();
  updateButterfliesRepulsion();
  
  if (controlsPressed.interact) {
    if (player.isInWater && !player.isDrinking) {
      player.isDrinking = true;
      player.drinkEndTime = Date.now() + 1000;
      synth.triggerAttackRelease("A4", "8n");
    } else {
      player.isSniffing = true;
    }
    controlsPressed.interact = false;
  }
  if (controlsPressed.dig && !player.isDigging) {
    for (let zone of digZones) {
      if (player.x > zone.x && player.x < zone.x + zone.width &&
          player.y > zone.y && player.y < zone.y + zone.height) {
        player.isDigging = true;
        player.digEndTime = Date.now() + 500;
        if (Math.random() < 0.5) {
          const types = ["seed", "insect", "leaf", "feather"];
          const type = types[Math.floor(Math.random() * types.length)];
          treasures.push({ x: player.x, y: player.y, type: type, collected: false });
          synth.triggerAttackRelease("F4", "8n");
        }
        break;
      }
    }
    controlsPressed.dig = false;
  }
  if (controlsPressed.sleep && !player.isMoving && !player.isSleeping) {
    player.sleepingManual = true;
    player.sleepEndTime = Date.now() + 3000;
    controlsPressed.sleep = false;
  }
  if (controlsPressed.nest && !player.nestBuilt && player.treasureCount >= 5) {
    player.nestBuilt = true;
    player.treasureCount -= 5;
    document.getElementById("treasureCount").textContent = player.treasureCount;
    synth.triggerAttackRelease("C4", "8n");
    controlsPressed.nest = false;
  }
  
  for (let i = treasures.length - 1; i >= 0; i--) {
    const t = treasures[i];
    const d = Math.hypot(player.x - t.x, player.y - t.y);
    if (!t.collected && d < player.width / 2 + 10) {
      t.collected = true;
      player.treasureCount++;
      document.getElementById("treasureCount").textContent = player.treasureCount;
      synth.triggerAttackRelease("E4", "8n");
    }
  }
  
  updateAnimals();
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
    if (p.life <= 0) { odorParticles.splice(i, 1); }
  }
}

function updateClimbing() {
  player.isClimbing = false;
  climbZones.forEach((zone) => {
    if (player.x > zone.x && player.x < zone.x + zone.width &&
        player.y > zone.y && player.y < zone.y + zone.height) { player.isClimbing = true; }
  });
}

function updateHiding() {
  player.isHiding = false;
  hideSpots.forEach((spot) => {
    const d = Math.hypot(player.x - spot.x, player.y - spot.y);
    if (d < spot.radius) { player.isHiding = true; }
  });
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

document.getElementById("diaryButton").addEventListener("click", () => {
  alert("Journal de souris : Fonctionnalité à venir !");
});

document.getElementById("furColorSelect").addEventListener("change", (e) => {
  player.furColor = e.target.value;
});
document.getElementById("accessorySelect").addEventListener("change", (e) => {
  player.accessory = e.target.value;
});
document.getElementById("furPatternSelect").addEventListener("change", (e) => {
  player.furPattern = e.target.value;
});
document.getElementById("tailLengthSelect").addEventListener("change", (e) => {
  player.tailLength = e.target.value;
});
document.getElementById("earShapeSelect").addEventListener("change", (e) => {
  player.earShape = e.target.value;
});

function setupMobileControl(buttonId, action) {
  const btn = document.getElementById(buttonId);
  btn.addEventListener("pointerdown", () => { controlsPressed[action] = true; });
  btn.addEventListener("pointerup", () => { controlsPressed[action] = false; });
  btn.addEventListener("pointerout", () => { controlsPressed[action] = false; });
}

setupMobileControl("mobile-up", "up");
setupMobileControl("mobile-down", "down");
setupMobileControl("mobile-left", "left");
setupMobileControl("mobile-right", "right");
setupMobileControl("mobile-interact", "interact");
setupMobileControl("mobile-dig", "dig");
setupMobileControl("mobile-sleep", "sleep");
setupMobileControl("mobile-nest", "nest");

const mobileControls = document.getElementById("mobileControls");
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
mobileControls.addEventListener("pointerdown", (e) => {
  if (e.target === mobileControls) {
    isDragging = true;
    dragOffset.x = e.clientX - mobileControls.offsetLeft;
    dragOffset.y = e.clientY - mobileControls.offsetTop;
    e.preventDefault();
  }
});
window.addEventListener("pointermove", (e) => {
  if (isDragging) {
    mobileControls.style.left = (e.clientX - dragOffset.x) + "px";
    mobileControls.style.top = (e.clientY - dragOffset.y) + "px";
  }
});
window.addEventListener("pointerup", () => {
  isDragging = false;
});

const settingsButton = document.getElementById("settingsButton");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettings = document.getElementById("closeSettings");

settingsButton.addEventListener("click", () => {
  document.getElementById("control-up").value = controls.up.primary + " / " + controls.up.secondary;
  document.getElementById("control-down").value = controls.down.primary + " / " + controls.down.secondary;
  document.getElementById("control-left").value = controls.left.primary + " / " + controls.left.secondary;
  document.getElementById("control-right").value = controls.right.primary + " / " + controls.right.secondary;
  document.getElementById("control-interact").value = controls.interact.primary;
  document.getElementById("control-dig").value = controls.dig.primary;
  document.getElementById("control-sleep").value = controls.sleep.primary;
  document.getElementById("control-nest").value = controls.nest.primary;
  document.getElementById("mobileControlsVisible").checked = (mobileControls.style.display !== "none");
  settingsPanel.style.display = "block";
});

closeSettings.addEventListener("click", () => {
  const upInput = document.getElementById("control-up").value.split("/");
  controls.up.primary = upInput[0].trim();
  controls.up.secondary = upInput[1] ? upInput[1].trim() : "";
  
  const downInput = document.getElementById("control-down").value.split("/");
  controls.down.primary = downInput[0].trim();
  controls.down.secondary = downInput[1] ? downInput[1].trim() : "";
  
  const leftInput = document.getElementById("control-left").value.split("/");
  controls.left.primary = leftInput[0].trim();
  controls.left.secondary = leftInput[1] ? leftInput[1].trim() : "";
  
  const rightInput = document.getElementById("control-right").value.split("/");
  controls.right.primary = rightInput[0].trim();
  controls.right.secondary = rightInput[1] ? rightInput[1].trim() : "";
  
  controls.interact.primary = document.getElementById("control-interact").value.trim();
  controls.dig.primary = document.getElementById("control-dig").value.trim();
  controls.sleep.primary = document.getElementById("control-sleep").value.trim();
  controls.nest.primary = document.getElementById("control-nest").value.trim();
  
  const mobileVisible = document.getElementById("mobileControlsVisible").checked;
  mobileControls.style.display = mobileVisible ? "flex" : "none";
  
  const size = document.getElementById("mobileControlSize").value + "px";
  document.querySelectorAll(".mobile-btn").forEach(btn => {
    btn.style.width = size;
    btn.style.height = size;
  });
  
  settingsPanel.style.display = "none";
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();

generateFlowers();