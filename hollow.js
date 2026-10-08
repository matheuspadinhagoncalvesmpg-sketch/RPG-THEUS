/**
 * ===================================================================
 * ABISMO DE OOO - modo plataforma lateral (estilo metroidvania sombrio)
 * Pulo, dash, ataque em 4 direcoes, almas para curar, chefe, bancos de
 * descanso, sombra ao morrer e mapa conectado com travas de habilidade.
 * ===================================================================
 */
(function () {
  'use strict';

  const T = 16;                 // tamanho do tile
  let VW = 480;                 // largura interna (adapta ao formato da tela)
  const VH = 270;               // altura interna fixa
  const SAVE_KEY = 'ooo_hk_save_v1';

  // ------------------------------------------------------------------
  // MAPA: salas montadas com retangulos
  //   '#' solido  '=' plataforma (atravessa por baixo)  '^' espinhos
  // ------------------------------------------------------------------
  function makeRoom(id, name, w, h, theme) {
    const g = Array.from({ length: h }, () => Array(w).fill('.'));
    const r = {
      id, name, w, h, theme, g,
      enemies: [], benches: [], npcs: [], items: [], exits: [], boss: null, lock: null,
      fill(x, y, ww, hh, ch = '#') {
        for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) {
          if (i >= 0 && j >= 0 && i < w && j < h) g[j][i] = ch;
        }
        return r;
      }
    };
    return r;
  }

  function buildRooms() {
    const rooms = {};

    // ---- 1. Casa da Arvore (inicio) ----
    let r = makeRoom('tree', 'Colinas de Ooo', 56, 24, 'tree');
    r.fill(0, 0, 2, 24).fill(0, 20, 56, 4).fill(54, 0, 2, 14);
    r.fill(12, 16, 6, 1, '=').fill(24, 13, 6, 1, '=').fill(36, 16, 5, 1, '=');
    r.benches.push({ x: 6, y: 19 });
    r.npcs.push({ id: 'jake', name: 'Jake', x: 10, y: 19, color: '#ffd028', lines: [
      'Matemático! Use as setas ou WASD para andar e ESPAÇO para pular.',
      'Ataque com J. Segure CIMA ou BAIXO para golpear nessa direção. No ar, golpear para baixo faz você quicar!',
      'Cada golpe enche sua alma. Segure F para curar uma vida. Descanse nos bancos!'
    ], touchLines: [
      'Matemático! Use o joystick para andar e o botão azul para pular.',
      'Ataque com ⚔️. Empurre o joystick para cima ou para baixo para golpear nessa direção.',
      'Cada golpe enche sua alma. Segure 🩹 para curar. Descanse nos bancos!'
    ] });
    r.enemies.push({ t: 'crawler', x: 22, y: 19 }, { t: 'crawler', x: 33, y: 19 }, { t: 'crawler', x: 45, y: 19 });
    r.exits.push({ x: 54, y: 14, w: 2, h: 6, to: 'cave', tx: 3, ty: 19 });
    rooms.tree = r;

    // ---- 2. Caverna Doce (dash) ----
    r = makeRoom('cave', 'Caverna Doce', 80, 24, 'cave');
    r.fill(0, 0, 80, 2).fill(0, 0, 2, 14).fill(78, 0, 2, 14);
    r.fill(0, 20, 37, 4).fill(37, 23, 9, 1).fill(37, 22, 9, 1, '^').fill(46, 20, 34, 4);
    r.fill(10, 17, 4, 1, '=').fill(16, 14, 4, 1, '=').fill(22, 11, 5, 1, '=');
    r.fill(30, 2, 4, 3).fill(54, 2, 5, 4).fill(66, 2, 3, 2);
    r.items.push({ id: 'dash', x: 24, y: 10 });
    r.benches.push({ x: 50, y: 19 });
    r.npcs.push({ id: 'bmo', name: 'BMO', x: 8, y: 19, color: '#5eead4', lines: [
      'Beep boop! Um abismo de gelatina! Dizem que existe uma capa mágica no alto da caverna.',
      'Depois do poço de espinhos o caminho continua. BMO acha que precisa de um impulso!'
    ] });
    r.enemies.push({ t: 'crawler', x: 16, y: 19 }, { t: 'crawler', x: 28, y: 19 }, { t: 'flyer', x: 33, y: 9 },
      { t: 'crawler', x: 58, y: 19 }, { t: 'crawler', x: 68, y: 19 }, { t: 'flyer', x: 60, y: 10 }, { t: 'flyer', x: 72, y: 12 });
    r.exits.push({ x: 0, y: 14, w: 2, h: 6, to: 'tree', tx: 52, ty: 19 },
      { x: 78, y: 14, w: 2, h: 6, to: 'crypt', tx: 3, ty: 45 });
    rooms.cave = r;

    // ---- 3. Cripta Gelada (pulo duplo) ----
    r = makeRoom('crypt', 'Cripta Gelada', 40, 48, 'crypt');
    r.fill(0, 0, 40, 2).fill(0, 0, 2, 42).fill(0, 46, 40, 2).fill(38, 0, 2, 3).fill(38, 7, 2, 41);
    r.fill(10, 45, 18, 1, '^');
    [[6, 43, 6], [14, 40, 6], [22, 37, 6], [30, 34, 6], [22, 31, 6], [14, 28, 6], [6, 25, 6],
      [14, 22, 6], [22, 19, 6], [30, 16, 6], [22, 13, 6]].forEach(p => r.fill(p[0], p[1], p[2], 1, '='));
    r.fill(28, 7, 10, 2);
    r.items.push({ id: 'djump', x: 33, y: 15 });
    r.benches.push({ x: 8, y: 24 });
    r.npcs.push({ id: 'marcy', name: 'Marceline', x: 11, y: 24, color: '#cbd5e1', lines: [
      'Essa cripta gela até os ossos. Suba pelas plataformas.',
      'No topo tem uma saída bem alta. Se você tiver asas, vai alcançar.'
    ] });
    r.enemies.push({ t: 'skeleton', x: 16, y: 39 }, { t: 'skeleton', x: 24, y: 36 }, { t: 'skeleton', x: 16, y: 27 },
      { t: 'flyer', x: 20, y: 30 }, { t: 'flyer', x: 10, y: 20 }, { t: 'flyer', x: 28, y: 22 }, { t: 'skeleton', x: 24, y: 18 });
    r.exits.push({ x: 0, y: 42, w: 2, h: 4, to: 'cave', tx: 76, ty: 19 },
      { x: 38, y: 3, w: 2, h: 4, to: 'hall', tx: 3, ty: 19 });
    rooms.crypt = r;

    // ---- 4. Salao do Rei Gelatina (chefe) ----
    r = makeRoom('hall', 'Salão do Rei Gelatina', 44, 24, 'hall');
    r.fill(0, 0, 44, 2).fill(0, 0, 2, 14).fill(0, 20, 44, 4).fill(42, 0, 2, 20);
    r.fill(10, 15, 5, 1, '=').fill(29, 15, 5, 1, '=');
    r.benches.push({ x: 6, y: 19 });
    r.boss = { t: 'boss', x: 32, y: 19 };
    r.lock = { x: 0, y: 14, w: 2, h: 6 };
    r.exits.push({ x: 0, y: 14, w: 2, h: 6, to: 'crypt', tx: 35, ty: 6 });
    rooms.hall = r;

    return rooms;
  }

  // ------------------------------------------------------------------
  // TEMAS VISUAIS
  // ------------------------------------------------------------------
  const THEMES = {
    tree:  { sky: ['#07131c', '#14394a'], layers: ['#0c2230', '#0a1b27', '#07131c'], tile: '#16231f', top: '#3d8a4e', glow: '#9bf6b0', dark: 0.52, mote: '#a7f3d0' },
    cave:  { sky: ['#12071c', '#2b1038'], layers: ['#1d0d29', '#150920', '#0d0515'], tile: '#231733', top: '#e0409c', glow: '#ff9bd2', dark: 0.62, mote: '#f9a8d4' },
    crypt: { sky: ['#050f1a', '#0e2a46'], layers: ['#0c2238', '#081a2c', '#05111e'], tile: '#152840', top: '#8fdcff', glow: '#b6ecff', dark: 0.66, mote: '#bae6fd' },
    hall:  { sky: ['#12050f', '#35102c'], layers: ['#2a0f27', '#1d0a1c', '#12060f'], tile: '#271229', top: '#e879f9', glow: '#ff9bf2', dark: 0.7, mote: '#f0abfc' }
  };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) >>> 0; h = (h ^ (h >>> 13)) * 1274126177 >>> 0; return (h ^ (h >>> 16)) >>> 0; };

  function seeded(seed) {
    let s = seed;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  // ------------------------------------------------------------------
  // CLASSES (estatisticas do modo Abismo)
  // ------------------------------------------------------------------
  const HK_CLASS = {
    warrior: { hp: 5, dmg: 5, reach: 1.0,  soul: 11, spell: 6,  speed: 1.0,  color: '#fde68a' },
    mage:    { hp: 4, dmg: 4, reach: 1.0,  soul: 15, spell: 10, speed: 1.0,  color: '#93c5fd' },
    archer:  { hp: 4, dmg: 4, reach: 1.15, soul: 11, spell: 7,  speed: 1.12, color: '#86efac' },
    vampire: { hp: 4, dmg: 4, reach: 1.0,  soul: 11, spell: 7,  speed: 1.0,  color: '#fca5a5' }
  };

  const ENEMY_DEF = {
    crawler:  { w: 16, h: 12, hp: 12, dmg: 1, geo: 2, speed: 38 },
    flyer:    { w: 16, h: 14, hp: 9,  dmg: 1, geo: 3, speed: 70 },
    skeleton: { w: 14, h: 26, hp: 22, dmg: 1, geo: 5, speed: 52 },
    boss:     { w: 54, h: 46, hp: 240, dmg: 2, geo: 120, speed: 0 }
  };

  // ------------------------------------------------------------------
  // JOGO
  // ------------------------------------------------------------------
  class HollowGame {
    constructor() {
      this.screen = document.getElementById('hk-screen');
      this.canvas = document.getElementById('hk-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
      this.light = document.createElement('canvas');
      this.light.width = VW; this.light.height = VH;
      this.lctx = this.light.getContext('2d');

      this.rooms = buildRooms();
      this.running = false;
      this.paused = false;
      this.keys = {};
      this.touch = { x: 0, y: 0, active: false, id: null };
      this.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
      this.buf = { jump: 0, attack: 0, dash: 0, spell: 0 };
      this.holds = { jump: false, focus: false };
      this.t = 0;
      this.raf = null;
      this.last = 0;
      this.acc = 0;
      this.bindInput();
      this.bindUI();
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 150));
    }

    // Ajusta a largura interna ao formato da tela para nao sobrar faixa preta
    resize() {
      const r = this.screen.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const w = clamp(Math.round(VH * r.width / r.height / 2) * 2, 400, 640);
      if (w !== VW || this.canvas.width !== w) {
        VW = w;
        this.canvas.width = VW; this.canvas.height = VH;
        this.light.width = VW; this.light.height = VH;
        this.ctx.imageSmoothingEnabled = false;
        if (this.room) { this.snapCamera(); this.genBackground(); }
      }
    }

    // ============== inicio / save ==============
    freshState(profile) {
      const cls = HK_CLASS[profile.classKey] || HK_CLASS.warrior;
      return {
        v: 1, profile: { ...profile }, maxHp: cls.hp, dmgLvl: 0, hpLvl: 0, geo: 0,
        abilities: { dash: false, djump: false },
        bench: { room: 'tree', x: 6, y: 19 },
        flags: { boss: false }, shade: null, roomName: 'tree', visited: ['tree']
      };
    }

    start(profile, save) {
      this.sv = save || this.freshState(profile);
      this.profile = this.sv.profile;
      this.cls = HK_CLASS[this.profile.classKey] || HK_CLASS.warrior;
      this.hero = {
        x: 0, y: 0, w: 12, h: 26, vx: 0, vy: 0, face: 1, onGround: false,
        hp: this.sv.maxHp, soul: 0, coyote: 0, airJumps: 0, airDash: true,
        dashT: 0, dashCd: 0, atkT: 0, atkCd: 0, atkDir: 'h', atkHit: new Set(),
        inv: 0, focusT: 0, dropT: 0, dead: false, deadT: 0, anim: 0, lastSafe: { x: 0, y: 0 },
        hurtStun: 0, kills: 0
      };
      this.projectiles = [];
      this.particles = [];
      this.pickups = [];
      this.hitstop = 0;
      this.shake = 0;
      this.fade = 1;
      this.fadeTarget = 0;
      this.title = null;
      this.endBanner = 0;
      this.paused = false;
      this.running = true;
      this.msg = null;
      const b = this.sv.bench;
      this.loadRoom(b.room, b.x, b.y, true);
      this.hero.hp = this.sv.maxHp;
      document.body.classList.add('hk-active');
      this.screen.classList.add('active');
      this.resize();
      this.snapCamera();
      this.updateTouchUI();
      sounds.init();
      sounds.stopBgm();
      this.startAmbient();
      this.last = performance.now();
      this.acc = 0;
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame((n) => this.loop(n));
    }

    saveGame() {
      if (!this.sv) return;
      this.sv.maxHp = this.maxHp();
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.sv)); } catch (e) {}
    }

    static loadSave() {
      try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; }
    }

    exitToMenu() {
      this.saveGame();
      this.running = false;
      cancelAnimationFrame(this.raf);
      this.stopAmbient();
      document.body.classList.remove('hk-active');
      this.screen.classList.remove('active');
      document.getElementById('hk-pause').classList.add('hidden');
      document.getElementById('hk-bench').classList.add('hidden');
      document.getElementById('character-creation-screen').classList.add('active');
      const cb = document.getElementById('continue-hk-btn');
      const sv = HollowGame.loadSave();
      if (cb && sv) { cb.classList.remove('hidden'); cb.textContent = `▶ CONTINUAR ABISMO: ${sv.profile.name}`; }
    }

    maxHp() { return this.cls.hp + (this.sv.hpLvl || 0); }
    nailDmg() { return this.cls.dmg + (this.sv.dmgLvl || 0); }

    // ============== salas ==============
    loadRoom(id, tx, ty, instant) {
      const room = this.rooms[id];
      this.room = room;
      this.sv.roomName = id;
      if (!this.sv.visited.includes(id)) this.sv.visited.push(id);
      this.grid = room.g.map(row => row.slice());
      if (room.lock && this.sv.flags.boss) { /* aberta */ }
      this.enemies = [];
      this.items = [];
      this.projectiles = [];
      this.pickups = [];
      this.boss = null;
      this.bossActive = false;
      this.bossIntro = 0;
      this.nearBench = null;
      this.nearNpc = null;
      this.exitCd = 0.5;

      room.enemies.forEach(e => this.spawnEnemy(e.t, e.x, e.y));
      if (room.boss && !this.sv.flags.boss) this.boss = this.spawnEnemy('boss', room.boss.x, room.boss.y);
      room.items.forEach(it => { if (!this.sv.abilities[it.id]) this.items.push({ ...it, bob: Math.random() * 6 }); });

      const hero = this.hero;
      hero.x = tx * T + T / 2;
      hero.y = (ty + 1) * T;
      hero.vx = 0; hero.vy = 0;
      hero.lastSafe = { x: hero.x, y: hero.y };
      this.camera = { x: 0, y: 0 };
      this.snapCamera();
      this.genBackground();
      this.motes = Array.from({ length: 46 }, () => ({ x: rnd(0, VW), y: rnd(0, VH), s: rnd(0.6, 2), v: rnd(4, 14), p: rnd(0, 6) }));

      // sombra do jogador
      this.shade = null;
      if (this.sv.shade && this.sv.shade.room === id) {
        this.shade = { x: this.sv.shade.x, y: this.sv.shade.y, hp: 18, w: 14, h: 24, flash: 0, t: 0, geo: this.sv.shade.geo };
      }
      if (!instant) {
        this.title = { text: room.name, t: 3.2 };
      } else {
        this.title = { text: room.name, t: 3.2 };
      }
      this.fade = instant ? 1 : 1;
      this.fadeTarget = 0;
      this.saveGame();
    }

    spawnEnemy(type, tx, ty) {
      const d = ENEMY_DEF[type];
      const e = {
        type, x: tx * T + T / 2, y: (ty + 1) * T, w: d.w, h: d.h, vx: 0, vy: 0,
        hp: d.hp, maxHp: d.hp, dmg: d.dmg, geo: d.geo, speed: d.speed,
        dir: Math.random() < 0.5 ? -1 : 1, flash: 0, t: Math.random() * 6, onGround: false,
        homeX: tx * T + T / 2, homeY: (ty + 1) * T, state: 'idle', st: 0, stun: 0
      };
      if (type === 'flyer') { e.y = ty * T; e.homeY = e.y; }
      if (type === 'boss') { e.state = 'sleep'; e.leaps = 0; e.phase = 1; }
      this.enemies.push(e);
      return e;
    }

    // ============== tiles / colisao ==============
    tile(tx, ty) {
      if (tx < 0 || tx >= this.room.w || ty < 0) return '#';
      if (ty >= this.room.h) return '#';
      return this.grid[ty][tx];
    }

    moveBody(b, dt, ignorePlat) {
      b.onGround = false; b.hitWall = 0; b.hitCeil = false;
      // X
      b.x += b.vx * dt;
      let l = b.x - b.w / 2, r = b.x + b.w / 2, t = b.y - b.h, bt = b.y - 0.01;
      const ty0 = Math.floor(t / T), ty1 = Math.floor(bt / T);
      const tx0 = Math.floor(l / T), tx1 = Math.floor((r - 0.001) / T);
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
        if (this.tile(tx, ty) === '#') {
          if (b.vx > 0) { b.x = tx * T - b.w / 2 - 0.001; b.hitWall = 1; }
          else if (b.vx < 0) { b.x = (tx + 1) * T + b.w / 2 + 0.001; b.hitWall = -1; }
          b.vx = 0;
          l = b.x - b.w / 2; r = b.x + b.w / 2;
        }
      }
      // Y
      const prev = b.y;
      b.y += b.vy * dt;
      l = b.x - b.w / 2; r = b.x + b.w / 2;
      const ax0 = Math.floor(l / T), ax1 = Math.floor((r - 0.001) / T);
      if (b.vy >= 0) {
        const ty = Math.floor(b.y / T);
        for (let tx = ax0; tx <= ax1; tx++) {
          const ch = this.tile(tx, ty);
          if (ch === '#' || (ch === '=' && !ignorePlat && prev <= ty * T + 0.6)) {
            if (b.y > ty * T) { b.y = ty * T; b.vy = 0; b.onGround = true; }
          }
        }
      } else {
        const ty = Math.floor((b.y - b.h) / T);
        for (let tx = ax0; tx <= ax1; tx++) {
          if (this.tile(tx, ty) === '#') { b.y = (ty + 1) * T + b.h; b.vy = 0; b.hitCeil = true; }
        }
      }
    }

    overlapsSpikes(b) {
      const l = Math.floor((b.x - b.w / 2) / T), r = Math.floor((b.x + b.w / 2 - 0.01) / T);
      const t = Math.floor((b.y - b.h) / T), bt = Math.floor((b.y - 0.01) / T);
      for (let ty = t; ty <= bt; ty++) for (let tx = l; tx <= r; tx++) {
        if (this.tile(tx, ty) === '^' && b.y > ty * T + 7) return true;
      }
      return false;
    }

    // ============== entrada ==============
    bindInput() {
      const map = {
        Space: 'jump', KeyK: 'jump', KeyZ: 'jump',
        KeyJ: 'attack', KeyX: 'attack',
        ShiftLeft: 'dash', ShiftRight: 'dash', KeyL: 'dash', KeyC: 'dash',
        KeyE: 'spell', KeyQ: 'spell', KeyI: 'spell'
      };
      window.addEventListener('keydown', (e) => {
        if (!this.running) return;
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
        if (e.code === 'Escape' || e.code === 'KeyP') { if (!e.repeat) this.togglePause(); return; }
        if (this.paused) return;
        if (!this.keys[e.code] && !e.repeat) {
          const a = map[e.code];
          if (a) this.press(a);
          if (e.code === 'ArrowUp' || e.code === 'KeyW') this.tryInteract();
        }
        this.keys[e.code] = true;
        if (map[e.code] === 'jump') this.holds.jump = true;
        if (e.code === 'KeyF' || e.code === 'KeyH') this.holds.focus = true;
      });
      window.addEventListener('keyup', (e) => {
        this.keys[e.code] = false;
        if (map[e.code] === 'jump') this.holds.jump = ['Space', 'KeyK', 'KeyZ'].some(k => this.keys[k]);
        if (e.code === 'KeyF' || e.code === 'KeyH') this.holds.focus = false;
      });
      window.addEventListener('blur', () => { this.keys = {}; this.holds.jump = false; this.holds.focus = false; });
      document.addEventListener('visibilitychange', () => { if (document.hidden && this.running) { this.saveGame(); if (!this.paused) this.togglePause(); } });
      window.addEventListener('pagehide', () => { if (this.running) this.saveGame(); });
    }

    press(a) { this.buf[a] = 0.14; }

    bindUI() {
      // joystick flutuante
      const zone = document.getElementById('hk-joy-zone');
      const base = document.getElementById('hk-joy-base');
      const stick = document.getElementById('hk-joy-stick');
      if (zone) {
        let sx = 0, sy = 0; const R = 40;
        const upd = (cx, cy) => {
          const dx = cx - sx, dy = cy - sy, d = Math.hypot(dx, dy) || 1, c = Math.min(d, R);
          stick.style.transform = `translate(${dx / d * c}px, ${dy / d * c}px)`;
          this.touch.x = dx / d * (c / R); this.touch.y = dy / d * (c / R);
        };
        zone.addEventListener('touchstart', (e) => {
          e.preventDefault(); if (this.touch.active) return;
          const t0 = e.changedTouches[0]; const zr = zone.getBoundingClientRect();
          this.touch.active = true; this.touch.id = t0.identifier; sx = t0.clientX; sy = t0.clientY;
          base.style.left = `${t0.clientX - zr.left - base.offsetWidth / 2}px`;
          base.style.top = `${t0.clientY - zr.top - base.offsetHeight / 2}px`;
          base.style.bottom = 'auto'; base.classList.add('active'); upd(t0.clientX, t0.clientY);
        }, { passive: false });
        zone.addEventListener('touchmove', (e) => {
          e.preventDefault();
          for (const t0 of e.changedTouches) if (t0.identifier === this.touch.id) upd(t0.clientX, t0.clientY);
        }, { passive: false });
        const end = (e) => {
          for (const t0 of e.changedTouches) if (t0.identifier === this.touch.id) {
            this.touch.active = false; this.touch.x = 0; this.touch.y = 0;
            stick.style.transform = ''; base.classList.remove('active');
            base.style.left = ''; base.style.top = ''; base.style.bottom = '';
          }
        };
        zone.addEventListener('touchend', end, { passive: false });
        zone.addEventListener('touchcancel', end, { passive: false });
      }

      const bind = (id, down, up) => {
        const el = document.getElementById(id); if (!el) return;
        let touching = false;
        el.addEventListener('touchstart', (e) => { e.preventDefault(); touching = true; el.classList.add('pressed'); down(); }, { passive: false });
        const u = (e) => { e.preventDefault(); touching = false; el.classList.remove('pressed'); if (up) up(); };
        el.addEventListener('touchend', u, { passive: false });
        el.addEventListener('touchcancel', u, { passive: false });
        el.addEventListener('mousedown', () => { if (!touching) { el.classList.add('pressed'); down(); } });
        el.addEventListener('mouseup', () => { el.classList.remove('pressed'); if (up) up(); });
        el.addEventListener('mouseleave', () => { el.classList.remove('pressed'); if (up) up(); });
      };
      bind('hk-btn-jump', () => { this.press('jump'); this.holds.jump = true; }, () => { this.holds.jump = false; });
      bind('hk-btn-attack', () => this.press('attack'));
      bind('hk-btn-dash', () => this.press('dash'));
      bind('hk-btn-spell', () => this.press('spell'));
      bind('hk-btn-focus', () => { this.holds.focus = true; }, () => { this.holds.focus = false; });
      bind('hk-btn-interact', () => this.tryInteract());
      const pb = document.getElementById('hk-btn-pause');
      if (pb) pb.addEventListener('click', () => this.togglePause());
      document.getElementById('hk-resume').addEventListener('click', () => this.togglePause());
      document.getElementById('hk-exit').addEventListener('click', () => this.exitToMenu());
      document.getElementById('hk-bench-close').addEventListener('click', () => this.closeBench());
      const fs = document.getElementById('hk-fs');
      if (fs) fs.addEventListener('click', async () => {
        try {
          if (document.fullscreenElement) await document.exitFullscreen();
          else { await document.documentElement.requestFullscreen(); if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); }
        } catch (e) {}
      });
      document.addEventListener('contextmenu', (e) => { if (this.running) e.preventDefault(); });
    }

    updateTouchUI() {
      document.getElementById('hk-touch').classList.toggle('hidden', !this.isTouch && window.innerWidth > 900);
      const dash = document.getElementById('hk-btn-dash');
      const sp = document.getElementById('hk-btn-spell');
      if (dash) dash.classList.toggle('locked', !this.sv.abilities.dash);
    }

    togglePause() {
      if (!this.running || this.benchOpen) return;
      this.paused = !this.paused;
      const el = document.getElementById('hk-pause');
      el.classList.toggle('hidden', !this.paused);
      if (this.paused) {
        const a = this.sv.abilities;
        document.getElementById('hk-pause-info').innerHTML =
          `<div>🪙 Geo: <b>${this.sv.geo}</b> &nbsp; ❤️ Vidas: <b>${this.maxHp()}</b> &nbsp; ⚔️ Dano: <b>${this.nailDmg()}</b></div>` +
          `<div>${a.dash ? '✅' : '🔒'} Capa de Marceline (Dash) &nbsp; ${a.djump ? '✅' : '🔒'} Asas de Gunther (Pulo Duplo)</div>` +
          `<div>${this.sv.flags.boss ? '👑 Rei Gelatina derrotado!' : '❓ O Rei Gelatina aguarda no fundo do abismo'}</div>` +
          `<div class="hk-keys">${this.isTouch ? '' : 'Setas/WASD mover · Espaço pular · J atacar · L dash · E magia · F curar · ↑ interagir'}</div>`;
      } else {
        this.last = performance.now();
      }
    }

    // ============== audio ambiente ==============
    startAmbient() {
      try {
        if (!sounds.ctx || !sounds.enabled) return;
        this.stopAmbient();
        const ctx = sounds.ctx;
        const master = ctx.createGain(); master.gain.value = 0.05; master.connect(ctx.destination);
        const oscs = [55, 82.4, 110.7].map((f, i) => {
          const o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sine'; o.frequency.value = f;
          const g = ctx.createGain(); g.gain.value = 0.5 / (i + 1);
          const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07 + i * 0.05;
          const lg = ctx.createGain(); lg.gain.value = 0.25;
          lfo.connect(lg); lg.connect(g.gain);
          o.connect(g); g.connect(master); o.start(); lfo.start();
          return [o, lfo];
        });
        this.ambient = { master, oscs };
      } catch (e) {}
    }

    stopAmbient() {
      if (!this.ambient) return;
      try { this.ambient.oscs.forEach(p => p.forEach(o => o.stop())); this.ambient.master.disconnect(); } catch (e) {}
      this.ambient = null;
    }

    tone(f, type, d, v, slide) { sounds.playTone(f, type, d, v, slide || 0); }

    // ============== loop ==============
    loop(now) {
      if (!this.running) return;
      this.raf = requestAnimationFrame((n) => this.loop(n));
      let dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      if (!this.paused) {
        this.acc += dt;
        const step = 1 / 120;
        let n = 0;
        while (this.acc >= step && n < 12) { this.update(step); this.acc -= step; n++; }
      }
      this.render();
    }

    // ============== atualizacao ==============
    axis() {
      const k = this.keys;
      let x = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
      let y = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
      if (this.touch.active) {
        x = Math.abs(this.touch.x) > 0.28 ? Math.sign(this.touch.x) : 0;
        y = Math.abs(this.touch.y) > 0.55 ? Math.sign(this.touch.y) : 0;
      }
      return { x, y };
    }

    update(dt) {
      this.t += dt;
      for (const k in this.buf) if (this.buf[k] > 0) this.buf[k] -= dt;
      if (this.fade > this.fadeTarget) this.fade = Math.max(this.fadeTarget, this.fade - dt * 2.2);
      else if (this.fade < this.fadeTarget) this.fade = Math.min(this.fadeTarget, this.fade + dt * 3);
      if (this.title) { this.title.t -= dt; if (this.title.t <= 0) this.title = null; }
      if (this.msg) { this.msg.t -= dt; if (this.msg.t <= 0) this.msg = null; }
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 18);
      if (this.hitstop > 0) { this.hitstop -= dt; this.updateParticles(dt); return; }
      if (this.endBanner > 0) this.endBanner -= dt;

      const h = this.hero;
      if (h.dead) { this.updateDead(dt); this.updateParticles(dt); return; }
      if (this.transition) { this.updateTransition(dt); return; }

      this.updateHero(dt);
      this.updateEnemies(dt);
      this.updateProjectiles(dt);
      this.updatePickups(dt);
      this.updateShade(dt);
      this.updateParticles(dt);
      this.updateCamera(dt);
      this.checkExits();
      this.checkInteractables();
    }

    updateHero(dt) {
      const h = this.hero, ax = this.axis();
      const speed = 150 * this.cls.speed;
      h.anim += dt;
      if (h.inv > 0) h.inv -= dt;
      if (h.atkCd > 0) h.atkCd -= dt;
      if (h.dashCd > 0) h.dashCd -= dt;
      if (h.hurtStun > 0) h.hurtStun -= dt;
      if (h.dropT > 0) h.dropT -= dt;
      if (h.onGround) { h.coyote = 0.1; h.airJumps = this.sv.abilities.djump ? 1 : 0; h.airDash = true; }
      else if (h.coyote > 0) h.coyote -= dt;

      // Foco (cura)
      const canFocus = this.holds.focus && h.onGround && ax.x === 0 && h.soul >= 33 && h.hp < this.maxHp() && h.hurtStun <= 0 && h.dashT <= 0;
      if (canFocus) {
        h.focusT += dt;
        if (Math.random() < 0.5) this.spark(h.x + rnd(-8, 8), h.y - rnd(0, 26), '#bae6fd', 1, 20, -30);
        if (h.focusT >= 0.95) {
          h.focusT = 0; h.soul -= 33; h.hp = Math.min(this.maxHp(), h.hp + 1);
          this.burst(h.x, h.y - 14, 18, '#e0f2fe', 90);
          sounds.potionDrink();
        }
      } else h.focusT = 0;

      // Dash
      if (this.buf.dash > 0 && this.sv.abilities.dash && h.dashCd <= 0 && h.dashT <= 0 && (h.onGround || h.airDash) && h.hurtStun <= 0) {
        this.buf.dash = 0; h.dashT = 0.18; h.dashCd = 0.55; if (!h.onGround) h.airDash = false;
        h.dashDir = ax.x || h.face; h.face = h.dashDir; h.inv = Math.max(h.inv, 0.16); h.vy = 0;
        this.tone(220, 'sawtooth', 0.15, 0.12, -120);
        this.burst(h.x, h.y - 12, 8, '#e2e8f0', 70);
      }
      if (h.dashT > 0) {
        h.dashT -= dt; h.vx = h.dashDir * 440; h.vy = 0;
        if (Math.random() < 0.7) this.particles.push({ x: h.x, y: h.y - 13, vx: 0, vy: 0, life: 0.22, max: 0.22, color: 'rgba(200,230,255,0.7)', size: 7, ghost: true, face: h.face });
      } else if (h.hurtStun <= 0) {
        // movimento horizontal
        const target = ax.x * speed;
        const acc = (h.onGround ? 1900 : 1200) * dt;
        if (h.vx < target) h.vx = Math.min(target, h.vx + acc); else if (h.vx > target) h.vx = Math.max(target, h.vx - acc);
        if (ax.x !== 0 && h.atkT <= 0) h.face = ax.x;
        h.vy = Math.min(560, h.vy + 1000 * dt);
      } else {
        h.vy = Math.min(560, h.vy + 1000 * dt);
        h.vx *= Math.pow(0.02, dt);
      }

      // Pulo
      if (this.buf.jump > 0 && h.hurtStun <= 0) {
        if (ax.y > 0 && this.tile(Math.floor(h.x / T), Math.floor(h.y / T)) === '=' && h.onGround) {
          this.buf.jump = 0; h.dropT = 0.22; h.y += 2;
        } else if (h.coyote > 0) {
          this.buf.jump = 0; h.vy = -360; h.coyote = 0; h.dashT = 0;
          this.tone(380, 'square', 0.1, 0.06, 160);
        } else if (h.airJumps > 0) {
          this.buf.jump = 0; h.airJumps--; h.vy = -335; h.dashT = 0;
          this.burst(h.x, h.y, 10, '#c7e8ff', 60);
          this.tone(520, 'triangle', 0.14, 0.08, 220);
        }
      }
      if (!this.holds.jump && h.vy < -130) h.vy = -130;

      // Ataque
      if (this.buf.attack > 0 && h.atkCd <= 0 && h.hurtStun <= 0 && h.dashT <= 0) {
        this.buf.attack = 0;
        h.atkT = 0.2; h.atkCd = 0.34; h.atkHit = new Set();
        h.atkDir = ax.y < 0 ? 'u' : (ax.y > 0 && !h.onGround ? 'd' : 'h');
        if (ax.x !== 0) h.face = ax.x;
        sounds.swordSwing();
      }
      if (h.atkT > 0) { h.atkT -= dt; this.resolveAttack(); }

      // Magia
      if (this.buf.spell > 0 && h.soul >= 33 && h.hurtStun <= 0 && h.dashT <= 0) {
        this.buf.spell = 0; h.soul -= 33; h.atkCd = Math.max(h.atkCd, 0.3);
        this.projectiles.push({
          x: h.x + h.face * 10, y: h.y - 14, vx: h.face * 330, vy: 0, w: 22, h: 16, dmg: this.cls.spell,
          life: 1.2, from: 'p', color: this.cls.color, grav: 0, pierce: true, hit: new Set()
        });
        sounds.magicCast();
        this.shake = Math.max(this.shake, 1.5);
      }

      this.moveBody(h, dt, h.dropT > 0);
      if (h.onGround && !this.overlapsSpikes(h)) {
        const edgeL = this.tile(Math.floor((h.x - 8) / T), Math.floor(h.y / T));
        const edgeR = this.tile(Math.floor((h.x + 8) / T), Math.floor(h.y / T));
        if (edgeL !== '^' && edgeR !== '^' && edgeL !== '.' && edgeR !== '.') h.lastSafe = { x: h.x, y: h.y };
      }
      if (this.overlapsSpikes(h)) this.spikeHit();
      if (h.y > this.room.h * T + 60) this.spikeHit();
    }

    spikeHit() {
      const h = this.hero;
      if (h.inv > 0) return;
      this.damageHero(1, 0);
      if (!h.dead) { h.x = h.lastSafe.x; h.y = h.lastSafe.y; h.vx = 0; h.vy = 0; h.hurtStun = 0.2; this.fade = 0.7; }
    }

    resolveAttack() {
      const h = this.hero;
      const reach = 34 * this.cls.reach;
      let bx, by, bw, bh;
      if (h.atkDir === 'h') { bw = reach + 8; bh = 30; bx = h.face > 0 ? h.x + 4 : h.x - 4 - bw; by = h.y - 32; }
      else if (h.atkDir === 'u') { bw = 36; bh = reach + 10; bx = h.x - 18; by = h.y - 26 - bh; }
      else { bw = 30; bh = reach + 6; bx = h.x - 15; by = h.y - 6; }
      this.atkBox = { x: bx, y: by, w: bw, h: bh };
      const hitTargets = this.enemies.slice();
      if (this.shade) hitTargets.push(this.shade);
      let hitAny = false;
      for (const e of hitTargets) {
        if (h.atkHit.has(e) || e.hp <= 0) continue;
        if (bx < e.x + e.w / 2 && bx + bw > e.x - e.w / 2 && by < e.y && by + bh > e.y - e.h) {
          h.atkHit.add(e);
          this.hurtEnemy(e, this.nailDmg(), h.atkDir === 'h' ? h.face : Math.sign(e.x - h.x) || 1);
          hitAny = true;
          if (h.atkDir === 'd') { h.vy = -300; h.airJumps = this.sv.abilities.djump ? 1 : 0; h.airDash = true; }
          if (h.atkDir === 'h') h.vx -= h.face * 70;
        }
      }
      // quebra de espinhos: pogo
      if (h.atkDir === 'd' && !hitAny) {
        const tx = Math.floor((bx + bw / 2) / T), ty = Math.floor((by + bh - 2) / T);
        if (this.tile(tx, ty) === '^' && !h.atkHit.has('sp')) { h.atkHit.add('sp'); h.vy = -300; this.burst(h.x, h.y, 8, '#e2e8f0', 60); this.hitstop = 0.03; }
      }
    }

    hurtEnemy(e, dmg, dir) {
      e.hp -= dmg; e.flash = 0.12; e.stun = e.type === 'boss' ? 0 : 0.18;
      if (e.type !== 'boss' && e.type !== 'shade') { e.vx = dir * 150; if (e.type !== 'flyer') e.vy = -90; else e.vy = -40; }
      this.hitstop = e.type === 'boss' ? 0.04 : 0.06;
      this.shake = Math.max(this.shake, 2.5);
      this.burst(e.x, e.y - e.h / 2, 8, '#ffffff', 110);
      this.hero.soul = Math.min(99, this.hero.soul + (this.shade === e ? 0 : this.cls.soul));
      sounds.enemyHit();
      if (e.hp <= 0) this.killEnemy(e);
    }

    killEnemy(e) {
      if (e === this.shade) {
        this.sv.geo += e.geo; this.sv.shade = null; this.shade = null;
        this.msg = { text: `Você recuperou ${e.geo} geo`, t: 2.4 };
        this.burst(e.x, e.y - 12, 26, '#fef3c7', 130); sounds.levelUp(); this.saveGame();
        return;
      }
      const i = this.enemies.indexOf(e); if (i >= 0) this.enemies.splice(i, 1);
      this.burst(e.x, e.y - e.h / 2, e.type === 'boss' ? 50 : 16, e.type === 'boss' ? '#e879f9' : '#f8fafc', 150);
      const n = e.type === 'boss' ? 14 : Math.max(1, e.geo);
      for (let k = 0; k < n; k++) {
        this.pickups.push({ x: e.x, y: e.y - e.h / 2, vx: rnd(-90, 90), vy: rnd(-220, -80), v: e.type === 'boss' ? 9 : 1, t: 0, w: 6, h: 6, onGround: false });
      }
      this.hero.kills++;
      if (this.profile.classKey === 'vampire' && Math.random() < 0.3 && this.hero.hp < this.maxHp()) { this.hero.hp++; this.spark(this.hero.x, this.hero.y - 30, '#fca5a5', 6, 40, -40); }
      if (e.type === 'boss') this.onBossDefeated();
    }

    onBossDefeated() {
      this.sv.flags.boss = true; this.boss = null; this.bossActive = false;
      if (this.room.lock) this.openLock();
      this.shake = 10; this.hitstop = 0.4;
      sounds.bossDefeat();
      this.endBanner = 6;
      this.projectiles = this.projectiles.filter(p => p.from === 'p');
      this.saveGame();
    }

    openLock() {
      const L = this.room.lock;
      for (let j = L.y; j < L.y + L.h; j++) for (let i = L.x; i < L.x + L.w; i++) this.grid[j][i] = '.';
    }

    closeLock() {
      const L = this.room.lock;
      for (let j = L.y; j < L.y + L.h; j++) for (let i = L.x; i < L.x + L.w; i++) this.grid[j][i] = '#';
    }

    damageHero(d, dir) {
      const h = this.hero;
      if (h.inv > 0 || h.dead) return;
      h.hp -= d; h.inv = 1.3; h.hurtStun = 0.22; h.focusT = 0; h.dashT = 0;
      h.vx = (dir || -h.face) * 190; h.vy = -190;
      this.hitstop = 0.1; this.shake = 6; this.fade = Math.max(this.fade, 0.25);
      this.burst(h.x, h.y - 14, 14, '#f8fafc', 140);
      sounds.playerHurt();
      if (this.isTouch && navigator.vibrate) navigator.vibrate(45);
      if (h.hp <= 0) this.die();
    }

    die() {
      const h = this.hero;
      h.dead = true; h.deadT = 0; h.hp = 0;
      // sombra com o geo
      this.sv.shade = { room: this.room.id, x: h.x, y: h.y, geo: this.sv.geo };
      this.sv.geo = 0;
      this.burst(h.x, h.y - 14, 40, '#f8fafc', 200);
      this.shake = 10;
      this.stopAmbient();
      this.saveGame();
    }

    updateDead(dt) {
      const h = this.hero; h.deadT += dt;
      if (h.deadT > 1.0 && this.fadeTarget < 1) this.fadeTarget = 1;
      if (h.deadT > 2.0) {
        const b = this.sv.bench;
        h.dead = false; h.hp = this.maxHp(); h.soul = 0; h.inv = 1;
        this.loadRoom(b.room, b.x, b.y, true);
        this.hero.hp = this.maxHp();
        this.startAmbient();
      }
    }

    // ============== inimigos ==============
    updateEnemies(dt) {
      const h = this.hero;
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        e.t += dt;
        if (e.flash > 0) e.flash -= dt;
        if (e.stun > 0) e.stun -= dt;
        if (e.type === 'crawler') this.aiCrawler(e, dt);
        else if (e.type === 'flyer') this.aiFlyer(e, dt);
        else if (e.type === 'skeleton') this.aiSkeleton(e, dt);
        else if (e.type === 'boss') this.aiBoss(e, dt);

        // dano de contato
        if (e.state !== 'sleep' && h.inv <= 0 && h.hp > 0 &&
          Math.abs(e.x - h.x) < (e.w + h.w) / 2 - 2 && e.y > h.y - h.h + 2 && e.y - e.h < h.y - 2) {
          this.damageHero(e.dmg, Math.sign(h.x - e.x) || 1);
        }
      }
    }

    groundAhead(e, dir) {
      const tx = Math.floor((e.x + dir * (e.w / 2 + 4)) / T), ty = Math.floor((e.y + 2) / T);
      const ch = this.tile(tx, ty);
      return ch === '#' || ch === '=';
    }

    aiCrawler(e, dt) {
      if (e.stun > 0) { e.vy = Math.min(500, e.vy + 1000 * dt); this.moveBody(e, dt); e.vx *= 0.92; return; }
      e.vx = e.dir * e.speed;
      if (e.onGround && !this.groundAhead(e, e.dir)) e.dir = -e.dir;
      e.vy = Math.min(500, e.vy + 1000 * dt);
      this.moveBody(e, dt);
      if (e.hitWall) e.dir = -e.dir;
    }

    aiFlyer(e, dt) {
      const h = this.hero;
      const dx = h.x - e.x, dy = (h.y - 14) - (e.y - 7), d = Math.hypot(dx, dy);
      if (e.stun > 0) { e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= 0.94; e.vy *= 0.94; return; }
      let tvx, tvy;
      if (d < 190 && h.hp > 0) { tvx = dx / d * e.speed; tvy = dy / d * e.speed; e.state = 'chase'; }
      else {
        e.state = 'idle';
        tvx = Math.cos(e.t * 0.9) * 22; tvy = (e.homeY - e.y) * 0.8 + Math.sin(e.t * 2) * 18;
        tvx += (e.homeX - e.x) * 0.5;
      }
      e.vx += (tvx - e.vx) * Math.min(1, dt * 3.5);
      e.vy += (tvy - e.vy) * Math.min(1, dt * 3.5);
      const nx = e.x + e.vx * dt, ny = e.y + e.vy * dt;
      if (this.tile(Math.floor(nx / T), Math.floor((e.y - 7) / T)) !== '#') e.x = nx; else e.vx *= -0.5;
      if (this.tile(Math.floor(e.x / T), Math.floor((ny - 7) / T)) !== '#') e.y = ny; else e.vy *= -0.5;
      if (Math.abs(e.vx) > 4) e.dir = Math.sign(e.vx);
    }

    aiSkeleton(e, dt) {
      const h = this.hero;
      if (e.stun > 0) { e.vy = Math.min(500, e.vy + 1000 * dt); this.moveBody(e, dt); e.vx *= 0.92; return; }
      const dx = h.x - e.x, near = Math.abs(dx) < 170 && Math.abs(h.y - e.y) < 50;
      e.st -= dt;
      let sp = e.speed;
      if (near) {
        e.dir = Math.sign(dx) || e.dir;
        if (e.state === 'lunge') { sp = 170; if (e.st <= 0) e.state = 'idle'; }
        else if (Math.abs(dx) < 90 && e.st <= -1.6) { e.state = 'lunge'; e.st = 0.35; }
        if (e.state !== 'lunge' && e.st < -1.6) e.st = 0;
      } else { sp = e.speed * 0.5; if (e.onGround && !this.groundAhead(e, e.dir)) e.dir = -e.dir; e.state = 'idle'; }
      if (near && !this.groundAhead(e, e.dir)) sp = 0;
      e.vx = e.dir * sp;
      e.vy = Math.min(500, e.vy + 1000 * dt);
      this.moveBody(e, dt);
      if (e.hitWall && !near) e.dir = -e.dir;
    }

    aiBoss(e, dt) {
      const h = this.hero;
      if (e.state === 'sleep') {
        if (h.x > 11 * T && !this.sv.flags.boss) {
          e.state = 'intro'; e.st = 1.6; this.bossActive = true; this.closeLock();
          this.title = { text: 'Rei Gelatina Doce', sub: 'Guardião do Abismo', t: 3.4 };
          this.fadeTarget = 0; this.shake = 4;
        }
        return;
      }
      const hpPct = e.hp / e.maxHp;
      e.phase = hpPct < 0.3 ? 3 : hpPct < 0.6 ? 2 : 1;
      e.st -= dt;
      e.vy = Math.min(560, e.vy + 1000 * dt);
      const face = Math.sign(h.x - e.x) || 1;
      switch (e.state) {
        case 'intro': if (e.st <= 0) { e.state = 'idle'; e.st = 0.7; } e.vx = 0; break;
        case 'idle':
          e.vx = 0; e.dir = face;
          if (e.st <= 0) {
            if (e.phase >= 2 && e.leaps >= 2) { e.leaps = 0; e.state = e.phase === 3 ? 'rain' : 'summon'; e.st = 1.1; }
            else { e.state = 'crouch'; e.st = e.phase === 3 ? 0.32 : 0.5; }
          }
          break;
        case 'crouch':
          e.vx = 0; e.dir = face;
          if (e.st <= 0) {
            e.state = 'air'; e.leaps++;
            e.vy = -560; e.vx = face * clamp(Math.abs(h.x - e.x) * 1.1, 70, 230);
            e.onGround = false;
          }
          break;
        case 'air':
          if (e.onGround && e.vy >= 0) { this.bossLand(e); e.state = 'idle'; e.st = e.phase === 3 ? 0.5 : 0.9; e.vx = 0; }
          break;
        case 'summon':
          e.vx = 0;
          if (e.st <= 0) {
            for (let k = 0; k < 2; k++) {
              const s = this.spawnEnemy('crawler', Math.floor((e.x + (k ? 90 : -90)) / T), 8);
              s.y = 8 * T; s.vy = 0;
              s.x = clamp(e.x + (k ? 100 : -100), 4 * T, (this.room.w - 4) * T);
            }
            this.burst(e.x, e.y - 40, 20, '#e879f9', 120);
            e.state = 'idle'; e.st = 1.0;
          }
          break;
        case 'rain':
          e.vx = 0;
          e.rainT = (e.rainT || 0) - dt;
          if (e.rainT <= 0) {
            e.rainT = 0.16;
            this.projectiles.push({
              x: rnd(3 * T, (this.room.w - 3) * T), y: 3 * T, vx: 0, vy: 40, w: 10, h: 14, dmg: 1, life: 3,
              from: 'e', color: '#e879f9', grav: 600
            });
          }
          if (e.st <= -1.6) { e.state = 'idle'; e.st = 0.9; }
          break;
      }
      this.moveBody(e, dt);
      if (e.hitWall) e.vx = 0;
    }

    bossLand(e) {
      this.shake = 7; sounds.bossDefeat && this.tone(90, 'sawtooth', 0.3, 0.2, -50);
      this.burst(e.x, e.y, 18, '#f0abfc', 140);
      [-1, 1].forEach(d => this.projectiles.push({
        x: e.x + d * 30, y: e.y, vx: d * 190, vy: 0, w: 16, h: 14, dmg: 1, life: 2.4, from: 'e', color: '#e879f9', grav: 0, ground: true
      }));
    }

    // ============== projeteis / drops ==============
    updateProjectiles(dt) {
      const h = this.hero;
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.life -= dt;
        if (p.grav) p.vy += p.grav * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        const tile = this.tile(Math.floor(p.x / T), Math.floor((p.y - 2) / T));
        let dead = p.life <= 0 || tile === '#';
        if (p.from === 'e') {
          if (p.ground) { // onda no chao
            const below = this.tile(Math.floor(p.x / T), Math.floor((p.y + 2) / T));
            if (below !== '#' && below !== '=') dead = true;
          }
          if (!dead && h.inv <= 0 && h.hp > 0 && Math.abs(p.x - h.x) < (p.w + h.w) / 2 && p.y > h.y - h.h && p.y - p.h < h.y) {
            this.damageHero(p.dmg, Math.sign(h.x - p.x) || 1); if (!p.ground) dead = true;
          }
        } else {
          for (const e of this.enemies) {
            if (e.hp <= 0 || p.hit.has(e)) continue;
            if (Math.abs(p.x - e.x) < (p.w + e.w) / 2 && p.y > e.y - e.h - 4 && p.y - p.h < e.y) {
              p.hit.add(e); this.hurtEnemy(e, p.dmg, Math.sign(p.vx) || 1);
            }
          }
        }
        if (Math.random() < 0.5) this.particles.push({ x: p.x, y: p.y - p.h / 2, vx: rnd(-10, 10), vy: rnd(-10, 10), life: 0.3, max: 0.3, color: p.color, size: 3 });
        if (dead) { this.burst(p.x, p.y, 5, p.color, 60); this.projectiles.splice(i, 1); }
      }
    }

    updatePickups(dt) {
      const h = this.hero;
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const p = this.pickups[i];
        p.t += dt;
        p.vy = Math.min(400, p.vy + 900 * dt);
        this.moveBody(p, dt);
        if (p.onGround) p.vx *= 0.8;
        if (p.t > 0.35 && Math.abs(p.x - h.x) < 14 && p.y > h.y - h.h - 4 && p.y - p.h < h.y + 4) {
          this.sv.geo += p.v; this.pickups.splice(i, 1);
          this.tone(900 + Math.random() * 200, 'square', 0.05, 0.05, 200);
        } else if (p.t > 25) this.pickups.splice(i, 1);
      }
    }

    updateShade(dt) {
      const s = this.shade; if (!s) return;
      s.t += dt; if (s.flash > 0) s.flash -= dt;
      s.y += Math.sin(s.t * 2) * 0.1;
    }

    // ============== interacoes ==============
    checkExits() {
      const h = this.hero;
      if (this.exitCd > 0) { this.exitCd -= 1 / 120; return; }
      for (const ex of this.room.exits) {
        if (ex === this.room.exits[0] && this.room.lock && this.bossActive) continue;
        const l = ex.x * T, r = (ex.x + ex.w) * T, t = ex.y * T, b = (ex.y + ex.h) * T;
        if (h.x > l + 2 && h.x < r - 2 && h.y - 4 > t && h.y - h.h < b) {
          this.transition = { to: ex.to, tx: ex.tx, ty: ex.ty, t: 0 };
          this.fadeTarget = 1;
          return;
        }
      }
    }

    updateTransition(dt) {
      const tr = this.transition;
      tr.t += dt;
      if (this.fade >= 1) {
        this.transition = null;
        const hp = this.hero.hp, soul = this.hero.soul;
        this.loadRoom(tr.to, tr.tx, tr.ty, false);
        this.hero.hp = hp; this.hero.soul = soul;
        this.fade = 1; this.fadeTarget = 0;
        this.saveGame();
      }
    }

    checkInteractables() {
      const h = this.hero;
      this.nearBench = null; this.nearNpc = null;
      for (const b of this.room.benches) {
        if (Math.abs(h.x - (b.x * T + 8)) < 28 && Math.abs(h.y - (b.y + 1) * T) < 14) this.nearBench = b;
      }
      for (const n of this.room.npcs) {
        if (Math.abs(h.x - (n.x * T + 8)) < 56 && Math.abs(h.y - (n.y + 1) * T) < 40) this.nearNpc = n;
      }
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        const ix = it.x * T + 8, iy = (it.y + 1) * T;
        if (Math.abs(h.x - ix) < 16 && Math.abs((h.y - 12) - (iy - 12)) < 22) {
          this.items.splice(i, 1); this.sv.abilities[it.id] = true;
          const name = it.id === 'dash' ? 'CAPA DE MARCELINE' : 'ASAS DE GUNTHER';
          const sub = it.id === 'dash' ? 'Pressione dash (L / botão 💨) para disparar para frente' : 'Pule de novo no ar (pulo duplo)';
          this.title = { text: name, sub, t: 5, big: true };
          this.hitstop = 0.25; this.shake = 4;
          sounds.levelUp(); this.burst(ix, iy - 12, 40, '#fef3c7', 160);
          this.updateTouchUI(); this.saveGame();
        }
      }
      const btn = document.getElementById('hk-btn-interact');
      if (btn) {
        const show = (this.nearBench) && this.isTouch;
        btn.classList.toggle('hidden', !show);
        btn.textContent = '🛏️ Descansar';
      }
    }

    tryInteract() {
      if (!this.running || this.paused || this.hero.dead || this.transition) return;
      if (this.nearBench && !this.benchOpen && this.hero.onGround) this.openBench();
    }

    openBench() {
      const h = this.hero, b = this.nearBench;
      this.benchOpen = true; this.paused = true;
      h.hp = this.maxHp(); h.soul = Math.max(h.soul, 0);
      this.sv.bench = { room: this.room.id, x: b.x, y: b.y };
      this.hero.vx = 0;
      sounds.potionDrink();
      // reinicia inimigos da sala (como no jogo original)
      this.respawnRoomEnemies();
      this.saveGame();
      this.renderBenchMenu();
      document.getElementById('hk-bench').classList.remove('hidden');
    }

    closeBench() {
      this.benchOpen = false; this.paused = false;
      document.getElementById('hk-bench').classList.add('hidden');
      this.last = performance.now();
    }

    respawnRoomEnemies() {
      this.enemies = [];
      this.room.enemies.forEach(e => this.spawnEnemy(e.t, e.x, e.y));
      if (this.room.boss && !this.sv.flags.boss) this.boss = this.spawnEnemy('boss', this.room.boss.x, this.room.boss.y);
    }

    renderBenchMenu() {
      const box = document.getElementById('hk-bench-items');
      document.getElementById('hk-bench-geo').textContent = this.sv.geo;
      const dl = this.sv.dmgLvl || 0, hl = this.sv.hpLvl || 0;
      const items = [
        { icon: '⚔️', name: 'Afiar a arma', desc: `Dano ${this.nailDmg()} → ${this.nailDmg() + 1}`, cost: 80 + dl * 90, max: dl >= 4, apply: () => { this.sv.dmgLvl = dl + 1; } },
        { icon: '❤️', name: 'Vida extra', desc: `Vidas ${this.maxHp()} → ${this.maxHp() + 1}`, cost: 120 + hl * 120, max: hl >= 4, apply: () => { this.sv.hpLvl = hl + 1; this.hero.hp = this.maxHp(); } }
      ];
      box.innerHTML = '';
      items.forEach(it => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'hk-bench-item' + ((this.sv.geo < it.cost || it.max) ? ' off' : '');
        b.innerHTML = `<span>${it.icon}</span><span class="t"><b>${it.name}</b><small>${it.max ? 'Máximo' : it.desc}</small></span><span class="c">${it.max ? '—' : '🪙 ' + it.cost}</span>`;
        b.addEventListener('click', () => {
          if (it.max || this.sv.geo < it.cost) return;
          this.sv.geo -= it.cost; it.apply(); sounds.itemPickup(); this.saveGame(); this.renderBenchMenu();
        });
        box.appendChild(b);
      });
    }

    // ============== particulas / camera ==============
    burst(x, y, n, color, speed) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = rnd(0.3, 1) * speed;
        this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: rnd(0.25, 0.6), max: 0.6, color, size: rnd(1.5, 3.5), grav: 220 });
      }
    }
    spark(x, y, color, n, spd, vy) {
      for (let i = 0; i < n; i++) this.particles.push({ x, y, vx: rnd(-spd, spd), vy: vy || -20, life: rnd(0.3, 0.7), max: 0.7, color, size: 2 });
    }
    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i]; p.life -= dt;
        if (p.life <= 0) { this.particles.splice(i, 1); continue; }
        if (p.grav) p.vy += p.grav * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
      if (this.particles.length > 400) this.particles.splice(0, this.particles.length - 400);
    }

    snapCamera() {
      const h = this.hero;
      this.camera.x = clamp(h.x - VW / 2, 0, Math.max(0, this.room.w * T - VW));
      this.camera.y = clamp(h.y - VH * 0.6, 0, Math.max(0, this.room.h * T - VH));
    }

    updateCamera(dt) {
      const h = this.hero;
      const tx = clamp(h.x - VW / 2 + h.face * 36, 0, Math.max(0, this.room.w * T - VW));
      const ty = clamp(h.y - VH * 0.6, 0, Math.max(0, this.room.h * T - VH));
      const k = Math.min(1, dt * 6);
      this.camera.x += (tx - this.camera.x) * k;
      this.camera.y += (ty - this.camera.y) * k;
    }

    // ============== fundo (parallax) ==============
    genBackground() {
      const th = THEMES[this.room.theme];
      const rand = seeded(this.room.id.length * 7919 + this.room.w * 13);
      const W = this.room.w * T;
      this.bg = th.layers.map((color, li) => {
        const f = 0.18 + li * 0.2;
        const shapes = [];
        const span = W * f + VW + 200;
        let x = -80;
        while (x < span) {
          const s = { x, a: rand(), b: rand(), c: rand() };
          shapes.push(s);
          x += (this.room.theme === 'hall' ? 90 : this.room.theme === 'tree' ? 50 : 40) + rand() * 60;
        }
        return { f, color, shapes };
      });
    }

    drawBackground(ctx) {
      const th = THEMES[this.room.theme];
      const g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
      const kind = this.room.theme;
      this.bg.forEach((layer, li) => {
        ctx.fillStyle = layer.color;
        const ox = -this.camera.x * layer.f;
        const oy = -this.camera.y * layer.f * 0.5;
        layer.shapes.forEach(s => {
          const x = s.x + ox;
          if (x < -90 || x > VW + 90) return;
          const k = 1 + li * 0.35;
          if (kind === 'tree') {
            const th2 = 90 + s.a * 120 * k;
            ctx.fillRect(x - 5 * k, VH - th2 + oy + 90, 10 * k, th2);
            ctx.beginPath(); ctx.arc(x, VH - th2 + oy + 88, 26 + s.b * 26 * k, 0, 7); ctx.fill();
          } else if (kind === 'cave') {
            const len = 40 + s.a * 120 * k;
            ctx.beginPath(); ctx.moveTo(x - 14 * k, oy - 10); ctx.lineTo(x + 14 * k, oy - 10); ctx.lineTo(x + (s.b - 0.5) * 10, len + oy); ctx.fill();
            if (s.c > 0.45) { const lh = 30 + s.b * 90 * k; ctx.beginPath(); ctx.moveTo(x - 16 * k, VH + oy + 120); ctx.lineTo(x + 16 * k, VH + oy + 120); ctx.lineTo(x, VH - lh + oy + 120); ctx.fill(); }
          } else if (kind === 'crypt') {
            const hh = 60 + s.a * 150 * k;
            ctx.beginPath(); ctx.moveTo(x - 10 * k, VH + 60 + oy); ctx.lineTo(x, VH - hh + oy + 60); ctx.lineTo(x + 10 * k, VH + 60 + oy); ctx.fill();
            if (s.b > 0.5) { ctx.beginPath(); ctx.moveTo(x - 9 * k, oy - 20); ctx.lineTo(x + 9 * k, oy - 20); ctx.lineTo(x, 50 + s.c * 110 * k + oy); ctx.fill(); }
          } else {
            const hh = 140 + s.a * 100;
            ctx.fillRect(x - 12 * k, VH - hh + oy + 40, 24 * k, hh + 60);
            ctx.fillRect(x - 17 * k, VH - hh + oy + 34, 34 * k, 10);
            if (s.c > 0.6) { ctx.beginPath(); ctx.arc(x + 45, VH - hh + oy + 60, 45, Math.PI, 0); ctx.fill(); }
          }
        });
      });
    }

    // ============== desenho ==============
    render() {
      const ctx = this.ctx;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      this.drawBackground(ctx);

      const sh = this.shake > 0 ? { x: rnd(-1, 1) * this.shake, y: rnd(-1, 1) * this.shake } : { x: 0, y: 0 };
      const cx = Math.round(this.camera.x + sh.x), cy = Math.round(this.camera.y + sh.y);
      ctx.save();
      ctx.translate(-cx, -cy);
      this.drawTiles(ctx, cx, cy);
      this.drawProps(ctx);
      this.items.forEach(it => this.drawItem(ctx, it));
      if (this.shade) this.drawShade(ctx);
      this.enemies.forEach(e => this.drawEnemy(ctx, e));
      this.pickups.forEach(p => { ctx.fillStyle = p.v > 1 ? '#fde68a' : '#fcd34d'; ctx.fillRect(Math.round(p.x - 3), Math.round(p.y - 6), 6, 6); ctx.fillStyle = '#fff7'; ctx.fillRect(Math.round(p.x - 2), Math.round(p.y - 5), 2, 2); });
      this.drawHero(ctx);
      this.drawProjectiles(ctx);
      this.drawParticles(ctx);
      this.drawSpeech(ctx);
      ctx.restore();

      this.drawFog(ctx);
      this.drawLighting(ctx, cx, cy);
      this.drawMotes(ctx);
      this.drawHUD(ctx);
      if (this.fade > 0.001) { ctx.fillStyle = `rgba(0,0,0,${clamp(this.fade, 0, 1)})`; ctx.fillRect(0, 0, VW, VH); }
      ctx.restore();
    }

    drawTiles(ctx, cx, cy) {
      const th = THEMES[this.room.theme];
      const x0 = Math.max(0, Math.floor(cx / T)), x1 = Math.min(this.room.w - 1, Math.floor((cx + VW) / T));
      const y0 = Math.max(0, Math.floor(cy / T)), y1 = Math.min(this.room.h - 1, Math.floor((cy + VH) / T));
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const ch = this.grid[ty][tx];
        if (ch === '.') continue;
        const px = tx * T, py = ty * T, hh = hash(tx, ty);
        if (ch === '#') {
          const shade = (hh % 5) - 2;
          ctx.fillStyle = th.tile; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = `rgba(${shade > 0 ? '255,255,255' : '0,0,0'},${Math.abs(shade) * 0.025})`; ctx.fillRect(px, py, T, T);
          ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(px + (hh % 11), py + ((hh >> 4) % 11), 3, 1); ctx.fillRect(px + ((hh >> 8) % 12), py + ((hh >> 12) % 13), 1, 3);
          if (this.tile(tx, ty - 1) === '.' || this.tile(tx, ty - 1) === '=' || this.tile(tx, ty - 1) === '^') {
            ctx.fillStyle = th.top; ctx.fillRect(px, py, T, 3);
            ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(px, py, T, 1);
            if (hh % 3 === 0) { ctx.fillStyle = th.top; ctx.fillRect(px + (hh % 12), py + 3, 2, 3 + (hh % 3)); }
          }
          if (this.tile(tx, ty + 1) === '.') { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(px, py + T - 2, T, 2); }
        } else if (ch === '=') {
          ctx.fillStyle = th.tile; ctx.fillRect(px, py, T, 5);
          ctx.fillStyle = th.top; ctx.fillRect(px, py, T, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(px, py + 5, T, 2);
        } else if (ch === '^') {
          ctx.fillStyle = '#d7dde8';
          for (let k = 0; k < 2; k++) {
            ctx.beginPath(); ctx.moveTo(px + k * 8, py + T); ctx.lineTo(px + k * 8 + 4, py + 4); ctx.lineTo(px + k * 8 + 8, py + T); ctx.fill();
          }
          ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(px, py + T - 3, T, 3);
        }
      }
    }

    drawProps(ctx) {
      const th = THEMES[this.room.theme];
      // bancos
      this.room.benches.forEach(b => {
        const x = b.x * T, y = (b.y + 1) * T;
        ctx.fillStyle = '#2b2233'; ctx.fillRect(x - 2, y - 9, 20, 3);
        ctx.fillStyle = '#4a3a58'; ctx.fillRect(x, y - 6, 16, 6);
        ctx.fillStyle = '#6b5a7e'; ctx.fillRect(x, y - 6, 16, 1);
        ctx.fillStyle = '#2b2233'; ctx.fillRect(x - 2, y - 15, 3, 9); ctx.fillRect(x + 15, y - 15, 3, 9);
      });
      // NPCs
      this.room.npcs.forEach(n => {
        const x = n.x * T + 8, y = (n.y + 1) * T, bob = Math.sin(this.t * 2 + n.x) * 1;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y, 8, 2.5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = n.color;
        if (n.id === 'jake') { ctx.beginPath(); ctx.ellipse(x, y - 11 + bob, 9, 11, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 6, y - 17 + bob, 5, 5); ctx.fillRect(x + 1, y - 17 + bob, 5, 5); ctx.fillStyle = '#111'; ctx.fillRect(x - 4, y - 15 + bob, 2, 3); ctx.fillRect(x + 3, y - 15 + bob, 2, 3); }
        else if (n.id === 'bmo') { ctx.fillRect(x - 8, y - 22 + bob, 16, 21); ctx.fillStyle = '#115e59'; ctx.fillRect(x - 6, y - 19 + bob, 12, 9); ctx.fillStyle = '#ccfbf1'; ctx.fillRect(x - 4, y - 16 + bob, 2, 2); ctx.fillRect(x + 2, y - 16 + bob, 2, 2); }
        else { ctx.fillStyle = '#0f172a'; ctx.fillRect(x - 7, y - 28 + bob, 14, 28); ctx.fillStyle = n.color; ctx.fillRect(x - 4, y - 25 + bob, 8, 8); ctx.fillStyle = '#dc2626'; ctx.fillRect(x - 3, y - 22 + bob, 2, 2); ctx.fillRect(x + 1, y - 22 + bob, 2, 2); }
      });
      // porta trancada
      if (this.room.lock && this.bossActive) {
        const L = this.room.lock;
        ctx.fillStyle = th.top; ctx.globalAlpha = 0.5 + Math.sin(this.t * 6) * 0.15; ctx.fillRect(L.x * T + T * 1.4, L.y * T, 3, L.h * T); ctx.globalAlpha = 1;
      }
    }

    drawItem(ctx, it) {
      const x = it.x * T + 8, y = (it.y + 1) * T - 14 + Math.sin(this.t * 3 + it.bob) * 3;
      const g = ctx.createRadialGradient(x, y, 2, x, y, 26);
      g.addColorStop(0, 'rgba(255,240,180,0.55)'); g.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 26, y - 26, 52, 52);
      ctx.fillStyle = it.id === 'dash' ? '#c026d3' : '#7dd3fc';
      ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 8, y); ctx.lineTo(x, y + 9); ctx.lineTo(x - 8, y); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, y - 2, 4, 4);
    }

    drawShade(ctx) {
      const s = this.shade, x = s.x, y = s.y - 14 + Math.sin(s.t * 2) * 3;
      ctx.globalAlpha = 0.65 + Math.sin(s.t * 4) * 0.15;
      ctx.fillStyle = s.flash > 0 ? '#fff' : '#05050a';
      ctx.beginPath(); ctx.ellipse(x, y, 8, 13, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(x - 5, y - 4, 3, 5); ctx.fillRect(x + 2, y - 4, 3, 5);
      ctx.globalAlpha = 1;
    }

    drawEnemy(ctx, e) {
      const x = Math.round(e.x), y = Math.round(e.y);
      const white = e.flash > 0;
      ctx.save();
      if (e.type === 'crawler') {
        const sq = Math.sin(e.t * 7) * 1.2;
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y, 9, 2.5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = white ? '#fff' : '#3b1030';
        ctx.beginPath(); ctx.ellipse(x, y - 6, 9 + sq * 0.5, 6.5 - sq * 0.5, 0, Math.PI, 0); ctx.lineTo(x + 9, y); ctx.lineTo(x - 9, y); ctx.fill();
        ctx.fillStyle = white ? '#fff' : '#ec4899'; ctx.fillRect(x - 9, y - 2, 18, 2);
        ctx.fillStyle = '#fff'; ctx.fillRect(x + e.dir * 2 - 3, y - 8, 2, 3); ctx.fillRect(x + e.dir * 2 + 2, y - 8, 2, 3);
      } else if (e.type === 'flyer') {
        const fl = Math.sin(e.t * 18) * 5;
        ctx.fillStyle = white ? '#fff' : '#1d0b2a';
        ctx.beginPath(); ctx.ellipse(x, y - 7, 6, 7, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - 4, y - 8); ctx.lineTo(x - 17, y - 14 - fl); ctx.lineTo(x - 9, y - 3); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 4, y - 8); ctx.lineTo(x + 17, y - 14 - fl); ctx.lineTo(x + 9, y - 3); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(x - 4, y - 10, 3, 3); ctx.fillRect(x + 1, y - 10, 3, 3);
        ctx.fillStyle = '#f472b6'; ctx.fillRect(x - 3, y - 9, 1, 2); ctx.fillRect(x + 2, y - 9, 1, 2);
      } else if (e.type === 'skeleton') {
        const w = Math.sin(e.t * 8) * (Math.abs(e.vx) > 5 ? 2 : 0.4);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y, 8, 2.5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = white ? '#fff' : '#cfd8e3';
        ctx.fillRect(x - 5, y - 26, 10, 9);
        ctx.fillRect(x - 2, y - 17, 4, 11);
        ctx.fillRect(x - 6, y - 15, 12, 2); ctx.fillRect(x - 5, y - 11, 10, 2);
        ctx.fillRect(x - 4 + w, y - 6, 3, 6); ctx.fillRect(x + 1 - w, y - 6, 3, 6);
        ctx.fillStyle = '#05080f'; ctx.fillRect(x - 3, y - 24, 2, 3); ctx.fillRect(x + 1, y - 24, 2, 3);
        ctx.fillStyle = '#7dd3fc'; ctx.fillRect(x - 3 + (e.dir > 0 ? 1 : 0), y - 23, 1, 1); ctx.fillRect(x + 1 + (e.dir > 0 ? 1 : 0), y - 23, 1, 1);
        if (e.state === 'lunge') { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x - e.dir * 14, y - 20, 10, 2); }
      } else if (e.type === 'boss') {
        let sx = 1, sy = 1;
        if (e.state === 'crouch') { sy = 0.78; sx = 1.18; }
        else if (e.state === 'air') { sy = 1.15; sx = 0.9; }
        else if (e.state === 'sleep') { sy = 0.85; sx = 1.05; }
        else { const b = Math.sin(e.t * 3) * 0.04; sy += b; sx -= b; }
        ctx.translate(x, y); ctx.scale(sx, sy);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, 32, 5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = white ? '#fff' : (e.phase === 3 ? '#5b1a6e' : '#3d1450');
        ctx.beginPath(); ctx.ellipse(0, -22, 28, 24, 0, Math.PI, 0); ctx.lineTo(28, 0); ctx.lineTo(-28, 0); ctx.fill();
        ctx.fillStyle = 'rgba(232,121,249,0.25)'; ctx.beginPath(); ctx.ellipse(-8, -34, 9, 6, -0.4, 0, 7); ctx.fill();
        // coroa
        ctx.fillStyle = white ? '#fff' : '#f59e0b';
        ctx.fillRect(-12, -50, 24, 5); ctx.beginPath(); ctx.moveTo(-12, -50); ctx.lineTo(-8, -58); ctx.lineTo(-3, -50); ctx.lineTo(0, -60); ctx.lineTo(3, -50); ctx.lineTo(8, -58); ctx.lineTo(12, -50); ctx.fill();
        // olhos
        const aw = e.state === 'sleep' ? 1 : 5;
        ctx.fillStyle = '#fff'; ctx.fillRect(-12, -30, 8, aw); ctx.fillRect(4, -30, 8, aw);
        if (e.state !== 'sleep') { ctx.fillStyle = e.phase === 3 ? '#ef4444' : '#f0abfc'; ctx.fillRect(-9 + e.dir * 2, -29, 3, 3); ctx.fillRect(7 + e.dir * 2, -29, 3, 3); }
      }
      ctx.restore();
    }

    drawHero(ctx) {
      const h = this.hero;
      if (h.dead) return;
      if (h.inv > 0 && Math.floor(h.inv * 20) % 2 === 0 && h.hurtStun <= 0) ctx.globalAlpha = 0.35;
      const moving = Math.abs(h.vx) > 20 && h.onGround;
      PixelArtRenderer.drawHero(ctx, h.x, h.y - 8, {
        scale: 1.15, facing: h.face > 0 ? 'right' : 'left', isMoving: moving, animFrame: h.anim * 14,
        isAttacking: h.atkT > 0, attackProgress: h.atkT > 0 ? 1 - h.atkT / 0.2 : 0, profile: this.profile
      });
      ctx.globalAlpha = 1;
      // corte do ataque
      if (h.atkT > 0) {
        const p = 1 - h.atkT / 0.2;
        ctx.save();
        ctx.translate(h.x, h.y - 16);
        let ang = h.atkDir === 'h' ? (h.face > 0 ? 0 : Math.PI) : h.atkDir === 'u' ? -Math.PI / 2 : Math.PI / 2;
        ctx.rotate(ang);
        const r = 30 * this.cls.reach + 4;
        ctx.globalAlpha = 1 - p * 0.9;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5 - p * 3;
        ctx.beginPath(); ctx.arc(-6, 0, r, -0.9 + p * 0.5, 0.9 - p * 0.2); ctx.stroke();
        ctx.strokeStyle = this.cls.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(-6, 0, r - 5, -0.8 + p * 0.5, 0.8 - p * 0.2); ctx.stroke();
        ctx.restore(); ctx.globalAlpha = 1;
      }
      if (h.focusT > 0) {
        ctx.fillStyle = `rgba(190,230,255,${0.2 + h.focusT * 0.4})`;
        ctx.beginPath(); ctx.ellipse(h.x, h.y - 14, 12 + h.focusT * 6, 18, 0, 0, 7); ctx.fill();
      }
    }

    drawProjectiles(ctx) {
      this.projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        if (p.ground) { ctx.beginPath(); ctx.moveTo(p.x - 8, p.y); ctx.lineTo(p.x, p.y - 14); ctx.lineTo(p.x + 8, p.y); ctx.fill(); }
        else if (p.from === 'p') { ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(p.x, p.y - 8, 12, 8, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(p.x + Math.sign(p.vx) * 3, p.y - 8, 5, 3, 0, 0, 7); ctx.fill(); }
        else { ctx.beginPath(); ctx.ellipse(p.x, p.y - 6, 5, 7, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(p.x - 1, p.y - 8, 2, 4); }
      });
    }

    drawParticles(ctx) {
      this.particles.forEach(p => {
        const a = clamp(p.life / (p.max || 0.5), 0, 1);
        if (p.ghost) {
          ctx.globalAlpha = a * 0.5; ctx.fillStyle = '#bfe3ff';
          ctx.fillRect(Math.round(p.x - 6), Math.round(p.y - 14), 12, 26); ctx.globalAlpha = 1; return;
        }
        ctx.globalAlpha = a; ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.ceil(p.size), Math.ceil(p.size));
      });
      ctx.globalAlpha = 1;
    }

    drawSpeech(ctx) {
      const n = this.nearNpc; if (!n) return;
      const lines = (this.isTouch && n.touchLines) ? n.touchLines : n.lines;
      const idx = Math.floor(this.t / 5) % lines.length;
      const text = lines[idx];
      ctx.save();
      ctx.font = '8px "Press Start 2P", monospace';
      const maxW = 240;
      const words = text.split(' '); const rows = []; let cur = '';
      words.forEach(w => { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxW && cur) { rows.push(cur); cur = w; } else cur = test; });
      rows.push(cur);
      const bw = maxW + 16, bh = rows.length * 12 + 12;
      const x = clamp(n.x * T + 8 - bw / 2, this.camera.x + 4, this.camera.x + VW - bw - 4), y = (n.y + 1) * T - 42 - bh;
      ctx.fillStyle = 'rgba(8,6,16,0.88)'; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8eef9'; ctx.textAlign = 'left';
      rows.forEach((r2, i) => ctx.fillText(r2, x + 8, y + 15 + i * 12));
      ctx.restore();
    }

    drawFog(ctx) {
      const th = THEMES[this.room.theme];
      for (let i = 0; i < 2; i++) {
        const off = ((this.t * (8 + i * 5)) % VW);
        const g = ctx.createLinearGradient(0, VH - 120 + i * 20, 0, VH);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, th.mote + '22');
        ctx.fillStyle = g; ctx.fillRect(0, VH - 120 + i * 20, VW, 120);
      }
    }

    drawLighting(ctx, cx, cy) {
      const th = THEMES[this.room.theme];
      const l = this.lctx;
      l.globalCompositeOperation = 'source-over';
      l.clearRect(0, 0, VW, VH);
      const dark = this.bossActive ? th.dark + 0.06 : th.dark;
      l.fillStyle = `rgba(2,1,8,${dark})`; l.fillRect(0, 0, VW, VH);
      l.globalCompositeOperation = 'destination-out';
      const lamp = (x, y, r, a) => {
        const sx = x - cx, sy = y - cy;
        if (sx < -r || sx > VW + r || sy < -r || sy > VH + r) return;
        const g = l.createRadialGradient(sx, sy, r * 0.12, sx, sy, r);
        g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        l.fillStyle = g; l.fillRect(sx - r, sy - r, r * 2, r * 2);
      };
      const h = this.hero;
      lamp(h.x, h.y - 14, 120 + Math.sin(this.t * 3) * 3, 1);
      this.room.benches.forEach(b => lamp(b.x * T + 8, (b.y + 1) * T - 12, 80, 0.9));
      this.items.forEach(it => lamp(it.x * T + 8, (it.y + 1) * T - 14, 70, 1));
      this.projectiles.forEach(p => lamp(p.x, p.y - 8, 50, 0.8));
      this.enemies.forEach(e => { if (e.type === 'boss' && e.state !== 'sleep') lamp(e.x, e.y - 26, 110, 0.7); });
      if (this.shade) lamp(this.shade.x, this.shade.y - 14, 45, 0.6);
      l.globalCompositeOperation = 'source-over';
      ctx.drawImage(this.light, 0, 0);
      // brilho colorido nas fontes de luz
      ctx.globalCompositeOperation = 'lighter';
      const glow = (x, y, r, col) => {
        const sx = x - cx, sy = y - cy;
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
        g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
      };
      this.room.benches.forEach(b => glow(b.x * T + 8, (b.y + 1) * T - 12, 46, 'rgba(255,200,120,0.22)'));
      glow(h.x, h.y - 14, 70, 'rgba(255,245,220,0.07)');
      ctx.globalCompositeOperation = 'source-over';
    }

    drawMotes(ctx) {
      const th = THEMES[this.room.theme];
      ctx.fillStyle = th.mote;
      this.motes.forEach(m => {
        m.y -= m.v * 0.016; m.x += Math.sin(this.t + m.p) * 0.2;
        if (m.y < -4) { m.y = VH + 4; m.x = rnd(0, VW); }
        ctx.globalAlpha = 0.25 + 0.25 * Math.sin(this.t * 2 + m.p);
        ctx.fillRect(Math.round(m.x), Math.round(m.y), m.s, m.s);
      });
      ctx.globalAlpha = 1;
    }

    drawHUD(ctx) {
      const h = this.hero;
      // vaso de alma
      const sx = 34, sy = 34, R = 20;
      ctx.save();
      ctx.fillStyle = 'rgba(5,6,14,0.75)'; ctx.beginPath(); ctx.arc(sx, sy, R, 0, 7); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(sx, sy, R - 2, 0, 7); ctx.clip();
      const fillH = (h.soul / 99) * (R * 2 - 4);
      const sg = ctx.createLinearGradient(0, sy + R, 0, sy - R);
      sg.addColorStop(0, '#9fd8ff'); sg.addColorStop(1, '#f2fbff');
      ctx.fillStyle = sg;
      const wave = Math.sin(this.t * 3) * 1.2;
      ctx.fillRect(sx - R, sy + R - 2 - fillH + wave, R * 2, fillH + 4);
      ctx.restore();
      ctx.strokeStyle = '#e8eef9'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, R, 0, 7); ctx.stroke();
      if (h.soul >= 33) { ctx.strokeStyle = 'rgba(200,235,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sx, sy, R + 3 + Math.sin(this.t * 5), 0, 7); ctx.stroke(); }
      ctx.restore();
      // mascaras
      const max = this.maxHp();
      for (let i = 0; i < max; i++) {
        const mx = 66 + i * 20, my = 22, full = i < h.hp;
        ctx.save(); ctx.translate(mx, my);
        ctx.fillStyle = full ? '#f4f7fb' : 'rgba(10,10,20,0.7)';
        ctx.strokeStyle = full ? '#ffffff' : '#6b7280'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-7, -9); ctx.quadraticCurveTo(0, -12, 7, -9); ctx.lineTo(8, 2); ctx.quadraticCurveTo(0, 12, -8, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        if (full) { ctx.fillStyle = '#0a0a14'; ctx.beginPath(); ctx.ellipse(-3.5, -2, 2, 3.2, 0.3, 0, 7); ctx.ellipse(3.5, -2, 2, 3.2, -0.3, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      // geo
      ctx.fillStyle = '#fcd34d'; ctx.beginPath(); ctx.arc(72, 52, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#a16207'; ctx.beginPath(); ctx.arc(72, 52, 2.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#f3f4f6'; ctx.font = '10px "Press Start 2P", monospace'; ctx.textAlign = 'left';
      ctx.fillText(String(this.sv.geo), 82, 56);

      // barra do chefe
      if (this.bossActive && this.boss) {
        const b = this.boss, w = 300, x = (VW - w) / 2, y = VH - 28;
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x - 3, y - 3, w + 6, 12);
        ctx.fillStyle = '#e8eef9'; ctx.fillRect(x, y, w * clamp(b.hp / b.maxHp, 0, 1), 6);
        ctx.strokeStyle = '#e8eef9'; ctx.lineWidth = 1; ctx.strokeRect(x - 3.5, y - 3.5, w + 7, 13);
        ctx.fillStyle = '#e8eef9'; ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center';
        ctx.fillText('REI GELATINA DOCE', VW / 2, y - 8);
      }

      // titulo da area / item
      if (this.title) {
        const t = this.title;
        const alpha = clamp(Math.min(t.t * 1.2, 1), 0, 1);
        ctx.save(); ctx.globalAlpha = alpha; ctx.textAlign = 'center';
        ctx.fillStyle = '#f3f4f6';
        ctx.font = (t.big ? 'italic 600 26px' : 'italic 600 24px') + ' Georgia, "Times New Roman", serif';
        ctx.shadowColor = 'rgba(160,200,255,0.8)'; ctx.shadowBlur = 12;
        ctx.fillText(t.text, VW / 2, VH * 0.34);
        ctx.shadowBlur = 0;
        ctx.fillRect(VW / 2 - 70, VH * 0.34 + 10, 140, 1);
        if (t.sub) { ctx.font = '8px "Press Start 2P", monospace'; ctx.fillStyle = '#cbd5e1'; ctx.fillText(t.sub, VW / 2, VH * 0.34 + 30); }
        ctx.restore();
      }
      if (this.msg) {
        ctx.save(); ctx.globalAlpha = clamp(this.msg.t, 0, 1); ctx.textAlign = 'center'; ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillStyle = '#fef3c7'; ctx.fillText(this.msg.text, VW / 2, VH - 40); ctx.restore();
      }
      if (this.endBanner > 0) {
        ctx.save(); ctx.globalAlpha = clamp(this.endBanner, 0, 1); ctx.textAlign = 'center';
        ctx.fillStyle = '#f9fafb'; ctx.font = 'italic 600 30px Georgia, serif'; ctx.shadowColor = '#e879f9'; ctx.shadowBlur = 16;
        ctx.fillText('Rei Gelatina Derrotado', VW / 2, VH * 0.4);
        ctx.shadowBlur = 0; ctx.font = '8px "Press Start 2P", monospace'; ctx.fillStyle = '#cbd5e1';
        ctx.fillText('Fim da primeira parte. Mais áreas em breve!', VW / 2, VH * 0.4 + 28);
        ctx.restore();
      }
      if (this.nearBench && !this.isTouch && !this.benchOpen) {
        ctx.save(); ctx.textAlign = 'center'; ctx.font = '8px "Press Start 2P", monospace'; ctx.fillStyle = '#e8eef9';
        const bx = this.nearBench.x * T + 8 - this.camera.x, by = (this.nearBench.y + 1) * T - 34 - this.camera.y;
        ctx.fillText('↑ Descansar', bx, by); ctx.restore();
      }
      if (this.hero.dead) {
        ctx.save(); ctx.globalAlpha = clamp((this.hero.deadT - 0.6), 0, 1); ctx.textAlign = 'center';
        ctx.fillStyle = '#e5e7eb'; ctx.font = 'italic 600 24px Georgia, serif'; ctx.fillText('Você caiu...', VW / 2, VH / 2); ctx.restore();
      }
    }
  }

  // ------------------------------------------------------------------
  // LIGACAO COM A TELA INICIAL
  // ------------------------------------------------------------------
  window.addEventListener('DOMContentLoaded', () => {
    const hk = new HollowGame();
    window.__hk = hk;
    const startBtn = document.getElementById('start-hk-btn');
    const contBtn = document.getElementById('continue-hk-btn');
    const begin = (save) => {
      document.getElementById('character-creation-screen').classList.remove('active');
      document.getElementById('game-screen').classList.remove('active');
      if (save) Object.assign(heroProfile, save.profile);
      hk.start(heroProfile, save);
    };
    if (startBtn) startBtn.addEventListener('click', () => {
      const old = HollowGame.loadSave();
      if (old && !confirm('Já existe um jogo salvo do Abismo. Começar um novo vai substituí-lo. Continuar?')) return;
      begin(null);
    });
    const sv = HollowGame.loadSave();
    if (sv && contBtn) {
      contBtn.textContent = `▶ CONTINUAR ABISMO: ${sv.profile.name}`;
      contBtn.classList.remove('hidden');
      contBtn.addEventListener('click', () => begin(HollowGame.loadSave()));
    }
  });
})();
