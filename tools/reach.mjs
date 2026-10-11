// Testa o mundo com a física REAL do herói (src/player.js): explora todos os lugares
// onde o herói consegue pousar, para cada conjunto de habilidades, e acusa
//   • lugares inalcançáveis (itens, fogueiras, chefes, salas)
//   • armadilhas: lugares onde dá para chegar mas não dá para voltar a nenhuma fogueira
//   • fogueiras dentro de arenas de chefe e outros erros de projeto.
// Uso: node tools/reach.mjs [--classe=guardiao] [--mapa]
import { World } from '../src/world.js';
import { T, TILE, PHYS, CLASSES } from '../src/config.js';
import { Player } from '../src/player.js';
import { touchesSpikes } from '../src/physics.js';

const argv = process.argv.slice(2);
const classe = (argv.find((a) => a.startsWith('--classe=')) || '').slice(9) || 'guerreiro';
const margin = Number((argv.find((a) => a.startsWith('--margem=')) || '').slice(9)) || 0.92;
// Margem de segurança: um jogador comum não faz o salto perfeito. Reduz os saltos em ~8%.
PHYS.jump *= margin; PHYS.doubleJump *= margin; PHYS.wallJumpY *= margin; PHYS.dashSpeed *= margin;
const world = new World();

// ───────── Grade global (todas as salas num só mapa)
const minX = Math.min(...world.rooms.map((r) => r.x)), minY = Math.min(...world.rooms.map((r) => r.y));
const maxX = Math.max(...world.rooms.map((r) => r.x + r.w)), maxY = Math.max(...world.rooms.map((r) => r.y + r.h));
const W = maxX - minX + 2, H = maxY - minY + 2; // +2: margem de vazio
const ox = -minX + 1, oy = -minY + 1;
const tiles = new Uint8Array(W * H).fill(T.SOLID);
for (const r of world.rooms)
  for (let ty = 0; ty < r.h; ty++) for (let tx = 0; tx < r.w; tx++) {
    let t = r.tile(tx, ty);
    if (t === T.BREAK || t === T.DOOR) t = T.EMPTY; // quebráveis e portões: o jogador abre
    tiles[(r.y + ty + oy) * W + (r.x + tx + ox)] = t;
  }
const gr = {
  x: 0, y: 0, w: W, h: H, tiles,
  inside: (tx, ty) => tx >= 0 && ty >= 0 && tx < W && ty < H,
  tile: (tx, ty) => tiles[ty * W + tx],
};
const gworld = {
  tileAt: (room, tx, ty) => ({ t: gr.inside(tx, ty) ? tiles[ty * W + tx] : T.SOLID, r: null }),
  isSolid: (room, tx, ty) => !gr.inside(tx, ty) || tiles[ty * W + tx] === T.SOLID,
};

// ───────── Jogador de mentira com a física verdadeira
const noop = () => {};
const input = { held: {}, pressed: {}, released: {}, aim: null, consume(a) { this.pressed[a] = false; } };
const game = {
  input, room: gr, world: gworld, save: { abilities: {}, weapon: 'errante', nail: 1, profile: { classe } },
  audio: { play: noop }, particles: { add: noop, burst: noop, dust: noop, ring: noop },
  ai: { record: noop }, build: { active: false }, hasCharm: () => false, soul: 0, masks: 5,
  screenToWorld: () => ({ x: 0, y: 0 }), playerAttack: noop, spikeHit: noop, spawnSpell: noop,
};
const pl = new Player();
const feet = (p) => ({ kx: Math.floor((p.x + p.w / 2) / 16), ky: Math.round((p.y + p.h) / TILE) });
const keyOf = (p) => { const k = feet(p); return k.ky * 100000 + k.kx; };
const hitsSpike = (p) => touchesSpikes({ x: p.x, y: p.y, w: p.w, h: p.h }, gr);

function macros(ab) {
  const list = [];
  for (const dir of [-1, 1]) list.push({ walk: true, dir });
  for (const dir of [-1, 0, 1]) for (const swim of [6, 10, 15]) list.push({ swim, dir });
  for (const dir of [-1, 0, 1]) list.push({ drop: true, dir });
  for (const dir of [-1, 0, 1]) for (const rel of [5, 99]) {
    const dbls = ab.doubleJump ? [0, 12, 26] : [0];
    const dashes = ab.dash && dir ? [0, 8, 22] : [0];
    const walls = ab.wallJump && dir ? [0, 16] : [0];
    for (const dbl of dbls) for (const dash of dashes) for (const wall of walls) list.push({ dir, rel, dbl, dash, wall });
  }
  return list;
}

// Executa um movimento a partir de (x, y) e devolve os pontos de pouso.
function run(from, m, ab) {
  game.save.abilities = ab;
  pl.reset(from.x, from.y);
  pl.onGround = true; pl.coyote = PHYS.coyote;
  const out = [];
  let air = false, last = keyOf(pl);
  const maxF = m.walk ? 150 : 420;
  for (let f = 0; f < maxF; f++) {
    input.pressed = {}; input.released = {};
    input.held = { left: m.dir < 0, right: m.dir > 0, jump: false };
    if (m.drop) {
      input.held.down = true;
      if (f === 0) input.pressed.jump = true;
    } else if (m.swim) {
      input.held.jump = f % m.swim < 3;
      if (f % m.swim === 0) input.pressed.jump = true;
    } else if (!m.walk) {
      input.held.jump = f < m.rel;
      if (f === 0) { input.pressed.jump = true; }
      if (f === m.rel && m.rel < 99) input.released.jump = true;
      if (m.dbl && f === m.dbl) { input.pressed.jump = true; input.held.jump = true; }
      if (m.dbl && f > m.dbl) input.held.jump = true;
      if (m.dash && f === m.dash) input.pressed.dash = true;
      if (m.wall && f > 8 && (f - 8) % m.wall === 0) { input.pressed.jump = true; input.held.jump = true; }
      if (m.wall && f > 8) input.held.jump = true;
    }
    pl.update(game);
    if (hitsSpike(pl)) break;
    if (pl.y > H * TILE) break;
    if (!pl.onGround) air = true;
    if (pl.onGround && (air || m.walk || m.swim)) {
      const k = keyOf(pl);
      if (k !== last) { out.push({ x: pl.x, y: pl.y }); last = k; }
      if (!m.walk && !m.swim && air && f >= 5) break;
      if ((m.walk || m.swim) && out.length > 14) break;
    }
  }
  return out;
}

// ───────── Exploração (BFS) para um conjunto de habilidades
function explore(ab, start) {
  const states = new Map(), edges = new Map();
  const q = [start];
  states.set(keyOf({ x: start.x, y: start.y, w: 16, h: 28 }), start);
  const ms = macros(ab);
  while (q.length) {
    const s = q.shift();
    const sk = keyOf({ x: s.x, y: s.y, w: 16, h: 28 });
    for (const m of ms) {
      for (const n of run(s, m, ab)) {
        const nk = keyOf({ x: n.x, y: n.y, w: 16, h: 28 });
        if (nk === sk) continue;
        (edges.get(sk) || edges.set(sk, new Set()).get(sk)).add(nk);
        if (!states.has(nk)) { states.set(nk, n); q.push(n); }
      }
    }
  }
  return { states, edges };
}

// ───────── Entidades do mundo
const ents = [];
for (const r of world.rooms)
  for (const e of r.entities)
    ents.push({ ...e, room: r.id, gx: (r.x + e.tx + ox) * TILE + 16, gy: (r.y + e.ty + oy) * TILE + 16, rm: r });
const startEnt = ents.find((e) => e.ch === 'S');
const startPos = { x: startEnt.gx - 8, y: (startEnt.gy + 16) - 28 };
// "Pousa-se" ao lado do ponto de partida (cai até o chão)
{ pl.reset(startPos.x, startPos.y); game.save.abilities = {}; for (let i = 0; i < 60; i++) { input.pressed = {}; input.released = {}; input.held = {}; pl.update(game); } startPos.x = pl.x; startPos.y = pl.y; }

const near = (st, e, rx = 56, ry = 80) => {
  for (const s of st.values()) if (Math.abs(s.x + 8 - e.gx) <= rx && Math.abs(s.y + 14 - e.gy) <= ry) return true;
  return false;
};

const SUBSETS = [];
for (let m = 0; m < 8; m++) SUBSETS.push({ dash: !!(m & 1), wallJump: !!(m & 2), doubleJump: !!(m & 4), name: ['dash', 'parede', 'duplo'].filter((_, i) => m & (1 << i)).join('+') || 'nada' });
const results = SUBSETS.map((ab) => ({ ab, ...explore(ab, startPos) }));
const full = results[7];
const cnt = (ab) => (ab.dash ? 1 : 0) + (ab.wallJump ? 1 : 0) + (ab.doubleJump ? 1 : 0);

let problems = 0;
const warn = (m) => { problems++; console.log('⚠ ' + m); };
console.log(`Classe: ${classe}  |  estados alcançáveis: ` + results.map((r) => `${r.ab.name}=${r.states.size}`).join(', '));

// 1) Entidades importantes: mínimo de habilidades para alcançar
const KIND = { A: 'habilidade', B: 'fogueira', M: 'vaso de vida', C: 'amuleto', K: 'chefe/mini-chefe', S: 'início', N: 'NPC', L: 'placa', k: 'cristal', o: 'minério', w: 'árvore', r: 'pedra', $: 'geo' };
console.log('\nEntidades (menor conjunto de habilidades que alcança):');
const unreachable = [];
for (const e of ents) {
  if (!'ABMCKN$'.includes(e.ch)) continue;
  let best = null;
  for (const r of results) if (near(r.states, e) && (!best || cnt(r.ab) < cnt(best.ab))) best = r;
  const label = `${(KIND[e.ch] || e.ch).padEnd(16)} ${e.room} (${e.tx},${e.ty})`;
  if (!best) { unreachable.push(e); warn(`INALCANÇÁVEL ${label}`); } else if (!argv.includes('--quiet')) console.log(`  ${label}  ← ${best.ab.name}`);
}

// 2) Fogueiras dentro de arena de chefe
for (const r of world.rooms) {
  if (!r.boss && !r.miniBoss) continue;
  for (const e of r.entities) if (e.ch === 'B') warn(`fogueira DENTRO da arena de chefe: ${r.id} (${e.tx},${e.ty})`);
}

// 3) Armadilhas: estados alcançáveis de onde nenhuma fogueira/início é alcançável
function trapReport(res, label) {
  const hubs = new Set();
  for (const e of ents) if (e.ch === 'B' || e.ch === 'S') {
    for (const [k, s] of res.states) if (Math.abs(s.x + 8 - e.gx) <= 80 && Math.abs(s.y + 14 - e.gy) <= 80) hubs.add(k);
  }
  const rev = new Map();
  for (const [a, set] of res.edges) for (const b of set) (rev.get(b) || rev.set(b, []).get(b)).push(a);
  const ok = new Set(hubs), q = [...hubs];
  while (q.length) { const k = q.pop(); for (const p of rev.get(k) || []) if (!ok.has(p)) { ok.add(p); q.push(p); } }
  const bad = [...res.states.keys()].filter((k) => !ok.has(k));
  if (!bad.length) return;
  // agrupa por sala
  const byRoom = {};
  for (const k of bad) {
    const s = res.states.get(k);
    const gtx = Math.floor((s.x + 8) / TILE) - ox, gty = Math.floor((s.y + 14) / TILE) - oy;
    const r = world.roomAtGlobal(gtx, gty);
    const id = r ? r.id : '(vazio)';
    (byRoom[id] = byRoom[id] || []).push([gtx - (r ? r.x : 0), gty - (r ? r.y : 0)]);
  }
  for (const [id, pts] of Object.entries(byRoom)) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    warn(`ARMADILHA (${label}): ${pts.length} pontos sem volta em ${id}  x ${Math.min(...xs)}-${Math.max(...xs)}, y ${Math.min(...ys)}-${Math.max(...ys)}`);
  }
}
trapReport(full, 'todas as habilidades');
trapReport(results[0], 'sem habilidades');
trapReport(results[1], 'dash');
trapReport(results[3], 'dash+parede');

// 4) Salas nunca visitadas
for (const r of world.rooms) {
  const seen = [...full.states.values()].some((s) => {
    const gtx = Math.floor((s.x + 8) / TILE) - ox, gty = Math.floor((s.y + 14) / TILE) - oy;
    return gtx >= r.x && gty >= r.y && gtx < r.x + r.w && gty < r.y + r.h;
  });
  if (!seen) warn(`sala nunca alcançada: ${r.id}`);
}
console.log(problems ? `\n${problems} problema(s)` : '\nSem problemas de alcance');
