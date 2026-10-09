// Progresso salvo no navegador (localStorage), sempre protegido por try/catch.

const KEY = 'theus_save_v2';
const SETTINGS_KEY = 'theus_settings_v2';

export const DEFAULT_PROFILE = {
  name: 'Errante',
  cloak: '#3a4f8f',
  hair: '#f2f2f2',
  eyes: 'hetero',
  skin: '#f2cfae',
};

export function newSave(profile) {
  return {
    v: 2,
    profile: { ...DEFAULT_PROFILE, ...profile },
    bench: null,
    masksMax: 5,
    nail: 1,
    geo: 0,
    abilities: { dash: false, wallJump: false, doubleJump: false, spell: false },
    collected: {},
    broken: {},
    bosses: {},
    visited: {},
    talked: {},
    bought: {},
    shade: null,
    inv: { wood: 0, stone: 0, ore: 0, crystal: 0 },
    builds: {},
    weapon: 'errante',
    armor: 'none',
    items: {},
    chests: {},
    base: { smith: false, raids: 0 },
    playTime: 0,
    finished: false,
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== 2) return null;
    const base = newSave(s.profile);
    return { ...base, ...s, inv: { ...base.inv, ...(s.inv || {}) }, builds: s.builds || {}, base: { ...base.base, ...(s.base || {}) } };
  } catch (e) {
    return null;
  }
}

export function writeSave(save) {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* armazenamento indisponível */ }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ok */ }
}

export const DEFAULT_SETTINGS = { speed: 1, muted: false, vibration: true, btnSize: 1, btnOpacity: 0.55, showFps: false };

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
