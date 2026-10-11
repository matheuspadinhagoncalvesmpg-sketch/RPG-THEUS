// Mini-chefes: guardam câmaras opcionais e dão um Fragmento de Vida (+1 coração).
import { TILE } from './config.js';
import { Projectile } from './enemies.js';
import { wallAhead } from './physics.js';
import { approach, clamp, rand, pick } from './util.js';
import { Boss } from './bosses.js';

// ───────────── BESOURO-REI ─────────────
export class BesouroRei extends Boss {
  constructor(x, y) {
    super(x, y, { w: 60, h: 38, hp: 24, geo: 70 });
    this.key = 'mini_besouro';
    this.title = 'Besouro-Rei';
    this.subtitle = 'Senhor da Gruta';
    this.bloodColor = '#c9d86a';
  }

  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    const p = game.player, p2 = this.phase2;
    switch (this.state) {
      case 'intro':
        this.face(game);
        if (this.timer === 70) game.audio.play('roar');
        if (--this.timer <= 0) this.idle(40, game);
        break;
      case 'idle':
        this.vx = approach(this.vx, 0, 0.5);
        this.face(game);
        if (--this.timer > 0) break;
        if (game.ai.pick(['charge', 'leap'], () => (Math.random() < 0.6 ? 'charge' : 'leap')) === 'charge') {
          this.state = 'wind'; this.timer = p2 ? 22 : 32;
        } else {
          this.state = 'leap'; this.vy = -11.5; this.vx = clamp((p.cx - this.cx) / 42, -6, 6); this.onGround = false; this.timer = 2;
          game.audio.play('jump');
        }
        break;
      case 'wind':
        this.vx = 0;
        if (this.t % 4 === 0) game.particles.dust(this.cx - this.facing * 24, this.y + this.h, -this.facing, 2);
        if (--this.timer <= 0) { this.state = 'charge'; game.audio.play('dash'); }
        break;
      case 'charge':
        this.vx = this.facing * (p2 ? 9.6 : 7.8);
        if (this.t % 2 === 0) game.particles.dust(this.cx, this.y + this.h, -this.facing, 2);
        if (wallAhead(this, game.room, game.world, this.facing, true)) {
          this.vx = 0; this.state = 'stun'; this.timer = 46;
          game.shake(9); game.audio.play('shock');
          if (p2) for (let i = 0; i < 3; i++)
            game.spawnProjectile(new Projectile(rand(3, game.room.w - 3) * TILE, 2.4 * TILE, 0, rand(1, 2), { kind: 'debris', grav: 0.25, r: 7, life: 200 }));
        }
        break;
      case 'stun':
        this.vx = 0;
        if (--this.timer <= 0) this.idle(36, game);
        break;
      case 'leap':
        if (this.onGround && this.vy >= 0 && this.timer-- <= 0) {
          this.vx = 0; game.shake(8); game.audio.play('shock');
          for (const d of [-1, 1])
            game.spawnProjectile(new Projectile(this.cx + d * 28, this.y + this.h - 12, d * (p2 ? 6.5 : 5), 0, { kind: 'wave', r: 9, life: 110, ground: true }));
          game.particles.dust(this.cx, this.y + this.h, 0, 12);
          this.idle(48, game);
        }
        break;
    }
    this.gravityStep(game);
  }

  draw(ctx) {
    const wind = this.state === 'wind';
    ctx.save();
    ctx.translate(this.cx + (wind ? rand(-1.2, 1.2) : 0), this.y + this.h);
    ctx.scale(this.facing, 1);
    const c = (x) => this.col(x);
    const step = this.state === 'charge' ? Math.sin(this.t * 0.6) * 4 : Math.sin(this.t * 0.1) * 1;
    ctx.strokeStyle = c('#1d1a12'); ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const lx = -18 + i * 17;
      ctx.beginPath(); ctx.moveTo(lx, -10); ctx.lineTo(lx + 8 + (i % 2 ? step : -step), 0); ctx.stroke();
    }
    // carapaça
    const g = ctx.createLinearGradient(0, -38, 0, -6);
    g.addColorStop(0, c('#8a9a3a')); g.addColorStop(1, c('#3f4a1d'));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(-4, -20, 32, 19, 0, Math.PI, 0); ctx.lineTo(28, -6); ctx.lineTo(-36, -6); ctx.fill();
    ctx.strokeStyle = c('#2b3213'); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-4, -38); ctx.lineTo(-4, -8); ctx.stroke();
    ctx.fillStyle = c('#c9d86a');
    for (const [x, y] of [[-20, -26], [10, -28], [-14, -16], [16, -16]]) { ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
    // cabeça e chifre
    ctx.fillStyle = c('#2b3213');
    ctx.beginPath(); ctx.ellipse(30, -16, 13, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c('#d9d2b8');
    ctx.beginPath(); ctx.moveTo(34, -24); ctx.quadraticCurveTo(52, -38, 46, -50); ctx.quadraticCurveTo(44, -34, 30, -24); ctx.fill();
    ctx.fillStyle = this.phase2 || wind ? '#ff6a4a' : '#ffd36e';
    ctx.beginPath(); ctx.arc(34, -17, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ───────────── GOLEM RACHADO ─────────────
export class GolemRachado extends Boss {
  constructor(x, y) {
    super(x, y, { w: 54, h: 68, hp: 32, geo: 90 });
    this.key = 'mini_golem';
    this.title = 'Golem Rachado';
    this.subtitle = 'Coração do Geodo';
    this.bloodColor = '#9ad7ff';
  }

  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    const p = game.player, p2 = this.phase2;
    switch (this.state) {
      case 'intro':
        this.face(game);
        if (this.timer === 70) game.audio.play('roar');
        if (--this.timer <= 0) this.idle(40, game);
        break;
      case 'idle':
        this.vx = approach(this.vx, 0, 0.5);
        this.face(game);
        if (--this.timer > 0) break;
        this.state = Math.abs(p.cx - this.cx) > 150 ? 'walk' : game.ai.pick(['slam', 'rain'], () => pick(['slam', 'rain']));
        if (this.state === 'walk') this.timer = 70;
        else if (this.state === 'slam') this.timer = p2 ? 22 : 32;
        else { this.timer = p2 ? 34 : 46; game.audio.play('tele'); }
        break;
      case 'walk':
        this.face(game);
        this.vx = this.facing * (p2 ? 2.2 : 1.6);
        if (Math.abs(p.cx - this.cx) < 80 || --this.timer <= 0) this.idle(6, game);
        break;
      case 'slam':
        this.vx = 0;
        if (--this.timer <= 0) {
          game.shake(10); game.audio.play('shock');
          game.hostileBox({ x: this.facing > 0 ? this.cx : this.cx - 90, y: this.y, w: 90, h: this.h });
          for (const d of [-1, 1])
            game.spawnProjectile(new Projectile(this.cx + d * 30, this.y + this.h - 12, d * (p2 ? 6.5 : 5), 0, { kind: 'wave', r: 9, life: 100, ground: true }));
          this.idle(56, game);
        }
        break;
      case 'rain':
        this.vx = 0;
        if (--this.timer <= 0) {
          game.shake(8); game.audio.play('shock');
          const n = p2 ? 7 : 5;
          for (let i = 0; i < n; i++)
            game.spawnProjectile(new Projectile(p.cx + rand(-160, 160), 2.2 * TILE, 0, rand(1, 2), { kind: 'debris', grav: 0.25, r: 7, life: 200 }));
          this.idle(64, game);
        }
        break;
    }
    this.gravityStep(game);
  }

  draw(ctx) {
    const wind = this.state === 'slam' || this.state === 'rain';
    ctx.save();
    ctx.translate(this.cx + (wind ? rand(-1.4, 1.4) : 0), this.y + this.h);
    ctx.scale(this.facing, 1);
    const c = (x) => this.col(x);
    const step = this.state === 'walk' ? Math.sin(this.t * 0.25) * 4 : 0;
    ctx.fillStyle = c('#3a3548');
    ctx.fillRect(-20 + step, -18, 16, 18); ctx.fillRect(4 - step, -18, 16, 18);
    ctx.fillStyle = c('#5a5470');
    ctx.beginPath(); ctx.moveTo(-26, -16); ctx.lineTo(-22, -52); ctx.lineTo(22, -52); ctx.lineTo(26, -16); ctx.fill();
    ctx.fillStyle = c('#6d6788');
    ctx.beginPath(); ctx.moveTo(-26, -44); ctx.lineTo(-14, -56); ctx.lineTo(-6, -46); ctx.lineTo(-18, -34); ctx.fill();
    // cabeça
    ctx.fillStyle = c('#4a4560');
    ctx.fillRect(-12, -68, 26, 18);
    // rachaduras brilhantes
    if (!this.flash) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = wind || this.phase2 ? 'rgba(255,120,90,0.95)' : 'rgba(150,225,255,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-4, -50); ctx.lineTo(2, -38); ctx.lineTo(-6, -28); ctx.lineTo(4, -18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, -52); ctx.lineTo(14, -42); ctx.stroke();
      ctx.fillStyle = wind || this.phase2 ? 'rgba(255,120,90,0.95)' : 'rgba(150,225,255,0.95)';
      ctx.fillRect(2, -62, 8, 4);
      ctx.restore();
    }
    // punhos
    const up = this.state === 'slam' ? -1 : 0;
    ctx.fillStyle = c('#5a5470');
    ctx.fillRect(18, -44 + up * 14, 16, 22); ctx.fillRect(-34, -44, 14, 20);
    ctx.restore();
  }
}

// ───────────── VESPA RAINHA ─────────────
export class VespaRainha extends Boss {
  constructor(x, y) {
    super(x, y, { w: 46, h: 38, hp: 22, geo: 80 });
    this.key = 'mini_vespa';
    this.title = 'Vespa Rainha';
    this.subtitle = 'Soberana do Ninho';
    this.bloodColor = '#ffd36e';
    this.gravity = false;
    this.combo = 0;
  }

  glide(tx, ty, sp = 2.2, ease = 0.05) {
    this.vx = clamp((tx - this.cx) * ease, -sp, sp);
    this.vy = clamp((ty - this.cy) * ease, -sp, sp);
  }

  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    const p = game.player, p2 = this.phase2, room = game.room;
    const homeY = 4.6 * TILE;
    switch (this.state) {
      case 'intro':
        this.face(game);
        this.glide(room.pxW * 0.6, homeY, 2.6);
        if (this.timer === 70) game.audio.play('roar');
        if (--this.timer <= 0) this.idle(36, game);
        break;
      case 'idle':
        this.face(game);
        this.glide(p.cx + Math.sin(this.t * 0.04) * 120, homeY + Math.sin(this.t * 0.09) * 14, p2 ? 2.8 : 2.2);
        if (--this.timer > 0) break;
        if (game.ai.pick(['dive', 'fan'], () => pick(['dive', 'fan'])) === 'dive') { this.state = 'diveWind'; this.timer = p2 ? 22 : 32; game.audio.play('tele'); }
        else { this.state = 'fan'; this.timer = 26; this.combo = p2 ? 1 : 0; }
        break;
      case 'diveWind':
        this.glide(this.cx, homeY - 18, 1.2, 0.1);
        this.tx = p.cx; this.ty = p.cy;
        if (--this.timer <= 0) {
          const dx = this.tx - this.cx, dy = this.ty - this.cy, d = Math.hypot(dx, dy) || 1;
          const sp = p2 ? 10.5 : 9;
          this.vx = (dx / d) * sp; this.vy = (dy / d) * sp;
          this.state = 'dive'; this.timer = 46; game.audio.play('dash');
        }
        break;
      case 'dive':
        if (this.t % 2 === 0) game.particles.add({ x: this.cx, y: this.cy, vx: 0, vy: 0, life: 14, size: 4, color: '#ffd36e', glow: true });
        if (--this.timer <= 0 || this.onGround || wallAhead(this, room, game.world, Math.sign(this.vx) || 1, true)) { this.vx = this.vy = 0; this.state = 'rise'; this.timer = 40; game.shake(5); }
        break;
      case 'rise':
        this.glide(this.cx, homeY, 2.6);
        if (--this.timer <= 0) this.idle(44, game);
        break;
      case 'fan':
        this.glide(this.cx, homeY - 10, 1);
        if (--this.timer <= 0) {
          const n = p2 ? 5 : 3;
          for (let i = 0; i < n; i++) {
            const a = Math.atan2(p.cy - this.cy, p.cx - this.cx) + (i - (n - 1) / 2) * 0.28;
            game.spawnProjectile(new Projectile(this.cx, this.cy, Math.cos(a) * 4.4, Math.sin(a) * 4.4, { kind: 'blob', r: 7, life: 140 }));
          }
          game.audio.play('spit');
          if (this.combo-- > 0) this.timer = 24; else this.idle(52, game);
        }
        break;
    }
    this.physics(game, { ignoreOneWay: true });
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.scale(this.facing, 1);
    const c = (x) => this.col(x);
    const flap = Math.sin(this.t * 0.9) * 0.5;
    // asas
    ctx.fillStyle = 'rgba(230,240,255,0.55)';
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(-6, -10); ctx.rotate(-0.6 + flap * s * 0.5);
      ctx.beginPath(); ctx.ellipse(-4, -14, 7, 20, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    // corpo listrado
    ctx.fillStyle = c('#f2c14e');
    ctx.beginPath(); ctx.ellipse(-8, 2, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c('#2a1f12');
    for (const x of [-18, -8, 2]) ctx.fillRect(x, -10, 5, 24);
    ctx.fillStyle = c('#f2c14e');
    ctx.beginPath(); ctx.moveTo(-28, 2); ctx.lineTo(-40, 6); ctx.lineTo(-28, 8); ctx.fill();
    // cabeça
    ctx.fillStyle = c('#3a2a14');
    ctx.beginPath(); ctx.arc(16, -2, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.phase2 || this.state === 'diveWind' ? '#ff6a4a' : '#fff2b0';
    ctx.beginPath(); ctx.ellipse(19, -4, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    // coroa
    ctx.fillStyle = c('#ffd36e');
    for (const x of [8, 14, 20]) { ctx.beginPath(); ctx.moveTo(x - 2, -11); ctx.lineTo(x, -18); ctx.lineTo(x + 2, -11); ctx.fill(); }
    ctx.restore();
  }
}

// ───────────── LAMPREIA ANCIÃ ─────────────
export class LampreiaAncia extends Boss {
  constructor(x, y) {
    super(x, y, { w: 76, h: 30, hp: 28, geo: 90 });
    this.key = 'mini_lampreia';
    this.title = 'Lampreia Anciã';
    this.subtitle = 'Habitante do Abismo Azul';
    this.bloodColor = '#7affd4';
    this.gravity = false;
    this.combo = 0;
  }

  glide(tx, ty, sp = 2, ease = 0.05) {
    this.vx = clamp((tx - this.cx) * ease, -sp, sp);
    this.vy = clamp((ty - this.cy) * ease, -sp, sp);
  }

  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    const p = game.player, p2 = this.phase2, room = game.room;
    const lo = 4 * TILE, hi = 12 * TILE;
    switch (this.state) {
      case 'intro':
        this.face(game);
        this.glide(room.pxW * 0.6, 7 * TILE, 2.4);
        if (this.timer === 70) game.audio.play('roar');
        if (--this.timer <= 0) this.idle(36, game);
        break;
      case 'idle':
        this.face(game);
        this.glide(room.pxW * 0.5 + Math.sin(this.t * 0.03) * room.pxW * 0.3, clamp(p.cy, lo, hi) + Math.sin(this.t * 0.08) * 10, p2 ? 2.6 : 2);
        if (--this.timer > 0) break;
        if (game.ai.pick(['lunge', 'bubbles'], () => pick(['lunge', 'bubbles'])) === 'lunge') {
          this.lungeDir = p.cx < room.pxW / 2 ? -1 : 1;
          this.state = 'lungeWind'; this.timer = p2 ? 32 : 44; game.audio.play('tele');
        } else { this.state = 'bubbles'; this.timer = 30; this.combo = p2 ? 1 : 0; }
        break;
      case 'lungeWind':
        this.face(game);
        this.glide(this.lungeDir < 0 ? room.pxW - 3 * TILE : 3 * TILE, clamp(p.cy, lo, hi), 3.4, 0.1);
        this.facing = -this.lungeDir;
        if (--this.timer <= 0) { this.state = 'lunge'; this.timer = 90; this.vx = this.lungeDir * (p2 ? 10 : 8.5); this.vy = 0; this.facing = this.lungeDir; game.audio.play('dash'); }
        break;
      case 'lunge':
        this.vy = 0;
        if (this.t % 2 === 0) game.particles.dust(this.cx, this.cy, -this.lungeDir, 1, 'rgba(127,255,212,0.5)');
        if (--this.timer <= 0 || wallAhead(this, room, game.world, this.lungeDir, true)) { this.vx = 0; this.idle(52, game); }
        break;
      case 'bubbles':
        this.glide(this.cx, this.cy, 1);
        if (--this.timer <= 0) {
          const n = p2 ? 10 : 7, off = rand(0, Math.PI * 2);
          for (let i = 0; i < n; i++) {
            const a = off + (i / n) * Math.PI * 2;
            game.spawnProjectile(new Projectile(this.cx, this.cy, Math.cos(a) * 2.6, Math.sin(a) * 2.6, { kind: 'bubble', r: 8, life: 140 }));
          }
          game.audio.play('orb');
          if (this.combo-- > 0) this.timer = 22; else this.idle(56, game);
        }
        break;
    }
    this.physics(game, { ignoreOneWay: true });
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.scale(this.facing, 1);
    const c = (x) => this.col(x);
    // corpo ondulante (cauda para trás)
    for (let i = 7; i >= 0; i--) {
      const x = -i * 9, y = Math.sin(this.t * 0.14 - i * 0.7) * (2 + i * 0.7);
      ctx.fillStyle = c(i % 2 ? '#2f7f95' : '#256a80');
      ctx.beginPath(); ctx.ellipse(x, y, 13 - i * 0.7, 11 - i * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    // cabeça com boca circular
    ctx.fillStyle = c('#3a9fb8');
    ctx.beginPath(); ctx.ellipse(16, 0, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c('#1a2f3d');
    ctx.beginPath(); ctx.ellipse(26, 0, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c('#e8fbff');
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; ctx.beginPath(); ctx.arc(26 + Math.cos(a) * 5.5, Math.sin(a) * 7, 1.3, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = this.phase2 || this.state === 'lungeWind' ? 'rgba(255,106,74,0.95)' : 'rgba(255,230,140,0.95)';
    ctx.beginPath(); ctx.arc(12, -8, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}

export const MINI_TYPES = { mini_besouro: BesouroRei, mini_golem: GolemRachado, mini_vespa: VespaRainha, mini_lampreia: LampreiaAncia };
