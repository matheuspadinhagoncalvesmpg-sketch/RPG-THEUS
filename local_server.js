/**
 * ===================================================================
 * SERVIDOR LOCAL (MODO SOLO) - roda dentro do navegador
 * Imita o server.js (WebSocket) para o jogo funcionar sem Node.js:
 * celular, GitHub Pages, offline. Mesma "API" de mensagens.
 * ===================================================================
 */
(function () {
  const NPC_LINES = {
    jake: [
      "Matemático, irmão! O dia tá bonito pra chutar uns monstros!",
      "Caramba, mano! Nada que um sanduíche perfeito não resolva!",
      "Pode crer, cara! Vamos nessa que a aventura não espera ninguém!"
    ],
    bmo: [
      "Beep boop! Quem quer jogar videogame comigo hoje?!",
      "Yay! Eu sou o BMO e você é muito legal!",
      "Alerta de aventura! BMO pronto para a missão!"
    ],
    bubblegum: [
      "Pela ciência dos doces! Precisamos defender o reino das anomalias!",
      "Fascinante! Suas habilidades serão muito úteis para o Reino Doce."
    ],
    iceking: [
      "Gunther, pare de me desobedecer! O que vocês querem no meu reino gelado?!",
      "Alguém me chamou? Eu só queria um amigo pra tocar bateria!"
    ],
    marceline: [
      "Tá com medo do escuro? Eu adoro. Mas cuidado com os fantasmas da floresta.",
      "Quer uma dica? Dreno de vida é o melhor remédio. Rock 'n roll!"
    ]
  };

  const ITEM_PREFIXES = [
    { name: "Flamejante", atk: 5 },
    { name: "Gélido", atk: 4, hp: 10 },
    { name: "Cósmico", atk: 12, mp: 15 },
    { name: "Doce", hp: 20, mp: 10 },
    { name: "Matemático", atk: 8 },
    { name: "Vampírico", atk: 7, hp: 15 },
    { name: "Ancestral de Ooo", atk: 10, hp: 25 }
  ];
  const ITEM_BASES = [
    { type: 'weapon', name: 'Espada de Cristal', icon: '🗡️' },
    { type: 'weapon', name: 'Lâmina Escarlate', icon: '⚔️' },
    { type: 'weapon', name: 'Cajado de Chiclete', icon: '🪄' },
    { type: 'weapon', name: 'Orbe das Estrelas', icon: '🔮' },
    { type: 'weapon', name: 'Arco de Videira', icon: '🏹' },
    { type: 'weapon', name: 'Baixo-Machado', icon: '🎸' },
    { type: 'relic', name: 'Amuleto de Billy', icon: '📿' },
    { type: 'relic', name: 'Coroa de Balinha', icon: '👑' },
    { type: 'relic', name: 'Mochila Estelar', icon: '🎒' }
  ];
  const RARITIES = [
    { key: 'common', label: 'Comum', mult: 1.0, color: '#94a3b8', chance: 0.50 },
    { key: 'rare', label: 'Raro', mult: 1.5, color: '#38bdf8', chance: 0.30 },
    { key: 'epic', label: 'Épico', mult: 2.2, color: '#a855f7', chance: 0.15 },
    { key: 'legendary', label: 'Lendário', mult: 3.2, color: '#f59e0b', chance: 0.04 },
    { key: 'cosmic', label: 'Cósmico', mult: 4.5, color: '#ec4899', chance: 0.01 }
  ];

  const rnd = (a, b) => a + Math.random() * (b - a);

  class LocalServer {
    constructor() {
      this.readyState = 1; // igual a WebSocket.OPEN
      this.onmessage = null;
      this.onclose = null;
      this.isLocal = true;

      this.playerId = 'player_local';
      this.player = null;
      this.floor = 0;
      this.nextId = 1;
      this.nextItem = 1000;
      this.monsters = [];
      this.chests = [];
      this.drops = new Map();
      this.dungeons = new Map();
      this.respawnQueue = [];

      this.initWorld();
      this.timer = setInterval(() => this.tick(0.1), 100);
    }

    // ---------- infra ----------
    send(raw) {
      let data;
      try { data = JSON.parse(raw); } catch (e) { return; }
      this.handle(data);
    }

    emit(msg) {
      if (this.onmessage) this.onmessage({ data: JSON.stringify(msg) });
    }

    close() {
      clearInterval(this.timer);
      this.readyState = 3;
    }

    // ---------- mundo ----------
    spawn(type, x, y) {
      const T = {
        slime: { name: 'Slime de Doce', hp: 40, atk: 6, spd: 1.4, exp: 15, gold: 5, color: '#ec4899' },
        mushroom: { name: 'Cogumelo Saltitante', hp: 50, atk: 8, spd: 1.8, exp: 20, gold: 8 },
        skeleton: { name: 'Esqueleto Guardião', hp: 75, atk: 12, spd: 2.0, exp: 35, gold: 15 },
        ghost: { name: 'Fantasma da Floresta', hp: 60, atk: 11, spd: 2.1, exp: 30, gold: 12 },
        icegolem: { name: 'Golem de Gelo', hp: 130, atk: 16, spd: 1.2, exp: 55, gold: 25 }
      }[type];
      const m = {
        id: this.nextId++, type, name: T.name, x, y,
        hp: T.hp, maxHp: T.hp, atk: T.atk, spd: T.spd,
        expReward: T.exp, goldReward: T.gold, color: T.color,
        homeX: x, homeY: y
      };
      this.monsters.push(m);
      return m;
    }

    initWorld() {
      this.monsters = [];
      for (let i = 0; i < 18; i++) this.spawn('slime', rnd(600, 1800), rnd(400, 1300));
      for (let i = 0; i < 10; i++) this.spawn('mushroom', rnd(800, 1900), rnd(300, 1100));
      for (let i = 0; i < 8; i++) this.spawn('skeleton', rnd(1600, 2200), rnd(1000, 1400));
      // Novos biomas
      for (let i = 0; i < 12; i++) this.spawn('ghost', rnd(150, 2200), rnd(1450, 1720));
      for (let i = 0; i < 8; i++) this.spawn('icegolem', rnd(1800, 2300), rnd(120, 900));

      const boss = {
        id: this.nextId++, type: 'boss', isBoss: true, name: 'Rei Gelatina Doce',
        x: 1700, y: 280, homeX: 1700, homeY: 280, scale: 3.5,
        hp: 350, maxHp: 350, atk: 18, spd: 1.2, expReward: 200, goldReward: 150
      };
      this.monsters.push(boss);

      this.chests = [
        { id: 1, x: 550, y: 500, opened: false, gold: 35, potion: 1 },
        { id: 2, x: 1200, y: 700, opened: false, gold: 60, potion: 2 },
        { id: 3, x: 1800, y: 350, opened: false, gold: 100, potion: 2 },
        { id: 4, x: 1500, y: 1300, opened: false, gold: 120, potion: 3 },
        { id: 5, x: 400, y: 1600, opened: false, gold: 140, potion: 2 },
        { id: 6, x: 2150, y: 200, opened: false, gold: 160, potion: 3 }
      ];
    }

    list() {
      return this.floor === 0 ? this.monsters : (this.dungeons.get(this.floor)?.monsters || []);
    }

    // ---------- itens ----------
    makeItem(level = 1) {
      const roll = Math.random();
      let acc = 0, rar = RARITIES[0];
      for (const r of RARITIES) { acc += r.chance; if (roll <= acc) { rar = r; break; } }
      const pre = ITEM_PREFIXES[Math.floor(Math.random() * ITEM_PREFIXES.length)];
      const base = ITEM_BASES[Math.floor(Math.random() * ITEM_BASES.length)];
      const scale = 1 + (level - 1) * 0.15;
      return {
        id: 'item_' + (this.nextItem++),
        name: `${base.name} ${pre.name}`,
        type: base.type, icon: base.icon,
        rarity: rar.key, rarityLabel: rar.label, rarityColor: rar.color,
        bonusAtk: Math.round(((pre.atk || 0) + (base.type === 'weapon' ? 4 : 1)) * rar.mult * scale),
        bonusHp: Math.round(((pre.hp || 0) + (base.type === 'relic' ? 15 : 0)) * rar.mult * scale),
        bonusMp: Math.round(((pre.mp || 0) + 5) * rar.mult * scale),
        levelReq: level
      };
    }

    dropItem(x, y, level) {
      const item = this.makeItem(level);
      const drop = { id: item.id, x, y, floor: this.floor, item };
      this.drops.set(drop.id, drop);
      this.emit({ type: 'item_dropped', drop });
    }

    // ---------- dungeon ----------
    makeDungeon(floor) {
      const width = 1800, height = 1400;
      const roomCount = 6 + Math.min(10, floor * 2);
      const rooms = [];
      for (let i = 0; i < roomCount; i++) {
        const rw = 180 + Math.random() * 140, rh = 160 + Math.random() * 120;
        const rx = 100 + Math.random() * (width - rw - 200);
        const ry = 100 + Math.random() * (height - rh - 200);
        rooms.push({
          id: i, x: rx, y: ry, w: rw, h: rh,
          centerX: rx + rw / 2, centerY: ry + rh / 2,
          isBossRoom: i === roomCount - 1, isStartRoom: i === 0
        });
      }
      const monsters = [];
      let id = 5000 + floor * 100;
      rooms.forEach(r => {
        if (r.isStartRoom) return;
        if (r.isBossRoom) {
          const lich = floor >= 3 && floor % 3 === 0;
          const hp = (lich ? 500 : 300) + floor * 120;
          monsters.push({
            id: id++, type: 'boss', isBoss: true,
            name: lich ? `O Temível Lich Cósmico (Andar ${floor})` : `Guardião das Sombras (Andar ${floor})`,
            x: r.centerX, y: r.centerY, homeX: r.centerX, homeY: r.centerY,
            scale: lich ? 4.2 : 3.8, hp, maxHp: hp,
            atk: (lich ? 26 : 16) + floor * 4, spd: 1.3,
            expReward: (lich ? 350 : 180) + floor * 60,
            goldReward: (lich ? 250 : 120) + floor * 40,
            color: lich ? '#16a34a' : '#7c3aed'
          });
        } else {
          const n = 2 + Math.floor(Math.random() * 3);
          for (let k = 0; k < n; k++) {
            const roll = Math.random();
            const type = roll < 0.4 ? 'skeleton' : roll < 0.75 ? 'slime' : 'ghost';
            const hp = 40 + floor * 15;
            const x = r.x + 30 + Math.random() * (r.w - 60);
            const y = r.y + 30 + Math.random() * (r.h - 60);
            monsters.push({
              id: id++, type,
              name: type === 'skeleton' ? `Esqueleto do Andar ${floor}` : type === 'ghost' ? 'Espectro Cósmico' : 'Gelatina Negra',
              x, y, homeX: x, homeY: y, hp, maxHp: hp,
              atk: 8 + floor * 2, spd: 1.5,
              expReward: 25 + floor * 10, goldReward: 10 + floor * 5,
              color: type === 'slime' ? '#3b0764' : '#f8fafc'
            });
          }
        }
      });
      const boss = rooms[rooms.length - 1];
      return {
        floor, width, height, rooms,
        spawnPoint: { x: rooms[0].centerX, y: rooms[0].centerY },
        exitPortal: { x: boss.centerX - 60, y: boss.centerY - 60 },
        monsters,
        chests: [{
          id: 9000 + floor, x: boss.centerX + 50, y: boss.centerY + 50,
          opened: false, gold: 150 + floor * 50, potion: 3
        }]
      };
    }

    // ---------- mensagens do cliente ----------
    handle(d) {
      switch (d.type) {
        case 'join': {
          this.player = {
            id: this.playerId, x: 350, y: 350, hp: d.hp, level: d.level || 1,
            profile: d.profile, currentFloor: 0
          };
          setTimeout(() => this.emit({
            type: 'init_world', selfId: this.playerId,
            players: [this.player], monsters: this.monsters,
            chests: this.chests, drops: Array.from(this.drops.values())
          }), 0);
          break;
        }
        case 'update_state': {
          if (this.player) Object.assign(this.player, { x: d.x, y: d.y, hp: d.hp, level: d.level });
          break;
        }
        case 'monster_damage': {
          const m = this.list().find(x => x.id === d.monsterId);
          if (!m || m.hp <= 0) break;
          m.hp = Math.max(0, m.hp - d.damage);
          this.emit({ type: 'monster_damaged', monsterId: m.id, damage: d.damage, hp: m.hp, isCrit: d.isCrit });
          if (m.hp <= 0) {
            if (Math.random() < 0.55 || m.isBoss) this.dropItem(m.x, m.y, this.floor + 1);
            this.emit({
              type: 'monster_killed', monsterId: m.id, isBoss: !!m.isBoss, monsterType: m.type,
              expReward: m.expReward, goldReward: m.goldReward,
              killerName: d.killerName, killerId: this.playerId
            });
            // remove do vetor e agenda renascimento (mundo aberto)
            const arr = this.list();
            const idx = arr.indexOf(m);
            if (idx !== -1) arr.splice(idx, 1);
            if (this.floor === 0 && !m.isBoss) {
              this.respawnQueue.push({ type: m.type, x: m.homeX, y: m.homeY, t: 25 });
            } else if (this.floor === 0 && m.isBoss) {
              this.respawnQueue.push({ type: 'boss', x: m.homeX, y: m.homeY, t: 180 });
            }
          }
          break;
        }
        case 'pick_item': {
          const drop = this.drops.get(d.itemId);
          if (drop) {
            this.drops.delete(d.itemId);
            this.emit({ type: 'item_picked', itemId: drop.id, pickerId: this.playerId, pickerName: d.playerName, item: drop.item });
          }
          break;
        }
        case 'enter_dungeon': {
          const floor = d.floor || 1;
          if (!this.dungeons.has(floor)) this.dungeons.set(floor, this.makeDungeon(floor));
          this.floor = floor;
          if (this.player) this.player.currentFloor = floor;
          this.emit({ type: 'dungeon_loaded', dungeon: this.dungeons.get(floor) });
          break;
        }
        case 'exit_dungeon': {
          this.floor = 0;
          if (this.player) this.player.currentFloor = 0;
          this.emit({ type: 'return_to_surface', monsters: this.monsters });
          break;
        }
        case 'open_chest': {
          const list = this.floor === 0 ? this.chests : (this.dungeons.get(this.floor)?.chests || []);
          const ch = list.find(c => c.id === d.chestId);
          if (ch && !ch.opened) {
            ch.opened = true;
            this.dropItem(ch.x + 20, ch.y + 20, this.floor + 2);
          }
          break;
        }
        case 'chat_message': {
          const text = String(d.text || '').substring(0, 80).trim();
          if (!text || !this.player) break;
          this.emit({ type: 'player_chat', id: this.playerId, name: this.player.profile.name, text });
          this.npcReply(text);
          break;
        }
      }
    }

    npcReply(text) {
      const npcs = [
        { id: 1, name: 'Jake o Cão', role: 'jake', x: 420, y: 350, keys: ['jake'] },
        { id: 2, name: 'BMO', role: 'bmo', x: 270, y: 360, keys: ['bmo'] },
        { id: 3, name: 'Princesa Jujuba', role: 'bubblegum', x: 1100, y: 220, keys: ['jujuba', 'princesa'] },
        { id: 4, name: 'Rei Gelado', role: 'iceking', x: 1900, y: 750, keys: ['gelado', 'rei'] },
        { id: 5, name: 'Marceline', role: 'marceline', x: 620, y: 260, keys: ['marceline'] }
      ];
      const low = text.toLowerCase();
      const p = this.player;
      const npc = npcs.find(n => low.includes(n.name.toLowerCase()) || n.keys.some(k => low.includes(k)))
        || npcs.find(n => this.floor === 0 && Math.hypot(p.x - n.x, p.y - n.y) < 120);
      if (!npc) return;
      const lines = NPC_LINES[npc.role];
      setTimeout(() => this.emit({
        type: 'npc_ai_speech', npcId: npc.id, npcName: npc.name,
        text: lines[Math.floor(Math.random() * lines.length)]
      }), 500);
    }

    // ---------- loop do mundo ----------
    tick(dt) {
      // renascimento dos monstros
      for (let i = this.respawnQueue.length - 1; i >= 0; i--) {
        const r = this.respawnQueue[i];
        r.t -= dt;
        if (r.t <= 0) {
          this.respawnQueue.splice(i, 1);
          let nm;
          if (r.type === 'boss') {
            nm = {
              id: this.nextId++, type: 'boss', isBoss: true, name: 'Rei Gelatina Doce',
              x: r.x, y: r.y, homeX: r.x, homeY: r.y, scale: 3.5,
              hp: 350, maxHp: 350, atk: 18, spd: 1.2, expReward: 200, goldReward: 150
            };
            this.monsters.push(nm);
          } else {
            nm = this.spawn(r.type, r.x, r.y);
          }
          if (this.floor === 0) this.emit({ type: 'monster_spawned', monster: nm });
        }
      }

      if (!this.player) return;
      const p = this.player;
      const arr = this.list();

      arr.forEach(m => {
        if (m.hp <= 0) return;
        const d = Math.hypot(p.x - m.x, p.y - m.y);
        const agro = m.isBoss ? 450 : 250;
        if (d < agro && d > 20) {
          const lowHp = !m.isBoss && m.hp < m.maxHp * 0.25;
          const f = lowHp ? -1.2 : 1.0;
          m.x += ((p.x - m.x) / d) * m.spd * 2.2 * f;
          m.y += ((p.y - m.y) / d) * m.spd * 2.2 * f;
        } else if (d >= agro && m.homeX !== undefined) {
          // volta devagar para casa e regenera
          const hd = Math.hypot(m.homeX - m.x, m.homeY - m.y);
          if (hd > 8) {
            m.x += ((m.homeX - m.x) / hd) * m.spd * 0.8;
            m.y += ((m.homeY - m.y) / hd) * m.spd * 0.8;
          }
          if (m.hp < m.maxHp) m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.01);
        }
      });

      this.emit({
        type: 'sync_monsters',
        monsters: arr.map(m => ({ id: m.id, x: Math.round(m.x), y: Math.round(m.y), hp: Math.round(m.hp) }))
      });
    }
  }

  window.LocalServer = LocalServer;
})();
