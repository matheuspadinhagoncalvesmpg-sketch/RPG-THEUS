// Painéis de fabricação (bancada/forja), baú e loja do ferreiro.
import { RECIPES, RESOURCES, SMITH_STOCK, WEAPONS, ARMORS, CHARMS, CHARM_SLOTS, RARITY, ownsWeapon, MAP_PRICES, AREAS } from './config.js';

const $ = (s) => document.querySelector(s);

const costHTML = (cost, inv) => Object.entries(cost)
  .map(([k, n]) => `<span class="${(inv[k] || 0) >= n ? '' : 'miss'}"><i style="background:${RESOURCES[k].color}"></i>${n} ${RESOURCES[k].name}</span>`)
  .join(' ');

const canPay = (cost, inv) => Object.entries(cost).every(([k, n]) => (inv[k] || 0) >= n);

export class CraftUI {
  constructor(game) {
    this.game = game;
    this.el = $('#craft-screen');
    this.list = $('#craft-list');
    $('#btn-craft-close').addEventListener('click', () => this.close());
  }

  open(title, subtitle, render) {
    const g = this.game;
    g.state = 'craft';
    document.body.classList.add('menu-open');
    $('#craft-title').textContent = title;
    $('#craft-sub').innerHTML = subtitle;
    this.render = render;
    this.render();
    this.el.classList.remove('hidden');
  }

  close() {
    this.el.classList.add('hidden');
    document.body.classList.remove('menu-open');
    if (this.game.state === 'craft') this.game.state = 'play';
    this.game.input.consume('jump');
  }

  item(name, desc, right, onClick, disabled) {
    const b = document.createElement('button');
    b.className = 'shop-item';
    b.disabled = !!disabled;
    b.innerHTML = `<span class="si-name">${name}</span><span class="si-desc">${desc}</span><span class="si-price">${right}</span>`;
    b.addEventListener('click', onClick);
    this.list.appendChild(b);
  }

  equipped() {
    const s = this.game.save;
    return `Equipado: <b>${WEAPONS[s.weapon || 'errante'].name}</b> · <b>${ARMORS[s.armor || 'none'].name}</b>`;
  }

  // ── Bancada e forja ──
  openStation(station) {
    const g = this.game;
    const title = station === 'forge' ? 'Forja' : 'Bancada';
    this.open(title, this.equipped(), () => {
      const s = g.save;
      this.list.innerHTML = '';
      $('#craft-sub').innerHTML = this.equipped();
      for (const r of RECIPES.filter((x) => x.station === station)) {
        const owned = r.owned(s);
        const ok = canPay(r.cost, s.inv);
        this.item(r.name, `${r.desc}<br>${costHTML(r.cost, s.inv)}`, owned ? 'Feito' : ok ? 'Fabricar' : 'Faltam materiais', () => {
          if (owned || !canPay(r.cost, s.inv)) return;
          for (const [k, n] of Object.entries(r.cost)) s.inv[k] -= n;
          r.give(s);
          g.masks = s.masksMax;
          g.audio.play('pickup');
          g.input.vibrate(60);
          g.persist();
          g.ui.resetHud();
          g.ui.updateHud(g);
          g.build.refresh();
          this.render();
        }, owned || !ok);
      }
    });
  }

  heading(text) {
    const h = document.createElement('p');
    h.className = 'inv-head';
    h.textContent = text;
    this.list.appendChild(h);
  }

  // ── Inventário (estilo Terraria): armas, armadura, materiais e itens ──
  openInventory() {
    const g = this.game;
    this.open('Inventário', '', () => {
      const s = g.save;
      this.list.innerHTML = '';
      $('#craft-sub').innerHTML = this.equipped();
      this.heading('Armas');
      const owned = Object.keys(WEAPONS).filter((k) => ownsWeapon(s, k));
      for (const k of owned) {
        const w = WEAPONS[k], on = (s.weapon || 'errante') === k;
        const kind = w.kind === 'bow' ? 'Arco' : w.kind === 'staff' ? 'Cajado' : 'Corpo a corpo';
        this.item(`<span style="color:${RARITY[w.rarity].color}">${w.name}</span>`,
          `${w.desc}<br>${kind} · dano ${w.dmg}× · recarga ${(w.cd / 60).toFixed(2)}s · ${RARITY[w.rarity].name}`,
          on ? 'Equipada' : 'Equipar', () => {
            if (on) return;
            s.weapon = k;
            g.audio.play('ui');
            g.persist();
            this.render();
          }, on);
      }
      this.heading('Armadura');
      const a = ARMORS[s.armor || 'none'];
      this.item(a.name, a.hearts ? `+${a.hearts} coração${a.hearts > 1 ? 'ões' : ''}.` : 'Fabrique armaduras na bancada e na forja.', 'Equipada', () => {}, true);
      this.heading('Materiais');
      const mats = Object.entries(RESOURCES);
      const any = mats.some(([k]) => (s.inv[k] || 0) > 0);
      for (const [k, r] of mats) this.item(`<i class="mat-dot" style="background:${r.color}"></i>${r.name}`, r.desc || 'Material de construção e fabricação.', String(s.inv[k] || 0), () => {}, true);
      if (!any) { const p = document.createElement('p'); p.className = 'si-desc'; p.textContent = 'Quebre árvores, pedras e minérios para coletar.'; this.list.appendChild(p); }
      const items = [s.items.lantern ? ['Lanterna', 'Ilumina bosques e cavernas escuras.'] : null].filter(Boolean);
      if (items.length) { this.heading('Itens'); for (const [n, d] of items) this.item(n, d, 'Possui', () => {}, true); }
      this.heading('Atalhos');
      this.item('Amuletos', 'Equipe até 3 (descansando numa fogueira).', 'Abrir', () => { this.close(); this.openCharms(); });
    });
  }

  // ── Viagem rápida entre fogueiras já visitadas ──
  openTravel() {
    const g = this.game;
    this.open('Viajar', 'As brasas se lembram umas das outras. Escolha uma fogueira onde você já descansou.', () => {
      this.list.innerHTML = '';
      const dest = Object.keys(g.save.brasas).map((k) => ({ k, b: g.benchFromKey(k) })).filter((d) => d.b && d.b.room.id !== g.room.id)
        .sort((a, b) => (a.b.room.x - b.b.room.x) || (a.b.room.y - b.b.room.y));
      for (const d of dest) this.item(d.b.room.name, AREAS[d.b.room.area].name, 'Viajar', () => { this.close(); g.travelTo(d.k); });
      if (!dest.length) { const p = document.createElement('p'); p.className = 'si-desc'; p.textContent = 'Nenhuma outra fogueira conhecida ainda.'; this.list.appendChild(p); }
    });
  }

  // ── Oren vende mapas das regiões ──
  openMaps() {
    const g = this.game;
    this.open('Mapas do Oren', 'Cada mapa revela o desenho das salas da região no seu mapa. Falta preencher o resto andando por lá.', () => {
      const s = g.save;
      this.list.innerHTML = '';
      $('#craft-sub').innerHTML = `Moedas: <b>${s.geo}</b>`;
      for (const [area, price] of Object.entries(MAP_PRICES)) {
        const has = !!s.maps[area];
        const ok = s.geo >= price;
        this.item(`Mapa: ${AREAS[area].name}`, AREAS[area].subtitle, has ? 'Comprado' : `${price} moedas`, () => {
          if (has || !ok) return;
          s.geo -= price;
          s.maps[area] = true;
          g.audio.play('pickup');
          g.persist();
          g.ui.resetHud();
          g.ui.updateHud(g);
          this.render();
        }, has || !ok);
      }
    });
  }

  // ── Baú: guarda materiais ──
  openChest(key) {
    const g = this.game;
    this.open('Baú', 'Guarde materiais para não perdê-los de vista.', () => {
      const s = g.save;
      const box = (s.chests[key] = s.chests[key] || {});
      this.list.innerHTML = '';
      for (const [k, r] of Object.entries(RESOURCES)) {
        const inBag = s.inv[k] || 0, inBox = box[k] || 0;
        this.item(r.name, `Mochila: ${inBag} · Baú: ${inBox}`, inBag ? 'Guardar tudo' : inBox ? 'Pegar tudo' : '—', () => {
          if (s.inv[k]) { box[k] = (box[k] || 0) + s.inv[k]; s.inv[k] = 0; }
          else if (box[k]) { s.inv[k] = box[k]; box[k] = 0; }
          g.audio.play('place');
          g.persist();
          g.build.refresh();
          this.render();
        }, !inBag && !inBox);
      }
    });
  }

  // ── Amuletos: até 3 equipados; só se troca descansando numa fogueira ──
  openCharms() {
    const g = this.game;
    this.open('Amuletos', '', () => {
      const s = g.save, ch = s.charms;
      const canSwap = g.player.sitting;
      this.list.innerHTML = '';
      $('#craft-sub').innerHTML = `<span class="charm-slots">Equipados: <b>${ch.equipped.length}/${CHARM_SLOTS}</b></span><br>${canSwap ? 'Descansando: você pode trocar.' : 'Descanse numa fogueira para trocar de amuleto.'}`;
      const owned = Object.keys(CHARMS).filter((k) => ch.owned[k]);
      if (!owned.length) {
        const p = document.createElement('p');
        p.className = 'si-desc';
        p.textContent = 'Nenhum amuleto ainda. Procure nos Jardins Submersos, vença desafios ou compre com a Mira.';
        this.list.appendChild(p);
      }
      for (const k of owned) {
        const c = CHARMS[k], on = ch.equipped.includes(k);
        const full = !on && ch.equipped.length >= CHARM_SLOTS;
        this.item(`<span class="charm-dot" style="background:${c.color}">${c.icon}</span>${c.name}`, c.desc, on ? 'Equipado' : full ? 'Cheio' : 'Equipar', () => {
          if (!canSwap) return;
          if (ch.equipped.includes(k)) {
            ch.equipped = ch.equipped.filter((x) => x !== k);
            if (k === 'pele_pedra') s.masksMax -= 1;
          } else if (ch.equipped.length < CHARM_SLOTS) {
            ch.equipped.push(k);
            if (k === 'pele_pedra') s.masksMax += 1;
          } else return;
          g.masks = s.masksMax; // descansando: vida cheia
          g.audio.play('ui');
          g.persist();
          g.ui.resetHud();
          g.ui.updateHud(g);
          this.render();
        }, !canSwap || (full && !on));
      }
    });
  }

  // ── Tibério vende materiais por moedas ──
  openSmith() {
    const g = this.game;
    this.open('Tibério, o Ferreiro', 'Materiais frescos, direto da minha carroça.', () => {
      const s = g.save;
      this.list.innerHTML = '';
      $('#craft-sub').innerHTML = `Suas moedas: <b>${s.geo}</b>`;
      for (const it of SMITH_STOCK) {
        const r = RESOURCES[it.kind];
        this.item(`${it.n} ${r.name}`, `Você tem ${s.inv[it.kind] || 0}`, `◆ ${it.price}`, () => {
          if (s.geo < it.price) return;
          s.geo -= it.price;
          s.inv[it.kind] = (s.inv[it.kind] || 0) + it.n;
          g.audio.play('geo');
          g.persist();
          g.ui.updateHud(g);
          g.build.refresh();
          this.render();
        }, s.geo < it.price);
      }
    });
  }
}
