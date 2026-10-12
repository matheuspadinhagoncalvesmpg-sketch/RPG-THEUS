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
    death: ['Nunca a tive na cabeça, criança. Nem uma vez.', 'Eu só a segurei. E elas... elas me seguraram.'],
  },
};

// Os Soberanos (ver docs/historia/10-revisao-reis-e-reinos.md): presos pelo Regente, libertados ao cair.
Object.assign(BOSS_LINES, {
  sob_dalva: {
    who: 'Dalva, a Cantora do Amanhecer', intro: 'Cantei para o Sol até a voz virar poeira. Venha: cante comigo ou cale-se.',
    mid: 'Mais alto! A manhã precisa ouvir!', low: 'Eu só queria que ela dormisse...',
    death: ['Ah... era isto. Silêncio.', 'Obrigada, criança. Diga a ela que a canção... era de amor.'],
  },
  sob_ruben: {
    who: 'Rúben, o Escrivão do Dízimo', intro: 'Tudo é dívida. Você me deve o fôlego.',
    mid: 'Pague! Pague em moeda ou em lembrança!', low: 'O livro-caixa... não fecha...',
    death: ['Fechado o livro. Saldo: zero.', 'Zero é bom. Zero é... descanso. Eu nunca tinha escrito essa palavra.'],
  },
  sob_lidia: {
    who: 'Lídia, a Capitã da Guarda', intro: 'Em guarda! A Guarda não recua!',
    mid: 'Formação! Fechem as fileiras!', low: 'Ainda sou capitã... ainda sou...',
    death: ['Dispensados. Todos. Podem ir para casa.', 'Eu nunca disse isso a ninguém. Era a única ordem que eu sabia dar.'],
  },
  sob_marta: {
    who: 'Marta, a que Não Envelhecia', intro: 'Não me olhe. Eu não... eu não envelheci.',
    mid: 'Quebre todos os espelhos, e ainda vai me ver!', low: 'Estou cansada de ser jovem...',
    death: ['Que cabelo branco bonito você tem. Posso ficar com ele?', 'Eu queria ter envelhecido. Devia ter sido tão calmo.'],
  },
  sob_sibila: {
    who: 'Sibila, a Última Vigia', intro: 'Eu vi o último amanhecer. Foi tão lento. Eu devia ter pedido para ficar.',
    mid: 'Olhe para a luz. Olhe devagar.', low: 'Quase... quase lá...',
    death: ['Lá vem ele. Devagar. Devagar.', 'Eu sempre soube que o sol era uma pessoa. Cuide dela. Ela tem sono.'],
  },
  sob_eliar: {
    who: 'Eliar, o Rei Verdadeiro', intro: 'Você tem os olhos dela. Eu me neguei por isso... e ele me deu um lugar na Roda.',
    q3: 'Não quero lutar com você. Mas a corrente quer.', mid: 'Aguente. Eu aguento mais um pouco.', low: 'Vá. Ele tem medo de você.',
    death: ['Obrigado. Quarenta e sete anos de reinado e nenhum de liberdade.', 'Alvar nunca foi coroado, criança. Nunca. Ele só tem a nós.'],
  },
});

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
