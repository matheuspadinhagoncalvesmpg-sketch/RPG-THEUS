// Inimigos regionais: um tipo novo para cada região (Mariposa, Espinhudo, Atirador, Fantasma, Água-viva).
// Este módulo se registra em ENEMY_TYPES ao ser carregado.
import { TILE, T } from './config.js';
import { Enemy, ENEMY_TYPES, Projectile } from './enemies.js';
import { groundAhead, wallAhead } from './physics.js';
import { approach, clamp, rand, sign } from './util.js';

// ── Mariposa Lanterneira (Bosque): esvoaça devagar e solta uma nuvem de esporos
export class Mariposa extends Enemy {
  constructor(x, y) {
    super(x, y, { w: 24, h: 20, hp: 3, geo: 3 });
    this.gravity = false;
    this.home = { x: this.x, y: this.y - 10 };
    this.bloodColor = '#ffe9a8';
    this.cool = rand(80, 140);
  }
  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.knockback(game)) return;
    const p = game.player, d = this.dist(game);
    let tx, ty, max = 1.1 * game.ai.tactics.speed;
    if (d < 260 && !p.dead) {
      tx = p.cx + Math.sin(this.t * 0.04) * 70; ty = p.cy - 50 + Math.sin(this.t * 0.09) * 18;
      if (--this.cool <= 0 && d < 220) {
        for (const a of [-0.5, 0.5, 1.57, 2.6]) game.spawnProjectile(new Projectile(this.cx, this.cy, Math.cos(a) * 1.4, Math.sin(a) * 1.4 + 0.5, { kind: 'orb', r: 5, life: 110, grav: 0.01 }));
        this.cool = rand(130, 190) * game.ai.tactics.cooldown;
      }
    } else { tx = this.home.x + Math.sin(this.t * 0.02) * 40; ty = this.home.y + Math.sin(this.t * 0.06) * 14; max = 0.7; }
    const dx = tx - this.cx, dy = ty - this.cy, dd = Math.hypot(dx, dy) || 1;
    this.vx = approach(this.vx, (dx / dd) * max, 0.05);
    this.vy = approach(this.vy, (dy / dd) * max, 0.05);
    if (Math.abs(this.vx) > 0.15) this.dir = sign(this.vx);
    this.physics(game, { ignoreOneWay: true });
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.scale(this.dir, 1);
    const flap = Math.sin(this.t * 0.35);
    for (const s of [-1, 1]) {
      ctx.fillStyle = this.col(s < 0 ? '#e9d7a0' : '#f4e6b8');
      ctx.beginPath(); ctx.ellipse(s * 7, -4 - flap * 3, 9, 6 + flap * 1.5, s * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = this.col('#c98f4a');
      ctx.beginPath(); ctx.arc(s * 9, -4 - flap * 3, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = this.col('#5a4630');
    ctx.beginPath(); ctx.ellipse(0, 1, 3.6, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.col('#ffcf7a');
    ctx.beginPath(); ctx.arc(0, 7, 2.2, 0, Math.PI * 2); ctx.fill(); // lanterninha na cauda
    ctx.strokeStyle = this.col('#5a4630'); ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-1, -6); ctx.lineTo(-4, -11); ctx.moveTo(1, -6); ctx.lineTo(4, -11); ctx.stroke();
    ctx.restore();
  }
}

// ── Espinhudo (Campos e Cristal): rasteja e, de repente, vira uma bola de espinhos que rola
export class Espinhudo extends Enemy {
  constructor(x, y) {
    super(x, y, { w: 26, h: 20, hp: 4, geo: 3 });
    this.bloodColor = '#d9b27a';
    this.state = 'walk';
    this.timer = rand(70, 130);
  }
  hurt(game, dmg, kx, ky) {
    // Enrolado, os espinhos desviam o golpe: só vale acertar quando está andando.
    if (this.state === 'ball') { game.audio.play('clank'); game.particles.burst(this.cx, this.cy, 5, { type: 'spark', color: '#ffffff', speed: 4, life: 10 }); return; }
    super.hurt(game, dmg, kx, ky);
  }
  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.state !== 'ball' && this.knockback(game)) return;
    const p = game.player;
    if (this.state === 'walk') {
      this.vx = this.dir * 0.8 * game.ai.tactics.speed;
      if (this.onGround && (!groundAhead(this, game.room, game.world, this.dir) || wallAhead(this, game.room, game.world, this.dir, true))) this.dir *= -1;
      if (--this.timer <= 0 && this.dist(game) < 260 && !p.dead) { this.state = 'curl'; this.timer = 24; this.vx = 0; this.dir = this.toward(game); }
      else if (this.timer <= 0) this.timer = 40;
    } else if (this.state === 'curl') {
      this.vx = 0;
      if (--this.timer <= 0) { this.state = 'ball'; this.timer = 70; }
    } else {
      this.vx = this.dir * 3.4;
      if (this.onGround && (!groundAhead(this, game.room, game.world, this.dir) || wallAhead(this, game.room, game.world, this.dir, true))) this.dir *= -1;
      if (this.t % 3 === 0) game.particles.dust(this.cx, this.y + this.h, -this.dir, 1);
      if (--this.timer <= 0) { this.state = 'walk'; this.timer = rand(100, 170) * game.ai.tactics.cooldown; this.vx = 0; }
    }
    this.fallStep(game);
  }
  draw(ctx, pal) {
    ctx.save();
    ctx.translate(this.cx, this.y + this.h);
    ctx.scale(this.dir, 1);
    const ball = this.state === 'ball' || this.state === 'curl';
    const c = (x) => this.col(x);
    if (ball) {
      ctx.translate(0, -10);
      ctx.rotate(this.state === 'ball' ? this.t * 0.4 * this.dir : 0);
      ctx.fillStyle = c('#8a6a44');
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c('#e8dcc0');
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.2) * 9, Math.sin(a - 0.2) * 9); ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); ctx.lineTo(Math.cos(a + 0.2) * 9, Math.sin(a + 0.2) * 9); ctx.fill(); }
    } else {
      ctx.fillStyle = c('#8a6a44');
      ctx.beginPath(); ctx.ellipse(0, -8, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c('#e8dcc0');
      for (let i = -3; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 3.6 - 1.5, -13); ctx.lineTo(i * 3.6 + 0.5, -20 - (i % 2) * 2); ctx.lineTo(i * 3.6 + 2.5, -13); ctx.fill(); }
      ctx.fillStyle = c('#3a2a1c');
      ctx.beginPath(); ctx.ellipse(10, -6, 4, 3.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(11, -7, 1.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

// ── Atirador de Cristal (Cristal): cristal vivo, parado, que dispara estilhaços em leque
export class Atirador extends Enemy {
  constructor(x, y) {
    super(x, y, { w: 24, h: 30, hp: 5, geo: 4, kbResist: 1 });
    this.bloodColor = '#9ef0ff';
    this.cool = rand(60, 120);
    this.wind = 0;
  }
  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    this.fallStep(game);
    const p = game.player;
    this.dir = this.toward(game);
    if (this.wind > 0) {
      if (--this.wind === 0) {
        const base = Math.atan2(p.cy - (this.y + 8), p.cx - this.cx);
        for (const o of [-0.3, 0, 0.3]) game.spawnProjectile(new Projectile(this.cx, this.y + 8, Math.cos(base + o) * 3.6, Math.sin(base + o) * 3.6, { kind: 'shard', r: 5, life: 120 }));
        game.audio.play('spit');
        this.cool = rand(110, 160) * game.ai.tactics.cooldown;
      }
    } else if (--this.cool <= 0 && !p.dead && this.dist(game) < 360) this.wind = 26;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.cx, this.y + this.h);
    const glow = this.wind > 0 ? 1 - this.wind / 26 : 0.2 + Math.sin(this.t * 0.05) * 0.1;
    const c = (x) => this.col(x);
    ctx.fillStyle = c('#2c5f78');
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-8, -18); ctx.lineTo(-3, -8); ctx.lineTo(0, -30); ctx.lineTo(4, -10); ctx.lineTo(9, -20); ctx.lineTo(12, 0); ctx.fill();
    ctx.fillStyle = c('#5fc9e0');
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(0, -26); ctx.lineTo(5, 0); ctx.fill();
    if (!this.flash) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(158,240,255,${0.25 + glow * 0.6})`;
      ctx.beginPath(); ctx.arc(0, -14, 5 + glow * 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#12202a';
    ctx.fillRect(-4 + this.dir * 1.5, -17, 3, 3); ctx.fillRect(1 + this.dir * 1.5, -17, 3, 3);
    ctx.restore();
  }
}

// ── Fantasma das Ruínas (Ruínas): atravessa paredes; só é ferido quando está visível
export class Fantasma extends Enemy {
  constructor(x, y) {
    super(x, y, { w: 22, h: 30, hp: 3, geo: 4 });
    this.gravity = false;
    this.alpha = 0.7;
    this.bloodColor = '#cfd8ff';
    this.phase = rand(0, 6);
  }
  hurt(game, dmg, kx, ky) { if (this.alpha < 0.5) return; super.hurt(game, dmg, kx, ky); }
  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    const p = game.player, room = game.room;
    this.alpha = 0.62 + Math.sin(this.t * 0.04 + this.phase) * 0.28; // some e reaparece
    if (this.kb > 0) { this.kb--; this.x += this.vx * 0.5; this.vx *= 0.86; }
    const d = this.dist(game);
    if (d < 300 && !p.dead) {
      const dx = p.cx - this.cx, dy = p.cy - 10 - this.cy, dd = Math.hypot(dx, dy) || 1;
      const sp = 0.85 * game.ai.tactics.speed;
      this.x += (dx / dd) * sp; this.y += (dy / dd) * sp + Math.sin(this.t * 0.08) * 0.3;
    } else this.y += Math.sin(this.t * 0.03 + this.phase) * 0.25;
    this.dir = sign(p.cx - this.cx) || this.dir;
    this.x = clamp(this.x, 4, room.pxW - this.w - 4);
    this.y = clamp(this.y, 4, room.pxH - this.h - 4);
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.globalAlpha *= clamp(this.alpha, 0.2, 0.95);
    const c = (x) => this.col(x);
    const sway = Math.sin(this.t * 0.1);
    ctx.fillStyle = c('#dfe6ff');
    ctx.beginPath();
    ctx.moveTo(-10, 14); ctx.quadraticCurveTo(-13, -10 + sway, 0, -15); ctx.quadraticCurveTo(13, -10 - sway, 10, 14);
    for (let i = 0; i < 4; i++) ctx.lineTo(10 - (i + 1) * 5, 14 + (i % 2 ? -4 : 3));
    ctx.fill();
    ctx.fillStyle = '#1a1f33';
    ctx.beginPath(); ctx.ellipse(-3.5, -5, 2.4, 3.6, 0, 0, Math.PI * 2); ctx.ellipse(3.5, -5, 2.4, 3.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 2, 2, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ── Água-viva Elétrica (Jardins): paira na água; o toque dá choque
export class Aguaviva extends Enemy {
  constructor(x, y) {
    super(x, y, { w: 26, h: 26, hp: 3, geo: 3 });
    this.gravity = false;
    this.home = { x: this.x, y: this.y };
    this.bloodColor = '#ff9ae6';
    this.phase = rand(0, 6);
  }
  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.knockback(game)) return;
    const tx = this.home.x + Math.sin(this.t * 0.012 + this.phase) * 80;
    const ty = this.home.y + Math.sin(this.t * 0.035 + this.phase) * 26;
    this.vx = approach(this.vx, clamp((tx - this.cx) * 0.03, -0.9, 0.9), 0.04);
    this.vy = approach(this.vy, clamp((ty - this.cy) * 0.05, -1, 1) + Math.sin(this.t * 0.2) * 0.12, 0.05);
    const ox = this.x, oy = this.y;
    this.physics(game, { ignoreOneWay: true });
    const wx = Math.floor(this.cx / TILE), wy = Math.floor(this.cy / TILE);
    if (!game.room.inside(wx, wy) || game.room.tile(wx, wy) !== T.WATER) { this.x = ox; this.y = oy; this.vx *= -0.5; this.vy *= -0.5; }
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.cx, this.cy);
    const pulse = Math.sin(this.t * 0.12);
    const c = (x) => this.col(x);
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = c(i % 2 ? '#ff9ae6' : '#c86fd8'); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-8 + i * 4, 4);
      for (let k = 1; k <= 4; k++) ctx.lineTo(-8 + i * 4 + Math.sin(this.t * 0.14 + i + k) * 2.4, 4 + k * 4.2);
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(0, -4, 2, 0, 0, 14);
    g.addColorStop(0, c('#ffe3f7')); g.addColorStop(1, c('#d46ad8'));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-13, 4 + pulse); ctx.quadraticCurveTo(-13, -14 - pulse * 2, 0, -14 - pulse * 2); ctx.quadraticCurveTo(13, -14 - pulse * 2, 13, 4 + pulse); ctx.quadraticCurveTo(0, 8, -13, 4 + pulse); ctx.fill();
    if (!this.flash) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255,255,160,${0.35 + Math.abs(pulse) * 0.5})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-2, -8); ctx.lineTo(2, -3); ctx.lineTo(6, -9); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
}

Object.assign(ENEMY_TYPES, { m: Mariposa, s: Espinhudo, x: Atirador, n: Fantasma, j: Aguaviva });
