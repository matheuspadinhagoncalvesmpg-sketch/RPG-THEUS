// Progresso salvo no navegador (localStorage), sempre protegido por try/catch.

const KEY = 'theus_save_v2';
const SETTINGS_KEY = 'theus_settings_v2';

export const DEFAULT_PROFILE = {
  name: 'Errante',
  cloak: '#3a4f8f',
  hair: '#f2f2f2',
  eyes: 'hetero',
  skin: '#efe6da',
  accent: '',
  hairStyle: 'franja',
  topper: 'nenhum',
  build: 'padrao',
  capeStyle: 'nenhum',
};

export function newSave(profile) {
  return {
    v: 2,
    profile: { ...DEFAULT_PROFILE, ...profile },
    bench: null,
    masksMax: 5,
    weapon: 'errante',
    weapons: { errante: true },
    opened: {},
    maps: {},
    fragments: 0,
    memorias: {},
    livres: {},
    nail: 1,
    geo: 0,
    abilities: { dash: false, wallJump: false, doubleJump: false, spell: false, glide: false },
    collected: {},
    broken: {},
    bosses: {},
    visited: {},
    talked: {},
    bought: {},
    shade: null,
    inv: { wood: 0, stone: 0, ore: 0, crystal: 0 },
    weapon: 'errante',
    armor: 'none',
    items: {},
    charms: { owned: {}, equipped: [] },
    chests: {},
    brasas: {},
    marcas: {},
    base: { invasions: 0 },
    playTime: 0,
    finished: false,
  };
}

// Lê o save; se o principal estiver corrompido (celular sem espaço, aba fechada no meio da escrita),
// usa a cópia de segurança em vez de apagar o progresso.
function readRaw() {
  for (const k of [KEY, KEY + '_bak']) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const s = JSON.parse(raw);
      if (s && s.v === 2) return s;
    } catch (e) { /* tenta a cópia */ }
  }
  return null;
}

export function loadSave() {
  try {
    const s = readRaw();
    if (!s) return null;
    const base = newSave(s.profile);
    const ch = s.charms || {};
    return {
      ...base, ...s, inv: { ...base.inv, ...(s.inv || {}) }, base: { ...base.base, ...(s.base || {}) },
      profile: { ...DEFAULT_PROFILE, capeStyle: 'cachecol', ...(s.profile || {}) }, // saves antigos mantêm o cachecol
      weapons: { errante: true, [s.weapon || 'errante']: true, ...(s.weapons || {}) },
      opened: { ...(s.opened || {}) },
      maps: { ...(s.maps || {}) },
      memorias: { ...(s.memorias || {}) },
      livres: { ...(s.livres || {}) },
      charms: { owned: { ...(ch.owned || {}) }, equipped: [...(ch.equipped || [])] },
      brasas: { ...(s.brasas || {}) }, marcas: { ...(s.marcas || {}) },
    };
  } catch (e) {
    return null;
  }
}

export function writeSave(save) {
  try {
    const prev = localStorage.getItem(KEY);
    // A cópia só é trocada se o save atual está íntegro.
    if (prev) { JSON.parse(prev); localStorage.setItem(KEY + '_bak', prev); }
  } catch (e) { /* save anterior inválido: mantém a cópia antiga */ }
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* armazenamento indisponível */ }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(KEY + '_bak'); } catch (e) { /* ok */ }
}

const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
// Celulares começam com a câmera um pouco mais perto (o herói fica maior na tela pequena).
export const DEFAULT_SETTINGS = {
  speed: 1, muted: false, vibration: true, btnSize: 1, btnOpacity: 0.55, showFps: false,
  zoom: coarse ? 1.2 : 1, quality: 'auto', lefty: false,
};

export function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

export function writeSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) { /* ok */ }
}
