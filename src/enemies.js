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
    game.damageText(this.cx, this.y, dmg);
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

  // Convidado no multijogador: só segue a posição enviada pelo anfitrião.
  puppetStep() {
    this.t++;
    if (this.flash > 0) this.flash--;
    if (this.nx != null) {
      this.x += (this.nx - this.x) * 0.4;
      this.y += (this.ny - this.y) * 0.4;
    }
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
  // Gosma: geleia translúcida que se arrasta.
  draw(ctx, pal) {
    const wob = Math.sin(this.t * 0.25);
    const w = 14 + wob * 1.5, h = 11 - wob * 1.2;
    ctx.save();
    ctx.translate(this.cx, this.y + this.h);
    ctx.scale(this.dir, 1);
    ctx.globalAlpha *= 0.88;
    ctx.fillStyle = this.flash > 0 ? '#ffffff' : shade(pal.topHi, -0.15);
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.quadraticCurveTo(-w - 1, -h * 1.5, 0, -h * 1.6);
    ctx.quadraticCurveTo(w + 1, -h * 1.5, w, 0);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha /= 0.88;
    ctx.fillStyle = this.col(shade(pal.top, -0.3));
    ctx.beginPath(); ctx.ellipse(-3, -6, 4, 3, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath(); ctx.ellipse(-6, -h * 1.2, 3.2, 1.8, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fbf8f2';
    ctx.beginPath(); ctx.ellipse(3, -10, 2.4, 3, 0, 0, Math.PI * 2); ctx.ellipse(8.5, -10, 2.4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#16121c';
    ctx.beginPath(); ctx.arc(4, -9.5, 1.3, 0, Math.PI * 2); ctx.arc(9.5, -9.5, 1.3, 0, Math.PI * 2); ctx.fill();
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
  // Cogumelo saltitante.
  draw(ctx, pal) {
    const air = !this.onGround;
    const squash = air ? 0.85 : this.wait < 12 ? 1.2 : 1 + Math.sin(this.t * 0.1) * 0.03;
    ctx.save();
    ctx.translate(this.cx, this.y + this.h);
    ctx.scale(this.dir, 1);
    ctx.scale(1 / squash, squash);
    ctx.fillStyle = this.col('#3a2a2a');
    ctx.beginPath(); ctx.ellipse(-5, -1.5, 3.5, 2, 0, 0, Math.PI * 2); ctx.ellipse(5, -1.5, 3.5, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.col('#efe1c6');
    ctx.fillRect(-6.5, -13, 13, 11.5);
    ctx.fillStyle = this.col('#c9b691');
    ctx.fillRect(-6.5, -13, 3, 11.5);
    ctx.fillStyle = '#1a1220';
    ctx.beginPath(); ctx.ellipse(0.5, -8, 1.3, 1.9, 0, 0, Math.PI * 2); ctx.ellipse(4.5, -8, 1.3, 1.9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1220'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-1, -11); ctx.lineTo(2, -10); ctx.moveTo(6, -11); ctx.lineTo(3, -10); ctx.stroke();
    ctx.fillStyle = this.col('#b8433f');
    ctx.beginPath(); ctx.ellipse(0, -13, 14, 11, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = this.col('#8f2f2c');
    ctx.fillRect(-14, -14, 28, 2);
    ctx.fillStyle = this.col('#f7ecd6');
    for (const [sx, sy, r] of [[-7, -18, 2.6], [2, -21, 2.2], [8, -16, 1.8], [-1, -15, 1.4]]) {
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }
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
  // Morcego de brasa.
  draw(ctx, pal) {
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.scale(this.dir, 1);
    const flap = Math.sin(this.t * 0.55);
    const body = this.col('#2b2133'), wing = this.col('#3f2f4c');
    for (const s of [-1, 1]) {
      ctx.fillStyle = wing;
      ctx.beginPath();
      ctx.moveTo(s * 4, -2);
      ctx.lineTo(s * 14, -9 - flap * 7);
      ctx.lineTo(s * 20, -3 - flap * 5);
      ctx.quadraticCurveTo(s * 16, 0, s * 15, 3 - flap * 2);
      ctx.quadraticCurveTo(s * 11, 1, s * 9, 4 - flap);
      ctx.quadraticCurveTo(s * 6, 2, s * 4, 3);
      ctx.fill();
      ctx.strokeStyle = this.col('#5a4668'); ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(s * 4, -1); ctx.lineTo(s * 14, -9 - flap * 7); ctx.moveTo(s * 9, 0); ctx.lineTo(s * 15, 3 - flap * 2); ctx.stroke();
    }
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-5, -4); ctx.lineTo(-4, -11); ctx.lineTo(-1, -6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5, -4); ctx.lineTo(4, -11); ctx.lineTo(1, -6); ctx.fill();
    ctx.fillStyle = this.col('#ff6a3d');
    ctx.beginPath(); ctx.arc(-2.2, -1.5, 1.4, 0, Math.PI * 2); ctx.arc(2.6, -1.5, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.col('#f4efe6');
    ctx.beginPath(); ctx.moveTo(-1.5, 3); ctx.lineTo(-0.8, 5); ctx.lineTo(0, 3); ctx.moveTo(1, 3); ctx.lineTo(1.7, 5); ctx.lineTo(2.4, 3); ctx.fill();
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
  // Flor carnívora que cospe sementes ácidas.
  draw(ctx, pal) {
    const open = this.wind > 0 ? 1 - this.wind / 28 : 0.15 + Math.sin(this.t * 0.06) * 0.05;
    ctx.save();
    ctx.translate(this.cx, this.y + this.h);
    ctx.scale(this.dir, 1);
    const leaf = this.col(shade(pal.top, -0.15));
    ctx.fillStyle = leaf;
    ctx.beginPath(); ctx.ellipse(-8, -3, 8, 3, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8, -3, 8, 3, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = this.col(shade(pal.top, -0.35)); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-4, -10, 1, -16); ctx.stroke();
    ctx.translate(2, -18);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + this.t * 0.01;
      ctx.fillStyle = this.col(i % 2 ? '#c2456b' : '#e0607f');
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * 8, Math.sin(a) * 8, 6, 3.5, a, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = this.col('#7a1f3a');
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
    const m = 1.5 + open * 5;
    ctx.fillStyle = '#1a0a12';
    ctx.beginPath(); ctx.ellipse(2, 0, 5, m, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.col('#f4efe6');
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(i * 3 + 0.5, -m); ctx.lineTo(i * 3 + 2, -m + 2.2); ctx.lineTo(i * 3 + 3.5, -m); ctx.fill();
      ctx.beginPath(); ctx.moveTo(i * 3 + 0.5, m); ctx.lineTo(i * 3 + 2, m - 2.2); ctx.lineTo(i * 3 + 3.5, m); ctx.fill();
    }
    if (this.wind > 0) { ctx.fillStyle = '#b6ff7a'; ctx.beginPath(); ctx.arc(2, 0, 2 * open, 0, Math.PI * 2); ctx.fill(); }
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
  // Golem de pedra com lança e runa brilhante.
  draw(ctx, pal) {
    ctx.save();
    ctx.translate(this.cx, this.y + this.h);
    ctx.scale(this.dir, 1);
    const wind = this.state === 'wind';
    const lunge = this.state === 'lunge';
    const stone = this.col('#6a6676'), stoneDark = this.col('#4a4654'), moss = this.col(shade(pal.top, -0.1));
    const step = this.state === 'patrol' ? Math.sin(this.t * 0.2) * 2 : 0;
    ctx.fillStyle = stoneDark;
    ctx.fillRect(-9 + step, -11, 7, 11); ctx.fillRect(2 - step, -11, 7, 11);
    ctx.fillStyle = stone;
    ctx.beginPath(); ctx.moveTo(-12, -10); ctx.lineTo(-13, -30); ctx.lineTo(12, -32); ctx.lineTo(13, -10); ctx.fill();
    ctx.fillStyle = stoneDark;
    ctx.fillRect(-12, -22, 25, 2);
    ctx.fillStyle = moss;
    ctx.beginPath(); ctx.ellipse(-6, -31, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
    // cabeça
    ctx.fillStyle = stone;
    ctx.fillRect(-7, -43, 15, 12);
    ctx.fillStyle = stoneDark;
    ctx.fillRect(-7, -35, 15, 2);
    ctx.fillStyle = wind ? '#ff5a4a' : pal.accent;
    ctx.fillRect(2, -40, 5, 3);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = wind ? 'rgba(255,90,74,0.4)' : 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.arc(4.5, -38.5, 6, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    // runa no peito
    ctx.strokeStyle = wind ? '#ff8a6a' : pal.accent; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-2, -28); ctx.lineTo(2, -24); ctx.lineTo(-2, -16); ctx.moveTo(2, -24); ctx.lineTo(5, -26); ctx.stroke();
    // lança
    const sx = lunge ? 16 : wind ? -6 : 6;
    ctx.strokeStyle = this.col('#5a3a22'); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(sx - 18, -22); ctx.lineTo(sx + 22, -24); ctx.stroke();
    ctx.fillStyle = this.col('#c7ccd8');
    ctx.beginPath(); ctx.moveTo(sx + 21, -29); ctx.lineTo(sx + 34, -24); ctx.lineTo(sx + 21, -19); ctx.fill();
    ctx.fillStyle = stone;
    ctx.beginPath(); ctx.arc(sx + 2, -23, 4, 0, Math.PI * 2); ctx.fill();
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
