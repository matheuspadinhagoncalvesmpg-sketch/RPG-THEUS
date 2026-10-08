/**
 * ===================================================================
 * HORA DA AVENTURA: CRÔNICAS DE OOO - SERVIDOR MULTIPLAYER WEB
 * Node.js HTTP + WebSocket (ws)
 * ===================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

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
// 2. ESTADO DO MUNDO MULTIPLAYER COMPARTILHADO
// ===================================================================
const players = new Map(); // id -> { id, x, y, facing, isMoving, profile, hp, maxHp, level, chatMsg, chatTimer }

// Inicialização dos Monstros Sincronizados
const monsters = [];
let monsterCounter = 1;

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

wss.on('connection', (ws) => {
  const playerId = 'player_' + (nextPlayerId++);
  ws.playerId = playerId;

  // Recebimento de mensagens do cliente
  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);

      switch (data.type) {
        // 1. Jogador se junta ao jogo após criar o personagem
        case 'join': {
          const newPlayer = {
            id: playerId,
            x: 350 + (Math.random() * 60 - 30),
            y: 350 + (Math.random() * 60 - 30),
            facing: 'down',
            isMoving: false,
            animFrame: 0,
            isAttacking: false,
            attackProgress: 0,
            profile: data.profile,
            hp: data.hp,
            maxHp: data.maxHp,
            mp: data.mp,
            maxMp: data.maxMp,
            level: data.level || 1,
            chatMsg: null
          };
          players.set(playerId, newPlayer);

          // Envia dados do mundo e todos os jogadores atuais para quem acabou de entrar
          ws.send(JSON.stringify({
            type: 'init_world',
            selfId: playerId,
            players: Array.from(players.values()),
            monsters: monsters,
            chests: chests
          }));

          // Notifica os outros jogadores
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

        // 2. Movimento / Atualização de Estado
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

            // Retransmite para os demais jogadores
            broadcast({
              type: 'player_moved',
              id: playerId,
              x: p.x,
              y: p.y,
              facing: p.facing,
              isMoving: p.isMoving,
              animFrame: p.animFrame,
              hp: p.hp,
              level: p.level
            }, ws);
          }
          break;
        }

        // 3. Ataque ou Habilidade executada
        case 'attack_action': {
          broadcast({
            type: 'player_attacked',
            id: playerId,
            actionType: data.actionType, // 'basic' ou 'special'
            classKey: data.classKey,
            x: data.x,
            y: data.y,
            facing: data.facing,
            projectiles: data.projectiles || []
          }, ws);
          break;
        }

        // 4. Dano aplicado a monstro
        case 'monster_damage': {
          const m = monsters.find(mon => mon.id === data.monsterId);
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

            // Se morreu
            if (m.hp <= 0) {
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

        // 5. Baú aberto
        case 'open_chest': {
          const ch = chests.find(c => c.id === data.chestId);
          if (ch && !ch.opened) {
            ch.opened = true;
            broadcast({
              type: 'chest_opened',
              chestId: ch.id,
              openedBy: data.playerName
            });
          }
          break;
        }

        // 6. Mensagem de Chat em Tempo Real
        case 'chat_message': {
          const p = players.get(playerId);
          const safeText = String(data.text || '').substring(0, 70).trim();
          if (safeText.length > 0 && p) {
            p.chatMsg = safeText;
            broadcast({
              type: 'player_chat',
              id: playerId,
              name: p.profile.name,
              text: safeText
            });
          }
          break;
        }
      }
    } catch (e) {
      console.error('Erro ao processar mensagem WS:', e);
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
        text: `🍂 ${p.profile.name} saiu da Terra de Ooo.`
      });
    }
  });
});

// ===================================================================
// 4. IA SIMPLES DO SERVIDOR PARA MONSTROS PERSEGUIREM O JOGADOR MAIS PRÓXIMO
// ===================================================================
setInterval(() => {
  if (players.size === 0) return;

  const playerArr = Array.from(players.values());
  let moved = false;

  monsters.forEach(m => {
    if (m.hp <= 0) return;

    // Encontra jogador mais próximo
    let closestP = null;
    let closestDist = Infinity;

    for (let p of playerArr) {
      const d = Math.hypot(p.x - m.x, p.y - m.y);
      if (d < closestDist) {
        closestDist = d;
        closestP = p;
      }
    }

    const agroRange = m.isBoss ? 450 : 250;
    if (closestP && closestDist < agroRange && closestDist > 20) {
      const mx = (closestP.x - m.x) / closestDist;
      const my = (closestP.y - m.y) / closestDist;
      m.x += mx * m.spd * 2.2;
      m.y += my * m.spd * 2.2;
      moved = true;
    }
  });

  if (moved) {
    // Sincroniza posições de monstros a cada 100ms
    broadcast({
      type: 'sync_monsters',
      monsters: monsters.map(m => ({ id: m.id, x: Math.round(m.x), y: Math.round(m.y), hp: m.hp }))
    });
  }
}, 100);

// Inicia servidor HTTP + WebSocket
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🏰 SERVIDOR MULTIPLAYER DE HORA DA AVENTURA INICIADO!`);
  console.log(`🌐 Localhost:   http://localhost:${PORT}`);
  console.log(`📡 WebSocket:   ws://localhost:${PORT}`);
  console.log(`=======================================================`);
});
