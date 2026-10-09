// Renderização: céu, paralaxe, blocos (pré-renderizados em pedaços) e iluminação.
import { TILE, VIEW_H, MAX_RENDER_SCALE, AREAS, T } from './config.js';
import { mulberry32, hashStr, shade, rgba, rand } from './util.js';
import { drawPlacedBlock } from './build.js';

const CHUNK = 16;           // blocos por pedaço
const MARGIN = 48;          // margem para grama/cipós que vazam do bloco
const LAYER_W = 1024;
const LAYER_H = 480;
const LAYER_GROUND = 380;   // linha do "chão" dentro da camada

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.chunks = new Map();
    this.layers = {};
    this.ambient = [];
    this.scale = 1;
    this.viewW = VIEW_H * 16 / 9;
    this.viewH = VIEW_H;
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = window.innerWidth, cssH = window.innerHeight;
    // Celulares às vezes informam tamanho 0 por um instante (tela cheia, rotação,
    // barra de endereço). Ignora esse momento em vez de gerar escala 0/NaN.
    if (!(cssW > 0 && cssH > 0)) return;
    let bh = Math.round(cssH * dpr);
    let scale = bh / VIEW_H;
    if (scale > MAX_RENDER_SCALE) { scale = MAX_RENDER_SCALE; bh = Math.round(VIEW_H * scale); }
    const bw = Math.round((cssW / cssH) * bh);
    this.canvas.width = bw;
    this.canvas.height = bh;
    this.scale = scale;
    this.viewW = bw / scale;
    this.viewH = bh / scale;
    this.chunks.clear();
    this.layers = {};
    this.vignette = null;
  }

  // Libera memória ao trocar de sala/região (importante no celular).
  setRoom(room) {
    if (this.roomId !== room.id) this.chunks.clear();
    if (this.areaKey !== room.area) { this.layers = {}; this.skyGrad = null; }
    this.roomId = room.id;
    this.areaKey = room.area;
  }

  invalidateRoom(room) {
    for (const k of [...this.chunks.keys()]) if (k.startsWith(room.id + ':')) this.chunks.delete(k);
  }

  // ───────── Blocos ─────────
  chunk(game, room, cx, cy) {
    const key = `${room.id}:${cx},${cy}`;
    let c = this.chunks.get(key);
    if (c) return c;
    const s = this.scale;
    const size = CHUNK * TILE + MARGIN * 2;
    c = document.createElement('canvas');
    c.width = Math.ceil(size * s);
    c.height = Math.ceil(size * s);
    const ctx = c.getContext('2d');
    ctx.setTransform(s, 0, 0, s, (-cx * CHUNK * TILE + MARGIN) * s, (-cy * CHUNK * TILE + MARGIN) * s);
    const pal = AREAS[room.area];
    let any = false;
    for (let ty = cy * CHUNK; ty < Math.min(room.h, (cy + 1) * CHUNK) && !any; ty++)
      for (let tx = cx * CHUNK; tx < Math.min(room.w, (cx + 1) * CHUNK); tx++)
        if (room.tile(tx, ty) !== T.EMPTY && room.tile(tx, ty) !== T.DOOR) { any = true; break; }
    if (!any) { c.width = c.height = 1; this.chunks.set(key, c); return c; }
    for (let ty = cy * CHUNK; ty < Math.min(room.h, (cy + 1) * CHUNK); ty++)
      for (let tx = cx * CHUNK; tx < Math.min(room.w, (cx + 1) * CHUNK); tx++)
        this.drawTile(ctx, game, room, tx, ty, pal);
    this.chunks.set(key, c);
    return c;
  }

  drawTile(ctx, game, room, tx, ty, pal) {
    const t = room.tile(tx, ty);
    if (t === T.EMPTY || t === T.DOOR) return;
    const rng = mulberry32(hashStr(room.id) ^ (tx * 73856093) ^ (ty * 19349663));
    const x = tx * TILE, y = ty * TILE;
    const area = room.area;
    const solid = (dx, dy) => game.world.isSolid(room, tx + dx, ty + dy);

    const placed = room.placed.get(ty * room.w + tx);
    if (placed) return drawPlacedBlock(ctx, placed, x, y);
    if (t === T.SPIKE) return this.drawSpikes(ctx, x, y, pal, area, rng);
    if (t === T.ONEWAY) return this.drawPlank(ctx, x, y, pal, area, rng, tx);

    // Massa sólida
    ctx.fillStyle = pal.ground;
    ctx.fillRect(x - 0.5, y - 0.5, TILE + 1, TILE + 1);
    if (rng() < 0.55) {
      ctx.fillStyle = shade(pal.ground, -0.3);
      ctx.beginPath();
      ctx.ellipse(x + rng() * TILE, y + rng() * TILE, 3 + rng() * 6, 2 + rng() * 4, rng() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (rng() < 0.35) {
      ctx.fillStyle = rgba(pal.groundHi, 0.5);
      ctx.fillRect(x + rng() * 28, y + rng() * 28, 2 + rng() * 3, 2);
    }
    if (area === 'ruinas') {
      ctx.strokeStyle = rgba(pal.groundHi, 0.45);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + 16.5); ctx.lineTo(x + TILE, y + 16.5);
      const vx = x + (ty % 2 ? 8.5 : 24.5);
      ctx.moveTo(vx, y); ctx.lineTo(vx, y + 16);
      const vx2 = x + (ty % 2 ? 24.5 : 8.5);
      ctx.moveTo(vx2, y + 16); ctx.lineTo(vx2, y + TILE);
      ctx.stroke();
    }
    if (t === T.BREAK) {
      ctx.strokeStyle = rgba(pal.groundHi, 0.7);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + 4); ctx.lineTo(x + 14, y + 14); ctx.lineTo(x + 10, y + 24); ctx.lineTo(x + 20, y + 30);
      ctx.moveTo(x + 14, y + 14); ctx.lineTo(x + 26, y + 10);
      ctx.stroke();
    }

    const up = !solid(0, -1), down = !solid(0, 1), left = !solid(-1, 0), right = !solid(1, 0);
    if (left) { ctx.fillStyle = rgba(pal.groundHi, 0.8); ctx.fillRect(x, y, 2, TILE); }
    if (right) { ctx.fillStyle = rgba(pal.groundHi, 0.8); ctx.fillRect(x + TILE - 2, y, 2, TILE); }
    if (down) {
      ctx.fillStyle = shade(pal.ground, -0.45);
      ctx.fillRect(x, y + TILE - 3, TILE, 3);
      this.drawUnderside(ctx, x, y + TILE, pal, area, rng);
    }
    if (up) {
      ctx.fillStyle = pal.groundHi;
      ctx.fillRect(x, y, TILE, 6);
      ctx.fillStyle = pal.top;
      ctx.fillRect(x - 0.5, y - 1, TILE + 1, 4);
      ctx.fillStyle = pal.topHi;
      ctx.fillRect(x - 0.5, y - 1, TILE + 1, 1.2);
      this.drawTopDecor(ctx, x, y, pal, area, rng);
    }
  }

  drawTopDecor(ctx, x, y, pal, area, rng) {
    if (area === 'campos') {
      for (let i = 0; i < 7; i++) {
        const bx = x + rng() * TILE, h = 4 + rng() * 10, lean = (rng() - 0.5) * 6;
        ctx.fillStyle = rng() < 0.5 ? pal.top : shade(pal.topHi, -0.15);
        ctx.beginPath(); ctx.moveTo(bx - 1.6, y); ctx.lineTo(bx + lean, y - h); ctx.lineTo(bx + 1.6, y); ctx.fill();
      }
      if (rng() < 0.08) {
        ctx.fillStyle = pal.accent;
        ctx.beginPath(); ctx.arc(x + rng() * TILE, y - 6 - rng() * 4, 1.8, 0, Math.PI * 2); ctx.fill();
      }
    } else if (area === 'bosque') {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = rng() < 0.5 ? pal.top : shade(pal.top, -0.25);
        ctx.beginPath(); ctx.arc(x + rng() * TILE, y + 1, 3 + rng() * 3, Math.PI, 0); ctx.fill();
      }
      if (rng() < 0.1) {
        const mx = x + 6 + rng() * 20;
        ctx.fillStyle = '#d8cfc0'; ctx.fillRect(mx - 1, y - 6, 2, 6);
        ctx.fillStyle = pal.accent; ctx.beginPath(); ctx.ellipse(mx, y - 7, 4, 2.5, 0, Math.PI, 0); ctx.fill();
      }
    } else if (area === 'ruinas') {
      if (rng() < 0.35) {
        for (let i = 0; i < 3; i++) {
          const bx = x + rng() * TILE;
          ctx.fillStyle = shade(pal.top, -0.2);
          ctx.beginPath(); ctx.moveTo(bx - 1, y); ctx.lineTo(bx + (rng() - 0.5) * 3, y - 3 - rng() * 5); ctx.lineTo(bx + 1, y); ctx.fill();
        }
      }
    } else if (area === 'cristal') {
      if (rng() < 0.4) {
        const bx = x + 4 + rng() * 24, h = 6 + rng() * 14, w = 3 + rng() * 3;
        ctx.fillStyle = rgba(pal.topHi, 0.85);
        ctx.beginPath(); ctx.moveTo(bx - w, y); ctx.lineTo(bx + (rng() - 0.5) * 4, y - h); ctx.lineTo(bx + w, y); ctx.fill();
        ctx.fillStyle = rgba(pal.top, 0.9);
        ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + (rng() - 0.5) * 4, y - h); ctx.lineTo(bx + w, y); ctx.fill();
      }
    }
  }

  drawUnderside(ctx, x, y, pal, area, rng) {
    if (area === 'bosque') {
      ctx.strokeStyle = shade(pal.top, -0.3);
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 2; i++) {
        if (rng() < 0.45) {
          const vx = x + rng() * TILE, len = 8 + rng() * 34;
          ctx.beginPath(); ctx.moveTo(vx, y); ctx.quadraticCurveTo(vx + 4, y + len / 2, vx - 1, y + len); ctx.stroke();
          if (rng() < 0.4) { ctx.fillStyle = pal.top; ctx.beginPath(); ctx.arc(vx - 1, y + len, 2, 0, Math.PI * 2); ctx.fill(); }
        }
      }
    } else if (area === 'cristal') {
      if (rng() < 0.4) {
        const bx = x + 4 + rng() * 24, h = 6 + rng() * 16;
        ctx.fillStyle = rgba(pal.accent, 0.55);
        ctx.beginPath(); ctx.moveTo(bx - 3, y); ctx.lineTo(bx, y + h); ctx.lineTo(bx + 3, y); ctx.fill();
      }
    } else if (area === 'campos') {
      if (rng() < 0.4) {
        ctx.strokeStyle = shade(pal.ground, 0.15); ctx.lineWidth = 1.2;
        const vx = x + rng() * TILE;
        ctx.beginPath(); ctx.moveTo(vx, y); ctx.lineTo(vx + (rng() - 0.5) * 6, y + 4 + rng() * 8); ctx.stroke();
      }
    } else if (rng() < 0.3) {
      ctx.fillStyle = shade(pal.ground, 0.1);
      ctx.fillRect(x + rng() * 28, y, 3, 2 + rng() * 5);
    }
  }

  drawSpikes(ctx, x, y, pal, area, rng) {
    const base = y + TILE;
    const dark = area === 'ruinas' ? '#6b7290' : area === 'cristal' ? rgba(pal.accent, 0.9) : shade(pal.ground, 0.25);
    const light = area === 'ruinas' ? '#dfe4f2' : area === 'cristal' ? '#e6fdff' : shade(pal.top, 0.1);
    for (let i = 0; i < 4; i++) {
      const sx = x + 4 + i * 8, h = 14 + rng() * 6;
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.moveTo(sx - 4.5, base); ctx.lineTo(sx + (rng() - 0.5) * 2, base - h); ctx.lineTo(sx + 4.5, base); ctx.fill();
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.moveTo(sx - 1, base - 2); ctx.lineTo(sx, base - h + 2); ctx.lineTo(sx + 1, base - 2); ctx.fill();
    }
  }

  drawPlank(ctx, x, y, pal, area, rng, tx) {
    ctx.fillStyle = shade(pal.plank, -0.45);
    ctx.fillRect(x - 0.5, y + 5, TILE + 1, 4);
    ctx.fillStyle = pal.plank;
    ctx.fillRect(x - 0.5, y, TILE + 1, 6);
    ctx.fillStyle = shade(pal.plank, 0.3);
    ctx.fillRect(x - 0.5, y, TILE + 1, 1.2);
    if (tx % 2 === 0) {
      ctx.fillStyle = shade(pal.plank, -0.3);
      ctx.beginPath(); ctx.moveTo(x + 10, y + 8); ctx.lineTo(x + 16, y + 16); ctx.lineTo(x + 22, y + 8); ctx.fill();
    }
    if (area === 'bosque' && rng() < 0.5) {
      ctx.strokeStyle = shade(pal.top, -0.2); ctx.lineWidth = 1.2;
      const vx = x + rng() * TILE;
      ctx.beginPath(); ctx.moveTo(vx, y + 8); ctx.lineTo(vx + 1, y + 14 + rng() * 14); ctx.stroke();
    }
  }

  // ───────── Fundo em paralaxe ─────────
  layer(areaKey, depth) {
    const key = areaKey + depth;
    if (this.layers[key]) return this.layers[key];
    const s = this.scale;
    const c = document.createElement('canvas');
    c.width = Math.ceil(LAYER_W * s);
    c.height = Math.ceil(LAYER_H * s);
    const ctx = c.getContext('2d');
    ctx.scale(s, s);
    const pal = AREAS[areaKey];
    const rng = mulberry32(hashStr(areaKey + depth));
    const color = depth === 0 ? pal.far : pal.mid;
    const G = LAYER_GROUND;
    ctx.fillStyle = color;
    const wrapDraw = (fn) => { for (const off of [-LAYER_W, 0, LAYER_W]) { ctx.save(); ctx.translate(off, 0); fn(); ctx.restore(); } };

    if (areaKey === 'campos') {
      // colinas onduladas
      ctx.beginPath();
      ctx.moveTo(0, LAYER_H);
      const amp = depth === 0 ? 50 : 34, base = depth === 0 ? G - 70 : G - 20;
      for (let x = 0; x <= LAYER_W; x += 16)
        ctx.lineTo(x, base - Math.sin((x / LAYER_W) * Math.PI * 2 * (depth + 2)) * amp - Math.sin((x / LAYER_W) * Math.PI * 6) * 10);
      ctx.lineTo(LAYER_W, LAYER_H);
      ctx.fill();
      // árvores e moinho
      for (let i = 0; i < (depth === 0 ? 8 : 6); i++) {
        const tx = rng() * LAYER_W, h = 40 + rng() * 60;
        const by = base - Math.sin((tx / LAYER_W) * Math.PI * 2 * (depth + 2)) * amp + 6;
        wrapDraw(() => {
          ctx.fillRect(tx - 2, by - h, 4, h);
          ctx.beginPath(); ctx.ellipse(tx, by - h, 16 + rng() * 10, 20 + rng() * 10, 0, 0, Math.PI * 2); ctx.fill();
        });
      }
      if (depth === 0) {
        const mx = 700, my = base - 40;
        ctx.fillRect(mx - 8, my - 90, 16, 90);
        ctx.save(); ctx.translate(mx, my - 90);
        for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-3, 0, 6, 55); }
        ctx.restore();
      }
    } else if (areaKey === 'bosque') {
      for (let i = 0; i < (depth === 0 ? 14 : 9); i++) {
        const tx = (i / (depth === 0 ? 14 : 9)) * LAYER_W + rng() * 50, w = depth === 0 ? 12 + rng() * 14 : 24 + rng() * 22;
        wrapDraw(() => {
          ctx.fillRect(tx - w / 2, 0, w, LAYER_H);
          ctx.beginPath(); ctx.moveTo(tx - w / 2, G - 30); ctx.quadraticCurveTo(tx - w * 1.6, G, tx - w * 2, G + 30); ctx.lineTo(tx + w * 2, G + 30); ctx.quadraticCurveTo(tx + w * 1.6, G, tx + w / 2, G - 30); ctx.fill();
          for (let b = 0; b < 3; b++) {
            const by = 60 + rng() * 240, dir = rng() < 0.5 ? -1 : 1;
            ctx.beginPath(); ctx.moveTo(tx, by); ctx.lineTo(tx + dir * (30 + rng() * 40), by - 20 - rng() * 30); ctx.lineTo(tx, by + 8); ctx.fill();
          }
        });
      }
      ctx.fillRect(0, G + 10, LAYER_W, LAYER_H);
      // lanternas
      for (let i = 0; i < (depth === 0 ? 10 : 6); i++) {
        const lx = rng() * LAYER_W, ly = 120 + rng() * 220;
        const g = ctx.createRadialGradient(lx, ly, 1, lx, ly, depth === 0 ? 14 : 22);
        g.addColorStop(0, rgba(pal.accent, depth === 0 ? 0.55 : 0.8)); g.addColorStop(1, rgba(pal.accent, 0));
        ctx.fillStyle = g;
        ctx.fillRect(lx - 30, ly - 30, 60, 60);
        ctx.fillStyle = color;
      }
    } else if (areaKey === 'ruinas') {
      // nuvens + ilhas flutuantes com torres
      for (let i = 0; i < 5; i++) {
        const ix = rng() * LAYER_W, iy = 80 + rng() * (G - 120), iw = 60 + rng() * 90;
        wrapDraw(() => {
          ctx.beginPath(); ctx.moveTo(ix - iw / 2, iy); ctx.lineTo(ix + iw / 2, iy); ctx.lineTo(ix + iw * 0.15, iy + iw * 0.6); ctx.lineTo(ix - iw * 0.1, iy + iw * 0.5); ctx.fill();
          for (let k = 0; k < 2; k++) {
            const tx = ix - iw / 3 + rng() * iw * 0.6, th = 20 + rng() * 60;
            ctx.fillRect(tx - 6, iy - th, 12, th);
            ctx.beginPath(); ctx.moveTo(tx - 9, iy - th); ctx.lineTo(tx, iy - th - 16); ctx.lineTo(tx + 9, iy - th); ctx.fill();
          }
        });
      }
      ctx.fillStyle = rgba(pal.haze, depth === 0 ? 0.25 : 0.35);
      for (let i = 0; i < 9; i++) {
        const cx = rng() * LAYER_W, cy = G - 20 + rng() * 80;
        wrapDraw(() => {
          for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(cx + k * 26, cy + (k % 2) * 6, 34, 16, 0, 0, Math.PI * 2); ctx.fill(); }
        });
      }
    } else if (areaKey === 'cristal') {
      for (let i = 0; i < (depth === 0 ? 16 : 10); i++) {
        const cx = rng() * LAYER_W, h = 60 + rng() * 180, w = 10 + rng() * 22;
        wrapDraw(() => {
          ctx.beginPath(); ctx.moveTo(cx - w, G + 40); ctx.lineTo(cx + (rng() - 0.5) * 20, G + 40 - h); ctx.lineTo(cx + w, G + 40); ctx.fill();
          const sh = 30 + rng() * 120;
          ctx.beginPath(); ctx.moveTo(cx - w * 0.7 + 40, 0); ctx.lineTo(cx + 40, sh); ctx.lineTo(cx + w * 0.7 + 40, 0); ctx.fill();
        });
      }
      ctx.fillRect(0, G + 30, LAYER_W, LAYER_H);
      for (let i = 0; i < 12; i++) {
        const lx = rng() * LAYER_W, ly = 60 + rng() * 300;
        const g = ctx.createRadialGradient(lx, ly, 1, lx, ly, 18);
        g.addColorStop(0, rgba(pal.accent, depth === 0 ? 0.3 : 0.5)); g.addColorStop(1, rgba(pal.accent, 0));
        ctx.fillStyle = g; ctx.fillRect(lx - 20, ly - 20, 40, 40);
      }
    }
    this.layers[key] = c;
    return c;
  }

  drawBackground(game, camX, camY) {
    const ctx = this.ctx;
    const room = game.room;
    const pal = AREAS[room.area];
    const W = this.canvas.width, H = this.canvas.height, s = this.scale;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!this.skyGrad || this.skyArea !== room.area) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      pal.sky.forEach((c, i) => g.addColorStop(i / (pal.sky.length - 1), c));
      this.skyGrad = g;
      this.skyArea = room.area;
    }
    ctx.fillStyle = this.skyGrad;
    ctx.fillRect(0, 0, W, H);

    const gCamX = room.x * TILE + camX, gCamY = room.y * TILE + camY;
    // sol poente / lua
    if (room.area === 'campos' || room.area === 'ruinas') {
      const sx = W * 0.72 - (gCamX * 0.02) * s;
      const sy = H * 0.5 + ((pal.horizon - gCamY - this.viewH / 2) * 0.08) * s;
      const r = (room.area === 'campos' ? 70 : 40) * s;
      const sg = ctx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r * 4);
      sg.addColorStop(0, room.area === 'campos' ? 'rgba(255,214,140,0.9)' : 'rgba(255,248,230,0.8)');
      sg.addColorStop(0.25, room.area === 'campos' ? 'rgba(255,170,100,0.35)' : 'rgba(220,230,255,0.25)');
      sg.addColorStop(1, 'rgba(255,160,100,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(sx - r * 4, sy - r * 4, r * 8, r * 8);
      ctx.fillStyle = room.area === 'campos' ? '#ffd79a' : '#fff6e6';
      ctx.beginPath(); ctx.arc(sx, sy, r * 0.45, 0, Math.PI * 2); ctx.fill();
    }

    for (const [depth, p] of [[0, 0.12], [1, 0.32]]) {
      const img = this.layer(room.area, depth);
      const groundY = (this.viewH / 2 + (pal.horizon - (gCamY + this.viewH / 2)) * p) * s;
      const top = groundY - LAYER_GROUND * s;
      let ox = -((gCamX * p) % LAYER_W) * s;
      if (ox > 0) ox -= LAYER_W * s;
      // Céu aberto (ruínas): a camada se repete também na vertical.
      let y0 = top, y1 = top;
      if (pal.tileY) {
        const lh = LAYER_H * s;
        y0 = top - Math.ceil(top / lh) * lh;
        y1 = H;
      }
      for (let y = y0; y <= y1; y += LAYER_H * s)
        for (let x = ox; x < W; x += LAYER_W * s) ctx.drawImage(img, Math.floor(x), Math.floor(y), Math.ceil(LAYER_W * s) + 1, Math.ceil(LAYER_H * s));
      const bottom = top + LAYER_H * s;
      if (!pal.tileY && bottom < H) {
        ctx.fillStyle = depth === 0 ? pal.far : pal.mid;
        ctx.fillRect(0, Math.floor(bottom) - 1, W, H - bottom + 2);
      }
      // névoa entre camadas
      ctx.fillStyle = rgba(pal.haze, 0.06);
      ctx.fillRect(0, 0, W, H);
    }
  }

  drawTiles(game, camX, camY) {
    const room = game.room;
    const ctx = this.ctx;
    const s = this.scale;
    const span = CHUNK * TILE;
    const cx0 = Math.max(0, Math.floor((camX - MARGIN) / span)), cx1 = Math.floor((camX + this.viewW + MARGIN) / span);
    const cy0 = Math.max(0, Math.floor((camY - MARGIN) / span)), cy1 = Math.floor((camY + this.viewH + MARGIN) / span);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let cy = cy0; cy <= cy1 && cy * CHUNK < room.h; cy++)
      for (let cx = cx0; cx <= cx1 && cx * CHUNK < room.w; cx++) {
        const img = this.chunk(game, room, cx, cy);
        if (img.width === 1) continue;
        const x = Math.round((cx * span - MARGIN - camX) * s), y = Math.round((cy * span - MARGIN - camY) * s);
        ctx.drawImage(img, x, y);
      }
  }

  // Portões de chefe (dinâmicos)
  drawDoors(ctx, room, t) {
    if (!room.doorsClosed) return;
    for (let ty = 0; ty < room.h; ty++)
      for (let tx = 0; tx < room.w; tx++) {
        if (room.tile(tx, ty) !== T.DOOR) continue;
        const x = tx * TILE, y = ty * TILE;
        ctx.fillStyle = '#0d0b12';
        ctx.fillRect(x + 4, y, TILE - 8, TILE);
        ctx.fillStyle = '#5a5470';
        for (let i = 0; i < 3; i++) ctx.fillRect(x + 7 + i * 7, y, 3, TILE);
        ctx.fillStyle = 'rgba(255,120,90,' + (0.3 + Math.sin(t * 0.1) * 0.15) + ')';
        ctx.fillRect(x + 4, y + 14, TILE - 8, 2);
      }
  }

  // ───────── Partículas de ambiente ─────────
  updateAmbient(game, camX, camY) {
    const kind = AREAS[game.room.area].particles;
    const want = kind === 'fireflies' ? 26 : 34;
    if (this.ambientKind !== kind) { this.ambient = []; this.ambientKind = kind; }
    while (this.ambient.length < want)
      this.ambient.push({ x: camX + rand(0, this.viewW), y: camY + rand(0, this.viewH), vx: 0, vy: 0, ph: rand(0, 6.28), s: rand(0.6, 1.4) });
    const W = this.viewW, H = this.viewH;
    for (const p of this.ambient) {
      p.ph += 0.03;
      if (kind === 'pollen') { p.vx = 0.25 + Math.sin(p.ph) * 0.2; p.vy = -0.12 + Math.cos(p.ph * 0.7) * 0.15; }
      else if (kind === 'fireflies') { p.vx = Math.sin(p.ph * 0.9) * 0.5; p.vy = Math.cos(p.ph * 0.6) * 0.4; }
      else if (kind === 'motes') { p.vx = 0.6 * p.s; p.vy = Math.sin(p.ph) * 0.15; }
      else { p.vx = Math.sin(p.ph) * 0.1; p.vy = -0.2 * p.s; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < camX - 20) p.x += W + 40; else if (p.x > camX + W + 20) p.x -= W + 40;
      if (p.y < camY - 20) p.y += H + 40; else if (p.y > camY + H + 20) p.y -= H + 40;
    }
  }

  drawAmbient(ctx, game) {
    const pal = AREAS[game.room.area];
    const kind = this.ambientKind;
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.ambient) {
      const tw = 0.5 + Math.sin(p.ph * 3) * 0.5;
      if (kind === 'fireflies') {
        ctx.fillStyle = rgba(pal.accent, 0.1 * tw);
        ctx.beginPath(); ctx.arc(p.x, p.y, 4 * p.s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rgba('#ffd27a', 0.9 * tw);
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.3 * p.s, 0, Math.PI * 2); ctx.fill();
      } else {
        const c = kind === 'pollen' ? pal.accent : kind === 'sparkles' ? pal.accent : '#ffffff';
        ctx.fillStyle = rgba(c, (kind === 'sparkles' ? 0.7 : 0.4) * tw);
        ctx.fillRect(p.x, p.y, 1.6 * p.s, 1.6 * p.s);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // ───────── Luz ─────────
  drawLighting(game, camX, camY) {
    const ctx = this.ctx;
    const pal = AREAS[game.room.area];
    const W = this.canvas.width, H = this.canvas.height, s = this.scale;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (pal.dark > 0) {
      const p = game.player;
      const px = (p.cx - camX) * s, py = (p.cy - camY) * s;
      const g = ctx.createRadialGradient(px, py, 70 * s, px, py, 420 * s);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${pal.dark})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    const hz = ctx.createLinearGradient(0, H * 0.6, 0, H);
    hz.addColorStop(0, rgba(pal.haze, 0));
    hz.addColorStop(1, rgba(pal.haze, 0.08));
    ctx.fillStyle = hz;
    ctx.fillRect(0, H * 0.6, W, H * 0.4);
    if (!this.vignette) {
      const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(0,0,0,0.5)');
      this.vignette = v;
    }
    ctx.fillStyle = this.vignette;
    ctx.fillRect(0, 0, W, H);
  }
}
