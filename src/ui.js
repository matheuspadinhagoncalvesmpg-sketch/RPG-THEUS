// Interface em HTML sobre o canvas: HUD, diálogos, mapa, loja, avisos.
import { AREAS, TILE, T, SOUL_MAX } from './config.js';
import { SHOP_ITEMS } from './dialog.js';
import { rgba } from './util.js';
import { TACTIC_NAMES } from './ai.js';

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
    this.aiBadge = $('#ai-badge');
    this.chatEl = $('#npc-chat');
    this.chatLog = $('#chat-log');
    this.chatInput = $('#chat-input');
    $('#chat-form').addEventListener('submit', (e) => { e.preventDefault(); this.sendChat(); });
    $('#chat-close').addEventListener('click', () => this.chat && this.chat.close());
    $('#chat-shop').addEventListener('click', () => this.chat && this.chat.shop && this.chat.shop());
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
    const t = game.ai.tactics;
    const badge = t.source === 'gemini' && game.enemies.length ? `✦ Gemini · ${TACTIC_NAMES[t.tactic] || t.tactic}` : '';
    if (this.last.badge !== badge) {
      this.last.badge = badge;
      this.aiBadge.textContent = badge;
      this.show(this.aiBadge, !!badge);
    }
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

  // ───── Conversa livre com personagens (Gemini) ─────
  openChat(npc, history, handlers) {
    this.chat = handlers;
    $('#chat-name').textContent = npc.data.name;
    this.chatLog.innerHTML = '';
    for (const h of history) this.addChatLine(h.who, h.text);
    if (!history.length) this.addChatLine('hint', 'Escreva qualquer coisa para conversar.');
    this.show($('#chat-shop'), !!handlers.shop);
    this.chatInput.value = '';
    this.chatInput.disabled = false;
    this.show(this.chatEl);
    if (!document.body.classList.contains('touch-mode')) this.chatInput.focus();
  }

  closeChat() {
    this.chatInput.blur();
    this.show(this.chatEl, false);
    this.chat = null;
  }

  addChatLine(who, text) {
    const el = document.createElement('p');
    el.className = 'chat-' + who;
    el.textContent = text;
    this.chatLog.appendChild(el);
    this.chatLog.scrollTop = this.chatLog.scrollHeight;
    return el;
  }

  async sendChat() {
    const text = this.chatInput.value.trim().slice(0, 120);
    if (!text || !this.chat || this.chatInput.disabled) return;
    const chat = this.chat;
    this.chatInput.value = '';
    this.chatInput.disabled = true;
    this.addChatLine('player', text);
    const wait = this.addChatLine('npc', '...');
    try {
      wait.textContent = await chat.send(text);
      chat.sound();
    } catch (e) {
      wait.textContent = '(parece distraído e não respondeu... tente de novo)';
    }
    this.chatInput.disabled = false;
    this.chatLog.scrollTop = this.chatLog.scrollHeight;
    if (!document.body.classList.contains('touch-mode') && this.chat) this.chatInput.focus();
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
