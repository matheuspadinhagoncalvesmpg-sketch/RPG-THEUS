// Objetos das salas: bancos, personagens, placas, itens, rochas de geo, moedas e a sombra.
import { TILE, AREAS } from './config.js';
import { moveBody } from './physics.js';
import { rand } from './util.js';
import { NPCS } from './dialog.js';
import { drawBench, drawNPC, drawLoreStone, drawOrb, drawMaskShard, drawGeoRock, drawGeo, drawShade } from './art.js';

class Entity {
  constructor(x, y) { this.x = x; this.y = y; this.t = Math.floor(rand(0, 100)); this.dead = false; }
  update() { this.t++; }
  near(p, rx = 42, ry = 40) { return Math.abs(p.cx - this.x) < rx && Math.abs(p.y + p.h - this.y) < ry; }
}

export class Bench extends Entity {
  constructor(x, y) { super(x, y); this.label = 'Descansar'; }
  interact(game) { game.restAtBench(this); }
  draw(ctx, game) {
    const pal = AREAS[game.room.area];
    const g = ctx.createRadialGradient(this.x, this.y - 20, 4, this.x, this.y - 20, 70);
    g.addColorStop(0, 'rgba(255,220,150,0.18)'); g.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = g;
    ctx.fillRect(this.x - 70, this.y - 90, 140, 100);
    drawBench(ctx, this.x, this.y, pal);
  }
}

export class NPC extends Entity {
  constructor(x, y, id) { super(x, y); this.id = id; this.data = NPCS[id]; this.label = 'Conversar'; }
  interact(game) { game.talkTo(this); }
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

export class MaskPickup extends Entity {
  constructor(x, y, id) { super(x, y); this.id = id; }
  update(game) {
    this.t++;
    if (this.near(game.player, 18, 34)) { this.dead = true; game.collectMask(this.id); }
  }
  draw(ctx) { drawMaskShard(ctx, this.x, this.y - 16, this.t); }
}

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

export class GeoCoin {
  constructor(x, y, value) {
    this.x = x - 4; this.y = y - 4; this.w = 8; this.h = 8;
    this.vx = rand(-3, 3); this.vy = rand(-6, -2.5);
    this.value = value; this.t = 0; this.dead = false;
  }
  update(game) {
    this.t++;
    const p = game.player;
    const dx = p.cx - (this.x + 4), dy = p.cy - (this.y + 4);
    const d = Math.hypot(dx, dy);
    if (this.t > 20 && d < 70) { this.vx += (dx / d) * 0.7; this.vy += (dy / d) * 0.7; this.vx *= 0.9; this.vy *= 0.9; }
    this.vy = Math.min(this.vy + 0.35, 8);
    const hit = moveBody(this, game.room, game.world, { confine: true });
    if (hit.down) { this.vy = -this.vy * 0.4; this.vx *= 0.7; if (Math.abs(this.vy) < 1) this.vy = 0; }
    if (hit.left || hit.right) this.vx = -this.vx * 0.5;
    if (d < 16 && this.t > 8) { this.dead = true; game.collectGeo(this.value); }
    if (this.t > 1200) this.dead = true;
  }
  draw(ctx) { drawGeo(ctx, this.x + 4, this.y + 4, this.t); }
}

export class ShadeEcho extends Entity {
  constructor(x, y, geo) { super(x, y); this.geo = geo; }
  update(game) {
    this.t++;
    if (this.t % 5 === 0) game.particles.add({ x: this.x + rand(-10, 10), y: this.y - 20 + rand(-10, 10), vy: -0.5, life: 30, size: 3, color: 'rgba(10,8,16,0.8)', drag: 1 });
    if (this.near(game.player, 22, 40)) { this.dead = true; game.recoverShade(this); }
  }
  draw(ctx) { drawShade(ctx, this.x, this.y, this.t); }
}

// Cria as entidades de uma sala a partir dos marcadores do mapa.
export function spawnRoomEntities(room, save) {
  const list = [];
  const at = (e) => ({ x: e.tx * TILE + TILE / 2, y: (e.ty + 1) * TILE });
  for (const e of room.entities) {
    const { x, y } = at(e);
    switch (e.ch) {
      case 'B': list.push(new Bench(x, y)); break;
      case 'N': list.push(new NPC(x, y, room.npcs[e.index])); break;
      case 'L': list.push(new LoreStone(x, y, room.lore[e.index])); break;
      case 'A': if (!save.abilities[room.ability]) list.push(new AbilityPickup(x, y, room.ability)); break;
      case 'M': if (!save.collected[e.id]) list.push(new MaskPickup(x, y, e.id)); break;
      case '$': if (!save.collected[e.id]) list.push(new GeoRock(x, y, e.id)); break;
    }
  }
  return list;
}

