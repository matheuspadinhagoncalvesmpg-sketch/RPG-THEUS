// Inicialização: telas de título e criação, opções e ligação com o jogo.
import { Input, TouchControls } from './input.js';
import { AudioSystem } from './audio.js';
import { UI } from './ui.js';
import { Game } from './game.js';
import { drawHero, EYE_COLORS } from './art.js';
import { BUILD_ITEMS } from './config.js';
import { loadSave, newSave, writeSave, clearSave, loadSettings, writeSettings, DEFAULT_PROFILE } from './save.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const input = new Input();
const audio = new AudioSystem();
const ui = new UI();
const touch = new TouchControls(input, $('#touch-ui'));
const game = new Game({ canvas: $('#game'), input, audio, ui });
let settings = loadSettings();
// Celulares e tablets já começam com os controles de toque visíveis.
if (matchMedia('(pointer: coarse)').matches) input.setTouchMode(true);

// ───────── Opções ─────────
function applySettings() {
  audio.setMuted(settings.muted);
  input.vibration = settings.vibration;
  document.documentElement.style.setProperty('--btn-scale', settings.btnSize);
  document.documentElement.style.setProperty('--btn-alpha', settings.btnOpacity);
  for (const el of $$('[data-setting="muted"]')) el.textContent = settings.muted ? 'Desligado' : 'Ligado';
  for (const el of $$('[data-setting="vibration"]')) el.textContent = settings.vibration ? 'Ligada' : 'Desligada';
  for (const el of $$('[data-size]')) el.classList.toggle('active', Number(el.dataset.size) === settings.btnSize);
  for (const el of $$('[data-speed]')) el.classList.toggle('active', Number(el.dataset.speed) === settings.speed);
  game.speed = settings.speed || 1;
  for (const el of $$('.opt-opacity')) el.value = settings.btnOpacity;
  writeSettings(settings);
  requestAnimationFrame(() => touch.layout());
}

for (const el of $$('[data-setting="muted"]')) el.addEventListener('click', () => { settings.muted = !settings.muted; audio.unlock(); applySettings(); });
for (const el of $$('[data-setting="vibration"]')) el.addEventListener('click', () => { settings.vibration = !settings.vibration; applySettings(); input.vibrate(40); });
for (const el of $$('[data-size]')) el.addEventListener('click', () => { settings.btnSize = Number(el.dataset.size); applySettings(); });
for (const el of $$('[data-speed]')) el.addEventListener('click', () => { settings.speed = Number(el.dataset.speed); applySettings(); });
for (const el of $$('.opt-opacity')) el.addEventListener('input', () => { settings.btnOpacity = Number(el.value); applySettings(); });
for (const el of $$('.opt-fullscreen')) el.addEventListener('click', () => goFullscreen(true));

function goFullscreen(toggle = false) {
  const d = document;
  if (toggle && d.fullscreenElement) { d.exitFullscreen?.(); return; }
  const el = d.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req || d.fullscreenElement) return;
  Promise.resolve(req.call(el, { navigationUI: 'hide' }))
    .then(() => screen.orientation?.lock?.('landscape'))
    .catch(() => { /* navegador não permite: tudo bem */ });
}

// ───────── Telas ─────────
function showScreen(id) {
  for (const s of $$('.screen')) s.classList.toggle('hidden', s.id !== id);
  document.body.classList.toggle('in-game', id === null);
  if (id === null) touch.enabled = true;
  else { touch.enabled = false; touch.releaseAll(); }
}

function toTitle() {
  game.stop();
  for (const el of $$('.overlay')) el.classList.add('hidden');
  ui.show(ui.dialogEl, false);
  document.body.classList.remove('menu-open');
  ui.show($('#hud'), false);
  const save = loadSave();
  $('#btn-continue').classList.toggle('hidden', !save);
  if (save) $('#continue-info').textContent = `${save.profile.name} · ${formatTime(save.playTime)}`;
  $('#new-confirm').classList.add('hidden');
  showScreen('title-screen');
  titleAnim();
}

function formatTime(frames) {
  const m = Math.floor(frames / 3600);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}min`;
}

function play(save) {
  audio.unlock();
  document.activeElement?.blur?.();
  if (input.touchMode || matchMedia('(pointer: coarse)').matches) goFullscreen();
  showScreen(null);
  ui.show($('#hud'), true);
  game.start(save);
  requestAnimationFrame(() => touch.layout());
}

$('#btn-continue').addEventListener('click', () => { const s = loadSave(); if (s) play(s); });
$('#btn-new').addEventListener('click', () => {
  audio.unlock();
  if (loadSave()) { $('#new-confirm').classList.remove('hidden'); return; }
  openCreator();
});
$('#btn-new-yes').addEventListener('click', () => { clearSave(); openCreator(); });
$('#btn-new-no').addEventListener('click', () => $('#new-confirm').classList.add('hidden'));
$('#btn-options').addEventListener('click', () => { audio.unlock(); $('#title-options').classList.toggle('hidden'); });

// ───────── Criação do herói ─────────
const profile = { ...DEFAULT_PROFILE };
const PALETTES = {
  cloak: ['#3a4f8f', '#8f2f3a', '#2f6f4f', '#5b3a8f', '#b8742f', '#c75b8f', '#24232c', '#d9d4c7'],
  hair: ['#f2f2f2', '#f472b6', '#ffd166', '#1a1a24', '#6a4126', '#ef4444', '#38bdf8', '#a855f7'],
  skin: ['#f2cfae', '#ffe0bd', '#efe6da', '#e2b98f', '#c68642', '#8d5524', '#5c3818', '#a8dadc'],
};
const EYE_LABELS = { hetero: 'Ocaso & Aurora', black: 'Preto', blue: 'Azul', red: 'Vermelho', green: 'Verde', gold: 'Dourado' };

function buildCreator() {
  for (const [key, colors] of Object.entries(PALETTES)) {
    const wrap = $(`#pick-${key}`);
    wrap.innerHTML = '';
    for (const c of colors) {
      const b = document.createElement('button');
      b.className = 'swatch' + (profile[key] === c ? ' active' : '');
      b.style.background = c;
      b.setAttribute('aria-label', c);
      b.addEventListener('click', () => { profile[key] = c; audio.play('ui'); buildCreator(); });
      wrap.appendChild(b);
    }
  }
  const eyes = $('#pick-eyes');
  eyes.innerHTML = '';
  for (const [k, label] of Object.entries(EYE_LABELS)) {
    const b = document.createElement('button');
    b.className = 'chip' + (profile.eyes === k ? ' active' : '');
    const [a, c] = EYE_COLORS[k];
    b.innerHTML = `<i style="background:${a}"></i><i style="background:${c}"></i>${label}`;
    b.addEventListener('click', () => { profile.eyes = k; audio.play('ui'); buildCreator(); });
    eyes.appendChild(b);
  }
}

let previewRaf = null;
function previewLoop() {
  const c = $('#preview');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = c.clientWidth, h = c.clientHeight;
  if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  const ctx = c.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, c.width, c.height);
  const t = performance.now() / 16.7;
  const k = (h / 56) * dpr;
  ctx.setTransform(k, 0, 0, k, (w * dpr) / 2, h * dpr * 0.86);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 1, 12, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  const phase = Math.floor(t / 150) % 3;
  const state = phase === 1 ? 'run' : 'idle';
  drawHero(ctx, 0, 0, { profile, facing: 1, state, t });
  previewRaf = requestAnimationFrame(previewLoop);
}

function openCreator() {
  $('#hero-name').value = profile.name;
  buildCreator();
  showScreen('creator-screen');
  cancelAnimationFrame(previewRaf);
  previewLoop();
}

$('#hero-name').addEventListener('input', (e) => { profile.name = e.target.value.trim() || 'Errante'; });
$('#btn-creator-back').addEventListener('click', () => { cancelAnimationFrame(previewRaf); toTitle(); });
$('#btn-start').addEventListener('click', () => {
  cancelAnimationFrame(previewRaf);
  profile.name = ($('#hero-name').value.trim() || 'Errante').slice(0, 14);
  const save = newSave(profile);
  writeSave(save);
  play(save);
});

// ───────── Mouse ─────────
// Esquerdo: ataca mirando no cursor (ou coloca peça no modo construção).
// Direito: ALMA — segure para curar, clique para magia (ou remove peça).
const canvas = $('#game');
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse') game.build.hoverScreen(e.clientX, e.clientY);
});
canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') return;
  if (game.state === 'dialog') { game.advanceDialog(); return; }
  if (game.state === 'banner' && game.bannerTimer <= 0) { game.closeBanner(); return; }
  if (game.state !== 'play') return;
  input.setTouchMode(false);
  e.preventDefault();
  if (game.build.active) { game.build.clickScreen(e.clientX, e.clientY, e.button === 2); return; }
  if (e.button === 0) input.mouseAttack(e.clientX, e.clientY);
  if (e.button === 2) input.setMouse('spell', true);
});
window.addEventListener('pointerup', (e) => {
  if (e.pointerType === 'mouse' && e.button === 2) input.setMouse('spell', false);
});
canvas.addEventListener('wheel', (e) => {
  if (!game.build.active) return;
  e.preventDefault();
  const n = BUILD_ITEMS.length;
  game.build.select((game.build.sel + (e.deltaY > 0 ? 1 : n - 1)) % n);
}, { passive: false });

// Toque no cenário durante o modo construção coloca/remove a peça.
touch.onWorldTap = (x, y) => {
  if (!game.build.active || game.state !== 'play') return false;
  game.build.clickScreen(x, y);
  return true;
};
game.touchLayout = () => touch.layout();

// ───────── Manual dos controles ─────────
function openManual() {
  const tab = input.touchMode ? 'touch' : 'pc';
  for (const b of $$('.manual-tab')) b.classList.toggle('active', b.dataset.tab === tab);
  for (const t of $$('.manual-table')) t.classList.toggle('hidden', t.dataset.tab !== tab);
  ui.show($('#manual-screen'));
}
for (const b of $$('.btn-manual')) b.addEventListener('click', openManual);
for (const b of $$('.manual-tab')) b.addEventListener('click', () => {
  for (const x of $$('.manual-tab')) x.classList.toggle('active', x === b);
  for (const t of $$('.manual-table')) t.classList.toggle('hidden', t.dataset.tab !== b.dataset.tab);
});
$('#btn-manual-close').addEventListener('click', () => ui.show($('#manual-screen'), false));

// ───────── Menus do jogo ─────────
$('#btn-build').addEventListener('click', () => { if (game.state === 'play') game.build.toggle(); });
$('#btn-map').addEventListener('click', () => { if (game.state === 'play') game.openMenu('map'); });
$('#btn-pause').addEventListener('click', () => { if (game.state === 'play') game.openMenu('pause'); });
$('#btn-resume').addEventListener('click', () => game.closeMenu());
$('#btn-pause-map').addEventListener('click', () => { game.closeMenu(); game.openMenu('map'); });
$('#map-screen').addEventListener('click', () => game.closeMenu());
$('#btn-quit').addEventListener('click', () => { game.persist(); toTitle(); });
$('#btn-shop-close').addEventListener('click', () => game.closeShop());
$('#dialog').addEventListener('pointerdown', (e) => { e.stopPropagation(); game.advanceDialog(); });
$('#banner').addEventListener('pointerdown', () => { if (game.state === 'banner' && game.bannerTimer <= 0) game.closeBanner(); });
$('#btn-end-continue').addEventListener('click', () => {
  ui.show($('#ending-screen'), false);
  document.body.classList.remove('menu-open');
  game.state = 'play';
});
$('#btn-end-title').addEventListener('click', () => toTitle());

game.onEnding = () => {
  game.state = 'ending';
  document.body.classList.add('menu-open');
  audio.play('victory');
  $('#end-time').textContent = formatTime(game.save.playTime);
  ui.show($('#ending-screen'));
};

// Pausa automática ao sair do app ou girar para retrato
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (game.state === 'play') game.openMenu('pause');
    game.persist && game.save && game.persist();
    audio.suspend();
  } else audio.resume();
});
const portrait = matchMedia('(orientation: portrait)');
const onOrient = () => { if (portrait.matches && input.touchMode && game.state === 'play') game.openMenu('pause'); };
portrait.addEventListener?.('change', onOrient);
input.onTouchModeChange = () => requestAnimationFrame(() => touch.layout());

// Evita zoom por gesto/duplo toque no iOS
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

// ───────── PWA ─────────
let installEvt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; $('#btn-install').classList.remove('hidden'); });
$('#btn-install').addEventListener('click', async () => {
  if (!installEvt) return;
  installEvt.prompt();
  await installEvt.userChoice;
  installEvt = null;
  $('#btn-install').classList.add('hidden');
});
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => { /* sem offline */ });
}

// ───────── Animação do título ─────────
let titleRaf = null;
function titleAnim() {
  cancelAnimationFrame(titleRaf);
  const c = $('#title-canvas');
  const motes = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 1.5 + 0.5, p: Math.random() * 6 }));
  const loop = () => {
    if ($('#title-screen').classList.contains('hidden')) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (c.width !== Math.round(c.clientWidth * dpr)) { c.width = Math.round(c.clientWidth * dpr); c.height = Math.round(c.clientHeight * dpr); }
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    for (const m of motes) {
      m.p += 0.02; m.y -= 0.0006 * m.s; m.x += Math.sin(m.p) * 0.0004;
      if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
      ctx.fillStyle = `rgba(255,214,150,${0.25 + Math.sin(m.p * 2) * 0.2})`;
      ctx.beginPath(); ctx.arc(m.x * c.width, m.y * c.height, m.s * dpr * 1.3, 0, Math.PI * 2); ctx.fill();
    }
    titleRaf = requestAnimationFrame(loop);
  };
  loop();
}

// Atalho de depuração apenas em ambiente local.
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.theus = game;

applySettings();
toTitle();
window.__theusReady = true;
