/**
 * ===================================================================
 * HORA DA AVENTURA: CRÔNICAS DE OOO - RPG MULTIPLAYER EM PIXEL ART
 * Desenvolvido em HTML5 Canvas, WebSockets & Web Audio API
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
    } catch (e) {
      // Falha silenciosa se áudio não permitido ainda
    }
  }

  swordSwing() {
    this.playTone(320, 'triangle', 0.12, 0.15, -180);
  }

  magicCast() {
    this.playTone(550, 'sine', 0.22, 0.14, 300);
  }

  arrowShoot() {
    this.playTone(600, 'sawtooth', 0.08, 0.1, -350);
  }

  enemyHit() {
    this.playTone(180, 'square', 0.09, 0.16, -90);
  }

  playerHurt() {
    this.playTone(140, 'sawtooth', 0.2, 0.2, -60);
  }

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

    // Pequeno tema musical alegre e chiptune estilo Hora de Aventura
    const melody = [
      { f: 523.25, d: 200 }, // C5
      { f: 587.33, d: 200 }, // D5
      { f: 659.25, d: 200 }, // E5
      { f: 783.99, d: 350 }, // G5
      { f: 659.25, d: 200 }, // E5
      { f: 523.25, d: 400 }, // C5
      { f: 440.00, d: 250 }, // A4
      { f: 523.25, d: 450 }, // C5
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
    if (!this.enabled) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
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
    hp: 120,
    mp: 40,
    atk: 18,
    spd: 3.2,
    attackType: 'melee',
    skillName: 'Ataque Furacão',
    skillIcon: '🌀',
    skillCooldown: 4000, // 4s
    mpCost: 15,
    desc: 'Combate corpo a corpo com espada heroica e giro de 360°.'
  },
  mage: {
    name: "Mago",
    quote: '"Pela magia das estrelas e do chiclete cósmico!"',
    hp: 80,
    mp: 100,
    atk: 14,
    spd: 3.0,
    attackType: 'magic',
    skillName: 'Explosão Cósmica',
    skillIcon: '🔮',
    skillCooldown: 3500, // 3.5s
    mpCost: 20,
    desc: 'Projéteis mágicos luminosos e onda de choque arcana massiva.'
  },
  archer: {
    name: "Arqueiro",
    quote: '"Na mosca! Rápido como o vento das Colinas de Ooo!"',
    hp: 95,
    mp: 60,
    atk: 15,
    spd: 3.8,
    attackType: 'ranged',
    skillName: 'Chuva de Flechas',
    skillIcon: '🏹',
    skillCooldown: 3000, // 3s
    mpCost: 18,
    desc: 'Disparo de flechas velozes e tiro em leque tríplice.'
  }
};

// ===================================================================
// 3. ESTADO GLOBAL DO PERSONAGEM (CRIAÇÃO)
// ===================================================================
const heroProfile = {
  name: "Finnelson",
  classKey: "warrior",
  outfitColor: "#3aa3e3",  // Azul clássico do Finn
  hatColor: "#ffffff",     // Capuz branco clássico
  skinColor: "#ffe0bd",    // Tom de pele clara
  accessory: "backpack"    // 'backpack', 'cape', 'none'
};

// ===================================================================
// 4. RENDERIZADOR DE SPRITES PIXEL ART
// ===================================================================
class PixelArtRenderer {
  /**
   * Desenha o herói (local ou outro jogador online)
   */
  static drawHero(ctx, x, y, options = {}) {
    const scale = options.scale || 3;
    const facing = options.facing || 'down';
    const isMoving = options.isMoving || false;
    const animFrame = options.animFrame || 0;
    const isAttacking = options.isAttacking || false;
    const attackProgress = options.attackProgress || 0;

    const {
      classKey = 'warrior',
      outfitColor = '#3aa3e3',
      hatColor = '#ffffff',
      skinColor = '#ffe0bd',
      accessory = 'backpack'
    } = options.profile || heroProfile;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    // Espelhamento para esquerda
    if (facing === 'left') {
      ctx.scale(-1, 1);
    }

    // Offset da animação de andar
    const bob = isMoving ? Math.sin(animFrame * 0.4) * 1.5 : 0;

    // Sombra oval no chão estilo Adventure Time
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 7 * scale, 7 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. CAPA / MOCHILA DE FUNDO
    if (accessory === 'backpack' && facing === 'up') {
      ctx.fillStyle = '#2e8b57';
      ctx.fillRect(-5 * scale, (-5 + bob) * scale, 10 * scale, 8 * scale);
      ctx.fillStyle = '#1e5f3a';
      ctx.fillRect(-4 * scale, (-4 + bob) * scale, 8 * scale, 6 * scale);
    }
    if (accessory === 'cape') {
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(-6 * scale, (-3 + bob) * scale, 12 * scale, 10 * scale);
    }

    // 2. PERNAS E PÉS
    const legOffset1 = isMoving ? Math.sin(animFrame * 0.5) * 3 : 0;
    const legOffset2 = isMoving ? -Math.sin(animFrame * 0.5) * 3 : 0;

    // Shorts/Calça azul
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(-4 * scale, (2 + bob) * scale, 3 * scale, 4 * scale);
    ctx.fillRect(1 * scale, (2 + bob) * scale, 3 * scale, 4 * scale);

    // Sapatos pretos
    ctx.fillStyle = '#0f172a';
    ctx.fillRect((-4 + (legOffset1 > 0 ? 1 : 0)) * scale, (5 + legOffset1) * scale, 3 * scale, 2 * scale);
    ctx.fillRect((1 + (legOffset2 > 0 ? 1 : 0)) * scale, (5 + legOffset2) * scale, 3 * scale, 2 * scale);

    // 3. TRONCO / ROUPA
    ctx.fillStyle = outfitColor;
    ctx.fillRect(-5 * scale, (-5 + bob) * scale, 10 * scale, 7 * scale);

    // Detalhe de cinto
    ctx.fillStyle = '#3a2510';
    ctx.fillRect(-5 * scale, (1 + bob) * scale, 10 * scale, 1.5 * scale);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-1.5 * scale, (1 + bob) * scale, 3 * scale, 1.5 * scale);

    // 4. MOCHILA VERDE LATERAL (estilo Finn)
    if (accessory === 'backpack' && facing !== 'up') {
      ctx.fillStyle = '#3fb950';
      ctx.fillRect(-7 * scale, (-4 + bob) * scale, 3 * scale, 6 * scale);
      ctx.fillStyle = '#238636';
      ctx.fillRect(-7 * scale, (-2 + bob) * scale, 2 * scale, 3 * scale);
    }

    // 5. CABEÇA E CAPUZ / CHAPÉU
    ctx.fillStyle = hatColor;
    ctx.fillRect(-6 * scale, (-15 + bob) * scale, 12 * scale, 10 * scale);

    if (classKey === 'warrior') {
      // Orelhinhas de urso no capuz
      ctx.fillStyle = hatColor;
      ctx.fillRect(-6 * scale, (-18 + bob) * scale, 3 * scale, 4 * scale);
      ctx.fillRect(3 * scale, (-18 + bob) * scale, 3 * scale, 4 * scale);
    } else if (classKey === 'mage') {
      // Chapéu pontudo de feiticeiro
      ctx.fillStyle = hatColor;
      ctx.fillRect(-3 * scale, (-20 + bob) * scale, 6 * scale, 6 * scale);
      ctx.fillRect(-1.5 * scale, (-24 + bob) * scale, 3 * scale, 5 * scale);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-1 * scale, (-18 + bob) * scale, 2 * scale, 2 * scale);
    } else if (classKey === 'archer') {
      // Pena de caçador
      ctx.fillStyle = '#10b981';
      ctx.fillRect(3 * scale, (-19 + bob) * scale, 3 * scale, 5 * scale);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(4 * scale, (-21 + bob) * scale, 2 * scale, 3 * scale);
    }

    // Rosto
    if (facing !== 'up') {
      ctx.fillStyle = skinColor;
      ctx.fillRect(-4 * scale, (-12 + bob) * scale, 8 * scale, 6 * scale);

      ctx.fillStyle = '#0f172a';
      if (facing === 'down') {
        ctx.fillRect(-2.5 * scale, (-10 + bob) * scale, 1.5 * scale, 2 * scale);
        ctx.fillRect(1 * scale, (-10 + bob) * scale, 1.5 * scale, 2 * scale);
        ctx.fillStyle = '#c2410c';
        ctx.fillRect(-1.5 * scale, (-7 + bob) * scale, 3 * scale, 1 * scale);
      } else {
        ctx.fillRect(0.5 * scale, (-10 + bob) * scale, 1.5 * scale, 2 * scale);
        ctx.fillStyle = '#c2410c';
        ctx.fillRect(0 * scale, (-7 + bob) * scale, 2 * scale, 1 * scale);
      }
    }

    // 6. ARMAS & ANIMAÇÃO DE ATAQUE
    const atkAngle = isAttacking ? Math.sin(attackProgress * Math.PI) * 1.2 : 0;

    if (classKey === 'warrior') {
      // ESPADA HEROICA DOURADA
      ctx.save();
      ctx.translate(4 * scale, (-1 + bob) * scale);
      if (isAttacking) {
        ctx.rotate(-0.5 + atkAngle * 1.5);
      }
      ctx.fillStyle = '#3a2510';
      ctx.fillRect(-1 * scale, 0, 2 * scale, 4 * scale);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-3 * scale, -2 * scale, 6 * scale, 2 * scale);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-1.5 * scale, -13 * scale, 3 * scale, 11 * scale);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-0.5 * scale, -14 * scale, 1 * scale, 12 * scale);
      ctx.restore();
    } else if (classKey === 'mage') {
      // CAJADO DE CRISTAL
      ctx.save();
      ctx.translate(5 * scale, (-2 + bob) * scale);
      if (isAttacking) {
        ctx.rotate(-0.3 + atkAngle);
      }
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-1 * scale, -3 * scale, 2 * scale, 14 * scale);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-3 * scale, -8 * scale, 6 * scale, 5 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1 * scale, -7 * scale, 2 * scale, 3 * scale);
      ctx.restore();
    } else if (classKey === 'archer') {
      // ARCO LONGO
      ctx.save();
      ctx.translate(4 * scale, (-2 + bob) * scale);
      if (isAttacking) {
        ctx.rotate(-0.2 + atkAngle);
      }
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, -9 * scale, 2 * scale, 14 * scale);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-2 * scale, -8 * scale, 1 * scale, 12 * scale);
      if (isAttacking) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-5 * scale, -3 * scale, 9 * scale, 2 * scale);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Renderiza os monstros
   */
  static drawMonster(ctx, m, animTime) {
    const scale = m.scale || 2.5;
    ctx.save();
    ctx.translate(Math.round(m.x), Math.round(m.y));

    if (m.hurtTimer > 0) {
      ctx.filter = 'brightness(2.5) drop-shadow(0 0 5px #ef4444)';
    }

    if (m.type === 'slime') {
      const squish = Math.sin(animTime * 6 + m.id) * 0.18;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 10 * scale, (8 + squish * 4) * scale, 3 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = m.color || '#ec4899';
      ctx.beginPath();
      ctx.ellipse(0, (2 - squish * 4) * scale, (8 + squish * 3) * scale, (7 - squish * 4) * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.ellipse(-3 * scale, (-1 - squish * 4) * scale, 2.5 * scale, 1.5 * scale, -0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-3 * scale, (0 - squish * 4) * scale, 2 * scale, 2.5 * scale);
      ctx.fillRect(2 * scale, (0 - squish * 4) * scale, 2 * scale, 2.5 * scale);
    } else if (m.type === 'skeleton') {
      const wobble = Math.sin(animTime * 4 + m.id) * 1.5;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 12 * scale, 7 * scale, 3 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-5 * scale, (-12 + wobble) * scale, 10 * scale, 8 * scale);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-3.5 * scale, (-9 + wobble) * scale, 2 * scale, 2 * scale);
      ctx.fillRect(1.5 * scale, (-9 + wobble) * scale, 2 * scale, 2 * scale);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(-3 * scale, (-8.5 + wobble) * scale, 1 * scale, 1 * scale);
      ctx.fillRect(2 * scale, (-8.5 + wobble) * scale, 1 * scale, 1 * scale);

      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-1.5 * scale, (-4 + wobble) * scale, 3 * scale, 8 * scale);
      ctx.fillRect(-4 * scale, (-2 + wobble) * scale, 8 * scale, 1.5 * scale);
      ctx.fillRect(-3 * scale, (0 + wobble) * scale, 6 * scale, 1.5 * scale);

      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-3 * scale, (4 + wobble) * scale, 2 * scale, 7 * scale);
      ctx.fillRect(1 * scale, (4 + wobble) * scale, 2 * scale, 7 * scale);
    } else if (m.type === 'mushroom') {
      const hop = Math.abs(Math.sin(animTime * 5 + m.id)) * 5;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 8 * scale, 6 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, (-2 - hop) * scale, 9 * scale, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-5 * scale, (-8 - hop) * scale, 3 * scale, 3 * scale);
      ctx.fillRect(2 * scale, (-7 - hop) * scale, 2.5 * scale, 2.5 * scale);
      ctx.fillRect(-1 * scale, (-10 - hop) * scale, 2.5 * scale, 2 * scale);

      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(-4 * scale, (-2 - hop) * scale, 8 * scale, 7 * scale);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-2 * scale, (0 - hop) * scale, 1.5 * scale, 2 * scale);
      ctx.fillRect(1 * scale, (0 - hop) * scale, 1.5 * scale, 2 * scale);
    } else if (m.type === 'boss') {
      const squish = Math.sin(animTime * 3) * 0.15;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 16 * scale, (16 + squish * 4) * scale, 5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.ellipse(0, (2 - squish * 4) * scale, (15 + squish * 3) * scale, (13 - squish * 4) * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.ellipse(-4 * scale, (-3 - squish * 4) * scale, 6 * scale, 3 * scale, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-8 * scale, (-15 - squish * 4) * scale, 16 * scale, 4 * scale);
      ctx.beginPath();
      ctx.moveTo(-8 * scale, (-15 - squish * 4) * scale);
      ctx.lineTo(-4 * scale, (-22 - squish * 4) * scale);
      ctx.lineTo(0, (-15 - squish * 4) * scale);
      ctx.lineTo(4 * scale, (-22 - squish * 4) * scale);
      ctx.lineTo(8 * scale, (-15 - squish * 4) * scale);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-2 * scale, (-14 - squish * 4) * scale, 4 * scale, 3 * scale);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6 * scale, (-2 - squish * 4) * scale, 4 * scale, 5 * scale);
      ctx.fillRect(2 * scale, (-2 - squish * 4) * scale, 4 * scale, 5 * scale);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-5 * scale, (-1 - squish * 4) * scale, 2.5 * scale, 3 * scale);
      ctx.fillRect(3 * scale, (-1 - squish * 4) * scale, 2.5 * scale, 3 * scale);

      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(-4 * scale, (4 - squish * 4) * scale, 8 * scale, 2 * scale);
    }

    // Barra de Vida do monstro
    const barW = Math.max(26, m.maxHp * 0.6);
    const barH = 5;
    const hpPct = Math.max(0, m.hp / m.maxHp);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-barW / 2, -18 * scale, barW, barH);
    ctx.fillStyle = m.isBoss ? '#f59e0b' : '#ef4444';
    ctx.fillRect(-barW / 2 + 1, -18 * scale + 1, (barW - 2) * hpPct, barH - 2);

    ctx.restore();
  }

  /**
   * Renderiza NPCs icônicos
   */
  static drawNPC(ctx, npc, animTime) {
    const scale = npc.scale || 3;
    ctx.save();
    ctx.translate(Math.round(npc.x), Math.round(npc.y));

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 8 * scale, 7 * scale, 3 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    const bob = Math.sin(animTime * 3 + npc.id) * 1.5;

    if (npc.role === 'jake') {
      ctx.fillStyle = '#ffd028';
      ctx.beginPath();
      ctx.ellipse(0, (-2 + bob) * scale, 7 * scale, 8 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

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
      ctx.beginPath();
      ctx.ellipse(0, (-1 + bob) * scale, 4 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-1.5 * scale, (-2.5 + bob) * scale, 3 * scale, 2 * scale);

      ctx.fillStyle = '#eab308';
      ctx.fillRect(-4 * scale, (5 + bob) * scale, 2.5 * scale, 3 * scale);
      ctx.fillRect(1.5 * scale, (5 + bob) * scale, 2.5 * scale, 3 * scale);
    } else if (npc.role === 'bmo') {
      ctx.fillStyle = '#5eead4';
      ctx.fillRect(-6 * scale, (-10 + bob) * scale, 12 * scale, 14 * scale);
      ctx.fillStyle = '#115e59';
      ctx.fillRect(-4.5 * scale, (-8 + bob) * scale, 9 * scale, 6 * scale);
      ctx.fillStyle = '#ccfbf1';
      ctx.fillRect(-3 * scale, (-6 + bob) * scale, 1.5 * scale, 1.5 * scale);
      ctx.fillRect(1.5 * scale, (-6 + bob) * scale, 1.5 * scale, 1.5 * scale);
      ctx.fillRect(-1.5 * scale, (-4 + bob) * scale, 3 * scale, 1 * scale);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-3.5 * scale, (0 + bob) * scale, 2.5 * scale, 2.5 * scale);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(2 * scale, 1 * scale + bob * scale, 1.2 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    if (npc.isNearby) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-14 * scale, (-22 + bob) * scale, 28 * scale, 7 * scale);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-14 * scale, (-22 + bob) * scale, 28 * scale, 7 * scale);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 8px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FALAR [ESPAÇO]', 0, (-17 + bob) * scale);
    }

    ctx.restore();
  }
}

// ===================================================================
// 5. MOTOR PRINCIPAL DO JOGO (GAME ENGINE MULTIPLAYER)
// ===================================================================
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.running = false;
    this.keys = {};

    // Dimensões do mapa do mundo de Ooo
    this.worldWidth = 2400;
    this.worldHeight = 1800;

    // Câmera
    this.camera = { x: 0, y: 0 };
    this.screenShake = 0;

    // Herói Local
    this.hero = null;

    // MULTIPLAYER WEBSOCKET
    this.socket = null;
    this.isMultiplayer = false;
    this.selfId = null;
    this.otherPlayers = new Map(); // id -> { id, x, y, facing, isMoving, animFrame, profile, hp, maxHp, level, chatMsg, chatTimer }
    this.lastNetworkSync = 0;

    // Entidades
    this.monsters = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.npcs = [];
    this.chests = [];
    this.decorations = [];

    // Diálogos
    this.currentDialog = null;

    // Tempo
    this.lastTime = performance.now();
    this.animTime = 0;

    // Recursos
    this.gold = 0;
    this.exp = 0;
    this.level = 1;
    this.expToNext = 50;
    this.potions = 3;

    this.initWorldDecorations();
    this.initNPCs();
    this.initChests();
    this.spawnMonsters();
    this.initWebSocket();
  }

  // ===================================================================
  // 6. REDE WEBSOCKET & SINCRONIZAÇÃO MULTIPLAYER
  // ===================================================================
  initWebSocket() {
    let wsUrl = 'ws://localhost:3000';
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${proto}//${window.location.host}`;
    }

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isMultiplayer = true;
        console.log("🟢 Conectado ao servidor multiplayer de Ooo!");
        this.appendChatMessage("system", "🟢 Conectado ao servidor multiplayer de Ooo!");
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleNetworkMessage(data);
        } catch (err) {
          console.error("Erro ao decodificar mensagem WS:", err);
        }
      };

      this.socket.onclose = () => {
        this.isMultiplayer = false;
        console.log("🔴 Desconectado do servidor multiplayer.");
        this.updateOnlineCount();
      };

      this.socket.onerror = () => {
        this.isMultiplayer = false;
      };
    } catch (e) {
      console.warn("Multiplayer indisponível no momento:", e);
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
          if (p.id !== this.selfId) {
            this.otherPlayers.set(p.id, p);
          }
        });

        // Sincroniza monstros se vierem do servidor
        if (data.monsters && data.monsters.length > 0) {
          this.monsters = data.monsters;
        }

        // Sincroniza baús
        if (data.chests) {
          data.chests.forEach(ch => {
            const localCh = this.chests.find(c => c.id === ch.id);
            if (localCh) localCh.opened = ch.opened;
          });
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
          p.x = data.x;
          p.y = data.y;
          p.facing = data.facing;
          p.isMoving = data.isMoving;
          p.animFrame = data.animFrame;
          p.hp = data.hp;
          p.level = data.level;
        }
        break;
      }

      case 'player_attacked': {
        const p = this.otherPlayers.get(data.id);
        if (p) {
          p.isAttacking = true;
          p.attackProgress = 0;
          if (data.actionType === 'basic') {
            if (data.classKey === 'warrior') sounds.swordSwing();
            else if (data.classKey === 'mage') sounds.magicCast();
            else if (data.classKey === 'archer') sounds.arrowShoot();
          } else {
            sounds.specialSkill();
          }

          // Adiciona projéteis remotos
          if (data.projectiles && data.projectiles.length > 0) {
            data.projectiles.forEach(proj => this.projectiles.push(proj));
          }
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
          m.hp = data.hp;
          m.hurtTimer = 0.2;
          const label = data.isCrit ? `${data.damage} CRÍTICO!` : `${data.damage}`;
          const color = data.isCrit ? '#fbbf24' : '#ffffff';
          this.spawnFloatingText(label, m.x, m.y - 25, color);
          sounds.enemyHit();
        }
        break;
      }

      case 'monster_killed': {
        const idx = this.monsters.findIndex(mon => mon.id === data.monsterId);
        if (idx !== -1) {
          const m = this.monsters[idx];
          this.killMonster(m, idx, false); // Não duplicar recompensa se não foi este cliente
          this.appendChatMessage("system", `⚔️ ${data.killerName} derrotou ${m.name}!`);
        }
        break;
      }

      case 'sync_monsters': {
        // Interpolação suave dos monstros pelo servidor
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

      case 'chest_opened': {
        const ch = this.chests.find(c => c.id === data.chestId);
        if (ch) {
          ch.opened = true;
          this.appendChatMessage("system", `📦 ${data.openedBy} abriu um baú de tesouro!`);
        }
        break;
      }

      case 'player_chat': {
        this.appendChatMessage("user", data.text, data.name);
        // Exibe balão de fala sobre o herói
        if (data.id === this.selfId && this.hero) {
          this.hero.chatMsg = data.text;
          this.hero.chatTimer = 4.0;
        } else {
          const p = this.otherPlayers.get(data.id);
          if (p) {
            p.chatMsg = data.text;
            p.chatTimer = 4.0;
          }
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
    } else {
      div.innerText = text;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  escapeHtml(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m]);
  }

  start(profile) {
    this.hero = {
      x: 350,
      y: 350,
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

    // Notifica servidor sobre entrada
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

    // Exibir primeiro diálogo do Jake
    setTimeout(() => {
      this.showDialog(
        "Jake o Cão",
        "🐶",
        `E aí, ${this.hero.profile.name}! Agora você pode explorar a Terra de Ooo sozinho ou com seus amigos online! Pressione [ENTER] para falar no chat! Matemático!`
      );
    }, 600);

    sounds.startBgm();
  }

  initWorldDecorations() {
    this.decorations = [];

    // CASA DA ÁRVORE DOS HERÓIS
    this.treeHouse = {
      x: 350,
      y: 180,
      width: 160,
      height: 200
    };

    for (let i = 0; i < 90; i++) {
      const type = (i % 5 === 0) ? 'candy-cane' : (i % 3 === 0) ? 'giant-flower' : (i % 4 === 0) ? 'lollipop' : 'adventure-tree';
      this.decorations.push({
        x: Math.random() * (this.worldWidth - 200) + 100,
        y: Math.random() * (this.worldHeight - 200) + 100,
        type: type,
        size: 30 + Math.random() * 25
      });
    }

    for (let i = 0; i < 15; i++) {
      this.decorations.push({
        x: i * 160 + 50,
        y: 80,
        type: 'icecream-mountain',
        size: 70
      });
    }
  }

  initNPCs() {
    this.npcs = [
      {
        id: 1,
        name: "Jake o Cão",
        role: "jake",
        x: 420,
        y: 350,
        dialogs: [
          "E aí, irmão! Se você abrir outra aba em localhost:3000, você pode jogar em cooperação!",
          "Aperte [ENTER] para mandar mensagens no chat para todo mundo em Ooo!",
          "Derrote o Rei Gelatina no norte com seus amigos para salvar o Reino dos Doces!"
        ],
        dialogIndex: 0
      },
      {
        id: 2,
        name: "BMO",
        role: "bmo",
        x: 270,
        y: 360,
        dialogs: [
          "BEEP BOOP! Eu sou o BMO! O modo multiplayer está ativado!",
          "Pressione [Q] para usar Poções Doces deliciosas!",
          "Quem quer jogar comigo? Matemático!"
        ],
        dialogIndex: 0
      }
    ];
  }

  initChests() {
    this.chests = [
      { id: 1, x: 550, y: 500, opened: false, gold: 35, potion: 1 },
      { id: 2, x: 1200, y: 700, opened: false, gold: 60, potion: 2 },
      { id: 3, x: 1800, y: 350, opened: false, gold: 100, potion: 2 },
      { id: 4, x: 1500, y: 1300, opened: false, gold: 120, potion: 3 }
    ];
  }

  spawnMonsters() {
    this.monsters = [];
    let monsterId = 1;

    for (let i = 0; i < 16; i++) {
      this.monsters.push({
        id: monsterId++,
        type: 'slime',
        name: 'Slime de Doce',
        x: 600 + Math.random() * 1200,
        y: 400 + Math.random() * 900,
        hp: 35,
        maxHp: 35,
        atk: 6,
        spd: 1.4,
        expReward: 15,
        goldReward: 5,
        color: '#ec4899',
        hurtTimer: 0
      });
    }

    for (let i = 0; i < 10; i++) {
      this.monsters.push({
        id: monsterId++,
        type: 'mushroom',
        name: 'Cogumelo Saltitante',
        x: 800 + Math.random() * 1100,
        y: 300 + Math.random() * 800,
        hp: 45,
        maxHp: 45,
        atk: 8,
        spd: 1.8,
        expReward: 20,
        goldReward: 8,
        hurtTimer: 0
      });
    }

    for (let i = 0; i < 8; i++) {
      this.monsters.push({
        id: monsterId++,
        type: 'skeleton',
        name: 'Esqueleto Guardião',
        x: 1600 + Math.random() * 600,
        y: 600 + Math.random() * 800,
        hp: 65,
        maxHp: 65,
        atk: 12,
        spd: 2.0,
        expReward: 35,
        goldReward: 15,
        hurtTimer: 0
      });
    }

    this.monsters.push({
      id: monsterId++,
      type: 'boss',
      isBoss: true,
      name: 'Rei Gelatina Doce',
      x: 1700,
      y: 280,
      scale: 3.5,
      hp: 300,
      maxHp: 300,
      atk: 18,
      spd: 1.2,
      expReward: 150,
      goldReward: 100,
      hurtTimer: 0
    });
  }

  // ===================================================================
  // 7. LOOP DE ATUALIZAÇÃO E FÍSICA
  // ===================================================================
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
    if (!this.hero || this.hero.hp <= 0) return;

    // 1. Cooldowns
    if (this.hero.attackCooldown > 0) this.hero.attackCooldown -= dt * 1000;
    if (this.hero.skillCooldown > 0) {
      this.hero.skillCooldown -= dt * 1000;
      this.updateSkillCooldownUI();
    }
    if (this.hero.invulnerableTimer > 0) this.hero.invulnerableTimer -= dt;

    // Chat Balão Timer do Herói
    if (this.hero.chatTimer > 0) {
      this.hero.chatTimer -= dt;
      if (this.hero.chatTimer <= 0) this.hero.chatMsg = null;
    }

    // Chat Balão Timer dos outros jogadores
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

    // 2. Animação de Ataque
    if (this.hero.isAttacking) {
      this.hero.attackProgress += dt * 6;
      if (this.hero.attackProgress >= 1) {
        this.hero.isAttacking = false;
        this.hero.attackProgress = 0;
      }
    }

    // 3. Movimento do Herói (apenas se chat não estiver ativo)
    const isChatFocused = document.activeElement === document.getElementById('chat-input');
    let dx = 0;
    let dy = 0;

    if (!isChatFocused) {
      if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;
    }

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const moveSpeed = this.hero.spd * 60 * dt;
      this.hero.x += (dx / len) * moveSpeed;
      this.hero.y += (dy / len) * moveSpeed;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.hero.facing = dx > 0 ? 'right' : 'left';
      } else {
        this.hero.facing = dy > 0 ? 'down' : 'up';
      }

      this.hero.isMoving = true;
      this.hero.animFrame += dt * 10;

      this.hero.x = Math.max(30, Math.min(this.worldWidth - 30, this.hero.x));
      this.hero.y = Math.max(30, Math.min(this.worldHeight - 30, this.hero.y));
    } else {
      this.hero.isMoving = false;
      this.hero.animFrame = 0;
    }

    // Transmissão periódica de posição via WebSocket (~60ms)
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

    // Câmera segue o herói suavemente
    const targetCamX = this.hero.x - this.canvas.width / 2;
    const targetCamY = this.hero.y - this.canvas.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    this.camera.x = Math.max(0, Math.min(this.worldWidth - this.canvas.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.worldHeight - this.canvas.height, this.camera.y));

    if (this.screenShake > 0) this.screenShake -= dt * 15;

    // 4. Regeneração passiva leve de Mana
    if (this.hero.mp < this.hero.maxMp) {
      this.hero.mp = Math.min(this.hero.maxMp, this.hero.mp + dt * 2.5);
      this.updateHUD();
    }

    // 5. Atualizar Inimigos
    this.updateMonsters(dt);

    // 6. Atualizar Projéteis
    this.updateProjectiles(dt);

    // 7. Atualizar Partículas e Textos Flutuantes
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    // 8. Checar Proximidade com NPCs e Baús
    this.checkInteractions();
  }

  updateMonsters(dt) {
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];
      if (m.hurtTimer > 0) m.hurtTimer -= dt;

      const dist = Math.hypot(this.hero.x - m.x, this.hero.y - m.y);
      const agroRange = m.isBoss ? 450 : 260;

      // Se não estiver em multiplayer (ou servidor ainda não sincronizou), usa IA local
      if (!this.isMultiplayer && dist < agroRange && dist > 15) {
        const mx = (this.hero.x - m.x) / dist;
        const my = (this.hero.y - m.y) / dist;
        m.x += mx * m.spd * 60 * dt;
        m.y += my * m.spd * 60 * dt;
      }

      // Dano ao herói ao encostar
      if (dist < 28 && this.hero.invulnerableTimer <= 0 && m.hp > 0) {
        this.damageHero(m.atk);
      }

      if (m.hp <= 0 && !this.isMultiplayer) {
        this.killMonster(m, i, true);
      }
    }
  }

  damageHero(dmg) {
    this.hero.hp = Math.max(0, this.hero.hp - dmg);
    this.hero.invulnerableTimer = 0.6;
    this.screenShake = 6;
    sounds.playerHurt();
    this.spawnFloatingText(`-${dmg}`, this.hero.x, this.hero.y - 20, '#ef4444');
    this.updateHUD();

    if (this.hero.hp <= 0) {
      this.onGameOver();
    }
  }

  killMonster(m, index, giveReward = true) {
    this.monsters.splice(index, 1);
    this.screenShake = m.isBoss ? 14 : 5;
    sounds.enemyHit();

    if (giveReward) {
      this.addExp(m.expReward);
      this.addGold(m.goldReward);
    }

    const color = m.isBoss ? '#f59e0b' : m.color || '#ec4899';
    for (let p = 0; p < (m.isBoss ? 35 : 12); p++) {
      this.particles.push({
        x: m.x,
        y: m.y,
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.5) * 160,
        color: color,
        size: 3 + Math.random() * 4,
        life: 0.5 + Math.random() * 0.4
      });
    }

    if (m.isBoss) {
      sounds.bossDefeat();
      this.showBanner("VITÓRIA ÉPICA!", "O Grande Rei Gelatina Doce foi derrotado!");
      document.getElementById('hud-objective-text').innerText = "Parabéns, Heróis! A Terra de Ooo está a salvo!";
    }
  }

  addExp(amount) {
    this.exp += amount;
    this.spawnFloatingText(`+${amount} XP`, this.hero.x, this.hero.y - 35, '#38bdf8');

    if (this.exp >= this.expToNext) {
      this.exp -= this.expToNext;
      this.level++;
      this.expToNext = Math.round(this.expToNext * 1.6);

      this.hero.maxHp += 20;
      this.hero.hp = this.hero.maxHp;
      this.hero.maxMp += 15;
      this.hero.mp = this.hero.maxMp;
      this.hero.atk += 4;

      sounds.levelUp();
      this.showBanner("MATEMÁTICO!", `Subiu para o NÍVEL ${this.level}!`);
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
    if (this.potions <= 0) {
      this.spawnFloatingText("Sem Poções!", this.hero.x, this.hero.y - 20, '#ef4444');
      return;
    }
    if (this.hero.hp >= this.hero.maxHp) {
      this.spawnFloatingText("Vida Cheia!", this.hero.x, this.hero.y - 20, '#10b981');
      return;
    }

    this.potions--;
    const heal = Math.round(this.hero.maxHp * 0.5);
    this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + heal);
    sounds.potionDrink();
    this.spawnFloatingText(`+${heal} HP`, this.hero.x, this.hero.y - 30, '#10b981');

    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: this.hero.x + (Math.random() - 0.5) * 20,
        y: this.hero.y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 40,
        vy: -50 - Math.random() * 40,
        color: '#10b981',
        size: 3,
        life: 0.6
      });
    }

    document.getElementById('potion-count').innerText = this.potions;
    this.updateHUD();
  }

  // ===================================================================
  // 8. COMBATE & HABILIDADES ESPECIAIS
  // ===================================================================
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
      const arcAngle = 1.6;
      let dirAngle = 0;
      if (this.hero.facing === 'down') dirAngle = Math.PI / 2;
      else if (this.hero.facing === 'up') dirAngle = -Math.PI / 2;
      else if (this.hero.facing === 'right') dirAngle = 0;
      else if (this.hero.facing === 'left') dirAngle = Math.PI;

      this.particles.push({
        x: this.hero.x + Math.cos(dirAngle) * 25,
        y: this.hero.y + Math.sin(dirAngle) * 25,
        type: 'slash',
        angle: dirAngle,
        life: 0.15
      });

      this.monsters.forEach(m => {
        const d = Math.hypot(m.x - this.hero.x, m.y - this.hero.y);
        if (d <= hitRadius) {
          const angleToM = Math.atan2(m.y - this.hero.y, m.x - this.hero.x);
          const diff = Math.abs(angleToM - dirAngle);
          if (diff < arcAngle || Math.abs(diff - Math.PI * 2) < arcAngle) {
            this.hitMonster(m, this.hero.atk);
          }
        }
      });
    } else if (classKey === 'mage') {
      sounds.magicCast();
      const dir = this.getFacingVector();
      const orb = {
        x: this.hero.x,
        y: this.hero.y - 10,
        vx: dir.x * 380,
        vy: dir.y * 380,
        radius: 8,
        color: '#38bdf8',
        dmg: this.hero.atk,
        type: 'magic-orb',
        life: 1.2
      };
      this.projectiles.push(orb);
      firedProjectiles.push(orb);
    } else if (classKey === 'archer') {
      sounds.arrowShoot();
      const dir = this.getFacingVector();
      const arr = {
        x: this.hero.x,
        y: this.hero.y - 5,
        vx: dir.x * 520,
        vy: dir.y * 520,
        radius: 4,
        color: '#fbbf24',
        dmg: this.hero.atk,
        type: 'arrow',
        life: 1.0
      };
      this.projectiles.push(arr);
      firedProjectiles.push(arr);
    }

    // Transmite ação de ataque para outros jogadores online
    this.sendNet('attack_action', {
      actionType: 'basic',
      classKey: classKey,
      x: Math.round(this.hero.x),
      y: Math.round(this.hero.y),
      facing: this.hero.facing,
      projectiles: firedProjectiles
    });
  }

  performSpecialSkill() {
    if (!this.hero || this.hero.skillCooldown > 0) return;
    const cost = this.hero.classData.mpCost;
    if (this.hero.mp < cost) {
      this.spawnFloatingText("Sem Mana!", this.hero.x, this.hero.y - 20, '#3b82f6');
      return;
    }

    this.hero.mp -= cost;
    this.hero.skillCooldown = this.hero.classData.skillCooldown;
    this.updateHUD();
    sounds.specialSkill();

    const { classKey } = this.hero.profile;
    const firedProjectiles = [];

    if (classKey === 'warrior') {
      this.screenShake = 8;
      const spinRadius = 90;
      this.spawnFloatingText("Giro Furacão!", this.hero.x, this.hero.y - 30, '#f59e0b');

      for (let a = 0; a < Math.PI * 2; a += 0.3) {
        this.particles.push({
          x: this.hero.x,
          y: this.hero.y,
          vx: Math.cos(a) * 180,
          vy: Math.sin(a) * 180,
          color: '#fef08a',
          size: 4,
          life: 0.3
        });
      }

      this.monsters.forEach(m => {
        const d = Math.hypot(m.x - this.hero.x, m.y - this.hero.y);
        if (d <= spinRadius) {
          this.hitMonster(m, this.hero.atk * 2.2);
          const pushX = (m.x - this.hero.x) / d;
          const pushY = (m.y - this.hero.y) / d;
          m.x += pushX * 40;
          m.y += pushY * 40;
        }
      });
    } else if (classKey === 'mage') {
      this.screenShake = 10;
      this.spawnFloatingText("Explosão Cósmica!", this.hero.x, this.hero.y - 30, '#c084fc');

      this.particles.push({
        x: this.hero.x,
        y: this.hero.y,
        type: 'shockwave',
        radius: 10,
        maxRadius: 130,
        color: '#a855f7',
        life: 0.4
      });

      this.monsters.forEach(m => {
        const d = Math.hypot(m.x - this.hero.x, m.y - this.hero.y);
        if (d <= 130) {
          this.hitMonster(m, this.hero.atk * 2.5);
        }
      });
    } else if (classKey === 'archer') {
      this.spawnFloatingText("Chuva de Flechas!", this.hero.x, this.hero.y - 30, '#10b981');
      const baseDir = this.getFacingVector();
      const baseAngle = Math.atan2(baseDir.y, baseDir.x);

      [-0.35, -0.18, 0, 0.18, 0.35].forEach(offset => {
        const angle = baseAngle + offset;
        const arr = {
          x: this.hero.x,
          y: this.hero.y - 5,
          vx: Math.cos(angle) * 550,
          vy: Math.sin(angle) * 550,
          radius: 4,
          color: '#34d399',
          dmg: this.hero.atk * 1.5,
          type: 'arrow',
          life: 1.1
        };
        this.projectiles.push(arr);
        firedProjectiles.push(arr);
      });
    }

    // Transmite para outros jogadores
    this.sendNet('attack_action', {
      actionType: 'special',
      classKey: classKey,
      x: Math.round(this.hero.x),
      y: Math.round(this.hero.y),
      facing: this.hero.facing,
      projectiles: firedProjectiles
    });
  }

  getFacingVector() {
    if (this.hero.facing === 'up') return { x: 0, y: -1 };
    if (this.hero.facing === 'down') return { x: 0, y: 1 };
    if (this.hero.facing === 'left') return { x: -1, y: 0 };
    return { x: 1, y: 0 };
  }

  hitMonster(m, dmg) {
    const isCrit = Math.random() < 0.25;
    const finalDmg = Math.round(isCrit ? dmg * 1.5 : dmg);
    m.hp -= finalDmg;
    m.hurtTimer = 0.2;
    sounds.enemyHit();

    const label = isCrit ? `${finalDmg} CRÍTICO!` : `${finalDmg}`;
    const color = isCrit ? '#fbbf24' : '#ffffff';
    this.spawnFloatingText(label, m.x, m.y - 25, color);

    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: m.x,
        y: m.y,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        color: '#fef08a',
        size: 3,
        life: 0.3
      });
    }

    // Notifica servidor sobre o dano no monstro
    this.sendNet('monster_damage', {
      monsterId: m.id,
      damage: finalDmg,
      isCrit: isCrit,
      killerName: this.hero.profile.name
    });
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      let hit = false;
      for (let m of this.monsters) {
        const d = Math.hypot(m.x - p.x, m.y - p.y);
        if (d < p.radius + 18) {
          this.hitMonster(m, p.dmg);
          hit = true;
          break;
        }
      }

      if (hit || p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.type === 'shockwave') {
        p.radius += (p.maxRadius - p.radius) * 8 * dt;
      } else if (!p.type) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }
  }

  updateFloatingTexts(dt) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y -= 25 * dt;
      t.life -= dt;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  spawnFloatingText(text, x, y, color = '#ffffff') {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      life: 0.8
    });
  }

  // ===================================================================
  // 9. INTERAÇÕES COM NPCS E BAÚS
  // ===================================================================
  checkInteractions() {
    this.npcs.forEach(npc => {
      const dist = Math.hypot(this.hero.x - npc.x, this.hero.y - npc.y);
      npc.isNearby = dist < 60;
    });

    this.chests.forEach(chest => {
      if (!chest.opened) {
        const dist = Math.hypot(this.hero.x - chest.x, this.hero.y - chest.y);
        if (dist < 40) {
          chest.opened = true;
          this.addGold(chest.gold);
          this.potions += chest.potion;
          document.getElementById('potion-count').innerText = this.potions;
          sounds.coinPickup();
          this.spawnFloatingText(`+${chest.potion} Poção!`, chest.x, chest.y - 30, '#10b981');

          this.sendNet('open_chest', {
            chestId: chest.id,
            playerName: this.hero.profile.name
          });
        }
      }
    });
  }

  interactNearestNPC() {
    const nearby = this.npcs.find(n => n.isNearby);
    if (!nearby) return false;

    const dialogText = nearby.dialogs[nearby.dialogIndex];
    nearby.dialogIndex = (nearby.dialogIndex + 1) % nearby.dialogs.length;

    const avatarIcon = nearby.role === 'jake' ? '🐶' : '🤖';
    this.showDialog(nearby.name, avatarIcon, dialogText);
    return true;
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
    const box = document.getElementById('dialog-box');
    box.classList.add('hidden');
    this.currentDialog = null;
  }

  showBanner(title, sub) {
    const banner = document.getElementById('banner-notice');
    document.getElementById('banner-title').innerText = title;
    document.getElementById('banner-sub').innerText = sub;
    banner.classList.remove('hidden');

    setTimeout(() => {
      banner.classList.add('hidden');
    }, 2800);
  }

  onGameOver() {
    document.getElementById('game-over-screen').classList.remove('hidden');
    sounds.playerHurt();
  }

  respawn() {
    this.hero.hp = this.hero.maxHp;
    this.hero.mp = this.hero.maxMp;
    this.hero.x = 350;
    this.hero.y = 350;
    document.getElementById('game-over-screen').classList.add('hidden');
    this.updateHUD();
    this.showBanner("DE VOLTA À LUTA!", "Pronto para recomeçar a jornada!");
  }

  // ===================================================================
  // 10. RENDERIZAÇÃO GRÁFICA DO MUNDO MULTIPLAYER
  // ===================================================================
  render() {
    this.ctx.save();

    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(sx, sy);
    }

    // 1. Fundo das Colinas Verdes
    this.renderWorldBackground();

    // Aplica Câmera
    this.ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));

    // 2. Decorações & Casa da Árvore
    this.renderDecorations();

    // 3. Baús
    this.renderChests();

    // 4. NPCs
    this.npcs.forEach(npc => PixelArtRenderer.drawNPC(this.ctx, npc, this.animTime));

    // 5. Inimigos
    this.monsters.forEach(m => PixelArtRenderer.drawMonster(this.ctx, m, this.animTime));

    // 6. OUTROS JOGADORES ONLINE MULTIPLAYER
    this.otherPlayers.forEach(p => {
      if (p.hp > 0) {
        PixelArtRenderer.drawHero(this.ctx, p.x, p.y, {
          scale: 2.8,
          facing: p.facing || 'down',
          isMoving: p.isMoving,
          animFrame: p.animFrame || 0,
          isAttacking: p.isAttacking,
          attackProgress: p.attackProgress || 0,
          profile: p.profile
        });

        this.renderPlayerOverheadUI(p);
      }
    });

    // 7. HERÓI LOCAL
    if (this.hero && this.hero.hp > 0) {
      PixelArtRenderer.drawHero(this.ctx, this.hero.x, this.hero.y, {
        scale: 2.8,
        facing: this.hero.facing,
        isMoving: this.hero.isMoving,
        animFrame: this.hero.animFrame,
        isAttacking: this.hero.isAttacking,
        attackProgress: this.hero.attackProgress,
        profile: this.hero.profile
      });

      this.renderPlayerOverheadUI(this.hero, true);
    }

    // 8. Projéteis
    this.renderProjectiles();

    // 9. Partículas
    this.renderParticles();

    // 10. Textos Flutuantes
    this.renderFloatingTexts();

    this.ctx.restore();
  }

  renderPlayerOverheadUI(p, isSelf = false) {
    const ctx = this.ctx;
    const px = Math.round(p.x);
    const py = Math.round(p.y);

    // Nome e Nível
    ctx.save();
    ctx.font = 'bold 9px Fredoka, sans-serif';
    ctx.textAlign = 'center';

    // Sombra do texto
    ctx.fillStyle = '#000000';
    ctx.fillText(`${p.profile.name} (Lv.${p.level || 1})`, px + 1, py - 43);
    ctx.fillStyle = isSelf ? '#fef08a' : '#ffffff';
    ctx.fillText(`${p.profile.name} (Lv.${p.level || 1})`, px, py - 44);

    // Mini barra de HP sobre a cabeça
    const hpW = 28;
    const hpH = 4;
    const hpRatio = Math.max(0, p.hp / (p.maxHp || 100));
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px - hpW / 2, py - 40, hpW, hpH);
    ctx.fillStyle = isSelf ? '#22c55e' : '#38bdf8';
    ctx.fillRect(px - hpW / 2 + 1, py - 39, (hpW - 2) * hpRatio, hpH - 2);

    // BALÃO DE CHAT ESTILO GIBI/DESENHO
    if (p.chatMsg) {
      ctx.font = 'bold 10px Fredoka, sans-serif';
      const textWidth = ctx.measureText(p.chatMsg).width;
      const bubbleW = Math.max(40, textWidth + 14);
      const bubbleH = 20;
      const bx = px - bubbleW / 2;
      const by = py - 68;

      // Fundo branco com borda grossa cartunizada
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, bubbleW, bubbleH, 6);
      ctx.fill();
      ctx.stroke();

      // Triângulo indicador para a cabeça do herói
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(px - 4, by + bubbleH);
      ctx.lineTo(px, by + bubbleH + 6);
      ctx.lineTo(px + 4, by + bubbleH);
      ctx.fill();

      // Texto do balão
      ctx.fillStyle = '#0f172a';
      ctx.fillText(p.chatMsg, px, by + 14);
    }

    ctx.restore();
  }

  renderWorldBackground() {
    this.ctx.fillStyle = '#79cc3b';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const camX = this.camera.x;
    const camY = this.camera.y;

    this.ctx.save();
    this.ctx.fillStyle = '#6ab82e';
    for (let c = 0; c < 8; c++) {
      const cx = (c * 350 - camX * 0.4) % (this.canvas.width + 400) - 200;
      const cy = (c * 260 - camY * 0.4) % (this.canvas.height + 300) - 150;
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, 140, 70, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  renderDecorations() {
    const ctx = this.ctx;

    // CASA DA ÁRVORE DOS HERÓIS
    const th = this.treeHouse;
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(th.x - 30, th.y + 40, 60, 120);
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(th.x, th.y + 20, 90, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(th.x - 20, th.y + 10, 60, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#eab308';
    ctx.fillRect(th.x - 25, th.y - 10, 50, 45);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(th.x - 35, th.y - 10);
    ctx.lineTo(th.x, th.y - 35);
    ctx.lineTo(th.x + 35, th.y - 10);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(th.x, th.y + 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 3;
    ctx.stroke();

    this.decorations.forEach(dec => {
      if (
        dec.x < this.camera.x - 100 || dec.x > this.camera.x + this.canvas.width + 100 ||
        dec.y < this.camera.y - 100 || dec.y > this.camera.y + this.canvas.height + 100
      ) return;

      if (dec.type === 'adventure-tree') {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(dec.x - 3, dec.y - 20, 6, 25);
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(dec.x, dec.y - 30, dec.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (dec.type === 'lollipop') {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(dec.x - 2, dec.y - 25, 4, 30);
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(dec.x, dec.y - 30, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dec.x, dec.y - 30, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (dec.type === 'candy-cane') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(dec.x - 3, dec.y - 30, 6, 35);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(dec.x - 3, dec.y - 25, 6, 6);
        ctx.fillRect(dec.x - 3, dec.y - 12, 6, 6);
      } else if (dec.type === 'icecream-mountain') {
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.moveTo(dec.x - dec.size, dec.y + 40);
        ctx.lineTo(dec.x, dec.y - dec.size);
        ctx.lineTo(dec.x + dec.size, dec.y + 40);
        ctx.fill();
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.moveTo(dec.x - 20, dec.y - dec.size + 30);
        ctx.lineTo(dec.x, dec.y - dec.size);
        ctx.lineTo(dec.x + 20, dec.y - dec.size + 30);
        ctx.fill();
      }
    });
  }

  renderChests() {
    const ctx = this.ctx;
    this.chests.forEach(chest => {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(chest.x, chest.y + 8, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (!chest.opened) {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(chest.x - 12, chest.y - 10, 24, 18);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(chest.x - 12, chest.y - 4, 24, 3);
        ctx.fillRect(chest.x - 3, chest.y - 3, 6, 6);
      } else {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(chest.x - 12, chest.y - 4, 24, 14);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(chest.x - 10, chest.y - 6, 20, 4);
      }
    });
  }

  renderProjectiles() {
    const ctx = this.ctx;
    this.projectiles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.type === 'magic-orb') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'arrow') {
        const angle = Math.atan2(p.vy, p.vx);
        ctx.rotate(angle);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(-8, -1.5, 16, 3);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(8, -4);
        ctx.lineTo(13, 0);
        ctx.lineTo(8, 4);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  renderParticles() {
    const ctx = this.ctx;
    this.particles.forEach(p => {
      if (p.type === 'shockwave') {
        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4 * p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (p.type === 'slash') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 30, -0.6, 0.6);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    });
  }

  renderFloatingTexts() {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = 'bold 13px Fredoka, sans-serif';
    ctx.textAlign = 'center';

    this.floatingTexts.forEach(t => {
      ctx.fillStyle = '#0f172a';
      ctx.fillText(t.text, t.x + 1, t.y + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    });

    ctx.restore();
  }

  // ===================================================================
  // 11. ATUALIZAÇÕES DA INTERFACE (HUD & SKILLS)
  // ===================================================================
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
  }

  updateSkillDock() {
    const data = this.hero.classData;
    document.getElementById('skill-2-name').innerText = data.skillName;
    document.getElementById('skill-2-icon').innerText = data.skillIcon;

    if (this.hero.profile.classKey === 'warrior') {
      document.getElementById('skill-1-icon').innerText = '⚔️';
      document.getElementById('skill-1-name').innerText = 'Golpe de Espada';
    } else if (this.hero.profile.classKey === 'mage') {
      document.getElementById('skill-1-icon').innerText = '🔮';
      document.getElementById('skill-1-name').innerText = 'Orbe de Mana';
    } else if (this.hero.profile.classKey === 'archer') {
      document.getElementById('skill-1-icon').innerText = '🏹';
      document.getElementById('skill-1-name').innerText = 'Disparo de Flecha';
    }
  }

  updateSkillCooldownUI() {
    const maxCD = this.hero.classData.skillCooldown;
    const currentCD = Math.max(0, this.hero.skillCooldown);
    const pct = (currentCD / maxCD) * 100;
    document.getElementById('skill-cd-overlay').style.height = `${pct}%`;
  }

  renderAvatarHUD() {
    const avatarCanvas = document.getElementById('hud-avatar-canvas');
    if (!avatarCanvas) return;
    const ctx = avatarCanvas.getContext('2d');
    ctx.clearRect(0, 0, avatarCanvas.width, avatarCanvas.height);

    PixelArtRenderer.drawHero(ctx, 20, 26, {
      scale: 1.6,
      facing: 'down',
      profile: this.hero.profile
    });
  }
}

// ===================================================================
// 12. INICIALIZAÇÃO DA INTERFACE E EVENTOS DO USUÁRIO
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

    document.getElementById('stat-hp').style.width = `${(classData.hp / 140) * 100}%`;
    document.getElementById('stat-mp').style.width = `${(classData.mp / 120) * 100}%`;
    document.getElementById('stat-atk').style.width = `${(classData.atk / 22) * 100}%`;
    document.getElementById('stat-spd').style.width = `${(classData.spd / 4.5) * 100}%`;

    PixelArtRenderer.drawHero(previewCtx, 80, 95, {
      scale: 4.8,
      facing: 'down',
      profile: heroProfile
    });
  }

  nameInput.addEventListener('input', (e) => {
    heroProfile.name = e.target.value.trim() || 'Aventureiro';
  });

  classButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      classButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      heroProfile.classKey = btn.dataset.class;
      sounds.swordSwing();
      updatePreview();
    });
  });

  outfitButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      outfitButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      heroProfile.outfitColor = btn.dataset.color;
      updatePreview();
    });
  });

  hatButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      hatButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      heroProfile.hatColor = btn.dataset.color;
      updatePreview();
    });
  });

  skinButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      skinButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      heroProfile.skinColor = btn.dataset.color;
      updatePreview();
    });
  });

  accessoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      accessoryButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      heroProfile.accessory = btn.dataset.acc;
      updatePreview();
    });
  });

  updatePreview();

  const game = new GameEngine();

  startBtn.addEventListener('click', () => {
    sounds.init();
    sounds.levelUp();

    document.getElementById('character-creation-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');

    game.start(heroProfile);
  });

  // ===================================================================
  // 13. CHAT MULTIPLAYER FORM & ATALHO [ENTER]
  // ===================================================================
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

  // CONTROLES DE TECLADO
  window.addEventListener('keydown', (e) => {
    const isChatFocused = document.activeElement === chatInput;

    // Atalho [ENTER]: alternar foco do Chat
    if (e.code === 'Enter') {
      if (game.currentDialog) {
        game.closeDialog();
        return;
      }
      if (!isChatFocused) {
        e.preventDefault();
        chatInput.focus();
        return;
      }
    }

    // Se estiver digitando no chat, não interfere com comandos do jogo
    if (isChatFocused) return;

    game.keys[e.code] = true;

    if (e.code === 'Space' && game.currentDialog) {
      game.closeDialog();
      return;
    }

    if (e.code === 'Space') {
      const interacted = game.interactNearestNPC();
      if (!interacted && !game.currentDialog) {
        game.performBasicAttack();
      }
    }

    if (e.code === 'KeyE') {
      game.performSpecialSkill();
    }

    if (e.code === 'KeyQ') {
      game.usePotion();
    }

    if (e.code === 'KeyM') {
      const active = sounds.toggle();
      document.getElementById('sound-toggle-btn').innerText = active ? '🔊' : '🔇';
    }
  });

  window.addEventListener('keyup', (e) => {
    if (document.activeElement === chatInput) return;
    game.keys[e.code] = false;
  });

  // Ataques via Clique do Mouse no Canvas
  const gameCanvas = document.getElementById('game-canvas');
  gameCanvas.addEventListener('mousedown', (e) => {
    if (document.activeElement === chatInput) {
      chatInput.blur();
    }

    if (e.button === 0) {
      if (game.currentDialog) {
        game.closeDialog();
      } else {
        game.performBasicAttack();
      }
    } else if (e.button === 2) {
      game.performSpecialSkill();
    }
  });

  gameCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

  document.getElementById('dialog-box').addEventListener('click', () => {
    game.closeDialog();
  });

  document.getElementById('sound-toggle-btn').addEventListener('click', () => {
    const active = sounds.toggle();
    document.getElementById('sound-toggle-btn').innerText = active ? '🔊' : '🔇';
  });

  document.getElementById('skill-2-slot').addEventListener('click', () => {
    game.performSpecialSkill();
  });
  document.getElementById('potion-slot').addEventListener('click', () => {
    game.usePotion();
  });

  document.getElementById('respawn-btn').addEventListener('click', () => {
    game.respawn();
  });
});
