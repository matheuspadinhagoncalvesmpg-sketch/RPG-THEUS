// Entrada unificada: teclado, controle (gamepad) e toque com multitoque.

export const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'attack', 'dash', 'spell', 'interact', 'map', 'pause', 'build'];

const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyZ: 'jump', KeyK: 'jump',
  KeyX: 'attack', KeyJ: 'attack',
  KeyC: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash', KeyL: 'dash',
  KeyV: 'spell', KeyF: 'spell', KeyI: 'spell',
  KeyE: 'interact', Enter: 'interact',
  KeyM: 'map', Tab: 'map',
  Escape: 'pause', KeyP: 'pause',
  KeyB: 'build',
};

const PAD_BUTTONS = { 0: 'jump', 2: 'attack', 1: 'spell', 5: 'dash', 7: 'dash', 3: 'interact', 4: 'build', 9: 'pause', 8: 'map', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };

export class Input {
  constructor() {
    this.held = {};
    this.pressed = {};
    this.released = {};
    this.prev = {};
    this.queuedPress = {};
    this.queuedRelease = {};
    this.keys = {};
    this.touch = {};
    this.pad = {};
    this.mouse = {};
    this.aim = null; // ponto da tela clicado com o mouse (mira do ataque)
    this.vibration = true;
    this.touchMode = false;
    this.onTouchModeChange = null;
    this.bindKeyboard();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      const a = KEYMAP[e.code];
      if (!a) return;
      if (e.target && e.target.tagName === 'INPUT') return;
      e.preventDefault();
      if (e.repeat) return;
      if (!this.keys[a]) this.queuedPress[a] = true;
      this.keys[a] = (this.keys[a] || 0) + 1;
      this.setTouchMode(false);
    });
    window.addEventListener('keyup', (e) => {
      const a = KEYMAP[e.code];
      if (!a || !this.keys[a]) return;
      this.keys[a] = Math.max(0, this.keys[a] - 1);
      if (!this.keys[a]) this.queuedRelease[a] = true;
    });
    window.addEventListener('blur', () => this.clearAll());
  }

  clearAll() {
    this.keys = {};
    this.touch = {};
    this.mouse = {};
    for (const a of ACTIONS) if (this.prev[a]) this.queuedRelease[a] = true;
  }

  setTouchMode(on) {
    if (this.touchMode === on) return;
    this.touchMode = on;
    document.body.classList.toggle('touch-mode', on);
    if (this.onTouchModeChange) this.onTouchModeChange(on);
  }

  // Mouse: clique esquerdo ataca mirando no cursor; direito segura a ALMA.
  mouseAttack(x, y) {
    this.aim = { x, y };
    this.queuedPress.attack = true;
  }

  setMouse(action, on) {
    if (!!this.mouse[action] === on) return;
    this.mouse[action] = on;
    if (on) this.queuedPress[action] = true;
    else this.queuedRelease[action] = true;
  }

  setTouch(action, on) {
    if (!!this.touch[action] === on) return;
    this.touch[action] = on;
    if (on) this.queuedPress[action] = true;
    else this.queuedRelease[action] = true;
  }

  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = {};
    for (const gp of pads) {
      if (!gp) continue;
      for (const [i, a] of Object.entries(PAD_BUTTONS)) if (gp.buttons[i] && gp.buttons[i].pressed) p[a] = true;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (ax < -0.4) p.left = true;
      if (ax > 0.4) p.right = true;
      if (ay < -0.6) p.up = true;
      if (ay > 0.6) p.down = true;
    }
    this.pad = p;
  }

  // Chamado uma vez por passo de simulação.
  poll() {
    this.pollGamepad();
    for (const a of ACTIONS) {
      const raw = !!(this.keys[a] || this.touch[a] || this.pad[a] || this.mouse[a]);
      this.pressed[a] = (raw && !this.prev[a]) || !!this.queuedPress[a];
      this.released[a] = (!raw && this.prev[a]) || !!this.queuedRelease[a];
      this.held[a] = raw;
      this.prev[a] = raw;
    }
    this.queuedPress = {};
    this.queuedRelease = {};
  }

  // Consome um "pressionou" (evita que o mesmo toque sirva para duas coisas).
  consume(a) { this.pressed[a] = false; }

  vibrate(ms) {
    if (this.vibration && this.touchMode && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) { /* sem suporte */ }
    }
  }
}

// ───────────── Controles de toque ─────────────
// Uma camada única recebe todos os dedos: metade esquerda = joystick flutuante,
// metade direita = botões testados por distância (dá para deslizar entre eles).
export class TouchControls {
  constructor(input, root) {
    this.input = input;
    this.root = root;
    this.base = root.querySelector('#joy-base');
    this.knob = root.querySelector('#joy-knob');
    this.buttons = [...root.querySelectorAll('.tbtn')];
    this.pointers = new Map();
    this.joyId = null;
    this.joyOrigin = { x: 0, y: 0 };
    this.radius = 56;
    this.enabled = false;
    this.onWorldTap = null; // retorna true se o toque foi usado (ex.: construir)

    root.addEventListener('pointerdown', (e) => this.down(e), { passive: false });
    root.addEventListener('pointermove', (e) => this.move(e), { passive: false });
    root.addEventListener('pointerup', (e) => this.up(e), { passive: false });
    root.addEventListener('pointercancel', (e) => this.up(e), { passive: false });
    root.addEventListener('lostpointercapture', (e) => this.up(e));
    root.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('resize', () => this.layout());
    window.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') input.setTouchMode(true); }, true);
  }

  layout() {
    this.rects = this.buttons.map((b) => {
      const r = b.getBoundingClientRect();
      return { el: b, act: b.dataset.act, x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
    });
    const br = this.base.getBoundingClientRect();
    this.radius = Math.max(40, br.width * 0.45);
    this.restJoy();
  }

  restJoy() {
    this.base.style.transform = '';
    this.knob.style.transform = '';
    this.root.classList.remove('joy-active');
  }

  buttonAt(x, y) {
    if (!this.rects) this.layout();
    let best = null, bestD = Infinity;
    for (const b of this.rects) {
      if (b.el.offsetParent === null || b.el.classList.contains('hidden')) continue;
      const d = Math.hypot(x - b.x, y - b.y);
      if (d < b.r * 1.45 && d < bestD) { best = b; bestD = d; }
    }
    return best;
  }

  down(e) {
    if (!this.enabled) return;
    e.preventDefault();
    try { this.root.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    const w = window.innerWidth;
    const btn = this.buttonAt(e.clientX, e.clientY);
    const h = window.innerHeight;
    const joyZone = e.clientX < w * 0.42 && e.clientY > h * 0.38;
    if (btn) {
      this.pointers.set(e.pointerId, { kind: 'btn', act: btn.act, el: btn.el });
      this.press(btn);
    } else if (this.onWorldTap && !joyZone && this.onWorldTap(e.clientX, e.clientY)) {
      // toque usado pelo modo construção
    } else if (e.clientX < w * 0.5 && this.joyId === null) {
      this.joyId = e.pointerId;
      this.joyOrigin = { x: e.clientX, y: e.clientY };
      this.pointers.set(e.pointerId, { kind: 'joy' });
      const br = this.base.getBoundingClientRect();
      const cx = br.left + br.width / 2, cy = br.top + br.height / 2;
      this.base.style.transform = `translate(${e.clientX - cx}px, ${e.clientY - cy}px)`;
      this.knob.style.transform = `translate(${e.clientX - cx}px, ${e.clientY - cy}px)`;
      this.knobBase = { x: e.clientX - cx, y: e.clientY - cy };
      this.root.classList.add('joy-active');
    }
  }

  move(e) {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    e.preventDefault();
    if (p.kind === 'joy') {
      let dx = e.clientX - this.joyOrigin.x, dy = e.clientY - this.joyOrigin.y;
      const d = Math.hypot(dx, dy);
      const r = this.radius;
      if (d > r) {
        // A base acompanha o dedo quando ele passa do limite.
        const ex = dx - (dx / d) * r, ey = dy - (dy / d) * r;
        this.joyOrigin.x += ex; this.joyOrigin.y += ey;
        this.knobBase.x += ex; this.knobBase.y += ey;
        this.base.style.transform = `translate(${this.knobBase.x}px, ${this.knobBase.y}px)`;
        dx = (dx / d) * r; dy = (dy / d) * r;
      }
      this.knob.style.transform = `translate(${this.knobBase.x + dx}px, ${this.knobBase.y + dy}px)`;
      const nx = dx / r, ny = dy / r;
      this.input.setTouch('left', nx < -0.32);
      this.input.setTouch('right', nx > 0.32);
      this.input.setTouch('up', ny < -0.6);
      this.input.setTouch('down', ny > 0.6);
    } else {
      const btn = this.buttonAt(e.clientX, e.clientY);
      if (btn && btn.act !== p.act) {
        this.release(p, e.pointerId);
        p.act = btn.act; p.el = btn.el;
        this.press(btn);
      }
    }
  }

  up(e) {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    this.pointers.delete(e.pointerId);
    if (p.kind === 'joy') {
      this.joyId = null;
      for (const a of ['left', 'right', 'up', 'down']) this.input.setTouch(a, false);
      this.restJoy();
    } else this.release(p);
  }

  press(btn) {
    btn.el.classList.add('pressed');
    this.input.setTouch(btn.act, true);
    this.input.vibrate(8);
  }

  release(p, selfId = null) {
    // Só solta se nenhum outro dedo segura o mesmo botão.
    for (const [id, q] of this.pointers) if (id !== selfId && q.kind === 'btn' && q.act === p.act) return;
    p.el.classList.remove('pressed');
    this.input.setTouch(p.act, false);
  }

  releaseAll() {
    for (const [id, p] of this.pointers) {
      if (p.kind === 'btn') p.el.classList.remove('pressed');
      this.pointers.delete(id);
    }
    this.joyId = null;
    this.restJoy();
    for (const a of ACTIONS) this.input.setTouch(a, false);
  }
}
