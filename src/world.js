// Estrutura do mundo: salas, blocos e consulta de colisão entre salas vizinhas.
import { T, TILE } from './config.js';
import { ROOM_DEFS } from './rooms.js';

const TILE_CHARS = { '#': T.SOLID, '^': T.SPIKE, '=': T.ONEWAY, X: T.BREAK, D: T.DOOR };
const ENTITY_CHARS = 'SBNLAM$Kchfpg';

export class Room {
  constructor(def) {
    Object.assign(this, def);
    this.tiles = new Uint8Array(this.w * this.h);
    this.entities = [];
    this.doorsClosed = false;
    const counters = {};
    for (let ty = 0; ty < this.h; ty++) {
      const row = def.rows[ty];
      for (let tx = 0; tx < this.w; tx++) {
        const ch = row[tx];
        if (TILE_CHARS[ch] !== undefined) this.tiles[ty * this.w + tx] = TILE_CHARS[ch];
        else if (ENTITY_CHARS.includes(ch)) {
          const index = (counters[ch] = (counters[ch] || 0) + 1) - 1;
          this.entities.push({ ch, tx, ty, index, id: `${this.id}:${ch}${tx},${ty}` });
        }
      }
    }
    this.breakGroups = this.findBreakGroups();
  }

  get pxW() { return this.w * TILE; }
  get pxH() { return this.h * TILE; }

  inside(tx, ty) { return tx >= 0 && ty >= 0 && tx < this.w && ty < this.h; }
  tile(tx, ty) { return this.tiles[ty * this.w + tx]; }
  setTile(tx, ty, v) { this.tiles[ty * this.w + tx] = v; }

  // Agrupa blocos quebráveis vizinhos: quebram juntos.
  findBreakGroups() {
    const groups = [];
    const seen = new Set();
    for (let i = 0; i < this.tiles.length; i++) {
      if (this.tiles[i] !== T.BREAK || seen.has(i)) continue;
      const cells = [];
      const stack = [i];
      seen.add(i);
      while (stack.length) {
        const c = stack.pop();
        cells.push(c);
        const cx = c % this.w, cy = (c / this.w) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (!this.inside(nx, ny)) continue;
          const n = ny * this.w + nx;
          if (!seen.has(n) && this.tiles[n] === T.BREAK) { seen.add(n); stack.push(n); }
        }
      }
      const first = cells[0];
      groups.push({ id: `${this.id}:X${first % this.w},${(first / this.w) | 0}`, cells, hp: 3 });
    }
    return groups;
  }

  breakGroupAt(tx, ty) {
    const idx = ty * this.w + tx;
    return this.breakGroups.find((g) => g.cells.includes(idx));
  }

  breakGroup(group) {
    for (const c of group.cells) this.tiles[c] = T.EMPTY;
  }
}

export class World {
  constructor() {
    this.rooms = ROOM_DEFS.map((d) => new Room(d));
    this.byId = Object.fromEntries(this.rooms.map((r) => [r.id, r]));
  }

  roomAtGlobal(gx, gy) {
    for (const r of this.rooms)
      if (gx >= r.x && gy >= r.y && gx < r.x + r.w && gy < r.y + r.h) return r;
    return null;
  }

  // Tipo do bloco numa posição relativa à sala atual (consulta vizinhas fora dela).
  tileAt(room, tx, ty) {
    if (room.inside(tx, ty)) return { t: room.tile(tx, ty), r: room };
    const r = this.roomAtGlobal(room.x + tx, room.y + ty);
    if (!r) return { t: T.SOLID, r: null };
    return { t: r.tile(room.x + tx - r.x, room.y + ty - r.y), r };
  }

  // confine: fora da sala conta como parede (inimigos e moedas não saem da sala).
  isSolid(room, tx, ty, confine = false) {
    if (confine && !room.inside(tx, ty)) return true;
    const { t, r } = this.tileAt(room, tx, ty);
    return t === T.SOLID || t === T.BREAK || (t === T.DOOR && r && r.doorsClosed);
  }

  applySave(save) {
    for (const r of this.rooms)
      for (const g of r.breakGroups) if (save.broken[g.id]) r.breakGroup(g);
  }
}
