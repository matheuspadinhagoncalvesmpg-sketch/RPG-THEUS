// Os Soberanos: reis e rainhas de Alvorada, presos pelo Regente e libertados ao serem derrotados.
// Ver docs/historia/10-revisao-reis-e-reinos.md §2. Cada um reaproveita o corpo de um chefe existente
// (voo, investida, golem...) com nome, visual e um ataque próprio.
import { TILE } from './config.js';
import { Projectile } from './enemies.js';
import { rand, clamp } from './util.js';
import { MossKnight } from './bosses.js';
import { BesouroRei, GolemRachado, VespaRainha } from './minibosses.js';

// ── Visual comum: um soberano espectral, com a coroa do seu reino e as correntes do Regente.
function drawSoberano(ctx, e, o) {
  const c = (x) => e.col(x);
  const bob = Math.sin(e.t * 0.06) * 2;
  ctx.save();
  ctx.translate(e.cx, e.cy + (o.chao ? e.h / 2 : 0));
  ctx.scale(e.facing, 1);
  if (o.chao) ctx.translate(0, -e.h / 2 + bob * 0.3);
  const sc = o.escala || 1;
  ctx.scale(sc, sc);
  // correntes para o alto (a Roda)
  ctx.strokeStyle = 'rgba(255,214,120,0.55)'; ctx.lineWidth = 1.4;
  for (const dx of [-8, 8]) { ctx.beginPath(); ctx.moveTo(dx, -22 + bob); ctx.lineTo(dx * 1.8, -80); ctx.stroke(); }
  // manto
  ctx.globalAlpha *= 0.92;
  const g = ctx.createLinearGradient(0, -24, 0, 26);
  g.addColorStop(0, c(o.cor)); g.addColorStop(1, 'rgba(20,16,32,0.2)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-14, -18 + bob); ctx.quadraticCurveTo(-24, 8, -18, 26 + bob);
  for (let i = 0; i < 5; i++) ctx.lineTo(-18 + (i + 1) * 7.2, 26 + bob + (i % 2 ? -5 : 3));
  ctx.quadraticCurveTo(24, 8, 14, -18 + bob);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha /= 0.92;
  // cabeça
  ctx.fillStyle = c('#e8e2d4');
  ctx.beginPath(); ctx.arc(0, -26 + bob, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#10101c';
  ctx.beginPath(); ctx.ellipse(-4, -27 + bob, 2.3, 3.4, 0, 0, Math.PI * 2); ctx.ellipse(4, -27 + bob, 2.3, 3.4, 0, 0, Math.PI * 2); ctx.fill();
  if (!e.flash) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = e.phase2 ? 'rgba(255,106,74,0.9)' : o.olho || 'rgba(255,230,150,0.9)';
    ctx.beginPath(); ctx.arc(-4, -27 + bob, 1.3, 0, Math.PI * 2); ctx.arc(4, -27 + bob, 1.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // coroa do reino
  ctx.fillStyle = c(o.ouro || '#ffd36e');
  const cy = -37 + bob;
  if (o.coroa === 'raios') for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 3.4 - 1.4, cy); ctx.lineTo(i * 3.4, cy - 8 - (3 - Math.abs(i)) * 1.6); ctx.lineTo(i * 3.4 + 1.4, cy); ctx.fill(); }
  else if (o.coroa === 'livro') { ctx.fillRect(-9, cy - 4, 18, 5); ctx.fillStyle = c('#7a1f2b'); ctx.fillRect(-7, cy - 8, 14, 5); }
  else if (o.coroa === 'elmo') { ctx.beginPath(); ctx.arc(0, cy + 3, 11, Math.PI, 0); ctx.fill(); ctx.fillStyle = c('#b8433f'); ctx.fillRect(-1.5, cy - 12, 3, 10); }
  else if (o.coroa === 'espelhos') for (let i = -2; i <= 2; i++) { ctx.fillStyle = c(i % 2 ? '#e8f4ff' : '#bfe9ff'); ctx.beginPath(); ctx.moveTo(i * 4.2, cy); ctx.lineTo(i * 4.2 - 2, cy - 7); ctx.lineTo(i * 4.2 + 2, cy - 9); ctx.fill(); }
  else if (o.coroa === 'olho') { ctx.beginPath(); ctx.arc(0, cy - 2, 6, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#10101c'; ctx.beginPath(); ctx.ellipse(0, cy - 3, 3.4, 2, 0, 0, Math.PI * 2); ctx.fill(); }
  else { ctx.fillRect(-9, cy - 2, 18, 4); for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(dx - 2, cy - 2); ctx.lineTo(dx, cy - 9); ctx.lineTo(dx + 2, cy - 2); ctx.fill(); } }
  // objeto na mão
  ctx.strokeStyle = c('#d8c9a0'); ctx.lineWidth = 2; ctx.lineCap = 'round';
  if (o.item === 'harpa') { ctx.beginPath(); ctx.arc(16, -8, 9, -1.4, 1.4); ctx.moveTo(16, -17); ctx.lineTo(16, 1); ctx.stroke(); }
  else if (o.item === 'livro') { ctx.fillStyle = c('#7a1f2b'); ctx.fillRect(10, -14, 12, 14); ctx.fillStyle = '#e9dcc0'; ctx.fillRect(12, -12, 8, 10); }
  else if (o.item === 'lanca') { ctx.beginPath(); ctx.moveTo(14, 20); ctx.lineTo(18, -44); ctx.stroke(); ctx.fillStyle = c('#e8eef7'); ctx.beginPath(); ctx.moveTo(18, -54); ctx.lineTo(14, -42); ctx.lineTo(22, -42); ctx.fill(); }
  else if (o.item === 'espelho') { ctx.fillStyle = c('#bfe9ff'); ctx.beginPath(); ctx.ellipse(18, -10, 7, 10, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = c('#ffd36e'); ctx.stroke(); }
  else if (o.item === 'luneta') { ctx.strokeStyle = c('#c9a64e'); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(28, -18); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(14, 16); ctx.lineTo(26, -22); ctx.stroke(); ctx.fillStyle = c('#e8eef7'); ctx.beginPath(); ctx.moveTo(26, -34); ctx.lineTo(23, -20); ctx.lineTo(29, -22); ctx.fill(); }
  ctx.restore();
}

// Colunas de luz anunciadas no chão: o aviso dura `aviso` quadros e depois machuca por 18.
function colunas(game, boss, xs, aviso = 44) {
  boss.colunas = (boss.colunas || []).concat(xs.map((x) => ({ x, t: 0, aviso })));
}
function atualizarColunas(game, boss) {
  if (!boss.colunas || !boss.colunas.length) return;
  const room = game.room;
  for (const c of boss.colunas) {
    c.t++;
    if (c.t < c.aviso) { if (c.t % 3 === 0) game.particles.add({ x: c.x + rand(-8, 8), y: rand(40, room.pxH - 40), vy: 0.4, life: 16, size: 2, color: '#fff2b0', glow: true }); }
    else if (c.t < c.aviso + 18) game.hostileBox({ x: c.x - 14, y: 0, w: 28, h: room.pxH });
  }
  boss.colunas = boss.colunas.filter((c) => c.t < c.aviso + 18);
}
function desenharColunas(ctx, boss, room) {
  for (const c of boss.colunas || []) {
    const live = c.t >= c.aviso;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = live ? 'rgba(255,240,170,0.7)' : `rgba(255,230,150,${0.08 + (c.t / c.aviso) * 0.22})`;
    ctx.fillRect(c.x - (live ? 14 : 5), 0, live ? 28 : 10, room.pxH);
    ctx.restore();
  }
}

function pronto(boss) { return boss.state !== 'intro' && !boss.dead; }

// ───────────── DALVA, a Cantora do Amanhecer ─────────────
export class Dalva extends VespaRainha {
  constructor(x, y) {
    super(x, y);
    this.key = 'sob_dalva'; this.title = 'Dalva, a Cantora do Amanhecer'; this.subtitle = 'III Soberana de Alvorada';
    this.hp = this.maxHp = 30; this.geo = 110; this.bloodColor = '#ffe9a8';
    this.ring = 150; this.canto = 330;
  }
  update(game) {
    super.update(game);
    this.rm = game.room;
    if (!pronto(this)) return;
    atualizarColunas(game, this);
    if (--this.ring <= 0) {
      const n = this.phase2 ? 10 : 7, off = rand(0, 6.28);
      for (let i = 0; i < n; i++) { const a = off + (i / n) * 6.28; game.spawnProjectile(new Projectile(this.cx, this.cy, Math.cos(a) * 2.3, Math.sin(a) * 2.3, { kind: 'orb', r: 6, life: 150 })); }
      game.audio.play('orb'); this.ring = this.phase2 ? 120 : 180;
    }
    if (--this.canto <= 0) { const px = game.player.cx; colunas(game, this, [px - 90, px, px + 90]); this.canto = this.phase2 ? 220 : 320; game.audio.play('tele'); }
  }
  draw(ctx) { drawSoberano(ctx, this, { cor: '#f6d98a', coroa: 'raios', item: 'harpa', olho: 'rgba(255,214,120,0.95)' }); if (this.rm) desenharColunas(ctx, this, this.rm); }
}

// ───────────── RÚBEN, o Escrivão do Dízimo ─────────────
export class Ruben extends GolemRachado {
  constructor(x, y) {
    super(x, y);
    this.key = 'sob_ruben'; this.title = 'Rúben, o Escrivão do Dízimo'; this.subtitle = 'VI Soberano de Alvorada';
    this.hp = this.maxHp = 38; this.geo = 120; this.bloodColor = '#e0b873';
    this.moedas = 130;
  }
  update(game) {
    super.update(game);
    if (!pronto(this)) return;
    if (--this.moedas <= 0) {
      const p = game.player;
      for (let i = -2; i <= 2; i++) game.spawnProjectile(new Projectile(p.cx + i * 46 + rand(-12, 12), 2 * TILE, 0, rand(1, 2.2), { kind: 'orb', r: 6, grav: 0.18, life: 200 }));
      game.audio.play('shock');
      this.moedas = this.phase2 ? 100 : 160;
    }
  }
  draw(ctx) { drawSoberano(ctx, this, { cor: '#9a6a3a', coroa: 'livro', item: 'livro', chao: true, olho: 'rgba(255,200,100,0.95)' }); }
}

// ───────────── LÍDIA, a Capitã da Guarda ─────────────
export class Lidia extends BesouroRei {
  constructor(x, y) {
    super(x, y);
    this.key = 'sob_lidia'; this.title = 'Lídia, a Capitã da Guarda'; this.subtitle = 'VII Soberana de Alvorada';
    this.hp = this.maxHp = 36; this.geo = 120; this.bloodColor = '#ffb0a0';
    this.lanca = 170;
  }
  update(game) {
    super.update(game);
    if (!pronto(this)) return;
    if (--this.lanca <= 0 && Math.abs(game.player.cx - this.cx) > 160) {
      const dir = Math.sign(game.player.cx - this.cx) || 1;
      game.spawnProjectile(new Projectile(this.cx + dir * 20, this.cy - 6, dir * 7.5, 0, { kind: 'arrow', r: 6, life: 120 }));
      game.audio.play('spit');
      this.lanca = this.phase2 ? 110 : 170;
    }
  }
  draw(ctx) { drawSoberano(ctx, this, { cor: '#8a2f3a', coroa: 'elmo', item: 'lanca', chao: true, escala: 1.15, olho: 'rgba(255,150,120,0.95)' }); }
}

// ───────────── MARTA, a que Não Envelhecia ─────────────
export class Marta extends VespaRainha {
  constructor(x, y) {
    super(x, y);
    this.key = 'sob_marta'; this.title = 'Marta, a que Não Envelhecia'; this.subtitle = 'IX Soberana de Alvorada';
    this.hp = this.maxHp = 32; this.geo = 120; this.bloodColor = '#bfe9ff';
    this.piscar = 160;
  }
  update(game) {
    super.update(game);
    if (!pronto(this) || this.state === 'dive' || this.state === 'diveWind') return;
    if (--this.piscar <= 0) {
      // teleporta para perto do herói e deixa um reflexo que atira
      const p = game.player, room = game.room;
      const nx = clamp(p.cx + (Math.random() < 0.5 ? -1 : 1) * rand(120, 200), 3 * TILE, room.pxW - 3 * TILE);
      game.particles.burst(this.cx, this.cy, 14, { color: ['#e8f4ff', '#bfe9ff'], speed: 4, life: 24, glow: true });
      this.x = nx - this.w / 2;
      game.particles.burst(this.cx, this.cy, 14, { color: ['#e8f4ff', '#bfe9ff'], speed: 4, life: 24, glow: true });
      game.audio.play('tele');
      for (const a of [-0.35, 0, 0.35]) { const b = Math.atan2(p.cy - this.cy, p.cx - this.cx) + a; game.spawnProjectile(new Projectile(this.cx, this.cy, Math.cos(b) * 4, Math.sin(b) * 4, { kind: 'shard', r: 5, life: 130 })); }
      this.piscar = this.phase2 ? 100 : 160;
    }
  }
  draw(ctx) {
    ctx.save(); ctx.globalAlpha *= 0.28;
    for (const dx of [-46, 46]) { ctx.save(); ctx.translate(dx, 0); drawSoberano(ctx, this, { cor: '#bfe9ff', coroa: 'espelhos', item: 'espelho' }); ctx.restore(); }
    ctx.restore();
    drawSoberano(ctx, this, { cor: '#bfe9ff', coroa: 'espelhos', item: 'espelho', olho: 'rgba(200,240,255,0.95)' });
  }
}

// ───────────── SIBILA, a Última Vigia ─────────────
export class Sibila extends VespaRainha {
  constructor(x, y) {
    super(x, y);
    this.key = 'sob_sibila'; this.title = 'Sibila, a Última Vigia'; this.subtitle = 'XI Soberana de Alvorada';
    this.hp = this.maxHp = 34; this.geo = 130; this.bloodColor = '#fff2b0';
    this.luz = 180;
  }
  update(game) {
    super.update(game);
    this.rm = game.room;
    if (!pronto(this)) return;
    atualizarColunas(game, this);
    if (--this.luz <= 0) {
      const room = game.room, p = game.player;
      const n = this.phase2 ? 4 : 3;
      colunas(game, this, Array.from({ length: n }, (_, i) => clamp(p.cx + (i - (n - 1) / 2) * 110 + rand(-24, 24), 2 * TILE, room.pxW - 2 * TILE)), 50);
      game.audio.play('tele');
      this.luz = this.phase2 ? 170 : 240;
    }
  }
  draw(ctx) { drawSoberano(ctx, this, { cor: '#f4eec8', coroa: 'olho', item: 'luneta', olho: 'rgba(255,255,200,0.95)' }); if (this.rm) desenharColunas(ctx, this, this.rm); }
}

// ───────────── ELIAR, o Rei Verdadeiro ─────────────
export class Eliar extends MossKnight {
  constructor(x, y) {
    super(x, y);
    this.key = 'sob_eliar'; this.title = 'Eliar, o Rei Verdadeiro'; this.subtitle = 'XII Soberano de Alvorada';
    this.hp = this.maxHp = 40; this.geo = 160; this.bloodColor = '#fff2d0';
  }
  draw(ctx) { drawSoberano(ctx, this, { cor: '#e8e2d4', coroa: 'ruptura', item: 'espada', chao: true, escala: 1.25, ouro: '#bfb7a0', olho: 'rgba(255,240,200,0.95)' }); }
}

export const SOBERANOS = { sob_dalva: Dalva, sob_ruben: Ruben, sob_lidia: Lidia, sob_marta: Marta, sob_sibila: Sibila, sob_eliar: Eliar };
