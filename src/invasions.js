// Invasões raras, estilo Terraria: uma horda temática ataca a região onde o herói está,
// com barra de progresso, capitão no final e recompensa. A IA (Gemini) decide a hora,
// o tom e a força; sem IA, um sorteio local faz o mesmo. A IA nunca inventa mecânica:
// ela só escolhe dentre este catálogo.
import { TILE, T, RESOURCES } from './config.js';
import { Crawler, Hopper, Flyer, Spitter, Guard } from './enemies.js';
import { pick, rand } from './util.js';

export const INVASIONS = {
  campos: {
    id: 'horda_lama', name: 'Horda de Gosmas', sub: 'Algo viscoso rasteja pelos Campos',
    kinds: [Crawler, Crawler, Hopper], boss: Guard, bossName: 'Rei Gosma', color: '#b6ff7a',
    lines: ['A terra amolece. Gosmas famintas brotam dos campos.', 'Um cheiro doce e podre sobe do chão: eles estão vindo.'],
  },
  bosque: {
    id: 'enxame_lanternas', name: 'Enxame das Lanternas', sub: 'As luzes do bosque enlouqueceram',
    kinds: [Flyer, Flyer, Spitter], boss: Spitter, bossName: 'Lanterna-Mãe', color: '#ffb85c',
    lines: ['As lanternas piscam todas juntas. Algo as chamou.', 'Um zumbido sobe das copas: o bosque acordou irritado.'],
  },
  ruinas: {
    id: 'marcha_golems', name: 'Marcha dos Golems', sub: 'As ruínas se levantam',
    kinds: [Guard, Hopper, Flyer], boss: Guard, bossName: 'Sentinela Quebrada', color: '#9aa7ff',
    lines: ['A pedra range. Os guardiões antigos marcham de novo.', 'Passos pesados ecoam entre as colunas partidas.'],
  },
  cristal: {
    id: 'procissao_cacos', name: 'Procissão de Cacos', sub: 'O cristal canta e algo responde',
    kinds: [Hopper, Crawler, Flyer], boss: Guard, bossName: 'Coro Estilhaçado', color: '#9ef0ff',
    lines: ['O cristal vibra numa nota só. Cacos vivos descem das paredes.', 'Um canto agudo enche a caverna: o geodo está chamando.'],
  },
  jardins: {
    id: 'cardume_faminto', name: 'Cardume Faminto', sub: 'A maré trouxe fome',
    kinds: [Flyer, Spitter, Flyer], boss: Flyer, bossName: 'Anciã da Maré', color: '#7affd4',
    lines: ['A água sobe e escurece. Algo faminto vem com a maré.', 'Bolhas estouram sem parar: o recife não está sozinho.'],
  },
};

const MIN_GAP = 60 * 60 * 8;   // 8 min de jogo entre uma invasão e outra
const MAX_GAP = 60 * 60 * 13;
const WARNING = 60 * 6;        // aviso antes da horda chegar

export class Invasions {
  constructor(game) {
    this.game = game;
    this.clock = 0;
    this.next = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
    this.state = 'idle';       // idle | asking | warning | active | boss
    this.cur = null;
    this.points = 0;
    this.target = 20;
    this.scale = 1;
    this.spawnT = 0;
    this.remote = null;
    this.spots = new Map();
  }

  get active() { return this.state === 'active' || this.state === 'boss'; }

  // Barra da interface: [nome, 0..1] ou null.
  hud() {
    if (!this.active || !this.cur) return null;
    return [this.cur.name, this.state === 'boss' ? 1 : Math.min(1, this.points / this.target)];
  }

  eligible(room) {
    return !!INVASIONS[room.area] && !room.boss && !room.challenge && room.id !== 'planicie_lar';
  }

  onRoomEnter(room) {
    if (!this.cur) return;
    if (this.state === 'asking' || this.state === 'warning') { if (room.area !== this.cur.areaKey) this.reset(false); return; }
    if (this.active && room.area !== this.cur.areaKey) this.cancel('A horda se dispersa... você deixou a região.');
  }

  onDeath() { if (this.active || this.state === 'warning') this.cancel('A horda recua. Você caiu.'); }

  reset(soon) {
    this.state = 'idle'; this.cur = null; this.points = 0;
    this.clock = 0;
    this.next = soon ? 60 * 60 * 2 : MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
    this.game.audio.intense = !!this.game.boss;
    this.game.ui.invBar(null);
  }

  cancel(msg) {
    const g = this.game;
    for (const e of g.enemies) if (e.inv && !e.dead) { e.dead = true; g.particles.burst(e.cx, e.cy, 8, { color: ['#2a1d33', '#7a5cff'], speed: 3, life: 24 }); }
    if (msg) g.ui.toast(msg, 3500);
    this.reset(true);
  }

  update() {
    const g = this.game;
    if (g.net.online && !g.net.isHost()) {
      // Convidado: só mostra a barra que o anfitrião mandou.
      g.ui.invBar(this.remote);
      return;
    }
    const room = g.room;
    if (this.state === 'idle') {
      if (!g.save.bosses.moss || !this.eligible(room) || g.state !== 'play') return;
      if (++this.clock >= this.next) this.begin();
      return;
    }
    if (this.state === 'warning') {
      if (--this.warn <= 0) this.go();
      return;
    }
    if (!this.active) return;
    g.ui.invBar(this.hud());
    if (room.boss || g.boss) return; // pausa dentro de arenas de chefe
    if (this.state === 'active') {
      if (this.points >= this.target) { this.spawnBoss(); return; }
      if (--this.spawnT <= 0) this.spawnOne();
    }
  }

  // ───────── Início: pergunta à IA (ou sorteia) e avisa
  async begin() {
    const g = this.game;
    this.state = 'asking';
    const room = g.room;
    const def = INVASIONS[room.area];
    const n = g.save.base.invasions || 0;
    const ctx = {
      area: room.area, invasion: def.id, name: g.save.profile.name,
      masks: g.masks, masksMax: g.save.masksMax, done: n, deaths: g.ai.deaths[room.id] || 0,
    };
    const plan = await g.ai.invasionPlan(ctx, def);
    if (this.state !== 'asking' || g.room.area !== room.area) return; // o herói saiu enquanto a IA pensava
    if (!plan.go) { this.reset(true); return; }
    this.cur = { ...def, areaKey: room.area, name: plan.title || def.name, line: plan.line };
    this.scale = plan.scale;
    this.target = Math.round((16 + Math.min(10, n * 3)) * this.scale);
    this.points = 0;
    this.state = 'warning';
    this.warn = WARNING;
    g.audio.play('tele');
    g.ui.toast(plan.line, 5500);
  }

  go() {
    const g = this.game;
    this.state = 'active';
    this.spawnT = 40;
    g.audio.play('roar');
    g.audio.intense = true;
    g.ui.bossTitle(this.cur.name, this.cur.sub);
    g.shake(5);
  }

  // ───────── Aparição dos inimigos
  spotsFor(room) {
    if (this.spots.has(room.id)) return this.spots.get(room.id);
    const out = [];
    for (let tx = 2; tx < room.w - 2; tx++)
      for (let ty = 2; ty < room.h - 1; ty++) {
        const here = room.tile(tx, ty), below = room.tile(tx, ty + 1);
        if (here === T.EMPTY && room.tile(tx, ty - 1) === T.EMPTY && (below === T.SOLID || below === T.ONEWAY)) out.push([tx, ty]);
      }
    this.spots.set(room.id, out);
    return out;
  }

  spawnPoint(far = 7) {
    const g = this.game, room = g.room;
    const spots = this.spotsFor(room).filter(([tx]) => Math.abs(tx * TILE - g.player.cx) > far * TILE);
    return spots.length ? pick(spots) : null;
  }

  spawnOne() {
    const g = this.game;
    const alive = g.enemies.filter((e) => e.inv && !e.dead).length;
    const cap = Math.round(4 + 2 * this.scale);
    this.spawnT = Math.round((95 - 20 * this.scale) + rand(0, 40));
    if (alive >= cap || g.enemies.length > 18) return;
    const sp = this.spawnPoint();
    if (!sp) return;
    const K = pick(this.cur.kinds);
    this.place(K, sp, false);
  }

  place(K, [tx, ty], elite) {
    const g = this.game;
    const flying = K === Flyer;
    const x = tx * TILE + TILE / 2;
    const y = flying ? Math.max(2, ty - 3) * TILE : (ty + 1) * TILE;
    const e = new K(x, y);
    e.inv = true;
    e.eid = 'v' + g.invSeq++;
    e.dir = Math.random() < 0.5 ? -1 : 1;
    if (elite) {
      e.elite = true;
      e.hp = e.maxHp = Math.round(e.maxHp * (5 + this.scale * 2));
      e.contact = 2;
      e.geo = 60;
    } else {
      e.hp = e.maxHp = Math.max(1, Math.round(e.maxHp * (0.9 + this.scale * 0.15)));
    }
    g.enemies.push(e);
    g.particles.burst(x, y - 14, elite ? 26 : 10, { color: ['#2a1d33', this.cur.color], speed: elite ? 5 : 3, life: elite ? 40 : 30, glow: !!elite });
  }

  spawnBoss() {
    const g = this.game;
    const sp = this.spawnPoint(5) || this.spawnPoint(0);
    if (!sp) return;
    this.state = 'boss';
    this.place(this.cur.boss, sp, true);
    g.audio.play('roar');
    g.shake(8);
    g.ui.toast(`${this.cur.bossName} surge!`, 3500);
    g.ui.bossTitle(this.cur.bossName, 'Capitão da invasão');
  }

  // ───────── Pontuação
  onKill(e) {
    if (!e.inv || !this.active) return;
    if (e.elite) { this.finish(); return; }
    if (this.state === 'active') this.points += 1;
  }

  finish() {
    const g = this.game;
    const n = g.save.base.invasions || 0;
    g.save.base.invasions = n + 1;
    for (const e of g.enemies) if (e.inv && !e.dead && !e.elite) { e.dead = true; g.particles.burst(e.cx, e.cy, 10, { color: ['#ffffff', this.cur.color], speed: 4, life: 26, glow: true }); }
    g.audio.play('victory');
    const p = g.player;
    g.dropGeo(p.cx, p.y - 30, 120 + n * 40);
    const kinds = Object.keys(RESOURCES);
    for (let i = 0; i < 5; i++) g.dropResource(p.cx + rand(-40, 40), p.y - 30, pick(kinds), 3);
    g.persist();
    const name = this.cur.name;
    g.ui.toast(`${name} derrotada! A região respira de novo.`, 5000);
    g.ai.narrate('invasion_end', 'A horda se desfaz como fumaça. O silêncio volta.', { raids: n + 1 }).then((line) => g.ui.toast(line, 4500));
    this.reset(false);
  }

  // Aura dourada e nome sobre o capitão.
  drawOverlay(ctx) {
    for (const e of this.game.enemies) {
      if (!e.elite || e.dead) continue;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(e.cx, e.cy, 4, e.cx, e.cy, Math.max(e.w, e.h) * 1.1);
      g.addColorStop(0, 'rgba(255,214,120,0.0)'); g.addColorStop(0.7, 'rgba(255,214,120,0.18)'); g.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = g; ctx.fillRect(e.cx - e.w * 1.5, e.cy - e.h * 1.5, e.w * 3, e.h * 3);
      ctx.restore();
      ctx.save();
      ctx.font = '700 10px serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe3a0';
      ctx.fillText('♛ ' + (this.cur ? this.cur.bossName : 'Capitão'), e.cx, e.y - 8);
      ctx.restore();
    }
  }
}
