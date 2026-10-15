// Núcleo do jogo: salas, transições, combate, câmera e estados.
import { TILE, T, AREAS, ABILITIES, PHYS, SOUL_MAX, SOUL_PER_HIT, SOUL_COST, RESOURCES, WEAPONS, CHARMS, RARITY, ARMORS, giveWeapon, equipArmor, nearBench, FRAGMENTS_PER_HEART } from './config.js';
import { World } from './world.js';
import { Player } from './player.js';
import { ENEMY_TYPES, Projectile } from './enemies.js';
import './enemies2.js';
import { BOSS_TYPES } from './bosses.js';
import { MINI_TYPES } from './minibosses.js';
import { SOBERANOS } from './soberanos.js';
import { spawnRoomEntities, GeoCoin, Tombstone, ItemDrop, Campfire } from './entities.js';
import { CraftUI } from './crafting.js';
import { Invasions } from './invasions.js';
import { Hordas } from './hordas.js';
import { Net } from './net.js';
import { scheduleUpload } from './cloud.js';
import { Particles } from './fx.js';
import { Renderer } from './render.js';
import { AIDirector } from './ai.js';
import { writeSave } from './save.js';
import { BOSS_LINES } from './story.js';
import { MEMORIAS, TIPOS, REINOS, MEMORIAS_POR_REINO } from './memorias.js';
import { Cutscene } from './cutscene.js';
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
    this.craft = new CraftUI(this);
    this.invasions = new Invasions(this);
    this.hordas = new Hordas(this);
    this.cutscene = new Cutscene(this);
    this.invSeq = 0;
    // O que já foi derrotado/colhido desde o último descanso: volta ao sentar numa fogueira ou ao morrer.
    this.spent = { enemies: new Set(), nodes: new Set() };
    this.net = new Net(this);
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
    // Saves de quando o manto ficava num altar: quem já venceu o Cavaleiro de Musgo recebe o dash.
    if (save.bosses.moss && !save.abilities.dash) save.abilities.dash = true;
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
        // Abertura: cena curta e, depois dela, a dica dos controles.
        setTimeout(() => this.playCutscene('abertura', () => this.ui.toast(this.input.touchMode
          ? 'Joystick: mover  ·  ▲ pular  ·  ⚔ atacar  ·  segure ✦ para curar'
          : 'A D mover · Espaço pular · clique para atacar · segure o botão direito para curar · Esc → manual', 6500)), 400);
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
    this.entities = spawnRoomEntities(room, this.save, this.spent);
    this.enemies = [];
    for (const e of room.entities) {
      const E = ENEMY_TYPES[e.ch];
      if (!E || nearBench(room, e.tx, e.ty)) continue; // zona segura ao redor das fogueiras
      const sid = `${room.id}:${e.ch}${e.index}`;
      if (this.spent.enemies.has(sid)) continue;
      const en = new E(e.tx * TILE + TILE / 2, (e.ty + 1) * TILE);
      en.eid = e.ch + e.index; // identificador estável: igual para todos os jogadores
      en.sid = sid;
      this.enemies.push(en);
    }
    this.boss = null;
    this.bossPending = null;
    // Algumas salas têm um chefe antes do chefe (o Trono: Eliar antes de Alvar).
    const alvo = room.preBoss && !this.save.bosses[room.preBoss] ? room.preBoss : room.boss;
    if (alvo && !this.save.bosses[alvo]) {
      const k = room.entities.find((e) => e.ch === 'K');
      this.bossPending = { type: alvo, x: k.tx * TILE + TILE / 2, y: (k.ty + 1) * TILE };
    }
    const sh = this.save.shade;
    if (sh && sh.room === id) this.entities.push(new Tombstone(sh.x, sh.y, sh.geo));
    this.floaters = [];
    this.invasions.onRoomEnter(room);
    this.hordas.cancel();
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
      this.ui.areaTitle(a.name, `${REINOS[room.area].nome} · ${a.subtitle}`);
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
    const vertical = p.cy < 0 || p.cy >= room.pxH;
    this.transition = { t: 0, phase: 'out', next, gx: room.x * TILE + p.x, gy: room.y * TILE + p.y, goingUp, vertical };
  }

  // Acha o chão firme mais próximo da abertura por onde o herói entrou e o leva até lá com um pulinho.
  hopToLedge(up) {
    const r = this.room, p = this.player;
    const tx = Math.floor(p.cx / TILE), ty = Math.min(r.h - 1, Math.max(0, Math.floor((p.y + p.h / 2) / TILE)));
    let best = null, bd = Infinity;
    for (let dy = 0; dy <= 10; dy++) {
      const row = up ? ty - dy : ty + dy;
      if (row < 1 || row >= r.h - 1) continue;
      for (let dx = -6; dx <= 6; dx++) {
        const col = tx + dx;
        if (col < 1 || col >= r.w - 1) continue;
        const below = r.tile(col, row + 1);
        if (r.tile(col, row) !== T.EMPTY || r.tile(col, row - 1) !== T.EMPTY || (below !== T.SOLID && below !== T.ONEWAY)) continue;
        const d = dy * 1.5 + Math.abs(dx);
        if (d < bd) { bd = d; best = [col, row]; }
      }
    }
    if (!best) return false;
    p.x = best[0] * TILE + TILE / 2 - p.w / 2;
    p.y = (best[1] + 1) * TILE - p.h;
    p.vx = 0; p.vy = up ? -6 : -3; p.jumpHeld = false; p.airDash = true; p.canDouble = true;
    p.invuln = Math.max(p.invuln, 24);
    this.particles.dust(p.cx, p.y + p.h, 0, 7);
    this.audio.play('jump');
    return true;
  }

  updateTransition() {
    const tr = this.transition;
    tr.t++;
    if (tr.phase === 'out' && tr.t >= 8) {
      const { next } = tr;
      this.transitionKeep = true;
      this.enterRoom(next.id, tr.gx - next.x * TILE, tr.gy - next.y * TILE);
      // Ao trocar de área na vertical, o herói pula sozinho para a borda mais próxima da área nova.
      if (tr.vertical && this.hopToLedge(tr.goingUp)) { /* pousou na borda */ }
      else if (tr.goingUp) { this.player.vy = Math.min(this.player.vy, -11.5); this.player.jumpHeld = false; }
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
        if (inp.pressed.inv) return this.craft.openInventory();
        this.updatePlay();
        break;
      case 'cutscene':
        this.cutscene.update(inp);
        this.ambientStep();
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
    if (this.state !== 'play' && this.state !== 'off' && this.net.online) this.backgroundStep();
  }

  // O inimigo mira em quem estiver mais perto (você ou outro jogador da mesma sala).
  updateEnemy(e) {
    let target = this.player;
    if (this.net.online && this.net.players.size) {
      let best = target.dead ? Infinity : Math.hypot(e.cx - target.cx, e.cy - target.cy);
      for (const q of this.net.players.values()) {
        if (q.room !== this.room.id) continue;
        const d = Math.hypot(e.cx - q.cx, e.cy - q.cy);
        if (d < best) { best = d; target = q; }
      }
    }
    if (target === this.player) { e.update(this); return; }
    const real = this.player;
    this.player = target;
    try { e.update(this); } finally { this.player = real; }
  }

  // No multijogador o mundo não para quando você abre um menu, conversa ou morre:
  // os inimigos seguem agindo, o seu estado continua sendo enviado e os outros continuam jogando.
  backgroundStep() {
    const p = this.player;
    p.invuln = Math.max(p.invuln, 3); // menu aberto não leva dano
    this.hostileBoxes.length = 0;
    if (this.net.puppet && this.net.remoteBoxes) this.hostileBoxes.push(...this.net.remoteBoxes);
    const puppet = this.net.puppet;
    for (const e of this.enemies) if (!e.dead) { if (puppet) e.puppetStep(); else this.updateEnemy(e); }
    for (const c of this.coins) c.update(this);
    for (const pr of this.projectiles) pr.update(this);
    this.resolveProjectiles();
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.coins = this.coins.filter((c) => !c.dead);
    this.projectiles = this.projectiles.filter((pr) => !pr.dead);
    this.net.update();
    this.ai.update();
    this.invasions.update();
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
    for (const e of this.enemies) if (!e.dead) { if (puppet) e.puppetStep(); else this.updateEnemy(e); }
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
    this.invasions.update();
    this.hordas.update();
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

  // Fala curta de um chefe (uma vez por luta): aparece como legenda.
  bossLine(boss, key) {
    const L = BOSS_LINES[boss.key];
    if (!L || !L[key] || boss.spoke[key]) return;
    boss.spoke[key] = true;
    this.ui.toast(`${L.who}: "${L[key]}"`, 2600);
  }

  // Entrega o conteúdo de um baú de tesouro.
  giveLoot(loot) {
    const s = this.save, parts = [];
    if (loot.geo) { s.geo += loot.geo; parts.push(`${loot.geo} moedas`); }
    for (const [k, n] of Object.entries(loot.res || {})) { s.inv[k] = (s.inv[k] || 0) + n; parts.push(`${n} ${RESOURCES[k].name}`); }
    if (loot.armor && ARMORS[loot.armor].hearts > ARMORS[s.armor || 'none'].hearts) { equipArmor(s, loot.armor); this.masks = s.masksMax; parts.push(ARMORS[loot.armor].name); }
    this.persist();
    this.ui.resetHud();
    this.ui.updateHud(this);
    if (loot.weapon) {
      const w = WEAPONS[loot.weapon];
      giveWeapon(s, loot.weapon);
      this.persist();
      this.openBanner(w.kind === 'bow' ? '🏹' : w.kind === 'staff' ? '✦' : '⚔', w.name, w.desc, `${RARITY[w.rarity].name} · já equipada (troque no Inventário: Q)`);
      if (parts.length) this.ui.toast('Também: ' + parts.join(', '), 3500);
    } else this.ui.toast('Você achou: ' + parts.join(', '), 3500);
    if (loot.memoria) setTimeout(() => this.lerMemoria(loot.memoria), 900);
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
    return Math.round(WEAPONS[this.save.weapon || 'errante'].dmg * this.save.nail * 10) / 10;
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
        if (pr.visual) continue;
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
    this.net.sendShot(kind, x, y, pr.vx, pr.vy);
    this.audio.play(kind === 'arrow' ? 'spit' : 'orb');
    this.particles.burst(x, y, 5, { color: kind === 'arrow' ? ['#e8dcc0', '#ffffff'] : ['#d7b8ff', '#ffffff'], speed: 2.5, life: 10, glow: true });
  }

  spawnSpell(x, y, dir) {
    const pr = new Projectile(x, y, dir * 10, 0, { kind: 'spell', r: 10, life: 55, hostile: false, dmg: 3, pierce: true });
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
    this.invasions.onDeath();
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
    if (!this.net.online) this.respawnWorld(); // no multijogador a morte de um não renova o mundo de todos
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
      // O objeto interativo mais próximo vence (fogueira, personagem e placa podem ficar lado a lado).
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

  // Fogueira de uma chave "sala:x" guardada em save.brasas (ou null se não existe mais).
  benchFromKey(key) {
    const [roomId, bx] = key.split(':');
    const r = this.world.byId[roomId];
    if (!r) return null;
    const e = r.entities.find((q) => q.ch === 'B' && Math.abs(q.tx * TILE + TILE / 2 - Number(bx)) < 2);
    return e ? { room: r, ent: e } : null;
  }

  // Viagem rápida entre fogueiras já visitadas: chega sentado na fogueira de destino.
  travelTo(key) {
    const b = this.benchFromKey(key);
    if (!b) return;
    const p = this.player;
    const x = b.ent.tx * TILE + TILE / 2, y = (b.ent.ty + 1) * TILE;
    this.audio.play('tele');
    this.state = 'play';
    this.enterRoom(b.room.id, x - p.w / 2 - 20, y - p.h);
    const camp = this.entities.find((q) => q instanceof Campfire && Math.abs(q.x - x) < 4);
    if (camp) this.restAtBench(camp);
    this.updateCamera(true);
  }

  // Descansar (ou morrer) faz os monstros e os recursos voltarem.
  respawnWorld() {
    const had = this.spent.enemies.size + this.spent.nodes.size;
    this.spent.enemies.clear();
    this.spent.nodes.clear();
    return had;
  }

  restAtBench(bench) {
    const p = this.player;
    p.sitting = true;
    p.x = bench.x - p.w / 2 - 20;
    p.facing = 1;
    p.y = bench.y - p.h;
    p.vx = p.vy = 0;
    this.masks = this.save.masksMax;
    this.respawnWorld();
    this.net.sendRest();
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
      else if (npc.data.loja) this.craft.openNpcShop(npc.data.loja);
    });
  }

  showDialog(speaker, lines, onDone, tone) {
    this.state = 'dialog';
    this.ui.setInteract(null);
    this.ui.setDialogTone(tone);
    this.ui.openDialog(speaker, lines, () => {
      if (this.state === 'dialog') this.state = 'play';
      this.ui.setDialogTone(null);
      if (onDone) onDone();
    });
  }

  // ── Memórias: pedaços da história, cada um com a forma de quem o deixou ──
  lerMemoria(id) {
    const m = MEMORIAS[id];
    if (!m) return;
    const t = TIPOS[m.tipo];
    this.showDialog(`${t.nome} · ${m.titulo}`, m.linhas, () => this.registrarMemoria(id), t.cor);
  }

  // Primeira leitura: moedas, e a cada 5 Memórias um Fragmento de Vida; completar um reino rende mais.
  registrarMemoria(id) {
    const s = this.save, m = MEMORIAS[id];
    if (m.flag) s.talked[m.flag] = true;
    if (s.memorias[id]) { this.persist(); return; }
    s.memorias[id] = true;
    s.geo += 20;
    const total = Object.keys(s.memorias).length;
    const doReino = Object.keys(s.memorias).filter((k) => MEMORIAS[k] && MEMORIAS[k].regiao === m.regiao).length;
    this.ui.resetHud();
    this.ui.updateHud(this);
    this.audio.play('pickup_small');
    this.persist();
    this.ui.toast(`Memória registrada no Diário (${doReino}/${MEMORIAS_POR_REINO[m.regiao]} do ${REINOS[m.regiao].nome})`, 3200);
    setTimeout(() => {
      if (doReino === MEMORIAS_POR_REINO[m.regiao]) {
        s.geo += 150;
        this.addFragments(2);
        this.ui.toast(`Você reuniu todas as Memórias do ${REINOS[m.regiao].nome}!`, 4500);
      } else if (total % 6 === 0) this.addFragments(1);
    }, 900);
  }

  playCutscene(id, onDone) { this.cutscene.play(id, onDone); }

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
    this.addFragments(1);
  }

  // Fragmentos de Vida: cinco completam um coração.
  addFragments(n) {
    const s = this.save;
    s.fragments = (s.fragments || 0) + n;
    let hearts = 0;
    while (s.fragments >= FRAGMENTS_PER_HEART) { s.fragments -= FRAGMENTS_PER_HEART; s.masksMax++; hearts++; }
    this.persist();
    this.audio.play('pickup');
    this.ui.resetHud();
    if (hearts) {
      this.masks = s.masksMax;
      this.openBanner('♥', 'Coração completo!', 'Cinco fragmentos de vida se juntaram: sua vida máxima aumentou em um coração.', '');
    } else this.ui.toast(`Fragmento de Vida (${s.fragments}/${FRAGMENTS_PER_HEART})`, 3200);
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
    const boss = new (BOSS_TYPES[b.type] || MINI_TYPES[b.type] || SOBERANOS[b.type])(b.x, b.y);
    boss.eid = 'boss';
    if (boss.key === 'king') {
      // Cada alma libertada enfraquece a Roda, e Alvar com ela.
      const livres = Object.keys(this.save.livres).length;
      if (livres) boss.maxHp = boss.hp = Math.max(30, boss.maxHp - 4 * livres);
      this.playCutscene('alvar_sem_coroa');
    }
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
    if (key.startsWith('sob_')) this.save.livres[key] = true;
    if (key !== 'sob_eliar') this.room.doorsClosed = false; // Eliar luta no Trono: as portas só abrem com Alvar
    this.audio.intense = false;
    this.persist();
    setTimeout(() => this.audio.play('door'), 900);
    const L = BOSS_LINES[key];
    const depois = () => {
      if (key.startsWith('sob_')) this.soberanoLivre(key);
      else if (key.startsWith('mini_')) {
        // Mini-chefe: um Fragmento de Vida e a câmara se abre.
        this.particles.burst(this.player.cx, this.player.cy, 30, { color: ['#ffffff', '#ffd27a'], speed: 6, life: 40, glow: true });
        this.addFragments(1);
        if (key === 'mini_mariposa') this.acquireAbility('glide');
      } else if (key === 'tide') this.acquireCharm('mare_viva');
      else if (key === 'moss') { this.ui.toast('O Cavaleiro cai... e o vento obedece a você.', 3000); this.acquireAbility('dash'); }
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

  // A alma de um Soberano se solta: cena, recompensa e, no Trono, Eliar abre caminho para Alvar.
  soberanoLivre(key) {
    const n = Object.keys(this.save.livres).length;
    const fim = () => {
      this.particles.burst(this.player.cx, this.player.cy, 30, { color: ['#ffffff', '#fff2b0'], speed: 6, life: 44, glow: true });
      this.addFragments(2);
      this.ui.toast(`Uma alma a menos na Roda (${n}/6)`, 3600);
      if (n === 6) { this.save.rodaDescansa = true; this.persist(); setTimeout(() => this.playCutscene('roda_descansa'), 2200); }
    };
    if (key === 'sob_eliar') {
      this.playCutscene('eliar', () => {
        const k = this.room.entities.find((e) => e.ch === 'K');
        this.bossPending = { type: 'king', x: k.tx * TILE + TILE / 2, y: (k.ty + 1) * TILE };
        this.boss = null;
        this.room.doorsClosed = true;
        fim();
      });
    } else if (n === 1) this.playCutscene('soberano_livre', fim);
    else fim();
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
      // Viagem rápida: só descansando numa fogueira (e com pelo menos outra fogueira conhecida).
      const outras = Object.keys(this.save.brasas).filter((k) => this.benchFromKey(k) && k.split(':')[0] !== this.room.id).length;
      document.querySelector('#btn-travel').classList.toggle('hidden', !(this.player.sitting && outras));
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

  // ───────── Conversa livre (Gemini) ─────────
  openChat(npc) {
    this.state = 'chat';
    document.body.classList.add('menu-open');
    this.ui.openChat(npc, this.ai.histories[npc.id] || [], {
      send: (text) => this.ai.npcReply(npc.id, text),
      shop: npc.data.loja ? () => { this.closeChat(); this.craft.openNpcShop(npc.data.loja); } : null,
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
    this.invasions.drawOverlay(ctx);
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
    const dark = AREAS[this.room.area].dark;
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
