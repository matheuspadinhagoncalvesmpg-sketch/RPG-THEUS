/**
 * ===================================================================
 * HORA DA AVENTURA: CRÔNICAS DE OOO - SERVIDOR MULTIPLAYER + IA
 * Node.js HTTP + WebSocket + Google Gemini AI + Dungeons & Itens
 * ===================================================================
 */

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const ai = require('./ai_engine.js');

const PORT = process.env.PORT || 3000;

// ===================================================================
// 1. SERVIDOR DE ARQUIVOS ESTÁTICOS HTTP
// ===================================================================
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/') reqUrl = '/index.html';

  const filePath = path.join(__dirname, reqUrl);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Não Encontrado na Terra de Ooo');
      } else {
        res.writeHead(500);
        res.end(`Erro no servidor: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// ===================================================================
// 2. ESTADO DO MUNDO PRINCIPAL (OOO)
// ===================================================================
const players = new Map(); // id -> playerData
const worldDrops = new Map(); // itemId -> itemData com { id, x, y, item, floor }
const dungeonFloors = new Map(); // floorNumber -> dungeonData

// Inicialização dos Monstros Principais de Ooo
let monsters = [];
let monsterCounter = 1;

function initMainWorldMonsters() {
  monsters = [];
  // Slimes doces
  for (let i = 0; i < 18; i++) {
    monsters.push({
      id: monsterCounter++,
      type: 'slime',
      name: 'Slime de Doce',
      x: 600 + Math.random() * 1200,
      y: 400 + Math.random() * 900,
      hp: 40,
      maxHp: 40,
      atk: 6,
      spd: 1.4,
      color: '#ec4899',
      expReward: 15,
      goldReward: 5
    });
  }

  // Cogumelos
  for (let i = 0; i < 10; i++) {
    monsters.push({
      id: monsterCounter++,
      type: 'mushroom',
      name: 'Cogumelo Saltitante',
      x: 800 + Math.random() * 1100,
      y: 300 + Math.random() * 800,
      hp: 50,
      maxHp: 50,
      atk: 8,
      spd: 1.8,
      expReward: 20,
      goldReward: 8
    });
  }

  // Esqueletos
  for (let i = 0; i < 8; i++) {
    monsters.push({
      id: monsterCounter++,
      type: 'skeleton',
      name: 'Esqueleto Guardião',
      x: 1600 + Math.random() * 600,
      y: 600 + Math.random() * 800,
      hp: 75,
      maxHp: 75,
      atk: 12,
      spd: 2.0,
      expReward: 35,
      goldReward: 15
    });
  }

  // Chefão: O Rei Gelatina Doce
  monsters.push({
    id: monsterCounter++,
    type: 'boss',
    isBoss: true,
    name: 'Rei Gelatina Doce',
    x: 1700,
    y: 280,
    scale: 3.5,
    hp: 350,
    maxHp: 350,
    atk: 18,
    spd: 1.2,
    expReward: 200,
    goldReward: 150
  });
}

initMainWorldMonsters();

// NPCs com posições e papéis para a IA
const npcs = [
  { id: 1, name: "Jake o Cão", role: "jake", x: 420, y: 350 },
  { id: 2, name: "BMO", role: "bmo", x: 270, y: 360 },
  { id: 3, name: "Princesa Jujuba", role: "bubblegum", x: 1100, y: 220 },
  { id: 4, name: "Rei Gelado", role: "iceking", x: 1900, y: 750 }
];

// Portal Cósmico para a Dungeon Infinita
const cosmicPortal = {
  x: 950,
  y: 380,
  target: 'dungeon',
  label: 'Portal Cósmico da Dungeon'
};

// Baús de tesouro
const chests = [
  { id: 1, x: 550, y: 500, opened: false, gold: 35, potion: 1 },
  { id: 2, x: 1200, y: 700, opened: false, gold: 60, potion: 2 },
  { id: 3, x: 1800, y: 350, opened: false, gold: 100, potion: 2 },
  { id: 4, x: 1500, y: 1300, opened: false, gold: 120, potion: 3 }
];

// ===================================================================
// 3. SERVIDOR WEBSOCKET
// ===================================================================
const wss = new WebSocketServer({ server });
let nextPlayerId = 1;

function broadcast(data, excludeWs = null) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1 && client !== excludeWs) {
      client.send(msg);
    }
  });
}

function broadcastToFloor(data, floor, excludeWs = null) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1 && client !== excludeWs && client.currentFloor === floor) {
      client.send(msg);
    }
  });
}

wss.on('connection', (ws) => {
  const playerId = 'player_' + (nextPlayerId++);
  ws.playerId = playerId;
  ws.currentFloor = 0; // 0 = Mundo Superior (Ooo), 1+ = Dungeons

  ws.on('message', async (raw) => {
    try {
      const data = JSON.parse(raw);

      switch (data.type) {
        // 1. Entrada do jogador
        case 'join': {
          const newPlayer = {
            id: playerId,
            x: 350 + (Math.random() * 60 - 30),
            y: 350 + (Math.random() * 60 - 30),
            facing: 'down',
            isMoving: false,
            animFrame: 0,
            isAttacking: false,
            profile: data.profile,
            hp: data.hp,
            maxHp: data.maxHp,
            mp: data.mp,
            maxMp: data.maxMp,
            level: data.level || 1,
            currentFloor: 0,
            equippedItem: null
          };
          players.set(playerId, newPlayer);

          // Envia dados do mundo, drops existentes e NPCs
          ws.send(JSON.stringify({
            type: 'init_world',
            selfId: playerId,
            players: Array.from(players.values()),
            monsters: monsters,
            chests: chests,
            npcs: npcs,
            portal: cosmicPortal,
            drops: Array.from(worldDrops.values())
          }));

          broadcast({
            type: 'player_joined',
            player: newPlayer
          }, ws);

          broadcast({
            type: 'system_chat',
            text: `✨ ${newPlayer.profile.name} entrou na Terra de Ooo!`
          });
          break;
        }

        // 2. Movimentação
        case 'update_state': {
          const p = players.get(playerId);
          if (p) {
            p.x = data.x;
            p.y = data.y;
            p.facing = data.facing;
            p.isMoving = data.isMoving;
            p.animFrame = data.animFrame;
            p.hp = data.hp;
            p.level = data.level;

            broadcast({
              type: 'player_moved',
              id: playerId,
              x: p.x,
              y: p.y,
              facing: p.facing,
              isMoving: p.isMoving,
              animFrame: p.animFrame,
              hp: p.hp,
              level: p.level,
              currentFloor: p.currentFloor
            }, ws);
          }
          break;
        }

        // 3. Ataque
        case 'attack_action': {
          broadcast({
            type: 'player_attacked',
            id: playerId,
            actionType: data.actionType,
            classKey: data.classKey,
            x: data.x,
            y: data.y,
            facing: data.facing,
            projectiles: data.projectiles || []
          }, ws);
          break;
        }

        // 4. Dano e Derrota de Monstro com DROP DE ITENS DA IA
        case 'monster_damage': {
          let currentList = ws.currentFloor === 0 ? monsters : (dungeonFloors.get(ws.currentFloor)?.monsters || []);
          const m = currentList.find(mon => mon.id === data.monsterId);
          if (m && m.hp > 0) {
            m.hp = Math.max(0, m.hp - data.damage);

            broadcast({
              type: 'monster_damaged',
              monsterId: m.id,
              damage: data.damage,
              hp: m.hp,
              isCrit: data.isCrit,
              attackerId: playerId
            });

            if (m.hp <= 0) {
              // GERAÇÃO DE ITEM PELA IA
              let droppedItem = null;
              if (Math.random() < 0.65 || m.isBoss) {
                droppedItem = ai.generateRandomItem(ws.currentFloor + 1);
                const dropData = {
                  id: droppedItem.id,
                  x: m.x,
                  y: m.y,
                  floor: ws.currentFloor,
                  item: droppedItem
                };
                worldDrops.set(dropData.id, dropData);

                broadcast({
                  type: 'item_dropped',
                  drop: dropData
                });
              }

              broadcast({
                type: 'monster_killed',
                monsterId: m.id,
                isBoss: !!m.isBoss,
                expReward: m.expReward,
                goldReward: m.goldReward,
                killerName: data.killerName
              });
            }
          }
          break;
        }

        // 5. Coleta de Item Caído
        case 'pick_item': {
          const drop = worldDrops.get(data.itemId);
          if (drop) {
            worldDrops.delete(data.itemId);
            const p = players.get(playerId);
            if (p) {
              p.equippedItem = drop.item;
            }
            broadcast({
              type: 'item_picked',
              itemId: drop.id,
              pickerId: playerId,
              pickerName: data.playerName,
              item: drop.item
            });
          }
          break;
        }

        // 6. Entrada / Troca de Andar na Dungeon Infinita
        case 'enter_dungeon': {
          const floor = data.floor || 1;
          ws.currentFloor = floor;
          const p = players.get(playerId);
          if (p) p.currentFloor = floor;

          // Gera andar procedural se ainda não existir
          if (!dungeonFloors.has(floor)) {
            const newFloorData = ai.generateDungeonFloor(floor);
            dungeonFloors.set(floor, newFloorData);
          }

          const currentDungeon = dungeonFloors.get(floor);
          ws.send(JSON.stringify({
            type: 'dungeon_loaded',
            dungeon: currentDungeon
          }));

          broadcast({
            type: 'system_chat',
            text: `🌀 ${p?.profile?.name || 'Um herói'} adentrou o Andar ${floor} da Dungeon Infinita!`
          });
          break;
        }

        // Saída da Dungeon para o mundo principal
        case 'exit_dungeon': {
          ws.currentFloor = 0;
          const p = players.get(playerId);
          if (p) {
            p.currentFloor = 0;
            p.x = cosmicPortal.x + 40;
            p.y = cosmicPortal.y + 40;
          }
          ws.send(JSON.stringify({
            type: 'return_to_surface',
            monsters: monsters
          }));
          break;
        }

        // 7. Abertura de Baús
        case 'open_chest': {
          const ch = chests.find(c => c.id === data.chestId);
          if (ch && !ch.opened) {
            ch.opened = true;
            // Baú tem drop garantido de item da IA
            const chestItem = ai.generateRandomItem(2);
            const dropData = {
              id: chestItem.id,
              x: ch.x + 20,
              y: ch.y + 20,
              floor: ws.currentFloor,
              item: chestItem
            };
            worldDrops.set(dropData.id, dropData);

            broadcast({
              type: 'item_dropped',
              drop: dropData
            });

            broadcast({
              type: 'chest_opened',
              chestId: ch.id,
              openedBy: data.playerName
            });
          }
          break;
        }

        // 8. CHAT MULTIPLAYER + CÉREBRO DOS NPCS COM GOOGLE GEMINI
        case 'chat_message': {
          const p = players.get(playerId);
          const safeText = String(data.text || '').substring(0, 80).trim();
          if (safeText.length > 0 && p) {
            // Transmite a mensagem do jogador
            broadcast({
              type: 'player_chat',
              id: playerId,
              name: p.profile.name,
              text: safeText
            });

            // VERIFICA SE ESTÁ PERTO DE UM NPC OU MENCIONOU O NOME DELE
            const lowerMsg = safeText.toLowerCase();
            let targetNPC = null;

            for (let npc of npcs) {
              const dist = Math.hypot(p.x - npc.x, p.y - npc.y);
              const mentioned = lowerMsg.includes(npc.name.toLowerCase()) || 
                                (npc.role === 'jake' && lowerMsg.includes('jake')) ||
                                (npc.role === 'bmo' && lowerMsg.includes('bmo')) ||
                                (npc.role === 'bubblegum' && (lowerMsg.includes('jujuba') || lowerMsg.includes('princesa'))) ||
                                (npc.role === 'iceking' && (lowerMsg.includes('gelado') || lowerMsg.includes('rei')));

              if (dist < 120 || mentioned) {
                targetNPC = npc;
                break;
              }
            }

            // Se o jogador interagiu com um NPC, a IA do Gemini responde!
            if (targetNPC) {
              // Responde em background de forma assíncrona
              ai.generateNPCDialog(targetNPC.role, safeText, p.profile.name).then(aiReply => {
                broadcast({
                  type: 'npc_ai_speech',
                  npcId: targetNPC.id,
                  npcName: targetNPC.name,
                  text: aiReply
                });
              });
            }
          }
          break;
        }
      }
    } catch (e) {
      console.error('Erro no processamento da mensagem:', e);
    }
  });

  // Desconexão
  ws.on('close', () => {
    const p = players.get(playerId);
    if (p) {
      players.delete(playerId);
      broadcast({
        type: 'player_left',
        id: playerId
      });
      broadcast({
        type: 'system_chat',
        text: `🍂 ${p.profile.name} saiu de Ooo.`
      });
    }
  });
});

// ===================================================================
// 4. IA DE PERSEGUIÇÃO DOS MONSTROS EM TEMPO REAL
// ===================================================================
setInterval(() => {
  if (players.size === 0) return;
  const playerArr = Array.from(players.values());

  // Monstros do mundo principal
  monsters.forEach(m => {
    if (m.hp <= 0) return;
    let closestP = null;
    let closestDist = Infinity;

    for (let p of playerArr) {
      if (p.currentFloor === 0) {
        const d = Math.hypot(p.x - m.x, p.y - m.y);
        if (d < closestDist) {
          closestDist = d;
          closestP = p;
        }
      }
    }

    const agroRange = m.isBoss ? 450 : 250;
    if (closestP && closestDist < agroRange && closestDist > 20) {
      // Monstros normais fogem se estiverem com menos de 20% de vida! (Comportamento vivo)
      const isLowHp = !m.isBoss && m.hp < m.maxHp * 0.25;
      const factor = isLowHp ? -1.2 : 1.0;

      const mx = (closestP.x - m.x) / closestDist;
      const my = (closestP.y - m.y) / closestDist;
      m.x += mx * m.spd * 2.2 * factor;
      m.y += my * m.spd * 2.2 * factor;
    }
  });

  broadcast({
    type: 'sync_monsters',
    monsters: monsters.map(m => ({ id: m.id, x: Math.round(m.x), y: Math.round(m.y), hp: m.hp }))
  });
}, 100);

// Inicia servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🏰 HORA DA AVENTURA: SERVIDOR MULTIPLAYER + IA GEMINI!`);
  console.log(`🧠 Cérebro IA:  Ativo com Google Gemini (${process.env.GEMINI_API_KEY ? 'CONECTADO ✅' : 'MODO OFFLINE ⚠️'})`);
  console.log(`🌐 Localhost:   http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
