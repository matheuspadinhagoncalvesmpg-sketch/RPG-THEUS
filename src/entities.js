// Objetos das salas: fogueiras, personagens, placas, itens, recursos, moedas, lápide e construções.
import { TILE, AREAS, NODE_CHARS, BUILD_BY_ID } from './config.js';
import { moveBody } from './physics.js';
import { rand } from './util.js';
import { NPCS } from './dialog.js';
import {
  drawNPC, drawLoreStone, drawOrb, drawGeoRock, drawGeo, drawCampfire, drawTombstone,
  drawLifeCrystal, drawResourceNode, drawResourceIcon, drawBuildDeco,
} from './art.js';

class Entity {
  constructor(x, y) { this.x = x; this.y = y; this.t = Math.floor(rand(0, 100)); this.dead = false; }
  update() { this.t++; }
  near(p, rx = 42, ry = 40) { return Math.abs(p.cx - this.x) < rx && Math.abs(p.y + p.h - this.y) < ry; }
  // Área ocupada (usada para não construir em cima).
  box() { return { x: this.x - 12, y: this.y - 28, w: 24, h: 28 }; }
}

// Fogueira: descansa, cura e salva. Também pode ser construída pelo jogador.
export class Campfire extends Entity {
  constructor(x, y, built = false) { super(x, y); this.label = 'Descansar'; this.built = built; this.light = 1; }
  interact(game) { game.restAtBench(this); }
  update(game) {
    this.t++;
    if (this.t % 6 === 0)
      game.particles.add({ x: this.x + rand(-5, 5), y: this.y - 14, vx: rand(-0.3, 0.3), vy: -rand(0.6, 1.2), life: 40, size: 1.6, color: '#ffb35c', glow: true, drag: 0.99 });
  }
  draw(ctx) { drawCampfire(ctx, this.x, this.y, this.t); }
}

export class NPC extends Entity {
  constructor(x, y, id) { super(x, y); this.id = id; this.data = NPCS[id]; this.label = 'Conversar'; }
  interact(game) { game.talkTo(this); }
  box() { return { x: this.x - 12, y: this.y - 44, w: 24, h: 44 }; }
  draw(ctx, game) { drawNPC(ctx, this.id, this.x, this.y, this.t, game.player.cx < this.x ? -1 : 1); }
}

export class LoreStone extends Entity {
  constructor(x, y, text) { super(x, y); this.text = text; this.label = 'Ler'; }
  interact(game) { game.showDialog(null, [this.text]); }
  draw(ctx, game) { drawLoreStone(ctx, this.x, this.y, this.t, AREAS[game.room.area]); }
}

export class AbilityPickup extends Entity {
  constructor(x, y, key) { super(x, y); this.key = key; }
  update(game) {
    this.t++;
    if (this.t % 4 === 0) game.particles.add({ x: this.x + rand(-12, 12), y: this.y - 16 + rand(-8, 8), vy: -0.6, life: 30, size: 2, color: '#bfe9ff', glow: true, drag: 1 });
    if (this.near(game.player, 18, 30)) { this.dead = true; game.acquireAbility(this.key); }
  }
  draw(ctx) { drawOrb(ctx, this.x, this.y - 16, this.t); }
}

export class LifeCrystal extends Entity {
  constructor(x, y, id) { super(x, y); this.id = id; }
  update(game) {
    this.t++;
    if (this.near(game.player, 18, 34)) { this.dead = true; game.collectMask(this.id); }
  }
  draw(ctx) { drawLifeCrystal(ctx, this.x, this.y - 16, this.t); }
}

// Veio de ouro (antiga rocha de geo): solta moedas.
export class GeoRock extends Entity {
  constructor(x, y, id) { super(x, y); this.id = id; this.hp = 4; this.flash = 0; }
  box() { return { x: this.x - 15, y: this.y - 24, w: 30, h: 24 }; }
  hit(game) {
    this.hp--;
    this.flash = 5;
    game.audio.play('rock');
    game.dropGeo(this.x, this.y - 14, this.hp > 0 ? 2 : 6);
    game.particles.burst(this.x, this.y - 12, 6, { color: ['#f5c542', '#3a3340'], speed: 3, grav: 0.2, life: 20 });
    if (this.hp <= 0) { this.dead = true; game.save.collected[this.id] = true; }
  }
  update() { this.t++; if (this.flash > 0) this.flash--; }
  draw(ctx) { drawGeoRock(ctx, this.x, this.y, this.hp, this.flash > 0); }
}

// Árvore, rocha, minério ou cristal: golpeie para coletar. Volta ao reentrar na sala.
export class ResourceNode extends Entity {
  constructor(x, y, kind) { super(x, y); this.kind = kind; this.hp = 3; this.flash = 0; }
  box() {
    return this.kind === 'wood' ? { x: this.x - 8, y: this.y - 48, w: 16, h: 48 } : { x: this.x - 14, y: this.y - 22, w: 28, h: 22 };
  }
  hit(game) {
    this.hp--;
    this.flash = 6;
    game.audio.play(this.kind === 'wood' ? 'chop' : 'rock');
    const colors = { wood: ['#7a4f2a', '#3c7040'], stone: ['#8a8698', '#4a4654'], ore: ['#e39a3a', '#3d3540'], crystal: ['#7ef0ff', '#ffffff'] }[this.kind];
    game.particles.burst(this.x, this.y - 14, 7, { color: colors, speed: 3.5, grav: 0.22, life: 22 });
    game.dropResource(this.x, this.y - 18, this.kind, 1);
    if (this.hp <= 0) {
      this.dead = true;
      game.dropResource(this.x, this.y - 18, this.kind, this.kind === 'wood' ? 3 : 2);
    }
  }
  update() { this.t++; if (this.flash > 0) this.flash--; }
  draw(ctx) { drawResourceNode(ctx, this.kind, this.x, this.y, this.hp, this.flash > 0, this.t); }
}

// Moeda ou recurso caído: quica, é atraído pelo herói e é coletado ao tocar.
class Pickup {
  constructor(x, y) {
    this.x = x - 4; this.y = y - 4; this.w = 8; this.h = 8;
    this.vx = rand(-3, 3); this.vy = rand(-6, -2.5);
    this.t = 0; this.dead = false;
  }
  update(game) {
    this.t++;
    const p = game.player;
    const dx = p.cx - (this.x + 4), dy = p.cy - (this.y + 4);
    const d = Math.hypot(dx, dy);
    if (this.t > 20 && d < 80) { this.vx += (dx / d) * 0.7; this.vy += (dy / d) * 0.7; this.vx *= 0.9; this.vy *= 0.9; }
    this.vy = Math.min(this.vy + 0.35, 8);
    const hit = moveBody(this, game.room, game.world, { confine: true });
    if (hit.down) { this.vy = -this.vy * 0.4; this.vx *= 0.7; if (Math.abs(this.vy) < 1) this.vy = 0; }
    if (hit.left || hit.right) this.vx = -this.vx * 0.5;
    if (d < 16 && this.t > 8) { this.dead = true; this.collect(game); }
    if (this.t > 1800) this.dead = true;
  }
}

export class GeoCoin extends Pickup {
  constructor(x, y, value) { super(x, y); this.value = value; }
  collect(game) { game.collectGeo(this.value); }
  draw(ctx) { drawGeo(ctx, this.x + 4, this.y + 4, this.t); }
}

export class ItemDrop extends Pickup {
  constructor(x, y, kind, n) { super(x, y); this.kind = kind; this.n = n; }
  collect(game) { game.collectResource(this.kind, this.n, this.x + 4, this.y); }
  draw(ctx) { drawResourceIcon(ctx, this.kind, this.x + 4, this.y + 4 + Math.sin(this.t * 0.1)); }
}

// Lápide: guarda as moedas perdidas ao morrer.
export class Tombstone extends Entity {
  constructor(x, y, geo) { super(x, y); this.geo = geo; }
  update(game) {
    this.t++;
    if (this.near(game.player, 24, 40)) { this.dead = true; game.recoverShade(this); }
  }
  draw(ctx) { drawTombstone(ctx, this.x, this.y, this.t); }
}

// Peça decorativa construída (tocha, estandarte, baú).
export class BuildDeco extends Entity {
  constructor(x, y, kind, idx) { super(x, y); this.kind = kind; this.idx = idx; this.light = kind === 'torch' ? 0.8 : 0; }
  draw(ctx, game) { drawBuildDeco(ctx, this.kind, this.x, this.y, this.t, game.save.profile.cloak); }
}

// Bancada e forja: abrem o painel de fabricação.
export class Station extends BuildDeco {
  constructor(x, y, kind, idx) { super(x, y, kind, idx); this.label = 'Fabricar'; this.light = kind === 'forge' ? 0.6 : 0; }
  interact(game) { game.craft.openStation(this.kind); }
}

// Baú: guarda materiais.
export class ChestBox extends BuildDeco {
  constructor(x, y, kind, idx) { super(x, y, kind, idx); this.label = 'Abrir'; }
  interact(game) { game.craft.openChest(`${game.room.id}:${this.idx}`); }
}

// Cria a entidade de uma peça construída no índice de bloco idx.
export function makeBuilt(room, idx, id) {
  const item = BUILD_BY_ID[id];
  if (!item || !item.deco) return null;
  const tx = idx % room.w, ty = Math.floor(idx / room.w);
  const x = tx * TILE + TILE / 2, y = (ty + 1) * TILE;
  if (id === 'campfire') { const c = new Campfire(x, y, true); c.idx = idx; return c; }
  if (id === 'workbench' || id === 'forge') return new Station(x, y, id, idx);
  if (id === 'chest') return new ChestBox(x, y, id, idx);
  return new BuildDeco(x, y, id, idx);
}

// Cria as entidades de uma sala a partir dos marcadores do mapa e das construções.
export function spawnRoomEntities(room, save) {
  const list = [];
  const at = (e) => ({ x: e.tx * TILE + TILE / 2, y: (e.ty + 1) * TILE });
  for (const e of room.entities) {
    const { x, y } = at(e);
    switch (e.ch) {
      case 'B': list.push(new Campfire(x, y)); break;
      case 'N': list.push(new NPC(x, y, room.npcs[e.index])); break;
      case 'L': list.push(new LoreStone(x, y, room.lore[e.index])); break;
      case 'A': if (!save.abilities[room.ability]) list.push(new AbilityPickup(x, y, room.ability)); break;
      case 'M': if (!save.collected[e.id]) list.push(new LifeCrystal(x, y, e.id)); break;
      case '$': if (!save.collected[e.id]) list.push(new GeoRock(x, y, e.id)); break;
      default:
        if (NODE_CHARS[e.ch]) list.push(new ResourceNode(x, y, NODE_CHARS[e.ch]));
    }
  }
  if (room.id === 'planicie_lar' && save.base && save.base.smith) list.push(new NPC(34 * TILE + TILE / 2, 13 * TILE, 'smith'));
  for (const [idx, id] of room.placed) {
    const ent = makeBuilt(room, idx, id);
    if (ent) list.push(ent);
  }
  return list;
}
