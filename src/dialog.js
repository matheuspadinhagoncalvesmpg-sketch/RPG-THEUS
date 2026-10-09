// Falas dos personagens. Cada função recebe o jogo e devolve as linhas a mostrar.

export const NPCS = {
  oren: {
    name: 'Oren, o Andarilho',
    lines(game) {
      const s = game.save;
      if (!s.talked.oren) {
        return [
          'Ah... um Errante. Faz tempo que ninguém atravessa os Campos.',
          'Seus olhos... um da cor do ocaso, outro da aurora. Dizem que só alguém assim pode devolver o dia a Vésper.',
          'Desde que o Rei Sem Coroa roubou a Coroa da Aurora, o sol nunca terminou de se pôr.',
          'Ele espera no alto das Ruínas Suspensas. Mas o caminho até lá exige mais do que uma lâmina.',
          'Siga para o leste, pelo Bosque das Lanternas. E descanse nas fogueiras: elas guardam sua jornada. Ah, e a oeste fica a Planície do Lar: terra livre para quem quiser construir.',
        ];
      }
      const a = s.abilities;
      if (!a.dash) return ['Dizem que o vento obedece a quem chega ao santuário no fundo do Bosque.', 'Mas um cavaleiro coberto de musgo guarda a passagem.'];
      if (!a.wallJump) return ['Com o Manto do Vento, o abismo das Ruínas não é mais obstáculo.', 'Suba pelo Penhasco do Moinho e cruze a Ponte Partida.'];
      if (!a.doubleJump) return ['Ouvi ecos debaixo deste abrigo... como se o chão fosse oco.', 'Golpeie para baixo no ar, quem sabe?'];
      if (!s.bosses.king) return ['A Torre dos Ventos leva ao Trono. Que a luz te acompanhe, Errante.'];
      return ['O céu... está clareando. Você conseguiu.'];
    },
  },
  mira: {
    name: 'Mira, a Mercadora',
    shop: true,
    lines(game) {
      if (!game.save.talked.mira) return ['Hehe! Um cliente! Faz séculos.', 'Junto moedas de todo canto de Vésper, e também madeira, pedra e minério... quem constrói sempre precisa. Se tiver o bastante, tenho coisas que podem salvar sua pele.'];
      return ['Vai levar alguma coisa?'];
    },
  },
  smith: {
    name: 'Tibério, o Ferreiro',
    trade: true,
    lines(game) {
      if (!game.save.talked.smith) return [
        'Vi a fumaça da sua fogueira lá da estrada. Lugar bom pra uma forja, esse.',
        'Vou ficar por aqui. Se faltar madeira, pedra ou minério, é só falar comigo... por um punhado de moedas, claro.',
        'Ah, e fique de olho à noite. Base com fogo aceso atrai bicho.',
      ];
      return ['Precisa de material?'];
    },
  },
  eco: {
    name: 'Eco da Lanterna',
    lines(game) {
      if (game.save.abilities.spell) return ['A chama da alma queima em você agora...', 'Use-a com sabedoria. Toque rápido para lançar, segure para curar.'];
      return [
        'Shhh... as lanternas lembram de tudo.',
        'Uma chama antiga dorme aqui perto, atrás da pedra que soa oca.',
        'Nem toda parede é o que parece. Golpeie e escute.',
      ];
    },
  },
};

export const SHOP_ITEMS = [
  { id: 'mask', name: 'Fragmento de Vida', desc: '+1 coração de vida máxima.', price: 120, apply: (s) => { s.masksMax += 1; } },
  { id: 'nail', name: 'Afiar a Lâmina', desc: 'Seus golpes causam o dobro de dano.', price: 220, apply: (s) => { s.nail = 2; } },
  { id: 'mask2', name: 'Vaso Antigo', desc: '+1 coração de vida máxima.', price: 300, apply: (s) => { s.masksMax += 1; } },
];
