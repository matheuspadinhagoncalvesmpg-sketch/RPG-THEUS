// Salvamento na nuvem: um código de 10 letras leva o progresso para outro aparelho.
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const KEY = 'theus_cloud_code';

export function cloudCode() {
  try {
    let c = localStorage.getItem(KEY);
    if (!c || c.length !== 10) {
      const bytes = crypto.getRandomValues(new Uint8Array(10));
      c = Array.from(bytes, (b) => ABC[b % ABC.length]).join('');
      localStorage.setItem(KEY, c);
    }
    return c;
  } catch (e) {
    return null;
  }
}

export function setCloudCode(c) {
  try { localStorage.setItem(KEY, c); } catch (e) { /* ok */ }
}

export const prettyCode = (c) => (c ? `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}` : '');
export const normalizeCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

let timer = null;
let lastSent = 0;

// Envia o save no máximo a cada 15 s (chamado a cada salvamento local).
export function scheduleUpload(save) {
  clearTimeout(timer);
  const wait = Math.max(0, 15000 - (Date.now() - lastSent));
  timer = setTimeout(() => uploadNow(save), wait);
}

export async function uploadNow(save) {
  const code = cloudCode();
  if (!code || location.protocol === 'file:') return false;
  lastSent = Date.now();
  try {
    const r = await fetch('api/cloud/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, save }) });
    return r.ok;
  } catch (e) {
    return false;
  }
}

export async function downloadSave(code) {
  const r = await fetch('api/cloud/load', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Não foi possível baixar.');
  return data.save;
}
