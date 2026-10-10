// Mundo de Vésper: cada sala ocupa um retângulo numa grade global de blocos.
// Salas vizinhas se conectam automaticamente pelas aberturas nas bordas.
//
// Legenda dos blocos:
//   #  sólido          ^  espinhos        =  plataforma vazada
//   X  parede/chão quebrável               D  portão de chefe
// Entidades (o bloco fica vazio):
//   S  início   B  banco   N  personagem   L  placa de história
//   A  habilidade   M  vaso de vida   $  rocha de geo   K  chefe
//   c  gosma   h  cogumelo   f  morcego   p  flor carnívora   g  golem   q  peixe-lanterna
//   ~  água    C  amuleto    T/E  início/fim do desafio cronometrado
//   w r o k  árvore, rocha, minério e cristal (recursos)

class RoomBuilder {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.g = Array.from({ length: h }, () => Array(w).fill('.'));
  }
  rect(x, y, w, h, c = '#') {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++)
        if (i >= 0 && j >= 0 && i < this.w && j < this.h) this.g[j][i] = c;
    return this;
  }
  set(x, y, c) { return this.rect(x, y, 1, 1, c); }
  plat(x, y, w) { return this.rect(x, y, w, 1, '='); }
  rows() { return this.g.map((r) => r.join('')); }
}

const DEFS = [
  // ───────────── CAMPOS DO CREPÚSCULO ─────────────
  {
    id: 'planicie_lar', name: 'Planície do Lar', area: 'campos',
    x: -44, y: 18, w: 44, h: 16, sky: true, zone: [4, 2, 30, 11],
    build: (b) => {
      b.rect(0, 13, 44, 3);
      b.rect(0, 0, 2, 13);
      b.rect(36, 12, 3, 1);
      b.set(3, 12, 'r').set(35, 12, 'w').set(40, 12, 'w').set(42, 12, 'r');
      b.set(37, 11, 'L');
    },
    lore: [
      'Uma placa de madeira cravada no chão:\n"Terras livres. Corte árvores, quebre pedras e construa aqui o seu lar."\n(Aperte B ou o botão de martelo para construir.)',
    ],
  },
  {
    id: 'campos_inicio', name: 'Colina do Despertar', area: 'campos',
    x: 0, y: 18, w: 36, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 36, 3);
      b.rect(0, 0, 3, 8).rect(3, 0, 2, 4);
      b.rect(11, 12, 7, 1).rect(13, 11, 3, 1);
      b.plat(20, 9, 4).set(22, 8, '$');
      b.rect(30, 12, 3, 1);
      b.set(7, 12, 'L').set(9, 12, 'S').set(26, 12, 'c');
      b.set(28, 12, 'w').set(34, 12, 'r');
    },
    lore: [
      'Uma pedra antiga, gasta pelo vento:\n"VÉSPER — Quando a Coroa da Aurora voltar ao trono, o dia retornará."',
    ],
  },
  {
    id: 'campos_abrigo', name: 'Abrigo dos Andarilhos', area: 'campos',
    x: 36, y: 18, w: 40, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 40, 3);
      b.rect(22, 13, 3, 3, 'X');
      b.set(4, 12, 'N').set(9, 12, 'B').set(15, 12, 'N');
      b.plat(28, 9, 5).set(30, 8, '$');
      b.set(33, 12, 'h').set(37, 12, 'c').set(19, 12, 'w');
    },
    npcs: ['oren', 'mira'],
  },
  {
    id: 'campos_moinho', name: 'Penhasco do Moinho', area: 'campos',
    x: 76, y: 8, w: 28, h: 26, sky: true,
    build: (b) => {
      b.rect(0, 23, 28, 3);
      b.rect(26, 0, 2, 18).rect(0, 0, 2, 10);
      b.rect(2, 0, 10, 1).rect(16, 0, 10, 1);
      b.plat(4, 20, 4).plat(9, 17, 4).plat(15, 14, 4).plat(9, 11, 4);
      b.plat(15, 8, 4).plat(9, 5, 4).plat(13, 2, 3);
      b.set(6, 22, '$').set(20, 22, 'c').set(20, 12, 'f');
      b.set(10, 22, 'r').set(24, 22, 'w');
    },
  },

  // ───────────── BOSQUE DAS LANTERNAS ─────────────
  {
    id: 'bosque_entrada', name: 'Orla das Lanternas', area: 'bosque',
    x: 104, y: 18, w: 40, h: 16,
    build: (b) => {
      b.rect(0, 0, 40, 2);
      b.rect(0, 0, 2, 8).rect(38, 0, 2, 8);
      b.rect(0, 13, 40, 3);
      b.rect(12, 13, 4, 1, '^');
      b.rect(20, 10, 4, 3);
      b.plat(27, 8, 4).plat(32, 5, 4);
      b.set(34, 4, 'M');
      b.set(21, 9, 'p').set(8, 12, 'c').set(30, 12, 'c').set(17, 6, 'f');
      b.set(5, 12, 'w').set(25, 12, 'w');
    },
  },
  {
    id: 'bosque_raizes', name: 'Raízes Profundas', area: 'bosque',
    x: 144, y: 18, w: 30, h: 28,
    build: (b) => {
      b.rect(0, 0, 30, 2);
      b.rect(0, 2, 1, 6);
      b.rect(29, 0, 1, 21);
      b.rect(0, 25, 30, 3);
      b.rect(0, 13, 11, 7);
      b.rect(0, 20, 6, 5);
      b.rect(1, 21, 3, 4, '.');
      b.rect(4, 21, 2, 4, 'X');
      b.set(2, 24, 'A');
      b.plat(13, 16, 4).plat(20, 19, 4).plat(16, 22, 4);
      b.set(7, 12, 'N');
      b.set(18, 8, 'f').set(14, 24, 'h').set(26, 24, 'p');
    },
    npcs: ['eco'],
    ability: 'spell',
  },
  {
    id: 'bosque_arena', name: 'Clareira do Cavaleiro', area: 'bosque',
    x: 174, y: 30, w: 32, h: 16,
    build: (b) => {
      b.rect(0, 0, 32, 2);
      b.rect(0, 2, 1, 7).rect(31, 2, 1, 7);
      b.rect(0, 13, 32, 3);
      b.rect(1, 9, 1, 4, 'D').rect(30, 9, 1, 4, 'D');
      b.plat(6, 9, 4).plat(22, 9, 4);
      b.set(24, 12, 'K');
    },
    boss: 'moss',
  },
  {
    id: 'santuario_vento', name: 'Santuário do Vento', area: 'bosque',
    x: 206, y: 30, w: 22, h: 16, zone: [10, 3, 11, 10],
    build: (b) => {
      b.rect(0, 0, 22, 2);
      b.rect(0, 2, 1, 7);
      b.rect(21, 0, 1, 16);
      b.rect(0, 13, 22, 3);
      b.rect(7, 11, 3, 2).set(8, 10, 'A');
      b.set(15, 12, 'B').set(18, 12, 'L');
    },
    ability: 'dash',
    lore: ['Gravado no altar:\n"Quem corre com o vento jamais cai no abismo. Siga para o alto, além do moinho."'],
  },

  // ───────────── RUÍNAS SUSPENSAS ─────────────
  {
    id: 'ruinas_abismo', name: 'Ponte Partida', area: 'ruinas',
    x: 82, y: -8, w: 46, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 14, 18, 2);
      b.rect(6, 14, 4, 2, '.');
      b.rect(18, 15, 6, 1, '^');
      b.rect(24, 14, 22, 2);
      b.rect(0, 0, 2, 14);
      b.rect(44, 0, 2, 11);
      b.rect(30, 12, 2, 2);
      b.plat(34, 9, 5);
      b.set(3, 13, '$').set(28, 8, 'f').set(39, 13, 'g');
      b.set(26, 13, 'r').set(42, 13, 'o');
    },
  },
  {
    id: 'ruinas_torre', name: 'Torre dos Ventos', area: 'ruinas',
    x: 128, y: -40, w: 18, h: 48,
    build: (b) => {
      b.rect(0, 0, 18, 1);
      b.rect(6, 0, 4, 1, '.');
      b.rect(0, 0, 2, 43).rect(16, 0, 2, 43);
      b.rect(0, 46, 18, 2);
      for (let i = 0; i < 8; i++) b.plat(i % 2 ? 10 : 2, 41 - i * 5, 6);
      b.plat(6, 3, 5);
      b.set(9, 30, 'f').set(8, 15, 'f');
    },
  },
  {
    id: 'ruinas_galeria', name: 'Galeria dos Escaladores', area: 'ruinas',
    x: 146, y: -6, w: 30, h: 14,
    build: (b) => {
      b.rect(0, 0, 30, 2);
      b.rect(0, 2, 1, 7);
      b.rect(29, 0, 1, 14);
      b.rect(0, 12, 30, 2);
      b.rect(24, 10, 3, 2).set(25, 9, 'A');
      b.plat(12, 8, 4).set(13, 7, '$');
      b.set(5, 11, 'B').set(10, 11, 'L').set(17, 11, 'g').set(21, 11, 'o');
    },
    ability: 'wallJump',
    lore: ['Arranhões profundos na pedra:\n"Os antigos escaladores subiam a Torre sem degraus. As paredes eram seu caminho."'],
  },
  {
    id: 'ruinas_pico', name: 'Pico das Nuvens', area: 'ruinas',
    x: 120, y: -56, w: 34, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 14, 34, 2);
      b.rect(14, 14, 4, 2, '.');
      b.rect(0, 0, 2, 14);
      b.plat(4, 11, 4).plat(8, 8, 3).set(9, 7, 'M');
      b.rect(22, 13, 4, 1, '^');
      b.set(20, 8, 'f').set(28, 6, 'f').set(29, 13, 'g').set(32, 13, 'o');
    },
  },
  {
    id: 'trono', name: 'Trono do Crepúsculo', area: 'ruinas',
    x: 154, y: -58, w: 34, h: 18,
    build: (b) => {
      b.rect(0, 0, 34, 2);
      b.rect(0, 2, 1, 9);
      b.rect(33, 0, 1, 18);
      b.rect(0, 16, 34, 2);
      b.rect(1, 11, 1, 5, 'D');
      b.plat(6, 12, 5).plat(23, 12, 5);
      b.set(26, 15, 'K');
    },
    boss: 'king',
  },

  // ───────────── CAVERNAS DE CRISTAL ─────────────
  {
    id: 'cristal_poco', name: 'Poço Ecoante', area: 'cristal',
    x: 50, y: 34, w: 20, h: 26,
    build: (b) => {
      b.rect(0, 0, 20, 1);
      b.rect(8, 0, 3, 1, '.');
      b.rect(0, 0, 2, 26);
      b.rect(18, 0, 2, 20);
      b.rect(0, 24, 20, 2);
      b.plat(4, 21, 4).plat(10, 18, 4).plat(4, 15, 4);
      b.plat(10, 12, 4).plat(4, 9, 4).plat(9, 6, 4).plat(8, 3, 3);
      b.set(6, 23, 'B').set(13, 23, 'c').set(14, 10, 'f').set(15, 23, 'k');
    },
  },
  {
    id: 'cristal_galeria', name: 'Galeria Cintilante', area: 'cristal',
    x: 70, y: 48, w: 40, h: 16,
    build: (b) => {
      b.rect(0, 0, 40, 2);
      b.rect(0, 2, 1, 4).rect(39, 2, 1, 4);
      b.rect(0, 10, 40, 6);
      b.rect(14, 10, 6, 2, '.');
      b.rect(14, 12, 6, 1, '^');
      b.plat(26, 6, 4);
      b.set(6, 9, 'c').set(10, 9, '$').set(24, 9, 'h').set(31, 9, 'p').set(35, 9, 'c');
      b.set(3, 9, 'k').set(28, 9, 'k').set(37, 9, 'o');
    },
  },
  {
    id: 'cristal_coracao', name: 'Coração de Cristal', area: 'cristal',
    x: 110, y: 48, w: 24, h: 16, zone: [2, 2, 11, 8],
    build: (b) => {
      b.rect(0, 0, 24, 2);
      b.rect(0, 2, 1, 4);
      b.rect(23, 0, 1, 16);
      b.rect(0, 10, 24, 6);
      b.rect(19, 10, 2, 6, '.'); // poço para os Jardins Submersos
      b.rect(14, 8, 4, 2).set(15, 7, 'A');
      b.plat(19, 5, 3).set(20, 4, 'M');
      b.set(6, 9, 'L').set(12, 9, 'k').set(21, 9, 'k');
    },
    ability: 'doubleJump',
    lore: ['Uma inscrição brilha no cristal:\n"Das cinzas do último pôr do sol nasceram asas. Quem as veste toca o céu duas vezes."'],
  },

  // ───────────── JARDINS SUBMERSOS ─────────────
  {
    id: 'jardins_poco', name: 'Poço das Marés', area: 'jardins',
    x: 120, y: 64, w: 20, h: 26,
    build: (b) => {
      b.rect(0, 0, 20, 1).rect(9, 0, 2, 1, '.');
      b.rect(0, 0, 2, 26).rect(18, 0, 2, 17).rect(18, 22, 2, 4);
      b.rect(0, 24, 20, 2);
      b.rect(2, 10, 16, 14, '~').rect(18, 17, 2, 5, '~');
      b.rect(6, 19, 3, 5);
      b.plat(3, 9, 4).plat(8, 7, 3).plat(12, 5, 3).plat(9, 3, 3);
      b.set(13, 15, 'q').set(4, 13, 'q').set(15, 23, 'o');
    },
  },
  {
    id: 'jardins_recife', name: 'Recife das Lanternas', area: 'jardins',
    x: 140, y: 72, w: 40, h: 18,
    build: (b) => {
      b.rect(0, 0, 40, 2).rect(30, 0, 3, 2, 'X');
      b.rect(0, 16, 40, 2);
      b.rect(0, 2, 1, 7).rect(0, 14, 1, 2);
      b.rect(39, 2, 1, 2).rect(39, 10, 1, 6);
      b.rect(1, 2, 38, 14, '~');
      b.rect(0, 9, 1, 5, '~').rect(39, 4, 1, 6, '~');
      b.rect(10, 11, 2, 5).rect(22, 8, 2, 8).rect(33, 12, 3, 4);
      b.rect(25, 5, 4, 1).set(27, 4, 'C');
      b.set(6, 6, 'q').set(16, 10, 'q').set(29, 9, 'q').set(36, 6, 'q');
      b.set(14, 15, 'k').set(30, 15, 'o');
    },
    charm: 'vento_longo',
  },
  {
    id: 'jardins_templo', name: 'Templo da Maré', area: 'jardins',
    x: 180, y: 70, w: 34, h: 18,
    build: (b) => {
      b.rect(0, 0, 34, 2).rect(33, 0, 1, 18).rect(0, 15, 34, 3);
      b.rect(0, 2, 1, 4).rect(0, 12, 1, 3);
      b.rect(1, 6, 1, 6, 'D');
      b.rect(1, 13, 32, 2, '~');
      b.rect(28, 12, 5, 3);
      b.plat(6, 9, 4).plat(20, 9, 4);
      b.set(22, 14, 'K').set(30, 11, 'B');
    },
    boss: 'tide',
  },
  {
    id: 'desafio_espinhos', name: 'Prova das Lâminas', area: 'jardins',
    x: 150, y: 56, w: 26, h: 16,
    build: (b) => {
      b.rect(0, 0, 26, 1).rect(0, 0, 1, 16).rect(25, 0, 1, 16);
      b.rect(0, 15, 26, 1).rect(20, 15, 3, 1, '.');
      b.rect(1, 14, 18, 1, '^');
      b.plat(17, 13, 2).plat(12, 11, 2).plat(7, 9, 2);
      b.rect(1, 7, 4, 1);
      b.set(2, 6, 'C').set(24, 14, 'T');
    },
    charm: 'lamina_rapida',
    challenge: { seconds: 18, reward: 120 },
  },
];

export const ROOM_DEFS = DEFS.map((d) => {
  const b = new RoomBuilder(d.w, d.h);
  d.build(b);
  return { ...d, rows: b.rows() };
});
