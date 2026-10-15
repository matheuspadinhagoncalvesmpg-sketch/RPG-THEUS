// Hordas de baú: abrir um baú de tesouro chama ondas de monstros da região (estilo Coliseu do Hollow Knight).
// Vence quem derrotar todas as ondas; aí o baú abre sozinho. Sair da sala ou morrer cancela a prova.
import { TILE, T } from './config.js';
import { ENEMY_TYPES } from './enemies.js';
import './enemies2.js'; // registra os inimigos regionais em ENEMY_TYPES
import { pick } from './util.js';

// Que inimigos cada região manda (letras do mapa, ver enemies.js e enemies2.js).
const POR_REGIAO = {
  campos: ['c', 'h', 'f', 's'],
  bosque: ['c', 'f', 'm', 'p', 'h'],
  ruinas: ['f', 'x', 'n', 'g'],
  cristal: ['c', 'g', 'x', 'n'],
  jardins: ['f', 'n', 'x', 'h'], // sem peixes: a horda aparece em terra firme
};

export class Hordas {
  constructor(game) {
    this.game = game;
    this.cancel();
  }

  get ativa() { return !!this.bau; }

  cancel() {
    if (this.bau) this.game.audio.intense = false;
    this.bau = null; this.onda = 0; this.ondas = 0; this.fila = 0; this.pausa = 0; this.spawnT = 0; this.viva = [];
  }

  // Quantas ondas: baús com arma, armadura ou muito ouro são mais difíceis.
  static ondasDe(loot) { return loot.weapon || loot.armor || loot.geo >= 160 ? 3 : 2; }

  start(bau) {
    const g = this.game;
    this.cancel();
    this.bau = bau;
    this.ondas = Hordas.ondasDe(bau.loot);
    this.pausa = 90;
    g.audio.play('roar');
    g.audio.intense = true;
    g.shake(5);
    g.ui.toast(`Horda! Derrote ${this.ondas} ondas para abrir o baú.`, 3200);
  }

  // Pontos do chão onde cabe um inimigo (longe do herói quando dá).
  pontos(room, longe) {
    const g = this.game, out = [];
    for (let tx = 2; tx < room.w - 2; tx++)
      for (let ty = 2; ty < room.h - 1; ty++) {
        const aqui = room.tile(tx, ty), abaixo = room.tile(tx, ty + 1);
        if (aqui !== T.EMPTY || room.tile(tx, ty - 1) !== T.EMPTY || (abaixo !== T.SOLID && abaixo !== T.ONEWAY)) continue;
        if (Math.abs(tx * TILE - g.player.cx) >= longe) out.push([tx, ty]);
      }
    return out;
  }

  surgir(elite) {
    const g = this.game, room = g.room;
    let pts = this.pontos(room, 6 * TILE);
    if (!pts.length) pts = this.pontos(room, 0);
    if (!pts.length) return;
    const [tx, ty] = pick(pts);
    const K = ENEMY_TYPES[pick(POR_REGIAO[room.area] || POR_REGIAO.campos)];
    const x = tx * TILE + TILE / 2;
    const e = new K(x, (ty + 1) * TILE);
    if (e.gravity === false) e.y = Math.max(2, ty - 3) * TILE; // voadores nascem no ar
    e.horda = true;
    e.eid = 'h' + g.invSeq++;
    e.dir = Math.random() < 0.5 ? -1 : 1;
    if (elite) {
      e.elite = true;
      e.hp = e.maxHp = Math.round(e.maxHp * 4);
      e.contact = 2;
      e.geo = 40;
    }
    g.enemies.push(e);
    this.viva.push(e);
    g.particles.burst(x, e.y - 14, elite ? 24 : 10, { color: ['#2a1d33', '#ffb35c'], speed: elite ? 5 : 3, life: elite ? 40 : 28, glow: !!elite });
  }

  update() {
    if (!this.bau) return;
    const g = this.game;
    if (g.net.online && !g.net.isHost()) return;
    this.viva = this.viva.filter((e) => !e.dead);
    if (this.pausa > 0) {
      if (--this.pausa === 0) this.comecarOnda();
      return;
    }
    const maxVivos = Math.max(2, Math.min(7, Math.floor(g.room.w / 5)));
    if (this.fila > 0 && this.viva.length < maxVivos && --this.spawnT <= 0) {
      this.fila--;
      this.surgir(this.fila === 0 && this.onda === this.ondas);
      this.spawnT = 40;
    }
    if (this.fila === 0 && !this.viva.length) {
      if (this.onda >= this.ondas) this.vencer();
      else this.pausa = 110;
    }
  }

  comecarOnda() {
    this.onda++;
    this.fila = 3 + this.onda + (this.onda === this.ondas ? 1 : 0);
    this.spawnT = 0;
    this.game.ui.toast(`Onda ${this.onda} de ${this.ondas}`, 1800);
  }

  vencer() {
    const g = this.game, bau = this.bau;
    this.cancel();
    g.audio.intense = false;
    g.audio.play('victory');
    bau.abrir(g);
  }
}
