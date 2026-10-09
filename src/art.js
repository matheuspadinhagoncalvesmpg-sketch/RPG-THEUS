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

// Espada desenhada ao longo do eixo +x (cabo na origem). level 2 = lâmina afiada.
const BLADES = {
  steel: ['#eef1f6', '#8e98ab', '#ff4a5a'],
  ore: ['#ffd9a0', '#b8742f', '#ffcf4a'],
  crystal: ['#e9fbff', '#5fc9e0', '#7ef0ff'],
};

// style: 'steel' | 'ore' | 'crystal'; glow = lâmina afiada (brilho no gume).
export function drawSword(ctx, len, style = 'steel', flash = false, glow = false) {
  if (typeof style === 'number') { glow = style > 1; style = 'steel'; }
  const [bl, bd, gem] = BLADES[style] || BLADES.steel;
  const level = glow || style === 'crystal' ? 2 : 1;
  const steel = flash ? '#ffffff' : bl;
  const steelDark = flash ? '#ffffff' : bd;
  // empunhadura de couro
  ctx.fillStyle = '#3b2617';
  ctx.fillRect(-7, -1.7, 7, 3.4);
  ctx.fillStyle = '#7a4f2a';
  for (let i = -6; i < 0; i += 2) ctx.fillRect(i, -1.7, 1, 3.4);
  // pomo com gema
  ctx.fillStyle = '#c9932f';
  ellipse(ctx, -8.2, 0, 2.6, 2.6);
  ctx.fillStyle = gem;
  ellipse(ctx, -8.2, 0, 1.3, 1.3);
  // guarda
  ctx.fillStyle = '#e0ad45';
  ctx.beginPath();
  ctx.moveTo(-0.5, -6); ctx.lineTo(2.2, -5); ctx.lineTo(2.2, 5); ctx.lineTo(-0.5, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#9c6f1f';
  ctx.fillRect(0.6, -5.2, 0.9, 10.4);
  // lâmina com gume claro e sombra
  const g = ctx.createLinearGradient(0, -2.6, 0, 2.6);
  g.addColorStop(0, steel);
  g.addColorStop(0.5, steel);
  g.addColorStop(0.51, steelDark);
  g.addColorStop(1, steelDark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(2.2, -2.6);
  ctx.lineTo(len - 6, -2.6);
  ctx.lineTo(len, 0);
  ctx.lineTo(len - 6, 2.6);
  ctx.lineTo(2.2, 2.6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = flash ? '#fff' : 'rgba(40,46,60,0.55)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(4, 0); ctx.lineTo(len - 8, 0);
  ctx.stroke();
  if (level > 1 && !flash) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = style === 'ore' ? 'rgba(255,200,110,0.5)' : 'rgba(126,240,255,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(3, -2.6); ctx.lineTo(len - 6, -2.6); ctx.lineTo(len, 0);
    ctx.stroke();
    ctx.restore();
  }
}

// Ângulo da espada (radianos, 0 = para frente) ao longo do golpe.
function swingAngle(dir, k) {
  const e = 1 - Math.pow(1 - k, 3);
  if (dir === 'up') return 0.5 + (-3.1 - 0.5) * e;
  if (dir === 'down') return -0.5 + (2.9 + 0.5) * e;
  return -2.1 + (1.0 + 2.1) * e;
}

// Herói. (x, y) = centro dos pés.
export function drawHero(ctx, x, y, o) {
  const p = o.profile;
  const t = o.t || 0;
  const flash = o.flash > 0;
  const col = (c) => (flash ? '#ffffff' : c);
  const sw0 = o.sword || { len: 27, style: 'steel', glow: (o.swordLevel || 1) > 1 };
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(o.facing || 1, 1);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;

  let bob = 0, lean = 0, legA = 0, legB = 0, wind = 0, crouch = 0, armSwing = 0;
  switch (o.state) {
    case 'run': {
      const ph = t * 0.32;
      legA = Math.sin(ph) * 4.5; legB = -legA;
      bob = -Math.abs(Math.sin(ph)) * 1.4;
      lean = 0.07; wind = 4; armSwing = Math.sin(ph) * 0.6;
      break;
    }
    case 'jump': legA = -3; legB = 1; wind = 2; armSwing = -0.8; break;
    case 'fall': legA = 1; legB = -2; wind = -3; armSwing = -1.2; break;
    case 'dash': lean = 0.3; wind = 9; legA = -4; legB = 4; armSwing = 1; break;
    case 'wall': legA = 2; legB = -2; wind = 1; armSwing = -1.6; break;
    case 'focus': crouch = 3; bob = Math.sin(t * 0.5) * 0.4; armSwing = -0.4; break;
    case 'sit': crouch = 7; break;
    case 'hurt': lean = -0.25; wind = 3; break;
    default: bob = Math.sin(t * 0.06) * 0.7; wind = Math.sin(t * 0.05) * 1.5;
  }
  ctx.rotate(lean);
  if (o.squash) ctx.scale(1 + o.squash * 0.16, 1 - o.squash * 0.16);
  const by = bob + crouch;
  const tunic = col(p.cloak);
  const tunicDark = col(shade(p.cloak, -0.38));
  const scarf = col(shade(p.cloak, 0.45));
  const skin = col(p.skin);
  const attacking = o.attack;

  // Cachecol esvoaçante (atrás de tudo)
  const sw = Math.sin(t * 0.18) * 2;
  ctx.fillStyle = scarf;
  ctx.beginPath();
  ctx.moveTo(-2, -21 + by);
  ctx.quadraticCurveTo(-10 - wind, -22 + by + sw, -15 - wind * 1.3, -17 + by + sw * 1.5 - wind * 0.3);
  ctx.lineTo(-13 - wind * 1.2, -14 + by + sw - wind * 0.2);
  ctx.quadraticCurveTo(-8 - wind * 0.6, -17 + by, -1, -18 + by);
  ctx.fill();

  // Espada embainhada nas costas
  if (!attacking && o.state !== 'sit') {
    ctx.save();
    ctx.translate(-3, -24 + by);
    ctx.rotate(Math.PI * 0.62);
    ctx.scale(0.85, 0.85);
    drawSword(ctx, sw0.len - 3, sw0.style, flash, sw0.glow);
    ctx.restore();
  }

  // Braço de trás
  ctx.strokeStyle = tunicDark;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2, -18 + by);
  ctx.lineTo(-4 - Math.sin(armSwing) * 4, -11 + by + Math.cos(armSwing) * 0.5);
  ctx.stroke();

  // Pernas e botas
  const leg = (lx, off) => {
    if (o.state === 'sit') {
      ctx.fillStyle = col('#2a2230'); ctx.fillRect(lx - 1, -6, 7, 3);
      ctx.fillStyle = col('#5a3a24'); ctx.fillRect(lx + 4, -6, 3, 6);
      return;
    }
    ctx.fillStyle = col('#2a2230');
    ctx.fillRect(lx + off * 0.5, -9 + crouch, 3.2, 6 - crouch * 0.5);
    ctx.fillStyle = col('#5a3a24');
    ctx.fillRect(lx + off * 0.6 - 0.5, -3.5, 4.4, 3.5);
    ctx.fillStyle = col('#7a5232');
    ctx.fillRect(lx + off * 0.6 - 0.5, -3.5, 4.4, 1);
  };
  leg(-4, legA);
  leg(1, legB);

  // Túnica com barra e cinto
  ctx.fillStyle = tunic;
  ctx.beginPath();
  ctx.moveTo(-5, -20 + by);
  ctx.lineTo(5, -20 + by);
  ctx.lineTo(7 + wind * 0.15, -7 + crouch * 0.5);
  ctx.lineTo(-7 - wind * 0.3, -7 + crouch * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = tunicDark;
  ctx.beginPath();
  ctx.moveTo(-5, -20 + by); ctx.lineTo(-2, -20 + by); ctx.lineTo(-3, -7 + crouch * 0.5); ctx.lineTo(-7 - wind * 0.3, -7 + crouch * 0.5);
  ctx.fill();
  ctx.fillStyle = col('#4a2f1c');
  ctx.fillRect(-6, -12 + by * 0.6, 12.5, 2.4);
  ctx.fillStyle = col('#e0ad45');
  ctx.fillRect(0.5, -12.4 + by * 0.6, 3, 3.2);

  // Armadura (peitoral e ombreira)
  if (o.armor && o.armor.color) {
    ctx.fillStyle = col(o.armor.color);
    ctx.beginPath();
    ctx.moveTo(-5, -19.5 + by); ctx.lineTo(5, -19.5 + by); ctx.lineTo(5.6, -12.6 + by * 0.6); ctx.lineTo(-5.6, -12.6 + by * 0.6);
    ctx.fill();
    ctx.fillStyle = col(o.armor.trim);
    ctx.fillRect(-5, -19.5 + by, 10, 1.4);
    ctx.fillRect(-0.6, -18 + by, 1.2, 5);
    ellipse(ctx, 2.4, -18.6 + by, 3.4, 2.2);
  }

  // Cabeça com máscara de marfim: olhos acesos e marcas do ocaso (esq.) e da aurora (dir.)
  const hy = -27 + by;
  // ao virar, a cabeça gira (achata no eixo x por alguns quadros)
  ctx.save();
  if (o.turn) { ctx.translate(1, hy); ctx.scale(1 - o.turn * 0.55, 1); ctx.translate(-1, -hy); }
  const [eFar, eNear] = EYE_COLORS[p.eyes] || EYE_COLORS.hetero;
  ctx.fillStyle = col('#1a1320');
  ellipse(ctx, 0.6, hy, 7.4, 7.3);
  const ivory = col('#f3eee4'), ivoryDark = col('#cfc6b6');
  ctx.fillStyle = ivory;
  ctx.beginPath();
  ctx.moveTo(-5.6, hy - 3.5);
  ctx.quadraticCurveTo(0.5, hy - 8.6, 7.6, hy - 3);
  ctx.lineTo(7.9, hy + 2);
  ctx.quadraticCurveTo(6.8, hy + 7.6, 2.4, hy + 8.8);
  ctx.quadraticCurveTo(-3.8, hy + 7.4, -5.8, hy + 1.2);
  ctx.closePath();
  ctx.fill();
  // sombra suave na parte de baixo da máscara
  ctx.fillStyle = ivoryDark;
  ctx.beginPath();
  ctx.moveTo(-5.4, hy + 3);
  ctx.quadraticCurveTo(0, hy + 6, 7.4, hy + 3.5);
  ctx.quadraticCurveTo(6.6, hy + 7.6, 2.4, hy + 8.8);
  ctx.quadraticCurveTo(-3.8, hy + 7.4, -5.4, hy + 3);
  ctx.fill();
  if (o.state !== 'dead') {
    const blink = t % 220 < 6 && o.state === 'idle';
    for (const [ex, ec] of [[1.4, eFar], [5.4, eNear]]) {
      // marca pintada sob o olho
      ctx.fillStyle = col(ec);
      ctx.beginPath();
      ctx.moveTo(ex - 0.5, hy + 2.4); ctx.lineTo(ex + 0.5, hy + 2.4); ctx.lineTo(ex + 0.1, hy + 5.6);
      ctx.fill();
      // fenda do olho
      ctx.fillStyle = '#120d18';
      ctx.beginPath();
      ctx.ellipse(ex, hy + 0.2, 1.9, blink ? 0.35 : 1.5, -0.12, 0, Math.PI * 2);
      ctx.fill();
      if (!blink && !flash) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rgba(ec, 0.22);
        ellipse(ctx, ex + 0.3, hy + 0.3, 2.1, 1.8);
        ctx.fillStyle = ec;
        ellipse(ctx, ex + 0.4, hy + 0.3, 0.95, 0.95);
        ctx.restore();
      }
    }
    // pequena rachadura
    ctx.strokeStyle = col('#a89f90');
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(4.2, hy + 8.5); ctx.lineTo(4.8, hy + 6.9); ctx.lineTo(4.2, hy + 5.9); ctx.stroke();
  }

  // Cabelo: franja, topo e mecha de trás
  ctx.fillStyle = col(p.hair);
  ctx.beginPath();
  ctx.moveTo(7.6, hy - 1.5);
  ctx.quadraticCurveTo(8, hy - 8.5, 1, hy - 8.4);
  ctx.quadraticCurveTo(-6, hy - 8.4, -7.2, hy - 1);
  ctx.lineTo(-10 - wind * 0.4, hy + 3 + Math.sin(t * 0.15) * 0.6);
  ctx.lineTo(-6, hy + 2);
  ctx.lineTo(-5.4, hy + 6);
  ctx.lineTo(-3.4, hy - 1);
  ctx.quadraticCurveTo(0, hy - 5, 3, hy - 4);
  ctx.lineTo(4, hy - 1.6);
  ctx.lineTo(5.4, hy - 4.2);
  ctx.lineTo(7.6, hy - 1.5);
  ctx.fill();
  ctx.fillStyle = col(shade(p.hair, 0.35));
  ctx.fillRect(-2, hy - 7.4, 5, 1.1);

  ctx.restore();

  // Braço da frente + espada
  ctx.strokeStyle = tunic;
  ctx.lineWidth = 3.4;
  const sx = 2, sy = -18 + by;
  if (attacking) {
    const a = swingAngle(attacking.dir, attacking.k);
    const hx = sx + Math.cos(a) * 7, hyy = sy + Math.sin(a) * 7;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hyy); ctx.stroke();
    ctx.fillStyle = skin;
    ellipse(ctx, hx, hyy, 1.6, 1.6);
    ctx.save();
    ctx.translate(hx, hyy);
    ctx.rotate(a);
    drawSword(ctx, sw0.len, sw0.style, flash, sw0.glow);
    ctx.restore();
  } else {
    const hx = sx + 2 + Math.sin(-armSwing) * 3, hyy = sy + 7;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hyy); ctx.stroke();
    ctx.fillStyle = skin;
    ellipse(ctx, hx, hyy + 0.5, 1.5, 1.5);
  }
  ctx.restore();
}

// Rastro do golpe: arco de luz que acompanha a lâmina.
export function drawSlash(ctx, x, y, dir, facing, k, level = 1, style = 'steel') {
  const e = 1 - Math.pow(1 - k, 3);
  const a1 = swingAngle(dir, Math.max(0, e - 0.35)), a2 = swingAngle(dir, e);
  const lo = Math.min(a1, a2), hi = Math.max(a1, a2);
  if (hi - lo < 0.05) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.globalCompositeOperation = 'lighter';
  const alpha = (1 - k) * 0.85;
  const c = style === 'ore' ? '255,205,130' : style === 'crystal' || level > 1 ? '126,240,255' : '235,240,255';
  ctx.fillStyle = `rgba(${c},${alpha * 0.55})`;
  ctx.beginPath();
  ctx.arc(0, 0, level > 1 ? 40 : 37, lo, hi);
  ctx.arc(0, 0, 14, hi, lo, true);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${c},${alpha})`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, level > 1 ? 40 : 37, lo, hi);
  ctx.stroke();
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
  } else if (kind === 'smith') {
    // Tibério, o ferreiro: avental de couro, barba e martelo
    ctx.fillStyle = '#5a3a24';
    ctx.fillRect(-8, -24 + b, 16, 18);
    ctx.fillStyle = '#7a4f2a';
    ctx.fillRect(-6, -20 + b, 12, 16);
    ctx.fillStyle = '#2a2230'; ctx.fillRect(-7, -6, 5, 6); ctx.fillRect(2, -6, 5, 6);
    ctx.fillStyle = '#d9a37a';
    ellipse(ctx, 0, -30 + b, 7, 6.5);
    ctx.fillStyle = '#8a4a2a';
    ctx.beginPath(); ctx.moveTo(-6, -29 + b); ctx.quadraticCurveTo(0, -14 + b, 6, -29 + b); ctx.fill();
    ctx.fillStyle = '#14121c'; ctx.fillRect(1, -32 + b, 2, 2); ctx.fillRect(-4, -32 + b, 2, 2);
    ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(13, -24 + b); ctx.stroke();
    ctx.fillStyle = '#7c8291'; ctx.fillRect(9, -28 + b, 9, 6);
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

// Fogueira: ponto de descanso (salva o jogo). (x, y) = chão.
export function drawCampfire(ctx, x, y, t, lit = true) {
  ctx.save();
  ctx.translate(x, y);
  if (lit) {
    const g = ctx.createRadialGradient(0, -10, 2, 0, -10, 80);
    g.addColorStop(0, 'rgba(255,170,80,0.35)');
    g.addColorStop(1, 'rgba(255,140,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-80, -90, 160, 100);
  }
  // pedras em volta
  ctx.fillStyle = '#4a4552';
  for (const [sx, r] of [[-13, 4], [-6, 3.5], [6, 3.5], [13, 4]]) ellipse(ctx, sx, -2, r, r * 0.8);
  // lenha cruzada
  ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-11, -2); ctx.lineTo(9, -8); ctx.moveTo(11, -2); ctx.lineTo(-9, -8); ctx.stroke();
  ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-10, -3); ctx.lineTo(8, -8.5); ctx.stroke();
  if (lit) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const h = 16 + Math.sin(t * 0.21 + i * 2) * 4 - i * 3;
      const w = 7 - i * 1.6;
      ctx.fillStyle = ['rgba(255,120,40,0.9)', 'rgba(255,190,70,0.9)', 'rgba(255,245,200,0.95)'][i];
      ctx.beginPath();
      ctx.moveTo(-w, -6);
      ctx.quadraticCurveTo(-w * 0.8 + Math.sin(t * 0.3 + i) * 2, -6 - h * 0.6, Math.sin(t * 0.25 + i) * 2, -6 - h);
      ctx.quadraticCurveTo(w * 0.8 + Math.sin(t * 0.33 + i) * 2, -6 - h * 0.6, w, -6);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Lápide que guarda as moedas perdidas ao morrer.
export function drawTombstone(ctx, x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  const g = ctx.createRadialGradient(0, -14, 2, 0, -14, 34);
  g.addColorStop(0, `rgba(255,214,120,${0.25 + Math.sin(t * 0.08) * 0.1})`);
  g.addColorStop(1, 'rgba(255,214,120,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-34, -48, 68, 50);
  ctx.fillStyle = '#5c5868';
  ctx.beginPath();
  ctx.moveTo(-9, 0); ctx.lineTo(-9, -16); ctx.quadraticCurveTo(-9, -26, 0, -26); ctx.quadraticCurveTo(9, -26, 9, -16); ctx.lineTo(9, 0);
  ctx.fill();
  ctx.fillStyle = '#8a8598';
  ctx.fillRect(-1.5, -22, 3, 13); ctx.fillRect(-5, -18, 10, 3);
  ctx.fillStyle = '#f5c542';
  ellipse(ctx, -11, -2, 3, 2); ellipse(ctx, 11, -2, 3, 2); ellipse(ctx, 13, -5, 2.5, 1.8);
  ctx.restore();
}

// Cristal de vida (+1 coração).
export function drawLifeCrystal(ctx, x, y, t) {
  const fl = Math.sin(t * 0.06) * 3;
  ctx.save();
  ctx.translate(x, y + fl);
  const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 28);
  g.addColorStop(0, 'rgba(255,90,120,0.55)'); g.addColorStop(1, 'rgba(255,90,120,0)');
  ctx.fillStyle = g; ctx.fillRect(-28, -28, 56, 56);
  drawHeart(ctx, 0, 0, 1.3, '#ff4d6d');
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ellipse(ctx, -3.5, -4, 2, 1.4);
  ctx.restore();
}

export function drawHeart(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 7);
  ctx.bezierCurveTo(-9, 0, -8, -8, -3.5, -7.5);
  ctx.bezierCurveTo(-1.5, -7.3, 0, -5.5, 0, -4.5);
  ctx.bezierCurveTo(0, -5.5, 1.5, -7.3, 3.5, -7.5);
  ctx.bezierCurveTo(8, -8, 9, 0, 0, 7);
  ctx.fill();
  ctx.restore();
}

// ── Nós de recurso (golpeie para coletar) ──
export function drawResourceNode(ctx, kind, x, y, hp, flash, t) {
  ctx.save();
  ctx.translate(x, y);
  if (flash) ctx.translate(Math.sin(t * 2) * 1.5, 0);
  const c = (v) => (flash ? '#ffffff' : v);
  if (kind === 'wood') {
    // árvore com tronco e copa
    ctx.fillStyle = c('#4a3020');
    ctx.fillRect(-5, -44, 10, 44);
    ctx.fillStyle = c('#6b4630');
    ctx.fillRect(-5, -44, 3, 44);
    ctx.fillStyle = c('#3a2418');
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-5, -8); ctx.lineTo(5, -8); ctx.lineTo(9, 0); ctx.fill();
    const sway = Math.sin(t * 0.02) * 1.5;
    for (const [cx, cy, r, col] of [[-12, -52, 13, '#2f5a32'], [12, -54, 13, '#2f5a32'], [0, -66, 16, '#3c7040'], [-4, -50, 12, '#447a46'], [7, -60, 10, '#5a9256']]) {
      ctx.fillStyle = c(col);
      ellipse(ctx, cx + sway, cy, r, r * 0.9);
    }
  } else if (kind === 'stone') {
    ctx.fillStyle = c('#5b5866');
    ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-12, -13); ctx.lineTo(-2, -19); ctx.lineTo(10, -15); ctx.lineTo(15, -5); ctx.lineTo(14, 0); ctx.fill();
    ctx.fillStyle = c('#8a8698');
    ctx.beginPath(); ctx.moveTo(-10, -12); ctx.lineTo(-2, -17); ctx.lineTo(6, -14); ctx.lineTo(-3, -11); ctx.fill();
  } else if (kind === 'ore') {
    ctx.fillStyle = c('#3d3540');
    ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-13, -14); ctx.lineTo(-3, -21); ctx.lineTo(10, -17); ctx.lineTo(16, -6); ctx.lineTo(15, 0); ctx.fill();
    ctx.fillStyle = c('#e39a3a');
    for (const [ox, oy, r] of [[-7, -10, 2.6], [2, -15, 2.2], [8, -8, 2.8], [-1, -5, 1.8], [-10, -4, 1.6]]) {
      ctx.beginPath(); ctx.moveTo(ox - r, oy); ctx.lineTo(ox, oy - r); ctx.lineTo(ox + r, oy); ctx.lineTo(ox, oy + r); ctx.fill();
    }
  } else if (kind === 'crystal') {
    const glow = ctx.createRadialGradient(0, -12, 2, 0, -12, 30);
    glow.addColorStop(0, 'rgba(126,240,255,0.35)'); glow.addColorStop(1, 'rgba(126,240,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(-30, -42, 60, 44);
    for (const [cx, h, w, a] of [[-7, 18, 5, -0.25], [0, 28, 6, 0], [8, 20, 5, 0.3]]) {
      ctx.save();
      ctx.translate(cx, 0); ctx.rotate(a);
      ctx.fillStyle = c('#7ef0ff');
      ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(-w, -h + 6); ctx.lineTo(0, -h); ctx.lineTo(w, -h + 6); ctx.lineTo(w, 0); ctx.fill();
      ctx.fillStyle = c('#d6fbff');
      ctx.beginPath(); ctx.moveTo(-w + 1.5, -2); ctx.lineTo(-w + 1.5, -h + 6); ctx.lineTo(0, -h + 1); ctx.lineTo(0, -2); ctx.fill();
      ctx.restore();
    }
  }
  // rachaduras conforme o dano
  if (hp < 3 && kind !== 'wood') {
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-4, -16); ctx.lineTo(0, -9); ctx.lineTo(-3, -3);
    if (hp < 2) { ctx.moveTo(4, -14); ctx.lineTo(1, -8); }
    ctx.stroke();
  }
  ctx.restore();
}

// Ícone pequeno de recurso (moeda/pedaço que cai no chão).
export function drawResourceIcon(ctx, kind, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (kind === 'wood') {
    ctx.fillStyle = '#7a4f2a'; ctx.fillRect(-6, -3, 12, 6);
    ctx.fillStyle = '#c99a5e'; ellipse(ctx, 6, 0, 2, 3);
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(-6, -1, 10, 1);
  } else if (kind === 'stone') {
    ctx.fillStyle = '#8a8698';
    ctx.beginPath(); ctx.moveTo(-5, 3); ctx.lineTo(-4, -3); ctx.lineTo(2, -5); ctx.lineTo(6, 0); ctx.lineTo(4, 4); ctx.fill();
  } else if (kind === 'ore') {
    ctx.fillStyle = '#e39a3a';
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(0, -5); ctx.lineTo(5, 0); ctx.lineTo(0, 5); ctx.fill();
    ctx.fillStyle = '#ffd38a'; ctx.fillRect(-1.5, -2.5, 2, 2);
  } else if (kind === 'crystal') {
    ctx.fillStyle = '#7ef0ff';
    ctx.beginPath(); ctx.moveTo(-3, 5); ctx.lineTo(-3, -2); ctx.lineTo(0, -6); ctx.lineTo(3, -2); ctx.lineTo(3, 5); ctx.fill();
  }
  ctx.restore();
}

// ── Peças construíveis (decoração) ──
export function drawBuildDeco(ctx, kind, x, y, t, accent) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'torch') {
    const g = ctx.createRadialGradient(0, -22, 2, 0, -22, 60);
    g.addColorStop(0, 'rgba(255,190,90,0.35)'); g.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = g; ctx.fillRect(-60, -82, 120, 120);
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(-1.6, -20, 3.2, 20);
    ctx.fillStyle = '#c9932f'; ctx.fillRect(-2.6, -21, 5.2, 3);
    ctx.globalCompositeOperation = 'lighter';
    const h = 9 + Math.sin(t * 0.3) * 2;
    ctx.fillStyle = 'rgba(255,150,50,0.9)';
    ctx.beginPath(); ctx.moveTo(-3.5, -21); ctx.quadraticCurveTo(0, -21 - h * 1.4, 3.5, -21); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,190,0.95)';
    ctx.beginPath(); ctx.moveTo(-1.6, -21); ctx.quadraticCurveTo(0, -21 - h, 1.6, -21); ctx.fill();
  } else if (kind === 'banner') {
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(-1.5, -32, 3, 32);
    ctx.fillStyle = '#c9932f'; ellipse(ctx, 0, -33, 2.4, 2.4);
    const w = Math.sin(t * 0.06) * 1.5;
    ctx.fillStyle = accent || '#8f2f3a';
    ctx.beginPath(); ctx.moveTo(1.5, -30); ctx.lineTo(14 + w, -29); ctx.lineTo(13 + w, -13); ctx.lineTo(8 + w, -16); ctx.lineTo(2, -13); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,160,0.85)';
    ctx.beginPath(); ctx.arc(8 + w * 0.6, -23, 3, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'workbench') {
    ctx.fillStyle = '#5c3a20'; ctx.fillRect(-14, -12, 3, 12); ctx.fillRect(11, -12, 3, 12);
    ctx.fillStyle = '#8a5a32'; ctx.fillRect(-16, -15, 32, 4);
    ctx.fillStyle = '#c08a52'; ctx.fillRect(-16, -15, 32, 1.2);
    ctx.fillStyle = '#9aa0ad'; ctx.fillRect(-10, -19, 8, 3);
    ctx.fillStyle = '#5c3a20'; ctx.fillRect(-4, -18, 6, 1.6);
    ctx.fillStyle = '#c08a52'; ctx.fillRect(5, -18, 6, 3);
  } else if (kind === 'forge') {
    const g = ctx.createRadialGradient(0, -10, 2, 0, -10, 46);
    g.addColorStop(0, 'rgba(255,120,50,0.35)'); g.addColorStop(1, 'rgba(255,120,50,0)');
    ctx.fillStyle = g; ctx.fillRect(-46, -56, 92, 60);
    ctx.fillStyle = '#4a4654'; ctx.fillRect(-14, -20, 28, 20);
    ctx.fillStyle = '#6a6676'; ctx.fillRect(-14, -20, 28, 3);
    ctx.fillRect(-5, -32, 10, 12);
    ctx.fillStyle = '#1a0a08'; ctx.fillRect(-8, -13, 16, 9);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,${140 + Math.sin(t * 0.3) * 40},60,0.9)`;
    ctx.fillRect(-7, -10, 14, 6);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#2a2830';
    ctx.fillRect(16, -9, 10, 4); ctx.fillRect(19, -5, 4, 5);
  } else if (kind === 'chest') {
    ctx.fillStyle = '#5c3a20'; ctx.fillRect(-12, -16, 24, 16);
    ctx.fillStyle = '#7a4f2a'; ctx.fillRect(-12, -16, 24, 6);
    ctx.fillStyle = '#c9932f'; ctx.fillRect(-12, -11, 24, 2); ctx.fillRect(-2, -12, 4, 5);
    ctx.fillStyle = '#3a2414'; ctx.fillRect(-12, -1, 24, 1);
  }
  ctx.restore();
}
