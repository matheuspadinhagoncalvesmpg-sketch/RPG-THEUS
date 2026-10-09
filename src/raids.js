// Vida da base: o ferreiro que se muda e os ataques noturnos à Planície do Lar.
import { TILE, RESOURCES } from './config.js';
import { Crawler, Hopper, Flyer } from './enemies.js';
import { pick, rand } from './util.js';

export const BASE_ROOM = 'planicie_lar';
const RAID_INTERVAL = 60 * 150; // 2,5 min de jogo dentro da base
const KINDS = [Crawler, Hopper, Flyer];

const LOCAL_LINES = {
  smith_arrive: 'Um ferreiro viu a fumaça da sua fogueira e decidiu ficar.',
  raid_start: ['A noite cai sobre o Lar... algo se aproxima pelas bordas da planície.', 'O vento muda. Criaturas famintas cercam sua base.', 'As tochas tremulam: eles estão vindo.'],
  raid_end: ['O silêncio volta à planície. Seu lar resistiu.', 'Os monstros recuam. A fogueira continua acesa.'],
};

// Condição para o ferreiro se mudar: uma casa de verdade na base.
export function baseStatus(room) {
  const ids = [...room.placed.values()];
  const blocks = ids.filter((id) => id.endsWith('_block') || id === 'wood_plat').length;
  return {
    campfire: ids.includes('campfire'),
    torch: ids.includes('torch'),
    chest: ids.includes('chest'),
    workbench: ids.includes('workbench'),
    blocks,
    ok: ids.includes('campfire') && ids.includes('torch') && ids.includes('chest') && ids.includes('workbench') && blocks >= 10,
  };
}

export class Raids {
  constructor(game) {
    this.game = game;
    this.clock = 0;
    this.active = null;
    this.night = 0;
  }

  onRoomEnter(room) {
    if (this.active && room.id !== BASE_ROOM) this.cancel();
    if (room.id === BASE_ROOM) this.checkSmith();
  }

  // Chamado ao entrar na base e após cada construção.
  checkSmith() {
    const g = this.game;
    if (g.save.base.smith || g.room.id !== BASE_ROOM) return;
    if (!baseStatus(g.room).ok) return;
    g.save.base.smith = true;
    g.persist();
    g.spawnSmith();
    g.ai.narrate('smith_arrive', LOCAL_LINES.smith_arrive).then((line) =>
      g.openBanner('⚒', 'Tibério se mudou!', line, 'Ele vende materiais. Agora a base também pode ser atacada à noite.'));
  }

  update() {
    const g = this.game;
    const target = this.active ? 0.55 : 0;
    this.night += (target - this.night) * 0.02;
    if (g.room.id !== BASE_ROOM || !g.save.base.smith) return;
    if (!this.active) {
      if (++this.clock >= RAID_INTERVAL) this.start();
      return;
    }
    const a = this.active;
    if (a.pause > 0) {
      if (--a.pause === 0) this.spawnWave();
      return;
    }
    if (!g.enemies.some((e) => !e.dead && e.raid)) {
      if (a.wave >= a.waves) this.finish();
      else a.pause = 120;
    }
  }

  start() {
    const g = this.game;
    const n = g.save.base.raids || 0;
    this.clock = 0;
    this.active = { wave: 0, waves: 2 + Math.min(2, Math.floor(n / 2)), pause: 180 };
    g.audio.play('roar');
    g.audio.intense = true;
    g.ai.narrate('raid_start', pick(LOCAL_LINES.raid_start), { raids: n }).then((line) => g.ui.toast(line, 5000));
  }

  spawnWave() {
    const g = this.game, a = this.active, room = g.room;
    const n = g.save.base.raids || 0;
    a.wave++;
    const count = 3 + a.wave + Math.min(4, n);
    for (let i = 0; i < count; i++) {
      const K = pick(KINDS);
      const left = i % 2 === 0;
      const x = (left ? 2.5 + rand(0, 2) : room.w - 2.5 - rand(0, 2)) * TILE;
      const y = K === Flyer ? 5 * TILE : 13 * TILE;
      const e = new K(x, y);
      e.raid = true;
      e.dir = left ? 1 : -1;
      g.enemies.push(e);
      g.particles.burst(x, y - 12, 10, { color: ['#2a1d33', '#7a5cff'], speed: 3, life: 30 });
    }
    g.ui.toast(`Onda ${a.wave} de ${a.waves}`, 1800);
  }

  finish() {
    const g = this.game;
    const n = g.save.base.raids || 0;
    g.save.base.raids = n + 1;
    this.active = null;
    g.audio.intense = false;
    g.audio.play('victory');
    const p = g.player;
    g.dropGeo(p.cx, p.y - 30, 25 + n * 15);
    const kinds = Object.keys(RESOURCES);
    for (let i = 0; i < 3; i++) g.dropResource(p.cx + rand(-30, 30), p.y - 30, pick(kinds), 2);
    g.persist();
    g.ai.narrate('raid_end', pick(LOCAL_LINES.raid_end), { raids: n + 1 }).then((line) => g.ui.toast(line, 4500));
  }

  cancel() {
    this.active = null;
    this.game.audio.intense = false;
  }
}
