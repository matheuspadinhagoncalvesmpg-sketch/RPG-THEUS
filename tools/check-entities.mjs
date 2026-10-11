// Confere se as entidades estão em lugares válidos: fora de blocos sólidos e (as de chão) apoiadas em algo.
import { World } from '../src/world.js';
import { T } from '../src/config.js';
const world = new World();
let problems = 0;
const GROUND = 'cBNLSKhgpwrokv$aV';
for (const r of world.rooms) {
  for (const e of r.entities) {
    const t = r.tile(e.tx, e.ty);
    if (t === T.SOLID || t === T.BREAK || t === T.DOOR) { console.log(`⚠ ${r.id} ${e.ch}(${e.tx},${e.ty}) dentro de bloco sólido`); problems++; continue; }
    if (GROUND.includes(e.ch) && e.ch !== '$') {
      const below = r.inside(e.tx, e.ty + 1) ? r.tile(e.tx, e.ty + 1) : T.SOLID;
      if (below === T.EMPTY || below === T.WATER && !'K'.includes(e.ch)) { if (below === T.EMPTY) { console.log(`⚠ ${r.id} ${e.ch}(${e.tx},${e.ty}) flutuando (nada embaixo)`); problems++; } }
      if (below === T.SPIKE) { console.log(`⚠ ${r.id} ${e.ch}(${e.tx},${e.ty}) sobre espinhos`); problems++; }
    }
  }
  if (r.boss) {
    const k = r.entities.find((e) => e.ch === 'K');
    if (!k) { console.log(`⚠ ${r.id}: sala de chefe sem K`); problems++; }
    if (!r.rows.some((row) => row.includes('D'))) { console.log(`⚠ ${r.id}: sala de chefe sem portão`); problems++; }
    if (r.entities.some((e) => e.ch === 'B')) { console.log(`⚠ ${r.id}: fogueira dentro da arena do chefe`); problems++; }
  }
}
console.log(problems ? `\n${problems} problema(s)` : 'Entidades OK');
