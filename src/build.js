// Modo construção (estilo Terraria): coloque e remova peças nas zonas de construção.
import { TILE, T, BUILD_ITEMS, BUILD_BY_ID, BUILD_REACH, RESOURCES } from './config.js';
import { makeBuilt } from './entities.js';
import { overlap, shade, rgba } from './util.js';
import { drawBuildDeco, drawCampfire } from './art.js';

const $ = (s) => document.querySelector(s);

const BLOCK_COLORS = {
  wood_block: ['#8a5a32', '#c08a52'],
  wood_plat: ['#8a5a32', '#c08a52'],
  stone_block: ['#6a6676', '#a7a3b3'],
  crystal_block: ['#3aa9c4', '#bff7ff'],
};

export class BuildMode {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.sel = 1;
    this.hover = null;
    this.el = $('#hotbar');
    this.slotsEl = $('#hb-slots');
    this.resEl = $('#hb-res');
    this.infoEl = $('#hb-info');
    this.btn = $('#btn-build');
    this.buildSlots();
    $('#hb-close').addEventListener('click', () => this.close());
    window.addEventListener('keydown', (e) => {
      if (!this.active || (e.target && e.target.tagName === 'INPUT')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= BUILD_ITEMS.length) { this.select(n - 1); e.preventDefault(); }
      if (e.key === '0') this.select(0);
    });
  }

  get item() { return BUILD_ITEMS[this.sel]; }

  // Ícones da barra desenhados com a mesma arte do jogo.
  buildSlots() {
    this.slotsEl.innerHTML = '';
    this.slots = BUILD_ITEMS.map((it, i) => {
      const b = document.createElement('button');
      b.className = 'hb-slot';
      b.title = it.name;
      const c = document.createElement('canvas');
      c.width = 64; c.height = 64;
      const ctx = c.getContext('2d');
      ctx.scale(2, 2);
      this.drawIcon(ctx, it);
      const key = document.createElement('span');
      key.className = 'hb-key';
      key.textContent = i === 0 ? '0' : String(i);
      b.append(c, key);
      b.addEventListener('click', () => this.select(i));
      this.slotsEl.appendChild(b);
      return b;
    });
  }

  drawIcon(ctx, it) {
    if (it.tool) {
      // picareta
      ctx.strokeStyle = '#7a4f2a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(9, 25); ctx.lineTo(22, 10); ctx.stroke();
      ctx.strokeStyle = '#c7ccd8'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(22, 10, 9, Math.PI * 0.75, Math.PI * 1.85); ctx.stroke();
      return;
    }
    if (it.tile) {
      const [d, l] = BLOCK_COLORS[it.id];
      if (it.tile === T.ONEWAY) {
        ctx.fillStyle = l; ctx.fillRect(4, 12, 24, 6);
        ctx.fillStyle = d; ctx.fillRect(4, 18, 24, 3); ctx.fillRect(13, 21, 6, 5);
      } else {
        ctx.fillStyle = d; ctx.fillRect(6, 6, 20, 20);
        ctx.fillStyle = l; ctx.fillRect(6, 6, 20, 4);
        ctx.strokeStyle = rgba('#000000', 0.25); ctx.lineWidth = 1;
        ctx.strokeRect(6.5, 6.5, 19, 19);
        ctx.beginPath(); ctx.moveTo(6, 16.5); ctx.lineTo(26, 16.5); ctx.stroke();
      }
      return;
    }
    if (it.id === 'campfire') { ctx.save(); ctx.scale(0.8, 0.8); drawCampfire(ctx, 20, 34, 10, true); ctx.restore(); return; }
    ctx.save(); ctx.translate(16, it.id === 'torch' ? 30 : 29); ctx.scale(0.85, 0.85);
    drawBuildDeco(ctx, it.id, 0, 0, 10, '#8f2f3a');
    ctx.restore();
  }

  onRoomEnter(room) {
    this.btn.classList.toggle('hidden', !room.zone);
    if (!room.zone && this.active) this.close();
    if (room.zone && !this.game.save.talked['zone:' + room.id]) {
      this.game.save.talked['zone:' + room.id] = true;
      setTimeout(() => this.game.ui.toast('Zona de construção! Aperte B ou o martelo para construir.', 3500), 1200);
    }
  }

  toggle() { if (this.active) this.close(); else this.open(); }

  open() {
    if (!this.game.room.zone) {
      this.game.ui.toast('Aqui não dá para construir. Procure uma zona de construção.');
      return;
    }
    this.active = true;
    document.body.classList.add('build-mode');
    this.el.classList.remove('hidden');
    this.refresh();
    requestAnimationFrame(() => this.game.touchLayout && this.game.touchLayout());
  }

  close() {
    this.active = false;
    this.hover = null;
    document.body.classList.remove('build-mode');
    this.el.classList.add('hidden');
    requestAnimationFrame(() => this.game.touchLayout && this.game.touchLayout());
  }

  select(i) {
    this.sel = i;
    this.game.audio.play('ui');
    this.refresh();
  }

  canAfford(it) {
    const inv = this.game.save.inv;
    return !it.cost || Object.entries(it.cost).every(([k, n]) => (inv[k] || 0) >= n);
  }

  costText(it) {
    if (!it.cost) return '';
    return Object.entries(it.cost).map(([k, n]) => `${n} ${RESOURCES[k].name}`).join(' + ');
  }

  // Atualiza a barra (quantidades, seleção e o que cada peça custa).
  refresh() {
    const inv = this.game.save.inv;
    if (this.resEl) {
      this.resEl.innerHTML = Object.entries(RESOURCES)
        .map(([k, r]) => `<span><i style="background:${r.color}"></i>${r.name} <b>${inv[k] || 0}</b></span>`).join('');
    }
    if (!this.slots) return;
    this.slots.forEach((b, i) => {
      const it = BUILD_ITEMS[i];
      b.classList.toggle('active', i === this.sel);
      b.classList.toggle('poor', !it.tool && !this.canAfford(it));
    });
    const it = this.item;
    this.infoEl.textContent = it.tool
      ? 'Remover: devolve os materiais de uma peça construída'
      : `${it.name}: ${this.costText(it)}${it.desc ? ' · ' + it.desc : ''}`;
  }

  tileAt(sx, sy) {
    const w = this.game.screenToWorld(sx, sy);
    return { tx: Math.floor(w.x / TILE), ty: Math.floor(w.y / TILE) };
  }

  hoverScreen(sx, sy) {
    if (!this.active) return;
    this.hover = this.tileAt(sx, sy);
  }

  // Clique/toque: coloca a peça escolhida (ou remove, com o botão direito ou a picareta).
  clickScreen(sx, sy, remove = false) {
    if (!this.active || this.game.state !== 'play') return;
    const { tx, ty } = this.tileAt(sx, sy);
    this.hover = { tx, ty };
    const res = remove || this.item.tool ? this.remove(tx, ty) : this.place(tx, ty);
    if (res !== true) {
      this.game.audio.play('deny');
      this.game.floatText((tx + 0.5) * TILE, ty * TILE, res, '#ff8a7a');
    }
  }

  inReach(tx, ty) {
    const p = this.game.player;
    return Math.hypot((tx + 0.5) * TILE - p.cx, (ty + 0.5) * TILE - p.cy) <= BUILD_REACH;
  }

  // Retorna true se pode colocar, ou o motivo de não poder.
  check(it, tx, ty) {
    const { room, world, player } = this.game;
    if (!room.inside(tx, ty) || !room.inZone(tx, ty)) return 'Fora da zona';
    const idx = ty * room.w + tx;
    if (room.tile(tx, ty) !== T.EMPTY || room.placed.has(idx)) return 'Ocupado';
    if (!this.inReach(tx, ty)) return 'Muito longe';
    const box = { x: tx * TILE + 1, y: ty * TILE + 1, w: TILE - 2, h: TILE - 2 };
    if (it.tile && overlap(box, player)) return 'Você está aí';
    if (this.game.enemies.some((e) => !e.dead && overlap(box, e))) return 'Inimigo no caminho';
    if (this.game.entities.some((e) => e.box && overlap(box, e.box()))) return 'Ocupado';
    if (it.support === 'below') {
      const below = room.inside(tx, ty + 1) ? room.tile(tx, ty + 1) : T.SOLID;
      if (!(below === T.SOLID || below === T.ONEWAY || below === T.BREAK)) return 'Precisa de chão';
    }
    if (it.support === 'any') {
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => world.isSolid(room, tx + dx, ty + dy) || world.tileAt(room, tx + dx, ty + dy).t === T.ONEWAY);
      if (!n) return 'Precisa de apoio';
    }
    if (!this.canAfford(it)) return 'Faltam materiais';
    return true;
  }

  place(tx, ty) {
    const it = this.item;
    const ok = this.check(it, tx, ty);
    if (ok !== true) return ok;
    const g = this.game, room = g.room, idx = ty * room.w + tx;
    for (const [k, n] of Object.entries(it.cost)) g.save.inv[k] -= n;
    room.placed.set(idx, it.id);
    if (it.tile) {
      room.setTile(tx, ty, it.tile);
      g.renderer.invalidateRoom(room);
    } else {
      const ent = makeBuilt(room, idx, it.id);
      if (ent) g.entities.push(ent);
    }
    this.store(room, idx, it.id);
    g.audio.play('place');
    g.particles.dust((tx + 0.5) * TILE, (ty + 1) * TILE, 0, 6, 'rgba(230,220,200,0.5)');
    this.refresh();
    return true;
  }

  remove(tx, ty) {
    const g = this.game, room = g.room;
    if (!room.inside(tx, ty)) return 'Nada aqui';
    const idx = ty * room.w + tx;
    const id = room.placed.get(idx);
    if (!id) return room.tile(tx, ty) === T.EMPTY ? 'Nada aqui' : 'Isso faz parte do mundo';
    if (!this.inReach(tx, ty)) return 'Muito longe';
    this.removeIdx(room, idx);
    // Peças apoiadas em cima deste bloco caem junto.
    const above = idx - room.w;
    const upId = room.placed.get(above);
    if (upId && BUILD_BY_ID[upId].support === 'below') this.removeIdx(room, above);
    g.audio.play('rock');
    g.particles.burst((tx + 0.5) * TILE, (ty + 0.5) * TILE, 8, { color: ['#c08a52', '#a7a3b3'], speed: 3, grav: 0.25, life: 22 });
    this.refresh();
    return true;
  }

  removeIdx(room, idx) {
    const g = this.game;
    const it = BUILD_BY_ID[room.placed.get(idx)];
    room.placed.delete(idx);
    if (it.tile) {
      room.tiles[idx] = T.EMPTY;
      g.renderer.invalidateRoom(room);
    } else {
      g.entities = g.entities.filter((e) => e.idx !== idx);
    }
    for (const [k, n] of Object.entries(it.cost)) g.save.inv[k] = (g.save.inv[k] || 0) + n;
    this.store(room, idx, null);
  }

  store(room, idx, id) {
    const s = this.game.save;
    s.builds = s.builds || {};
    const r = (s.builds[room.id] = s.builds[room.id] || {});
    if (id) r[idx] = id; else delete r[idx];
    this.game.persist();
  }

  // Zona, alcance e prévia da peça sob o cursor.
  draw(ctx) {
    const { room, frame } = this.game;
    const z = room.zone;
    if (!z) return;
    ctx.save();
    ctx.strokeStyle = rgba('#ffcf7a', 0.55);
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = -frame * 0.3;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(z[0] * TILE + 0.5, z[1] * TILE + 0.5, z[2] * TILE - 1, z[3] * TILE - 1);
    ctx.setLineDash([]);
    ctx.fillStyle = rgba('#ffcf7a', 0.04);
    ctx.fillRect(z[0] * TILE, z[1] * TILE, z[2] * TILE, z[3] * TILE);
    const h = this.hover;
    if (h) {
      const it = this.item;
      const ok = it.tool ? room.placed.has(h.ty * room.w + h.tx) && this.inReach(h.tx, h.ty) : this.check(it, h.tx, h.ty) === true;
      const x = h.tx * TILE, y = h.ty * TILE;
      ctx.fillStyle = ok ? 'rgba(120,255,160,0.18)' : 'rgba(255,100,90,0.18)';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = ok ? 'rgba(140,255,170,0.9)' : 'rgba(255,120,110,0.9)';
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      if (!it.tool && ok) {
        ctx.globalAlpha = 0.55;
        if (it.tile) drawPlacedBlock(ctx, it.id, x, y);
        else if (it.id === 'campfire') drawCampfire(ctx, x + TILE / 2, y + TILE, frame);
        else drawBuildDeco(ctx, it.id, x + TILE / 2, y + TILE, frame, this.game.save.profile.cloak);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }
}

// Aparência dos blocos construídos (usada também pelo renderizador).
export function drawPlacedBlock(ctx, id, x, y) {
  const [d, l] = BLOCK_COLORS[id] || BLOCK_COLORS.wood_block;
  if (id === 'wood_plat') {
    ctx.fillStyle = shade(d, -0.3); ctx.fillRect(x - 0.5, y + 5, TILE + 1, 4);
    ctx.fillStyle = l; ctx.fillRect(x - 0.5, y, TILE + 1, 6);
    ctx.fillStyle = shade(l, 0.3); ctx.fillRect(x - 0.5, y, TILE + 1, 1.2);
    ctx.fillStyle = d; ctx.fillRect(x + 13, y + 6, 6, 8);
    return;
  }
  ctx.fillStyle = d;
  ctx.fillRect(x - 0.5, y - 0.5, TILE + 1, TILE + 1);
  if (id === 'wood_block') {
    ctx.fillStyle = l;
    for (let i = 0; i < 4; i++) ctx.fillRect(x, y + i * 8, TILE, 6.5);
    ctx.fillStyle = shade(d, -0.3);
    ctx.fillRect(x + 10, y, 1, 7); ctx.fillRect(x + 24, y + 8, 1, 7); ctx.fillRect(x + 6, y + 16, 1, 7); ctx.fillRect(x + 20, y + 24, 1, 7);
  } else if (id === 'stone_block') {
    ctx.fillStyle = l;
    ctx.fillRect(x + 1, y + 1, 14, 14); ctx.fillRect(x + 17, y + 1, 14, 14);
    ctx.fillRect(x + 1, y + 17, 6, 14); ctx.fillRect(x + 9, y + 17, 14, 14); ctx.fillRect(x + 25, y + 17, 6, 14);
    ctx.fillStyle = shade(l, 0.25);
    ctx.fillRect(x + 1, y + 1, 14, 2); ctx.fillRect(x + 17, y + 1, 14, 2); ctx.fillRect(x + 9, y + 17, 14, 2);
  } else if (id === 'crystal_block') {
    ctx.fillStyle = l;
    ctx.beginPath(); ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + 20, y + 2); ctx.lineTo(x + 2, y + 20); ctx.fill();
    ctx.fillStyle = rgba('#ffffff', 0.6);
    ctx.fillRect(x + 4, y + 4, 6, 2);
    ctx.strokeStyle = rgba('#e6fdff', 0.7); ctx.lineWidth = 1;
    ctx.strokeRect(x + 1.5, y + 1.5, TILE - 3, TILE - 3);
  }
}

