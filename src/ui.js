// Interface em HTML sobre o canvas: HUD, diálogos, mapa, loja, avisos.
import { AREAS, TILE, T, SOUL_MAX } from './config.js';
import { SHOP_ITEMS } from './dialog.js';
import { rgba } from './util.js';

const $ = (s) => document.querySelector(s);

export class UI {
  constructor() {
    this.hud = $('#hud');
    this.masksEl = $('#masks');
    this.soulFill = $('#soul-fill');
    this.geoEl = $('#geo-n');
    this.dialogEl = $('#dialog');
    this.dialogSpeaker = $('#dialog-speaker');
    this.dialogText = $('#dialog-text');
    this.bannerEl = $('#banner');
    this.areaEl = $('#area-title');
    this.bossTitleEl = $('#boss-title');
    this.bossBar = $('#boss-bar');
    this.bossFill = $('#boss-fill');
    this.toastEl = $('#toast');
    this.interactBtn = $('#tb-interact');
    this.mapScreen = $('#map-screen');
    this.mapCanvas = $('#map-canvas');
    this.shopScreen = $('#shop-screen');
    this.last = {};
    this.dialog = null;
  }

  show(el, on = true) { el.classList.toggle('hidden', !on); }

  // ───── HUD ─────
  updateHud(game) {
    const s = game.save;
    const key = `${game.masks}/${s.masksMax}`;
    if (this.last.masks !== key) {
      this.last.masks = key;
      let html = '';
      for (let i = 0; i < s.masksMax; i++) html += `<span class="mask${i < game.masks ? '' : ' empty'}"></span>`;
      this.masksEl.innerHTML = html;
      if (this.last.masksN != null && game.masks < this.last.masksN) {
        this.masksEl.classList.remove('hurt'); void this.masksEl.offsetWidth; this.masksEl.classList.add('hurt');
      }
      this.last.masksN = game.masks;
    }
    const soul = Math.round((game.soul / SOUL_MAX) * 100);
    if (this.last.soul !== soul) {
      this.last.soul = soul;
      this.soulFill.style.transform = `translateY(${100 - soul}%)`;
      $('#soul').classList.toggle('ready', game.soul >= 33);
    }
    if (this.last.geo !== s.geo) { this.last.geo = s.geo; this.geoEl.textContent = s.geo; }
    const boss = game.boss && !game.boss.dead ? game.boss : null;
    this.show(this.bossBar, !!boss && boss.state !== 'intro');
    if (boss) this.bossFill.style.transform = `scaleX(${Math.max(0, boss.hp / boss.maxHp)})`;
  }

  resetHud() { this.last = {}; }

  refreshButtons(ab) {
    document.querySelector('[data-act="dash"]').classList.toggle('hidden', !ab.dash);
    document.querySelector('[data-act="spell"]').classList.toggle('locked', !ab.spell);
  }

  setInteract(label) {
    if (this.last.interact === label) return;
    this.last.interact = label;
    this.interactBtn.textContent = label || '';
    this.show(this.interactBtn, !!label);
  }

  // ───── Diálogo com efeito de máquina de escrever ─────
  openDialog(speaker, lines, onDone) {
    this.dialog = { lines, i: 0, chars: 0, onDone, cooldown: 8 };
    this.dialogSpeaker.textContent = speaker || '';
    this.show(this.dialogSpeaker, !!speaker);
    this.dialogText.textContent = '';
    this.show(this.dialogEl);
  }

  updateDialog(audio) {
    const d = this.dialog;
    if (!d) return;
    if (d.cooldown > 0) d.cooldown--;
    const line = d.lines[d.i];
    if (d.chars < line.length) {
      d.chars = Math.min(line.length, d.chars + 1.4);
      this.dialogText.textContent = line.slice(0, Math.floor(d.chars));
      if (Math.floor(d.chars) % 4 === 0) audio.play('talk');
    }
    this.dialogEl.classList.toggle('done', d.chars >= line.length);
  }

  // Retorna true quando o diálogo terminou.
  advanceDialog() {
    const d = this.dialog;
    if (!d || d.cooldown > 0) return false;
    const line = d.lines[d.i];
    if (d.chars < line.length) { d.chars = line.length; this.dialogText.textContent = line; return false; }
    d.i++;
    d.chars = 0;
    d.cooldown = 4;
    if (d.i >= d.lines.length) {
      this.show(this.dialogEl, false);
      this.dialog = null;
      if (d.onDone) d.onDone();
      return true;
    }
    this.dialogText.textContent = '';
    return false;
  }

  // ───── Avisos ─────
  showBanner(icon, title, desc, keys) {
    this.bannerEl.querySelector('.banner-icon').textContent = icon;
    this.bannerEl.querySelector('h2').textContent = title;
    this.bannerEl.querySelector('.desc').textContent = desc;
    this.bannerEl.querySelector('.keys').textContent = keys || '';
    this.show(this.bannerEl);
  }
  hideBanner() { this.show(this.bannerEl, false); }

  areaTitle(name, sub) {
    this.areaEl.querySelector('h2').textContent = name;
    this.areaEl.querySelector('p').textContent = sub || '';
    this.flash(this.areaEl, 3600);
  }

  bossTitle(title, sub) {
    clearTimeout(this.areaEl._t);
    this.areaEl.classList.add('hidden');
    this.bossTitleEl.querySelector('h2').textContent = title;
    this.bossTitleEl.querySelector('p').textContent = sub || '';
    this.flash(this.bossTitleEl, 3200);
    $('#boss-name').textContent = title;
  }

  toast(text, ms = 2200) {
    this.toastEl.textContent = text;
    this.flash(this.toastEl, ms);
  }

  flash(el, ms) {
    clearTimeout(el._t);
    el.classList.remove('hidden', 'fade');
    void el.offsetWidth;
    el.classList.add('fade');
    el._t = setTimeout(() => el.classList.add('hidden'), ms);
  }

  // ───── Mapa ─────
  drawMap(game) {
    const c = this.mapCanvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = c.getBoundingClientRect();
    c.width = Math.round(rect.width * dpr);
    c.height = Math.round(rect.height * dpr);
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;
    const rooms = game.world.rooms.filter((r) => game.save.visited[r.id]);
    if (!rooms.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of rooms) {
      minX = Math.min(minX, r.x); minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.w); maxY = Math.max(maxY, r.y + r.h);
    }
    const pad = 16;
    const k = Math.min((W - pad * 2) / (maxX - minX), (H - pad * 2) / (maxY - minY), 6);
    const ox = (W - (maxX - minX) * k) / 2 - minX * k;
    const oy = (H - (maxY - minY) * k) / 2 - minY * k;

    for (const r of rooms) {
      const pal = AREAS[r.area];
      const cur = r === game.room;
      ctx.fillStyle = rgba(pal.top, cur ? 0.35 : 0.18);
      ctx.fillRect(ox + r.x * k, oy + r.y * k, r.w * k, r.h * k);
      ctx.fillStyle = cur ? '#f4efe6' : rgba('#d9d2c5', 0.75);
      for (let ty = 0; ty < r.h; ty++)
        for (let tx = 0; tx < r.w; tx++) {
          const t = r.tile(tx, ty);
          if (t === T.SOLID || t === T.BREAK) ctx.fillRect(ox + (r.x + tx) * k, oy + (r.y + ty) * k, k + 0.3, k + 0.3);
        }
    }
    // Marcadores
    const mark = (gx, gy, color, size) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(ox + gx * k, oy + gy * k, size, 0, Math.PI * 2); ctx.fill();
    };
    for (const r of rooms)
      for (const e of r.entities)
        if (e.ch === 'B') mark(r.x + e.tx + 0.5, r.y + e.ty + 0.5, '#ffcf7a', 4);
    const sh = game.save.shade;
    if (sh && game.world.byId[sh.room]) {
      const r = game.world.byId[sh.room];
      mark(r.x + sh.x / TILE, r.y + sh.y / TILE - 0.5, '#0a0810', 5);
      mark(r.x + sh.x / TILE, r.y + sh.y / TILE - 0.5, '#9b8fb5', 2.5);
    }
    const p = game.player;
    mark(game.room.x + p.cx / TILE, game.room.y + p.cy / TILE, '#ff3b4f', 5);
    mark(game.room.x + p.cx / TILE, game.room.y + p.cy / TILE, '#ffffff', 2);
    $('#map-room').textContent = `${AREAS[game.room.area].name} — ${game.room.name}`;
  }

  // ───── Loja ─────
  openShop(game, onClose) {
    const list = $('#shop-list');
    const render = () => {
      $('#shop-geo').textContent = game.save.geo;
      list.innerHTML = '';
      for (const it of SHOP_ITEMS) {
        const sold = game.save.bought[it.id];
        const b = document.createElement('button');
        b.className = 'shop-item' + (sold ? ' sold' : '');
        b.disabled = sold || game.save.geo < it.price;
        b.innerHTML = `<span class="si-name">${it.name}</span><span class="si-desc">${it.desc}</span><span class="si-price">${sold ? 'Vendido' : '◆ ' + it.price}</span>`;
        b.addEventListener('click', () => {
          if (sold || game.save.geo < it.price) return;
          game.save.geo -= it.price;
          game.save.bought[it.id] = true;
          it.apply(game.save);
          game.masks = game.save.masksMax;
          game.audio.play('pickup');
          game.persist();
          this.resetHud();
          this.updateHud(game);
          render();
        });
        list.appendChild(b);
      }
    };
    render();
    this.shopClose = onClose;
    this.show(this.shopScreen);
  }
}
