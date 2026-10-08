/**
 * ===================================================================
 * MOTOR DE IA: CÉREBRO DE OOO & GERAÇÃO INFINITA
 * Integração com Google Gemini API + Dungeons & Itens Procedurais
 * ===================================================================
 */

require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.5-flash-lite';

// ===================================================================
// 1. DIÁLOGOS DE NPCS VIVOS COM IA (GOOGLE GEMINI)
// ===================================================================
const NPC_PERSONAS = {
  jake: `Você é o Jake, o Cão Mágico de Hora de Aventura (Adventure Time). 
Você está conversando com os aventureiros nas Colinas da Terra de Ooo.
Personalidade: Muito leal, brincalhão, adora comida (especialmente sanduíches épicos), calmo, usa gírias como "Matemático!", "Caramba, irmão!", "Pode crer!", "Mano".
Responda SEMPRE em português, com no máximo 2 frases curtas, animado e divertido.`,

  bmo: `Você é o BMO de Hora de Aventura (Adventure Time), um pequeno videogame vivo e fofo.
Personalidade: Inocente, doce, fala como uma criança tecnológica curiosa, usa onomatopeias como "Beep boop!", adora jogos e dançar.
Responda SEMPRE em português, com no máximo 2 frases curtas e muito fofas.`,

  bubblegum: `Você é a Princesa Jujuba de Hora de Aventura, soberana do Reino dos Doces.
Personalidade: Extremamente inteligente, científica, protetora do povo doce, um pouco mandona mas carinhosa.
Responda SEMPRE em português, com no máximo 2 frases elegantes e científicas.`,

  iceking: `Você é o Rei Gelado de Hora de Aventura.
Personalidade: Excêntrico, dramático, carente de amigos, obcecado por gelo, pinguins (especialmente o Gunther) e fofoca.
Responda SEMPRE em português, com no máximo 2 frases hilárias e exageradas.`,

  marceline: `Você é a Marceline, a Rainha dos Vampiros de Hora de Aventura.
Personalidade: Roquista, sarcástica, rebelde, adora tocar seu baixo-machado e comer tons de vermelho. É corajosa e amiga leal.
Responda SEMPRE em português, com no máximo 2 frases no estilo rock 'n roll e atitude vampírica.`
};

/**
 * Consulta a IA do Gemini para gerar uma fala contextual do NPC
 */
async function generateNPCDialog(npcRole, playerMessage, playerName = 'Aventureiro') {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'sua_chave_aqui') {
    return getFallbackDialog(npcRole, playerMessage);
  }

  const systemPrompt = NPC_PERSONAS[npcRole] || NPC_PERSONAS.jake;
  const userPrompt = `O jogador "${playerName}" acabou de te dizer: "${playerMessage}". Responda para ele como seu personagem no universo de Hora de Aventura.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.85
        }
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      let reply = data.candidates[0].content.parts[0].text.trim();
      // Remove aspas excedentes se houver
      reply = reply.replace(/^["']|["']$/g, '');
      return reply;
    } else {
      console.warn("Gemini sem candidatos, usando fallback:", data);
      return getFallbackDialog(npcRole, playerMessage);
    }
  } catch (error) {
    console.error("Erro na API do Gemini:", error.message);
    return getFallbackDialog(npcRole, playerMessage);
  }
}

function getFallbackDialog(role, msg) {
  const fallbacks = {
    jake: [
      "Matemático, irmão! O dia tá bonito pra chutar a bunda de uns monstros!",
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
    ]
  };
  const list = fallbacks[role] || fallbacks.jake;
  return list[Math.floor(Math.random() * list.length)];
}

// ===================================================================
// 2. FORJA INFINITA: GERADOR PROCEDURAL DE ITENS MÍSTICOS
// ===================================================================
const ITEM_PREFIXES = [
  { name: "Flamejante", atk: 5, color: "#f97316" },
  { name: "Gélido", atk: 4, hp: 10, color: "#38bdf8" },
  { name: "Cósmico", atk: 12, mp: 15, color: "#c084fc" },
  { name: "Doce", hp: 20, mp: 10, color: "#f472b6" },
  { name: "Matemático", atk: 8, spd: 0.4, color: "#eab308" },
  { name: "Vampírico", atk: 7, hp: 15, color: "#dc2626" },
  { name: "Ancestral de Ooo", atk: 10, hp: 25, color: "#10b981" }
];

const ITEM_BASE_TYPES = [
  { type: 'weapon', classKey: 'warrior', name: 'Espada de Cristal', icon: '🗡️' },
  { type: 'weapon', classKey: 'warrior', name: 'Lâmina Escarlate', icon: '⚔️' },
  { type: 'weapon', classKey: 'mage', name: 'Cajado de Chiclete', icon: '🪄' },
  { type: 'weapon', classKey: 'mage', name: 'Orbe das Estrelas', icon: '🔮' },
  { type: 'weapon', classKey: 'archer', name: 'Arco de Videira', icon: '🏹' },
  { type: 'weapon', classKey: 'archer', name: 'Besta de Caramelo', icon: '🏹' },
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

let nextItemId = 1000;

function generateRandomItem(monsterLevel = 1) {
  // Sorteia raridade
  const roll = Math.random();
  let accumulated = 0;
  let selectedRarity = RARITIES[0];

  for (let r of RARITIES) {
    accumulated += r.chance;
    if (roll <= accumulated) {
      selectedRarity = r;
      break;
    }
  }

  const prefix = ITEM_PREFIXES[Math.floor(Math.random() * ITEM_PREFIXES.length)];
  const base = ITEM_BASE_TYPES[Math.floor(Math.random() * ITEM_BASE_TYPES.length)];

  const bonusAtk = Math.round(((prefix.atk || 0) + (base.type === 'weapon' ? 4 : 1)) * selectedRarity.mult);
  const bonusHp = Math.round(((prefix.hp || 0) + (base.type === 'relic' ? 15 : 0)) * selectedRarity.mult);
  const bonusMp = Math.round(((prefix.mp || 0) + 5) * selectedRarity.mult);

  return {
    id: 'item_' + (nextItemId++),
    name: `${base.name} ${prefix.name}`,
    type: base.type,
    classKey: base.classKey || null,
    icon: base.icon,
    rarity: selectedRarity.key,
    rarityLabel: selectedRarity.label,
    rarityColor: selectedRarity.color,
    bonusAtk: bonusAtk,
    bonusHp: bonusHp,
    bonusMp: bonusMp,
    levelReq: monsterLevel
  };
}

// ===================================================================
// 3. GERADOR PROCEDURAL DE DUNGEONS INFINITAS
// ===================================================================
function generateDungeonFloor(floorNumber = 1) {
  const width = 1800;
  const height = 1400;
  const rooms = [];
  const roomCount = 6 + Math.min(10, floorNumber * 2);

  // Gera salas distribuídas
  for (let i = 0; i < roomCount; i++) {
    const rw = 180 + Math.random() * 140;
    const rh = 160 + Math.random() * 120;
    const rx = 100 + Math.random() * (width - rw - 200);
    const ry = 100 + Math.random() * (height - rh - 200);

    rooms.push({
      id: i,
      x: rx,
      y: ry,
      w: rw,
      h: rh,
      centerX: rx + rw / 2,
      centerY: ry + rh / 2,
      isBossRoom: i === roomCount - 1,
      isStartRoom: i === 0
    });
  }

  // Gera monstros da Dungeon de acordo com o andar
  const dungeonMonsters = [];
  let dMonsterId = 5000 + floorNumber * 100;

  rooms.forEach((r, idx) => {
    if (r.isStartRoom) return; // Sala de spawn limpa

    if (r.isBossRoom) {
      const isLich = floorNumber >= 3 && floorNumber % 3 === 0;
      dungeonMonsters.push({
        id: dMonsterId++,
        type: 'boss',
        isBoss: true,
        name: isLich ? `O Temível Lich Cósmico (Andar ${floorNumber})` : `Guardião das Sombras (Andar ${floorNumber})`,
        x: r.centerX,
        y: r.centerY,
        scale: isLich ? 4.2 : 3.8,
        hp: (isLich ? 500 : 300) + floorNumber * 120,
        maxHp: (isLich ? 500 : 300) + floorNumber * 120,
        atk: (isLich ? 26 : 16) + floorNumber * 4,
        spd: 1.3,
        expReward: (isLich ? 350 : 180) + floorNumber * 60,
        goldReward: (isLich ? 250 : 120) + floorNumber * 40,
        color: isLich ? '#16a34a' : '#7c3aed'
      });
    } else {
      // Monstros comuns por sala
      const count = 2 + Math.floor(Math.random() * 3);
      for (let m = 0; m < count; m++) {
        const mType = Math.random() < 0.5 ? 'skeleton' : 'slime';
        dungeonMonsters.push({
          id: dMonsterId++,
          type: mType,
          name: mType === 'skeleton' ? `Esqueleto do Andar ${floorNumber}` : `Gelatina Negra`,
          x: r.x + 30 + Math.random() * (r.w - 60),
          y: r.y + 30 + Math.random() * (r.h - 60),
          hp: 40 + floorNumber * 15,
          maxHp: 40 + floorNumber * 15,
          atk: 8 + floorNumber * 2,
          spd: 1.5,
          expReward: 25 + floorNumber * 10,
          goldReward: 10 + floorNumber * 5,
          color: mType === 'slime' ? '#3b0764' : '#f8fafc'
        });
      }
    }
  });

  // Baú místico no chefe
  const bossRoom = rooms[rooms.length - 1];
  const dungeonChests = [
    {
      id: 9000 + floorNumber,
      x: bossRoom.centerX + 50,
      y: bossRoom.centerY + 50,
      opened: false,
      gold: 150 + floorNumber * 50,
      potion: 3
    }
  ];

  return {
    floor: floorNumber,
    width: width,
    height: height,
    rooms: rooms,
    spawnPoint: { x: rooms[0].centerX, y: rooms[0].centerY },
    exitPortal: { x: bossRoom.centerX - 60, y: bossRoom.centerY - 60 },
    monsters: dungeonMonsters,
    chests: dungeonChests
  };
}

module.exports = {
  generateNPCDialog,
  generateRandomItem,
  generateDungeonFloor
};
