// Painéis de fabricação (bancada/forja), baú e loja do ferreiro.
import { RECIPES, RESOURCES, SMITH_STOCK, WEAPONS, ARMORS, CHARMS, CHARM_SLOTS } from './config.js';

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
