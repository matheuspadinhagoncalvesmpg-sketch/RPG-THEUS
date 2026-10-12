// Falas dos personagens, por estágio do progresso (ver docs/historia/08-roteiro-de-revelacoes.md).
// Cada função recebe o jogo e devolve as linhas a mostrar. A primeira condição verdadeira vence.

const ORIGEM = [
  'Ah... um Errante. Faz tempo que ninguém atravessa os Campos.',
  '...Perdão. Já vi esses olhos. Mas não nesse rosto.',
  'Seus olhos... um da cor do ocaso, outro da aurora. Dizem que só alguém assim pode devolver o dia a Vésper.',
  'Desde que o Rei Sem Coroa roubou a Coroa da Aurora, o sol nunca terminou de se pôr.',
  'Ele espera no alto das Ruínas Suspensas. Mas o caminho até lá exige mais do que uma lâmina.',
  'Siga para o leste, pelo Bosque das Lanternas. E descanse nas fogueiras: elas guardam sua jornada. Eu desenho mapas das regiões, se quiser comprar. Ah, e a oeste fica a Planície do Lar: terra livre para quem quiser construir.',
];

// Dica prática do próximo passo (o que o jogador ainda não fez).
function dica(s) {
  const a = s.abilities, b = s.bosses;
  if (!a.dash) return ['Um cavaleiro coberto de musgo guarda o Bosque. Dizem que o vento obedece a quem o vencer.', 'Descanse numa fogueira antes de encontrá-lo.'];
  if (!a.doubleJump) return ['Ouvi ecos debaixo deste abrigo... como se o chão fosse oco.', 'Golpeie para baixo no ar, quem sabe?'];
  if (!a.wallJump) return ['Com asas nos pés, a Ponte Partida das Ruínas não é mais obstáculo.', 'Suba pelo Penhasco do Moinho. Dizem que os Escaladores deixaram algo na Galeria.'];
  if (!b.king && Object.keys(s.livres || {}).length < 5) return ['Dizem que, nas Ruínas, os antigos soberanos ainda guardam salões, presos por alguém que nunca usou a Coroa.', 'Libertá-los enfraquece o Trono. Procure nas pontas das Ruínas: oeste, leste e no alto.'];
  if (!b.king) return ['A Torre dos Ventos leva ao Trono. Que a luz te acompanhe, Errante.', 'Dizem também que um poço no Coração de Cristal desce a um templo submerso... e que há um segredo no teto do recife.'];
  return [];
}

export const NPCS = {
  oren: {
    name: 'Oren, o Andarilho',
    maps: true,
    wander: 6,
    lines(game) {
      const s = game.save, a = s.abilities, b = s.bosses;
      if (!s.talked.oren) return ORIGEM;
      if (b.king) return ['O céu... está clareando. Você conseguiu.'];
      const olhos = b.moss && !s.talked.olhos ? ['Você nunca me perguntou por que seus olhos têm duas horas.', 'Quando um Alvorador morre, o Sol põe uma faísca de si numa criança que nasce no minuto em que o dia vira. O ocaso num olho, a aurora no outro.', 'Chamavam vocês de Filhos da Virada. Cada um é, de um jeito que ninguém diz alto, um filho do Sol.'] : [];
      // A história avança: cada marco muda o que ele diz (e o que ele evita dizer).
      let historia = [];
      if (s.base.smith && b.tide) {
        historia = [
          'Esta casa... a porta era azul. Eu pintei.',
          'Sua mãe a abria com o pé quando tinha as mãos cheias de lanternas.',
          '...Eu devia ter dito não.',
        ];
      } else if (s.base.smith) {
        historia = ['Fumaça nesta terra, de novo. Minha filha acendia fogo aqui.', 'Fique à vontade, Errante. Esta casa é sua tanto quanto minha.'];
      } else if (b.tide) {
        historia = ['Então você já sabe quem eu sou.', '...Não. Não sabe. Eu mesmo ainda não sei.', 'Venha ao Lar quando tiver tempo. Eu preciso te contar sobre uma casa.'];
      } else if (a.wallJump) {
        historia = ['Os Escaladores... eu os conheci. A Mestra Íris tinha mãos como as suas.', 'Ela me contou uma vez que toda parede tem dois lados. Eu achei que era sobre paredes.'];
      } else if (a.doubleJump) {
        historia = ['Você ouviu o poço?', 'Eu nunca ouvi. Mas já me disseram que ele chama. E que o nome é bonito.', 'Tenha cuidado com o que o mar guarda. Ele costuma devolver mais do que levou.'];
      } else if (b.moss) {
        historia = ['Você viu o musgo. Ele guardava algo.', 'Fico feliz que tenha sido você a pegar.'];
      } else if (a.spell) {
        historia = ['Você achou a lanterna. Ótimo. Ela é antiga.', '...Mais antiga do que parece.'];
      }
      if (olhos.length) s.talked.olhos = true;
      return [...olhos, ...historia, ...dica(s)];
    },
  },
  mira: {
    name: 'Mira, a Mercadora',
    shop: true,
    lines(game) {
      const s = game.save;
      if (!s.talked.mira) return ['Hehe! Um cliente! Faz séculos.', 'Junto moedas de todo canto de Vésper, e também madeira, pedra e minério... quem constrói sempre precisa. Se tiver o bastante, tenho coisas que podem salvar sua pele.'];
      if (s.charms.equipped.includes('alma_faminta')) return ['Esse aí... eu devia ter fundido.', 'Vai levar alguma coisa?'];
      if (Object.keys(s.bought).length >= 3) return ['Já tem o bastante, não tem?', 'Hehe. Não ligue. Hábito de velha.', 'Vai levar alguma coisa?'];
      return ['Vai levar alguma coisa?'];
    },
  },
  smith: {
    name: 'Tibério, o Ferreiro',
    trade: true,
    lines(game) {
      const s = game.save;
      if (!s.talked.smith) return [
        'Vi a fumaça da sua fogueira lá da estrada. Lugar bom pra uma forja, esse.',
        'Vou ficar por aqui. Se faltar madeira, pedra ou minério, é só falar comigo... por um punhado de moedas, claro.',
        'Ah, e fique de olho à noite. Base com fogo aceso atrai bicho.',
      ];
      if (s.weapon === 'cristal') return ['Isso é um pedaço do dia, faísca. Não é brinquedo.', 'Precisa de material?'];
      if (s.armor === 'pedra') return ['Eu fiz o primeiro desses. Não pra isso.', 'Precisa de material?'];
      return ['Precisa de material?'];
    },
  },
  eco: {
    name: 'Eco da Lanterna',
    lines(game) {
      const s = game.save;
      if (!s.abilities.spell) return [
        'Shhh... as lanternas lembram de tudo.',
        'Uma chama antiga dorme aqui perto, atrás da pedra que soa oca.',
        'Nem toda parede é o que parece. Golpeie e escute.',
      ];
      const out = ['A chama da alma queima em você agora...'];
      if (s.bosses.moss) out.push('O vento voltou. Escute. As folhas lembram como se mexer.');
      out.push('Quando você abriu os olhos pela primeira vez, um era vermelho e o outro azul. O fim e o começo do dia, no mesmo rosto.');
      if (s.talked.visoes) out.push('Você viu.', 'Eu também vi, naquele dia. Eu sou a lanterna que ela acendeu primeiro.', 'Eu não posso mandar. Só posso lembrar.');
      out.push('Use-a com sabedoria. Toque rápido para lançar, segure para curar.');
      return out;
    },
  },
};

// Quantas Memórias o herói já leu (para os NPCs comentarem o que ele descobriu).
const lidas = (s) => Object.keys(s.memorias || {}).length;
const livres = (s) => Object.keys(s.livres || {}).length;

NPCS.tome = {
  name: 'Tomé, o Lanterneiro',
  loja: 'tome',
  wander: 5,
  lines(game) {
    const s = game.save;
    if (!s.talked.tome) return [
      'Ah, você chegou até o Cume. Poucos chegam: o vento aqui não perdoa quem não aprendeu a cair.',
      'Eu era guarda-de-trilha no Reino das Lanternas. Percorria as copas com uma vara e uma lanterna na ponta. Nunca perdi ninguém.',
      'Hoje a trilha está vazia. Mas as lanternas ainda precisam de alguém que lembre o caminho.',
    ];
    if (s.bosses.mini_mariposa) return ['Você abriu as Asas de Seda. A Mariposa Rainha era a lanterna-mãe: ela acendia todas as outras.', 'Obrigado por não deixá-la sofrer.'];
    if (s.bosses.moss) return ['O Capitão Brandão era meu chefe. Ele ficou no Santuário 412 anos esperando uma ordem que nunca veio.', 'Você deu a ele o descanso. Fico em dívida.'];
    return ['O Reino das Lanternas dava uma lanterna acesa a cada criança nascida. Cada uma ainda queima, em algum lugar.', 'Se precisar de amuletos ou lenha, é só pedir.'];
  },
};

NPCS.selene = {
  name: 'Selene, a Cronista',
  loja: 'selene',
  lines(game) {
    const s = game.save, n = lidas(s), l = livres(s);
    if (!s.talked.selene) return [
      'Shh. Não pise nas páginas: elas se esfarelam. Eu sou Selene. A última escriba dos Doze Tronos.',
      'Copiei os nomes de todos os soberanos por quarenta anos. Só quando reli tudo de uma vez percebi que a letra era a mesma.',
      'A letra do Regente. Ele escrevia a história dos reis. E depois a apagava.',
    ];
    if (s.bosses.sob_eliar) return ['Eliar... você o libertou? Copiei o rascunho dele quarenta vezes. "Se houver uma décima terceira criança, eu me nego."', 'Ele cumpriu. Nem a Casa tirou isso dele.'];
    if (l >= 1) return [`Ouvi um canto se calar nas Ruínas. ${l} soberano${l > 1 ? 's' : ''} já descansa${l > 1 ? 'm' : ''}.`, 'A Roda ficou mais leve. Dá para sentir nas páginas.'];
    if (n >= 5) return [`Você já leu ${n} Memórias. Então sabe: o Dízimo era cobrança, não abraço.`, 'Continue lendo. O que falta está em salões onde ninguém quer ir.'];
    return ['Se quiser saber o que ainda não leu, eu vendo pistas. E armas que a Guarda deixou: uso nenhuma, mas gosto do brilho.'];
  },
};

NPCS.brum = {
  name: 'Brum, o Mineiro',
  loja: 'brum',
  lines(game) {
    const s = game.save;
    if (!s.talked.brum) return [
      'Psiu. Fale baixo, o geodo está ouvindo. Eu sou Brum, mineiro do Reino de Cristal.',
      'Um dia, o geodo cantou três notas. Perguntei à parede o que queria dizer. Ela me respondeu. Era voz de mulher.',
      'Ela disse: "cansada". Eu contei ao capataz. Ele me mandou para a Casa. Voltei... diferente.',
    ];
    if (s.bosses.mini_golem) return ['O Golem Rachado era meu capataz. Reconheci o jeito de bater a mão na mesa.', 'Ele agora cala. A parede também, um pouco.'];
    if (s.abilities.doubleJump) return ['Você tem as Asas de Cinza. Quem as tinha antes, passou por aqui de capa rosa. Ouviu o poço chamar e ficou com medo de responder.', 'Que bom que você respondeu.'];
    return ['Armaduras, cristais, minério. Tudo que a terra deu e a Casa não levou.'];
  },
};

NPCS.nami = {
  name: 'Nami, a Pescadora',
  loja: 'nami',
  wander: 4,
  lines(game) {
    const s = game.save;
    if (!s.talked.nami) return [
      'Ah! Uma de olhos duplos, andando no raso. Eu sou Nami, pescadora do Reino da Maré.',
      'Eu toco o sino do recife toda tarde, para os pescadores saberem a hora de voltar. Hoje ninguém volta, mas eu toco.',
      'A moça do mar vem escutar. Quando eu paro, ela pede mais um.',
    ];
    if (s.bosses.tide) return ['Você falou com ela, não foi? Ela chorou? Sempre chora quando acha que ninguém vê.', 'Ela guarda alguém no coral do Templo. Eu nunca disse nada. Mas eu sei que alguém dorme lá. E que acorda um pouquinho cada vez que eu toco o sino.'];
    if (s.bosses.mini_lampreia) return ['A Lampreia Anciã era a mais velha do recife. Nunca fez mal a ninguém. A Casa a enlouqueceu com a luz.', 'Obrigada por dar a ela o fundo do mar de volta.'];
    return ['Arcos, cajados, adagas, o que as ondas trouxerem. E boas histórias de graça.'];
  },
};

export const SHOP_ITEMS = [
  { id: 'mask', name: 'Fragmento de Vida', desc: '+1 coração de vida máxima.', price: 120, apply: (s) => { s.masksMax += 1; } },
  { id: 'nail', name: 'Afiar a Lâmina', desc: 'Seus golpes causam o dobro de dano.', price: 220, apply: (s) => { s.nail = 2; } },
  { id: 'charm_alma_faminta', name: 'Amuleto: Alma Faminta', desc: 'Golpes enchem 50% mais ALMA.', price: 150, apply: (s) => { s.charms.owned.alma_faminta = true; } },
  { id: 'charm_ima_moedas', name: 'Amuleto: Ímã de Moedas', desc: 'Moedas e materiais vêm até você.', price: 100, apply: (s) => { s.charms.owned.ima_moedas = true; } },
  { id: 'charm_pele_pedra', name: 'Amuleto: Pele de Pedra', desc: '+1 coração enquanto equipado.', price: 200, apply: (s) => { s.charms.owned.pele_pedra = true; } },
  { id: 'mask2', name: 'Vaso Antigo', desc: '+1 coração de vida máxima.', price: 300, apply: (s) => { s.masksMax += 1; } },
];
