// Constantes globais, paletas das regiões e definição das habilidades.

export const TILE = 32;
export const VIEW_H = 352; // altura visível do mundo em pixels (11 blocos)
export const MAX_RENDER_SCALE = 3;

export const T = { EMPTY: 0, SOLID: 1, SPIKE: 2, ONEWAY: 3, BREAK: 4, DOOR: 5 };

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

export const ABILITIES = {
  dash: {
    name: 'Manto do Vento',
    icon: '»',
    desc: 'Avance num piscar de olhos, no chão ou no ar.',
    keys: 'Celular: botão »  ·  Teclado: C ou Shift',
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

// ── Coleta e construção (estilo Terraria) ──
export const RESOURCES = {
  wood: { name: 'Madeira', color: '#c08a52' },
  stone: { name: 'Pedra', color: '#a7a3b3' },
  ore: { name: 'Minério', color: '#e39a3a' },
  crystal: { name: 'Cristal', color: '#7ef0ff' },
};

// Nós de recurso no mapa (letra → recurso)
export const NODE_CHARS = { w: 'wood', r: 'stone', o: 'ore', k: 'crystal' };

export const BUILD_ITEMS = [
  { id: 'remove', name: 'Remover', tool: true },
  { id: 'wood_block', name: 'Bloco de Madeira', cost: { wood: 2 }, tile: T.SOLID },
  { id: 'wood_plat', name: 'Plataforma', cost: { wood: 1 }, tile: T.ONEWAY },
  { id: 'stone_block', name: 'Bloco de Pedra', cost: { stone: 2 }, tile: T.SOLID },
  { id: 'crystal_block', name: 'Tijolo de Cristal', cost: { crystal: 1, stone: 1 }, tile: T.SOLID },
  { id: 'torch', name: 'Tocha', cost: { wood: 1, ore: 1 }, deco: true, support: 'any' },
  { id: 'banner', name: 'Estandarte', cost: { wood: 2, crystal: 1 }, deco: true, support: 'below' },
  { id: 'chest', name: 'Baú', cost: { wood: 4, ore: 1 }, deco: true, support: 'below' },
  { id: 'campfire', name: 'Fogueira', cost: { wood: 5, stone: 3 }, deco: true, support: 'below', desc: 'vira ponto de descanso' },
];
export const BUILD_BY_ID = Object.fromEntries(BUILD_ITEMS.map((b) => [b.id, b]));
export const BUILD_REACH = 7 * TILE;
