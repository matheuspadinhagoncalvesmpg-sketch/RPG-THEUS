// Áudio 100% sintetizado (Web Audio): efeitos e trilha ambiente por região.
import { AREAS } from './config.js';

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicVol = 0.5;
    this.area = null;
    this.step = 0;
    this.timer = null;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.55;
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.22 * this.musicVol;
      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 1800;
      this.musicBus.connect(this.musicFilter);
      this.musicFilter.connect(this.master);
      // Eco simples para dar profundidade à trilha.
      const delay = this.ctx.createDelay(1);
      delay.delayTime.value = 0.42;
      const fb = this.ctx.createGain();
      fb.gain.value = 0.35;
      this.musicFilter.connect(delay);
      delay.connect(fb); fb.connect(delay);
      delay.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  tone(freq, { type = 'sine', dur = 0.15, vol = 0.3, slide = 0, attack = 0.005, delay = 0, bus } = {}) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(bus || this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  noise({ dur = 0.15, vol = 0.3, freq = 1200, q = 1, type = 'bandpass', sweep = 1, delay = 0 } = {}) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (sweep !== 1) f.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxBus);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.05);
  }

  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'slash': this.noise({ dur: 0.12, vol: 0.35, freq: 2600, sweep: 0.4, q: 0.8 }); break;
      case 'hit':
        this.noise({ dur: 0.1, vol: 0.45, freq: 900, sweep: 0.5 });
        this.tone(180, { type: 'triangle', dur: 0.12, vol: 0.3, slide: 0.5 });
        break;
      case 'clank': this.tone(1400, { type: 'square', dur: 0.08, vol: 0.12, slide: 0.7 }); this.noise({ dur: 0.08, vol: 0.3, freq: 4000 }); break;
      case 'kill':
        this.noise({ dur: 0.35, vol: 0.4, freq: 600, sweep: 0.3 });
        this.tone(320, { type: 'sine', dur: 0.3, vol: 0.2, slide: 0.4 });
        break;
      case 'jump': this.noise({ dur: 0.08, vol: 0.12, freq: 1800, sweep: 1.6 }); break;
      case 'doubleJump':
        this.noise({ dur: 0.2, vol: 0.18, freq: 1200, sweep: 2.5 });
        this.tone(660, { dur: 0.18, vol: 0.08, slide: 1.5 });
        break;
      case 'land': this.noise({ dur: 0.07, vol: 0.14, freq: 500, sweep: 0.6, type: 'lowpass' }); break;
      case 'dash': this.noise({ dur: 0.22, vol: 0.3, freq: 900, sweep: 3, q: 0.6 }); break;
      case 'wall': this.noise({ dur: 0.1, vol: 0.15, freq: 1400, sweep: 0.6 }); break;
      case 'hurt':
        this.tone(220, { type: 'sawtooth', dur: 0.3, vol: 0.2, slide: 0.4 });
        this.noise({ dur: 0.3, vol: 0.4, freq: 400, sweep: 0.3, type: 'lowpass' });
        break;
      case 'focus': this.tone(330, { dur: 0.9, vol: 0.08, slide: 2, attack: 0.3 }); break;
      case 'heal':
        [0, 4, 7, 12].forEach((n, i) => this.tone(midi(72 + n), { dur: 0.4, vol: 0.12, delay: i * 0.05 }));
        break;
      case 'spell':
        this.noise({ dur: 0.4, vol: 0.35, freq: 700, sweep: 2.5, q: 2 });
        this.tone(200, { type: 'sawtooth', dur: 0.3, vol: 0.12, slide: 2 });
        break;
      case 'geo': this.tone(1800 + Math.random() * 400, { type: 'triangle', dur: 0.12, vol: 0.12 }); break;
      case 'soul': this.tone(880, { dur: 0.1, vol: 0.05, slide: 1.3 }); break;
      case 'break':
        this.noise({ dur: 0.5, vol: 0.5, freq: 300, sweep: 0.4, type: 'lowpass' });
        this.tone(90, { type: 'triangle', dur: 0.4, vol: 0.3, slide: 0.5 });
        break;
      case 'rock': this.noise({ dur: 0.12, vol: 0.3, freq: 1100, sweep: 0.5 }); this.tone(1500, { type: 'triangle', dur: 0.1, vol: 0.08 }); break;
      case 'pickup':
        [0, 7, 12, 16, 19, 24].forEach((n, i) => this.tone(midi(64 + n), { type: 'triangle', dur: 0.6, vol: 0.12, delay: i * 0.09 }));
        break;
      case 'bench':
        [0, 7, 12].forEach((n, i) => this.tone(midi(60 + n), { dur: 1.2, vol: 0.1, delay: i * 0.12, attack: 0.05 }));
        break;
      case 'door':
        this.noise({ dur: 0.6, vol: 0.4, freq: 200, sweep: 0.5, type: 'lowpass' });
        this.tone(60, { type: 'square', dur: 0.4, vol: 0.12 });
        break;
      case 'roar':
        this.tone(110, { type: 'sawtooth', dur: 1.2, vol: 0.25, slide: 0.5, attack: 0.1 });
        this.noise({ dur: 1.2, vol: 0.35, freq: 500, sweep: 0.3, type: 'lowpass' });
        break;
      case 'shock': this.noise({ dur: 0.35, vol: 0.45, freq: 250, sweep: 0.5, type: 'lowpass' }); break;
      case 'tele': this.tone(900, { dur: 0.25, vol: 0.1, slide: 0.3 }); this.tone(1200, { dur: 0.25, vol: 0.06, slide: 0.3, delay: 0.05 }); break;
      case 'orb': this.tone(520, { type: 'triangle', dur: 0.15, vol: 0.08, slide: 1.4 }); break;
      case 'spit': this.noise({ dur: 0.15, vol: 0.25, freq: 700, sweep: 0.6, q: 3 }); break;
      case 'ui': this.tone(660, { type: 'triangle', dur: 0.08, vol: 0.1 }); break;
      case 'talk': this.tone(300 + Math.random() * 120, { type: 'triangle', dur: 0.05, vol: 0.05 }); break;
      case 'death':
        this.tone(160, { type: 'sawtooth', dur: 1.5, vol: 0.2, slide: 0.3 });
        this.noise({ dur: 1.5, vol: 0.3, freq: 800, sweep: 0.2 });
        break;
      case 'victory':
        [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => this.tone(midi(60 + n), { type: 'triangle', dur: 1.5, vol: 0.12, delay: i * 0.14, attack: 0.02 }));
        break;
    }
  }

  // ───── Trilha ambiente generativa ─────
  setMusic(areaKey, intense = false) {
    this.intense = intense;
    if (this.area === areaKey) return;
    this.area = areaKey;
    this.step = 0;
    if (!this.timer) this.timer = setInterval(() => this.musicTick(), 250);
  }

  musicTick() {
    if (!this.ctx || this.muted || !this.area || this.ctx.state !== 'running') return;
    const m = AREAS[this.area].music;
    const s = this.step++;
    const bar = Math.floor(s / 16);
    const chord = m.chords[bar % m.chords.length];
    const bus = this.musicBus;
    if (s % 16 === 0) {
      for (const n of chord) {
        this.tone(midi(m.root + n - 12), { type: 'sine', dur: 4.6, vol: 0.18, attack: 1.2, bus });
        this.tone(midi(m.root + n - 12) * 1.004, { type: 'triangle', dur: 4.6, vol: 0.06, attack: 1.5, bus });
      }
      this.tone(midi(m.root + chord[0] - 24), { type: 'sine', dur: 4, vol: 0.2, attack: 0.4, bus });
    }
    const density = this.intense ? 0.55 : 0.22;
    if (Math.random() < density && s % 2 === 0) {
      const deg = m.scale[Math.floor(Math.random() * m.scale.length)];
      const oct = Math.random() < 0.3 ? 24 : 12;
      this.tone(midi(m.root + deg + oct), { type: this.intense ? 'triangle' : 'sine', dur: 1.6, vol: 0.1, attack: 0.01, bus });
    }
    if (this.intense && s % 4 === 0) this.tone(midi(m.root - 24), { type: 'triangle', dur: 0.3, vol: 0.22, slide: 0.5, bus });
  }
}
