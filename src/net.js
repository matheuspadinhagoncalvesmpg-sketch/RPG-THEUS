// Multijogador no cliente: conexão, outros jogadores, inimigos compartilhados e base comum.
//
// Regras:
// - Cada sala tem um "anfitrião" (o primeiro jogador nela). Ele simula os inimigos e manda
//   fotos (snapshots) do estado; os outros só desenham essas fotos e mandam os golpes que deram.
// - Progresso (habilidades, moedas, materiais) é de cada jogador; as construções são do mundo.
import { ENEMY_TYPES, Projectile } from './enemies.js';
import { BOSS_TYPES } from './bosses.js';
import { drawHero, drawSlash } from './art.js';
import { WEAPONS, ARMORS } from './config.js';

const CODE_BY_CLASS = new Map(Object.entries(ENEMY_TYPES).map(([k, v]) => [v, k]));

// ───────── Transportes ─────────
class WSTransport {
  open(onMsg, onClose) {
    return new Promise((resolve, reject) => {
      const url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + location.pathname.replace(/[^/]*$/, '') + 'ws';
      let ok = false;
      const ws = new WebSocket(url);
      const timer = setTimeout(() => { if (!ok) { ws.close(); reject(new Error('timeout')); } }, 4000);
      ws.onopen = () => { ok = true; clearTimeout(timer); resolve(); };
      ws.onerror = () => { if (!ok) { clearTimeout(timer); reject(new Error('ws')); } };
      ws.onclose = () => { if (ok) onClose(); };
      ws.onmessage = (e) => { try { onMsg(JSON.parse(e.data)); } catch (err) { /* ignora */ } };
      this.ws = ws;
    });
  }
  send(m) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); }
  close() { try { this.ws.close(); } catch (e) { /* ok */ } }
}

// Reserva: HTTP a cada ~100 ms (funciona atrás de qualquer proxy).
class PollTransport {
  async open(onMsg, onClose) {
    const r = await fetch('api/mp/connect', { method: 'POST' });
    if (!r.ok) throw new Error('poll');
    const { sid, secret } = await r.json();
    this.sid = sid; this.secret = secret; this.out = []; this.closed = false;
    const tick = async () => {
      if (this.closed) return;
      const msgs = this.out; this.out = [];
      try {
        const res = await fetch('api/mp/poll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sid, secret, msgs }) });
        if (res.status === 410) { this.closed = true; return onClose(); }
        const data = await res.json();
        for (const m of data.msgs || []) onMsg(m);
      } catch (e) { /* rede instável: tenta de novo */ }
      setTimeout(tick, 90);
    };
    tick();
  }
  send(m) { if (this.out.length < 100) this.out.push(m); }
  close() {
    this.closed = true;
    fetch('api/mp/leave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sid: this.sid, secret: this.secret }) }).catch(() => {});
  }
}

// ───────── Outro jogador ─────────
class RemotePlayer {
  constructor(info) {
    this.id = info.id;
    this.name = info.name;
    this.profile = { name: info.name, ...info.profile };
    this.room = info.room;
    this.x = 0; this.y = 0; this.nx = 0; this.ny = 0;
    this.facing = 1; this.state = 'idle'; this.t = 0; this.attack = null;
    this.w = 16; this.h = 28;
  }
  apply(m) {
    const jump = this.room !== m.room || Math.hypot(m.x - this.nx, m.y - this.ny) > 200;
    this.room = m.room;
    this.nx = m.x; this.ny = m.y;
    if (jump) { this.x = m.x; this.y = m.y; }
    this.facing = m.f; this.state = m.s; this.attack = m.a || null;
    this.weapon = m.w; this.armor = m.ar; this.nail = m.n; this.sit = m.sit;
  }
  update() {
    this.t++;
    this.x += (this.nx - this.x) * 0.35;
    this.y += (this.ny - this.y) * 0.35;
  }
  draw(ctx) {
    const wp = WEAPONS[this.weapon] || WEAPONS.errante;
    const sword = { len: wp.len, style: wp.style, glow: this.nail > 1 };
    const cx = this.x + this.w / 2, fy = this.y + this.h;
    if (this.attack) drawSlash(ctx, cx + this.facing * 2, fy - 18, this.attack[0], this.facing, this.attack[1], this.nail, wp.style);
    drawHero(ctx, cx, fy, {
      profile: this.profile, facing: this.facing, state: this.sit ? 'sit' : this.state, t: this.t,
      sword, armor: ARMORS[this.armor] || ARMORS.none,
      attack: this.attack ? { dir: this.attack[0], k: this.attack[1] } : null,
    });
    ctx.save();
    ctx.font = '700 9px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(8,6,12,0.7)';
    const w = ctx.measureText(this.name).width + 8;
    ctx.fillRect(cx - w / 2, this.y - 26, w, 12);
    ctx.fillStyle = '#9fe3ff';
    ctx.fillText(this.name, cx, this.y - 17);
    ctx.restore();
  }
}

// ───────── Rede ─────────
export class Net {
  constructor(game) {
    this.game = game;
    this.online = false;
    this.id = null;
    this.code = null;
    this.players = new Map();
    this.hosts = {};
    this.frame = 0;
    this.onChange = null; // a interface atualiza o selo/lista
    this.onChat = null;
  }

  get count() { return this.players.size + 1; }

  async connect({ create, code }) {
    if (this.online) this.disconnect();
    const g = this.game;
    const handlers = [(m) => this.onMessage(m), () => this.lost()];
    try {
      this.transport = new WSTransport();
      await this.transport.open(...handlers);
    } catch (e) {
      this.transport = new PollTransport();
      await this.transport.open(...handlers);
    }
    return new Promise((resolve, reject) => {
      this.pending = { resolve, reject };
      setTimeout(() => { if (this.pending) { this.pending = null; reject(new Error('O servidor não respondeu.')); } }, 8000);
      this.transport.send({
        t: 'hello', create: !!create, world: code, name: g.save.profile.name,
        profile: g.save.profile, builds: create ? g.save.builds : undefined,
      });
    });
  }

  disconnect() {
    if (!this.online && !this.transport) return;
    try { this.transport && this.transport.close(); } catch (e) { /* ok */ }
    this.transport = null;
    this.left();
  }

  lost() {
    if (!this.online) return;
    this.left();
    this.game.ui.toast('Conexão com o mundo perdida. Voltando ao modo solo.', 4000);
  }

  left() {
    this.online = false;
    this.players.clear();
    this.hosts = {};
    this.code = null;
    this.game.applyWorldBuilds(this.game.save.builds || {});
    if (this.onChange) this.onChange();
  }

  send(m) { if (this.online) this.transport.send(m); }

  // Sou eu quem simula os inimigos desta sala?
  isHost() {
    if (!this.online) return true;
    const h = this.hosts[this.game.room.id];
    return h === undefined || h === null || h === this.id;
  }

  get puppet() { return this.online && !this.isHost(); }

  onMessage(m) {
    const g = this.game;
    switch (m.t) {
      case 'welcome':
        this.online = true;
        this.id = m.id;
        this.code = m.code;
        for (const p of m.players) this.players.set(p.id, new RemotePlayer(p));
        g.applyWorldBuilds(m.builds || {});
        this.sendState(true);
        if (this.pending) { this.pending.resolve(m.code); this.pending = null; }
        if (this.onChange) this.onChange();
        break;
      case 'error':
        if (this.pending) { this.pending.reject(new Error(m.error)); this.pending = null; }
        this.disconnect();
        break;
      case 'join':
        this.players.set(m.player.id, new RemotePlayer(m.player));
        g.ui.toast(`${m.player.name} entrou no mundo`);
        if (this.onChange) this.onChange();
        break;
      case 'leave': {
        const p = this.players.get(m.id);
        this.players.delete(m.id);
        if (p) g.ui.toast(`${p.name} saiu do mundo`);
        if (this.onChange) this.onChange();
        break;
      }
      case 'st': {
        let p = this.players.get(m.id);
        if (!p) { p = new RemotePlayer({ id: m.id, name: m.name || '?', profile: m.pr || {} }); this.players.set(m.id, p); }
        if (m.pr) p.profile = { name: p.name, ...m.pr };
        p.apply(m);
        break;
      }
      case 'host':
        this.hosts[m.room] = m.id;
        break;
      case 'build':
        g.applyRemoteBuild(m.room, m.idx, m.id);
        break;
      case 'snap':
        if (m.room === g.room.id && this.puppet) this.applySnap(m);
        break;
      case 'hit': {
        const e = g.enemies.find((x) => x.eid === m.eid && !x.dead);
        if (e && this.isHost()) e.hurt(g, m.dmg, m.kx, m.ky);
        break;
      }
      case 'chat':
        if (this.onChat) this.onChat(m.name, m.text, m.id === this.id);
        break;
    }
  }

  // Envia minha posição/animação (~15 vezes por segundo).
  sendState(full = false) {
    const g = this.game, p = g.player, s = g.save;
    const m = {
      t: 'st', room: g.room.id, x: Math.round(p.x), y: Math.round(p.y), f: p.facing, s: p.state,
      a: p.attackTimer > 0 ? [p.attackDir, +Math.min(1, (14 - p.attackTimer) / 9).toFixed(2)] : 0,
      w: s.weapon, ar: s.armor, n: s.nail, sit: p.sitting ? 1 : 0,
    };
    if (full || this.frame % 120 === 0) { m.pr = s.profile; m.name = s.profile.name; }
    this.send(m);
  }

  update() {
    if (!this.online) return;
    this.frame++;
    if (this.frame % 4 === 0) this.sendState();
    for (const p of this.players.values()) p.update();
    if (this.frame % 5 === 0 && this.isHost() && this.players.size && this.othersHere()) this.sendSnap();
  }

  othersHere() {
    for (const p of this.players.values()) if (p.room === this.game.room.id) return true;
    return false;
  }

  // ── Foto dos inimigos (anfitrião) ──
  sendSnap() {
    const g = this.game;
    const e = g.enemies.filter((x) => !x.dead).map((x) => [
      x.eid, x.isBoss ? 'B:' + x.key : CODE_BY_CLASS.get(x.constructor),
      Math.round(x.x), Math.round(x.y), Math.round(x.hp * 10) / 10,
      x.isBoss ? x.facing : x.dir, x.state || '', x.alpha != null ? Math.round(x.alpha * 100) : 100, x.wind || 0,
    ]);
    const pr = g.projectiles.filter((q) => q.hostile && !q.dead).map((q) => [Math.round(q.x), Math.round(q.y), +q.vx.toFixed(2), +q.vy.toFixed(2), q.kind, q.r, q.grav]);
    const hb = g.hostileBoxes.map((b) => ({ x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h) }));
    this.send({ t: 'snap', e, p: pr, hb, n: +g.raids.night.toFixed(2), d: g.room.doorsClosed ? 1 : 0 });
  }

  // ── Aplicar foto (convidado) ──
  applySnap(m) {
    const g = this.game;
    const seen = new Set();
    const fresh = this.snapRoom !== g.room.id; // primeira foto desta sala
    this.snapRoom = g.room.id;
    this.remoteBoxes = m.hb || [];
    for (const [eid, code, x, y, hp, dir, state, alpha, wind] of m.e) {
      seen.add(eid);
      let e = g.enemies.find((q) => q.eid === eid);
      if (!e) {
        if (String(code).startsWith('B:')) {
          const B = BOSS_TYPES[code.slice(2)];
          if (!B) continue;
          e = new B(0, 0);
          g.bossPending = null;
          g.boss = e;
          g.ui.bossTitle(e.title, e.subtitle);
          g.audio.intense = true;
        } else {
          const E = ENEMY_TYPES[code];
          if (!E) continue;
          e = new E(0, 0);
        }
        e.eid = eid;
        e.x = x; e.y = y;
        g.enemies.push(e);
      }
      e.nx = x; e.ny = y;
      if (hp < e.hp) e.flash = 6;
      e.hp = hp;
      if (e.isBoss) e.facing = dir; else e.dir = dir;
      e.state = state;
      e.wind = wind;
      if (e.alpha != null) e.alpha = alpha / 100;
    }
    // Quem sumiu da foto morreu nas mãos do anfitrião: animação e saque aqui também.
    for (const e of g.enemies) {
      if (e.dead || e.eid == null || seen.has(e.eid)) continue;
      if (fresh) e.dead = true; // já tinha morrido antes de eu chegar
      else e.die(g);
    }
    g.projectiles = g.projectiles.filter((q) => !q.hostile);
    for (const [x, y, vx, vy, kind, r, grav] of m.p) g.projectiles.push(new Projectile(x, y, vx, vy, { kind, r, grav, life: 8 }));
    g.raids.remoteNight = m.n;
    g.room.doorsClosed = !!m.d;
  }

  sendHit(e, dmg, kx, ky) { this.send({ t: 'hit', eid: e.eid, dmg, kx, ky }); }
  sendBuild(room, idx, id) { this.send({ t: 'build', room, idx, id }); }
  sendChat(text) { this.send({ t: 'chat', text }); }

  drawPlayers(ctx) {
    if (!this.online) return;
    for (const p of this.players.values()) if (p.room === this.game.room.id) p.draw(ctx);
  }
}
