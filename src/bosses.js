// Chefes: Cavaleiro de Musgo e o Rei Sem Coroa.
import { TILE } from './config.js';
import { Enemy, Projectile } from './enemies.js';
import { wallAhead } from './physics.js';
import { approach, clamp, rand, sign, pick } from './util.js';

class Boss extends Enemy {
  constructor(x, y, o) {
    super(x, y, { ...o, kbResist: 1 });
    this.isBoss = true;
    this.state = 'intro';
    this.timer = 70;
    this.facing = -1;
  }
  get phase2() { return this.hp <= this.maxHp / 2; }
  hurt(game, dmg) {
    if (this.state === 'intro' || this.dead) return;
    const before = this.phase2;
    this.hp -= dmg;
    this.flash = 5;
    if (!before && this.phase2) {
      game.shake(10);
      game.audio.play('roar');
      game.particles.ring(this.cx, this.cy, '#ffffff', 10, 5, 24);
    }
    if (this.hp <= 0) this.die(game);
  }
  die(game) {
    this.dead = true;
    game.audio.play('kill');
    game.audio.play('roar');
    game.shake(18);
    game.hitstop(30);
    for (let i = 0; i < 4; i++)
      game.particles.burst(this.cx, this.cy, 20, { color: ['#ffffff', '#ffd36e', this.bloodColor], speed: 9, life: 60, grav: 0.1, drag: 0.95, glow: i % 2 === 0 });
    game.particles.ring(this.cx, this.cy, '#ffffff', 10, 6, 30);
    game.dropGeo(this.cx, this.cy, this.geo);
    game.onBossDefeated(this.key);
  }
  idle(frames, game) {
    const cd = game ? game.ai.tactics.cooldown : 1;
    this.state = 'idle';
    this.timer = Math.round(frames * (this.phase2 ? 0.65 : 1) * cd);
  }
  face(game) { this.facing = sign(game.player.cx - this.cx) || this.facing; }
  gravityStep(game, g = 0.6) {
    this.vy = Math.min(this.vy + g, 13);
    return this.physics(game);
  }
}

// ───────────── CAVALEIRO DE MUSGO ─────────────
export class MossKnight extends Boss {
  constructor(x, y) {
    super(x, y, { w: 42, h: 56, hp: 36, geo: 60 });
    this.key = 'moss';
    this.title = 'Cavaleiro de Musgo';
    this.subtitle = 'Guardião do Santuário';
    this.bloodColor = '#7fd394';
    this.swings = 0;
  }

  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    const p = game.player;
    const p2 = this.phase2;
    switch (this.state) {
      case 'intro':
        this.face(game);
        if (this.timer === 70) game.audio.play('roar');
        if (--this.timer <= 0) this.idle(40, game);
        break;
      case 'idle': {
        this.vx = approach(this.vx, 0, 0.5);
        this.face(game);
        if (--this.timer > 0) break;
        const far = Math.abs(p.cx - this.cx) > 190;
        const r = Math.random();
        const choice = game.ai.pick(['charge', 'leap', 'combo'], () =>
          far ? (r < 0.5 ? 'charge' : 'leap') : r < 0.45 ? 'combo' : r < 0.75 ? 'leap' : 'charge');
        this.start({ charge: 'chargeWind', leap: 'leap', combo: 'approach' }[choice], game);
        break;
      }
      case 'chargeWind':
        this.vx = 0;
        if (this.t % 4 === 0) game.particles.dust(this.cx - this.facing * 16, this.y + this.h, -this.facing, 2);
        if (--this.timer <= 0) { this.state = 'charge'; game.audio.play('dash'); }
        break;
      case 'charge':
        this.vx = this.facing * (p2 ? 10 : 8.4);
        if (this.t % 2 === 0) game.particles.dust(this.cx, this.y + this.h, -this.facing, 2);
        if (wallAhead(this, game.room, game.world, this.facing, true)) {
          this.vx = 0;
          this.state = 'stun'; this.timer = 42;
          game.shake(10);
          game.audio.play('shock');
          if (p2) for (let i = 0; i < 4; i++)
            game.spawnProjectile(new Projectile(rand(3, game.room.w - 3) * TILE, 2.2 * TILE, 0, rand(1, 2), { kind: 'debris', grav: 0.25, r: 7, life: 200 }));
        }
        break;
      case 'stun':
        this.vx = 0;
        if (--this.timer <= 0) this.idle(30, game);
        break;
      case 'leap':
        if (this.onGround && this.vy >= 0 && this.timer-- <= 0) {
          this.vx = 0;
          game.shake(8);
          game.audio.play('shock');
          const n = p2 ? 2 : 1;
          for (let i = 0; i < n; i++)
            for (const d of [-1, 1])
              game.spawnProjectile(new Projectile(this.cx + d * 24, this.y + this.h - 12, d * (5 + i * 2), 0, { kind: 'wave', r: 9, life: 110, ground: true }));
          game.particles.dust(this.cx, this.y + this.h, 0, 14);
          this.idle(50, game);
        }
        break;
      case 'approach':
        this.face(game);
        this.vx = this.facing * 2.4;
        if (Math.abs(p.cx - this.cx) < 70 || --this.timer <= 0) { this.state = 'swingWind'; this.timer = p2 ? 12 : 17; this.swings = 3; }
        break;
      case 'swingWind':
        this.vx = 0;
        if (--this.timer <= 0) { this.state = 'swing'; this.timer = 9; this.vx = this.facing * 3.5; game.audio.play('slash'); }
        break;
      case 'swing':
        this.vx = approach(this.vx, 0, 0.4);
        game.hostileBox({ x: this.facing > 0 ? this.cx : this.cx - 74, y: this.y - 6, w: 74, h: this.h + 6 });
        if (--this.timer <= 0) {
          if (--this.swings > 0) { this.face(game); this.state = 'swingWind'; this.timer = p2 ? 9 : 13; }
          else this.idle(55, game);
        }
        break;
    }
    this.gravityStep(game);
  }

  start(state, game) {
    const p2 = this.phase2;
    this.state = state;
    if (state === 'chargeWind') { this.face(game); this.timer = p2 ? 22 : 32; }
    if (state === 'leap') {
      this.face(game);
      this.vy = -12.5;
      this.vx = clamp((game.player.cx - this.cx) / 46, -6, 6);
      this.onGround = false;
      this.timer = 2;
      game.audio.play('jump');
    }
    if (state === 'approach') this.timer = 60;
  }

  draw(ctx, pal) {
    const winding = this.state === 'chargeWind' || this.state === 'swingWind';
    const shakeX = winding ? rand(-1.5, 1.5) : 0;
    ctx.save();
    ctx.translate(this.cx + shakeX, this.y + this.h);
    ctx.scale(this.facing, 1);
    const c = (x) => this.col(x);
    // pernas
    ctx.fillStyle = c('#12100f');
    const step = this.state === 'approach' || this.state === 'charge' ? Math.sin(this.t * 0.4) * 4 : 0;
    ctx.fillRect(-12 + step, -14, 8, 14); ctx.fillRect(4 - step, -14, 8, 14);
    // corpo/armadura
    ctx.fillStyle = c('#2c3a2c');
    ctx.beginPath(); ctx.moveTo(-20, -12); ctx.lineTo(-16, -46); ctx.lineTo(16, -46); ctx.lineTo(20, -12); ctx.fill();
    ctx.fillStyle = c('#3f6b46');
    ctx.beginPath(); ctx.moveTo(-20, -40); ctx.quadraticCurveTo(-28, -30, -22, -14); ctx.lineTo(-16, -30); ctx.fill();
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = c(i % 2 ? '#6fbf86' : '#4c8a5a');
      ctx.beginPath(); ctx.arc(-14 + i * 7, -45 + (i % 2) * 2, 5, 0, Math.PI * 2); ctx.fill();
    }
    // elmo
    ctx.fillStyle = c('#575f6e');
    ctx.beginPath(); ctx.ellipse(2, -54, 13, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c('#c8ccd8');
    ctx.beginPath(); ctx.moveTo(-8, -62); ctx.quadraticCurveTo(-18, -74, -10, -82); ctx.quadraticCurveTo(-12, -70, -2, -64); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, -62); ctx.quadraticCurveTo(20, -74, 14, -82); ctx.quadraticCurveTo(14, -70, 6, -64); ctx.fill();
    ctx.fillStyle = '#08070b';
    ctx.fillRect(2, -57, 13, 5);
    ctx.fillStyle = winding || this.phase2 ? '#ff6a4a' : '#ffd36e';
    ctx.fillRect(8, -56, 4, 3);
    // maça
    const swing = this.state === 'swing' ? 1 : this.state === 'swingWind' ? -1 : 0;
    ctx.save();
    ctx.translate(14, -32);
    ctx.rotate(swing === 1 ? 0.4 : swing === -1 ? -2.2 : -0.6);
    ctx.fillStyle = c('#4b3b2c');
    ctx.fillRect(0, -3, 34, 6);
    ctx.fillStyle = c('#7c8291');
    ctx.beginPath(); ctx.arc(38, 0, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c('#3f6b46');
    ctx.beginPath(); ctx.arc(36, -4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (this.state === 'swing') {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(10, -30, 62, -1.2, 0.9); ctx.arc(10, -30, 44, 0.9, -1.2, true); ctx.fill();
    }
    ctx.restore();
  }
}

// ───────────── O REI SEM COROA ─────────────
export class HollowKing extends Boss {
  constructor(x, y) {
    super(x, y, { w: 34, h: 60, hp: 60, geo: 150 });
    this.key = 'king';
    this.title = 'O Rei Sem Coroa';
    this.subtitle = 'Ladrão da Aurora';
    this.bloodColor = '#ffd36e';
    this.alpha = 1;
    this.float = false;
    this.combo = 0;
  }

  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    const p = game.player;
    const p2 = this.phase2;
    const room = game.room;
    switch (this.state) {
      case 'intro':
        this.face(game);
        if (this.timer === 70) game.audio.play('roar');
        if (--this.timer <= 0) this.idle(40, game);
        break;
      case 'idle': {
        this.vx = approach(this.vx, 0, 0.4);
        this.face(game);
        if (--this.timer > 0) break;
        const opts = ['tele', 'orbs', 'dive'];
        if (Math.abs(p.cx - this.cx) < 120) opts.push('tele');
        this.begin(game.ai.pick(['tele', 'orbs', 'dive'], () => pick(opts)), game);
        break;
      }
      case 'teleOut':
        this.alpha = this.timer / 16;
        if (--this.timer <= 0) {
          const side = Math.random() < 0.5 ? -1 : 1;
          let nx = clamp(p.cx + side * 96, 3 * TILE, room.pxW - 3 * TILE);
          this.x = nx - this.w / 2;
          this.y = (room.h - 2) * TILE - this.h;
          this.vy = 0;
          this.face(game);
          this.state = 'teleIn'; this.timer = p2 ? 16 : 22;
          game.audio.play('tele');
          game.particles.ring(this.cx, this.cy, '#ffd36e', 6, 3, 18);
        }
        break;
      case 'teleIn':
        this.alpha = 1 - this.timer / 22;
        if (--this.timer <= 0) { this.alpha = 1; this.state = 'slash'; this.timer = 10; this.vx = this.facing * 6; game.audio.play('slash'); }
        break;
      case 'slash':
        this.vx = approach(this.vx, 0, 0.5);
        game.hostileBox({ x: this.facing > 0 ? this.cx - 10 : this.cx - 110, y: this.y - 10, w: 120, h: this.h + 10 });
        if (--this.timer <= 0) {
          if (p2 && this.combo-- > 0) this.begin('tele', game, true);
          else this.idle(48, game);
        }
        break;
      case 'rise':
        this.float = true;
        this.vy = -3.2;
        this.vx = 0;
        if (this.y < 3 * TILE || --this.timer <= 0) { this.vy = 0; this.state = 'orbWind'; this.timer = 26; }
        break;
      case 'orbWind':
        this.vy = Math.sin(this.t * 0.2) * 0.5;
        if (this.t % 3 === 0) game.particles.add({ x: this.cx + rand(-30, 30), y: this.cy + rand(-30, 30), vx: 0, vy: 0, life: 18, size: 3, color: '#ffd36e', glow: true });
        if (--this.timer <= 0) {
          const n = p2 ? 7 : 5;
          const base = Math.atan2(p.cy - this.cy, p.cx - this.cx);
          for (let i = 0; i < n; i++) {
            const a = base + (i - (n - 1) / 2) * 0.28;
            game.spawnProjectile(new Projectile(this.cx, this.cy, Math.cos(a) * 3.3, Math.sin(a) * 3.3, { kind: 'orb', r: 7, life: 180, homing: p2 ? 0.03 : 0 }));
          }
          game.audio.play('orb');
          this.state = 'fall'; this.float = false;
        }
        break;
      case 'fall':
        if (this.onGround) this.idle(40, game);
        break;
      case 'diveOut':
        this.alpha = this.timer / 14;
        if (--this.timer <= 0) {
          this.x = clamp(p.cx, 3 * TILE, room.pxW - 3 * TILE) - this.w / 2;
          this.y = Math.max(2 * TILE + 4, p.y - 180);
          this.vy = 0; this.vx = 0;
          this.float = true;
          this.state = 'diveWind'; this.timer = p2 ? 20 : 28;
          game.audio.play('tele');
        }
        break;
      case 'diveWind':
        this.alpha = Math.min(1, this.alpha + 0.1);
        this.vy = 0;
        if (--this.timer <= 0) { this.state = 'dive'; this.float = false; this.vy = 14; }
        break;
      case 'dive':
        game.hostileBox({ x: this.x - 4, y: this.y, w: this.w + 8, h: this.h });
        if (this.onGround) {
          game.shake(10);
          game.audio.play('shock');
          for (const d of [-1, 1])
            game.spawnProjectile(new Projectile(this.cx + d * 20, this.y + this.h - 12, d * (p2 ? 6.5 : 5), 0, { kind: 'wave', r: 9, life: 110, ground: true }));
          game.particles.dust(this.cx, this.y + this.h, 0, 16);
          if (p2 && this.combo-- > 0) this.begin('dive', game, true);
          else this.idle(50, game);
        }
        break;
    }
    if (this.float) this.physics(game, { ignoreOneWay: true });
    else this.gravityStep(game, 0.7);
  }

  begin(kind, game, chained = false) {
    if (!chained) this.combo = this.phase2 ? 1 : 0;
    if (kind === 'tele') { this.state = 'teleOut'; this.timer = 16; game.audio.play('tele'); }
    if (kind === 'orbs') { this.state = 'rise'; this.timer = 40; }
    if (kind === 'dive') { this.state = 'diveOut'; this.timer = 14; }
  }

  // Invulnerável enquanto some
  hurt(game, dmg) {
    if (this.alpha < 0.5) return;
    super.hurt(game, dmg);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha *= Math.max(0.05, this.alpha);
    ctx.translate(this.cx, this.y + this.h);
    ctx.scale(this.facing, 1);
    const c = (x) => this.col(x);
    const sway = Math.sin(this.t * 0.06) * 2;
    const winding = this.state === 'teleIn' || this.state === 'orbWind' || this.state === 'diveWind';
    // manto
    ctx.fillStyle = c('#0d0b14');
    ctx.beginPath();
    ctx.moveTo(-10, -50);
    ctx.quadraticCurveTo(-26 - sway, -20, -22 - sway, 0);
    for (let i = 0; i < 6; i++) ctx.lineTo(-18 + i * 8 - sway * 0.5, (i % 2) * -6);
    ctx.quadraticCurveTo(22, -20, 10, -50);
    ctx.fill();
    ctx.fillStyle = c('#3d2a55');
    ctx.beginPath(); ctx.moveTo(-6, -48); ctx.lineTo(-10, -6); ctx.lineTo(6, -6); ctx.lineTo(8, -48); ctx.fill();
    // máscara
    ctx.fillStyle = c('#e9e3d6');
    ctx.beginPath();
    ctx.moveTo(-9, -58);
    ctx.quadraticCurveTo(-10, -70, 1, -71);
    ctx.quadraticCurveTo(12, -70, 11, -58);
    ctx.quadraticCurveTo(10, -48, 1, -45);
    ctx.quadraticCurveTo(-8, -48, -9, -58);
    ctx.fill();
    ctx.fillStyle = '#0a0810';
    ctx.beginPath(); ctx.ellipse(-2, -60, 2.6, 4.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6, -60, 2.6, 4.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = winding || this.phase2 ? '#ff6a4a' : '#ffd36e';
    ctx.beginPath(); ctx.arc(-2, -59, 1.2, 0, Math.PI * 2); ctx.arc(6, -59, 1.2, 0, Math.PI * 2); ctx.fill();
    // rachadura
    ctx.strokeStyle = '#0a0810'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(4, -71); ctx.lineTo(2, -65); ctx.lineTo(5, -62); ctx.stroke();
    // fragmentos da coroa flutuando
    for (let i = 0; i < 3; i++) {
      const a = this.t * 0.03 + (i * Math.PI * 2) / 3;
      const fx = Math.cos(a) * 14, fy = -82 + Math.sin(a) * 4;
      ctx.fillStyle = c('#ffd36e');
      ctx.beginPath(); ctx.moveTo(fx - 3, fy + 3); ctx.lineTo(fx, fy - 5); ctx.lineTo(fx + 3, fy + 3); ctx.fill();
    }
    // lâmina
    if (this.state === 'slash' || this.state === 'teleIn') {
      ctx.strokeStyle = this.state === 'slash' ? '#fff6dc' : 'rgba(255,211,110,0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(8, -34); ctx.lineTo(this.state === 'slash' ? 60 : 30, this.state === 'slash' ? -30 : -60); ctx.stroke();
      if (this.state === 'slash') {
        ctx.fillStyle = 'rgba(255,240,200,0.3)';
        ctx.beginPath(); ctx.arc(0, -32, 100, -0.9, 0.7); ctx.arc(0, -32, 70, 0.7, -0.9, true); ctx.fill();
      }
    }
    ctx.restore();
  }
}

export const BOSS_TYPES = { moss: MossKnight, king: HollowKing };
