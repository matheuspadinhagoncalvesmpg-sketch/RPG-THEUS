// Objetos das salas: fogueiras, personagens, placas, itens, recursos, moedas, lápide e construções.
import { TILE, NODE_CHARS, BUILD_BY_ID, CHARMS } from './config.js';
import { moveBody } from './physics.js';
import { rand } from './util.js';
import { NPCS } from './dialog.js';
import {
  drawNPC, drawOrb, drawGeoRock, drawGeo, drawCampfire, drawTombstone,
  drawLifeCrystal, drawResourceNode, drawResourceIcon, drawBuildDeco, drawCloakPost, drawMarkA, drawTreasure, drawMemoria,
} from './art.js';
import { LOOT } from './loot.js';
import { WEAPONS, RARITY } from './config.js';
import { CAPES, CAPE_ORDER, capeNote } from './story.js';

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
  constructor(x, y, id) {
    super(x, y);
    this.id = id; this.data = NPCS[id]; this.label = 'Conversar';
    this.home = x; this.dir = Math.random() < 0.5 ? -1 : 1; this.pausa = 30 + Math.floor(rand(0, 90));
  }
  interact(game) { game.talkTo(this); }
  box() { return { x: this.x - 12, y: this.y - 44, w: 24, h: 44 }; }
  // Alguns NPCs andam devagar perto do seu ponto; param quando você está perto ou conversando.
  update(game) {
    this.t++;
    const w = this.data.wander;
    if (!w || game.state !== 'play') return;
    if (Math.abs(game.player.cx - this.x) < 70) return; // espera o herói chegar
    if (this.pausa > 0) { this.pausa--; return; }
    const nx = this.x + this.dir * 0.4;
    const room = game.room, tx = Math.floor(nx / TILE);
    const chao = game.world.isSolid(room, tx, Math.floor(this.y / TILE)) || room.tile(tx, Math.floor(this.y / TILE)) === 3;
    const parede = game.world.isSolid(room, tx, Math.floor((this.y - 8) / TILE));
    if (!chao || parede || Math.abs(nx - this.home) > w * TILE) { this.dir *= -1; this.pausa = 60 + Math.floor(rand(0, 140)); return; }
    this.x = nx;
    if (Math.random() < 0.004) this.pausa = 80 + Math.floor(rand(0, 160));
  }
  draw(ctx, game) {
    const perto = Math.abs(game.player.cx - this.x) < 150 || !this.data.wander;
    drawNPC(ctx, this.id, this.x, this.y, this.t, perto ? (game.player.cx < this.x ? -1 : 1) : this.dir);
  }
}

// Memória do mundo (diário, carta, eco, inscrição ou fresco): o texto vem de memorias.js.
export class LoreStone extends Entity {
  constructor(x, y, id) { super(x, y); this.id = id; this.label = 'Ler'; }
  interact(game) { game.lerMemoria(this.id); }
  draw(ctx, game) { drawMemoria(ctx, this.x, this.y, this.id, this.t, !!game.save.memorias[this.id]); }
}

// A capa de um Errante que veio antes, ao lado de uma fogueira (com um bilhete no bolso).
export class CloakPost extends Entity {
  constructor(x, y, key) { super(x, y); this.key = key; this.label = 'Ler'; }
  interact(game) { game.showDialog(null, [capeNote(this.key)]); }
  draw(ctx) { drawCloakPost(ctx, this.x, this.y, CAPES[this.key].color, this.t); }
}

// As sete capas do corredor do Trono, mais uma estaca vazia (a sua).
export class SevenCloaks extends Entity {
  constructor(x, y) { super(x, y); this.label = 'Ler'; }
  near(p) { return Math.abs(p.cx - (this.x + 78)) < 110 && Math.abs(p.y + p.h - this.y) < 40; }
  interact(game) {
    game.showDialog(null, ['Sete capas penduradas em estacas, uma ao lado da outra: vermelha, verde, roxa, laranja, rosa, preta, bege.', 'Na estaca mais perto da porta, uma oitava, vazia.']);
  }
  draw(ctx) {
    CAPE_ORDER.forEach((k, i) => drawCloakPost(ctx, this.x + i * 26, this.y, CAPES[k].color, this.t + i * 9));
    drawCloakPost(ctx, this.x + 7 * 26, this.y, '#000', this.t, true);
  }
}

// O "A" minúsculo entalhado por Alva criança: a mão do herói reconhece sem saber por quê.
export class MarkA extends Entity {
  constructor(x, y, id) { super(x, y); this.id = id; }
  update(game) {
    this.t++;
    if (!game.save.marcas[this.id] && this.near(game.player, 36, 44)) {
      game.save.marcas[this.id] = true;
      game.persist();
      game.audio.play('pickup_small');
      game.particles.burst(this.x, this.y - 10, 10, { color: ['#ffd27a', '#ffffff'], speed: 2, life: 40, glow: true, grav: -0.03 });
      game.ui.toast('Um "A" minúsculo, entalhado por mãos pequenas. Sua mão treme.', 3500);
    }
  }
  draw(ctx, game) { drawMarkA(ctx, this.x, this.y, this.t, !!game.save.marcas[this.id]); }
}

// Baú de tesouro do mundo: abre uma vez e guarda o que for (arma, moedas, materiais).
export class TreasureChest extends Entity {
  constructor(x, y, id, loot, done) { super(x, y); this.id = id; this.loot = loot; this.label = 'Abrir'; this.done = !!done; }
  // Selado enquanto houver guardiões (inimigos ou chefe) vivos na sala.
  sealed(game) { return game.enemies.some((e) => !e.dead && !e.inv); }
  near(p) { return !this.done && Math.abs(p.cx - this.x) < 36 && Math.abs(p.y + p.h - this.y) < 40; }
  update(game) {
    this.t++;
    this.label = this.sealed(game) ? 'Selado' : 'Abrir';
  }
  interact(game) {
    if (this.done) return;
    if (this.sealed(game)) { game.ui.toast('Selado: derrote os guardiões desta sala.', 2600); game.audio.play('deny'); return; }
    this.done = true;
    game.save.opened[this.id] = true;
    game.audio.play('pickup');
    game.particles.burst(this.x, this.y - 18, 22, { color: ['#ffffff', '#ffd27a'], speed: 5, life: 40, glow: true, grav: 0.06 });
    game.giveLoot(this.loot);
  }
  draw(ctx, game) {
    const w = this.loot.weapon && WEAPONS[this.loot.weapon];
    drawTreasure(ctx, this.x, this.y, this.done, this.t, this.label === 'Selado' ? '#ff5a4a' : w ? RARITY[w.rarity].color : '#ffd27a');
  }
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

// Amuleto: no desafio cronometrado só pode ser pego com o tempo correndo.
export class CharmPickup extends Entity {
  constructor(x, y, key, locked) { super(x, y); this.key = key; this.locked = locked; }
  update(game) {
    this.t++;
    const active = !this.locked || game.challenge.active;
    if (active && this.t % 5 === 0) {
      game.particles.add({ x: this.x + rand(-12, 12), y: this.y - 16 + rand(-8, 8), vy: -0.6, life: 30, size: 2, color: CHARMS[this.key].color, glow: true, drag: 1 });
    }
    if (this.near(game.player, 22, 34)) {
      if (active) { this.dead = true; game.collectCharm(this.key); }
      else if (this.t % 120 === 0) game.ui.toast('Pise no selo brilhante e chegue aqui a tempo!');
    }
  }
  draw(ctx, game) {
    const c = CHARMS[this.key];
    const active = !this.locked || game.challenge.active;
    ctx.save();
    if (!active) ctx.globalAlpha = 0.4;
    drawOrb(ctx, this.x, this.y - 16, this.t, c.color);
    ctx.fillStyle = '#16121c';
    ctx.font = '900 11px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.icon, this.x, this.y - 12);
    ctx.restore();
  }
}

// Selo que dá a largada do desafio cronometrado.
export class ChallengeSeal extends Entity {
  draw(ctx, game) {
    const on = game.challenge.active;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalCompositeOperation = 'lighter';
    const a = on ? 0.2 : 0.55 + Math.sin(this.t * 0.08) * 0.2;
    const g = ctx.createRadialGradient(0, -2, 2, 0, -2, 26);
    g.addColorStop(0, `rgba(255,211,110,${a})`); g.addColorStop(1, 'rgba(255,211,110,0)');
    ctx.fillStyle = g; ctx.fillRect(-26, -26, 52, 28);
    ctx.strokeStyle = `rgba(255,230,160,${a + 0.2})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, -2, 14, 4, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(0, -6); ctx.lineTo(5, -2); ctx.lineTo(0, 2); ctx.closePath(); ctx.stroke();
    ctx.restore();
  }
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
    if (this.hp <= 0) { this.dead = true; game.spent.nodes.add(this.id); }
  }
  update() { this.t++; if (this.flash > 0) this.flash--; }
  draw(ctx) { drawGeoRock(ctx, this.x, this.y, this.hp, this.flash > 0); }
}

// Árvore, rocha, minério ou cristal: golpeie para coletar. Volta ao reentrar na sala.
export class ResourceNode extends Entity {
  constructor(x, y, kind, id) { super(x, y); this.kind = kind; this.id = id; this.hp = 3; this.flash = 0; }
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
      game.spent.nodes.add(this.id); // volta ao descansar numa fogueira
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
    if (this.t > 20 && d < (game.hasCharm('ima_moedas') ? 220 : 80)) { this.vx += (dx / d) * 0.7; this.vy += (dy / d) * 0.7; this.vx *= 0.9; this.vy *= 0.9; }
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
export function spawnRoomEntities(room, save, spent = { nodes: new Set() }) {
  const list = [];
  const at = (e) => ({ x: e.tx * TILE + TILE / 2, y: (e.ty + 1) * TILE });
  for (const e of room.entities) {
    const { x, y } = at(e);
    switch (e.ch) {
      case 'B': list.push(new Campfire(x, y)); break;
      case 'N': {
        const who = room.npcs[e.index];
        if (who === 'oren' && save.base && save.base.smith) break; // Oren se mudou para o Lar
        list.push(new NPC(x, y, who));
        break;
      }
      case 'v': if (room.cape) list.push(new CloakPost(x, y, room.cape)); break;
      case 'V': list.push(new SevenCloaks(x, y)); break;
      case 't': { const loot = (LOOT[room.id] || [])[e.index]; if (loot) list.push(new TreasureChest(x, y, e.id, loot, !!save.opened[e.id])); break; }
      case 'a': list.push(new MarkA(x, y, `${room.id}:${e.tx},${e.ty}`)); break;
      case 'L': list.push(new LoreStone(x, y, room.lore[e.index])); break;
      case 'A': if (!save.abilities[room.ability]) list.push(new AbilityPickup(x, y, room.ability)); break;
      case 'M': if (!save.collected[e.id]) list.push(new LifeCrystal(x, y, e.id)); break;
      case 'C': if (!save.charms.owned[room.charm]) list.push(new CharmPickup(x, y, room.charm, !!room.challenge)); break;
      case 'T': if (room.challenge && !save.collected['challenge:' + room.id]) list.push(new ChallengeSeal(x, y)); break;
      case '$': if (!spent.nodes.has(e.id)) list.push(new GeoRock(x, y, e.id)); break;
      default:
        if (NODE_CHARS[e.ch] && !spent.nodes.has(e.id)) list.push(new ResourceNode(x, y, NODE_CHARS[e.ch], e.id));
    }
  }
  if (room.id === 'planicie_lar' && save.base && save.base.smith) {
    list.push(new NPC(34 * TILE + TILE / 2, 13 * TILE, 'smith'));
    list.push(new NPC(30 * TILE + TILE / 2, 13 * TILE, 'oren'));
  }
  for (const [idx, id] of room.placed) {
    const ent = makeBuilt(room, idx, id);
    if (ent) list.push(ent);
  }
  return list;
}
