// O Errante: movimento, combate, cura e magia.
import { PHYS, SOUL_COST, TILE } from './config.js';
import { moveBody, standingOnOneWay, touchesSpikes, wallAhead } from './physics.js';
import { approach, rand } from './util.js';
import { drawHero, drawSlash } from './art.js';

const ATTACK_FRAMES = 14;
const ATTACK_ACTIVE = 7; // quadros iniciais em que o golpe acerta
const ATTACK_COOLDOWN = 19;
const FOCUS_FRAMES = 56;
const TAP_FRAMES = 9;

export class Player {
  constructor() {
    this.w = 16;
    this.h = 28;
    this.reset(0, 0);
  }

  reset(x, y) {
    Object.assign(this, {
      x, y, vx: 0, vy: 0, facing: 1, onGround: false,
      coyote: 0, jumpBuffer: 0, jumpHeld: false,
      dashTimer: 0, dashCd: 0, dashDir: 1, airDash: true, canDouble: true,
      wallSliding: false, wallDir: 0, lastWallDir: 0, wallCoyote: 0, wallLock: 0,
      attackTimer: 0, attackCd: 0, attackDir: 'side', hitSet: null,
      invuln: 0, hurtTimer: 0, recoilX: 0, flash: 0,
      focusing: false, focusTimer: 0, spellHold: 0, spellArmed: false,
      sitting: false, dropThrough: 0, dead: false,
      t: 0, state: 'idle', afterimages: [], lastSafe: { x, y },
    });
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  update(game) {
    const inp = game.input;
    const ab = game.save.abilities;
    const { room, world } = game;
    const P = PHYS;
    this.t++;
    for (const k of ['dashCd', 'invuln', 'flash', 'attackCd', 'hurtTimer'])
      if (this[k] > 0) this[k]--;
    for (const a of this.afterimages) a.life--;
    this.afterimages = this.afterimages.filter((a) => a.life > 0);

    if (this.sitting) {
      this.vx = 0; this.vy = 0;
      if (inp.pressed.left || inp.pressed.right || inp.pressed.jump || inp.pressed.attack || inp.pressed.dash) {
        this.sitting = false;
        inp.consume('jump'); inp.consume('attack');
      } else { this.state = 'sit'; return; }
    }

    const stunned = this.hurtTimer > 0;
    let mx = (inp.held.right ? 1 : 0) - (inp.held.left ? 1 : 0);
    if (stunned) mx = 0;

    // ── Foco (cura) e magia: mesmo botão, segurar = curar, toque = magia
    if (inp.pressed.spell) { this.spellArmed = true; this.spellHold = 0; }
    if (inp.held.spell && this.spellArmed) {
      this.spellHold++;
      const canFocus = this.onGround && !stunned && this.dashTimer <= 0 &&
        game.soul >= SOUL_COST && game.masks < game.save.masksMax;
      if (this.spellHold > TAP_FRAMES && canFocus) {
        if (!this.focusing) { this.focusing = true; this.focusTimer = 0; game.audio.play('focus'); }
        this.focusTimer++;
        if (this.focusTimer % 3 === 0) {
          const a = rand(0, Math.PI * 2);
          game.particles.add({ x: this.cx + Math.cos(a) * 30, y: this.cy + Math.sin(a) * 30, vx: -Math.cos(a) * 1.4, vy: -Math.sin(a) * 1.4, life: 20, size: 2.5, color: '#e8f4ff', glow: true, drag: 1 });
        }
        if (this.focusTimer >= FOCUS_FRAMES) { game.heal(); this.focusTimer = 0; this.focusing = false; }
      } else if (this.focusing) { this.focusing = false; this.focusTimer = 0; }
    }
    if (inp.released.spell && this.spellArmed) {
      if (this.spellHold <= TAP_FRAMES && !this.focusing) this.castSpell(game);
      this.focusing = false; this.focusTimer = 0; this.spellArmed = false; this.spellHold = 0;
    }
    if (this.focusing) mx = 0;

    // ── Dash
    if (inp.pressed.dash && ab.dash && this.dashCd <= 0 && this.dashTimer <= 0 && !stunned && !this.focusing &&
        (this.onGround || this.airDash)) {
      let dir = mx || this.facing;
      if (this.wallSliding) dir = -this.wallDir;
      this.dashDir = dir; this.facing = dir;
      this.dashTimer = P.dashFrames; this.dashCd = P.dashCooldown;
      if (!this.onGround) this.airDash = false;
      this.vy = 0; this.wallSliding = false; this.attackTimer = 0;
      game.audio.play('dash');
      game.ai.record('dash');
      game.particles.dust(this.cx, this.y + this.h, -dir, 8, 'rgba(230,240,255,0.5)');
    }

    // ── Velocidade horizontal
    if (this.dashTimer > 0) {
      this.vx = this.dashDir * P.dashSpeed;
      this.vy = 0;
      this.dashTimer--;
      if (this.t % 2 === 0) this.afterimages.push({ x: this.cx, y: this.y + this.h, facing: this.facing, life: 10, t: this.t });
      if (this.dashTimer === 0) this.vx = this.dashDir * P.run;
    } else if (stunned) {
      this.vx = approach(this.vx, 0, 0.25);
    } else if (this.wallLock > 0) {
      this.wallLock--;
    } else {
      this.vx = mx * P.run + this.recoilX;
    }
    this.recoilX = approach(this.recoilX, 0, 0.45);
    if (mx && this.dashTimer <= 0 && this.attackTimer <= 0 && !stunned && !this.wallSliding && this.wallLock <= 0) this.facing = mx;

    // ── Gravidade
    if (this.dashTimer <= 0) {
      let g = P.gravity;
      if (this.jumpHeld && Math.abs(this.vy) < 1.6) g *= 0.5; // flutuar no ápice
      this.vy = Math.min(this.vy + g, P.maxFall);
      if (this.wallSliding && this.vy > P.wallSlide) this.vy = P.wallSlide;
    }

    // ── Pulo (com buffer, coyote time, parede e pulo duplo)
    if (inp.pressed.jump) this.jumpBuffer = P.jumpBuffer;
    if (this.jumpBuffer > 0 && !stunned && !this.focusing) {
      let jumped = false;
      const grounded = this.onGround || this.coyote > 0;
      if (this.onGround && inp.held.down && standingOnOneWay(this, room, world)) {
        this.dropThrough = 12; this.y += 2; this.onGround = false; this.jumpBuffer = 0;
      } else if (grounded) {
        this.vy = P.jump; jumped = true;
        game.audio.play('jump');
        game.particles.dust(this.cx, this.y + this.h, 0, 5);
      } else if (ab.wallJump && (this.wallSliding || this.wallCoyote > 0)) {
        const d = this.lastWallDir;
        this.vx = -d * P.wallJumpX; this.vy = P.wallJumpY;
        this.wallLock = 8; this.facing = -d; this.wallSliding = false; this.wallCoyote = 0;
        jumped = true;
        game.audio.play('wall');
        game.particles.dust(d > 0 ? this.x + this.w : this.x, this.cy, -d, 6);
      } else if (ab.doubleJump && this.canDouble && this.dashTimer <= 0) {
        this.vy = P.doubleJump; this.canDouble = false; jumped = true;
        game.audio.play('doubleJump');
        game.particles.burst(this.cx, this.y + this.h, 12, { angle: Math.PI / 2, spread: 1.2, speed: 3, color: ['#f3efe6', '#bfb7c9', '#6e6578'], life: 26, grav: 0.05, type: 'dot' });
      }
      if (jumped) {
        this.jumpBuffer = 0; this.coyote = 0; this.jumpHeld = true; this.onGround = false;
      }
    }
    if (this.jumpBuffer > 0) this.jumpBuffer--;
    if (inp.released.jump && this.jumpHeld && this.vy < 0) { this.vy *= 0.42; this.jumpHeld = false; }
    if (this.vy >= 0) this.jumpHeld = false;

    // ── Movimento e colisão
    const wasGround = this.onGround;
    const fallSpeed = this.vy;
    const hit = moveBody(this, room, world);
    this.onGround = hit.down;
    if (this.dropThrough > 0) this.dropThrough--;
    if (hit.up) this.jumpHeld = false;
    if (this.onGround) {
      if (!wasGround && fallSpeed > 3) {
        game.audio.play('land');
        game.particles.dust(this.cx, this.y + this.h, 0, fallSpeed > 9 ? 8 : 4);
      }
      this.coyote = P.coyote; this.airDash = true; this.canDouble = true; this.wallCoyote = 0;
    } else if (this.coyote > 0) this.coyote--;

    // ── Parede
    this.wallSliding = false;
    if (ab.wallJump && !this.onGround && this.dashTimer <= 0 && !stunned && this.wallLock <= 0) {
      const d = mx < 0 && wallAhead(this, room, world, -1) ? -1 : mx > 0 && wallAhead(this, room, world, 1) ? 1 : 0;
      if (d) {
        this.wallSliding = true; this.wallDir = d; this.lastWallDir = d; this.wallCoyote = 6;
        this.airDash = true; this.canDouble = true; this.facing = -d;
        if (this.vy > 1 && this.t % 5 === 0)
          game.particles.add({ x: d > 0 ? this.x + this.w : this.x, y: this.y + 4, vx: -d * 0.5, vy: -0.5, life: 14, size: 2, color: 'rgba(220,220,220,0.5)', type: 'puff' });
      } else if (this.wallCoyote > 0) this.wallCoyote--;
    }

    // ── Ataque
    if (inp.pressed.attack && this.attackCd <= 0 && !this.focusing && !stunned && this.dashTimer <= 0) {
      this.attackDir = inp.held.up ? 'up' : inp.held.down && !this.onGround ? 'down' : 'side';
      this.attackTimer = ATTACK_FRAMES;
      this.attackCd = ATTACK_COOLDOWN;
      this.hitSet = new Set();
      game.audio.play('slash');
    }
    if (this.attackTimer > 0) {
      if (this.attackTimer > ATTACK_FRAMES - ATTACK_ACTIVE) game.playerAttack(this.attackBox(), this.attackDir, this.hitSet);
      this.attackTimer--;
    }

    // ── Perigos e último ponto seguro
    if (touchesSpikes(this, room)) game.spikeHit();
    else if (this.onGround && !touchesSpikes({ x: this.x - TILE, y: this.y, w: this.w + TILE * 2, h: this.h + 6 }, room) && !standingOnOneWay(this, room, world)) {
      this.lastSafe = { x: this.x, y: this.y };
    }

    // ── Estado de animação
    this.state = stunned ? 'hurt' : this.dashTimer > 0 ? 'dash' : this.focusing ? 'focus' : this.wallSliding ? 'wall'
      : !this.onGround ? (this.vy < 0 ? 'jump' : 'fall') : Math.abs(this.vx) > 0.5 ? 'run' : 'idle';
  }

  attackBox() {
    const { x, y, w, h, facing } = this;
    if (this.attackDir === 'up') return { x: x + w / 2 - 22, y: y - 44, w: 44, h: 50 };
    if (this.attackDir === 'down') return { x: x + w / 2 - 21, y: y + h - 8, w: 42, h: 46 };
    return facing > 0 ? { x: x + w - 4, y: y - 5, w: 48, h: 34 } : { x: x - 44, y: y - 5, w: 48, h: 34 };
  }

  castSpell(game) {
    if (!game.save.abilities.spell || game.soul < SOUL_COST) return;
    game.soul -= SOUL_COST;
    game.spawnSpell(this.cx + this.facing * 10, this.cy - 2, this.facing);
    this.recoilX = -this.facing * 3;
    game.audio.play('spell');
  }

  // Recebe dano; o jogo cuida de máscaras, pausa de impacto e morte.
  hurt(fromX) {
    this.invuln = 80;
    this.hurtTimer = 12;
    this.vx = (this.cx < fromX ? -1 : 1) * 5;
    this.vy = -5.5;
    this.dashTimer = 0; this.focusing = false; this.focusTimer = 0;
    this.sitting = false; this.attackTimer = 0; this.wallSliding = false;
    this.flash = 8;
  }

  draw(ctx, game) {
    for (const a of this.afterimages)
      drawHero(ctx, a.x, a.y, { profile: game.save.profile, facing: a.facing, state: 'dash', t: a.t, alpha: a.life / 22, flash: 1 });

    if (this.focusing) {
      const k = this.focusTimer / FOCUS_FRAMES;
      const g = ctx.createRadialGradient(this.cx, this.cy, 2, this.cx, this.cy, 26 + k * 24);
      g.addColorStop(0, `rgba(230,244,255,${0.25 + k * 0.4})`);
      g.addColorStop(1, 'rgba(230,244,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(this.cx - 60, this.cy - 60, 120, 120);
    }

    let alpha = 1;
    if (this.invuln > 0 && this.hurtTimer <= 0 && (this.t >> 2) % 2) alpha = 0.35;
    const attacking = this.attackTimer > ATTACK_FRAMES - 9 ? this.attackDir : null;
    drawHero(ctx, this.cx, this.y + this.h, {
      profile: game.save.profile, facing: this.facing, state: this.sitting ? 'sit' : this.state,
      t: this.t, alpha, flash: this.flash, attack: attacking,
    });

    if (this.attackTimer > 0) {
      const k = 1 - this.attackTimer / ATTACK_FRAMES;
      const d = this.attackDir;
      const sx = d === 'side' ? this.cx + this.facing * 24 : this.cx;
      const sy = d === 'up' ? this.y - 12 : d === 'down' ? this.y + this.h + 14 : this.cy - 2;
      drawSlash(ctx, sx, sy, d, this.facing, k);
    }
  }
}
