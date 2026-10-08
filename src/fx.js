// Partículas: poeira, faíscas, alma, anéis de impacto.
import { rand } from './util.js';

const MAX = 600;

export class Particles {
  constructor() { this.list = []; }

  clear() { this.list.length = 0; }

  add(p) {
    if (this.list.length >= MAX) return;
    const life = p.life ?? 30;
    this.list.push({
      x: p.x, y: p.y, vx: p.vx ?? 0, vy: p.vy ?? 0,
      life, max: life, size: p.size ?? 3, color: p.color ?? '#fff',
      grav: p.grav ?? 0, drag: p.drag ?? 0.96, type: p.type ?? 'dot',
      glow: !!p.glow, grow: p.grow ?? 0,
    });
  }

  burst(x, y, n, o = {}) {
    const sp = o.spread ?? 0.5;
    for (let i = 0; i < n; i++) {
      const a = o.angle != null ? o.angle + rand(-sp, sp) : rand(0, Math.PI * 2);
      const s = rand(o.speedMin ?? 1, o.speed ?? 4);
      this.add({
        x: x + rand(-(o.jitter ?? 0), o.jitter ?? 0), y: y + rand(-(o.jitter ?? 0), o.jitter ?? 0),
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: rand(o.lifeMin ?? 15, o.life ?? 30), size: rand(o.sizeMin ?? 1.5, o.size ?? 3.5),
        color: Array.isArray(o.color) ? o.color[i % o.color.length] : o.color,
        grav: o.grav ?? 0, drag: o.drag ?? 0.92, type: o.type ?? 'dot', glow: o.glow,
      });
    }
  }

  dust(x, y, dir = 0, n = 6, color = 'rgba(220,210,200,0.6)') {
    for (let i = 0; i < n; i++)
      this.add({
        x: x + rand(-6, 6), y: y - rand(0, 3), vx: (dir || rand(-1, 1)) * rand(0.3, 1.8), vy: -rand(0.2, 1),
        life: rand(14, 26), size: rand(2, 4), color, drag: 0.92, type: 'puff', grow: 0.15,
      });
  }

  ring(x, y, color = '#fff', size = 6, grow = 2.2, life = 16) {
    this.add({ x, y, life, size, color, type: 'ring', grow });
  }

  update() {
    const l = this.list;
    for (let i = l.length - 1; i >= 0; i--) {
      const p = l[i];
      p.vx *= p.drag; p.vy *= p.drag;
      p.vy += p.grav;
      p.x += p.vx; p.y += p.vy;
      p.size += p.grow;
      if (--p.life <= 0) { l[i] = l[l.length - 1]; l.pop(); }
    }
  }

  draw(ctx) {
    for (const pass of [false, true]) {
      if (pass) ctx.globalCompositeOperation = 'lighter';
      for (const p of this.list) {
        if (p.glow !== pass) continue;
        const k = p.life / p.max;
        ctx.globalAlpha = Math.min(1, k * 1.5);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        switch (p.type) {
          case 'spark':
            ctx.lineWidth = p.size * 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5);
            ctx.stroke();
            break;
          case 'ring':
            ctx.lineWidth = 2 * k + 0.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.stroke();
            break;
          case 'puff':
            ctx.globalAlpha *= 0.6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            break;
          default:
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.3, p.size * (0.4 + k * 0.6)), 0, Math.PI * 2);
            ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
