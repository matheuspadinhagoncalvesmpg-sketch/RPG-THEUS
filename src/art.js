// Arte vetorial do herói, personagens e objetos (desenhada em tempo real no canvas).
import { shade, rgba } from './util.js';

export const EYE_COLORS = {
  hetero: ['#ff3b4f', '#3ba7ff'],
  black: ['#14121c', '#14121c'],
  blue: ['#3ba7ff', '#3ba7ff'],
  red: ['#ff3b4f', '#ff3b4f'],
  green: ['#3ee08a', '#3ee08a'],
  gold: ['#ffcf4a', '#ffcf4a'],
};

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Herói. (x, y) = centro dos pés.
export function drawHero(ctx, x, y, o) {
  const p = o.profile;
  const t = o.t || 0;
  const flash = o.flash > 0;
  const col = (c) => (flash ? '#ffffff' : c);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(o.facing || 1, 1);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;

  let bob = 0, lean = 0, legA = 0, legB = 0, flare = 0, crouch = 0;
  switch (o.state) {
    case 'run': {
      const ph = t * 0.32;
      legA = Math.sin(ph) * 4; legB = -legA;
      bob = -Math.abs(Math.sin(ph)) * 1.3;
      lean = 0.08; flare = 2 + Math.sin(ph * 2);
      break;
    }
    case 'jump': legA = -2; legB = 2; flare = -2; break;
    case 'fall': legA = 1; legB = -1; flare = 4; break;
    case 'dash': lean = 0.3; flare = 7; legA = -3; legB = 3; break;
    case 'wall': legA = 2; legB = 2; flare = 1; break;
    case 'focus': crouch = 3; bob = Math.sin(t * 0.5) * 0.4; break;
    case 'sit': crouch = 6; break;
    case 'hurt': lean = -0.25; flare = 3; break;
    default: bob = Math.sin(t * 0.06) * 0.7;
  }
  ctx.rotate(lean);
  const by = bob + crouch;

  // Pernas
  ctx.fillStyle = col('#15121d');
  if (o.state === 'sit') {
    ctx.fillRect(-4, -5, 8, 3);
    ctx.fillRect(3, -5, 3, 5);
  } else {
    ctx.fillRect(-4 + legA * 0.5, -7 + crouch, 3, 7 - crouch);
    ctx.fillRect(1 + legB * 0.5, -7 + crouch, 3, 7 - crouch);
  }

  // Capa
  const c = col(p.cloak);
  const hem = -4 + crouch * 0.6;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(-6, -20 + by);
  ctx.quadraticCurveTo(-10 - flare * 0.7, -10 + by, -11 - flare, hem + Math.sin(t * 0.2) * 0.8);
  ctx.lineTo(-6 - flare * 0.6, hem - 2);
  ctx.lineTo(-2 - flare * 0.3, hem + 1);
  ctx.lineTo(3, hem - 1);
  ctx.lineTo(9, hem + 0.5);
  ctx.quadraticCurveTo(9, -12 + by, 6, -20 + by);
  ctx.closePath();
  ctx.fill();
  // dobra escura
  ctx.fillStyle = col(shade(p.cloak, -0.35));
  ctx.beginPath();
  ctx.moveTo(-3, -18 + by);
  ctx.quadraticCurveTo(-6 - flare * 0.4, -9 + by, -6 - flare * 0.6, hem - 2);
  ctx.lineTo(-2 - flare * 0.3, hem + 1);
  ctx.quadraticCurveTo(-2, -10 + by, -3, -18 + by);
  ctx.fill();
  // gola
  ctx.fillStyle = col(shade(p.cloak, 0.18));
  ctx.beginPath();
  ctx.ellipse(0, -19 + by, 7.5, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cabeça
  const hy = -26 + by;
  ctx.fillStyle = col('#0c0a12');
  ellipse(ctx, 1, hy, 8.8, 8.3);
  ctx.fillStyle = col(p.skin);
  ellipse(ctx, 1, hy, 7.8, 7.4);

  // Cabelo
  ctx.fillStyle = col(p.hair);
  ctx.beginPath();
  ctx.moveTo(8.5, hy - 1);
  ctx.quadraticCurveTo(8, hy - 9, 0, hy - 9);
  ctx.quadraticCurveTo(-7, hy - 9, -9, hy - 3);
  ctx.lineTo(-13 - flare * 0.3, hy - 5 + Math.sin(t * 0.15) * 0.6);
  ctx.lineTo(-9, hy + 0);
  ctx.lineTo(-12 - flare * 0.3, hy + 3);
  ctx.lineTo(-7, hy + 4);
  ctx.quadraticCurveTo(-4, hy - 4, 2, hy - 4.5);
  ctx.lineTo(4, hy - 2.5);
  ctx.lineTo(5, hy - 5);
  ctx.quadraticCurveTo(7.5, hy - 4, 8.5, hy - 1);
  ctx.fill();
  ctx.fillStyle = col(shade(p.hair, 0.4));
  ctx.fillRect(-2, hy - 8, 5, 1.2);

  // Olhos
  if (o.state !== 'dead') {
    const [eFar, eNear] = EYE_COLORS[p.eyes] || EYE_COLORS.hetero;
    const blink = t % 220 < 6 && o.state === 'idle';
    for (const [ex, ec] of [[0.2, eFar], [5, eNear]]) {
      if (blink) { ctx.fillStyle = '#0c0a12'; ctx.fillRect(ex - 1.4, hy + 0.5, 2.8, 1); continue; }
      ctx.fillStyle = flash ? '#fff' : '#0c0a12';
      ellipse(ctx, ex, hy + 0.8, 1.9, 2.9);
      ctx.fillStyle = col(ec);
      ellipse(ctx, ex, hy + 0.8, 1.3, 2.2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(ex - 0.2, hy - 0.8, 0.9, 0.9);
    }
  }

  // Lâmina durante o ataque
  if (o.attack) {
    ctx.strokeStyle = col('#e8eef7');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (o.attack === 'side') { ctx.moveTo(6, -14); ctx.lineTo(24, -16); }
    else if (o.attack === 'up') { ctx.moveTo(3, -18); ctx.lineTo(5, -42); }
    else { ctx.moveTo(3, -8); ctx.lineTo(4, 14); }
    ctx.stroke();
  }
  ctx.restore();
}

// Arco de corte (efeito do golpe).
export function drawSlash(ctx, cx, cy, dir, facing, k) {
  ctx.save();
  ctx.translate(cx, cy);
  if (dir === 'up') ctx.rotate(-Math.PI / 2);
  else if (dir === 'down') ctx.rotate(Math.PI / 2);
  else ctx.scale(facing, 1);
  const a = 1 - k;
  const grad = ctx.createLinearGradient(0, -30, 0, 30);
  grad.addColorStop(0, `rgba(255,255,255,0)`);
  grad.addColorStop(0.5, `rgba(255,255,255,${0.9 * a})`);
  grad.addColorStop(1, `rgba(255,255,255,0)`);
  ctx.fillStyle = grad;
  const sweep = 0.6 + k * 0.8;
  ctx.beginPath();
  ctx.arc(-6, 0, 38, -sweep, sweep);
  ctx.arc(-14, 0, 30, sweep, -sweep, true);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawNPC(ctx, kind, x, y, t, facing = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  const b = Math.sin(t * 0.05) * 0.8;
  if (kind === 'oren') {
    // Andarilho idoso com lanterna e chapéu largo
    ctx.fillStyle = '#4a3b33';
    ctx.beginPath();
    ctx.moveTo(-9, 0); ctx.lineTo(-7, -26 + b); ctx.lineTo(7, -26 + b); ctx.lineTo(10, 0);
    ctx.fill();
    ctx.fillStyle = '#d9cbb8';
    ellipse(ctx, 0, -31 + b, 7, 6.5);
    ctx.fillStyle = '#efe9e0';
    ctx.beginPath(); ctx.moveTo(-5, -28 + b); ctx.lineTo(0, -14 + b); ctx.lineTo(5, -28 + b); ctx.fill();
    ctx.fillStyle = '#2a211d';
    ctx.beginPath(); ctx.ellipse(0, -36 + b, 15, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-7, -46 + b, 14, 10);
    ctx.fillStyle = '#14121c';
    ctx.fillRect(1, -33 + b, 2, 2); ctx.fillRect(-4, -33 + b, 2, 2);
    // cajado com lanterna
    ctx.strokeStyle = '#6b5240'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(13, -38); ctx.stroke();
    const glow = ctx.createRadialGradient(15, -36, 1, 15, -36, 22);
    glow.addColorStop(0, 'rgba(255,200,110,0.55)'); glow.addColorStop(1, 'rgba(255,200,110,0)');
    ctx.fillStyle = glow; ctx.fillRect(-10, -60, 50, 50);
    ctx.fillStyle = '#ffd27a'; ctx.fillRect(12, -38, 6, 6);
  } else if (kind === 'mira') {
    // Mercadora com mochila enorme
    ctx.fillStyle = '#5a3f2a';
    ctx.fillRect(-20, -44 + b, 18, 34);
    ctx.fillStyle = '#8a6a44';
    ctx.fillRect(-19, -36 + b, 16, 3); ctx.fillRect(-19, -24 + b, 16, 3);
    ctx.fillStyle = '#c0703f'; ellipse(ctx, -12, -46 + b, 6, 4);
    ctx.fillStyle = '#7a2f3a';
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-6, -22 + b); ctx.lineTo(7, -22 + b); ctx.lineTo(9, 0); ctx.fill();
    ctx.fillStyle = '#2b1a24';
    ellipse(ctx, 0, -28 + b, 8, 8);
    ctx.fillStyle = '#7a2f3a';
    ctx.beginPath(); ctx.moveTo(-9, -26 + b); ctx.quadraticCurveTo(0, -44 + b, 9, -26 + b); ctx.lineTo(6, -29 + b); ctx.quadraticCurveTo(0, -36 + b, -6, -29 + b); ctx.fill();
    ctx.fillStyle = '#ffd36e';
    ellipse(ctx, -2, -27 + b, 1.4, 2); ellipse(ctx, 3, -27 + b, 1.4, 2);
  } else if (kind === 'eco') {
    // Espírito translúcido
    const fl = Math.sin(t * 0.04) * 4;
    ctx.translate(0, -10 + fl);
    const g = ctx.createRadialGradient(0, -14, 2, 0, -14, 30);
    g.addColorStop(0, 'rgba(140,255,230,0.35)'); g.addColorStop(1, 'rgba(140,255,230,0)');
    ctx.fillStyle = g; ctx.fillRect(-32, -46, 64, 64);
    ctx.fillStyle = 'rgba(190,255,240,0.75)';
    ctx.beginPath();
    ctx.moveTo(-9, -12);
    ctx.quadraticCurveTo(-10, -32, 0, -32);
    ctx.quadraticCurveTo(10, -32, 9, -12);
    for (let i = 0; i < 4; i++) ctx.lineTo(6 - i * 5, -4 + ((i + Math.floor(t / 8)) % 2) * 3);
    ctx.fill();
    ctx.fillStyle = '#0c2a2a';
    ellipse(ctx, -3, -22, 1.6, 2.6); ellipse(ctx, 3, -22, 1.6, 2.6);
  }
  ctx.restore();
}

export function drawBench(ctx, x, y, pal) {
  ctx.save();
  ctx.translate(x, y);
  const wood = pal.plank;
  ctx.fillStyle = shade(wood, -0.35);
  ctx.fillRect(-20, -10, 3, 10); ctx.fillRect(17, -10, 3, 10);
  ctx.fillRect(-18, -26, 3, 16); ctx.fillRect(15, -26, 3, 16);
  ctx.fillStyle = wood;
  ctx.fillRect(-24, -12, 48, 4);
  ctx.fillRect(-21, -26, 42, 3);
  ctx.fillRect(-21, -20, 42, 3);
  ctx.fillStyle = shade(wood, 0.25);
  ctx.fillRect(-24, -12, 48, 1);
  ctx.restore();
}

export function drawLoreStone(ctx, x, y, t, pal) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = pal.groundHi;
  ctx.beginPath();
  ctx.moveTo(-12, 0); ctx.lineTo(-10, -30); ctx.quadraticCurveTo(0, -38, 10, -30); ctx.lineTo(12, 0);
  ctx.fill();
  ctx.fillStyle = rgba(pal.accent, 0.5 + Math.sin(t * 0.05) * 0.3);
  ctx.fillRect(-5, -24, 10, 2); ctx.fillRect(-5, -18, 7, 2); ctx.fillRect(-5, -12, 9, 2);
  ctx.restore();
}

export function drawOrb(ctx, x, y, t, color = '#bfe9ff') {
  const r = 9 + Math.sin(t * 0.08) * 1.5;
  const g = ctx.createRadialGradient(x, y, 1, x, y, r * 4);
  g.addColorStop(0, rgba(color, 0.8)); g.addColorStop(0.3, rgba(color, 0.25)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
  ctx.fillStyle = '#ffffff';
  ellipse(ctx, x, y, r * 0.55, r * 0.55);
  ctx.strokeStyle = rgba(color, 0.8);
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const a = t * 0.04 + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.arc(x, y, r + 4, a, a + 0.9);
    ctx.stroke();
  }
}

export function drawMaskShard(ctx, x, y, t) {
  const fl = Math.sin(t * 0.06) * 3;
  const g = ctx.createRadialGradient(x, y + fl, 1, x, y + fl, 26);
  g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 26, y - 26 + fl, 52, 52);
  drawMaskIcon(ctx, x, y + fl, 1, '#f4f1ea');
}

export function drawMaskIcon(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-7, -4);
  ctx.quadraticCurveTo(-7, -10, 0, -10);
  ctx.quadraticCurveTo(7, -10, 7, -4);
  ctx.quadraticCurveTo(7, 5, 0, 9);
  ctx.quadraticCurveTo(-7, 5, -7, -4);
  ctx.fill();
  ctx.fillStyle = '#14121c';
  ellipse(ctx, -2.8, -2, 1.6, 2.4); ellipse(ctx, 2.8, -2, 1.6, 2.4);
  ctx.restore();
}

export function drawGeoRock(ctx, x, y, hp, flash) {
  ctx.save();
  ctx.translate(x, y);
  const s = 0.6 + hp * 0.1;
  ctx.scale(s, s);
  ctx.fillStyle = flash ? '#fff' : '#2c2733';
  ctx.beginPath();
  ctx.moveTo(-16, 0); ctx.lineTo(-13, -14); ctx.lineTo(-3, -22); ctx.lineTo(10, -18); ctx.lineTo(16, -6); ctx.lineTo(15, 0);
  ctx.fill();
  ctx.fillStyle = '#f5c542';
  for (const [gx, gy] of [[-8, -10], [3, -15], [8, -7], [-2, -5]]) {
    ctx.beginPath(); ctx.arc(gx, gy, 2.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawGeo(ctx, x, y, t) {
  const w = Math.abs(Math.cos(t * 0.15)) * 4 + 1;
  ctx.fillStyle = '#b8862b';
  ellipse(ctx, x, y, w + 0.8, 5);
  ctx.fillStyle = '#f5c542';
  ellipse(ctx, x, y, w, 4.2);
}

export function drawShade(ctx, x, y, t) {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 0.05) * 4 - 10);
  ctx.globalAlpha *= 0.85;
  ctx.fillStyle = '#07060b';
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.quadraticCurveTo(-12, -26, 0, -30);
  ctx.quadraticCurveTo(12, -26, 10, 0);
  for (let i = 0; i < 4; i++) ctx.lineTo(7 - i * 5, 5 + ((i + Math.floor(t / 6)) % 2) * 3);
  ctx.fill();
  ctx.fillStyle = '#e8e8f0';
  ellipse(ctx, -3.5, -18, 2, 3.2); ellipse(ctx, 3.5, -18, 2, 3.2);
  ctx.restore();
}
