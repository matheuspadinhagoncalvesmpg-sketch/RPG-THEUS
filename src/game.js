// Núcleo do jogo: salas, transições, combate, câmera e estados.
import { TILE, T, AREAS, ABILITIES, PHYS, SOUL_MAX, SOUL_PER_HIT, SOUL_COST, RESOURCES, WEAPONS, CHARMS, classOf } from './config.js';
import { World } from './world.js';
import { Player } from './player.js';
import { ENEMY_TYPES, Projectile } from './enemies.js';
import { BOSS_TYPES } from './bosses.js';
import { MINI_TYPES } from './minibosses.js';
import { spawnRoomEntities, GeoCoin, Tombstone, ItemDrop } from './entities.js';
import { BuildMode } from './build.js';
import { CraftUI } from './crafting.js';
import { Raids } from './raids.js';
import { NPC, makeBuilt } from './entities.js';
import { Net } from './net.js';
import { scheduleUpload } from './cloud.js';
import { Particles } from './fx.js';
import { Renderer } from './render.js';
import { AIDirector } from './ai.js';
import { writeSave } from './save.js';
import { BOSS_LINES } from './story.js';
import { overlap, sign, clamp, rand } from './util.js';

const STEP = 1000 / 60;
const START_ROOM = 'campos_inicio';

export class Game {
  constructor({ canvas, input, audio, ui }) {
    this.renderer = new Renderer(canvas);
    this.input = input;
    this.audio = audio;
    this.ui = ui;
    this.particles = new Particles();
    this.player = new Player();
    this.bubbles = [];
    this.floaters = [];
    this.build = new BuildMode(this);
    this.craft = new CraftUI(this);
    this.raids = new Raids(this);
    this.net = new Net(this);
    this.raidSeq = 0;
    this.speed = 1;
    this.autoQuality = true;
    this.slowmoT = 0;
    this.zoom = 0;
    this.challenge = { active: false, t: 0, armed: true };
    this.cam = { x: 0, y: 0 };
    this.shakeMag = 0;
    this.state = 'off';
    this.frame = 0;
    this.raf = null;
    this.onExit = null;
    this.onEnding = null;
    // Girar a tela, tela cheia e o teclado do celular disparam vários "resize": junta tudo
    // e nunca redimensiona o jogo enquanto o jogador digita (o zoom pularia).
    let rt = null;
    const typing = () => /^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName || '');
    const doResize = () => {
      if (typing()) { this.pendingResize = true; return; }
      this.pendingResize = false;
      this.renderer.resize();
      this.updateCamera(true);
      this.needsRender = true;
    };
    const onResize = () => { clearTimeout(rt); rt = setTimeout(doResize, 120); };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => setTimeout(onResize, 300));
    document.addEventListener('fullscreenchange', () => setTimeout(onResize, 100));
    document.addEventListener('focusout', () => { if (this.pendingResize) setTimeout(onResize, 250); });
  }

  // ───────── Início ─────────
  start(save) {
    this.save = save;
    this.world = new World();
    this.world.applySave(save);
    this.masks = save.masksMax;
    this.soul = 0;
    this.lastArea = null;
    if (!this.ai) this.ai = new AIDirector(this);
    this.ui.resetHud();
    this.ui.refreshButtons(save.abilities);
    this.respawn(true);
    this.state = 'play';
    this.last = performance.now();
    this.acc = 0;
    if (!this.raf) this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.state = 'off';
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  respawn(first = false) {
    const b = this.save.bench;
    if (b && this.world.byId[b.room]) {
      this.enterRoom(b.room, b.x, b.y);
      this.player.sitting = true;
      this.player.facing = 1;
    } else {
      const room = this.world.byId[START_ROOM];
      const s = room.entities.find((e) => e.ch === 'S');
      this.enterRoom(START_ROOM, s.tx * TILE + 8, (s.ty + 1) * TILE - this.player.h);
      if (first && !this.save.visitedIntro) {
        this.save.visitedIntro = true;
        this.player.y -= 4 * TILE;
        setTimeout(() => this.ui.toast(this.input.touchMode
          ? 'Joystick: mover  ·  ▲ pular  ·  ⚔ atacar  ·  segure ✦ para curar'
          : 'A D mover · Espaço pular · clique para atacar · segure o botão direito para curar · Esc → manual', 6500), 1800);
      }
    }
  }

  persist() {
    writeSave(this.save);
    scheduleUpload(this.save);
  }

  // ───────── Salas ─────────
  enterRoom(id, x, y) {
    const room = this.world.byId[id];
    this.room = room;
    this.renderer.setRoom(room);
    room.doorsClosed = false;
    this.entities = spawnRoomEntities(room, this.save);
    this.enemies = [];
    let eid = 0;
    for (const e of room.entities) {
      const E = ENEMY_TYPES[e.ch];
      if (!E) continue;
      const en = new E(e.tx * TILE + TILE / 2, (e.ty + 1) * TILE);
      en.eid = eid++;
      this.enemies.push(en);
    }
    this.boss = null;
    this.bossPending = null;
    if (room.boss && !this.save.bosses[room.boss]) {
      const k = room.entities.find((e) => e.ch === 'K');
      this.bossPending = { type: room.boss, x: k.tx * TILE + TILE / 2, y: (k.ty + 1) * TILE };
    }
    const sh = this.save.shade;
    if (sh && sh.room === id) this.entities.push(new Tombstone(sh.x, sh.y, sh.geo));
    this.floaters = [];
    this.build.onRoomEnter(room);
    this.raids.onRoomEnter(room);
    this.projectiles = [];
    this.coins = [];
    this.hostileBoxes = [];
    this.particles.clear();
    this.spikeTimer = 0;
    this.bubbles = [];
    this.ai.onRoomEnter();
    this.challenge = { active: false, t: 0, armed: true };
    this.ui.setChallenge(null);

    const p = this.player;
    const keep = { vx: p.vx, vy: p.vy, facing: p.facing, airDash: p.airDash, canDouble: p.canDouble, dashTimer: p.dashTimer, dashDir: p.dashDir, jumpHeld: p.jumpHeld };
    if (!this.transitionKeep) { p.reset(x, y); }
    else { p.x = x; p.y = y; Object.assign(p, keep); p.lastSafe = { x, y }; }
    this.transitionKeep = false;

    if (!this.save.visited[id]) { this.save.visited[id] = true; }
    if (room.area !== this.lastArea) {
      this.lastArea = room.area;
      const a = AREAS[room.area];
      this.ui.areaTitle(a.name, a.subtitle);
    }
    this.audio.setMusic(room.area, false);
    this.audio.intense = false;
    this.updateCamera(true);
    this.persist();
  }

  checkExit() {
    const p = this.player, room = this.room;
    if (p.cx >= 0 && p.cx < room.pxW && p.cy >= 0 && p.cy < room.pxH) return;
    const gx = room.x * TILE + p.cx, gy = room.y * TILE + p.cy;
    const next = this.world.roomAtGlobal(Math.floor(gx / TILE), Math.floor(gy / TILE));
    if (!next || next === room) {
      p.x = clamp(p.x, 0, room.pxW - p.w);
      p.y = clamp(p.y, -p.h, room.pxH - p.h);
      return;
    }
    const goingUp = p.cy < 0;
    this.transition = { t: 0, phase: 'out', next, gx: room.x * TILE + p.x, gy: room.y * TILE + p.y, goingUp };
  }

  updateTransition() {
    const tr = this.transition;
    tr.t++;
    if (tr.phase === 'out' && tr.t >= 8) {
      const { next } = tr;
      this.transitionKeep = true;
      this.enterRoom(next.id, tr.gx - next.x * TILE, tr.gy - next.y * TILE);
      // Impulso para subir pela abertura de baixo, como no Hollow Knight.
      if (tr.goingUp) { this.player.vy = Math.min(this.player.vy, -11.5); this.player.jumpHeld = false; }
      tr.phase = 'in';
      tr.t = 0;
    } else if (tr.phase === 'in' && tr.t >= 14) this.transition = null;
  }

  // ───────── Laço principal ─────────
  loop(now) {
    this.raf = requestAnimationFrame((t) => this.loop(t));
    const raw = now - this.last;
    let dt = raw;
    this.last = now;
    if (dt > 250) dt = 250;
    this.watchPerf(raw);
    this.acc += dt * this.speed * (this.slowmoT > 0 ? 0.35 : 1);
    let steps = 0;
    try {
      while (this.acc >= STEP && steps < 5) { this.step(); this.acc -= STEP; steps++; }
      if (steps === 5) this.acc = 0;
      // Telas de 90/120 Hz: só desenha quando algo mudou (menos calor e bateria).
      if (this.state !== 'off' && (steps > 0 || this.needsRender)) { this.render(); this.needsRender = false; }
    } catch (e) {
      // Um erro num quadro não pode congelar o jogo inteiro: registra e segue.
      console.error(e);
      if (!this.errorShown) { this.errorShown = true; this.ui.toast('Erro: ' + e.message, 6000); }
    }
  }

  // Resolução dinâmica: se o aparelho não aguenta, o jogo desenha com menos pixels
  // (a tela continua do mesmo tamanho) e sobe de novo quando sobra fôlego.
  watchPerf(raw) {
    if (!this.autoQuality || raw > 120 || this.state === 'off') return;
    const p = this.perf || (this.perf = { n: 0, slow: 0, fast: 0, good: 0, lock: 0 });
    p.n++;
    if (raw > 27) p.slow++; else if (raw < 19) p.fast++;
    if (p.n < 90) return;
    const r = this.renderer, t = performance.now();
    if (p.slow > 36 && r.quality > 0.5) {
      r.setQuality(Math.max(0.5, +(r.quality - 0.15).toFixed(2)));
      this.updateCamera(true);
      p.lock = t + 45000; p.good = 0;
    } else if (p.fast > 80 && r.quality < 1 && t > p.lock) {
      if (++p.good >= 3) {
        r.setQuality(Math.min(1, +(r.quality + 0.1).toFixed(2)));
        this.updateCamera(true);
        p.good = 0; p.lock = t + 30000;
      }
    } else if (p.fast <= 80) p.good = 0;
    p.n = p.slow = p.fast = 0;
  }

  step() {
    const inp = this.input;
    inp.poll();
    this.frame++;
    if (this.slowmoT > 0) this.slowmoT--;
    switch (this.state) {
      case 'play':
        if (inp.pressed.pause) return this.openMenu('pause');
        if (inp.pressed.map) return this.openMenu('map');
        if (inp.pressed.build) this.build.toggle();
        this.updatePlay();
        break;
      case 'dialog':
        this.ui.updateDialog(this.audio);
        if (inp.pressed.jump || inp.pressed.attack || inp.pressed.interact || inp.pressed.up) this.advanceDialog();
        this.ambientStep();
        break;
      case 'banner':
        this.bannerTimer--;
        this.ambientStep();
        if (this.bannerTimer <= 0 && (inp.pressed.jump || inp.pressed.attack || inp.pressed.interact || inp.pressed.pause)) this.closeBanner();
        break;
      case 'pause':
      case 'map':
        if (inp.pressed.pause || (this.state === 'map' && (inp.pressed.map || inp.pressed.jump))) this.closeMenu();
        break;
      case 'shop':
        if (inp.pressed.pause) this.closeShop();
        break;
      case 'chat':
        if (inp.pressed.pause) this.closeChat();
        break;
      case 'craft':
        if (inp.pressed.pause) this.craft.close();
        break;
      case 'dead':
        this.deathTimer--;
        this.particles.update();
        if (this.deathTimer === 40) this.finishDeath();
        if (this.deathTimer <= 0) this.state = 'play';
        break;
    }
  }

  ambientStep() {
    this.particles.update();
    this.renderer.updateAmbient(this, this.cam.x, this.cam.y);
  }

  updatePlay() {
    const p = this.player;
    this.save.playTime++;
    if (this.transition) {
      this.updateTransition();
      if (this.transition && this.transition.phase === 'out') return;
    }
    if (this.hitstopTimer > 0) { this.hitstopTimer--; return; }
    if (this.spikeTimer > 0) {
      this.spikeTimer--;
      if (this.spikeTimer === 20) {
        p.x = p.lastSafe.x; p.y = p.lastSafe.y; p.vx = p.vy = 0;
        p.dashTimer = 0; p.hurtTimer = 0; p.attackTimer = 0;
        p.invuln = Math.max(p.invuln, 50);
        this.updateCamera(true);
      }
      this.ambientStep();
      return;
    }

    this.hostileBoxes.length = 0;
    if (this.net.puppet && this.net.remoteBoxes) this.hostileBoxes.push(...this.net.remoteBoxes);
    p.update(this);

    const puppet = this.net.puppet;
    for (const e of this.enemies) if (!e.dead) { if (puppet) e.puppetStep(); else e.update(this); }
    for (const e of this.entities) e.update(this);
    for (const c of this.coins) c.update(this);
    for (const pr of this.projectiles) pr.update(this);
    this.resolveProjectiles();
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.entities = this.entities.filter((e) => !e.dead);
    this.coins = this.coins.filter((c) => !c.dead);
    this.projectiles = this.projectiles.filter((pr) => !pr.dead);

    // Chefe acorda quando o herói entra na arena
    if (this.bossPending && (p.onGround || p.inWater) && this.net.isHost()) {
      // A luta começa quando o herói passa do portão (a entrada pode ser pela esquerda ou pela direita).
      const inside = this.room.bossSide === 'right' ? p.x < (this.room.w - 7) * TILE : p.x > 6 * TILE;
      if (inside) this.startBoss();
    }
    this.net.update();

    // Dano por contato e golpes dos inimigos
    const hb = this.hurtbox();
    for (const e of this.enemies)
      if (!e.dead && e.state !== 'intro' && (e.alpha == null || e.alpha > 0.5) && overlap(hb, e)) this.damagePlayer(e.contact, e.cx);
    for (const b of this.hostileBoxes) if (overlap(hb, b)) this.damagePlayer(1, b.x + b.w / 2);

    this.ai.update();
    this.raids.update();
    this.updateChallenge();
    for (const b of this.bubbles) b.t--;
    this.bubbles = this.bubbles.filter((b) => b.t > 0 && !b.target.dead);

    this.updateInteract();
    if (this.state !== 'play') return;
    this.checkExit();
    this.updateCamera(false);
    this.particles.update();
    this.renderer.updateAmbient(this, this.cam.x, this.cam.y);
    this.ui.updateHud(this);
  }

  hurtbox() {
    const p = this.player;
    return { x: p.x + 3, y: p.y + 5, w: p.w - 6, h: p.h - 6 };
  }

  // ───────── Combate ─────────
  playerAttack(box, dir, hitSet) {
    const p = this.player;
    let solidHit = false, pogo = false, enemyHit = false;
    for (const e of this.enemies) {
      if (e.dead || hitSet.has(e) || !overlap(box, e)) continue;
      if (e.alpha != null && e.alpha < 0.5) continue;
      hitSet.add(e);
      const kx = dir === 'side' ? p.facing : sign(e.cx - p.cx) * 0.4;
      const ky = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
      this.hitEnemy(e, this.swordDamage(), kx, ky);
      if (!enemyHit) this.ai.record(dir);
      enemyHit = true;
      if (dir === 'down') { pogo = true; if (e.isBoss) this.bossLine(e, 'pogo'); }
      this.soul = Math.min(SOUL_MAX, this.soul + Math.round(SOUL_PER_HIT * (this.hasCharm('alma_faminta') ? 1.5 : 1)));
      const hx = clamp(p.cx + (dir === 'side' ? p.facing * 30 : 0), e.x, e.x + e.w);
      const hy = clamp(dir === 'up' ? p.y - 20 : dir === 'down' ? p.y + p.h + 20 : p.cy, e.y, e.y + e.h);
      this.particles.burst(hx, hy, 10, { type: 'spark', color: ['#ffffff', '#fff1c9'], speed: 7, speedMin: 3, life: 12, drag: 0.85, glow: true });
      this.particles.ring(hx, hy, '#ffffff', 4, 3, 10);
    }
    if (enemyHit) {
      this.audio.play('hit');
      this.hitstop(4);
      this.shake(3);
      this.input.vibrate(25);
    }
    for (const r of this.entities) {
      if (typeof r.hit !== 'function' || hitSet.has(r) || !overlap(box, r.box())) continue;
      hitSet.add(r); r.hit(this); if (!r.kind) solidHit = true; // coletar não empurra o herói
      if (dir === 'down') pogo = true;
    }
    // Paredes e chãos quebráveis
    const room = this.room;
    const l = Math.floor(box.x / TILE), rr = Math.floor((box.x + box.w - 1) / TILE);
    const tp = Math.floor(box.y / TILE), bt = Math.floor((box.y + box.h - 1) / TILE);
    let spike = false;
    for (let ty = tp; ty <= bt; ty++)
      for (let tx = l; tx <= rr; tx++) {
        if (!room.inside(tx, ty)) continue;
        const t = room.tile(tx, ty);
        if (t === T.SPIKE && dir === 'down') spike = true;
        if (t !== T.BREAK) continue;
        const g = room.breakGroupAt(tx, ty);
        if (!g || hitSet.has(g)) continue;
        hitSet.add(g);
        solidHit = true;
        if (dir === 'down') pogo = true;
        this.hitBreakable(g, tx, ty);
      }
    if (spike) pogo = true;
    for (const pr of this.projectiles)
      if (pr.hostile && (pr.kind === 'blob' || pr.kind === 'debris') && overlap(box, pr.box())) {
        pr.dead = true;
        this.particles.burst(pr.x, pr.y, 6, { color: pr.color(), speed: 3, life: 14 });
      }

    if (pogo && !hitSet.has('pogo')) {
      hitSet.add('pogo');
      p.vy = PHYS.pogo; p.airDash = true; p.canDouble = true; p.jumpHeld = false;
      if (spike) this.audio.play('clank');
    }
    if ((enemyHit || solidHit) && dir === 'side' && !hitSet.has('recoil')) {
      hitSet.add('recoil');
      p.recoilX = -p.facing * (p.onGround ? 3.4 : 2.4);
    }
  }

  // Golpe num inimigo: o anfitrião aplica; o convidado mostra o efeito e avisa o anfitrião.
  hitEnemy(e, dmg, kx, ky) {
    if (this.net.puppet) {
      e.flash = 7;
      this.damageText(e.cx, e.y, dmg, !!e.isBoss);
      this.net.sendHit(e, dmg, kx, ky);
    } else e.hurt(this, dmg, kx, ky);
  }

  // Base compartilhada: aplica as construções do mundo (ou volta às do save local).
  applyWorldBuilds(builds) {
    this.world.applyBuilds(builds);
    if (!this.room) return;
    this.renderer.invalidateRoom(this.room);
    this.entities = this.entities.filter((e) => e.idx == null);
    for (const [idx, id] of this.room.placed) {
      const ent = makeBuilt(this.room, idx, id);
      if (ent) this.entities.push(ent);
    }
    this.build.refresh();
  }

  applyRemoteBuild(roomId, idx, id) {
    const room = this.world.byId[roomId];
    if (!room) return;
    const old = room.placed.get(idx);
    if (old) {
      room.placed.delete(idx);
      if (room.tiles[idx] !== T.EMPTY && !id) room.tiles[idx] = T.EMPTY;
    }
    if (id) {
      room.placed.set(idx, id);
      const it = makeBuilt(room, idx, id);
      if (!it) room.tiles[idx] = id === 'wood_plat' ? T.ONEWAY : T.SOLID;
    }
    if (room !== this.room) return;
    this.renderer.invalidateRoom(room);
    this.entities = this.entities.filter((e) => e.idx !== idx);
    if (id) { const ent = makeBuilt(room, idx, id); if (ent) this.entities.push(ent); }
    this.raids.checkSmith();
  }

  // Fala curta de um chefe (uma vez por luta): aparece como legenda.
  bossLine(boss, key) {
    const L = BOSS_LINES[boss.key];
    if (!L || !L[key] || boss.spoke[key]) return;
    boss.spoke[key] = true;
    this.ui.toast(`${L.who}: "${L[key]}"`, 2600);
  }

  spawnSmith() {
    if (this.room.id !== 'planicie_lar' || this.entities.some((e) => e.id === 'smith')) return;
    this.entities.push(new NPC(34 * TILE + TILE / 2, 13 * TILE, 'smith'));
    this.entities.push(new NPC(30 * TILE + TILE / 2, 13 * TILE, 'oren'));
    this.particles.burst(34 * TILE + TILE / 2, 12 * TILE, 20, { color: ['#ffd27a', '#ffffff'], speed: 3, life: 40, glow: true });
  }

  // ── Amuletos ──
  hasCharm(key) { return this.save.charms.equipped.includes(key); }

  acquireCharm(key) {
    const c = CHARMS[key];
    this.save.charms.owned[key] = true;
    this.persist();
    this.audio.play('pickup');
    this.input.vibrate(100);
    const p = this.player;
    this.particles.burst(p.cx, p.cy, 30, { color: [c.color, '#ffffff'], speed: 6, life: 40, glow: true });
    this.openBanner(c.icon, `Amuleto: ${c.name}`, c.desc, 'Equipe em Pausa → Amuletos, descansando numa fogueira.');
  }

  // Pegou um amuleto (se estava num desafio, também paga a recompensa).
  collectCharm(key) {
    const room = this.room;
    if (room.challenge && this.challenge.active) {
      this.save.collected['challenge:' + room.id] = true;
      this.save.geo += room.challenge.reward;
      this.endChallenge();
      this.ui.toast(`Desafio concluído! +${room.challenge.reward} moedas`, 3500);
      this.entities = this.entities.filter((e) => !(e.constructor.name === 'ChallengeSeal'));
    }
    this.acquireCharm(key);
  }

  // ── Desafio cronometrado ──
  updateChallenge() {
    const room = this.room, c = room.challenge, ch = this.challenge;
    if (!c) { if (ch.active) this.endChallenge(); return; }
    const start = room.entities.find((e) => e.ch === 'T');
    const p = this.player;
    if (start && !this.save.collected['challenge:' + room.id]) {
      const sx = start.tx * TILE + TILE / 2;
      const near = Math.abs(p.cx - sx) < 34 && Math.abs(p.y + p.h - (start.ty + 1) * TILE) < 40;
      if (!near) ch.armed = true;
      if (near && ch.armed && !ch.active) {
        ch.active = true; ch.armed = false; ch.t = c.seconds * 60;
        this.audio.play('door');
        this.ui.toast(`Desafio! Alcance o amuleto em ${c.seconds} segundos`, 2500);
      }
    }
    if (ch.active) {
      this.ui.setChallenge(Math.ceil(ch.t / 60));
      if (--ch.t <= 0) {
        this.endChallenge();
        this.audio.play('deny');
        this.ui.toast('Tempo esgotado! Volte ao selo para tentar de novo.', 3000);
      }
    }
  }

  endChallenge() {
    this.challenge.active = false;
    this.ui.setChallenge(null);
  }

  // Dano do golpe: espada equipada x afiação da Mira.
  swordDamage() {
    return Math.round(WEAPONS[this.save.weapon || 'errante'].dmg * this.save.nail * classOf(this.save).dmg * 10) / 10;
  }

  hitBreakable(g, tx, ty) {
    g.hp--;
    const x = tx * TILE + TILE / 2, y = ty * TILE + TILE / 2;
    const pal = AREAS[this.room.area];
    this.particles.burst(x, y, 8, { color: [pal.groundHi, pal.ground], speed: 4, grav: 0.25, life: 24 });
    this.audio.play('rock');
    this.shake(4);
    if (g.hp > 0) return;
    this.room.breakGroup(g);
    this.save.broken[g.id] = true;
    this.renderer.invalidateRoom(this.room);
    this.audio.play('break');
    this.shake(8);
    for (const c of g.cells) {
      const cx = (c % this.room.w) * TILE + TILE / 2, cy = Math.floor(c / this.room.w) * TILE + TILE / 2;
      this.particles.burst(cx, cy, 6, { color: [pal.groundHi, pal.ground, pal.top], speed: 5, grav: 0.3, life: 40, size: 4 });
    }
    this.ui.toast('Uma passagem secreta!');
    this.persist();
  }

  resolveProjectiles() {
    const hb = this.hurtbox();
    for (const pr of this.projectiles) {
      if (pr.dead) continue;
      if (pr.hostile) {
        if (overlap(pr.box(), hb)) { this.damagePlayer(pr.dmg, pr.x); if (pr.kind !== 'wave') pr.dead = true; }
      } else {
        for (const e of this.enemies) {
          if (e.dead || pr.hitSet.has(e) || !overlap(pr.box(), e)) continue;
          pr.hitSet.add(e);
          this.hitEnemy(e, pr.dmg, sign(pr.vx), 0);
          if (pr.soul) this.soul = Math.min(SOUL_MAX, this.soul + SOUL_PER_HIT);
          this.audio.play('hit');
          this.particles.burst(e.cx, e.cy, 10, { type: 'spark', color: '#bfe9ff', speed: 6, life: 14, glow: true });
          if (!pr.pierce) pr.dead = true;
        }
      }
    }
  }

  spawnProjectile(pr) { this.projectiles.push(pr); }

  // Tiro do arqueiro (flecha) ou do mago (orbe). dir: 'side' | 'up'.
  spawnShot(p, kind, dir) {
    const up = dir === 'up';
    const sp = kind === 'arrow' ? 13 : 8.5;
    const x = p.cx + (up ? 0 : p.facing * 14), y = up ? p.y - 4 : p.cy - 4;
    const pr = new Projectile(x, y, up ? 0 : p.facing * sp, up ? -sp : 0, {
      kind, r: kind === 'arrow' ? 5 : 8, life: kind === 'arrow' ? 42 : 56, hostile: false,
      dmg: this.swordDamage(), grav: kind === 'arrow' ? 0.03 : 0,
    });
    pr.soul = true;
    this.projectiles.push(pr);
    this.audio.play(kind === 'arrow' ? 'spit' : 'orb');
    this.particles.burst(x, y, 5, { color: kind === 'arrow' ? ['#e8dcc0', '#ffffff'] : ['#d7b8ff', '#ffffff'], speed: 2.5, life: 10, glow: true });
  }

  spawnSpell(x, y, dir) {
    const C = classOf(this.save);
    if (C.shot === 'arrow') {
      // Chuva de flechas: três flechas em leque que atravessam os inimigos.
      for (const vy of [-2.2, 0, 2.2]) {
        const a = new Projectile(x, y, dir * 12, vy, { kind: 'arrow', r: 5, life: 48, hostile: false, dmg: C.spellDmg, pierce: true });
        this.projectiles.push(a);
      }
      return;
    }
    const pr = new Projectile(x, y, dir * 10, 0, { kind: 'spell', r: C.shot === 'bolt' ? 13 : 10, life: 55, hostile: false, dmg: C.spellDmg, pierce: true });
    this.projectiles.push(pr);
    this.particles.burst(x, y, 12, { color: ['#bfe9ff', '#ffffff'], speed: 4, life: 18, glow: true });
  }

  hostileBox(b) { this.hostileBoxes.push(b); }
  hitstop(n) { this.hitstopTimer = Math.max(this.hitstopTimer || 0, n); }
  shake(n) { this.shakeMag = Math.max(this.shakeMag, n); }

  damagePlayer(dmg, fromX) {
    const p = this.player;
    if (p.invuln > 0 || p.dead || this.state !== 'play' || this.spikeTimer > 0) return;
    this.masks -= dmg;
    this.ai.record('hurt');
    p.hurt(fromX);
    this.hitstop(9);
    this.shake(9);
    this.audio.play('hurt');
    this.input.vibrate(90);
    this.particles.burst(p.cx, p.cy, 14, { color: ['#0b0910', '#ffffff'], speed: 6, life: 24, drag: 0.9 });
    this.ui.updateHud(this);
    if (this.masks <= 0) this.die();
  }

  spikeHit() {
    const p = this.player;
    if (p.dead || this.spikeTimer > 0) return;
    if (p.invuln <= 0) {
      this.masks -= 1;
      this.audio.play('hurt');
      this.input.vibrate(90);
      this.shake(8);
      p.flash = 8;
      this.particles.burst(p.cx, p.cy, 12, { color: ['#0b0910', '#ffffff'], speed: 5, life: 22 });
      this.ui.updateHud(this);
      if (this.masks <= 0) return this.die();
    }
    this.spikeTimer = 40;
  }

  heal() {
    this.soul -= SOUL_COST;
    this.ai.record('heal');
    this.masks = Math.min(this.save.masksMax, this.masks + 1);
    this.audio.play('heal');
    this.input.vibrate(30);
    const p = this.player;
    this.particles.burst(p.cx, p.cy, 18, { color: ['#ffffff', '#cfe8ff'], speed: 4, life: 30, glow: true });
    this.particles.ring(p.cx, p.cy, '#e6f3ff', 8, 2.5, 18);
  }

  die() {
    const p = this.player;
    p.dead = true;
    this.state = 'dead';
    this.ai.onDeath(this.room.id);
    this.deathCount = (this.deathCount || 0) + 1;
    this.deathTimer = 110;
    this.audio.play('death');
    this.input.vibrate(200);
    this.particles.burst(p.cx, p.cy, 30, { color: ['#0b0910', '#ffffff', this.save.profile.cloak], speed: 7, life: 50, grav: 0.1 });
    // Sem moedas a levar, a lápide anterior continua esperando (não se perde o que já estava guardado).
    if (this.save.geo > 0) this.save.shade = { room: this.room.id, x: p.lastSafe.x + p.w / 2, y: p.lastSafe.y + p.h, geo: this.save.geo };
    this.save.geo = 0;
    if (this.boss) this.boss = null;
    this.persist();
  }

  finishDeath() {
    this.masks = this.save.masksMax;
    this.soul = 0;
    this.respawn();
    this.ui.resetHud();
    this.ui.updateHud(this);
    if (this.save.shade) setTimeout(() => this.ui.toast('Sua lápide guarda as moedas perdidas. Volte até ela.'), 900);
    else setTimeout(() => this.ui.toast(this.deathCount % 2 ? 'Você esquece... por um instante.' : 'Alguém lembrou.'), 900);
  }

  dropGeo(x, y, amount) {
    const n = Math.min(amount, 10);
    let left = amount;
    for (let i = 0; i < n; i++) {
      const v = i === n - 1 ? left : Math.max(1, Math.floor(amount / n));
      left -= v;
      this.coins.push(new GeoCoin(x + rand(-6, 6), y + rand(-6, 6), v));
    }
  }

  dropResource(x, y, kind, n) {
    for (let i = 0; i < n; i++) this.coins.push(new ItemDrop(x + rand(-6, 6), y + rand(-6, 6), kind, 1));
  }

  collectResource(kind, n, x, y) {
    this.save.inv[kind] = (this.save.inv[kind] || 0) + n;
    this.audio.play('pickup_small');
    this.floatText(x, y - 10, `+${n} ${RESOURCES[kind].name}`, RESOURCES[kind].color);
    this.build.refresh();
  }

  damageText(x, y, n, big = false) {
    this.floaters.push({ x: x + rand(-6, 6), y: y - 4, vy: -1.6, text: String(n), color: big ? '#ffd36e' : '#ffffff', t: 45, key: null, dmg: true, big });
  }

  slowmo(frames) { this.slowmoT = Math.max(this.slowmoT, frames); }
  zoomPunch(z) { this.zoom = Math.max(this.zoom, z); }

  // Zoom rápido da tela (feito no CSS do canvas: não custa nada para desenhar).
  applyZoom() {
    const c = this.renderer.canvas;
    if (this.zoom < 0.002) {
      if (this.zoomOn) { c.style.transform = ''; this.zoomOn = false; }
      this.zoom = 0;
      return;
    }
    const r = this.renderer, p = this.player;
    const ox = ((p.cx - this.cam.x) / r.viewW) * 100, oy = ((p.cy - this.cam.y) / r.viewH) * 100;
    c.style.transformOrigin = `${ox}% ${oy}%`;
    c.style.transform = `scale(${1 + this.zoom})`;
    this.zoomOn = true;
    this.zoom *= 0.88;
  }

  floatText(x, y, text, color = '#f4efe6') {
    // Junta coletas seguidas do mesmo item num texto só.
    const f = this.floaters.find((o) => o.key === text.replace(/^\+\d+ /, '') && o.t > 40);
    if (f) {
      f.n += 1;
      f.text = `+${f.n} ${f.key}`;
      f.t = 70; f.x = x; f.y = y;
      return;
    }
    const m = text.match(/^\+(\d+) (.*)$/);
    this.floaters.push({ x, y, text, color, t: 70, key: m ? m[2] : text, n: m ? Number(m[1]) : 1 });
  }

  drawFloaters(ctx) {
    ctx.save();
    ctx.font = '700 10px "Cinzel", serif';
    ctx.textAlign = 'center';
    for (const f of this.floaters) {
      f.t--;
      if (f.dmg) { f.y += f.vy; f.vy += 0.08; ctx.font = f.big ? '900 15px "Cinzel", serif' : '900 11px "Cinzel", serif'; }
      else { f.y -= 0.35; ctx.font = '700 10px "Cinzel", serif'; }
      ctx.globalAlpha = Math.min(1, f.t / 20);
      ctx.fillStyle = 'rgba(8,6,12,0.75)';
      ctx.fillText(f.text, f.x + 1, f.y + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    this.floaters = this.floaters.filter((f) => f.t > 0);
    ctx.restore();
  }

  collectGeo(v) {
    this.save.geo += v;
    this.audio.play('geo');
  }

  recoverShade(sh) {
    this.save.geo += sh.geo;
    this.save.shade = null;
    this.audio.play('heal');
    this.particles.burst(sh.x, sh.y - 20, 24, { color: ['#ffffff', '#9b8fb5'], speed: 5, life: 34, glow: true });
    this.ui.toast(`Você recuperou ${sh.geo} moedas`);
    this.persist();
  }

  // ───────── Interações ─────────
  updateInteract() {
    const p = this.player;
    let target = null;
    if (p.onGround && !p.sitting && p.attackTimer <= 0) {
      // O objeto interativo mais próximo vence (bancada, baú e forja podem ficar lado a lado).
      let best = Infinity;
      for (const e of this.entities)
        if (e.interact && e.near(p) && Math.abs(e.x - p.cx) < best) { target = e; best = Math.abs(e.x - p.cx); }
    }
    this.interactTarget = target;
    this.ui.setInteract(target ? target.label : null);
    if (target && (this.input.pressed.interact || this.input.pressed.up)) {
      this.input.consume('interact');
      target.interact(this);
    }
  }

  restAtBench(bench) {
    const p = this.player;
    p.sitting = true;
    p.x = bench.x - p.w / 2 - 20;
    p.facing = 1;
    p.y = bench.y - p.h;
    p.vx = p.vy = 0;
    this.masks = this.save.masksMax;
    this.save.bench = { room: this.room.id, x: p.x, y: p.y };
    const bid = `${this.room.id}:${Math.round(bench.x)}`;
    const lembrada = !!this.save.brasas[bid];
    this.save.brasas[bid] = true;
    this.audio.play('bench');
    this.particles.burst(bench.x, bench.y - 20, 16, { color: ['#ffd27a', '#ffffff'], speed: 2.5, life: 40, glow: true, grav: -0.03 });
    this.persist();
    this.ui.toast(lembrada ? 'A brasa ainda lembra.' : 'A brasa lembrou de você.');
    this.ui.updateHud(this);
  }

  talkTo(npc) {
    const lines = npc.data.lines(this);
    this.showDialog(npc.data.name, lines, () => {
      this.save.talked[npc.id] = true;
      this.persist();
      if (this.ai.enabled) this.openChat(npc);
      else if (npc.data.shop) this.openShop();
      else if (npc.data.trade) this.craft.openSmith();
    });
  }

  showDialog(speaker, lines, onDone) {
    this.state = 'dialog';
    this.ui.setInteract(null);
    this.ui.openDialog(speaker, lines, () => {
      if (this.state === 'dialog') this.state = 'play';
      if (onDone) onDone();
    });
  }

  advanceDialog() { this.ui.advanceDialog(); }

  acquireAbility(key) {
    this.save.abilities[key] = true;
    this.persist();
    const a = ABILITIES[key];
    this.audio.play('pickup');
    this.input.vibrate(120);
    const p = this.player;
    this.particles.burst(p.cx, p.cy, 40, { color: ['#bfe9ff', '#ffffff'], speed: 8, life: 50, glow: true });
    this.ui.refreshButtons(this.save.abilities);
    this.openBanner(a.icon, a.name, a.desc, a.keys);
  }

  collectMask(id) {
    this.save.collected[id] = true;
    this.save.masksMax++;
    this.masks = this.save.masksMax;
    this.persist();
    this.audio.play('pickup');
    this.ui.resetHud();
    this.openBanner('♥', 'Cristal de Vida', 'Sua vida máxima aumentou em um coração.', '');
  }

  openBanner(icon, title, desc, keys) {
    this.state = 'banner';
    this.bannerTimer = 45;
    this.ui.setInteract(null);
    this.ui.showBanner(icon, title, desc, keys);
  }

  closeBanner() {
    this.ui.hideBanner();
    this.state = 'play';
    this.input.consume('jump');
    this.input.consume('attack');
  }

  // ───────── Chefes ─────────
  startBoss() {
    const b = this.bossPending;
    this.bossPending = null;
    const boss = new (BOSS_TYPES[b.type] || MINI_TYPES[b.type])(b.x, b.y);
    boss.eid = 'boss';
    this.enemies.push(boss);
    this.boss = boss;
    this.room.doorsClosed = true;
    this.audio.play('door');
    this.shake(6);
    this.ui.bossTitle(boss.title, boss.subtitle);
    this.audio.intense = true;
    this.ai.onBossStart();
  }

  onBossDefeated(key) {
    this.save.bosses[key] = true;
    this.room.doorsClosed = false;
    this.audio.intense = false;
    this.persist();
    setTimeout(() => this.audio.play('door'), 900);
    const L = BOSS_LINES[key];
    const depois = () => {
      if (key.startsWith('mini_')) {
        // Mini-chefe: Fragmento de Vida (+1 coração) e a câmara se abre.
        this.save.masksMax++;
        this.masks = this.save.masksMax;
        this.persist();
        this.audio.play('pickup');
        this.particles.burst(this.player.cx, this.player.cy, 30, { color: ['#ffffff', '#ffd27a'], speed: 6, life: 40, glow: true });
        this.ui.updateHud(this);
        this.ui.toast('Fragmento de Vida! +1 coração', 3500);
      } else if (key === 'tide') this.acquireCharm('mare_viva');
      else if (key === 'king') {
        this.save.finished = true;
        this.persist();
        if (this.onEnding) this.onEnding();
      } else this.ui.toast('O caminho está livre.');
    };
    // Últimas palavras do chefe, depois do efeito de morte.
    setTimeout(() => {
      if (L && L.death && this.state === 'play') this.showDialog(L.who, L.death, depois);
      else depois();
    }, 1800);
  }

  // ───────── Menus ─────────
  openMenu(kind) {
    this.state = kind;
    document.body.classList.add('menu-open');
    if (kind === 'map') {
      this.ui.show(this.ui.mapScreen);
      this.ui.drawMap(this);
    } else {
      // A pausa sempre abre na tela de botões (não nas opções).
      document.querySelector('.pause-main').classList.remove('hidden');
      document.querySelector('.pause-opts').classList.add('hidden');
      document.querySelector('#pause-title').textContent = 'Pausado';
      this.ui.show(document.querySelector('#pause-screen'));
    }
  }

  closeMenu() {
    document.body.classList.remove('menu-open');
    this.ui.show(this.ui.mapScreen, false);
    this.ui.show(document.querySelector('#pause-screen'), false);
    this.state = 'play';
    this.input.consume('jump');
  }

  openShop() {
    this.state = 'shop';
    document.body.classList.add('menu-open');
    this.ui.openShop(this);
  }

  closeShop() {
    this.ui.show(this.ui.shopScreen, false);
    document.body.classList.remove('menu-open');
    this.state = 'play';
  }

  // ───────── Conversa livre (Gemini) ─────────
  openChat(npc) {
    this.state = 'chat';
    document.body.classList.add('menu-open');
    this.ui.openChat(npc, this.ai.histories[npc.id] || [], {
      send: (text) => this.ai.npcReply(npc.id, text),
      shop: npc.data.shop ? () => { this.closeChat(); this.openShop(); } : npc.data.trade ? () => { this.closeChat(); this.craft.openSmith(); } : null,
      close: () => this.closeChat(),
      sound: () => this.audio.play('talk'),
    });
  }

  closeChat() {
    this.ui.closeChat();
    document.body.classList.remove('menu-open');
    if (this.state === 'chat') this.state = 'play';
  }

  // Balão de fala acima de um inimigo/chefe (falas geradas pela IA).
  say(target, text) {
    if (this.frame - (this.lastSay || -999) < 480) return;
    this.lastSay = this.frame;
    this.bubbles = [{ target, text, t: 240 }];
  }

  drawBubbles(ctx) {
    for (const b of this.bubbles) {
      const e = b.target;
      const a = Math.min(1, b.t / 30, (240 - b.t) / 15);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = 'italic 600 11px "Cormorant Garamond", serif';
      ctx.textAlign = 'center';
      const w = Math.min(260, ctx.measureText(b.text).width + 16);
      const x = Math.max(w / 2 + 4, Math.min(this.room.pxW - w / 2 - 4, e.cx));
      const y = e.y - 34;
      ctx.fillStyle = 'rgba(8,6,12,0.82)';
      ctx.fillRect(x - w / 2, y - 12, w, 18);
      ctx.fillStyle = '#ffd36e';
      ctx.fillText(b.text, x, y + 1, w - 10);
      ctx.restore();
    }
  }

  // ───────── Câmera ─────────
  updateCamera(snap) {
    if (!this.room) return;
    const p = this.player, r = this.renderer, room = this.room;
    const vw = r.viewW, vh = r.viewH;
    const idle = p.onGround && Math.abs(p.vx) < 0.1 && !p.sitting;
    if (idle && (this.input.held.up || this.input.held.down) && !this.interactTarget) this.lookTimer = (this.lookTimer || 0) + 1;
    else this.lookTimer = 0;
    const lookTarget = this.lookTimer > 30 ? (this.input.held.up ? -100 : 100) : 0;
    this.lookY = (this.lookY || 0) + (lookTarget - (this.lookY || 0)) * 0.08;
    let tx = p.cx + p.facing * 30 - vw / 2;
    let ty = p.cy - vh * 0.55 + this.lookY;
    tx = room.pxW <= vw ? (room.pxW - vw) / 2 : clamp(tx, 0, room.pxW - vw);
    ty = room.pxH <= vh ? (room.pxH - vh) / 2 : clamp(ty, 0, room.pxH - vh);
    if (!isFinite(tx) || !isFinite(ty)) return;
    if (snap || !isFinite(this.cam.x) || !isFinite(this.cam.y)) { this.cam.x = tx; this.cam.y = ty; }
    else {
      this.cam.x += (tx - this.cam.x) * 0.1;
      this.cam.y += (ty - this.cam.y) * (p.vy > 6 ? 0.25 : 0.12);
    }
  }

  // ───────── Desenho ─────────
  render() {
    if (!this.room) return;
    const r = this.renderer, ctx = r.ctx, s = r.scale;
    let sx = 0, sy = 0;
    if (this.shakeMag > 0.2) {
      sx = rand(-1, 1) * this.shakeMag; sy = rand(-1, 1) * this.shakeMag;
      if (this.state === 'play' || this.state === 'dead') this.shakeMag *= 0.86;
    } else this.shakeMag = 0;
    const camX = Math.round((this.cam.x + sx) * s) / s;
    const camY = Math.round((this.cam.y + sy) * s) / s;

    r.drawBackground(this, camX, camY);
    r.drawTiles(this, camX, camY);
    ctx.setTransform(s, 0, 0, s, -camX * s, -camY * s);
    r.drawDoors(ctx, this.room, this.frame);
    for (const e of this.entities) e.draw(ctx, this);
    this.net.drawPlayers(ctx);
    const pal = AREAS[this.room.area];
    for (const e of this.enemies) e.draw(ctx, pal);
    for (const c of this.coins) c.draw(ctx);
    if (!this.player.dead) this.player.draw(ctx, this);
    for (const pr of this.projectiles) pr.draw(ctx);
    r.drawWater(ctx, this, camX, camY);
    this.particles.draw(ctx);
    r.drawAmbient(ctx, this);
    this.drawBubbles(ctx);
    if (this.interactTarget && !this.input.touchMode && this.state === 'play') this.drawPrompt(ctx, this.interactTarget);
    r.drawLighting(this, camX, camY);
    ctx.setTransform(s, 0, 0, s, -camX * s, -camY * s);
    this.drawLights(ctx);
    this.drawFloaters(ctx);
    if (this.build.active) this.build.draw(ctx);
    this.applyZoom();

    // Escurecimento (transição, espinhos, morte)
    let fade = 0;
    if (this.transition) fade = this.transition.phase === 'out' ? this.transition.t / 8 : 1 - this.transition.t / 14;
    if (this.spikeTimer > 0) fade = this.spikeTimer > 20 ? (40 - this.spikeTimer) / 20 : this.spikeTimer / 20;
    if (this.state === 'dead') fade = this.deathTimer > 40 ? 1 - (this.deathTimer - 40) / 70 : this.deathTimer / 40;
    if (fade > 0) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = `rgba(0,0,0,${clamp(fade, 0, 1)})`;
      ctx.fillRect(0, 0, r.canvas.width, r.canvas.height);
    }
  }

  // Brilho quente de tochas e fogueiras, que atravessa a escuridão das cavernas.
  drawLights(ctx) {
    const dark = Math.max(AREAS[this.room.area].dark, this.raids.night);
    if (dark < 0.05) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const e of this.entities) {
      if (!e.light) continue;
      const g = ctx.createRadialGradient(e.x, e.y - 18, 4, e.x, e.y - 18, 110 * e.light);
      g.addColorStop(0, `rgba(255,170,80,${0.32 * dark})`);
      g.addColorStop(1, 'rgba(255,150,70,0)');
      ctx.fillStyle = g;
      ctx.fillRect(e.x - 120, e.y - 140, 240, 240);
    }
    ctx.restore();
  }

  // Converte um ponto da tela (CSS px) em coordenadas do mundo da sala.
  screenToWorld(sx, sy) {
    const r = this.renderer, c = r.canvas.getBoundingClientRect();
    return {
      x: this.cam.x + ((sx - c.left) * (r.canvas.width / c.width)) / r.scale,
      y: this.cam.y + ((sy - c.top) * (r.canvas.height / c.height)) / r.scale,
    };
  }

  drawPrompt(ctx, e) {
    const y = e.y - 58 + Math.sin(this.frame * 0.08) * 2;
    ctx.font = '600 10px "Cinzel", serif';
    ctx.textAlign = 'center';
    const text = `${e.label}  [↑]`;
    const w = ctx.measureText(text).width + 14;
    ctx.fillStyle = 'rgba(8,6,12,0.7)';
    ctx.fillRect(e.x - w / 2, y - 11, w, 16);
    ctx.fillStyle = '#f4efe6';
    ctx.fillText(text, e.x, y + 1);
  }
}
