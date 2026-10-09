// Ponte com a IA Gemini (via servidor): diretor tático dos inimigos e conversa com personagens.
// Sem servidor/chave, um diretor local assume e o jogo continua igual.

const DEFAULT = { aggression: 0.5, speed: 1, cooldown: 1, tactic: 'swarm', bossWeights: null, taunt: null, source: 'local' };

export const TACTIC_NAMES = { swarm: 'Enxame', flank: 'Flanco', kite: 'Distância', ambush: 'Emboscada' };

const LOCAL_TAUNTS = {
  moss: ['O musgo cobre todos que caem aqui.', 'Volte quando sua lâmina pesar mais.', 'Este santuário não é seu.'],
  king: ['A aurora nunca mais vai nascer.', 'Você é só mais uma sombra, Errante.', 'Ajoelhe-se diante do crepúsculo.'],
};

export class AIDirector {
  constructor(game) {
    this.game = game;
    this.enabled = false;
    this.pending = false;
    this.timer = 0;
    this.tactics = { ...DEFAULT };
    this.deaths = {};
    this.histories = {};
    this.lastBossPhase = null;
    this.resetStats();
    this.checkStatus();
  }

  async checkStatus() {
    try {
      const r = await fetch('api/ai/status', { cache: 'no-store' });
      if (r.ok) this.enabled = !!(await r.json()).enabled;
    } catch (e) { this.enabled = false; }
  }

  resetStats() {
    this.style = { side: 0, up: 0, down: 0, dash: 0, heal: 0, hurt: 0, distSum: 0, distN: 0 };
  }

  record(kind) { if (kind in this.style) this.style[kind]++; }

  onRoomEnter() {
    this.resetStats();
    this.tactics = { ...this.local() };
    this.timer = 90;
    this.lastBossPhase = null;
  }

  onDeath(roomId) { this.deaths[roomId] = (this.deaths[roomId] || 0) + 1; }

  onBossStart() { this.timer = 30; }

  // Chamado a cada quadro de jogo.
  update() {
    const g = this.game;
    if (g.net.puppet) return; // só quem simula os inimigos planeja a tática
    const alive = g.enemies.filter((e) => !e.dead);
    if (!alive.length) return;
    if (g.frame % 30 === 0) {
      let best = Infinity;
      for (const e of alive) best = Math.min(best, Math.hypot(e.cx - g.player.cx, e.cy - g.player.cy));
      if (best < 600) { this.style.distSum += best; this.style.distN++; }
    }
    const boss = g.boss && !g.boss.dead ? g.boss : null;
    if (boss && boss.phase2 !== this.lastBossPhase) {
      if (this.lastBossPhase === false) this.timer = Math.min(this.timer, 1); // mudou de fase: replaneja já
      this.lastBossPhase = boss.phase2;
    }
    if (--this.timer <= 0) {
      this.timer = boss ? 300 : 420;
      this.plan(alive, boss);
    }
  }

  // Diretor local: lê o estilo do jogador e ajusta a tática sem internet.
  local(boss) {
    const g = this.game;
    const s = this.style;
    const hpRatio = g.masks / g.save.masksMax;
    const deaths = this.deaths[g.room.id] || 0;
    let aggression = 0.5;
    if (hpRatio <= 0.4 || deaths >= 2) aggression = 0.3;
    else if (s.hurt === 0 && s.side + s.up + s.down > 8) aggression = 0.75;
    const avgDist = s.distN ? s.distSum / s.distN : 150;
    const tactic = s.down > s.side ? 'kite' : avgDist > 180 ? 'swarm' : s.dash > 3 ? 'ambush' : 'flank';
    let bossWeights = null, taunt = null;
    if (boss) {
      bossWeights = boss.key === 'moss'
        ? { charge: avgDist > 160 ? 3 : 1, leap: s.down > 2 ? 1 : 2, combo: avgDist < 120 ? 3 : 1 }
        : { tele: avgDist > 160 ? 3 : 1, orbs: s.dash > 2 ? 1 : 2, dive: s.down > 2 ? 1 : 2 };
      if (boss.phase2 && this.lastTauntPhase !== boss) {
        this.lastTauntPhase = boss;
        const list = LOCAL_TAUNTS[boss.key];
        taunt = list[Math.floor(Math.random() * list.length)];
      }
    }
    return {
      aggression,
      speed: 0.9 + aggression * 0.3,
      cooldown: 1.2 - aggression * 0.4,
      tactic, bossWeights, taunt, source: 'local',
    };
  }

  async plan(alive, boss) {
    const local = this.local(boss);
    if (!this.enabled) return this.apply(local);
    if (this.pending) return;
    this.pending = true;
    const g = this.game;
    const counts = {};
    for (const e of alive) counts[e.constructor.name] = (counts[e.constructor.name] || 0) + 1;
    const s = this.style;
    const state = {
      room: g.room.name,
      enemies: counts,
      masks: g.masks, masksMax: g.save.masksMax, soul: g.soul,
      deaths: this.deaths[g.room.id] || 0,
      style: { side: s.side, up: s.up, down: s.down, dash: s.dash, heal: s.heal, hurt: s.hurt, dist: Math.round(s.distN ? s.distSum / s.distN : 150) },
      boss: boss ? boss.key : null,
      bossHp: boss ? +(boss.hp / boss.maxHp).toFixed(2) : null,
    };
    try {
      const r = await fetch('api/ai/director', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) });
      if (!r.ok) throw new Error(r.status);
      const t = await r.json();
      // A resposta chega depois: só aplica se ainda estamos na mesma luta.
      if (g.enemies.some((e) => !e.dead)) this.apply({ ...DEFAULT, ...t, source: 'gemini' });
    } catch (e) {
      this.apply(local);
    } finally {
      this.pending = false;
    }
  }

  apply(t) {
    this.tactics = t;
    const boss = this.game.boss;
    if (t.taunt && boss && !boss.dead) this.game.say(boss, t.taunt);
  }

  // Escolha ponderada de ataque dos chefes (usa os pesos da IA quando existem).
  pick(options, fallback) {
    const w = this.tactics.bossWeights;
    if (!w) return fallback();
    const list = options.map((o) => [o, Math.max(0, Number(w[o]) || 0)]);
    const total = list.reduce((a, [, v]) => a + v, 0);
    if (!total) return fallback();
    let r = Math.random() * total;
    for (const [o, v] of list) if ((r -= v) <= 0) return o;
    return list[list.length - 1][0];
  }

  // Narração curta de eventos (ataques à base, chegada do ferreiro...). Sem IA, usa o texto local.
  async narrate(event, fallback, context = {}) {
    if (!this.enabled) return fallback;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 4000);
      const r = await fetch('api/ai/narrate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
        body: JSON.stringify({ event, context: { ...context, room: this.game.room.name, name: this.game.save.profile.name } }),
      });
      clearTimeout(timer);
      if (!r.ok) throw new Error(r.status);
      return (await r.json()).line || fallback;
    } catch (e) {
      return fallback;
    }
  }

  // ───── Conversa livre com personagens ─────
  async npcReply(npcId, message) {
    const g = this.game;
    const hist = (this.histories[npcId] = this.histories[npcId] || []);
    hist.push({ who: 'player', text: message });
    const progress = { abilities: g.save.abilities, bosses: g.save.bosses, geo: g.save.geo, room: g.room.name };
    const r = await fetch('api/ai/npc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ npc: npcId, message, history: hist.slice(-7, -1), progress }),
    });
    if (!r.ok) throw new Error(r.status);
    const { reply } = await r.json();
    hist.push({ who: 'npc', text: reply });
    if (hist.length > 12) hist.splice(0, hist.length - 12);
    return reply;
  }
}
