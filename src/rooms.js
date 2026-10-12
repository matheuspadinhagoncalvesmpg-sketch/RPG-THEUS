import { LORE_SALAS } from './memorias.js';
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
//   t  baú de tesouro (conteúdo em loot.js)

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
      b.rect(0, 0, 2, 9); // abertura oeste (linhas 9-12) para o Brejo dos Cogumelos
      b.rect(36, 12, 3, 1);
      b.set(3, 12, 'r').set(35, 12, 'w').set(40, 12, 'w').set(42, 12, 'r');
      b.set(37, 11, 'L').set(8, 12, 'L').set(9, 12, 'a');
    },
  },
  {
    id: 'campos_inicio', name: 'Colina do Despertar', area: 'campos',
    x: 0, y: 18, w: 36, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 36, 3);
      b.rect(0, 0, 3, 8).rect(3, 0, 2, 4);
      b.rect(11, 12, 7, 1).rect(13, 11, 3, 1);
      b.plat(20, 9, 4).set(22, 8, '$');
      b.plat(25, 7, 4).plat(30, 5, 4).plat(25, 3, 4).plat(30, 1, 4); // subida para as Colinas Altas
      b.rect(30, 12, 3, 1);
      b.set(4, 12, 'L').set(7, 12, 'L').set(9, 12, 'S').set(26, 12, 'c');
      b.set(28, 12, 'w').set(34, 12, 'r');
    },
  },
  {
    id: 'campos_abrigo', name: 'Abrigo dos Andarilhos', area: 'campos',
    x: 36, y: 18, w: 40, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 40, 3);
      b.rect(22, 13, 3, 3, 'X');
      b.set(4, 12, 'N').set(9, 12, 'B').set(15, 12, 'N');
      b.plat(28, 9, 5).set(30, 8, '$');
      b.set(33, 12, 'h').set(37, 12, 'c').set(19, 12, 'w').set(11, 12, 'v');
    },
    npcs: ['oren', 'mira'],
    cape: 'vermelha',
  },
  {
    id: 'campos_moinho', name: 'Penhasco do Moinho', area: 'campos',
    x: 76, y: 8, w: 28, h: 26, sky: true,
    build: (b) => {
      b.rect(0, 23, 28, 3);
      b.rect(26, 0, 2, 3).rect(26, 7, 2, 11).rect(0, 0, 2, 10); // abertura leste (linhas 3-6) para o Dossel
      b.rect(24, 7, 4, 1).plat(20, 8, 3);
      b.rect(2, 0, 10, 1).rect(16, 0, 10, 1);
      b.plat(4, 20, 4).plat(9, 17, 4).plat(15, 14, 4).plat(9, 11, 4);
      b.plat(15, 8, 4).plat(9, 5, 4).plat(13, 2, 3);
      b.set(6, 22, '$').set(20, 22, 'c').set(20, 12, 'f').set(14, 1, 't');
      b.set(10, 22, 'r').set(24, 22, 'w');
    },
  },

  // ───────────── BOSQUE DAS LANTERNAS ─────────────
  {
    id: 'bosque_entrada', name: 'Orla das Lanternas', area: 'bosque',
    x: 104, y: 18, w: 40, h: 16,
    build: (b) => {
      b.rect(0, 0, 40, 2).rect(30, 0, 4, 2, '.');
      b.rect(0, 0, 2, 8).rect(38, 0, 2, 8);
      b.plat(30, 3, 3).plat(31, 1, 3); // subida para o Dossel das Lanternas
      b.rect(0, 13, 40, 3);
      b.rect(12, 13, 3, 1, '^');
      b.rect(16, 13, 3, 2, 'X').plat(17, 15, 2).set(16, 15, '.'); // buraco secreto para a Gruta Sob as Raízes
      b;
      b.rect(20, 11, 4, 2);
      b.plat(27, 8, 4).plat(32, 5, 4);
      b.set(34, 4, 'M').set(35, 4, 'a');
      b.set(21, 10, 'p').set(8, 12, 'c').set(30, 12, 'c').set(17, 6, 'f');
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
      b.set(7, 12, 'N').set(4, 12, 'B').set(2, 12, 'v');
      b.set(18, 8, 'f').set(14, 24, 'h').set(26, 24, 'p');
    },
    npcs: ['eco'],
    ability: 'spell',
    cape: 'verde',
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
      b.set(24, 12, 'K').set(4, 12, 'L');
    },
    boss: 'moss',
  },
  {
    id: 'santuario_vento', name: 'Santuário do Vento', area: 'bosque',
    x: 206, y: 30, w: 22, h: 16, zone: [10, 3, 11, 10],
    build: (b) => {
      b.rect(0, 0, 22, 2);
      b.rect(0, 2, 1, 7);
      b.rect(21, 0, 1, 9); // abertura leste (linhas 9-12) para o Mirante dos Ventos
      b.rect(0, 13, 22, 3).rect(4, 13, 3, 3, 'X').plat(5, 15, 2); // buraco secreto para a Cisterna do Bosque
      b.rect(7, 11, 3, 2); // altar vazio: o Manto do Vento agora vem do Cavaleiro de Musgo
      b.set(15, 12, 'B').set(18, 12, 'L').set(13, 12, 'v');
    },
    cape: 'roxa',
  },

  // ───────────── RUÍNAS SUSPENSAS ─────────────
  {
    id: 'ruinas_abismo', name: 'Ponte Partida', area: 'ruinas',
    x: 82, y: -8, w: 46, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 14, 18, 2);
      b.rect(6, 14, 4, 2, '.');
      b.rect(18, 15, 6, 1, '^');
      b.rect(24, 14, 22, 2).rect(40, 14, 3, 2, '.').plat(41, 15, 2); // passagem para o Dossel das Lanternas
      b.rect(0, 0, 2, 14);
      b.rect(44, 0, 2, 11);
      b.rect(30, 12, 2, 2);
      b.plat(34, 9, 5);
      b.plat(30, 7, 4).plat(35, 5, 4).plat(30, 3, 4).plat(35, 1, 4); // subida para o Aqueduto Alto
      b.set(3, 13, '$').set(28, 8, 'f').set(39, 13, 'g');
      b.set(26, 13, 'r').set(44, 13, 'o');
      b.set(4, 13, 'L').set(12, 13, 'L').set(28, 13, 'L').set(44, 13, 'L');
    },
  },
  {
    id: 'ruinas_torre', name: 'Torre dos Ventos', area: 'ruinas',
    x: 128, y: -40, w: 18, h: 48,
    build: (b) => {
      b.rect(0, 0, 18, 1);
      b.plat(6, 0, 4);
      b.rect(0, 0, 2, 43).rect(16, 0, 2, 43);
      b.rect(0, 19, 2, 4, '.'); // passagem oeste para o Aqueduto Alto
      b.rect(0, 46, 18, 2).rect(12, 46, 3, 2, '.').plat(13, 47, 2); // passagem para o Dossel das Lanternas
      // degraus de 4 blocos: cabem no pulo duplo com folga
      for (let i = 0; i < 11; i++) b.plat(i % 2 ? 10 : 2, 43 - i * 4, 6);
      b.set(9, 29, 'f').set(8, 13, 'f');
    },
  },
  {
    id: 'ruinas_galeria', name: 'Galeria dos Escaladores', area: 'ruinas',
    x: 146, y: -6, w: 30, h: 14,
    build: (b) => {
      b.rect(0, 0, 30, 2);
      b.rect(0, 2, 1, 7);
      b.rect(29, 0, 1, 8); // abertura leste (linhas 8-11) para o Arsenal
      b.rect(29, 12, 1, 2);
      b.rect(0, 12, 30, 2);
      b.rect(24, 10, 3, 2).set(25, 9, 'A');
      b.plat(12, 8, 4).set(13, 7, '$');
      b.set(5, 11, 'B').set(10, 11, 'L').set(17, 11, 'g').set(21, 11, 'o').set(7, 11, 'v');
    },
    ability: 'wallJump',
    cape: 'laranja',
  },
  {
    id: 'ruinas_pico', name: 'Pico das Nuvens', area: 'ruinas',
    x: 120, y: -56, w: 34, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 14, 34, 2);
      b.rect(14, 14, 4, 2, '.');
      b.rect(0, 0, 2, 10); // abertura oeste (linhas 10-13) para o Salão de Rúben
      b.plat(4, 11, 4).plat(8, 8, 3).set(9, 7, 'M');
      b.rect(22, 13, 4, 1, '^');
      b.set(20, 8, 'f').set(28, 6, 'f').set(29, 13, 'g').set(32, 13, 'o');
      b.set(3, 13, 'L').set(5, 13, 'v').set(7, 13, 'B').set(10, 7, 'a');
    },
    cape: 'preta',
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
      b.set(26, 15, 'K').set(8, 15, 'V');
    },
    boss: 'king', preBoss: 'sob_eliar',
  },

  // ───────────── CAVERNAS DE CRISTAL ─────────────
  {
    id: 'cristal_poco', name: 'Poço Ecoante', area: 'cristal',
    x: 50, y: 34, w: 20, h: 26,
    build: (b) => {
      b.rect(0, 0, 20, 1);
      b.rect(8, 0, 3, 1, '.');
      b.rect(0, 0, 2, 26);
      b.rect(0, 21, 2, 3, '.'); // passagem para o Veio de Cristal
      b.rect(18, 0, 2, 20);
      b.rect(0, 24, 20, 2);
      b.plat(4, 21, 4).plat(10, 18, 4).plat(4, 15, 4);
      b.plat(10, 12, 4).plat(4, 9, 4).plat(9, 6, 4).plat(8, 3, 3);
      b.set(6, 23, 'B').set(8, 23, 'v').set(13, 23, 'c').set(14, 10, 'f').set(15, 23, 'k');
    },
    cape: 'rosa',
  },
  {
    id: 'cristal_galeria', name: 'Galeria Cintilante', area: 'cristal',
    x: 70, y: 48, w: 40, h: 16,
    build: (b) => {
      b.rect(0, 0, 40, 2).rect(36, 0, 3, 2, '.');
      b.rect(0, 2, 1, 4).rect(39, 2, 1, 4);
      b.rect(0, 10, 40, 6);
      b.rect(14, 10, 6, 2, '.');
      b.rect(14, 12, 6, 1, '^');
      b.plat(26, 6, 4).plat(32, 8, 4).plat(36, 6, 3).plat(32, 4, 4).plat(35, 3, 3).plat(36, 1, 3); // subida para a Gruta Sob as Raízes
      b.rect(21, 11, 3, 5, '.').rect(21, 10, 3, 1, 'X'); // túnel secreto sob a tampa quebrável
      b.plat(21, 15, 2).plat(22, 13, 2).plat(21, 11, 2);
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
      b.plat(19, 5, 3).set(20, 4, 'M').set(21, 4, 'a');
      b.set(6, 9, 'L').set(9, 9, 'L').set(12, 9, 'k').set(21, 9, 'k');
    },
    ability: 'doubleJump',
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
      b.rect(0, 18, 2, 4, '~'); // passagem oeste para a Nascente
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
      b.rect(8, 16, 3, 2, '~'); // passagem para a Gruta das Marés
      b.rect(33, 2, 6, 3, '.').rect(34, 5, 5, 1).set(39, 4, '.'); // bolsão de ar
      b.set(36, 4, 'B');
      b.set(6, 6, 'q').set(16, 10, 'q').set(29, 9, 'q').set(36, 6, 'q');
      b.set(14, 15, 'k').set(30, 15, 'o').set(5, 15, 'a');
    },
    charm: 'vento_longo',
  },
  {
    id: 'jardins_templo', name: 'Templo da Maré', area: 'jardins',
    x: 180, y: 70, w: 34, h: 18,
    build: (b) => {
      b.rect(0, 0, 34, 2).rect(33, 0, 1, 8).rect(33, 12, 1, 6).rect(0, 15, 34, 3);
      b.rect(32, 8, 1, 4, 'D'); // portão leste: abre depois que a Rainha cai
      b.rect(0, 2, 1, 4).rect(0, 12, 1, 3);
      b.rect(1, 6, 1, 6, 'D');
      b.rect(1, 13, 32, 2, '~');
      b.rect(28, 12, 5, 3);
      b.plat(6, 9, 4).plat(20, 9, 4);
      b.set(22, 14, 'K').set(28, 11, 'v');
    },
    boss: 'tide',
    cape: 'bege',
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
      b.set(2, 6, 'C').set(24, 14, 'T').set(4, 6, 'a').set(19, 14, 'L');
    },
    charm: 'lamina_rapida',
    challenge: { seconds: 18, reward: 120 },
  },

  // ───────────── CÂMARAS OPCIONAIS COM MINI-CHEFES ─────────────
  {
    id: 'bosque_gruta', name: 'Gruta Sob as Raízes', area: 'bosque',
    x: 104, y: 34, w: 40, h: 14,
    build: (b) => {
      b.rect(0, 0, 40, 1).rect(16, 0, 3, 1, '.');
      b.rect(0, 1, 1, 5).rect(39, 1, 1, 10);
      b.rect(0, 11, 40, 3).rect(2, 11, 3, 3, '.').plat(3, 13, 2); // passagem para a Galeria Cintilante
      b.plat(9, 9, 4).plat(14, 7, 4).plat(9, 5, 4).plat(14, 3, 4).plat(16, 1, 3);
      b.set(34, 10, 'B').set(22, 10, 'c').set(27, 10, 'c').set(30, 10, 'h').set(5, 10, 'k').set(36, 10, 'k').set(24, 10, 't');
    },
  },
  {
    id: 'bosque_covil', name: 'Covil do Besouro-Rei', area: 'bosque',
    x: 72, y: 34, w: 32, h: 14,
    build: (b) => {
      b.rect(0, 0, 32, 2).rect(0, 2, 1, 9).rect(31, 2, 1, 4);
      b.rect(0, 11, 32, 3);
      b.rect(30, 6, 1, 5, 'D');
      b.plat(6, 7, 4).plat(20, 7, 4);
      b.set(6, 10, 'K');
    },
    boss: 'mini_besouro', bossSide: 'right',
  },
  {
    id: 'cristal_veio', name: 'Veio de Cristal', area: 'cristal', npcs: ['brum'],
    x: 18, y: 44, w: 32, h: 16,
    build: (b) => {
      b.rect(0, 0, 32, 2).rect(0, 2, 1, 9).rect(31, 2, 1, 9);
      b.rect(0, 14, 32, 2).rect(20, 14, 3, 2, '.').plat(21, 15, 2); // buraco para o Veio Fundo
      b.plat(5, 10, 4).plat(11, 8, 4).plat(17, 10, 4);
      b.rect(12, 13, 3, 1, '^');
      b.set(26, 13, 'B').set(8, 13, 'c').set(25, 13, 'h').set(4, 13, 'k').set(29, 13, 't').set(19, 9, 'f').set(13, 7, 'o');
    },
  },
  {
    id: 'cristal_geodo', name: 'Geodo do Golem', area: 'cristal',
    x: -14, y: 44, w: 32, h: 16,
    build: (b) => {
      b.rect(0, 0, 32, 2).rect(0, 2, 1, 12).rect(31, 2, 1, 9);
      b.rect(0, 14, 32, 2);
      b.rect(30, 11, 1, 3, 'D');
      b.plat(6, 10, 4).plat(20, 10, 4);
      b.set(6, 13, 'K');
    },
    boss: 'mini_golem', bossSide: 'right',
  },
  {
    id: 'mirante_ventos', name: 'Mirante dos Ventos', area: 'bosque',
    x: 228, y: 30, w: 36, h: 16,
    build: (b) => {
      b.rect(0, 0, 36, 2).rect(4, 0, 3, 2, '.').rect(0, 2, 1, 7).rect(35, 2, 1, 7);
      b.plat(2, 11, 3).plat(5, 9, 3).plat(2, 7, 3).plat(5, 5, 3).plat(2, 3, 3).plat(4, 1, 3); // subida para o Cume dos Ventos
      b.rect(0, 13, 36, 3).rect(3, 13, 3, 3, '.').plat(4, 15, 2); // passagem para a Cisterna do Bosque
      b.rect(20, 13, 3, 3, '.').plat(21, 15, 2); // passagem para o Lago das Lanternas
      b.rect(10, 13, 6, 3, '.').rect(10, 15, 6, 1).rect(10, 14, 6, 1, '^');
      b.plat(19, 9, 4).plat(25, 6, 3);
      b.set(31, 12, 'B').set(25, 12, 'c').set(14, 5, 'f').set(26, 5, 'f').set(7, 12, 'k').set(27, 5, 't');
    },
  },
  {
    id: 'ninho_vespa', name: 'Ninho da Vespa Rainha', area: 'bosque',
    x: 264, y: 30, w: 32, h: 16,
    build: (b) => {
      b.rect(0, 0, 32, 2).rect(0, 2, 1, 7).rect(31, 0, 1, 16);
      b.rect(0, 13, 32, 3);
      b.rect(1, 9, 1, 4, 'D');
      b.plat(8, 9, 4).plat(20, 9, 4);
      b.set(24, 12, 'K');
    },
    boss: 'mini_vespa',
  },
  {
    id: 'jardins_gruta', name: 'Gruta das Marés', area: 'jardins',
    x: 140, y: 90, w: 40, h: 16,
    build: (b) => {
      b.rect(0, 0, 40, 2).rect(8, 0, 3, 2, '~');
      b.rect(0, 2, 1, 14).rect(39, 2, 1, 6).rect(39, 11, 1, 5);
      b.rect(0, 14, 40, 2);
      b.rect(26, 11, 13, 3);
      b.rect(1, 2, 25, 12, '~');
      b.rect(8, 0, 3, 2, '~');
      b.set(33, 10, 'B').set(8, 8, 'q').set(16, 10, 'q').set(21, 6, 'q').set(24, 13, 'o').set(36, 10, 't');
    },
  },
  {
    id: 'jardins_covil', name: 'Covil da Lampreia', area: 'jardins',
    x: 180, y: 90, w: 32, h: 16,
    build: (b) => {
      b.rect(0, 0, 32, 2).rect(0, 2, 1, 6).rect(0, 11, 6, 3).rect(31, 0, 1, 16);
      b.rect(0, 14, 32, 2);
      b.rect(1, 8, 1, 3, 'D');
      b.rect(6, 2, 25, 12, '~');
      b.set(22, 12, 'K');
    },
    boss: 'mini_lampreia',
  },

  // ───────────── EXPANSÃO: BREJO, COLINAS, CISTERNAS, ARSENAL E NASCENTE ─────────────
  {
    id: 'campos_brejo', name: 'Brejo dos Cogumelos', area: 'campos',
    x: -84, y: 18, w: 40, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 40, 3).rect(0, 0, 2, 9).rect(38, 0, 2, 9);
      b.rect(12, 13, 3, 1, '^');
      b.rect(24, 13, 3, 3, 'X').plat(25, 15, 2); // buraco secreto para a Cripta Rasa
      b.plat(6, 11, 4).plat(30, 11, 4);
      b.set(4, 12, 't').set(8, 12, 'h').set(18, 12, 'h').set(22, 12, 'p').set(30, 12, 'c');
      b.set(32, 10, '$').set(10, 12, 'w').set(36, 12, 'r');
    },
  },
  {
    id: 'campos_cripta', name: 'Cripta Rasa', area: 'campos',
    x: -84, y: 34, w: 40, h: 16,
    build: (b) => {
      b.rect(0, 0, 40, 2).rect(24, 0, 3, 2, '.');
      b.rect(0, 2, 1, 10).rect(39, 2, 1, 10);
      b.rect(0, 12, 40, 4);
      b.plat(28, 10, 4).plat(22, 8, 4).plat(27, 6, 4).plat(21, 4, 4).plat(23, 3, 3).plat(24, 1, 3); // degraus de até 2 blocos
      b.set(35, 11, 't').set(12, 11, 'c').set(18, 11, 'c').set(31, 11, 'g').set(3, 11, 'k').set(38, 11, 'o');
    },
  },
  {
    id: 'campos_alto', name: 'Colinas Altas', area: 'campos',
    x: 0, y: 2, w: 40, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 40, 3).rect(27, 13, 7, 3, '.').plat(28, 15, 3);
      b.rect(0, 0, 2, 13).rect(38, 0, 2, 13);
      b.plat(5, 10, 4).plat(10, 7, 4).plat(18, 9, 5);
      b.set(11, 6, 'M').set(8, 12, 'B').set(14, 4, 'f').set(23, 6, 'f').set(4, 12, 'w').set(36, 12, 'w').set(13, 12, 'r').set(22, 12, 'r').set(19, 8, '$');
    },
  },
  {
    id: 'bosque_cisterna', name: 'Cisterna do Bosque', area: 'bosque',
    x: 200, y: 46, w: 36, h: 16,
    build: (b) => {
      b.rect(0, 0, 36, 2).rect(10, 0, 3, 2, '.').rect(31, 0, 3, 2, '.');
      b.rect(0, 2, 1, 10).rect(35, 2, 1, 7).rect(35, 12, 1, 0);
      b.rect(0, 12, 36, 4);
      b.rect(22, 9, 14, 3, '~'); // água até a borda leste
      b.plat(14, 10, 4).plat(8, 8, 4).plat(14, 6, 4).plat(8, 4, 4).plat(10, 3, 3).plat(10, 1, 3);
      b.plat(28, 7, 3).plat(31, 5, 3).plat(28, 3, 3).plat(31, 1, 3); // subida para o Mirante dos Ventos
      b.set(18, 11, 't').set(4, 11, 'k').set(20, 11, 'k').set(27, 10, 'q').set(31, 10, 'q').set(6, 11, 'c');
    },
  },
  {
    id: 'ruinas_arsenal', name: 'Arsenal Esquecido', area: 'ruinas',
    x: 176, y: -6, w: 34, h: 14,
    build: (b) => {
      b.rect(0, 0, 34, 1).rect(14, 0, 3, 1, '.');
      b.rect(0, 1, 1, 7).rect(33, 1, 1, 7); // abertura leste (linhas 8-11) para a Ponte do Vento
      b.rect(33, 12, 1, 2);
      b.rect(0, 12, 34, 2);
      b.plat(18, 10, 4).plat(12, 8, 4).plat(18, 6, 4).plat(12, 4, 4).plat(14, 3, 3).plat(14, 1, 3);
      b.set(10, 11, 'g').set(26, 11, 'g').set(30, 11, 't').set(22, 11, 'o').set(5, 11, 'o');
    },
  },
  {
    id: 'ruinas_observatorio', name: 'Observatório Quebrado', area: 'ruinas',
    x: 176, y: -30, w: 34, h: 24,
    build: (b) => {
      b.rect(0, 0, 34, 1).rect(14, 0, 3, 1, '.');
      b.rect(0, 1, 1, 20).rect(33, 1, 1, 16); // abertura leste (linhas 17-20) para o Salão de Sibila
      b.plat(14, 3, 3).plat(14, 1, 3); // subida para o Telhado
      b.rect(0, 21, 34, 3).rect(14, 21, 3, 3, '.').plat(14, 23, 3);
      // degraus de 2 blocos, em zigue-zague, até o topo
      b.plat(4, 19, 4).plat(10, 17, 4).plat(16, 15, 4).plat(22, 13, 4).plat(28, 11, 4);
      b.plat(24, 9, 4).plat(18, 7, 4).plat(12, 5, 4);
      b.set(20, 20, 'L').set(6, 20, 'B').set(29, 10, 'M').set(13, 4, 't').set(10, 12, 'f').set(26, 5, 'f');
    },
  },
  {
    id: 'cristal_abismo', name: 'Abismo de Cristal', area: 'cristal',
    x: 60, y: 64, w: 36, h: 16,
    build: (b) => {
      b.rect(0, 0, 36, 2).rect(31, 0, 3, 2, '.');
      b.rect(0, 2, 1, 11).rect(35, 2, 1, 7).rect(35, 13, 1, 3);
      b.rect(0, 13, 36, 3).rect(8, 13, 3, 3, 'X').plat(9, 15, 2); // buraco secreto para a Catacumba
      b.plat(26, 11, 4).plat(30, 9, 4).plat(25, 7, 4).plat(30, 5, 4).plat(26, 3, 4).plat(31, 1, 3);
      b.set(6, 12, 't').set(10, 12, 'g').set(14, 12, 'h').set(4, 12, 'k').set(16, 12, 'k').set(33, 12, 'k').set(12, 6, 'f');
    },
  },
  {
    id: 'jardins_nascente', name: 'Nascente Escondida', area: 'jardins',
    x: 96, y: 70, w: 24, h: 18,
    build: (b) => {
      b.rect(0, 0, 24, 2).rect(0, 2, 1, 1).rect(0, 7, 1, 6).rect(0, 16, 1, 2).rect(23, 2, 1, 10);
      b.rect(0, 16, 24, 2).rect(0, 7, 5, 1);
      b.rect(1, 8, 22, 8, '~').rect(23, 12, 1, 4, '~').rect(0, 13, 1, 3, '~'); // água também na passagem oeste
      b.plat(8, 8, 3).plat(16, 6, 6);
      b.set(9, 7, 't').set(12, 12, 'q').set(18, 11, 'q').set(6, 15, 'k').set(14, 15, 'k');
    },
  },

  // ───────────── EXPANSÃO 2: ERMO, MARCO, CUME, PONTE DO VENTO, SALÃO E CORAL ─────────────
  {
    id: 'campos_ermo', name: 'Ermo das Cinzas', area: 'campos',
    x: -124, y: 18, w: 40, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 40, 3).rect(0, 0, 2, 9).rect(38, 0, 2, 9);
      b.rect(16, 13, 3, 2, '.').rect(16, 14, 3, 1, '^');
      b.rect(27, 13, 3, 1, '^');
      b.plat(8, 11, 4).plat(32, 10, 4);
      b.set(21, 12, 'B').set(36, 12, 't').set(6, 12, 'c').set(12, 12, 'h').set(24, 12, 'c').set(33, 9, 'f').set(3, 12, 'w').set(10, 12, 'r').set(34, 12, 'k');
    },
  },
  {
    id: 'campos_marco', name: 'Marco dos Errantes', area: 'campos',
    x: -164, y: 18, w: 40, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 40, 3).rect(0, 0, 2, 13).rect(38, 0, 2, 9);
      b.rect(22, 13, 3, 1, '^');
      b.plat(8, 11, 4).plat(12, 9, 4).plat(16, 7, 4).plat(10, 5, 3);
      b.set(11, 4, 'M').set(18, 6, 't').set(5, 12, 'L').set(28, 12, 'g').set(15, 12, 'c').set(35, 12, 'o');
    },
  },
  {
    id: 'bosque_cume', name: 'Cume dos Ventos', area: 'bosque',
    x: 228, y: 14, w: 36, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 36, 3).rect(4, 13, 3, 3, '.').plat(4, 15, 3);
      b.rect(0, 0, 1, 13).rect(35, 0, 1, 9); // abertura leste (linhas 9-12)
      b.plat(12, 9, 5).plat(20, 6, 5);
      b.set(30, 12, 't').set(10, 12, 'L').set(14, 5, 'f').set(26, 4, 'f').set(24, 12, 'c');
    },
  },
  {
    id: 'ruinas_ponte_vento', name: 'Ponte do Vento', area: 'ruinas',
    x: 210, y: -6, w: 40, h: 14, sky: true,
    build: (b) => {
      b.rect(0, 12, 40, 2).rect(0, 0, 1, 8).rect(39, 0, 1, 8);
      b.rect(12, 12, 4, 1, '.').rect(12, 13, 4, 1, '^');
      b.rect(24, 12, 5, 1, '.').rect(24, 13, 5, 1, '^');
      b.plat(18, 8, 4);
      b.set(7, 11, 'g').set(20, 7, 'f').set(33, 11, 'g').set(3, 11, 'o').set(36, 11, 'k');
    },
  },
  {
    id: 'ruinas_mirante_leste', name: 'Mirante Esquecido', area: 'ruinas',
    x: 250, y: -6, w: 34, h: 14, sky: true,
    build: (b) => {
      b.rect(0, 12, 34, 2).rect(0, 0, 1, 8).rect(33, 0, 1, 12);
      b.plat(8, 10, 4).plat(14, 8, 4).plat(20, 6, 4).plat(26, 4, 4);
      b.set(27, 3, 't').set(5, 11, 'B').set(12, 11, 'L').set(22, 11, 'g').set(30, 11, 'k');
    },
  },
  {
    id: 'jardins_salao', name: 'Salão Submerso', area: 'jardins',
    x: 214, y: 70, w: 40, h: 18,
    build: (b) => {
      b.rect(0, 0, 40, 2).rect(0, 2, 1, 6).rect(0, 12, 6, 4).rect(39, 2, 1, 6).rect(39, 12, 1, 4);
      b.rect(0, 16, 40, 2);
      b.rect(6, 6, 33, 10, '~').rect(39, 8, 1, 4, '~');
      b.plat(12, 8, 4).plat(22, 6, 4).plat(30, 9, 4);
      b.set(24, 5, 't').set(16, 12, 'q').set(26, 11, 'q').set(33, 8, 'q').set(10, 15, 'k').set(20, 15, 'o').set(34, 15, 'k');
    },
  },
  {
    id: 'jardins_coral', name: 'Recife Profundo', area: 'jardins',
    x: 254, y: 70, w: 34, h: 18,
    build: (b) => {
      b.rect(0, 0, 34, 2).rect(0, 2, 1, 6).rect(0, 12, 1, 4).rect(33, 2, 1, 6).rect(33, 12, 1, 4);
      b.rect(0, 16, 34, 2);
      b.rect(1, 2, 32, 14, '~').rect(0, 8, 1, 4, '~').rect(33, 8, 1, 4, '~').rect(10, 16, 3, 2, '~');
      b.rect(20, 2, 8, 3, '.').rect(21, 5, 7, 1).set(20, 4, '~');
      b.rect(8, 11, 3, 5).rect(14, 8, 3, 8).rect(24, 12, 3, 4);
      b.set(15, 7, 't').set(5, 15, 'k').set(12, 15, 'o').set(19, 10, 'q').set(29, 9, 'q').set(30, 15, 'k');
    },
  },

  // ───────────── EXPANSÃO 3: RUÍNAS E BOSQUE ─────────────
  {
    id: 'ruinas_aqueduto', name: 'Aqueduto Alto', area: 'ruinas',
    x: 82, y: -24, w: 46, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 46, 3).rect(30, 13, 6, 3, '.').plat(31, 15, 4);
      b.rect(0, 0, 1, 9).rect(45, 0, 1, 3).rect(45, 7, 1, 6);
      b.plat(36, 11, 4).plat(38, 9, 3);
      b.plat(6, 11, 4).plat(11, 9, 4).plat(6, 7, 4).plat(11, 5, 4).plat(6, 3, 4).plat(8, 1, 4); // subida para o Salão de Marta
      b.rect(40, 7, 6, 1); // borda alinhada com a passagem da Torre dos Ventos
      b.set(14, 12, 'g').set(24, 12, 'g').set(20, 6, 'f').set(9, 12, 't').set(40, 6, 'o');
    },
  },
  {
    id: 'ruinas_jardim', name: 'Jardim Suspenso', area: 'ruinas',
    x: 36, y: -24, w: 46, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 46, 3).rect(0, 0, 1, 9).rect(45, 0, 1, 9);
      b.rect(26, 13, 3, 1, '^');
      b.plat(8, 10, 4).plat(14, 8, 4).plat(20, 10, 4).plat(34, 10, 4);
      b.set(16, 7, 'M').set(6, 12, 'B').set(12, 12, 'p').set(22, 12, 'p').set(32, 12, 'p').set(38, 12, 't').set(18, 12, 'h').set(42, 12, 'k');
    },
  },
  {
    id: 'ruinas_biblioteca', name: 'Biblioteca Soterrada', area: 'ruinas', npcs: ['selene'],
    x: -10, y: -24, w: 46, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 46, 3).rect(0, 0, 1, 9).rect(45, 0, 1, 9); // abertura oeste (linhas 9-12) para o Salão de Dalva
      b.plat(6, 10, 5).plat(14, 8, 5).plat(24, 10, 5).plat(32, 8, 5);
      b.set(10, 12, 'L').set(19, 12, 'L').set(40, 12, 'L').set(28, 12, 'B').set(16, 7, 'f').set(34, 7, 'f').set(4, 12, 'c').set(37, 12, 'c');
    },
  },
  {
    id: 'ruinas_telhado', name: 'Telhado das Ruínas', area: 'ruinas',
    x: 188, y: -46, w: 34, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 34, 3).rect(2, 13, 3, 3, '.').plat(2, 15, 3);
      b.rect(0, 0, 1, 13).rect(33, 0, 1, 9);
      b.plat(6, 9, 5).plat(24, 9, 5);
      b.set(28, 12, 't').set(20, 12, 'L').set(10, 6, 'f').set(26, 6, 'f').set(30, 12, 'g').set(8, 8, 'k');
    },
  },
  {
    id: 'ruinas_torreao', name: 'Torreão do Vigia', area: 'ruinas',
    x: 222, y: -46, w: 34, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 34, 3).rect(0, 0, 1, 9).rect(33, 0, 1, 9); // abertura leste (linhas 9-12) para o Salão de Lídia
      b.rect(14, 13, 4, 1, '^');
      b.plat(6, 10, 4).plat(20, 10, 4).plat(26, 7, 4);
      b.set(27, 6, 't').set(4, 12, 'B').set(10, 12, 'g').set(22, 12, 'g').set(30, 12, 'o');
    },
  },
  {
    id: 'bosque_dossel', name: 'Dossel das Lanternas', area: 'bosque',
    x: 104, y: 8, w: 40, h: 10,
    build: (b) => {
      b.rect(0, 0, 40, 2).rect(18, 0, 3, 2, '.').rect(36, 0, 3, 2, '.').rect(0, 0, 1, 3).rect(0, 7, 1, 3).rect(39, 0, 1, 10);
      b.rect(0, 7, 40, 3).rect(30, 7, 4, 3, '.').plat(30, 9, 4);
      b.plat(8, 4, 4).plat(24, 4, 4);
      b.plat(14, 5, 4).plat(19, 3, 3).plat(18, 1, 3); // subida para a Ponte Partida
      b.plat(31, 5, 4).plat(35, 3, 3).plat(36, 1, 3); // subida para a Torre dos Ventos
      b.set(4, 6, 't').set(12, 6, 'f').set(22, 6, 'p').set(28, 3, 'f').set(36, 6, 'h');
    },
  },
  {
    id: 'bosque_copas', name: 'Ponte das Copas', area: 'bosque',
    x: 264, y: 14, w: 36, h: 16,
    build: (b) => {
      b.rect(0, 0, 36, 2).rect(0, 2, 1, 7).rect(35, 2, 1, 7);
      b.rect(0, 13, 36, 3);
      b.rect(10, 13, 4, 1, '.').rect(10, 14, 4, 1, '^').rect(22, 13, 4, 1, '.').rect(22, 14, 4, 1, '^');
      b.plat(16, 9, 5);
      b.set(18, 8, 'M').set(6, 12, 'c').set(18, 12, 'h').set(28, 12, 'p').set(18, 4, 'f');
    },
  },
  {
    id: 'bosque_ninho_alto', name: 'Ninho Alto', area: 'bosque', npcs: ['tome'],
    x: 300, y: 14, w: 36, h: 16,
    build: (b) => {
      b.rect(0, 0, 36, 2).rect(16, 0, 4, 2, '.').rect(0, 2, 1, 7).rect(35, 0, 1, 9); // aberturas: teto (Mariposa) e leste (Vendaval)
      b.rect(0, 13, 36, 3);
      b.plat(8, 10, 4).plat(14, 8, 4).plat(20, 6, 4).plat(26, 8, 4);
      b.plat(22, 4, 4).plat(17, 3, 4).plat(16, 1, 4); // subida para o Covil da Mariposa
      b.set(27, 7, 't').set(6, 12, 'B').set(12, 12, 'f').set(22, 12, 'g').set(31, 12, 'c').set(4, 12, 'L');
    },
  },
  {
    id: 'bosque_lago', name: 'Lago das Lanternas', area: 'bosque',
    x: 236, y: 46, w: 40, h: 16,
    build: (b) => {
      b.rect(0, 0, 40, 2).rect(12, 0, 3, 2, '.').rect(0, 2, 1, 7).rect(0, 12, 1, 4).rect(39, 2, 1, 14);
      b.rect(0, 14, 40, 2);
      b.rect(1, 8, 38, 6, '~').rect(0, 9, 1, 3, '~');
      b.plat(8, 6, 4).plat(26, 6, 5);
      b.plat(12, 4, 3).plat(11, 2, 3).plat(12, 1, 3); // subida para o Mirante dos Ventos
      b.set(28, 5, 't').set(10, 11, 'q').set(20, 10, 'q').set(30, 12, 'q').set(6, 13, 'k').set(24, 13, 'k').set(34, 13, 'o');
    },
  },

  // ───────────── EXPANSÃO 4: CRISTAL E JARDINS ─────────────
  {
    id: 'cristal_catacumba', name: 'Catacumba dos Buscadores', area: 'cristal',
    x: 60, y: 80, w: 36, h: 16,
    build: (b) => {
      b.rect(0, 0, 36, 2).rect(8, 0, 3, 2, '.');
      b.rect(0, 2, 1, 10).rect(35, 2, 1, 1).rect(35, 6, 1, 2); // aberturas leste: linhas 3-5 (Nascente) e 8-11 (Ossário)
      b.rect(0, 12, 36, 4);
      b.plat(31, 10, 3).plat(33, 8, 2).plat(32, 6, 3); // subida até a abertura da Nascente
      b.plat(13, 10, 4).plat(8, 8, 4).plat(13, 6, 4).plat(8, 4, 4).plat(9, 3, 3).plat(8, 1, 3);
      b.set(3, 11, 't').set(22, 11, 'g').set(18, 11, 'c').set(26, 11, 'c').set(20, 11, 'L').set(33, 11, 'k').set(30, 11, 'B');
    },
  },
  {
    id: 'cristal_ossario', name: 'Ossário de Cristal', area: 'cristal',
    x: 96, y: 88, w: 24, h: 16,
    build: (b) => {
      b.rect(0, 0, 24, 1).rect(0, 4, 8, 12).rect(8, 12, 16, 4).rect(23, 1, 1, 11);
      b.plat(9, 10, 3).plat(12, 8, 3).plat(9, 6, 3);
      b.set(18, 11, 't').set(20, 11, 'g').set(11, 11, 'o').set(16, 11, 'k');
    },
  },
  {
    id: 'cristal_veio_fundo', name: 'Veio Fundo', area: 'cristal',
    x: 18, y: 60, w: 32, h: 16,
    build: (b) => {
      b.rect(0, 0, 32, 2).rect(20, 0, 3, 2, '.');
      b.rect(0, 2, 1, 10).rect(31, 2, 1, 10);
      b.rect(0, 12, 32, 4);
      b.plat(15, 10, 4).plat(21, 8, 4).plat(15, 6, 4).plat(21, 4, 4).plat(20, 3, 3).plat(20, 1, 3);
      b.set(3, 11, 'M').set(28, 11, 't').set(10, 11, 'g').set(25, 11, 'c').set(6, 11, 'k').set(13, 11, 'k');
    },
  },
  {
    id: 'jardins_costa', name: 'Costa Rasa', area: 'jardins', npcs: ['nami'],
    x: 288, y: 70, w: 36, h: 18,
    build: (b) => {
      b.rect(0, 0, 36, 2).rect(35, 0, 1, 18).rect(0, 2, 1, 6).rect(0, 12, 1, 4);
      b.rect(0, 16, 36, 2);
      b.rect(1, 8, 34, 8, '~').rect(0, 8, 1, 4, '~').rect(20, 16, 3, 2, '~');
      b.plat(6, 6, 5).plat(20, 5, 6).plat(28, 6, 4);
      b.set(22, 4, 'B').set(30, 5, 't').set(10, 12, 'q').set(26, 11, 'q').set(5, 15, 'k').set(14, 15, 'o').set(32, 15, 'k');
    },
  },
  {
    id: 'jardins_trincheira', name: 'Trincheira Azul', area: 'jardins',
    x: 254, y: 88, w: 34, h: 16,
    build: (b) => {
      b.rect(0, 0, 34, 2).rect(10, 0, 3, 2, '~');
      b.rect(0, 0, 1, 16).rect(33, 2, 1, 6).rect(33, 12, 1, 4);
      b.rect(0, 14, 34, 2);
      b.rect(1, 2, 32, 12, '~').rect(33, 8, 1, 4, '~').rect(10, 0, 3, 2, '~');
      b.set(7, 13, 't').set(14, 9, 'q').set(24, 6, 'q').set(28, 12, 'q').set(18, 13, 'k').set(30, 13, 'o');
    },
  },
  {
    id: 'jardins_abissal', name: 'Fundo Abissal', area: 'jardins',
    x: 288, y: 88, w: 36, h: 16,
    build: (b) => {
      b.rect(0, 0, 36, 2).rect(20, 0, 3, 2, '~');
      b.rect(0, 0, 1, 8).rect(0, 12, 1, 4).rect(35, 0, 1, 16);
      b.rect(0, 14, 36, 2);
      b.rect(1, 2, 34, 12, '~').rect(0, 8, 1, 4, '~').rect(20, 0, 3, 2, '~');
      b.rect(2, 2, 6, 3, '.').rect(3, 5, 5, 1);
      b.rect(28, 10, 6, 4);
      b.set(30, 9, 'M').set(10, 13, 't').set(16, 8, 'q').set(24, 11, 'q').set(14, 13, 'k');
    },
  },

  // ───────────── ASAS DE SEDA: MARIPOSA, VENDAVAL E OLHO DA TEMPESTADE ─────────────
  {
    id: 'bosque_mariposal', name: 'Covil da Mariposa Rainha', area: 'bosque',
    x: 300, y: -2, w: 36, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 0, 36, 2).rect(0, 2, 1, 14).rect(35, 2, 1, 14);
      b.rect(0, 13, 36, 3).rect(16, 13, 4, 3, '.').rect(16, 13, 4, 1, 'D').plat(16, 15, 4);
      b.plat(6, 9, 5).plat(25, 9, 5);
      b.set(27, 12, 'K');
    },
    boss: 'mini_mariposa',
  },
  {
    id: 'bosque_vendaval', name: 'Vendaval', area: 'bosque',
    x: 336, y: 14, w: 40, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 13, 40, 3).rect(0, 0, 1, 9).rect(39, 0, 1, 5).rect(39, 9, 1, 7);
      b.plat(2, 11, 3).plat(5, 9, 3).plat(2, 7, 3);
      b.rect(8, 5, 6, 1);
      b.rect(14, 13, 18, 2, '.').rect(14, 14, 18, 1, '^');
      b.rect(32, 9, 8, 7);
      b.set(5, 12, 'B').set(10, 4, 'L').set(36, 8, 'o');
    },
  },
  {
    id: 'bosque_olho', name: 'Olho da Tempestade', area: 'bosque',
    x: 376, y: 14, w: 36, h: 16, sky: true,
    build: (b) => {
      b.rect(0, 9, 36, 7).rect(0, 0, 1, 5).rect(35, 0, 1, 9);
      b.plat(10, 6, 5).plat(20, 4, 5);
      b.set(24, 3, 't').set(12, 5, 'M').set(30, 8, 'k').set(28, 8, 'k');
    },
  },

  // ───────────── OS SALÕES DOS SOBERANOS ─────────────
  {
    id: 'ruinas_salao_dalva', name: 'Salão da Aurora Cantada', area: 'ruinas',
    x: -56, y: -24, w: 46, h: 16,
    build: (b) => {
      b.rect(0, 0, 46, 2).rect(0, 2, 1, 14).rect(45, 2, 1, 7);
      b.rect(0, 13, 46, 3);
      b.rect(44, 9, 1, 4, 'D');
      b.plat(8, 9, 5).plat(30, 9, 5);
      b.set(10, 12, 'K');
    },
    boss: 'sob_dalva', bossSide: 'right',
  },
  {
    id: 'ruinas_salao_ruben', name: 'Salão dos Livros-Caixa', area: 'ruinas',
    x: 86, y: -56, w: 34, h: 16,
    build: (b) => {
      b.rect(0, 0, 34, 2).rect(0, 2, 1, 12).rect(33, 2, 1, 8);
      b.rect(0, 14, 34, 2);
      b.rect(32, 10, 1, 4, 'D');
      b.plat(6, 10, 5).plat(20, 10, 5);
      b.set(8, 13, 'K');
    },
    boss: 'sob_ruben', bossSide: 'right',
  },
  {
    id: 'ruinas_salao_sibila', name: 'Salão do Último Olhar', area: 'ruinas',
    x: 210, y: -30, w: 34, h: 24,
    build: (b) => {
      b.rect(0, 0, 34, 2).rect(0, 2, 1, 15).rect(33, 2, 1, 19);
      b.rect(0, 21, 34, 3);
      b.rect(1, 17, 1, 4, 'D');
      b.plat(6, 16, 5).plat(23, 16, 5).plat(14, 11, 6).plat(5, 7, 5);
      b.set(24, 20, 'K');
    },
    boss: 'sob_sibila',
  },
  {
    id: 'ruinas_salao_lidia', name: 'Salão dos Estandartes', area: 'ruinas',
    x: 256, y: -46, w: 34, h: 16,
    build: (b) => {
      b.rect(0, 0, 34, 2).rect(0, 2, 1, 7).rect(33, 2, 1, 14);
      b.rect(0, 13, 34, 3);
      b.rect(1, 9, 1, 4, 'D');
      b.plat(8, 9, 4).plat(22, 9, 4);
      b.set(24, 12, 'K');
    },
    boss: 'sob_lidia',
  },
  {
    id: 'ruinas_salao_marta', name: 'Salão dos Espelhos', area: 'ruinas',
    x: 82, y: -40, w: 46, h: 16,
    build: (b) => {
      b.rect(0, 0, 46, 2).rect(0, 2, 1, 14).rect(45, 2, 1, 14);
      b.rect(0, 13, 46, 3).rect(8, 13, 4, 3, '.').rect(8, 13, 4, 1, 'D').plat(8, 15, 4);
      b.plat(20, 9, 5).plat(34, 9, 5);
      b.set(30, 12, 'K');
    },
    boss: 'sob_marta',
  },
];

// Inimigos regionais (src/enemies2.js) espalhados pelas salas: [x, y, letra].
const EXTRA = {"bosque_olho":[[14,3,"m"],[26,6,"m"]],"campos_brejo":[[15,12,"s"],[27,12,"s"],[31,10,"M"],[20,12,"L"]],"campos_ermo":[[15,12,"s"],[31,12,"s"],[9,10,"M"],[19,12,"L"]],"campos_marco":[[13,8,"s"]],"campos_abrigo":[[27,12,"s"]],"campos_moinho":[[15,7,"s"]],"campos_alto":[[18,12,"s"]],"campos_cripta":[[25,7,"s"],[21,3,"L"]],"bosque_entrada":[[7,4,"m"],[26,4,"m"]],"bosque_raizes":[[11,7,"m"],[24,5,"m"],[13,15,"M"]],"bosque_dossel":[[16,5,"m"],[32,6,"m"],[19,6,"L"]],"bosque_cume":[[4,9,"m"],[9,6,"m"]],"bosque_copas":[[9,5,"m"],[26,6,"m"],[15,12,"L"]],"bosque_ninho_alto":[[11,6,"m"],[10,12,"N"]],"bosque_gruta":[[22,5,"m"]],"mirante_ventos":[[15,10,"m"]],"ruinas_abismo":[[17,10,"n"]],"ruinas_galeria":[[8,5,"n"]],"ruinas_aqueduto":[[11,5,"n"],[32,8,"n"]],"ruinas_jardim":[[27,8,"n"]],"ruinas_biblioteca":[[8,6,"n"],[28,6,"n"],[24,12,"N"]],"ruinas_telhado":[[16,6,"n"]],"ruinas_torreao":[[14,6,"n"],[18,12,"L"]],"ruinas_arsenal":[[16,10,"n"]],"ruinas_observatorio":[[17,10,"n"]],"ruinas_pico":[[14,12,"n"]],"cristal_galeria":[[26,5,"x"],[28,5,"x"]],"cristal_poco":[[9,5,"x"],[12,5,"M"]],"cristal_veio":[[15,13,"x"],[18,13,"L"],[24,13,"N"]],"cristal_veio_fundo":[[17,9,"x"],[23,3,"x"],[16,5,"L"]],"cristal_catacumba":[[9,7,"x"],[13,9,"x"]],"cristal_ossario":[[9,5,"x"],[8,11,"L"]],"cristal_abismo":[[26,10,"x"],[31,4,"x"]],"cristal_coracao":[[18,9,"x"]],"jardins_poco":[[5,17,"j"],[11,20,"j"]],"jardins_recife":[[11,9,"j"],[21,5,"j"]],"jardins_gruta":[[10,4,"j"]],"jardins_nascente":[[5,9,"j"]],"jardins_salao":[[9,8,"j"],[20,11,"j"],[5,11,"L"]],"jardins_coral":[[5,10,"j"],[15,3,"j"]],"jardins_costa":[[19,11,"j"],[25,4,"L"],[24,4,"N"]],"jardins_trincheira":[[7,4,"j"],[20,4,"j"]],"jardins_abissal":[[10,3,"j"],[24,4,"j"]]};

export const ROOM_DEFS = DEFS.map((d) => {
  const b = new RoomBuilder(d.w, d.h);
  d.build(b);
  for (const [x, y, c] of EXTRA[d.id] || []) b.set(x, y, c);
  return { ...d, rows: b.rows(), lore: LORE_SALAS[d.id] || [] };
});
