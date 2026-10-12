// Distância entre fogueiras: quantas salas separam cada sala da fogueira mais próxima,
// e quais fogueiras são realmente necessárias. Uso: node tools/bancos.mjs [--max=3] [--podar]
import { World } from '../src/world.js';
import { T } from '../src/config.js';

const argv = process.argv.slice(2);
const MAX = Number((argv.find((a) => a.startsWith('--max=')) || '').slice(6)) || 3;
const world = new World();
const passable = (t) => t !== T.SOLID && t !== T.BREAK;

// Grafo de salas: duas salas se ligam quando há passagem aberta dos dois lados.
const adj = new Map(world.rooms.map((r) => [r.id, new Set()]));
for (const r of world.rooms) for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
  if (!passable(r.tile(x, y))) continue;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (r.inside(x + dx, y + dy)) continue;
    const n = world.roomAtGlobal(r.x + x + dx, r.y + y + dy);
    if (n && passable(n.tile(r.x + x + dx - n.x, r.y + y + dy - n.y))) { adj.get(r.id).add(n.id); adj.get(n.id).add(r.id); }
  }
}
const benchRooms = () => world.rooms.filter((r) => r.entities.some((e) => e.ch === 'B')).map((r) => r.id);
function dist(from) {
  const d = new Map(from.map((id) => [id, 0])), q = [...from];
  while (q.length) { const id = q.shift(); for (const n of adj.get(id)) if (!d.has(n)) { d.set(n, d.get(id) + 1); q.push(n); } }
  return d;
}
const arenas = world.rooms.filter((r) => r.boss).map((r) => r.id);

function report(benches) {
  const d = dist(benches);
  const far = [...d.entries()].filter(([, v]) => v > MAX).map(([k, v]) => `${k}(${v})`);
  const worst = Math.max(...d.values());
  // fogueira antes de cada arena: alguma sala vizinha da arena tem fogueira
  const semBancoAntes = arenas.filter((a) => ![...adj.get(a)].some((n) => benches.includes(n) || [...adj.get(n)].some((m) => benches.includes(m))));
  return { d, far, worst, semBancoAntes };
}

// Estrutura do mapa: ciclos (laços) e becos sem saída.
{
  const edges = [...adj.values()].reduce((a, v) => a + v.size, 0) / 2;
  const becos = [...adj.entries()].filter(([, v]) => v.size === 1).map(([k]) => k);
  console.log(`Ligações: ${edges} · laços (ciclos independentes): ${edges - world.rooms.length + 1} · becos sem saída: ${becos.length} (${becos.join(', ')})`);
}
const now = benchRooms();
let r = report(now);
console.log(`Salas: ${world.rooms.length} · fogueiras: ${now.length} · pior distância: ${r.worst} salas`);
if (r.far.length) console.log('Salas a mais de ' + MAX + ' salas de uma fogueira: ' + r.far.join(', '));
if (r.semBancoAntes.length) console.log('Arenas sem fogueira por perto: ' + r.semBancoAntes.join(', '));

if (argv.includes('--podar')) {
  // Poda gulosa: tira a fogueira mais "sobrando" enquanto todas as salas continuam a ≤ MAX e as arenas têm fogueira por perto.
  let keep = [...now];
  const score = (id) => { const o = keep.filter((b) => b !== id); const d = dist(o); return Math.max(...d.values()); };
  let changed = true;
  while (changed) {
    changed = false;
    const order = [...keep].sort((a, b) => {
      const da = dist(keep.filter((x) => x !== a)), db = dist(keep.filter((x) => x !== b));
      return Math.max(...da.values()) - Math.max(...db.values()) || a.localeCompare(b);
    });
    for (const id of order) {
      const o = keep.filter((b) => b !== id);
      if (!o.length) continue;
      const rr = report(o);
      if (rr.worst <= MAX && !rr.semBancoAntes.length) { keep = o; changed = true; break; }
    }
  }
  console.log('\nFogueiras mantidas (' + keep.length + '): ' + keep.join(', '));
  console.log('Fogueiras a remover (' + (now.length - keep.length) + '): ' + now.filter((b) => !keep.includes(b)).join(', '));
}
