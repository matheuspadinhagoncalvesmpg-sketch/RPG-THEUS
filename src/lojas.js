// Lojas dos NPCs. Tudo se paga em moedas ou em materiais, mas cada NPC só aceita o que precisa:
// `aceita` diz quais materiais e quanto vale cada unidade (o mineiro tem pedra de sobra, quer cristal).
// Os itens que o jogador acha pelo mapa também são vendidos aqui, para quem perdeu algo ou quer repor.
// tipo: arma | armadura | amuleto | lanterna | melhoria | mapa | pista

export const LOJAS = {
  mira: {
    titulo: 'Tenda da Mira',
    aceita: { wood: 3, stone: 4, ore: 8, crystal: 14 }, // a Coletora junta de tudo, mas paga pouco
    sub: 'A Coletora arrependida junta o que o mundo perdeu e vende o que pode salvar sua pele.',
    itens: [
      { tipo: 'melhoria', id: 'nail', nome: 'Afiar a Lâmina', desc: 'Seus golpes causam o dobro de dano.', preco: 220, aplicar: (s) => { s.nail = 2; } },
      { tipo: 'amuleto', id: 'alma_faminta', preco: 150 },
      { tipo: 'amuleto', id: 'pele_pedra', preco: 200 },
      { tipo: 'amuleto', id: 'mare_viva', preco: 240 },
      { tipo: 'melhoria', id: 'mask', nome: 'Fragmento de Vida', desc: '+1 coração de vida máxima.', preco: 500, aplicar: (s) => { s.masksMax += 1; } },
      { tipo: 'melhoria', id: 'mask2', nome: 'Vaso Antigo', desc: '+1 coração de vida máxima.', preco: 900, aplicar: (s) => { s.masksMax += 1; } },
    ],
  },
  oren: {
    titulo: 'Mapas do Oren',
    aceita: { wood: 7, stone: 6 }, // lenha para a fogueira e pedra para firmar o papel
    sub: 'Cada mapa revela o desenho das salas da região. Falta preencher o resto andando por lá.',
    itens: [
      { tipo: 'mapa', id: 'campos', preco: 40 },
      { tipo: 'mapa', id: 'bosque', preco: 90 },
      { tipo: 'mapa', id: 'ruinas', preco: 140 },
      { tipo: 'mapa', id: 'cristal', preco: 110 },
      { tipo: 'mapa', id: 'jardins', preco: 130 },
    ],
  },
  tome: {
    titulo: 'Lanternas do Tomé',
    aceita: { wood: 6, crystal: 22 }, // hastes de madeira e cristal para a luz
    sub: 'O Guarda-de-Trilha Sem Sombra vende o que sobrou da trilha.',
    itens: [
      { tipo: 'lanterna', preco: 90 },
      { tipo: 'amuleto', id: 'ima_moedas', preco: 140 },
      { tipo: 'amuleto', id: 'vento_longo', preco: 260 },
      { tipo: 'amuleto', id: 'lamina_rapida', preco: 300 },
      { tipo: 'pista', reino: 'bosque', preco: 60 },
    ],
  },
  selene: {
    titulo: 'Biblioteca da Selene',
    aceita: { stone: 8, ore: 14 }, // lajes para gravar e minério para as correntes dos livros
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
    aceita: { crystal: 24, wood: 7 }, // pedra e minério ele tem de sobra; quer cristal e escoras
    sub: 'O mineiro que ouviu a terra vende armaduras e lâminas de minério e cristal.',
    itens: [
      { tipo: 'armadura', id: 'madeira', preco: 90 },
      { tipo: 'armadura', id: 'pedra', preco: 220 },
      { tipo: 'armadura', id: 'cristal', preco: 520 },
      { tipo: 'arma', id: 'minerio', preco: 280 },
      { tipo: 'arma', id: 'cristal', preco: 480 },
      { tipo: 'pista', reino: 'cristal', preco: 70 },
    ],
  },
  nami: {
    titulo: 'Rede da Nami',
    aceita: { wood: 8, ore: 13 }, // madeira para os barcos e minério para os anzóis
    sub: 'A pescadora vende o que o mar devolve.',
    itens: [
      { tipo: 'arma', id: 'arco', preco: 240 },
      { tipo: 'arma', id: 'cajado', preco: 420 },
      { tipo: 'arma', id: 'adaga', preco: 150 },
      { tipo: 'arma', id: 'tridente', preco: 520 },
      { tipo: 'pista', reino: 'jardins', preco: 70 },
    ],
  },
};
