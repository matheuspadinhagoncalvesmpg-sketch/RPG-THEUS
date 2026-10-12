// Lojas dos NPCs da história. Os itens que o jogador acha pelo mapa também são vendidos aqui
// (por um preço alto), para quem perdeu algo ou quer repor.
// tipo: arma | armadura | amuleto | recurso | pista

export const LOJAS = {
  tome: {
    titulo: 'Lanternas do Tomé',
    sub: 'O Guarda-de-Trilha Sem Sombra vende o que sobrou da trilha.',
    itens: [
      { tipo: 'amuleto', id: 'ima_moedas', preco: 140 },
      { tipo: 'amuleto', id: 'vento_longo', preco: 260 },
      { tipo: 'amuleto', id: 'lamina_rapida', preco: 300 },
      { tipo: 'recurso', id: 'wood', n: 10, preco: 30 },
      { tipo: 'pista', reino: 'bosque', preco: 60 },
    ],
  },
  selene: {
    titulo: 'Biblioteca da Selene',
    sub: 'A última escriba vende as armas que a Guarda deixou e pistas do que ainda não foi lido.',
    itens: [
      { tipo: 'arma', id: 'lanca', preco: 260 },
      { tipo: 'arma', id: 'foice', preco: 420 },
      { tipo: 'arma', id: 'machado', preco: 380 },
      { tipo: 'pista', reino: 'ruinas', preco: 80 },
      { tipo: 'pista', reino: 'campos', preco: 60 },
    ],
  },
  brum: {
    titulo: 'Oficina do Brum',
    sub: 'O mineiro que ouviu a terra vende armaduras e cristais.',
    itens: [
      { tipo: 'armadura', id: 'madeira', preco: 90 },
      { tipo: 'armadura', id: 'pedra', preco: 220 },
      { tipo: 'armadura', id: 'cristal', preco: 520 },
      { tipo: 'recurso', id: 'crystal', n: 5, preco: 120 },
      { tipo: 'recurso', id: 'ore', n: 6, preco: 100 },
      { tipo: 'pista', reino: 'cristal', preco: 70 },
    ],
  },
  nami: {
    titulo: 'Rede da Nami',
    sub: 'A pescadora vende o que o mar devolve.',
    itens: [
      { tipo: 'arma', id: 'arco', preco: 240 },
      { tipo: 'arma', id: 'cajado', preco: 420 },
      { tipo: 'arma', id: 'adaga', preco: 150 },
      { tipo: 'arma', id: 'minerio', preco: 280 },
      { tipo: 'pista', reino: 'jardins', preco: 70 },
    ],
  },
};
