// Inimigos comuns e projéteis.
import { TILE } from './config.js';
import { moveBody, groundAhead, wallAhead } from './physics.js';
import { approach, clamp, rand, sign, shade, rgba } from './util.js';

export class Enemy {
  constructor(x, y, o) {
    this.w = o.w; this.h = o.h;
    this.x = x - o.w / 2; this.y = y - o.h;
    this.hp = this.maxHp = o.hp;
    this.geo = o.geo ?? 2;
    this.kbResist = o.kbResist ?? 0;
    this.contact = 1;
    this.vx = 0; this.vy = 0;
    this.dir = -1; this.t = Math.floor(rand(0, 100));
    this.flash = 0; this.kb = 0; this.dead = false; this.onGround = false;
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  hurt(game, dmg, kx, ky) {
    this.hp -= dmg;
    this.flash = 7;
    const k = 1 - this.kbResist;
    if (k > 0) {
      this.kb = 10;
      this.vx = kx * 5.5 * k;
      if (ky) this.vy = ky * 5 * k;
      else if (this.gravity !== false) this.vy = Math.min(this.vy, -2 * k);
    }
    if (this.hp <= 0) this.die(game);
  }

  die(game) {
    this.dead = true;
    game.audio.play('kill');
    game.particles.burst(this.cx, this.cy, 16, { color: ['#ffffff', this.bloodColor || '#ff9a5c', '#2a2333'], speed: 6, life: 32, grav: 0.18, drag: 0.94 });
    game.particles.ring(this.cx, this.cy, '#ffffff', 8, 2.6, 14);
    game.dropGeo(this.cx, this.cy, this.geo);
  }

  physics(game, opts = {}) {
    const hit = moveBody(this, game.room, game.world, { ...opts, confine: true });
    this.onGround = hit.down;
    return hit;
  }

  // Recuo após levar golpe. Retorna true enquanto estiver atordoado.
  knockback(game) {
    if (this.kb <= 0) return false;
    this.kb--;
    this.vx *= 0.86;
    if (this.gravity !== false) this.vy = Math.min(this.vy + 0.5, 10);
    else this.vy *= 0.86;
    this.physics(game, { ignoreOneWay: this.gravity === false });
    return true;
  }

  fallStep(game) {
    this.vy = Math.min(this.vy + 0.5, 10);
    return this.physics(game);
  }

  toward(game) { return sign(game.player.cx - this.cx) || this.dir; }
  dist(game) { return Math.hypot(game.player.cx - this.cx, game.player.cy - this.cy); }
  col(c) { return this.flash > 0 ? '#ffffff' : c; }
}

// ── Rastejante: anda e vira nas beiradas
export class Crawler extends Enemy {
  constructor(x, y) { super(x, y, { w: 28, h: 18, hp: 3, geo: 2 }); this.bloodColor = '#f2b35a'; }
  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.knockback(game)) return;
    this.vx = this.dir * 0.9 * game.ai.tactics.speed;
    if (this.onGround && (!groundAhead(this, game.room, game.world, this.dir) || wallAhead(this, game.room, game.world, this.dir, true))) this.dir *= -1;
    this.fallStep(game);
  }
  draw(ctx, pal) {
    const { cx } = this, by = this.y + this.h;
    ctx.save();
    ctx.translate(cx, by);
    ctx.scale(this.dir, 1);
    const step = Math.sin(this.t * 0.3);
    ctx.strokeStyle = this.col('#15111a');
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const lx = -9 + i * 8;
      ctx.beginPath(); ctx.moveTo(lx, -6); ctx.lineTo(lx - 3 + step * (i % 2 ? 2 : -2), 0); ctx.stroke();
    }
    ctx.fillStyle = this.col(shade(pal.top, -0.45));
    ctx.beginPath(); ctx.ellipse(0, -9, 15, 10, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = this.col(shade(pal.top, -0.2));
    ctx.beginPath(); ctx.ellipse(-2, -13, 9, 4, -0.2, Math.PI, 0); ctx.fill();
    ctx.fillStyle = this.col('#1c1622');
    ctx.beginPath(); ctx.ellipse(12, -7, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.col(pal.accent);
    ctx.beginPath(); ctx.arc(14, -8, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ── Saltador: espera e dá pulos na direção do herói
export class Hopper extends Enemy {
  constructor(x, y) { super(x, y, { w: 24, h: 22, hp: 4, geo: 3 }); this.wait = rand(30, 80); this.bloodColor = '#ff6f91'; }
  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.knockback(game)) return;
    if (this.onGround) {
      this.vx = approach(this.vx, 0, 0.4);
      const T = game.ai.tactics;
      this.wait--;
      if (this.wait <= 0 && this.dist(game) < 200 + T.aggression * 180) {
        this.dir = this.toward(game);
        this.vx = this.dir * 2.9 * T.speed;
        this.vy = -8.6;
        this.onGround = false;
        this.wait = rand(45, 85) * T.cooldown;
      } else if (this.wait <= 0) this.wait = 20;
    }
    const hit = this.fallStep(game);
    if (hit.left || hit.right) this.dir *= -1;
  }
  draw(ctx, pal) {
    const air = !this.onGround;
    const squash = air ? 0.85 : this.wait < 12 ? 1.2 : 1 + Math.sin(this.t * 0.1) * 0.03;
    ctx.save();
    ctx.translate(this.cx, this.y + this.h);
    ctx.scale(this.dir, 1);
    ctx.scale(1 / squash, squash);
    ctx.fillStyle = this.col('#3a2440');
    ctx.beginPath(); ctx.ellipse(0, -11, 13, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.col('#5b3863');
    ctx.beginPath(); ctx.ellipse(-3, -15, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.col('#f4efe6');
    ctx.beginPath(); ctx.ellipse(6, -13, 4.5, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#16111a';
    ctx.beginPath(); ctx.arc(7.5, -12.5, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = this.col('#2a1830'); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-6, -20); ctx.quadraticCurveTo(-10, -30, -4, -32); ctx.stroke();
    ctx.restore();
  }
}

// ── Vagalume Sombrio: voa e persegue
export class Flyer extends Enemy {
  constructor(x, y) {
    super(x, y, { w: 22, h: 20, hp: 3, geo: 2 });
    this.gravity = false;
    this.home = { x: this.x, y: this.y - 10 };
    this.bloodColor = '#9ff0ff';
  }
  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.knockback(game)) return;
    const p = game.player;
    const T = game.ai.tactics;
    const d = this.dist(game);
    let tx, ty, acc = 0.12, max = 2.3 * T.speed;
    const range = T.tactic === 'ambush' ? 170 : 220 + T.aggression * 120;
    if (d < range && !p.dead) {
      if (this.side == null) this.side = this.cx < p.cx ? -1 : 1;
      this.diveTimer = (this.diveTimer ?? 90) - 1;
      const diving = this.diveTimer < 0;
      if (this.diveTimer < -40) this.diveTimer = 70 + 60 * T.cooldown;
      if (T.tactic === 'flank' && !diving) { tx = p.cx + this.side * 80; ty = p.cy - 50; }
      else if (T.tactic === 'kite' && !diving) {
        // Fica fora do alcance da lâmina e mergulha de vez em quando.
        const away = d < 130 ? -1 : 1;
        tx = this.cx + (p.cx - this.cx) * away; ty = p.cy - 70;
      } else { tx = p.cx; ty = p.cy - 8; if (T.tactic === 'ambush' || diving) max *= 1.3; }
    } else { tx = this.home.x + Math.sin(this.t * 0.02) * 30; ty = this.home.y + Math.sin(this.t * 0.05) * 10; acc = 0.05; max = 1; this.side = null; }
    const dx = tx - this.cx, dy = ty - this.cy, dd = Math.hypot(dx, dy) || 1;
    this.vx = clamp(this.vx + (dx / dd) * acc, -max, max);
    this.vy = clamp(this.vy + (dy / dd) * acc + Math.sin(this.t * 0.15) * 0.05, -max, max);
    if (Math.abs(this.vx) > 0.2) this.dir = sign(this.vx);
    this.physics(game, { ignoreOneWay: true });
  }
  draw(ctx, pal) {
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.scale(this.dir, 1);
    const g = ctx.createRadialGradient(-8, 4, 1, -8, 4, 16);
    g.addColorStop(0, rgba(pal.accent, 0.6)); g.addColorStop(1, rgba(pal.accent, 0));
    ctx.fillStyle = g; ctx.fillRect(-26, -12, 36, 32);
    const wing = Math.sin(this.t * 0.6) * 6;
    ctx.fillStyle = this.col('rgba(220,230,255,0.45)');
    ctx.beginPath(); ctx.ellipse(-2, -8 - wing * 0.3, 9, 4 + wing * 0.4, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.col('#1d1828');
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.col(pal.accent);
    ctx.beginPath(); ctx.ellipse(-8, 3, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.col('#ff5266');
    ctx.beginPath(); ctx.arc(5, -1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ── Cuspidor: planta que lança bolhas em arco
export class Spitter extends Enemy {
  constructor(x, y) { super(x, y, { w: 26, h: 26, hp: 4, geo: 4, kbResist: 1 }); this.cool = rand(40, 90); this.wind = 0; this.bloodColor = '#a6ff7a'; }
  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    this.fallStep(game);
    const p = game.player;
    this.dir = this.toward(game);
    if (this.wind > 0) {
      this.wind--;
      if (this.wind === 0) {
        const dx = p.cx - this.cx;
        game.spawnProjectile(new Projectile(this.cx + this.dir * 8, this.y + 6, clamp(dx / 42, -4.2, 4.2), -5.6,
          { kind: 'blob', grav: 0.22, r: 6, life: 160 }));
        game.audio.play('spit');
        this.cool = rand(90, 130) * game.ai.tactics.cooldown;
      }
    } else if (--this.cool <= 0 && this.dist(game) < (game.ai.tactics.tactic === 'ambush' ? 220 : 360) && !p.dead) this.wind = 28;
  }
  draw(ctx, pal) {
    const swell = this.wind > 0 ? 1 + (1 - this.wind / 28) * 0.25 : 1 + Math.sin(this.t * 0.06) * 0.03;
    ctx.save();
    ctx.translate(this.cx, this.y + this.h);
    ctx.scale(this.dir, 1);
    ctx.strokeStyle = this.col(shade(pal.top, -0.3)); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-12, -8, -6, -8); ctx.moveTo(8, 0); ctx.quadraticCurveTo(12, -8, 6, -8); ctx.stroke();
    ctx.scale(swell, swell);
    ctx.fillStyle = this.col(shade(pal.top, -0.15));
    ctx.beginPath(); ctx.ellipse(0, -14, 11, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.col('#1a1420');
    ctx.beginPath(); ctx.ellipse(6, -16, 5, this.wind > 0 ? 5 : 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.col(this.wind > 0 ? '#ffe36b' : '#c6ff9a');
    ctx.beginPath(); ctx.arc(-3, -18, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ── Sentinela: patrulha e investe com a lança
export class Guard extends Enemy {
  constructor(x, y) { super(x, y, { w: 24, h: 42, hp: 8, geo: 9, kbResist: 0.65 }); this.state = 'patrol'; this.timer = 0; this.bloodColor = '#cfd8f0'; }
  update(game) {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.knockback(game)) return;
    const p = game.player;
    const T = game.ai.tactics;
    const dx = p.cx - this.cx, dy = Math.abs(p.cy - this.cy);
    switch (this.state) {
      case 'patrol':
        this.vx = this.dir * 0.7 * T.speed;
        if (this.onGround && (!groundAhead(this, game.room, game.world, this.dir) || wallAhead(this, game.room, game.world, this.dir, true))) this.dir *= -1;
        if (Math.abs(dx) < 150 + T.aggression * 100 && dy < 60 && !p.dead) {
          this.dir = sign(dx) || 1; this.state = 'wind'; this.timer = Math.round(26 * (1.2 - T.aggression * 0.4)); this.vx = 0;
        }
        break;
      case 'wind':
        this.vx = 0;
        if (--this.timer <= 0) { this.state = 'lunge'; this.timer = 15; game.audio.play('dash'); }
        break;
      case 'lunge':
        this.vx = this.dir * 7.2;
        if (this.t % 2 === 0) game.particles.dust(this.cx, this.y + this.h, -this.dir, 1);
        if (--this.timer <= 0 || wallAhead(this, game.room, game.world, this.dir, true) || !groundAhead(this, game.room, game.world, this.dir)) {
          this.state = 'recover'; this.timer = Math.round(38 * T.cooldown);
        }
        break;
      case 'recover':
        this.vx = approach(this.vx, 0, 0.6);
        if (--this.timer <= 0) this.state = 'patrol';
        break;
    }
    this.fallStep(game);
  }
  draw(ctx, pal) {
    ctx.save();
    ctx.translate(this.cx, this.y + this.h);
    ctx.scale(this.dir, 1);
    const wind = this.state === 'wind';
    const lunge = this.state === 'lunge';
    ctx.fillStyle = this.col('#15121c');
    ctx.fillRect(-7, -10, 5, 10); ctx.fillRect(2, -10, 5, 10);
    ctx.fillStyle = this.col(shade(pal.top, -0.35));
    ctx.beginPath(); ctx.moveTo(-11, -8); ctx.lineTo(-9, -32); ctx.lineTo(9, -32); ctx.lineTo(11, -8); ctx.fill();
    ctx.fillStyle = this.col(shade(pal.topHi, -0.25));
    ctx.beginPath(); ctx.ellipse(1, -36, 9, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.col(shade(pal.topHi, -0.1));
    ctx.beginPath(); ctx.moveTo(-4, -44); ctx.lineTo(2, -54); ctx.lineTo(6, -43); ctx.fill();
    ctx.fillStyle = '#0d0b12';
    ctx.fillRect(0, -38, 9, 3);
    ctx.fillStyle = wind ? '#ff5a4a' : pal.accent;
    ctx.fillRect(4, -38, 3, 2);
    // lança
    const sx = lunge ? 14 : wind ? -6 : 6;
    ctx.strokeStyle = this.col('#8a8fa6'); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(sx - 16, -22); ctx.lineTo(sx + 22, -24); ctx.stroke();
    ctx.fillStyle = this.col('#e3e8f5');
    ctx.beginPath(); ctx.moveTo(sx + 22, -28); ctx.lineTo(sx + 32, -24); ctx.lineTo(sx + 22, -20); ctx.fill();
    // escudo
    ctx.fillStyle = this.col(shade(pal.top, -0.1));
    ctx.beginPath(); ctx.ellipse(8, -20, 4, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

export const ENEMY_TYPES = { c: Crawler, h: Hopper, f: Flyer, p: Spitter, g: Guard };

// ── Projéteis (do herói e dos inimigos)
export class Projectile {
  constructor(x, y, vx, vy, o = {}) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.kind = o.kind || 'blob';
    this.r = o.r ?? 6;
    this.grav = o.grav ?? 0;
    this.life = o.life ?? 120;
    this.hostile = o.hostile ?? true;
    this.dmg = o.dmg ?? 1;
    this.pierce = !!o.pierce;
    this.ground = !!o.ground;
    this.homing = o.homing ?? 0;
    this.hitSet = new Set();
    this.dead = false;
    this.t = 0;
  }
  box() { return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }; }
  update(game) {
    this.t++;
    if (this.homing && !game.player.dead) {
      const dx = game.player.cx - this.x, dy = game.player.cy - this.y, d = Math.hypot(dx, dy) || 1;
      const sp = Math.hypot(this.vx, this.vy);
      this.vx += (dx / d) * this.homing; this.vy += (dy / d) * this.homing;
      const ns = Math.hypot(this.vx, this.vy);
      this.vx *= sp / ns; this.vy *= sp / ns;
    }
    this.vy += this.grav;
    this.x += this.vx; this.y += this.vy;
    if (--this.life <= 0) this.dead = true;
    const tx = Math.floor(this.x / TILE), ty = Math.floor(this.y / TILE);
    if (game.world.isSolid(game.room, tx, ty, true)) {
      this.dead = true;
      game.particles.burst(this.x - this.vx, this.y - this.vy, 8, { color: this.color(game), speed: 3, life: 16, glow: this.kind !== 'blob' });
    }
    if (this.kind === 'spell' || this.kind === 'orb' || this.kind === 'wave')
      game.particles.add({ x: this.x + rand(-4, 4), y: this.y + rand(-4, 4), vx: -this.vx * 0.1, vy: rand(-0.5, 0.5), life: 14, size: rand(2, 4), color: this.color(game), glow: true });
  }
  color() {
    return { blob: '#b6ff7a', spell: '#bfe9ff', orb: '#ffd36e', wave: '#9ef0c0', debris: '#a9a2b8' }[this.kind] || '#fff';
  }
  draw(ctx) {
    const c = this.color();
    ctx.save();
    if (this.kind === 'blob') {
      ctx.fillStyle = '#1f2a14';
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r + 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
    } else if (this.kind === 'debris') {
      ctx.fillStyle = c;
      ctx.translate(this.x, this.y); ctx.rotate(this.t * 0.2);
      ctx.fillRect(-this.r, -this.r, this.r * 2, this.r * 2);
    } else {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.r * 2.4);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, c); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g;
      if (this.kind === 'wave') {
        ctx.beginPath(); ctx.ellipse(this.x, this.y, this.r * 1.2, this.r * 2.2, 0, 0, Math.PI * 2); ctx.fill();
      } else if (this.kind === 'spell') {
        ctx.beginPath(); ctx.ellipse(this.x, this.y, this.r * 2.4, this.r * 1.5, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 2.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
}
