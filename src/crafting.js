// Painéis de menu: inventário, lojas dos NPCs, diário, viagem rápida, mapas e amuletos.
import { MEMORIAS, TIPOS, REINOS, MEMORIAS_POR_REINO } from './memorias.js';
import { LOJAS } from './lojas.js';
import { RESOURCES, WEAPONS, ARMORS, CHARMS, CHARM_SLOTS, RARITY, ownsWeapon, AREAS, FRAGMENTS_PER_HEART, giveWeapon, equipArmor, materialsWorth, payWithMaterials } from './config.js';

const $ = (s) => document.querySelector(s);

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
      $('#craft-sub').innerHTML = this.equipped() + `<br>Fragmentos de Vida: <b>${s.fragments || 0}/${FRAGMENTS_PER_HEART}</b> · Corações: <b>${s.masksMax}</b>`;
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
      this.item(a.name, a.hearts ? `+${a.hearts} coração${a.hearts > 1 ? 'ões' : ''}.` : 'Compre armaduras dos mineiros e ferreiros.', 'Equipada', () => {}, true);
      this.heading(`Materiais · valem ${materialsWorth(s.inv)} moedas nas trocas`);
      const mats = Object.entries(RESOURCES);
      const any = mats.some(([k]) => (s.inv[k] || 0) > 0);
      for (const [k, r] of mats) this.item(`<i class="mat-dot" style="background:${r.color}"></i>${r.name}`, r.desc, String(s.inv[k] || 0), () => {}, true);
      if (!any) { const p = document.createElement('p'); p.className = 'si-desc'; p.textContent = 'Quebre árvores, pedras e minérios: os NPCs trocam por mercadorias.'; this.list.appendChild(p); }
      const items = [s.items.lantern ? ['Lanterna', 'Ilumina bosques e cavernas escuras.'] : null].filter(Boolean);
      if (items.length) { this.heading('Itens'); for (const [n, d] of items) this.item(n, d, 'Possui', () => {}, true); }
      this.heading('Atalhos');
      this.item('Amuletos', 'Equipe até 3 (descansando numa fogueira).', 'Abrir', () => { this.close(); this.openCharms(); });
    });
  }

  // ── Lojas dos NPCs: pague com moedas ou com materiais (cada material vale uma quantia) ──
  openNpcShop(id) {
    const g = this.game, loja = LOJAS[id];
    if (!loja) return;
    this.payMode = 'geo';
    this.open(loja.titulo, loja.sub, () => {
      const s = g.save, porMat = this.payMode === 'mat';
      this.list.innerHTML = '';
      $('#craft-sub').innerHTML = `${loja.sub}<br>Moedas: <b>${s.geo}</b> · Materiais: <b>${materialsWorth(s.inv)}</b> em valor`;
      this.item('Forma de pagamento', 'Os NPCs aceitam moedas ou materiais (madeira, pedra, minério, cristal).', porMat ? 'Materiais' : 'Moedas', () => {
        this.payMode = porMat ? 'geo' : 'mat';
        this.render();
      });
      for (const it of loja.itens) this.shopRow(it, porMat);
    });
  }

  // Uma mercadoria da loja: descreve, mostra o preço e faz a compra.
  shopRow(it, porMat) {
    const g = this.game, s = g.save;
    let nome, desc, tem = false, aplicar;
    if (it.tipo === 'arma') {
      const w = WEAPONS[it.id]; tem = ownsWeapon(s, it.id);
      nome = `<span style="color:${RARITY[w.rarity].color}">${w.name}</span>`; desc = `${w.desc} (dano ${w.dmg}×)`;
      aplicar = () => { giveWeapon(s, it.id); };
    } else if (it.tipo === 'armadura') {
      const a = ARMORS[it.id]; tem = ARMORS[s.armor || 'none'].hearts >= a.hearts;
      nome = a.name; desc = `+${a.hearts} coração${a.hearts > 1 ? 'ões' : ''}.`;
      aplicar = () => { equipArmor(s, it.id); g.masks = s.masksMax; };
    } else if (it.tipo === 'amuleto') {
      const c = CHARMS[it.id]; tem = !!s.charms.owned[it.id];
      nome = `<span class="charm-dot" style="background:${c.color}">${c.icon}</span>${c.name}`; desc = c.desc;
      aplicar = () => { s.charms.owned[it.id] = true; };
    } else if (it.tipo === 'lanterna') {
      tem = !!s.items.lantern; nome = 'Lanterna'; desc = 'Ilumina bosques e cavernas escuras.';
      aplicar = () => { s.items.lantern = true; };
    } else if (it.tipo === 'mapa') {
      const a = AREAS[it.id]; tem = !!s.maps[it.id];
      nome = `Mapa: ${a.name}`; desc = a.subtitle;
      aplicar = () => { s.maps[it.id] = true; };
    } else if (it.tipo === 'melhoria') {
      tem = !!s.bought[it.id]; nome = it.nome; desc = it.desc;
      aplicar = () => { s.bought[it.id] = true; it.aplicar(s); g.masks = s.masksMax; };
    } else {
      // Pista: aponta uma Memória do reino que o herói ainda não leu.
      const faltam = Object.keys(MEMORIAS).filter((k) => MEMORIAS[k].regiao === it.reino && !s.memorias[k]);
      nome = `Pista: ${REINOS[it.reino].nome}`; tem = !faltam.length;
      desc = tem ? 'Você já leu tudo deste reino.' : `Ainda há ${faltam.length} Memória${faltam.length > 1 ? 's' : ''} por ler neste reino.`;
      aplicar = () => {
        const sala = g.world.rooms.find((r) => r.lore.includes(faltam[0]) || r.baus.includes(faltam[0]));
        g.ui.toast(`Procure em: ${sala ? sala.name : REINOS[it.reino].nome}`, 5000);
      };
    }
    const ok = porMat ? materialsWorth(s.inv) >= it.preco : s.geo >= it.preco;
    const preco = tem ? (it.tipo === 'pista' ? 'Completo' : 'Possui') : porMat ? `${it.preco} em materiais` : `${it.preco} moedas`;
    this.item(nome, desc, preco, () => {
      if (tem || !ok) return;
      if (porMat) {
        const dado = payWithMaterials(s.inv, it.preco);
        if (!dado) return;
        g.ui.toast(`Você entregou: ${dado}`, 2600);
      } else s.geo -= it.preco;
      aplicar();
      g.audio.play('pickup');
      g.persist();
      g.ui.resetHud();
      g.ui.updateHud(g);
      this.render();
    }, tem || !ok);
  }

  // ── Diário do Errante: todas as Memórias já lidas, por reino ──
  openDiario() {
    const g = this.game;
    this.open('Diário do Errante', 'Releia o que você encontrou. Cada reino guarda um pedaço da verdade.', () => {
      const s = g.save;
      this.list.innerHTML = '';
      const lidas = Object.keys(s.memorias).length, total = Object.keys(MEMORIAS).length;
      $('#craft-sub').innerHTML = `Memórias: <b>${lidas}/${total}</b> · A cada 6, um Fragmento de Vida`;
      for (const [reino, info] of Object.entries(REINOS)) {
        const ids = Object.keys(MEMORIAS).filter((k) => MEMORIAS[k].regiao === reino);
        const feitas = ids.filter((k) => s.memorias[k]);
        const h = document.createElement('p');
        h.className = 'inv-head';
        h.style.color = info.cor;
        h.textContent = `${info.nome} · ${feitas.length}/${MEMORIAS_POR_REINO[reino]}`;
        this.list.appendChild(h);
        for (const k of feitas) {
          const m = MEMORIAS[k], t = TIPOS[m.tipo];
          this.item(`<span style="color:${t.cor}">${t.nome}</span> · ${m.titulo}`, m.linhas[0].slice(0, 90) + (m.linhas[0].length > 90 ? '…' : ''), 'Reler', () => { this.close(); g.lerMemoria(k); });
        }
        if (!feitas.length) { const p = document.createElement('p'); p.className = 'si-desc'; p.textContent = 'Nada lido neste reino ainda.'; this.list.appendChild(p); }
      }
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
}
