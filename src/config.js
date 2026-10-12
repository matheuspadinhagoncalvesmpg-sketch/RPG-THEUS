// Constantes globais, paletas das regiões e definição das habilidades.

export const TILE = 32;
export const VIEW_H = 352; // altura visível do mundo em pixels (11 blocos)
export const MAX_RENDER_SCALE = 3;

export const T = { EMPTY: 0, SOLID: 1, SPIKE: 2, ONEWAY: 3, BREAK: 4, DOOR: 5, WATER: 6 };

// Física do herói (unidades: pixels por quadro a 60 fps)
export const PHYS = {
  gravity: 0.55,
  maxFall: 11.5,
  run: 3.7,
  jump: -10.4,
  doubleJump: -9.4,
  wallJumpX: 5.4,
  wallJumpY: -9.8,
  wallSlide: 2.3,
  dashSpeed: 9.2,
  dashFrames: 12,
  dashCooldown: 22,
  coyote: 6,
  jumpBuffer: 8,
  pogo: -9.6,
};

// Zona segura: perto de uma fogueira não aparecem monstros (nem invasões).
export const SAFE_RADIUS = 10;
export const nearBench = (room, tx, ty) =>
  room.entities.some((e) => e.ch === 'B' && Math.abs(e.tx - tx) <= SAFE_RADIUS && Math.abs(e.ty - ty) <= 6);

// Fragmentos de Vida: a cada FRAGMENTS_PER_HEART o herói ganha um coração.
export const FRAGMENTS_PER_HEART = 5;

export const SOUL_MAX = 99;
export const SOUL_COST = 33;
export const SOUL_PER_HIT = 11;

export const AREAS = {
  campos: {
    name: 'Campos do Crepúsculo',
    subtitle: 'onde o sol nunca termina de se pôr',
    sky: ['#191230', '#4a2648', '#b4574a', '#f0a861'],
    far: '#3d2443', mid: '#25172c', haze: '#f2a066',
    ground: '#1c1420', groundHi: '#35263a',
    top: '#6f8445', topHi: '#d6c070',
    plank: '#6b4a32',
    accent: '#ffcf7a',
    particles: 'pollen',
    dark: 0.0,
    horizon: 31 * 32,
    music: { root: 57, scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]] },
  },
  bosque: {
    name: 'Bosque das Lanternas',
    subtitle: 'as luzes lembram de tudo',
    sky: ['#03090c', '#08181d', '#0f2f33', '#17473f'],
    far: '#0f2b2c', mid: '#091b1d', haze: '#2a8f74',
    ground: '#0a1416', groundHi: '#16302f',
    top: '#2c6a49', topHi: '#7fd394',
    plank: '#3c2c22',
    accent: '#ffb85c',
    particles: 'fireflies',
    dark: 0.45,
    horizon: 40 * 32,
    music: { root: 50, scale: [0, 3, 5, 7, 10], chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -2, 2]] },
  },
  ruinas: {
    name: 'Ruínas Suspensas',
    subtitle: 'um reino entre as nuvens',
    sky: ['#121731', '#2a3868', '#7488c0', '#e6d2b0'],
    far: '#4b5686', mid: '#2b3258', haze: '#cfd8f0',
    ground: '#1d2033', groundHi: '#383e5c',
    top: '#8b95b5', topHi: '#e3e8f5',
    plank: '#7d84a3',
    accent: '#bfe3ff',
    particles: 'motes',
    dark: 0.0,
    tileY: true,
    horizon: -16 * 32,
    music: { root: 55, scale: [0, 2, 4, 7, 11], chords: [[0, 4, 7], [-1, 2, 7], [-3, 0, 4], [-7, -3, 0]] },
  },
  cristal: {
    name: 'Cavernas de Cristal',
    subtitle: 'o coração frio de Vésper',
    sky: ['#05030d', '#0f0924', '#1e1340', '#331c5c'],
    far: '#1e1340', mid: '#130c2c', haze: '#7a5cff',
    ground: '#100b21', groundHi: '#281e4c',
    top: '#6650d0', topHi: '#c9bcff',
    plank: '#4a3a9a',
    accent: '#7ef0ff',
    particles: 'sparkles',
    dark: 0.5,
    horizon: 56 * 32,
    music: { root: 52, scale: [0, 2, 3, 7, 8], chords: [[0, 3, 7], [-4, 0, 3], [-5, -2, 2], [-7, -4, 0]] },
  },
};

AREAS.jardins = {
  name: 'Jardins Submersos',
  subtitle: 'onde a maré guarda segredos',
  sky: ['#020a12', '#06202e', '#0b3a4a', '#145a66'],
  far: '#0c3442', mid: '#082430', haze: '#3fd1c4',
  ground: '#0a1a20', groundHi: '#1c3c44',
  top: '#2f8f84', topHi: '#8ff0d8',
  plank: '#3a5a5c',
  accent: '#7affd4',
  particles: 'bubbles',
  dark: 0.35,
  horizon: 84 * 32,
  music: { root: 53, scale: [0, 2, 5, 7, 9], chords: [[0, 4, 9], [-3, 0, 4], [-5, -1, 2], [-7, -3, 2]] },
};

// Amuletos: equipe até 3 (troca só descansando numa fogueira).
export const CHARM_SLOTS = 3;
export const CHARMS = {
  alma_faminta: { name: 'Alma Faminta', icon: '✶', color: '#c9b8ff', desc: 'Golpes enchem 50% mais ALMA.' },
  vento_longo: { name: 'Vento Longo', icon: '»', color: '#bfe3ff', desc: 'O dash vai mais longe.' },
  ima_moedas: { name: 'Ímã de Moedas', icon: '◎', color: '#ffcf4a', desc: 'Moedas e materiais vêm até você de longe.' },
  pele_pedra: { name: 'Pele de Pedra', icon: '♥', color: '#ff7a8a', desc: '+1 coração enquanto equipado.' },
  lamina_rapida: { name: 'Lâmina Rápida', icon: '⚔', color: '#e9fbff', desc: 'Ataques mais rápidos.' },
  mare_viva: { name: 'Maré Viva', icon: '≈', color: '#7affd4', desc: 'Cura muito mais rápido.' },
};

export const ABILITIES = {
  dash: {
    name: 'Manto do Vento',
    icon: '»',
    desc: 'Avance num piscar de olhos, no chão ou no ar.',
    keys: 'Celular: botão »  ·  Teclado: C ou Shift',
  },
  glide: {
    name: 'Asas de Seda',
    icon: '✦',
    desc: 'Segure o pulo no ar para planar devagar e atravessar abismos largos.',
    keys: 'Segure o botão de pulo enquanto cai',
  },
  wallJump: {
    name: 'Garras de Pedra',
    icon: '⟰',
    desc: 'Deslize pelas paredes e salte delas. Segure na direção da parede.',
    keys: 'Pule enquanto desliza para escalar',
  },
  doubleJump: {
    name: 'Asas de Cinza',
    icon: '⌃',
    desc: 'Salte uma segunda vez no meio do ar.',
    keys: 'Aperte pular de novo no ar',
  },
  spell: {
    name: 'Chama da Alma',
    icon: '✦',
    desc: 'Gaste ALMA para lançar uma chama que atravessa inimigos.',
    keys: 'Toque rápido em ✦ (V)  ·  Segure para curar',
  },
};

// ── Materiais: coletados no mundo e usados como moeda de troca com os NPCs ──
// value: quanto o material vale em moedas quando o NPC aceita a troca.
export const RESOURCES = {
  wood: { name: 'Madeira', color: '#c08a52', value: 4, desc: 'Lenha e tábuas. Os NPCs aceitam como pagamento.' },
  stone: { name: 'Pedra', color: '#a7a3b3', value: 5, desc: 'Pedra bruta. Os NPCs aceitam como pagamento.' },
  ore: { name: 'Minério', color: '#e39a3a', value: 10, desc: 'Minério de bronze. Vale bem nas trocas.' },
  crystal: { name: 'Cristal', color: '#7ef0ff', value: 16, desc: 'Cristal puro. O material mais valioso.' },
};

// Valor total, em moedas, dos materiais da mochila.
export const materialsWorth = (inv) => Object.entries(RESOURCES).reduce((t, [k, r]) => t + (inv[k] || 0) * r.value, 0);

// Paga um preço (em moedas) com materiais, dos mais baratos para os mais caros.
// Devolve o texto do que foi entregue, ou null se a mochila não vale o preço.
export function payWithMaterials(inv, price) {
  if (materialsWorth(inv) < price) return null;
  let left = price;
  const given = [];
  for (const [k, r] of Object.entries(RESOURCES).sort((a, b) => a[1].value - b[1].value)) {
    if (left <= 0) break;
    const n = Math.min(inv[k] || 0, Math.ceil(left / r.value));
    if (!n) continue;
    inv[k] -= n;
    left -= n * r.value;
    given.push(`${n} ${r.name}`);
  }
  return given.join(', ');
}

// Nós de recurso no mapa (letra → recurso)
export const NODE_CHARS = { w: 'wood', r: 'stone', o: 'ore', k: 'crystal' };

// Armas (estilo Terraria): achadas em baús ou compradas dos NPCs.
// kind: melee (golpe corpo a corpo) | bow (flechas) | staff (orbes). cd = recarga do golpe, em quadros.
export const RARITY = {
  comum: { name: 'Comum', color: '#e8e4da' },
  incomum: { name: 'Incomum', color: '#7fe39a' },
  raro: { name: 'Raro', color: '#6ab8ff' },
  epico: { name: 'Épico', color: '#c79bff' },
};
export const WEAPONS = {
  errante: { name: 'Lâmina do Errante', desc: 'A espada pequena de quem acorda na Colina.', dmg: 1, len: 27, cd: 19, style: 'steel', kind: 'melee', rarity: 'comum' },
  adaga: { name: 'Adaga de Osso', desc: 'Veloz, mas de alcance curto.', dmg: 0.75, len: 18, cd: 11, style: 'bone', kind: 'melee', rarity: 'incomum' },
  lanca: { name: 'Lança do Caçador', desc: 'Longo alcance, golpes mais lentos.', dmg: 1.2, len: 46, cd: 25, style: 'spear', kind: 'melee', rarity: 'incomum' },
  machado: { name: 'Machado de Pedra', desc: 'Pesado: dano alto, golpes lentos.', dmg: 2, len: 30, cd: 31, style: 'axe', kind: 'melee', rarity: 'raro' },
  minerio: { name: 'Espada de Minério', desc: 'Dano x1,5. Lâmina de bronze.', dmg: 1.5, len: 29, cd: 19, style: 'ore', kind: 'melee', rarity: 'incomum' },
  cristal: { name: 'Espada de Cristal', desc: 'Dano x2,2. Lâmina longa e brilhante.', dmg: 2.2, len: 32, cd: 19, style: 'crystal', kind: 'melee', rarity: 'raro' },
  foice: { name: 'Foice Lunar', desc: 'Arco largo e rápido, de lâmina pálida.', dmg: 1.5, len: 36, cd: 21, style: 'bone', kind: 'melee', rarity: 'raro' },
  tridente: { name: 'Tridente da Maré', desc: 'Alcance enorme e dano alto. Forjado no fundo do recife.', dmg: 1.8, len: 52, cd: 27, style: 'spear', kind: 'melee', rarity: 'epico' },
  arco: { name: 'Arco do Caçador', desc: 'Dispara flechas à distância. Para baixo: pancada de arco.', dmg: 0.9, len: 15, cd: 17, style: 'steel', kind: 'bow', rarity: 'incomum' },
  cajado: { name: 'Cajado da Névoa', desc: 'Lança orbes de névoa à distância.', dmg: 1.1, len: 15, cd: 22, style: 'steel', kind: 'staff', rarity: 'raro' },
};

// Entrega uma arma ao herói (a primeira vez) e a equipa.
export function giveWeapon(s, key) {
  s.weapons = s.weapons || { errante: true };
  s.weapons[key] = true;
  s.weapon = key;
}
export const ownsWeapon = (s, key) => !!(s.weapons && s.weapons[key]) || (s.weapon || 'errante') === key;


// Armaduras: corações extras.
export const ARMORS = {
  none: { name: 'Sem armadura', hearts: 0 },
  madeira: { name: 'Armadura de Madeira', hearts: 1, color: '#8a5a32', trim: '#c08a52' },
  pedra: { name: 'Armadura de Pedra', hearts: 2, color: '#6a6676', trim: '#c7ccd8' },
  cristal: { name: 'Armadura de Cristal', hearts: 3, color: '#3aa9c4', trim: '#bff7ff' },
};

// Troca a armadura ajustando a vida máxima pela diferença de corações.
export function equipArmor(s, id) {
  const before = ARMORS[s.armor || 'none'].hearts;
  s.armor = id;
  s.masksMax += ARMORS[id].hearts - before;
}
