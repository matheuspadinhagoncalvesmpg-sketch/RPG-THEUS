// Colisão AABB contra a grade de blocos, eixo por eixo.
import { T, TILE } from './config.js';

const EPS = 0.001;

// body: { x, y, w, h, vx, vy, dropThrough? } em pixels locais da sala.
// Retorna em quais lados houve contato.
export function moveBody(body, room, world, opts = {}) {
  const hit = { left: false, right: false, up: false, down: false };
  const cf = !!opts.confine;

  // Horizontal
  body.x += body.vx;
  const top = Math.floor(body.y / TILE);
  const bottom = Math.floor((body.y + body.h - EPS) / TILE);
  if (body.vx > 0) {
    const col = Math.floor((body.x + body.w - EPS) / TILE);
    for (let r = top; r <= bottom; r++)
      if (world.isSolid(room, col, r, cf)) {
        body.x = col * TILE - body.w;
        body.vx = 0;
        hit.right = true;
        break;
      }
  } else if (body.vx < 0) {
    const col = Math.floor(body.x / TILE);
    for (let r = top; r <= bottom; r++)
      if (world.isSolid(room, col, r, cf)) {
        body.x = (col + 1) * TILE;
        body.vx = 0;
        hit.left = true;
        break;
      }
  }

  // Vertical
  const prevBottom = body.y + body.h;
  body.y += body.vy;
  const left = Math.floor(body.x / TILE);
  const right = Math.floor((body.x + body.w - EPS) / TILE);
  if (body.vy > 0) {
    const row = Math.floor((body.y + body.h - EPS) / TILE);
    for (let c = left; c <= right; c++) {
      let solid = world.isSolid(room, c, row, cf);
      if (!solid && !opts.ignoreOneWay && !body.dropThrough && prevBottom <= row * TILE + EPS) {
        solid = world.tileAt(room, c, row).t === T.ONEWAY;
      }
      if (solid) {
        body.y = row * TILE - body.h;
        body.vy = 0;
        hit.down = true;
        break;
      }
    }
  } else if (body.vy < 0) {
    const row = Math.floor(body.y / TILE);
    for (let c = left; c <= right; c++)
      if (world.isSolid(room, c, row, cf)) {
        body.y = (row + 1) * TILE;
        body.vy = 0;
        hit.up = true;
        break;
      }
  }
  return hit;
}

// Algum bloco sólido logo abaixo dos pés? (para inimigos não caírem de beiradas)
export function groundAhead(body, room, world, dir) {
  const x = dir > 0 ? body.x + body.w + 2 : body.x - 2;
  const tx = Math.floor(x / TILE);
  const ty = Math.floor((body.y + body.h + 2) / TILE);
  if (!room.inside(tx, ty)) return false;
  return world.isSolid(room, tx, ty) || room.tile(tx, ty) === T.ONEWAY;
}

export function wallAhead(body, room, world, dir, confine = false) {
  const x = dir > 0 ? body.x + body.w + 1 : body.x - 1;
  const tx = Math.floor(x / TILE);
  const top = Math.floor(body.y / TILE);
  const bottom = Math.floor((body.y + body.h - 1) / TILE);
  for (let r = top; r <= bottom; r++) if (world.isSolid(room, tx, r, confine)) return true;
  return false;
}

export function standingOnOneWay(body, room, world) {
  const ty = Math.floor((body.y + body.h + 1) / TILE);
  const l = Math.floor(body.x / TILE), r = Math.floor((body.x + body.w - 1) / TILE);
  let oneway = false;
  for (let c = l; c <= r; c++) {
    if (world.isSolid(room, c, ty)) return false;
    if (world.tileAt(room, c, ty).t === T.ONEWAY) oneway = true;
  }
  return oneway;
}

// Retângulo encosta em espinhos? (caixa de dano reduzida, metade inferior do bloco)
export function touchesSpikes(box, room) {
  const l = Math.floor(box.x / TILE), r = Math.floor((box.x + box.w - 1) / TILE);
  const t = Math.floor(box.y / TILE), b = Math.floor((box.y + box.h - 1) / TILE);
  for (let ty = t; ty <= b; ty++)
    for (let tx = l; tx <= r; tx++) {
      if (!room.inside(tx, ty) || room.tile(tx, ty) !== T.SPIKE) continue;
      const sx = tx * TILE + 4, sy = ty * TILE + 14;
      if (box.x < sx + TILE - 8 && box.x + box.w > sx && box.y < sy + TILE - 14 && box.y + box.h > sy) return true;
    }
  return false;
}
