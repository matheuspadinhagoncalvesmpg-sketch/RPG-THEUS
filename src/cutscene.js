// Cenas: telas escuras com texto lento e uma imagem simples, para as reviravoltas da história.
// Cada passo: { bg, glifo, quem, texto }. Toque, clique ou tecla de ação avança.
import { CENAS } from './cenas.js';

const $ = (s) => document.querySelector(s);

export class Cutscene {
  constructor(game) {
    this.game = game;
    this.el = $('#cutscene');
    this.run = null;
  }

  get active() { return !!this.run; }

  play(id, onDone) {
    const steps = CENAS[id];
    if (!steps) { if (onDone) onDone(); return; }
    const g = this.game;
    this.run = { steps, i: 0, chars: 0, onDone, cooldown: 20 };
    g.state = 'cutscene';
    g.ui.setInteract(null);
    document.body.classList.add('menu-open');
    this.el.classList.remove('hidden');
    this.show();
  }

  show() {
    const s = this.run.steps[this.run.i];
    this.el.dataset.bg = s.bg || 'vazio';
    $('#cs-glifo').textContent = s.glifo || '';
    $('#cs-quem').textContent = s.quem || '';
    $('#cs-texto').textContent = '';
    this.run.chars = 0;
    this.run.cooldown = 14;
    // reinicia a animação de entrada
    this.el.classList.remove('cs-in'); void this.el.offsetWidth; this.el.classList.add('cs-in');
  }

  update(inp) {
    const r = this.run;
    if (!r) return;
    const s = r.steps[r.i];
    if (r.cooldown > 0) r.cooldown--;
    if (r.chars < s.texto.length) {
      r.chars = Math.min(s.texto.length, r.chars + 1.1);
      $('#cs-texto').textContent = s.texto.slice(0, Math.floor(r.chars));
      if (Math.floor(r.chars) % 5 === 0) this.game.audio.play('talk');
    }
    this.el.classList.toggle('cs-done', r.chars >= s.texto.length);
    if (inp.pressed.jump || inp.pressed.attack || inp.pressed.interact || inp.pressed.up) this.advance();
  }

  advance() {
    const r = this.run;
    if (!r || r.cooldown > 0) return;
    const s = r.steps[r.i];
    if (r.chars < s.texto.length) { r.chars = s.texto.length; $('#cs-texto').textContent = s.texto; return; }
    if (++r.i >= r.steps.length) return this.end();
    this.show();
  }

  end() {
    const r = this.run;
    this.run = null;
    this.el.classList.add('hidden');
    document.body.classList.remove('menu-open');
    const g = this.game;
    if (g.state === 'cutscene') g.state = 'play';
    g.input.consume('jump'); g.input.consume('attack');
    if (r.onDone) r.onDone();
  }
}
