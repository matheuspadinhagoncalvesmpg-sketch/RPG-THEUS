/**
 * ===================================================================
 * HORA DA AVENTURA: CRÔNICAS DE OOO - RPG MULTIPLAYER + IA GEMINI
 * Dungeons Infinitas, Forja de Itens e NPCs Inteligentes
 * ===================================================================
 */

// ===================================================================
// 1. SISTEMA DE ÁUDIO RETRO SINTETIZADO (WEB AUDIO API)
// ===================================================================
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicPlaying = false;
    this.musicTimer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'square', duration = 0.1, gainVal = 0.1, pitchDecay = 0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (pitchDecay !== 0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + pitchDecay), now + duration);
      }

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  swordSwing() { this.playTone(320, 'triangle', 0.12, 0.15, -180); }
  magicCast() { this.playTone(550, 'sine', 0.22, 0.14, 300); }
  arrowShoot() { this.playTone(600, 'sawtooth', 0.08, 0.1, -350); }
  enemyHit() { this.playTone(180, 'square', 0.09, 0.16, -90); }
  playerHurt() { this.playTone(140, 'sawtooth', 0.2, 0.2, -60); }

  potionDrink() {
    if (!this.enabled) return;
    this.init();
    [400, 520, 680, 850].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.08, 0.1), idx * 50);
    });
  }

  coinPickup() {
    this.playTone(987, 'square', 0.06, 0.1);
    setTimeout(() => this.playTone(1318, 'square', 0.1, 0.1), 60);
  }

  itemPickup() {
    [523, 659, 783, 1046].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.1, 0.12), i * 70);
    });
  }

  portalWhoosh() {
    this.playTone(200, 'sawtooth', 0.4, 0.15, 600);
  }

  levelUp() {
    const notes = [440, 554, 659, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.15, 0.15), i * 110);
    });
  }

  specialSkill() {
    const notes = [300, 450, 600, 750, 900];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.14, 0.15), i * 60);
    });
  }

  bossDefeat() {
    const notes = [523, 659, 783, 1046, 1318];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.22, 0.18), i * 140);
    });
  }

  startBgm() {
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    this.init();

    const melody = [
      { f: 523.25, d: 200 }, { f: 587.33, d: 200 },
      { f: 659.25, d: 200 }, { f: 783.99, d: 350 },
      { f: 659.25, d: 200 }, { f: 523.25, d: 400 },
      { f: 440.00, d: 250 }, { f: 523.25, d: 450 },
    ];
    let noteIndex = 0;

    const playNext = () => {
      if (!this.musicPlaying || !this.enabled) return;
      const n = melody[noteIndex];
      this.playTone(n.f, 'triangle', n.d / 1000, 0.04);
      noteIndex = (noteIndex + 1) % melody.length;
      this.musicTimer = setTimeout(playNext, n.d + 60);
    };

    playNext();
  }

  stopBgm() {
    this.musicPlaying = false;
    if (this.musicTimer) clearTimeout(this.musicTimer);
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopBgm();
    else this.startBgm();
    return this.enabled;
  }
}

const sounds = new SoundSystem();

// ===================================================================
// 2. CONFIGURAÇÃO E DADOS DAS CLASSES
// ===================================================================
const CLASS_CONFIGS = {
  warrior: {
    name: "Guerreiro",
    quote: '"Matemático! Minha espada dourada vai salvar o dia!"',
    hp: 120, mp: 40, atk: 18, spd: 3.2,
    attackType: 'melee',
    skillName: 'Ataque Furacão',
    skillIcon: '🌀',
    skillCooldown: 4000,
    mpCost: 15
  },
  mage: {
    name: "Mago",
    quote: '"Pela magia das estrelas e do chiclete cósmico!"',
    hp: 80, mp: 100, atk: 14, spd: 3.0,
    attackType: 'magic',
    skillName: 'Explosão Cósmica',
    skillIcon: '🔮',
    skillCooldown: 3500,
    mpCost: 20
  },
  archer: {
    name: "Arqueiro",
    quote: '"Na mosca! Rápido como o vento das Colinas de Ooo!"',
    hp: 95, mp: 60, atk: 15, spd: 3.8,
    attackType: 'ranged',
    skillName: 'Chuva de Flechas',
    skillIcon: '🏹',
    skillCooldown: 3000,
    mpCost: 18
  },
  vampire: {
    name: "Vampiro",
    quote: '"Eu sou a rainha dos vampiros! Esse som vai te arrebentar!"',
    hp: 105, mp: 70, atk: 17, spd: 3.5,
    attackType: 'vampire',
    skillName: 'Acorde Sônico',
    skillIcon: '🎸',
    skillCooldown: 3200,
    mpCost: 16
  }
};

const heroProfile = {
  name: "Finnelson",
  gender: "male",
  classKey: "warrior",
  outfitColor: "#3aa3e3",
  hatColor: "#ffffff",
  skinColor: "#ffe0bd",
  eyes: "hetero",
  faceDetail: "none",
  accessory: "backpack",
  pet: "gunther"
};

// ===================================================================
// 3. RENDERIZADOR DE SPRITES PIXEL ART
// ===================================================================
class PixelArtRenderer {
  static drawHero(ctx, x, y, options = {}) {
    const scale = options.scale || 3;
    const facing = options.facing || 'down';
    const isMoving = options.isMoving || false;
    const animFrame = options.animFrame || 0;
    const isAttacking = options.isAttacking || false;
    const attackProgress = options.attackProgress || 0;

    const {
      gender = 'male',
      classKey = 'warrior',
      outfitColor = '#3aa3e3',
      hatColor = '#ffffff',
      skinColor = '#ffe0bd',
      eyes = 'hetero',
      faceDetail = 'none',
      accessory = 'backpack'
    } = options.profile || heroProfile;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    if (facing === 'left') ctx.scale(-1, 1);

    const bob = isMoving ? Math.sin(animFrame * 0.4) * 1.5 : 0;

    // Sombra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 7 * scale, 7 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Capa/Mochila de trás
    if (accessory === 'backpack' && facing === 'up') {
      ctx.fillStyle = '#2e8b57';
      ctx.fillRect(-5 * scale, (-5 + bob) * scale, 10 * scale, 8 * scale);
    }
    if (accessory === 'cape') {
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(-6 * scale, (-3 + bob) * scale, 12 * scale, 10 * scale);
    }

    // Pernas
    const leg1 = isMoving ? Math.sin(animFrame * 0.5) * 3 : 0;
    const leg2 = isMoving ? -Math.sin(animFrame * 0.5) * 3 : 0;
    ctx.fillStyle = classKey === 'vampire' ? '#0f172a' : '#1e3a8a';
    ctx.fillRect(-4 * scale, (2 + bob) * scale, 3 * scale, 4 * scale);
    ctx.fillRect(1 * scale, (2 + bob) * scale, 3 * scale, 4 * scale);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect((-4 + (leg1 > 0 ? 1 : 0)) * scale, (5 + leg1) * scale, 3 * scale, 2 * scale);
    ctx.fillRect((1 + (leg2 > 0 ? 1 : 0)) * scale, (5 + leg2) * scale, 3 * scale, 2 * scale);

    // Tronco / Roupa
    ctx.fillStyle = outfitColor;
    ctx.fillRect(-5 * scale, (-5 + bob) * scale, 10 * scale, 7 * scale);
    
    // Saia ou túnica para gênero feminino
    if (gender === 'female') {
      ctx.fillStyle = outfitColor;
      ctx.fillRect(-5.5 * scale, (1 + bob) * scale, 11 * scale, 3.5 * scale);
    }

    ctx.fillStyle = '#3a2510';
    ctx.fillRect(-5 * scale, (1 + bob) * scale, 10 * scale, 1.5 * scale);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-1.5 * scale, (1 + bob) * scale, 3 * scale, 1.5 * scale);

    if (accessory === 'backpack' && facing !== 'up') {
      ctx.fillStyle = '#3fb950';
      ctx.fillRect(-7 * scale, (-4 + bob) * scale, 3 * scale, 6 * scale);
    }

    // Cabelo / Capuz
    ctx.fillStyle = hatColor;
    ctx.fillRect(-6 * scale, (-15 + bob) * scale, 12 * scale, 10 * scale);

    if (classKey === 'warrior') {
      // Cabelo branco aventureiro pontudo / capuz guerreiro
      ctx.fillStyle = hatColor;
      ctx.fillRect(-7 * scale, (-18 + bob) * scale, 3.5 * scale, 5 * scale);
      ctx.fillRect(3.5 * scale, (-18 + bob) * scale, 3.5 * scale, 5 * scale);
      ctx.fillRect(-1.5 * scale, (-19 + bob) * scale, 3 * scale, 5 * scale);
      ctx.fillRect(-6.5 * scale, (-13 + bob) * scale, 2 * scale, 5 * scale);
      ctx.fillRect(4.5 * scale, (-13 + bob) * scale, 2 * scale, 5 * scale);
    } else if (classKey === 'mage') {
      // Cabelo rosa curto com franjinha e corte chanel
      ctx.fillStyle = hatColor;
      ctx.fillRect(-6.5 * scale, (-16 + bob) * scale, 13 * scale, 11 * scale);
      ctx.fillRect(-7.5 * scale, (-11 + bob) * scale, 2.5 * scale, 6 * scale);
      ctx.fillRect(5 * scale, (-11 + bob) * scale, 2.5 * scale, 6 * scale);
      // Tiara mística dourada
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-3 * scale, (-17 + bob) * scale, 6 * scale, 2 * scale);
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(-1 * scale, (-18 + bob) * scale, 2 * scale, 2 * scale);
    } else if (classKey === 'archer') {
      // Capuz com pluma ágil
      ctx.fillStyle = '#10b981';
      ctx.fillRect(3 * scale, (-19 + bob) * scale, 3 * scale, 5 * scale);
    } else if (classKey === 'vampire') {
      // Cabelo preto longo de rockstar estilo Marceline
      ctx.fillStyle = hatColor;
      ctx.fillRect(-7 * scale, (-16 + bob) * scale, 14 * scale, 12 * scale);
      ctx.fillRect(-8 * scale, (-8 + bob) * scale, 3 * scale, 14 * scale);
      ctx.fillRect(5 * scale, (-8 + bob) * scale, 3 * scale, 14 * scale);
    }

    // Rosto
    if (facing !== 'up') {
      ctx.fillStyle = skinColor;
      ctx.fillRect(-4 * scale, (-12 + bob) * scale, 8 * scale, 6 * scale);

      // Cores dos olhos (com suporte a Heterocromia: Vermelho & Azul)
      let leftEyeColor = '#0f172a';
      let rightEyeColor = '#0f172a';

      if (eyes === 'hetero') {
        leftEyeColor = '#ef4444'; // Olho esquerdo Vermelho
        rightEyeColor = '#38bdf8'; // Olho direito Azul
      } else if (eyes === 'blue') {
        leftEyeColor = '#38bdf8'; rightEyeColor = '#38bdf8';
      } else if (eyes === 'red') {
        leftEyeColor = '#ef4444'; rightEyeColor = '#ef4444';
      } else if (eyes === 'green') {
        leftEyeColor = '#22c55e'; rightEyeColor = '#22c55e';
      }

      // Olhos desenhados
      ctx.fillStyle = leftEyeColor;
      ctx.fillRect(-2.5 * scale, (-10 + bob) * scale, 1.5 * scale, 2 * scale);
      ctx.fillStyle = rightEyeColor;
      ctx.fillRect(1 * scale, (-10 + bob) * scale, 1.5 * scale, 2 * scale);

      // Brilho dos olhos
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2.5 * scale, (-10 + bob) * scale, 0.8 * scale, 0.8 * scale);
      ctx.fillRect(1 * scale, (-10 + bob) * scale, 0.8 * scale, 0.8 * scale);

      // Cílios femininos sutis
      if (gender === 'female') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-3.2 * scale, (-10.5 + bob) * scale, 1 * scale, 0.8 * scale);
        ctx.fillRect(2.2 * scale, (-10.5 + bob) * scale, 1 * scale, 0.8 * scale);
      }

      // Detalhes faciais (Sardas, Cicatriz, Blush)
      const showFreckles = faceDetail === 'freckles' || (classKey === 'mage' && faceDetail === 'none');
      if (showFreckles) {
        // Sardas delicadas nas bochechas
        ctx.fillStyle = '#b45309';
        ctx.fillRect(-3.2 * scale, (-7.5 + bob) * scale, 0.8 * scale, 0.8 * scale);
        ctx.fillRect(-2.2 * scale, (-7 + bob) * scale, 0.8 * scale, 0.8 * scale);
        ctx.fillRect(1.5 * scale, (-7 + bob) * scale, 0.8 * scale, 0.8 * scale);
        ctx.fillRect(2.5 * scale, (-7.5 + bob) * scale, 0.8 * scale, 0.8 * scale);
      } else if (faceDetail === 'scar') {
        // Cicatriz guerreira
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-2 * scale, (-11.5 + bob) * scale, 0.8 * scale, 3.5 * scale);
      } else if (faceDetail === 'blush') {
        // Blush doce
        ctx.fillStyle = 'rgba(244, 114, 182, 0.7)';
        ctx.fillRect(-3.5 * scale, (-7.5 + bob) * scale, 1.8 * scale, 1.2 * scale);
        ctx.fillRect(1.8 * scale, (-7.5 + bob) * scale, 1.8 * scale, 1.2 * scale);
      }

      // Boca
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(-1.5 * scale, (-6.5 + bob) * scale, 3 * scale, 1 * scale);

      if (classKey === 'vampire') {
        // Caninos pontudos vampíricos
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2 * scale, (-5.5 + bob) * scale, 1 * scale, 1.5 * scale);
        ctx.fillRect(1 * scale, (-5.5 + bob) * scale, 1 * scale, 1.5 * scale);
      }
    }

    // Armas
    const atkAngle = isAttacking ? Math.sin(attackProgress * Math.PI) * 1.2 : 0;

    if (classKey === 'warrior') {
      ctx.save();
      ctx.translate(4 * scale, (-1 + bob) * scale);
      if (isAttacking) ctx.rotate(-0.5 + atkAngle * 1.5);
      ctx.fillStyle = '#3a2510'; ctx.fillRect(-1 * scale, 0, 2 * scale, 4 * scale);
      ctx.fillStyle = '#f59e0b'; ctx.fillRect(-3 * scale, -2 * scale, 6 * scale, 2 * scale);
      ctx.fillStyle = '#fef08a'; ctx.fillRect(-1.5 * scale, -13 * scale, 3 * scale, 11 * scale);
      ctx.restore();
    } else if (classKey === 'mage') {
      ctx.save();
      ctx.translate(5 * scale, (-2 + bob) * scale);
      if (isAttacking) ctx.rotate(-0.3 + atkAngle);
      ctx.fillStyle = '#78350f'; ctx.fillRect(-1 * scale, -3 * scale, 2 * scale, 14 * scale);
      ctx.fillStyle = '#38bdf8'; ctx.fillRect(-3 * scale, -8 * scale, 6 * scale, 5 * scale);
      ctx.restore();
    } else if (classKey === 'archer') {
      ctx.save();
      ctx.translate(4 * scale, (-2 + bob) * scale);
      if (isAttacking) ctx.rotate(-0.2 + atkAngle);
      ctx.fillStyle = '#92400e'; ctx.fillRect(0, -9 * scale, 2 * scale, 14 * scale);
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-2 * scale, -8 * scale, 1 * scale, 12 * scale);
      ctx.restore();
    } else if (classKey === 'vampire') {
      // BAIXO-MACHADO VERMELHO DA MARCELINE
      ctx.save();
      ctx.translate(5 * scale, (-1 + bob) * scale);
      if (isAttacking) ctx.rotate(-0.4 + atkAngle * 1.8);
      // Lâminas de machado vermelhas
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-5 * scale, -3 * scale, 10 * scale, 7 * scale);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-4 * scale, -1 * scale, 8 * scale, 3 * scale);
      // Braço do baixo
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-1 * scale, -14 * scale, 2 * scale, 16 * scale);
      // Cordas prateadas
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-0.5 * scale, -12 * scale, 1 * scale, 12 * scale);
      ctx.restore();
    }

    ctx.restore();
  }

  static drawPetGunther(ctx, x, y, animTime) {
    const scale = 2.2;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    const waddle = Math.sin(animTime * 8) * 1.5;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 6 * scale, 5 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corpinho preto do Pinguim
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(0, (0 + waddle) * scale, 5 * scale, 6.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Barriguinha branca
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, (1 + waddle) * scale, 3.2 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Asas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6 * scale, (-1 + waddle) * scale, 2 * scale, 4 * scale);
    ctx.fillRect(4 * scale, (-1 + waddle) * scale, 2 * scale, 4 * scale);

    // Olhos
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2.5 * scale, (-4 + waddle) * scale, 2 * scale, 2.5 * scale);
    ctx.fillRect(0.5 * scale, (-4 + waddle) * scale, 2 * scale, 2.5 * scale);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-1.5 * scale, (-3.5 + waddle) * scale, 1 * scale, 1.5 * scale);
    ctx.fillRect(1.5 * scale, (-3.5 + waddle) * scale, 1 * scale, 1.5 * scale);

    // Bico laranja
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-1 * scale, (-1.5 + waddle) * scale, 2 * scale, 2 * scale);

    // Patinhas
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-3 * scale, (5 + waddle) * scale, 2.5 * scale, 1.5 * scale);
    ctx.fillRect(0.5 * scale, (5 + waddle) * scale, 2.5 * scale, 1.5 * scale);

    ctx.restore();
  }

  static drawMonster(ctx, m, animTime) {
    const scale = m.scale || 2.5;
    ctx.save();
    ctx.translate(Math.round(m.x), Math.round(m.y));

    if (m.hurtTimer > 0) ctx.filter = 'brightness(2.5) drop-shadow(0 0 5px #ef4444)';

    if (m.type === 'slime') {
      const squish = Math.sin(animTime * 6 + m.id) * 0.18;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(0, 10 * scale, (8 + squish * 4) * scale, 3 * scale, 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = m.color || '#ec4899';
      ctx.beginPath(); ctx.ellipse(0, (2 - squish * 4) * scale, (8 + squish * 3) * scale, (7 - squish * 4) * scale, 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-3 * scale, (0 - squish * 4) * scale, 2 * scale, 2.5 * scale);
      ctx.fillRect(2 * scale, (0 - squish * 4) * scale, 2 * scale, 2.5 * scale);
    } else if (m.type === 'skeleton') {
      const wobble = Math.sin(animTime * 4 + m.id) * 1.5;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(0, 12 * scale, 7 * scale, 3 * scale, 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-5 * scale, (-12 + wobble) * scale, 10 * scale, 8 * scale);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-3.5 * scale, (-9 + wobble) * scale, 2 * scale, 2 * scale);
      ctx.fillRect(1.5 * scale, (-9 + wobble) * scale, 2 * scale, 2 * scale);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-1.5 * scale, (-4 + wobble) * scale, 3 * scale, 8 * scale);
      ctx.fillRect(-4 * scale, (-2 + wobble) * scale, 8 * scale, 1.5 * scale);
    } else if (m.type === 'mushroom') {
      const hop = Math.abs(Math.sin(animTime * 5 + m.id)) * 5;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(0, (-2 - hop) * scale, 9 * scale, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-4 * scale, (-2 - hop) * scale, 8 * scale, 7 * scale);
    } else if (m.type === 'ghost') {
      const float = Math.sin(animTime * 3 + m.id) * 3;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath(); ctx.ellipse(0, 12 * scale, 6 * scale, 2.5 * scale, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = m.color && m.color !== '#f8fafc' ? m.color : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(0, (-4 + float) * scale, 8 * scale, Math.PI, 0);
      ctx.lineTo(8 * scale, (8 + float) * scale);
      for (let k = 3; k >= -3; k--) {
        ctx.lineTo((k * 2.6) * scale, (8 + float + (k % 2 ? 2.5 : 0)) * scale);
      }
      ctx.lineTo(-8 * scale, (8 + float) * scale);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-4 * scale, (-5 + float) * scale, 2.5 * scale, 3.5 * scale);
      ctx.fillRect(1.5 * scale, (-5 + float) * scale, 2.5 * scale, 3.5 * scale);
      ctx.fillRect(-2 * scale, (1 + float) * scale, 4 * scale, 1.5 * scale);
    } else if (m.type === 'icegolem') {
      const stomp = Math.abs(Math.sin(animTime * 3 + m.id)) * 1.5;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(0, 13 * scale, 10 * scale, 3.5 * scale, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(-9 * scale, (-6 - stomp) * scale, 18 * scale, 17 * scale);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-12 * scale, (-4 - stomp) * scale, 4 * scale, 12 * scale);
      ctx.fillRect(8 * scale, (-4 - stomp) * scale, 4 * scale, 12 * scale);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(-6 * scale, (-14 - stomp) * scale, 12 * scale, 9 * scale);
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(-4 * scale, (-11 - stomp) * scale, 2.5 * scale, 2.5 * scale);
      ctx.fillRect(1.5 * scale, (-11 - stomp) * scale, 2.5 * scale, 2.5 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-7 * scale, (-4 - stomp) * scale, 3 * scale, 1.5 * scale);
    } else if (m.type === 'boss') {
      const squish = Math.sin(animTime * 3) * 0.15;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(0, 16 * scale, (16 + squish * 4) * scale, 5 * scale, 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = m.color || '#9333ea';
      ctx.beginPath(); ctx.ellipse(0, (2 - squish * 4) * scale, (15 + squish * 3) * scale, (13 - squish * 4) * scale, 0, 0, Math.PI * 2); ctx.fill();
      // Coroa
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-8 * scale, (-15 - squish * 4) * scale, 16 * scale, 4 * scale);
      ctx.beginPath();
      ctx.moveTo(-8 * scale, (-15 - squish * 4) * scale);
      ctx.lineTo(-4 * scale, (-22 - squish * 4) * scale);
      ctx.lineTo(0, (-15 - squish * 4) * scale);
      ctx.lineTo(4 * scale, (-22 - squish * 4) * scale);
      ctx.lineTo(8 * scale, (-15 - squish * 4) * scale);
      ctx.fill();
    }

    const barW = Math.max(26, m.maxHp * 0.6);
    const hpPct = Math.max(0, m.hp / m.maxHp);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-barW / 2, -18 * scale, barW, 5);
    ctx.fillStyle = m.isBoss ? '#f59e0b' : '#ef4444';
    ctx.fillRect(-barW / 2 + 1, -18 * scale + 1, (barW - 2) * hpPct, 3);

    ctx.restore();
  }

  static drawNPC(ctx, npc, animTime) {
    const scale = 3;
    ctx.save();
    ctx.translate(Math.round(npc.x), Math.round(npc.y));

    const bob = Math.sin(animTime * 3 + npc.id) * 1.5;

    if (npc.role === 'jake') {
      ctx.fillStyle = '#ffd028';
      ctx.beginPath(); ctx.ellipse(0, (-2 + bob) * scale, 7 * scale, 8 * scale, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-3.5 * scale, (-5 + bob) * scale, 3 * scale, 3.5 * scale, 0, 0, Math.PI * 2);
      ctx.ellipse(3.5 * scale, (-5 + bob) * scale, 3 * scale, 3.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.ellipse(-3 * scale, (-4.5 + bob) * scale, 2 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
      ctx.ellipse(3 * scale, (-4.5 + bob) * scale, 2 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5b700';
      ctx.beginPath(); ctx.ellipse(0, (-1 + bob) * scale, 4 * scale, 2.5 * scale, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(-1.5 * scale, (-2.5 + bob) * scale, 3 * scale, 2 * scale);
    } else if (npc.role === 'bmo') {
      ctx.fillStyle = '#5eead4'; ctx.fillRect(-6 * scale, (-10 + bob) * scale, 12 * scale, 14 * scale);
      ctx.fillStyle = '#115e59'; ctx.fillRect(-4.5 * scale, (-8 + bob) * scale, 9 * scale, 6 * scale);
      ctx.fillStyle = '#ccfbf1';
      ctx.fillRect(-3 * scale, (-6 + bob) * scale, 1.5 * scale, 1.5 * scale);
      ctx.fillRect(1.5 * scale, (-6 + bob) * scale, 1.5 * scale, 1.5 * scale);
    } else if (npc.role === 'bubblegum') {
      // Princesa Jujuba
      ctx.fillStyle = '#ec4899'; // Cabelo rosa chiclete
      ctx.beginPath(); ctx.ellipse(0, (-8 + bob) * scale, 8 * scale, 12 * scale, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fbcfe8'; // Rosto doce
      ctx.fillRect(-4 * scale, (-12 + bob) * scale, 8 * scale, 6 * scale);
      ctx.fillStyle = '#f59e0b'; // Coroa dourada
      ctx.fillRect(-3 * scale, (-16 + bob) * scale, 6 * scale, 4 * scale);
    } else if (npc.role === 'iceking') {
      // Rei Gelado
      ctx.fillStyle = '#38bdf8'; // Túnica azul
      ctx.fillRect(-6 * scale, (-8 + bob) * scale, 12 * scale, 16 * scale);
      ctx.fillStyle = '#ffffff'; // Barba branca longa
      ctx.beginPath(); ctx.moveTo(-6 * scale, (-3 + bob) * scale);
      ctx.lineTo(0, (10 + bob) * scale); ctx.lineTo(6 * scale, (-3 + bob) * scale); ctx.fill();
      ctx.fillStyle = '#f59e0b'; // Coroa de rubis
      ctx.fillRect(-4 * scale, (-17 + bob) * scale, 8 * scale, 5 * scale);
    } else if (npc.role === 'marceline') {
      // Marceline a Rainha dos Vampiros
      const floatBob = Math.sin(animTime * 4) * 3;
      // Cabelo preto longo
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-6 * scale, (-18 + floatBob) * scale, 12 * scale, 22 * scale);
      // Pele pálida
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-3.5 * scale, (-14 + floatBob) * scale, 7 * scale, 6 * scale);
      // Olhos vermelhos
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-2 * scale, (-12 + floatBob) * scale, 1.5 * scale, 2 * scale);
      ctx.fillRect(1 * scale, (-12 + floatBob) * scale, 1.5 * scale, 2 * scale);
      // Roupa cinza
      ctx.fillStyle = '#475569';
      ctx.fillRect(-3 * scale, (-8 + floatBob) * scale, 6 * scale, 10 * scale);
      // Baixo-machado vermelho
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(3 * scale, (-4 + floatBob) * scale, 6 * scale, 6 * scale);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4.5 * scale, (-12 + floatBob) * scale, 1.5 * scale, 14 * scale);
    }

    // Balão de fala de IA se tiver
    if (npc.speechMsg && npc.speechTimer > 0) {
      ctx.font = 'bold 9px Fredoka, sans-serif';
      const tw = ctx.measureText(npc.speechMsg).width;
      const bw = Math.min(220, tw + 14);
      const bh = 22;
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-bw / 2, (-36 + bob) * scale, bw, bh, 6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#854d0e';
      ctx.textAlign = 'center';
      ctx.fillText(npc.speechMsg.substring(0, 35) + (npc.speechMsg.length > 35 ? '...' : ''), 0, (-22 + bob) * scale);
    }

    ctx.restore();
  }
}

// ===================================================================
// 3.5 DADOS DO MUNDO: BIOMAS, MISSÕES, FALAS
// ===================================================================
const BIOMES = {
  grass:  { name: 'Colinas de Ooo',        colors: ['#79cc3b', '#72c235'], mini: '#79cc3b' },
  candy:  { name: 'Reino Doce',            colors: ['#fbcfe8', '#f7bfdd'], mini: '#f9a8d4' },
  ice:    { name: 'Reino Gelado',          colors: ['#dbeafe', '#cde3fb'], mini: '#bfdbfe' },
  forest: { name: 'Floresta Assombrada',   colors: ['#2f6b3a', '#2a6034'], mini: '#2f6b3a' },
  ruins:  { name: 'Ruínas dos Esqueletos', colors: ['#a8a29e', '#9c968f'], mini: '#a8a29e' }
};

const QUESTS = [
  { title: 'Doce Dilema',         desc: 'Derrote 6 Slimes de Doce',            kind: 'kill',  target: 'slime',    need: 6, gold: 60,   exp: 40 },
  { title: 'Cogumelos Chatos',    desc: 'Derrote 5 Cogumelos Saltitantes',     kind: 'kill',  target: 'mushroom', need: 5, gold: 90,   exp: 70 },
  { title: 'Hora do Portal',      desc: 'Entre no Portal da Dungeon',          kind: 'floor', need: 1,                 gold: 70,   exp: 60 },
  { title: 'Ossos do Ofício',     desc: 'Derrote 6 Esqueletos (leste)',        kind: 'kill',  target: 'skeleton', need: 6, gold: 160,  exp: 140 },
  { title: 'Floresta Assombrada', desc: 'Derrote 6 Fantasmas (sul)',           kind: 'kill',  target: 'ghost',    need: 6, gold: 200,  exp: 180 },
  { title: 'Reino Gelado',        desc: 'Derrote 4 Golems de Gelo (nordeste)', kind: 'kill',  target: 'icegolem', need: 4, gold: 260,  exp: 240 },
  { title: 'Rei Gelatina',        desc: 'Derrote o Rei Gelatina Doce',         kind: 'boss',  need: 1,                 gold: 400,  exp: 400 },
  { title: 'Mergulho Profundo',   desc: 'Chegue ao Andar 3 da Dungeon',        kind: 'floor', need: 3,                 gold: 500,  exp: 500 },
  { title: 'Lenda de Ooo',        desc: 'Chegue ao Andar 6 da Dungeon',        kind: 'floor', need: 6,                 gold: 1000, exp: 1200 }
];

const NPC_TALK = {
  jake: { avatar: '🐶', lines: [
    "Matemático, irmão! Pegue baús e derrote monstros pra ficar forte!",
    "Dica de ouro: o sanduíche dá velocidade e cura por 45 segundos!",
    "Itens melhores que o seu são equipados sozinhos. Os piores viram moedas!"
  ] },
  bmo: { avatar: '🎮', lines: ["Beep boop! Bem-vindo à loja do BMO!"] },
  bubblegum: { avatar: '👸', lines: [] },
  iceking: { avatar: '🤴', lines: [
    "Gunther, pare de me desobedecer! Os Golems de Gelo são meus melhores amigos... eram.",
    "Alguém me chamou? Eu só queria um amigo pra tocar bateria!"
  ] },
  marceline: { avatar: '🧛', lines: [
    "Tá com medo do escuro? Eu adoro. Mas cuidado com os fantasmas da floresta.",
    "Quer uma dica? Dreno de vida é o melhor remédio. Rock n roll!"
  ] }
};

const SAVE_KEY = 'ooo_save_v1';

// ===================================================================
// 4. MOTOR PRINCIPAL DO JOGO
// ===================================================================
class GameEngine {
  static loadSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; }
  }

  getBiome(x, y) {
    if (x > 1750 && y < 1000) return 'ice';
    if (y > 1400) return 'forest';
    if (x > 850 && x <= 1750 && y < 620) return 'candy';
    if (x > 1500 && y >= 1000) return 'ruins';
    return 'grass';
  }

  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.running = false;
    this.keys = {};

    this.worldWidth = 2400;
    this.worldHeight = 1800;
    this.camera = { x: 0, y: 0 };
    this.screenShake = 0;

    this.hero = null;
    this.currentFloor = 0; // 0 = Ooo, 1+ = Dungeons

    this.socket = null;
    this.isMultiplayer = false;
    this.selfId = null;
    this.otherPlayers = new Map();
    this.lastNetworkSync = 0;

    this.monsters = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.npcs = [];
    this.chests = [];
    this.decorations = [];
    this.worldDrops = [];

    // Portal Cósmico
    this.portal = { x: 950, y: 380, radius: 35 };

    this.lastTime = performance.now();
    this.animTime = 0;

    this.gold = 0;
    this.exp = 0;
    this.level = 1;
    this.expToNext = 50;
    this.potions = 3;
    this.sandwiches = 1;
    this.sandwichBuffTimer = 0;
    this.equippedItem = null;

    // Pet Gunther
    this.petX = 320;
    this.petY = 350;

    // Joystick Virtual Touch para Celular
    this.joystick = { active: false, dx: 0, dy: 0, touchId: null };
    this.isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this.isSolo = false;
    this.paused = false;
    this.dungeon = null;
    this.worldChests = null;
    this.portalCooldown = 0;
    this.nearNpc = null;
    this.currentBiome = 'grass';
    this.kills = {};
    this.questIndex = 0;
    this.questProgress = 0;
    this.bestFloor = 0;
    this.openedChests = [];
    this.lastSave = 0;
    this.holdAttack = false;
    this.dashTimer = 0;
    this.dashCd = 0;
    this.dashDir = { x: 0, y: 1 };
    this.enemyProjectiles = [];
    this.dayTime = 0;

    this.initWorldDecorations();
    this.initNPCs();
    this.initChests();
    this.initWebSocket();
    this.initMobileControls();
    this.initShop();
    this.resizeCanvas();
    this.minimap = document.getElementById('minimap');
    this.mmCtx = this.minimap ? this.minimap.getContext('2d') : null;

    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.resizeCanvas(), 100);
    });
  }

  resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper || !this.canvas) return;

    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    if (w > 0 && h > 0) {
      // Ajusta resolução do canvas para coincidir proporcionalmente sem distorcer
      if (window.innerWidth <= 860 || this.isTouch) {
        // Modo Mobile: resolução proporcional à tela
        const aspect = w / h;
        this.canvas.height = 480;
        this.canvas.width = Math.round(480 * aspect);
      } else {
        this.canvas.width = 800;
        this.canvas.height = 520;
      }
    }
  }

  initMobileControls() {
    const zone = document.getElementById('virtual-joystick-zone');
    const stick = document.getElementById('virtual-joystick-stick');
    const base = document.getElementById('virtual-joystick-base');

    // Joystick flutuante: aparece onde o polegar encostar
    if (zone && stick && base) {
      const maxRadius = 42;
      let startX = 0, startY = 0;

      const updateStick = (clientX, clientY) => {
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        const dist = Math.hypot(deltaX, deltaY);
        const clamped = Math.min(dist, maxRadius);
        const nx = dist ? deltaX / dist : 0;
        const ny = dist ? deltaY / dist : 0;
        stick.style.transform = `translate(${nx * clamped}px, ${ny * clamped}px)`;
        this.joystick.dx = nx * (clamped / maxRadius);
        this.joystick.dy = ny * (clamped / maxRadius);
      };

      const reset = () => {
        this.joystick.active = false;
        this.joystick.dx = 0; this.joystick.dy = 0;
        this.joystick.touchId = null;
        stick.style.transform = 'translate(0px, 0px)';
        base.classList.remove('active');
        base.style.left = ''; base.style.top = ''; base.style.bottom = '';
      };

      zone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this.joystick.active) return;
        const touch = e.changedTouches[0];
        this.joystick.active = true;
        this.joystick.touchId = touch.identifier;
        const zr = zone.getBoundingClientRect();
        startX = touch.clientX; startY = touch.clientY;
        base.style.left = `${touch.clientX - zr.left - base.offsetWidth / 2}px`;
        base.style.top = `${touch.clientY - zr.top - base.offsetHeight / 2}px`;
        base.style.bottom = 'auto';
        base.classList.add('active');
        updateStick(touch.clientX, touch.clientY);
      }, { passive: false });

      zone.addEventListener('touchmove', (e) => {
        if (!this.joystick.active) return;
        e.preventDefault();
        for (const touch of e.changedTouches) {
          if (touch.identifier === this.joystick.touchId) { updateStick(touch.clientX, touch.clientY); break; }
        }
      }, { passive: false });

      const end = (e) => {
        for (const touch of e.changedTouches) {
          if (touch.identifier === this.joystick.touchId) { reset(); break; }
        }
      };
      zone.addEventListener('touchend', end, { passive: false });
      zone.addEventListener('touchcancel', end, { passive: false });
    }

    // Helper: botão que reage ao toque (e ao mouse, para testes no PC)
    const bindButton = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      let touching = false;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault(); touching = true; el.classList.add('pressed'); onDown();
      }, { passive: false });
      const up = (e) => { e.preventDefault(); touching = false; el.classList.remove('pressed'); if (onUp) onUp(); };
      el.addEventListener('touchend', up, { passive: false });
      el.addEventListener('touchcancel', up, { passive: false });
      el.addEventListener('mousedown', (e) => { if (!touching) { el.classList.add('pressed'); onDown(); } });
      el.addEventListener('mouseup', () => { el.classList.remove('pressed'); if (onUp) onUp(); });
      el.addEventListener('mouseleave', () => { el.classList.remove('pressed'); if (onUp) onUp(); });
    };

    bindButton('btn-touch-attack',
      () => { if (this.currentDialog) { this.closeDialog(); return; } this.holdAttack = true; this.performBasicAttack(); },
      () => { this.holdAttack = false; });
    bindButton('btn-touch-skill', () => this.performSpecialSkill());
    bindButton('btn-touch-dash', () => this.performDash());
    bindButton('btn-touch-potion', () => this.usePotion());
    bindButton('btn-touch-sandwich', () => this.eatSandwich());
    bindButton('btn-touch-talk', () => this.talkToNpc(this.nearNpc));

    const btnChat = document.getElementById('btn-touch-chat');
    if (btnChat) {
      btnChat.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const chatContainer = document.getElementById('chat-container');
        const chatInput = document.getElementById('chat-input');
        if (chatContainer) {
          chatContainer.classList.toggle('mobile-collapsed');
          if (!chatContainer.classList.contains('mobile-collapsed') && chatInput) chatInput.focus();
        }
      }, { passive: false });
    }

    // Tela cheia + orientação horizontal
    const fsBtn = document.getElementById('fullscreen-btn');
    if (fsBtn) {
      fsBtn.addEventListener('click', async () => {
        try {
          if (document.fullscreenElement) { await document.exitFullscreen(); return; }
          await document.documentElement.requestFullscreen();
          if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape');
        } catch (e) {}
        setTimeout(() => this.resizeCanvas(), 200);
      });
      if (!document.documentElement.requestFullscreen) fsBtn.style.display = 'none';
    }

    // Evita zoom por toque duplo e menu de contexto no celular
    document.addEventListener('contextmenu', (e) => { if (this.isTouch) e.preventDefault(); });
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300 && !(e.target.closest && e.target.closest('input, textarea'))) e.preventDefault();
      lastTouchEnd = now;
    }, { passive: false });
  }

  initWebSocket() {
    const host = window.location.hostname;
    const forceSolo = /[?&]solo/.test(window.location.search) ||
      window.location.protocol === 'file:' ||
      /\.github\.io$/.test(host);
    if (forceSolo) { this.startLocalMode(); return; }

    let wsUrl = 'ws://localhost:3000';
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${proto}//${window.location.host}`;
    }

    try {
      const ws = new WebSocket(wsUrl);
      this.socket = ws;

      // Sem servidor em 3s? Joga em modo solo no próprio navegador.
      const fallbackTimer = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) { try { ws.close(); } catch (e) {} this.startLocalMode(); }
      }, 3000);

      ws.onopen = () => {
        clearTimeout(fallbackTimer);
        this.isMultiplayer = true;
        this.appendChatMessage("system", "🟢 Conectado ao servidor multiplayer!");
      };

      ws.onmessage = (event) => {
        try { this.handleNetworkMessage(JSON.parse(event.data)); } catch (err) {}
      };

      ws.onerror = () => { clearTimeout(fallbackTimer); if (!this.isSolo) this.startLocalMode(); };

      ws.onclose = () => {
        clearTimeout(fallbackTimer);
        this.isMultiplayer = false;
        this.updateOnlineCount();
        if (!this.isSolo) this.startLocalMode();
      };
    } catch (e) {
      this.startLocalMode();
    }
  }

  startLocalMode() {
    if (this.isSolo || typeof LocalServer === 'undefined') return;
    this.isSolo = true;
    this.isMultiplayer = false;
    this.otherPlayers.clear();
    this.socket = new LocalServer();
    this.socket.onmessage = (event) => {
      try { this.handleNetworkMessage(JSON.parse(event.data)); } catch (err) { console.error(err); }
    };
    this.appendChatMessage("system", "🎮 Modo solo: jogando direto no seu aparelho (sem internet).");
    this.updateOnlineCount();
    // Se a partida já tinha começado, entra no mundo local
    if (this.hero) {
      this.currentFloor = 0;
      this.sendNet('join', {
        profile: this.hero.profile, hp: this.hero.hp, maxHp: this.hero.maxHp,
        mp: this.hero.mp, maxMp: this.hero.maxMp, level: this.level
      });
    }
  }

  sendNet(type, payload = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, ...payload }));
    }
  }

  handleNetworkMessage(data) {
    switch (data.type) {
      case 'init_world': {
        this.selfId = data.selfId;
        this.otherPlayers.clear();
        data.players.forEach(p => {
          if (p.id !== this.selfId) this.otherPlayers.set(p.id, p);
        });
        if (data.monsters) this.monsters = data.monsters;
        if (data.drops) this.worldDrops = data.drops;
        if (data.chests) {
          this.chests = data.chests;
          this.chests.forEach(c => { if (this.openedChests.includes(c.id)) c.opened = true; });
        }
        this.updateOnlineCount();
        break;
      }

      case 'player_joined': {
        if (data.player.id !== this.selfId) {
          this.otherPlayers.set(data.player.id, data.player);
          this.updateOnlineCount();
        }
        break;
      }

      case 'player_moved': {
        const p = this.otherPlayers.get(data.id);
        if (p) {
          p.x = data.x; p.y = data.y; p.facing = data.facing;
          p.isMoving = data.isMoving; p.animFrame = data.animFrame;
          p.hp = data.hp; p.level = data.level;
          p.currentFloor = data.currentFloor || 0;
        }
        break;
      }

      case 'player_attacked': {
        const p = this.otherPlayers.get(data.id);
        if (p) {
          p.isAttacking = true; p.attackProgress = 0;
          if (data.actionType === 'basic') {
            if (data.classKey === 'warrior') sounds.swordSwing();
            else if (data.classKey === 'mage') sounds.magicCast();
            else if (data.classKey === 'archer') sounds.arrowShoot();
          } else {
            sounds.specialSkill();
          }
          if (data.projectiles) data.projectiles.forEach(pr => this.projectiles.push(pr));
        }
        break;
      }

      case 'player_left': {
        this.otherPlayers.delete(data.id);
        this.updateOnlineCount();
        break;
      }

      case 'monster_damaged': {
        const m = this.monsters.find(mon => mon.id === data.monsterId);
        if (m) {
          m.hp = data.hp; m.hurtTimer = 0.2;
          const label = data.isCrit ? `${data.damage} CRÍTICO!` : `${data.damage}`;
          this.spawnFloatingText(label, m.x, m.y - 25, data.isCrit ? '#fbbf24' : '#ffffff');
          sounds.enemyHit();
        }
        break;
      }

      case 'monster_killed': {
        const idx = this.monsters.findIndex(mon => mon.id === data.monsterId);
        if (idx !== -1) {
          const mine = data.killerId ? data.killerId === this.selfId : data.killerName === (this.hero && this.hero.profile.name);
          this.killMonster(this.monsters[idx], idx, mine);
          if (!this.isSolo) this.appendChatMessage("system", `⚔️ ${data.killerName} derrotou ${data.isBoss ? 'O CHEFÃO' : 'um monstro'}!`);
        }
        break;
      }

      case 'monster_spawned': {
        if (this.currentFloor === 0 && data.monster && !this.monsters.find(m => m.id === data.monster.id)) {
          this.monsters.push(data.monster);
        }
        break;
      }

      case 'sync_monsters': {
        data.monsters.forEach(sm => {
          const m = this.monsters.find(mon => mon.id === sm.id);
          if (m) {
            m.x += (sm.x - m.x) * 0.4;
            m.y += (sm.y - m.y) * 0.4;
            m.hp = sm.hp;
          }
        });
        break;
      }

      // ITEM GERADO PELA IA CAÍDO NO CHÃO
      case 'item_dropped': {
        this.worldDrops.push(data.drop);
        this.showBanner("DROP DE ITEM DA IA!", `${data.drop.item.name} (${data.drop.item.rarityLabel})`);
        break;
      }

      case 'item_picked': {
        const idx = this.worldDrops.findIndex(d => d.id === data.itemId);
        if (idx !== -1) this.worldDrops.splice(idx, 1);
        if (!this.isSolo) this.appendChatMessage("system", `✨ ${data.pickerName} pegou [${data.item.name}]!`);
        break;
      }

      // RESPOSTA INTELIGENTE DO NPC COM GOOGLE GEMINI
      case 'npc_ai_speech': {
        this.appendChatMessage("npc-ai", data.text, data.npcName);
        const npc = this.npcs.find(n => n.id === data.npcId);
        if (npc) {
          npc.speechMsg = data.text;
          npc.speechTimer = 6.0;
        }
        sounds.levelUp();
        break;
      }

      // DUNGEON CARREGADA
      case 'dungeon_loaded': {
        if (this.currentFloor === 0) this.worldChests = this.chests;
        this.currentFloor = data.dungeon.floor;
        this.dungeon = data.dungeon;
        this.monsters = data.dungeon.monsters;
        this.chests = data.dungeon.chests;
        this.hero.x = data.dungeon.spawnPoint.x + 70;
        this.hero.y = data.dungeon.spawnPoint.y;
        this.portalCooldown = 2.5;
        this.projectiles = [];
        this.enemyProjectiles = [];
        if (this.currentFloor > this.bestFloor) { this.bestFloor = this.currentFloor; this.checkQuestProgress(); }
        document.getElementById('hud-location-tag').innerText = `📍 Dungeon Infinita - Andar ${this.currentFloor}`;
        this.saveGame();
        this.showBanner(`DUNGEON INFINITA`, `Andar ${this.currentFloor}`);
        sounds.portalWhoosh();
        break;
      }

      case 'return_to_surface': {
        this.currentFloor = 0;
        this.dungeon = null;
        if (this.worldChests) { this.chests = this.worldChests; this.worldChests = null; }
        this.monsters = data.monsters;
        this.hero.x = this.portal.x + 50;
        this.hero.y = this.portal.y + 50;
        this.portalCooldown = 2.5;
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.currentBiome = '';
        this.saveGame();
        this.showBanner(`DE VOLTA A OOO`, `Superfície da Terra dos Doces`);
        sounds.portalWhoosh();
        break;
      }

      case 'player_chat': {
        this.appendChatMessage("user", data.text, data.name);
        if (data.id === this.selfId && this.hero) {
          this.hero.chatMsg = data.text; this.hero.chatTimer = 4.0;
        } else {
          const p = this.otherPlayers.get(data.id);
          if (p) { p.chatMsg = data.text; p.chatTimer = 4.0; }
        }
        break;
      }

      case 'system_chat': {
        this.appendChatMessage("system", data.text);
        break;
      }
    }
  }

  updateOnlineCount() {
    const total = 1 + this.otherPlayers.size;
    const el = document.getElementById('hud-online-count');
    if (el) el.innerText = total;
  }

  appendChatMessage(type, text, author = '') {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    if (type === 'user') {
      div.innerHTML = `<span class="chat-author">[${author}]:</span><span class="chat-text">${this.escapeHtml(text)}</span>`;
    } else if (type === 'npc-ai') {
      div.innerHTML = `<span class="chat-author">🧠 [${author} (IA)]:</span><span class="chat-text">${this.escapeHtml(text)}</span>`;
    } else {
      div.innerText = text;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  start(profile, save) {
    this.hero = {
      x: 350, y: 350,
      profile: { ...profile },
      classData: CLASS_CONFIGS[profile.classKey],
      hp: CLASS_CONFIGS[profile.classKey].hp,
      maxHp: CLASS_CONFIGS[profile.classKey].hp,
      mp: CLASS_CONFIGS[profile.classKey].mp,
      maxMp: CLASS_CONFIGS[profile.classKey].mp,
      atk: CLASS_CONFIGS[profile.classKey].atk,
      spd: CLASS_CONFIGS[profile.classKey].spd,
      facing: 'down',
      isMoving: false,
      animFrame: 0,
      isAttacking: false,
      attackProgress: 0,
      attackCooldown: 0,
      skillCooldown: 0,
      invulnerableTimer: 0,
      chatMsg: null,
      chatTimer: 0
    };

    if (save) this.applySave(save);
    if (this.isTouch || window.innerWidth <= 860) {
      const cc = document.getElementById('chat-container');
      if (cc) cc.classList.add('mobile-collapsed');
    }
    this.updateObjective();
    document.getElementById('potion-count').innerText = this.potions;
    document.getElementById('sandwich-count').innerText = this.sandwiches;

    this.sendNet('join', {
      profile: this.hero.profile,
      hp: this.hero.hp,
      maxHp: this.hero.maxHp,
      mp: this.hero.mp,
      maxMp: this.hero.maxMp,
      level: this.level
    });

    this.updateHUD();
    this.updateSkillDock();
    this.renderAvatarHUD();

    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));

    setTimeout(() => {
      this.showDialog(
        "Jake o Cão",
        "🐶",
        save
          ? `Bem-vindo de volta, ${this.hero.profile.name}! Seu progresso foi carregado. Veja a missão no topo da tela!`
          : `E aí, ${this.hero.profile.name}! Fale com a Princesa Jujuba para missões e com o BMO para comprar itens. O Portal da Dungeon fica ao leste!`
      );
    }, 600);

    sounds.startBgm();
  }

  initWorldDecorations() {
    this.decorations = [];
    this.treeHouse = { x: 350, y: 180, width: 160, height: 200 };

    let seed = 1337;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const keepOut = [[350, 330, 190], [350, 180, 130], [950, 380, 80], [1100, 220, 70], [1900, 750, 70], [620, 260, 70]];

    for (let i = 0; i < 320; i++) {
      const x = rand() * (this.worldWidth - 160) + 80;
      const y = rand() * (this.worldHeight - 160) + 80;
      if (keepOut.some(k => Math.hypot(x - k[0], y - k[1]) < k[2])) continue;
      const biome = this.getBiome(x, y);
      const r = rand();
      let type;
      if (biome === 'ice') type = r < 0.6 ? 'ice-crystal' : 'snow-pine';
      else if (biome === 'forest') type = r < 0.7 ? 'dark-tree' : 'mushroom-deco';
      else if (biome === 'candy') type = r < 0.4 ? 'lollipop' : r < 0.75 ? 'candy-cane' : 'giant-flower';
      else if (biome === 'ruins') type = r < 0.6 ? 'rock' : 'dark-tree';
      else type = r < 0.55 ? 'adventure-tree' : r < 0.8 ? 'giant-flower' : r < 0.9 ? 'rock' : 'lollipop';
      this.decorations.push({ x, y, type, size: 30 + rand() * 25 });
    }
    this.decorations.sort((a, b) => a.y - b.y);
  }

  initNPCs() {
    this.npcs = [
      { id: 1, name: "Jake o Cão", role: "jake", x: 420, y: 350, speechMsg: null, speechTimer: 0 },
      { id: 2, name: "BMO", role: "bmo", x: 270, y: 360, speechMsg: null, speechTimer: 0 },
      { id: 3, name: "Princesa Jujuba", role: "bubblegum", x: 1100, y: 220, speechMsg: null, speechTimer: 0 },
      { id: 4, name: "Rei Gelado", role: "iceking", x: 1900, y: 750, speechMsg: null, speechTimer: 0 },
      { id: 5, name: "Marceline", role: "marceline", x: 620, y: 260, speechMsg: null, speechTimer: 0 }
    ];
  }

  initChests() {
    this.chests = [
      { id: 1, x: 550, y: 500, opened: false, gold: 35, potion: 1 },
      { id: 2, x: 1200, y: 700, opened: false, gold: 60, potion: 2 }
    ];
  }

  gameLoop(currentTime) {
    if (!this.running) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    this.animTime += dt;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    if (!this.hero || this.hero.hp <= 0 || this.paused) return;

    if (this.portalCooldown > 0) this.portalCooldown -= dt;
    this.autoSaveTimer = (this.autoSaveTimer || 0) + dt;
    if (this.autoSaveTimer > 10) { this.autoSaveTimer = 0; this.saveGame(true); }
    if (this.holdAttack && !this.currentDialog) this.performBasicAttack();

    if (this.hero.attackCooldown > 0) this.hero.attackCooldown -= dt * 1000;
    if (this.hero.skillCooldown > 0) {
      this.hero.skillCooldown -= dt * 1000;
      this.updateSkillCooldownUI();
    }
    if (this.hero.invulnerableTimer > 0) this.hero.invulnerableTimer -= dt;

    if (this.hero.chatTimer > 0) {
      this.hero.chatTimer -= dt;
      if (this.hero.chatTimer <= 0) this.hero.chatMsg = null;
    }

    // Atualiza fala dos NPCs
    this.npcs.forEach(n => {
      if (n.speechTimer > 0) {
        n.speechTimer -= dt;
        if (n.speechTimer <= 0) n.speechMsg = null;
      }
    });

    this.otherPlayers.forEach(p => {
      if (p.chatTimer > 0) {
        p.chatTimer -= dt;
        if (p.chatTimer <= 0) p.chatMsg = null;
      }
      if (p.isAttacking) {
        p.attackProgress = (p.attackProgress || 0) + dt * 6;
        if (p.attackProgress >= 1) {
          p.isAttacking = false;
          p.attackProgress = 0;
        }
      }
    });

    if (this.hero.isAttacking) {
      this.hero.attackProgress += dt * 6;
      if (this.hero.attackProgress >= 1) {
        this.hero.isAttacking = false;
        this.hero.attackProgress = 0;
      }
    }

    const isChatFocused = document.activeElement === document.getElementById('chat-input');
    let dx = 0, dy = 0;

    if (!isChatFocused) {
      if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

      // Suporte ao Joystick Touch Mobile
      if (this.joystick && this.joystick.active) {
        dx = this.joystick.dx;
        dy = this.joystick.dy;
      }
    }

    // Buff do Sanduíche do Jake
    if (this.sandwichBuffTimer > 0) {
      this.sandwichBuffTimer -= dt;
      this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + dt * 4);
      if (Math.random() < 0.2) {
        this.particles.push({
          x: this.hero.x + (Math.random() - 0.5) * 20,
          y: this.hero.y + (Math.random() - 0.5) * 20,
          vx: 0, vy: -30, color: '#f59e0b', size: 3, life: 0.4
        });
      }
    }

    // Pet Gunther seguindo o herói
    if (this.hero && this.hero.profile.pet === 'gunther') {
      const targetPetX = this.hero.x - (this.hero.facing === 'left' ? -25 : 25);
      const targetPetY = this.hero.y + 10;
      this.petX += (targetPetX - this.petX) * 0.1;
      this.petY += (targetPetY - this.petY) * 0.1;

      // Gunther coleta itens caídos próximos automaticamente
      this.worldDrops.forEach((d, idx) => {
        if (d.floor === this.currentFloor && Math.hypot(this.petX - d.x, this.petY - d.y) < 40) {
          sounds.itemPickup();
          this.equipItem(d.item);
          this.sendNet('pick_item', { itemId: d.id, playerName: this.hero.profile.name });
          this.worldDrops.splice(idx, 1);
          this.spawnFloatingText("Gunther coletou!", this.petX, this.petY - 20, '#38bdf8');
        }
      });
    }

    if (this.dashCd > 0) this.dashCd -= dt;
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.hero.x += this.dashDir.x * 640 * dt;
      this.hero.y += this.dashDir.y * 640 * dt;
      this.particles.push({ x: this.hero.x, y: this.hero.y + 8, vx: 0, vy: 0, color: '#e0f2fe', size: 5, life: 0.25 });
    }
    this.dayTime += dt;

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0.08) {
      const speedMult = this.sandwichBuffTimer > 0 ? 1.45 : 1.0;
      const moveSpeed = this.hero.spd * 60 * dt * speedMult;
      const factor = (this.joystick && this.joystick.active) ? Math.min(1, len) : 1;
      this.hero.x += (dx / len) * moveSpeed * factor;
      this.hero.y += (dy / len) * moveSpeed * factor;

      if (Math.abs(dx) > Math.abs(dy)) this.hero.facing = dx > 0 ? 'right' : 'left';
      else this.hero.facing = dy > 0 ? 'down' : 'up';

      this.hero.isMoving = true;
      this.hero.animFrame += dt * 10;
    } else {
      this.hero.isMoving = false;
      this.hero.animFrame = 0;
    }

    // Limites do mundo
    const maxX = this.currentFloor === 0 ? this.worldWidth : (this.dungeon ? this.dungeon.width : this.worldWidth);
    const maxY = this.currentFloor === 0 ? this.worldHeight : (this.dungeon ? this.dungeon.height : this.worldHeight);
    this.hero.x = Math.max(20, Math.min(maxX - 20, this.hero.x));
    this.hero.y = Math.max(30, Math.min(maxY - 20, this.hero.y));

    // Bioma atual
    if (this.currentFloor === 0) {
      const biome = this.getBiome(this.hero.x, this.hero.y);
      if (biome !== this.currentBiome) {
        this.currentBiome = biome;
        document.getElementById('hud-location-tag').innerText = `📍 ${BIOMES[biome].name}`;
      }
    }

    // NPC por perto?
    this.nearNpc = null;
    if (this.currentFloor === 0) {
      for (const n of this.npcs) {
        if (Math.hypot(this.hero.x - n.x, this.hero.y - n.y) < 75) { this.nearNpc = n; break; }
      }
    }
    const talkBtn = document.getElementById('btn-touch-talk');
    if (talkBtn) talkBtn.classList.toggle('hidden', !this.nearNpc);

    // Sincronização periódica
    const now = performance.now();
    if (now - this.lastNetworkSync > 60) {
      this.lastNetworkSync = now;
      this.sendNet('update_state', {
        x: Math.round(this.hero.x),
        y: Math.round(this.hero.y),
        facing: this.hero.facing,
        isMoving: this.hero.isMoving,
        animFrame: this.hero.animFrame,
        hp: this.hero.hp,
        level: this.level
      });
    }

    // Câmera (presa aos limites do mapa)
    const camMaxX = Math.max(0, maxX - this.canvas.width);
    const camMaxY = Math.max(0, maxY - this.canvas.height);
    const targetCamX = Math.max(0, Math.min(camMaxX, this.hero.x - this.canvas.width / 2));
    const targetCamY = Math.max(0, Math.min(camMaxY, this.hero.y - this.canvas.height / 2));
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    if (this.screenShake > 0) this.screenShake -= dt * 15;

    if (this.hero.mp < this.hero.maxMp) {
      this.hero.mp = Math.min(this.hero.maxMp, this.hero.mp + dt * 2.5);
      this.updateHUD();
    }

    this.updateMonsters(dt);
    this.updateProjectiles(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.checkInteractions();
  }

  updateEnemyProjectiles(dt) {
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.enemyProjectiles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (this.hero.hp > 0 && this.hero.invulnerableTimer <= 0 && Math.hypot(p.x - this.hero.x, p.y - this.hero.y) < p.radius + 12) {
        this.damageHero(p.dmg);
        p.life = 0;
      }
      if (p.life <= 0) this.enemyProjectiles.splice(i, 1);
    }
  }

  bossRingAttack(m) {
    const n = m.isBoss && m.hp < m.maxHp * 0.5 ? 16 : 10;
    const off = Math.random() * Math.PI;
    for (let k = 0; k < n; k++) {
      const a = off + (k / n) * Math.PI * 2;
      this.enemyProjectiles.push({
        x: m.x, y: m.y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150,
        radius: 7, dmg: Math.max(4, Math.round(m.atk * 0.6)), life: 2.8, color: m.color || '#c084fc'
      });
    }
    this.screenShake = Math.max(this.screenShake, 4);
  }

  updateMonsters(dt) {
    this.updateEnemyProjectiles(dt);
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      if (m.hurtTimer > 0) m.hurtTimer -= dt;
      if (m.isBoss && m.hp > 0) {
        m.attackTimer = (m.attackTimer === undefined ? 3 : m.attackTimer) - dt;
        if (m.attackTimer <= 0 && Math.hypot(this.hero.x - m.x, this.hero.y - m.y) < 480) {
          this.bossRingAttack(m);
          m.attackTimer = m.hp < m.maxHp * 0.5 ? 3 : 4.5;
        }
      }

      const dist = Math.hypot(this.hero.x - m.x, this.hero.y - m.y);
      if (dist < 28 && this.hero.invulnerableTimer <= 0 && m.hp > 0) {
        this.damageHero(m.atk);
      }
    }
  }

  damageHero(dmg) {
    this.hero.hp = Math.max(0, this.hero.hp - dmg);
    this.hero.invulnerableTimer = 0.6;
    this.screenShake = 6;
    sounds.playerHurt();
    if (this.isTouch && navigator.vibrate) navigator.vibrate(40);
    this.spawnFloatingText(`-${dmg}`, this.hero.x, this.hero.y - 20, '#ef4444');
    this.updateHUD();
    if (this.hero.hp <= 0) this.onGameOver();
  }

  killMonster(m, index, giveReward = true) {
    this.monsters.splice(index, 1);
    this.screenShake = m.isBoss ? 14 : 5;
    sounds.enemyHit();

    if (giveReward) {
      this.addExp(m.expReward);
      this.addGold(m.goldReward);
      this.onKill(m);
      if (this.isTouch && navigator.vibrate) navigator.vibrate(15);
    }

    const color = m.isBoss ? '#f59e0b' : m.color || '#ec4899';
    for (let p = 0; p < (m.isBoss ? 35 : 12); p++) {
      this.particles.push({
        x: m.x, y: m.y,
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.5) * 160,
        color: color, size: 3 + Math.random() * 4, life: 0.6
      });
    }

    if (m.isBoss) {
      sounds.bossDefeat();
      this.showBanner("VITÓRIA!", "O Guardião foi derrotado!");
    }
  }

  addExp(amount) {
    this.exp += amount;
    this.spawnFloatingText(`+${amount} XP`, this.hero.x, this.hero.y - 35, '#38bdf8');
    if (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.level++;
      this.expToNext = Math.round(this.expToNext * 1.5);
      this.hero.maxHp += 20; this.hero.hp = this.hero.maxHp;
      this.hero.maxMp += 15; this.hero.mp = this.hero.maxMp;
      this.hero.atk += 4;
      sounds.levelUp();
      this.showBanner("MATEMÁTICO!", `Subiu para o NÍVEL ${this.level}!`);
    }
    this.updateHUD();
  }

  // ---------- MISSÕES ----------
  currentQuest() { return QUESTS[this.questIndex] || null; }

  questProgressValue(q) {
    return q.kind === 'floor' ? Math.min(this.bestFloor, q.need) : Math.min(this.questProgress, q.need);
  }

  questObjectiveText() {
    const q = this.currentQuest();
    if (!q) return 'Você é uma Lenda de Ooo! Desça a Dungeon Infinita o mais fundo que puder!';
    return `${q.title}: ${q.desc} (${this.questProgressValue(q)}/${q.need})`;
  }

  updateObjective() {
    const el = document.getElementById('hud-objective-text');
    if (el) el.innerText = this.questObjectiveText();
  }

  onKill(m) {
    this.kills[m.type] = (this.kills[m.type] || 0) + 1;
    const q = this.currentQuest();
    if (q) {
      if (q.kind === 'kill' && m.type === q.target) this.questProgress++;
      else if (q.kind === 'boss' && m.isBoss && this.currentFloor === 0) this.questProgress++;
    }
    this.checkQuestProgress();
  }

  checkQuestProgress() {
    let q = this.currentQuest();
    while (q && this.questProgressValue(q) >= q.need) {
      this.questIndex++;
      this.questProgress = 0;
      this.showBanner('MISSÃO COMPLETA!', `${q.title}: +${q.gold} 🪙 +${q.exp} XP`);
      sounds.levelUp();
      this.addGold(q.gold);
      this.addExp(q.exp);
      q = this.currentQuest();
    }
    this.updateObjective();
    this.saveGame();
  }

  // ---------- SALVAR / CARREGAR ----------
  saveGame(force = false) {
    if (!this.hero) return;
    const now = performance.now();
    if (!force && now - this.lastSave < 1500) return;
    this.lastSave = now;
    const h = this.hero;
    const data = {
      v: 1, savedAt: Date.now(), profile: h.profile,
      level: this.level, exp: this.exp, expToNext: this.expToNext,
      gold: this.gold, potions: this.potions, sandwiches: this.sandwiches,
      maxHp: h.maxHp, maxMp: h.maxMp, atk: h.atk,
      equippedItem: this.equippedItem, questIndex: this.questIndex,
      questProgress: this.questProgress, bestFloor: this.bestFloor,
      kills: this.kills, upgrades: this.upgrades || 0, openedChests: this.openedChests
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  applySave(sv) {
    const h = this.hero;
    this.level = sv.level || 1;
    this.exp = sv.exp || 0;
    this.expToNext = sv.expToNext || 50;
    this.gold = sv.gold || 0;
    this.potions = sv.potions ?? 3;
    this.sandwiches = sv.sandwiches ?? 1;
    h.maxHp = sv.maxHp || h.maxHp; h.hp = h.maxHp;
    h.maxMp = sv.maxMp || h.maxMp; h.mp = h.maxMp;
    h.atk = sv.atk || h.atk;
    this.questIndex = sv.questIndex || 0;
    this.questProgress = sv.questProgress || 0;
    this.bestFloor = sv.bestFloor || 0;
    this.kills = sv.kills || {};
    this.upgrades = sv.upgrades || 0;
    this.openedChests = sv.openedChests || [];
    this.chests.forEach(c => { if (this.openedChests.includes(c.id)) c.opened = true; });
    if (sv.equippedItem) {
      this.equippedItem = sv.equippedItem;
      this.showEquippedUI(sv.equippedItem);
    }
    this.updateHUD();
  }

  addGold(amount) {
    this.gold += amount;
    sounds.coinPickup();
    this.spawnFloatingText(`+${amount} 🪙`, this.hero.x, this.hero.y - 50, '#fbbf24');
    this.updateHUD();
  }

  usePotion() {
    if (this.potions <= 0) return;
    this.potions--;
    const heal = Math.round(this.hero.maxHp * 0.5);
    this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + heal);
    sounds.potionDrink();
    this.spawnFloatingText(`+${heal} HP`, this.hero.x, this.hero.y - 30, '#10b981');
    document.getElementById('potion-count').innerText = this.potions;
    this.updateHUD();
  }

  eatSandwich() {
    if (this.sandwiches <= 0) {
      this.spawnFloatingText("Sem Sanduíches!", this.hero.x, this.hero.y - 20, '#ef4444');
      return;
    }
    this.sandwiches--;
    this.sandwichBuffTimer = 45;
    document.getElementById('sandwich-count').innerText = this.sandwiches;
    sounds.potionDrink();
    sounds.levelUp();
    this.spawnFloatingText("BUFF DO SANDUÍCHE!", this.hero.x, this.hero.y - 35, '#f59e0b');
    this.showBanner("SANDUÍCHE PERFEITO!", "+50% Velocidade e Regeneração por 45s!");
  }

  moveVector() {
    let dx = 0, dy = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;
    if (this.joystick.active) { dx = this.joystick.dx; dy = this.joystick.dy; }
    const len = Math.hypot(dx, dy);
    if (len > 0.08) return { x: dx / len, y: dy / len };
    const f = this.hero.facing;
    return { x: f === 'left' ? -1 : f === 'right' ? 1 : 0, y: f === 'up' ? -1 : f === 'down' ? 1 : 0 };
  }

  performDash() {
    if (!this.hero || this.hero.hp <= 0 || this.dashCd > 0 || this.paused) return;
    this.dashDir = this.moveVector();
    this.dashTimer = 0.18;
    this.dashCd = 1.1;
    this.hero.invulnerableTimer = Math.max(this.hero.invulnerableTimer, 0.35);
    sounds.swordSwing();
    const btn = document.getElementById('btn-touch-dash');
    if (btn) { btn.classList.add('cooling'); setTimeout(() => btn.classList.remove('cooling'), 1100); }
  }

  performBasicAttack() {
    if (!this.hero || this.hero.attackCooldown > 0 || this.hero.isAttacking) return;
    this.hero.isAttacking = true;
    this.hero.attackProgress = 0;
    this.hero.attackCooldown = 320;

    const { classKey } = this.hero.profile;
    const firedProjectiles = [];

    if (classKey === 'warrior') {
      sounds.swordSwing();
      const hitRadius = 55;
      let dirAngle = 0;
      if (this.hero.facing === 'down') dirAngle = Math.PI / 2;
      else if (this.hero.facing === 'up') dirAngle = -Math.PI / 2;
      else if (this.hero.facing === 'right') dirAngle = 0;
      else if (this.hero.facing === 'left') dirAngle = Math.PI;

      this.particles.push({
        x: this.hero.x + Math.cos(dirAngle) * 25,
        y: this.hero.y + Math.sin(dirAngle) * 25,
        type: 'slash', angle: dirAngle, life: 0.15
      });

      this.monsters.forEach(m => {
        const d = Math.hypot(m.x - this.hero.x, m.y - this.hero.y);
        if (d <= hitRadius) this.hitMonster(m, this.hero.atk);
      });
    } else if (classKey === 'mage') {
      sounds.magicCast();
      const dir = this.getFacingVector();
      const orb = {
        x: this.hero.x, y: this.hero.y - 10,
        vx: dir.x * 380, vy: dir.y * 380, radius: 8,
        color: '#38bdf8', dmg: this.hero.atk, type: 'magic-orb', life: 1.2
      };
      this.projectiles.push(orb); firedProjectiles.push(orb);
    } else if (classKey === 'archer') {
      sounds.arrowShoot();
      const dir = this.getFacingVector();
      const arr = {
        x: this.hero.x, y: this.hero.y - 5,
        vx: dir.x * 520, vy: dir.y * 520, radius: 4,
        color: '#fbbf24', dmg: this.hero.atk, type: 'arrow', life: 1.0
      };
      this.projectiles.push(arr); firedProjectiles.push(arr);
    } else if (classKey === 'vampire') {
      sounds.swordSwing();
      const dir = this.getFacingVector();
      const wave = {
        x: this.hero.x, y: this.hero.y - 5,
        vx: dir.x * 440, vy: dir.y * 440, radius: 9,
        color: '#dc2626', dmg: this.hero.atk, type: 'sonic-wave', life: 1.1
      };
      this.projectiles.push(wave); firedProjectiles.push(wave);
      this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + 2);
      this.updateHUD();
    }

    this.sendNet('attack_action', {
      actionType: 'basic', classKey: classKey,
      x: Math.round(this.hero.x), y: Math.round(this.hero.y),
      facing: this.hero.facing, projectiles: firedProjectiles
    });
  }

  performSpecialSkill() {
    if (!this.hero || this.hero.skillCooldown > 0) return;
    const cost = this.hero.classData.mpCost;
    if (this.hero.mp < cost) return;

    this.hero.mp -= cost;
    this.hero.skillCooldown = this.hero.classData.skillCooldown;
    this.updateHUD();
    sounds.specialSkill();

    const { classKey } = this.hero.profile;

    if (classKey === 'warrior') {
      this.screenShake = 8;
      this.spawnFloatingText("Giro Furacão!", this.hero.x, this.hero.y - 30, '#f59e0b');
      this.monsters.forEach(m => {
        if (Math.hypot(m.x - this.hero.x, m.y - this.hero.y) <= 90) {
          this.hitMonster(m, this.hero.atk * 2.2);
        }
      });
    } else if (classKey === 'mage') {
      this.screenShake = 10;
      this.spawnFloatingText("Explosão Cósmica!", this.hero.x, this.hero.y - 30, '#c084fc');
      this.particles.push({ x: this.hero.x, y: this.hero.y, type: 'shockwave', radius: 10, maxRadius: 130, color: '#a855f7', life: 0.4 });
      this.monsters.forEach(m => {
        if (Math.hypot(m.x - this.hero.x, m.y - this.hero.y) <= 130) {
          this.hitMonster(m, this.hero.atk * 2.5);
        }
      });
    } else if (classKey === 'archer') {
      this.spawnFloatingText("Chuva de Flechas!", this.hero.x, this.hero.y - 30, '#10b981');
      const baseDir = this.getFacingVector();
      const baseAngle = Math.atan2(baseDir.y, baseDir.x);
      [-0.35, 0, 0.35].forEach(offset => {
        this.projectiles.push({
          x: this.hero.x, y: this.hero.y - 5,
          vx: Math.cos(baseAngle + offset) * 550, vy: Math.sin(baseAngle + offset) * 550,
          radius: 4, color: '#34d399', dmg: this.hero.atk * 1.5, type: 'arrow', life: 1.1
        });
      });
    } else if (classKey === 'vampire') {
      this.screenShake = 9;
      this.spawnFloatingText("Acorde Devastador!", this.hero.x, this.hero.y - 30, '#ef4444');
      this.particles.push({ x: this.hero.x, y: this.hero.y, type: 'shockwave', radius: 10, maxRadius: 120, color: '#dc2626', life: 0.45 });
      this.monsters.forEach(m => {
        if (Math.hypot(m.x - this.hero.x, m.y - this.hero.y) <= 120) {
          this.hitMonster(m, this.hero.atk * 2.3);
        }
      });
      this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + 15);
      this.spawnFloatingText("+15 Dreno!", this.hero.x, this.hero.y - 45, '#10b981');
      this.updateHUD();
    }
  }

  getFacingVector() {
    // No celular, mira automaticamente no monstro mais próximo
    if (this.isTouch) {
      let best = null, bd = 380;
      for (const m of this.monsters) {
        if (m.hp <= 0) continue;
        const d = Math.hypot(m.x - this.hero.x, m.y - this.hero.y);
        if (d < bd) { bd = d; best = m; }
      }
      if (best) {
        const dx = best.x - this.hero.x, dy = best.y - this.hero.y;
        const len = Math.hypot(dx, dy) || 1;
        if (Math.abs(dx) > Math.abs(dy)) this.hero.facing = dx > 0 ? 'right' : 'left';
        else this.hero.facing = dy > 0 ? 'down' : 'up';
        return { x: dx / len, y: dy / len };
      }
    }
    if (this.hero.facing === 'up') return { x: 0, y: -1 };
    if (this.hero.facing === 'down') return { x: 0, y: 1 };
    if (this.hero.facing === 'left') return { x: -1, y: 0 };
    return { x: 1, y: 0 };
  }

  hitMonster(m, dmg) {
    const isCrit = Math.random() < 0.25;
    const finalDmg = Math.round(isCrit ? dmg * 1.5 : dmg);
    m.hp -= finalDmg; m.hurtTimer = 0.2;
    sounds.enemyHit();

    this.sendNet('monster_damage', {
      monsterId: m.id, damage: finalDmg, isCrit: isCrit, killerName: this.hero.profile.name
    });
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      let hit = false;
      for (let m of this.monsters) {
        if (Math.hypot(m.x - p.x, m.y - p.y) < p.radius + 18) {
          this.hitMonster(m, p.dmg); hit = true; break;
        }
      }
      if (hit || p.life <= 0) this.projectiles.splice(i, 1);
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      if (p.type === 'shockwave') p.radius += (p.maxRadius - p.radius) * 8 * dt;
      else if (!p.type) { p.x += p.vx * dt; p.y += p.vy * dt; }
    }
  }

  updateFloatingTexts(dt) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 25 * dt; t.life -= dt;
      if (t.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  spawnFloatingText(text, x, y, color = '#ffffff') {
    this.floatingTexts.push({ text, x, y, color, life: 0.8 });
  }

  // ===================================================================
  // 5. INTERAÇÕES: PORTAIS, ITENS NO CHÃO E CHESTS
  // ===================================================================
  checkInteractions() {
    // 1. PORTAIS
    if (this.currentFloor === 0) {
      if (this.portalCooldown <= 0 && Math.hypot(this.hero.x - this.portal.x, this.hero.y - this.portal.y) < 35) {
        this.portalCooldown = 2;
        this.sendNet('enter_dungeon', { floor: 1 });
      }
    } else if (this.dungeon) {
      const ex = this.dungeon.exitPortal;
      const sp = this.dungeon.spawnPoint;
      const bossAlive = this.monsters.some(m => m.isBoss && m.hp > 0);
      if (this.portalCooldown <= 0 && !bossAlive && Math.hypot(this.hero.x - ex.x, this.hero.y - ex.y) < 40) {
        this.portalCooldown = 2;
        this.sendNet('enter_dungeon', { floor: this.currentFloor + 1 });
      } else if (this.portalCooldown <= 0 && Math.hypot(this.hero.x - sp.x, this.hero.y - sp.y) < 35) {
        this.portalCooldown = 2;
        this.sendNet('exit_dungeon');
      }
    }

    // 2. COLETA DE ITENS NO CHÃO
    for (let i = this.worldDrops.length - 1; i >= 0; i--) {
      const d = this.worldDrops[i];
      if (d.floor === this.currentFloor) {
        if (Math.hypot(this.hero.x - d.x, this.hero.y - d.y) < 32) {
          sounds.itemPickup();
          this.equipItem(d.item);
          this.sendNet('pick_item', { itemId: d.id, playerName: this.hero.profile.name });
          this.worldDrops.splice(i, 1);
        }
      }
    }

    // 3. BAÚS
    this.chests.forEach(chest => {
      if (!chest.opened && Math.hypot(this.hero.x - chest.x, this.hero.y - chest.y) < 40) {
        chest.opened = true;
        if (this.currentFloor === 0) this.openedChests.push(chest.id);
        this.addGold(chest.gold);
        this.potions += chest.potion;
        document.getElementById('potion-count').innerText = this.potions;
        this.updateHUD();
        this.sendNet('open_chest', { chestId: chest.id, playerName: this.hero.profile.name });
        this.saveGame();
      }
    });
  }

  itemScore(it) {
    return (it.bonusAtk || 0) * 3 + (it.bonusHp || 0) * 0.5 + (it.bonusMp || 0) * 0.3;
  }

  showEquippedUI(item) {
    document.getElementById('equipped-item-icon').innerText = item.icon || '✨';
    document.getElementById('equipped-item-name').innerText = item.name;
    document.getElementById('equipped-item-slot').style.borderColor = item.rarityColor;
  }

  equipItem(item) {
    const old = this.equippedItem;
    // Item pior que o atual? Vira moedas.
    if (old && this.itemScore(item) <= this.itemScore(old)) {
      const gold = Math.round(this.itemScore(item) * 1.5) + 5;
      this.addGold(gold);
      this.spawnFloatingText(`${item.name} vendido`, this.hero.x, this.hero.y - 60, item.rarityColor || '#fff');
      return;
    }
    // Troca: remove bônus do antigo, aplica os do novo
    if (old) {
      this.hero.atk -= old.bonusAtk || 0;
      this.hero.maxHp -= old.bonusHp || 0;
      this.hero.maxMp -= old.bonusMp || 0;
      this.hero.hp = Math.min(this.hero.hp, this.hero.maxHp);
      this.hero.mp = Math.min(this.hero.mp, this.hero.maxMp);
    }
    this.equippedItem = item;
    this.hero.atk += item.bonusAtk || 0;
    this.hero.maxHp += item.bonusHp || 0;
    this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + (item.bonusHp || 0));
    this.hero.maxMp += item.bonusMp || 0;

    this.showEquippedUI(item);
    this.showBanner(`EQUIPOU: ${item.name}!`, `+${item.bonusAtk} ATK | +${item.bonusHp} HP | Raridade: ${item.rarityLabel}`);
    this.updateHUD();
    this.saveGame();
  }

  // ---------- NPCs & LOJA ----------
  talkToNpc(npc) {
    if (!npc || this.currentDialog || this.paused) return;
    const info = NPC_TALK[npc.role];
    if (!info) return;
    if (npc.role === 'bmo') { this.openShop(); return; }
    let text;
    if (npc.role === 'bubblegum') {
      const q = this.currentQuest();
      text = q
        ? `Missão atual — ${q.title}: ${q.desc}. Progresso: ${this.questProgressValue(q)}/${q.need}. Recompensa: ${q.gold} moedas e ${q.exp} XP, entregues automaticamente!`
        : "Fascinante! Você completou todas as missões do reino. A Dungeon Infinita é o seu desafio final!";
    } else {
      text = info.lines[Math.floor(Math.random() * info.lines.length)];
    }
    this.showDialog(npc.name, info.avatar, text);
  }

  initShop() {
    const closeBtn = document.getElementById('shop-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeShop());
  }

  shopItems() {
    const up = this.upgrades || 0;
    const costAtk = 120 + up * 90;
    const costHp = 100 + up * 80;
    return [
      { icon: '🧪', name: 'Poção Doce', desc: 'Cura 50% da vida', cost: 25, buy: () => { this.potions++; } },
      { icon: '🧪', name: 'Poção x3', desc: 'Pacote econômico', cost: 65, buy: () => { this.potions += 3; } },
      { icon: '🥪', name: 'Sanduíche Perfeito', desc: '+velocidade e regeneração', cost: 60, buy: () => { this.sandwiches++; } },
      { icon: '⚔️', name: 'Afiar Arma', desc: '+3 de ataque', cost: costAtk, buy: () => { this.hero.atk += 3; this.upgrades = up + 1; } },
      { icon: '❤️', name: 'Coração de Gelatina', desc: '+25 de vida máxima', cost: costHp, buy: () => { this.hero.maxHp += 25; this.hero.hp += 25; this.upgrades = up + 1; } },
      { icon: '🔮', name: 'Cristal de Mana', desc: '+20 de mana máxima', cost: costHp, buy: () => { this.hero.maxMp += 20; this.hero.mp += 20; this.upgrades = up + 1; } }
    ];
  }

  openShop() {
    this.paused = true;
    this.holdAttack = false;
    this.joystick.dx = 0; this.joystick.dy = 0;
    this.renderShop();
    document.getElementById('shop-modal').classList.remove('hidden');
  }

  closeShop() {
    this.paused = false;
    document.getElementById('shop-modal').classList.add('hidden');
    this.saveGame(true);
  }

  renderShop() {
    document.getElementById('shop-gold').innerText = this.gold;
    const box = document.getElementById('shop-items');
    box.innerHTML = '';
    this.shopItems().forEach(it => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'shop-item' + (this.gold < it.cost ? ' too-expensive' : '');
      b.innerHTML = `<span class="shop-icon">${it.icon}</span><span class="shop-text"><b>${it.name}</b><small>${it.desc}</small></span><span class="shop-cost">🪙 ${it.cost}</span>`;
      b.addEventListener('click', () => {
        if (this.gold < it.cost) { sounds.playerHurt(); return; }
        this.gold -= it.cost;
        it.buy();
        sounds.itemPickup();
        document.getElementById('potion-count').innerText = this.potions;
        document.getElementById('sandwich-count').innerText = this.sandwiches;
        this.updateHUD();
        this.renderShop();
      });
      box.appendChild(b);
    });
  }

  showDialog(speaker, avatar, text) {
    const box = document.getElementById('dialog-box');
    document.getElementById('dialog-speaker').innerText = speaker;
    document.getElementById('dialog-avatar').innerText = avatar;
    document.getElementById('dialog-text').innerText = text;
    box.classList.remove('hidden');
    this.currentDialog = true;
  }

  closeDialog() {
    document.getElementById('dialog-box').classList.add('hidden');
    this.currentDialog = null;
  }

  showBanner(title, sub) {
    const banner = document.getElementById('banner-notice');
    document.getElementById('banner-title').innerText = title;
    document.getElementById('banner-sub').innerText = sub;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 3200);
  }

  onGameOver() {
    document.getElementById('game-over-screen').classList.remove('hidden');
  }

  respawn() {
    this.hero.hp = this.hero.maxHp;
    this.hero.mp = this.hero.maxMp;
    this.hero.x = 350; this.hero.y = 350;
    this.enemyProjectiles = [];
    if (this.currentFloor > 0) this.sendNet('exit_dungeon');
    document.getElementById('game-over-screen').classList.add('hidden');
    this.updateHUD();
    this.saveGame(true);
  }

  // ===================================================================
  // 6. RENDERIZAÇÃO GRÁFICA
  // ===================================================================
  render() {
    this.ctx.save();
    if (this.screenShake > 0) {
      this.ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake);
    }

    this.renderWorldBackground();
    this.ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));

    // Chão, decorações e portais
    if (this.currentFloor === 0) {
      this.renderGround();
      this.renderDecorations();
      this.renderCosmicPortal();
    } else {
      this.renderDungeon();
    }

    // Itens Caídos no Chão
    this.renderWorldDrops();

    // Baús
    this.renderChests();

    // NPCs (apenas na superfície)
    if (this.currentFloor === 0) {
      this.npcs.forEach(npc => PixelArtRenderer.drawNPC(this.ctx, npc, this.animTime));
    }

    // Inimigos
    this.monsters.forEach(m => PixelArtRenderer.drawMonster(this.ctx, m, this.animTime));

    // Outros Jogadores no mesmo andar
    this.otherPlayers.forEach(p => {
      if ((p.currentFloor || 0) === this.currentFloor && p.hp > 0) {
        PixelArtRenderer.drawHero(this.ctx, p.x, p.y, {
          scale: 2.8, facing: p.facing || 'down', isMoving: p.isMoving,
          animFrame: p.animFrame || 0, isAttacking: p.isAttacking,
          attackProgress: p.attackProgress || 0, profile: p.profile
        });
        this.renderPlayerOverheadUI(p);
      }
    });

    // Herói Local
    if (this.hero && this.hero.hp > 0) {
      PixelArtRenderer.drawHero(this.ctx, this.hero.x, this.hero.y, {
        scale: 2.8, facing: this.hero.facing, isMoving: this.hero.isMoving,
        animFrame: this.hero.animFrame, isAttacking: this.hero.isAttacking,
        attackProgress: this.hero.attackProgress, profile: this.hero.profile
      });
      this.renderPlayerOverheadUI(this.hero, true);

      // Pet Gunther companheiro
      if (this.hero.profile.pet === 'gunther') {
        PixelArtRenderer.drawPetGunther(this.ctx, this.petX, this.petY, this.animTime);
      }
    }

    this.renderProjectiles();
    this.renderEnemyProjectiles();
    this.renderParticles();
    this.renderFloatingTexts();
    this.renderTalkPrompt();
    this.ctx.restore();
    this.renderLighting();
    this.renderMinimap();
  }

  renderEnemyProjectiles() {
    const ctx = this.ctx;
    this.enemyProjectiles.forEach(p => {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 8, p.radius, p.radius * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 0.4, 0, Math.PI * 2); ctx.fill();
    });
  }

  // Ciclo dia/noite na superfície e penumbra na dungeon, com luz ao redor do herói
  renderLighting() {
    if (!this.hero) return;
    let alpha;
    if (this.currentFloor === 0) {
      const phase = Math.sin((this.dayTime / 240) * Math.PI * 2);
      alpha = Math.max(0, -phase) * 0.55;
    } else {
      alpha = 0.38;
    }
    if (alpha < 0.03) return;
    const ctx = this.ctx;
    const sx = this.hero.x - this.camera.x, sy = this.hero.y - this.camera.y;
    const r = this.currentFloor === 0 ? 190 : 230;
    const grad = ctx.createRadialGradient(sx, sy, r * 0.25, sx, sy, r);
    const tint = this.currentFloor === 0 ? '8,10,50' : '4,2,16';
    grad.addColorStop(0, `rgba(${tint},0)`);
    grad.addColorStop(1, `rgba(${tint},${alpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderTalkPrompt() {
    if (!this.nearNpc || this.currentDialog) return;
    const ctx = this.ctx;
    const n = this.nearNpc;
    const label = this.isTouch ? 'Toque em 💬 Falar' : '[T] Falar';
    ctx.save();
    ctx.font = 'bold 11px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    const w = ctx.measureText(label).width + 14;
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.beginPath(); ctx.roundRect(n.x - w / 2, n.y - 78, w, 20, 6); ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillText(label, n.x, n.y - 64);
    ctx.restore();
  }

  renderGround() {
    const ctx = this.ctx;
    const T = 64;
    const x0 = Math.max(0, Math.floor(this.camera.x / T));
    const y0 = Math.max(0, Math.floor(this.camera.y / T));
    const x1 = Math.min(Math.ceil(this.worldWidth / T), Math.ceil((this.camera.x + this.canvas.width) / T));
    const y1 = Math.min(Math.ceil(this.worldHeight / T), Math.ceil((this.camera.y + this.canvas.height) / T));
    for (let ty = y0; ty < y1; ty++) {
      for (let tx = x0; tx < x1; tx++) {
        const biome = this.getBiome(tx * T + T / 2, ty * T + T / 2);
        ctx.fillStyle = BIOMES[biome].colors[(tx + ty) & 1];
        ctx.fillRect(tx * T, ty * T, T + 1, T + 1);
        const h = (tx * 73856093 ^ ty * 19349663) >>> 0;
        if (h % 7 === 0) {
          ctx.fillStyle = biome === 'ice' ? '#ffffff' : biome === 'candy' ? '#f472b6' : 'rgba(0,0,0,0.12)';
          ctx.fillRect(tx * T + (h % 40) + 8, ty * T + ((h >> 6) % 40) + 8, 4, 4);
          ctx.fillRect(tx * T + (h % 40) + 12, ty * T + ((h >> 6) % 40) + 4, 3, 3);
        }
      }
    }
    // Borda do mundo
    ctx.strokeStyle = '#1a162b'; ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);
  }

  renderDungeon() {
    const d = this.dungeon;
    if (!d) return;
    const ctx = this.ctx;
    const THEMES = [
      { bg: '#0d0b17', cor: '#26223d', room: '#2f2b4a', alt: '#383458', edge: '#5b5690' },
      { bg: '#1a0a08', cor: '#3a1a12', room: '#4a2218', alt: '#57291d', edge: '#f97316' },
      { bg: '#08131f', cor: '#12283f', room: '#1e3a5f', alt: '#24456f', edge: '#7dd3fc' }
    ];
    const th = THEMES[(d.floor - 1) % 3];
    // Fundo da dungeon
    ctx.fillStyle = th.bg;
    ctx.fillRect(0, 0, d.width, d.height);
    // Corredores
    ctx.strokeStyle = th.cor; ctx.lineWidth = 60; ctx.lineCap = 'round';
    for (let i = 1; i < d.rooms.length; i++) {
      const a = d.rooms[i - 1], b = d.rooms[i];
      ctx.beginPath(); ctx.moveTo(a.centerX, a.centerY); ctx.lineTo(b.centerX, a.centerY); ctx.lineTo(b.centerX, b.centerY); ctx.stroke();
    }
    // Salas
    d.rooms.forEach(r => {
      ctx.fillStyle = r.isBossRoom ? '#3b1626' : th.room;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = r.isBossRoom ? '#4a1d2e' : th.alt;
      for (let tx = 0; tx < r.w; tx += 40) {
        for (let ty = 0; ty < r.h; ty += 40) {
          if (((tx + ty) / 40) % 2 === 0) ctx.fillRect(r.x + tx, r.y + ty, Math.min(40, r.w - tx), Math.min(40, r.h - ty));
        }
      }
      ctx.strokeStyle = r.isBossRoom ? '#be123c' : th.edge; ctx.lineWidth = 4;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    });

    // Tochas
    for (let tx = 100; tx < d.width; tx += 300) {
      const flicker = Math.sin(this.animTime * 10 + tx) * 2;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath(); ctx.arc(tx, 60, 6 + flicker, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(tx, 60, 3, 0, Math.PI * 2); ctx.fill();
    }

    const drawPortal = (x, y, c1, c2, label) => {
      const t = this.animTime * 3;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(t);
      ctx.fillStyle = c1; ctx.beginPath(); ctx.ellipse(0, 0, 30, 17, 0, 0, Math.PI * 2); ctx.fill();
      ctx.rotate(-t * 2);
      ctx.fillStyle = c2; ctx.beginPath(); ctx.ellipse(0, 0, 20, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.font = 'bold 9px Press Start 2P, monospace';
      ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'center';
      ctx.fillText(label, x, y - 30);
    };
    const bossAlive = this.monsters.some(m => m.isBoss && m.hp > 0);
    drawPortal(d.spawnPoint.x, d.spawnPoint.y, '#0ea5e9', '#bae6fd', 'SAÍDA');
    if (bossAlive) drawPortal(d.exitPortal.x, d.exitPortal.y, '#475569', '#94a3b8', 'TRANCADO');
    else drawPortal(d.exitPortal.x, d.exitPortal.y, '#9333ea', '#e9d5ff', 'PRÓXIMO ANDAR');
  }

  renderMinimap() {
    const mm = this.mmCtx;
    if (!mm || !this.hero) return;
    const W = this.minimap.width, H = this.minimap.height;
    const floor0 = this.currentFloor === 0;
    const worldW = floor0 ? this.worldWidth : (this.dungeon ? this.dungeon.width : 1800);
    const worldH = floor0 ? this.worldHeight : (this.dungeon ? this.dungeon.height : 1400);
    const sx = W / worldW, sy = H / worldH;
    mm.clearRect(0, 0, W, H);

    if (floor0) {
      const cw = 150 * sx * 1, ch = 150 * sy * 1;
      const step = 120;
      for (let y = 0; y < worldH; y += step) {
        for (let x = 0; x < worldW; x += step) {
          mm.fillStyle = BIOMES[this.getBiome(x + step / 2, y + step / 2)].mini;
          mm.fillRect(x * sx, y * sy, step * sx + 1, step * sy + 1);
        }
      }
      mm.fillStyle = '#6366f1';
      mm.fillRect(this.portal.x * sx - 3, this.portal.y * sy - 3, 6, 6);
      mm.fillStyle = '#2563eb';
      this.npcs.forEach(n => mm.fillRect(n.x * sx - 1.5, n.y * sy - 1.5, 3, 3));
      mm.fillStyle = '#fbbf24';
      this.chests.forEach(c => { if (!c.opened) mm.fillRect(c.x * sx - 1.5, c.y * sy - 1.5, 3, 3); });
    } else if (this.dungeon) {
      mm.fillStyle = '#0d0b17'; mm.fillRect(0, 0, W, H);
      this.dungeon.rooms.forEach(r => {
        mm.fillStyle = r.isBossRoom ? '#9f1239' : '#4c4670';
        mm.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy);
      });
      mm.fillStyle = '#9333ea';
      mm.fillRect(this.dungeon.exitPortal.x * sx - 3, this.dungeon.exitPortal.y * sy - 3, 6, 6);
      mm.fillStyle = '#0ea5e9';
      mm.fillRect(this.dungeon.spawnPoint.x * sx - 3, this.dungeon.spawnPoint.y * sy - 3, 6, 6);
    }

    this.monsters.forEach(m => {
      if (m.hp <= 0) return;
      mm.fillStyle = m.isBoss ? '#fde047' : '#ef4444';
      const r = m.isBoss ? 3 : 1.6;
      mm.fillRect(m.x * sx - r / 2, m.y * sy - r / 2, r, r);
    });
    this.otherPlayers.forEach(p => {
      if ((p.currentFloor || 0) === this.currentFloor) {
        mm.fillStyle = '#38bdf8'; mm.fillRect(p.x * sx - 2, p.y * sy - 2, 4, 4);
      }
    });
    mm.fillStyle = '#ffffff';
    mm.fillRect(this.hero.x * sx - 2.5, this.hero.y * sy - 2.5, 5, 5);
    mm.strokeStyle = '#0f172a'; mm.lineWidth = 1;
    mm.strokeRect(this.hero.x * sx - 2.5, this.hero.y * sy - 2.5, 5, 5);
  }

  renderCosmicPortal() {
    const ctx = this.ctx;
    const px = this.portal.x;
    const py = this.portal.y;
    const t = this.animTime * 3;

    ctx.save();
    // Vórtice giratório do Portal Místico
    ctx.translate(px, py);
    ctx.rotate(t);
    ctx.fillStyle = '#6366f1';
    ctx.beginPath(); ctx.ellipse(0, 0, 32, 18, 0, 0, Math.PI * 2); ctx.fill();

    ctx.rotate(-t * 2);
    ctx.fillStyle = '#c084fc';
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 10, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.font = 'bold 9px Press Start 2P, monospace';
    ctx.fillStyle = '#312e81';
    ctx.textAlign = 'center';
    ctx.fillText('PORTAL DA DUNGEON', px, py - 35);
  }

  renderDungeonAtmosphere() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1e1b4b';
    // Tochas nas paredes da dungeon
    for (let tx = 100; tx < 1800; tx += 300) {
      const flicker = Math.sin(this.animTime * 10 + tx) * 2;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath(); ctx.arc(tx, 120, 6 + flicker, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(tx, 120, 3, 0, Math.PI * 2); ctx.fill();
    }
  }

  renderWorldDrops() {
    const ctx = this.ctx;
    this.worldDrops.forEach(d => {
      if (d.floor !== this.currentFloor) return;
      const bob = Math.sin(this.animTime * 5 + d.id.charCodeAt(5)) * 3;

      ctx.save();
      ctx.translate(d.x, d.y + bob);

      // Aura brilhante com cor de raridade
      ctx.fillStyle = d.item.rarityColor;
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();

      // Ícone do item
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.item.icon || '⚔️', 0, 5);

      // Nome do item acima
      ctx.font = 'bold 9px Fredoka, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(d.item.name, 1, -17);
      ctx.fillStyle = d.item.rarityColor;
      ctx.fillText(d.item.name, 0, -18);
      ctx.restore();
    });
  }

  renderWorldBackground() {
    this.ctx.fillStyle = this.currentFloor === 0 ? '#1a162b' : '#0d0b17';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderDecorations() {
    const ctx = this.ctx;
    const th = this.treeHouse;
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(th.x - 30, th.y + 40, 60, 120);
    ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.ellipse(th.x, th.y + 20, 90, 70, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#eab308'; ctx.fillRect(th.x - 25, th.y - 10, 50, 45);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(th.x - 35, th.y - 10); ctx.lineTo(th.x, th.y - 35); ctx.lineTo(th.x + 35, th.y - 10); ctx.fill();

    const vx0 = this.camera.x - 60, vx1 = this.camera.x + this.canvas.width + 60;
    const vy0 = this.camera.y - 60, vy1 = this.camera.y + this.canvas.height + 100;

    this.decorations.forEach(dec => {
      if (dec.x < vx0 || dec.x > vx1 || dec.y < vy0 || dec.y > vy1) return;
      const x = dec.x, y = dec.y, sz = dec.size;
      switch (dec.type) {
        case 'adventure-tree':
          ctx.fillStyle = '#78350f'; ctx.fillRect(x - 3, y - 20, 6, 25);
          ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(x, y - 30, sz * 0.45, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.arc(x - sz * 0.15, y - 26, sz * 0.25, 0, Math.PI * 2); ctx.fill();
          break;
        case 'dark-tree':
          ctx.fillStyle = '#292524'; ctx.fillRect(x - 3, y - 22, 6, 27);
          ctx.fillStyle = '#14532d'; ctx.beginPath(); ctx.arc(x, y - 32, sz * 0.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#052e16'; ctx.beginPath(); ctx.arc(x + sz * 0.15, y - 28, sz * 0.28, 0, Math.PI * 2); ctx.fill();
          break;
        case 'snow-pine':
          ctx.fillStyle = '#57534e'; ctx.fillRect(x - 3, y - 6, 6, 12);
          ctx.fillStyle = '#0f766e';
          ctx.beginPath(); ctx.moveTo(x - sz * 0.4, y - 4); ctx.lineTo(x, y - sz); ctx.lineTo(x + sz * 0.4, y - 4); ctx.fill();
          ctx.fillStyle = '#f0f9ff';
          ctx.beginPath(); ctx.moveTo(x - sz * 0.18, y - sz * 0.62); ctx.lineTo(x, y - sz); ctx.lineTo(x + sz * 0.18, y - sz * 0.62); ctx.fill();
          break;
        case 'ice-crystal':
          ctx.fillStyle = '#7dd3fc';
          ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x - 3, y - sz * 0.9); ctx.lineTo(x + 3, y); ctx.fill();
          ctx.fillStyle = '#bae6fd';
          ctx.beginPath(); ctx.moveTo(x - 1, y); ctx.lineTo(x + 6, y - sz * 0.6); ctx.lineTo(x + 11, y); ctx.fill();
          break;
        case 'mushroom-deco':
          ctx.fillStyle = '#e7e5e4'; ctx.fillRect(x - 3, y - 10, 6, 12);
          ctx.fillStyle = '#7c3aed'; ctx.beginPath(); ctx.arc(x, y - 10, 11, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#ddd6fe'; ctx.fillRect(x - 5, y - 15, 3, 3); ctx.fillRect(x + 2, y - 13, 3, 3);
          break;
        case 'giant-flower':
          ctx.fillStyle = '#16a34a'; ctx.fillRect(x - 1.5, y - 14, 3, 16);
          ctx.fillStyle = '#f472b6';
          for (let k = 0; k < 5; k++) {
            const a = k * Math.PI * 2 / 5;
            ctx.beginPath(); ctx.arc(x + Math.cos(a) * 6, y - 18 + Math.sin(a) * 6, 4.5, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.arc(x, y - 18, 3.5, 0, Math.PI * 2); ctx.fill();
          break;
        case 'lollipop':
          ctx.fillStyle = '#f5f5f4'; ctx.fillRect(x - 1.5, y - 22, 3, 26);
          ctx.fillStyle = '#ec4899'; ctx.beginPath(); ctx.arc(x, y - 26, 10, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#fdf2f8'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, y - 26, 6, 0, Math.PI * 1.5); ctx.stroke();
          break;
        case 'candy-cane':
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x, y - 24); ctx.arc(x + 7, y - 24, 7, Math.PI, 0); ctx.stroke();
          ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 5; ctx.setLineDash([4, 5]);
          ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x, y - 24); ctx.arc(x + 7, y - 24, 7, Math.PI, 0); ctx.stroke();
          ctx.setLineDash([]);
          break;
        case 'rock':
          ctx.fillStyle = '#78716c'; ctx.beginPath(); ctx.ellipse(x, y - 4, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#a8a29e'; ctx.beginPath(); ctx.ellipse(x - 3, y - 7, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
          break;
      }
    });
  }

  renderChests() {
    const ctx = this.ctx;
    this.chests.forEach(chest => {
      ctx.fillStyle = chest.opened ? '#78350f' : '#b45309';
      ctx.fillRect(chest.x - 12, chest.y - 10, 24, 18);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(chest.x - 12, chest.y - 4, 24, 3);
    });
  }

  renderPlayerOverheadUI(p, isSelf = false) {
    const ctx = this.ctx;
    const px = Math.round(p.x);
    const py = Math.round(p.y);

    ctx.save();
    ctx.font = 'bold 9px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isSelf ? '#fef08a' : '#ffffff';
    ctx.fillText(`${p.profile.name} (Lv.${p.level || 1})`, px, py - 44);

    const hpW = 28;
    const hpRatio = Math.max(0, p.hp / (p.maxHp || 100));
    ctx.fillStyle = '#0f172a'; ctx.fillRect(px - hpW / 2, py - 40, hpW, 4);
    ctx.fillStyle = isSelf ? '#22c55e' : '#38bdf8';
    ctx.fillRect(px - hpW / 2 + 1, py - 39, (hpW - 2) * hpRatio, 2);

    if (p.chatMsg) {
      ctx.font = 'bold 10px Fredoka, sans-serif';
      const tw = ctx.measureText(p.chatMsg).width;
      const bw = Math.max(40, tw + 14);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(px - bw / 2, py - 68, bw, 20, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0f172a'; ctx.fillText(p.chatMsg, px, py - 54);
    }
    ctx.restore();
  }

  renderProjectiles() {
    const ctx = this.ctx;
    this.projectiles.forEach(p => {
      ctx.save(); ctx.translate(p.x, p.y);
      if (p.type === 'magic-orb') {
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();
      } else if (p.type === 'sonic-wave') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 1.6, -0.9, 0.9);
        ctx.stroke();
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, -0.6, 0.6);
        ctx.stroke();
      } else {
        ctx.rotate(Math.atan2(p.vy, p.vx));
        ctx.fillStyle = '#92400e'; ctx.fillRect(-8, -1.5, 16, 3);
      }
      ctx.restore();
    });
  }

  renderParticles() {
    const ctx = this.ctx;
    this.particles.forEach(p => {
      if (p.type === 'shockwave') {
        ctx.save(); ctx.strokeStyle = p.color; ctx.lineWidth = 4 * p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      } else if (p.type === 'slash') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 30, -0.6, 0.6); ctx.stroke(); ctx.restore();
      } else {
        ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    });
  }

  renderFloatingTexts() {
    const ctx = this.ctx;
    ctx.save(); ctx.font = 'bold 13px Fredoka, sans-serif'; ctx.textAlign = 'center';
    this.floatingTexts.forEach(t => {
      ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y);
    });
    ctx.restore();
  }

  updateHUD() {
    if (!this.hero) return;
    const hpPct = Math.max(0, (this.hero.hp / this.hero.maxHp) * 100);
    const mpPct = Math.max(0, (this.hero.mp / this.hero.maxMp) * 100);

    document.getElementById('hud-hp-fill').style.width = `${hpPct}%`;
    document.getElementById('hud-mp-fill').style.width = `${mpPct}%`;
    document.getElementById('hud-hp-text').innerText = `${Math.ceil(this.hero.hp)} / ${this.hero.maxHp}`;
    document.getElementById('hud-mp-text').innerText = `${Math.ceil(this.hero.mp)} / ${this.hero.maxMp}`;
    document.getElementById('hud-char-name').innerText = this.hero.profile.name;
    document.getElementById('hud-lvl').innerText = this.level;
    document.getElementById('hud-gold').innerText = this.gold;
    document.getElementById('hud-exp').innerText = this.exp;
    document.getElementById('hud-exp-next').innerText = this.expToNext;
    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
    setTxt('potion-count', this.potions); setTxt('touch-potion-count', this.potions);
    setTxt('sandwich-count', this.sandwiches); setTxt('touch-sandwich-count', this.sandwiches);
  }

  updateSkillDock() {
    const data = this.hero.classData;
    document.getElementById('skill-2-name').innerText = data.skillName;
    document.getElementById('skill-2-icon').innerText = data.skillIcon;

    const k = this.hero.profile.classKey;
    if (k === 'warrior') {
      document.getElementById('skill-1-icon').innerText = '⚔️';
      document.getElementById('skill-1-name').innerText = 'Golpe Espada';
    } else if (k === 'mage') {
      document.getElementById('skill-1-icon').innerText = '🔮';
      document.getElementById('skill-1-name').innerText = 'Orbe Mana';
    } else if (k === 'archer') {
      document.getElementById('skill-1-icon').innerText = '🏹';
      document.getElementById('skill-1-name').innerText = 'Disparo Flecha';
    } else if (k === 'vampire') {
      document.getElementById('skill-1-icon').innerText = '🎸';
      document.getElementById('skill-1-name').innerText = 'Acorde Sônico';
    }
  }

  updateSkillCooldownUI() {
    const maxCD = this.hero.classData.skillCooldown;
    const currentCD = Math.max(0, this.hero.skillCooldown);
    document.getElementById('skill-cd-overlay').style.height = `${(currentCD / maxCD) * 100}%`;
  }

  renderAvatarHUD() {
    const avatarCanvas = document.getElementById('hud-avatar-canvas');
    if (!avatarCanvas) return;
    const ctx = avatarCanvas.getContext('2d');
    ctx.clearRect(0, 0, avatarCanvas.width, avatarCanvas.height);
    PixelArtRenderer.drawHero(ctx, 20, 26, { scale: 1.6, facing: 'down', profile: this.hero.profile });
  }
}

// ===================================================================
// 7. INICIALIZAÇÃO E EVENTOS
// ===================================================================
window.addEventListener('DOMContentLoaded', () => {
  const previewCanvas = document.getElementById('preview-canvas');
  const previewCtx = previewCanvas.getContext('2d');
  const nameInput = document.getElementById('char-name');
  const classButtons = document.querySelectorAll('.class-btn');
  const outfitButtons = document.querySelectorAll('#outfit-colors .color-dot');
  const hatButtons = document.querySelectorAll('#hat-colors .color-dot');
  const skinButtons = document.querySelectorAll('#skin-colors .color-dot');
  const accessoryButtons = document.querySelectorAll('#accessory-types .tag-btn');
  const startBtn = document.getElementById('start-game-btn');

  function updatePreview() {
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    const classData = CLASS_CONFIGS[heroProfile.classKey];
    document.getElementById('preview-class-name').innerText = classData.name;
    document.getElementById('preview-quote').innerText = classData.quote;
    PixelArtRenderer.drawHero(previewCtx, 80, 95, { scale: 4.8, facing: 'down', profile: heroProfile });
  }

  function syncPaletteButtons() {
    hatButtons.forEach(b => b.classList.toggle('active', b.dataset.color === heroProfile.hatColor));
    skinButtons.forEach(b => b.classList.toggle('active', b.dataset.color === heroProfile.skinColor));
    outfitButtons.forEach(b => b.classList.toggle('active', b.dataset.color === heroProfile.outfitColor));
    
    document.querySelectorAll('#gender-types .tag-btn').forEach(b => b.classList.toggle('active', b.dataset.gender === heroProfile.gender));
    document.querySelectorAll('#eye-types .tag-btn').forEach(b => b.classList.toggle('active', b.dataset.eyes === heroProfile.eyes));
    document.querySelectorAll('#face-details .tag-btn').forEach(b => b.classList.toggle('active', b.dataset.face === heroProfile.faceDetail));
    document.querySelectorAll('#accessory-types .tag-btn').forEach(b => b.classList.toggle('active', b.dataset.acc === heroProfile.accessory));
    document.querySelectorAll('#pet-types .tag-btn').forEach(b => b.classList.toggle('active', b.dataset.pet === heroProfile.pet));
  }

  nameInput.addEventListener('input', (e) => heroProfile.name = e.target.value.trim() || 'Aventureiro');

  classButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      classButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      heroProfile.classKey = btn.dataset.class;

      // Aparência temática padrão por classe
      if (heroProfile.classKey === 'warrior') {
        heroProfile.hatColor = '#ffffff'; // Cabelo branco
        heroProfile.eyes = 'hetero';     // Um olho vermelho e um azul
        heroProfile.faceDetail = 'none';
        heroProfile.outfitColor = '#3aa3e3';
      } else if (heroProfile.classKey === 'mage') {
        heroProfile.hatColor = '#f472b6'; // Cabelo rosa curto
        heroProfile.eyes = 'blue';        // Olhos azuis arcanos
        heroProfile.faceDetail = 'freckles'; // Sardas fofas
        heroProfile.outfitColor = '#8a42db';
      } else if (heroProfile.classKey === 'archer') {
        heroProfile.hatColor = '#ffd166'; // Loiro aventureiro
        heroProfile.eyes = 'green';
        heroProfile.faceDetail = 'none';
        heroProfile.outfitColor = '#3fb950';
      } else if (heroProfile.classKey === 'vampire') {
        heroProfile.hatColor = '#0f172a'; // Cabelo preto longo Marceline
        heroProfile.eyes = 'red';
        heroProfile.faceDetail = 'none';
        heroProfile.outfitColor = '#d63342';
      }

      syncPaletteButtons();
      sounds.swordSwing();
      updatePreview();
    });
  });

  // Gênero
  const genderButtons = document.querySelectorAll('#gender-types .tag-btn');
  genderButtons.forEach(btn => btn.addEventListener('click', () => {
    genderButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    heroProfile.gender = btn.dataset.gender;
    updatePreview();
  }));

  // Olhos (com suporte a Heterocromia)
  const eyeButtons = document.querySelectorAll('#eye-types .tag-btn');
  eyeButtons.forEach(btn => btn.addEventListener('click', () => {
    eyeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    heroProfile.eyes = btn.dataset.eyes;
    updatePreview();
  }));

  // Detalhe Facial (Sardas, Cicatriz, Blush)
  const faceButtons = document.querySelectorAll('#face-details .tag-btn');
  faceButtons.forEach(btn => btn.addEventListener('click', () => {
    faceButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    heroProfile.faceDetail = btn.dataset.face;
    updatePreview();
  }));

  outfitButtons.forEach(btn => btn.addEventListener('click', () => {
    outfitButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    heroProfile.outfitColor = btn.dataset.color;
    updatePreview();
  }));

  hatButtons.forEach(btn => btn.addEventListener('click', () => {
    hatButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    heroProfile.hatColor = btn.dataset.color;
    updatePreview();
  }));

  skinButtons.forEach(btn => btn.addEventListener('click', () => {
    skinButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    heroProfile.skinColor = btn.dataset.color;
    updatePreview();
  }));

  accessoryButtons.forEach(btn => btn.addEventListener('click', () => {
    accessoryButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    heroProfile.accessory = btn.dataset.acc;
    updatePreview();
  }));

  const petButtons = document.querySelectorAll('#pet-types .tag-btn');
  petButtons.forEach(btn => btn.addEventListener('click', () => {
    petButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    heroProfile.pet = btn.dataset.pet;
  }));

  syncPaletteButtons();
  updatePreview();

  const game = new GameEngine();
  window.__game = game;

  const beginGame = (save) => {
    sounds.init();
    sounds.levelUp();
    document.getElementById('character-creation-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    game.resizeCanvas();
    game.start(heroProfile, save);
  };

  startBtn.addEventListener('click', () => beginGame(null));

  const saved = GameEngine.loadSave();
  const continueBtn = document.getElementById('continue-btn');
  if (saved && saved.profile && continueBtn) {
    continueBtn.textContent = `▶ CONTINUAR: ${saved.profile.name} (Nv. ${saved.level})`;
    continueBtn.classList.remove('hidden');
    continueBtn.addEventListener('click', () => {
      Object.assign(heroProfile, saved.profile);
      beginGame(saved);
    });
  }

  // Salva ao sair/trocar de aba
  document.addEventListener('visibilitychange', () => { if (document.hidden) game.saveGame(true); });
  window.addEventListener('pagehide', () => game.saveGame(true));

  // Chat Form
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (msg.length > 0) {
      game.sendNet('chat_message', { text: msg });
      chatInput.value = '';
    }
    chatInput.blur();
  });

  window.addEventListener('keydown', (e) => {
    if (document.body.classList.contains('hk-active')) return;
    const isChatFocused = document.activeElement === chatInput;

    if (e.code === 'Enter') {
      if (game.currentDialog) { game.closeDialog(); return; }
      if (!isChatFocused) { e.preventDefault(); chatInput.focus(); return; }
    }

    if (isChatFocused) return;
    game.keys[e.code] = true;

    if (e.code === 'Space') {
      if (game.currentDialog) game.closeDialog();
      else game.performBasicAttack();
    }
    if (e.code === 'KeyE') game.performSpecialSkill();
    if (e.code === 'KeyQ') game.usePotion();
    if (e.code === 'KeyF') game.eatSandwich();
    if (e.code === 'KeyT') game.talkToNpc(game.nearNpc);
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyR') game.performDash();
    if (e.code === 'Escape' && game.paused) game.closeShop();
    if (e.code === 'KeyM') {
      const active = sounds.toggle();
      document.getElementById('sound-toggle-btn').innerText = active ? '🔊' : '🔇';
    }
  });

  window.addEventListener('keyup', (e) => {
    if (document.activeElement === chatInput) return;
    game.keys[e.code] = false;
  });

  const gameCanvas = document.getElementById('game-canvas');
  gameCanvas.addEventListener('mousedown', (e) => {
    if (document.activeElement === chatInput) chatInput.blur();
    if (e.button === 0) {
      if (game.currentDialog) game.closeDialog();
      else game.performBasicAttack();
    } else if (e.button === 2) {
      game.performSpecialSkill();
    }
  });

  gameCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
  document.getElementById('dialog-box').addEventListener('click', () => game.closeDialog());
  document.getElementById('sound-toggle-btn').addEventListener('click', () => {
    document.getElementById('sound-toggle-btn').innerText = sounds.toggle() ? '🔊' : '🔇';
  });

  document.getElementById('skill-2-slot').addEventListener('click', () => game.performSpecialSkill());
  document.getElementById('potion-slot').addEventListener('click', () => game.usePotion());
  document.getElementById('sandwich-slot').addEventListener('click', () => game.eatSandwich());
  document.getElementById('respawn-btn').addEventListener('click', () => game.respawn());

  // Registro de PWA (Instalar App no celular)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  let deferredPrompt = null;
  const installBtn = document.getElementById('install-pwa-btn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'inline-block';
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          installBtn.style.display = 'none';
        }
        deferredPrompt = null;
      } else {
        alert('Para instalar o app: toque no menu do navegador (três pontinhos ou botão compartilhar) e escolha "Adicionar à Tela Inicial" / "Instalar Aplicativo"!');
      }
    });
  }
});
