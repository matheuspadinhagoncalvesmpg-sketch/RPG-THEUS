// Valida o mundo: salas sobrepostas e aberturas de borda sem saída.
// Uso: node tools/check-world.mjs [--print]
import { World } from '../src/world.js';
import { T } from '../src/config.js';

const world = new World();
let problems = 0;
const warn = (m) => { problems++; console.log('⚠ ' + m); };

for (const a of world.rooms)
  for (const b of world.rooms)
    if (a !== b && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y)
      if (a.id < b.id) warn(`sobreposição: ${a.id} x ${b.id}`);

const passable = (t) => t !== T.SOLID && t !== T.BREAK;
for (const r of world.rooms) {
  for (const row of r.rows) if (row.length !== r.w) warn(`${r.id}: linha com largura errada`);
  const edges = [];
  for (let x = 0; x < r.w; x++) { edges.push([x, 0, 0, -1]); edges.push([x, r.h - 1, 0, 1]); }
  for (let y = 0; y < r.h; y++) { edges.push([0, y, -1, 0]); edges.push([r.w - 1, y, 1, 0]); }
  for (const [x, y, dx, dy] of edges) {
    if (r.tile(x, y) === T.SPIKE) continue;
    if (!passable(r.tile(x, y))) continue;
    const n = world.roomAtGlobal(r.x + x + dx, r.y + y + dy);
    if (!n && !(r.sky && dy === -1)) warn(`${r.id}: abertura em (${x},${y}) leva ao vazio`);
  }
}

// Aberturas reais (passagem dos dois lados) para conferir as conexões.
const links = new Set();
for (const r of world.rooms) {
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
    if (!passable(r.tile(x, y))) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (r.inside(x + dx, y + dy)) continue;
      const n = world.roomAtGlobal(r.x + x + dx, r.y + y + dy);
      if (n && passable(n.tile(r.x + x + dx - n.x, r.y + y + dy - n.y))) links.add([r.id, n.id].sort().join(' <-> '));
    }
  }
}
console.log('Conexões:\n  ' + [...links].sort().join('\n  '));

if (process.argv.includes('--print'))
  for (const r of world.rooms) console.log(`\n${r.id} (${r.x},${r.y}) ${r.w}x${r.h}\n` + r.rows.join('\n'));

console.log(problems ? `\n${problems} problema(s)` : '\nMundo OK');
