// Textos e dados da história que não pertencem a uma sala só (ver docs/historia/).
// Falas dos chefes: "intro" abre a luta; q3/mid/low acontecem ao cair para 75%, 50% e 25% da vida;
// "pogo" é dita na primeira pancada de cima para baixo; "death" aparece como diálogo ao vencer.

export const BOSS_LINES = {
  moss: {
    who: 'Brandão, o Cavaleiro de Musgo',
    intro: 'Este santuário não é seu.',
    mid: 'Volte quando sua lâmina pesar mais.',
    low: 'O musgo cobre todos que caem aqui.',
    pogo: 'Esse golpe... eu ensinei esse golpe.',
    death: ['...Centelha?', 'Corra, centelha. Eu fiquei por você. Agora vá por mim.'],
  },
  tide: {
    who: 'Ondina, a Rainha das Marés',
    intro: 'Este templo é meu mar.',
    mid: 'A maré sempre volta, Errante.',
    low: 'Afogue-se em silêncio.',
    death: ['...Desta vez você veio por inteiro.', 'Ele ainda está lá em cima?'],
  },
  king: {
    who: 'Alvar, o Rei Sem Coroa',
    intro: 'Mais uma.',
    q3: 'A aurora nunca mais vai nascer.',
    mid: 'Você é só mais uma sombra, Errante.',
    pogo: 'Por que você tem o golpe dele?',
    low: 'Ajoelhe-se diante do crepúsculo.',
    death: ['Não me peça a Coroa. Eu não... não posso te dar de novo.'],
  },
};

// As sete capas dos Errantes que vieram antes (uma em cada fogueira; todas no corredor do Trono).
export const CAPES = {
  vermelha: { color: '#8f2f3a', nome: 'vermelha', note: 'Não esperei o velho terminar de falar. Ele ia dizer alguma coisa importante.' },
  verde: { color: '#2f6f4f', nome: 'verde', note: 'Li todas as lanternas. Esqueci de acender a minha.' },
  roxa: { color: '#5b3a8f', nome: 'roxa', note: 'Venci o cavaleiro. Ele me chamou de outro nome. Eu não soube de quem era.' },
  laranja: { color: '#b8742f', nome: 'laranja', note: 'Subi a Torre sem entender por que ela não tinha degraus. Entendi lá em cima.' },
  preta: { color: '#24232c', nome: 'preta', note: 'Cheguei ao Pico sem pressa. Fui o único. Ainda assim.' },
  rosa: { color: '#c75b8f', nome: 'rosa', note: 'Ouvi alguém me chamar no poço. Tive medo de responder.' },
  bege: { color: '#d9d4c7', nome: 'bege', note: 'Cheguei até a Rainha. Ela chorou ao me ver e eu não soube consolá-la.' },
};

export const CAPE_ORDER = ['vermelha', 'verde', 'roxa', 'laranja', 'rosa', 'preta', 'bege'];

export function capeNote(key) {
  const c = CAPES[key];
  return `Uma capa ${c.nome} pendurada numa estaca, ao lado da fogueira. Presa a ela, um bilhete:\n"${c.note}"`;
}

// Visões do cristal no Coração (marca "visoes": o herói passa a conhecer a verdade sobre o Sol).
export const VISOES = [
  'O cristal pulsa. Ao seu toque, o último pôr do sol de verdade se lembra de si mesmo.',
  'Uma sala de pedra, num minuto exato em que o dia vira. Uma criança nasce. Abre os olhos: um vermelho como o ocaso, outro azul como a aurora. Lá no alto, o Sol sorri. A faísca que ela guarda é dele.',
  'Uma procissão atravessa uma ponte com doze estátuas. No meio, uma criança de manto azul e máscara de marfim segura a mão de um velho de barba cinzenta.',
  'Uma escadaria interna, cheia de mãos de escaladores. A criança sobe devagar e olha para trás, procurando alguém. Não acha.',
  'Um trono. Uma coroa dourada pousa na cabeça da criança. Os olhos dela se acendem. Ela não grita: pergunta baixinho, "dói assim mesmo?"',
  'Uma mulher de cabelos molhados irrompe pela porta. Fala. O velho a olha. O velho solta a Coroa. A Coroa se parte em três.',
  'O sol, em forma de uma mulher gigante e luminosa, abre os olhos: dois olhos de cores diferentes. Olha, por um instante, para a criança caída. E não reconhece. E fecha os olhos, cansada.',
];
