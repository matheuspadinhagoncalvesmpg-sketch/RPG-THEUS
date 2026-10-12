// Roteiro das cenas (ver docs/historia/10-revisao-reis-e-reinos.md §5).
// bg: sol | noite | ouro | mar | cinza | vazio

export const CENAS = {
  abertura: [
    { bg: 'sol', glifo: '☼', texto: 'Vésper. O sol parou há tanto tempo que ninguém mais sabe contar.' },
    { bg: 'sol', glifo: '✦', texto: 'Cinco reinos viraram ruínas, brasas, lanternas, cristais e maré. Algumas luzes, no entanto, ainda lembram.' },
    { bg: 'ouro', glifo: '◐', texto: 'Uma delas acordou. Tem um olho da cor do ocaso, outro da cor da aurora, e nenhuma lembrança de por quê.' },
  ],

  soberano_livre: [
    { bg: 'cinza', glifo: '♛', quem: 'A alma se solta', texto: 'O corpo do soberano cai sem peso. Do peito dele sobe uma luz fina, como pavio apagado que lembrou de ser fogo.' },
    { bg: 'ouro', glifo: '✦', texto: 'Por um instante a alma olha para você. Sorri. E vai embora, pela primeira vez em quatrocentos anos, para onde quer que as almas vão.' },
    { bg: 'cinza', glifo: '⛓', texto: 'No alto das Ruínas, algo estala. Uma corrente a menos na Roda.' },
  ],

  eliar: [
    { bg: 'cinza', glifo: '♛', quem: 'Eliar', texto: 'Eu fui o último a sentar neste trono. Quarenta e sete anos. Nenhum deles de coroa na cabeça: eu nunca gostei do peso.' },
    { bg: 'noite', glifo: '☾', quem: 'Eliar', texto: 'Na véspera da Passagem, descobri o que a Ondina sempre soube. Ela não tem fome, criança. Está cansada. Ordenei o fim do Dízimo.' },
    { bg: 'noite', glifo: '⛓', quem: 'Eliar', texto: 'O Regente me prendeu. Arrancou meus olhos de rei. Pôs a Coroa em você, para ver se ardia. Quando ardeu, soltou-a. E o mundo parou.' },
    { bg: 'ouro', glifo: '✦', quem: 'Eliar', texto: 'Ele nunca foi coroado, nunca foi rei. Só segurou. E, para segurar, prendeu a mim e a onze que me antecederam. Liberte-nos.' },
  ],

  alvar_sem_coroa: [
    { bg: 'vazio', glifo: '☼', texto: 'No alto do Trono, três cacos dourados giram em torno de uma cabeça sem coroa.' },
    { bg: 'noite', glifo: '♛', quem: 'Alvar, o Regente', texto: 'Eles chamam de Rei Sem Coroa. Que ironia. Nunca a tive na cabeça. Eu só a segurei.' },
  ],

  roda_descansa: [
    { bg: 'ouro', glifo: '☼', texto: 'Os doze se foram. A Roda, sem quem a empurre, hesita.' },
    { bg: 'mar', glifo: '≈', texto: 'Lá embaixo, a maré sobe um pouco. Sobe com cuidado, como quem quer abraçar o que nunca pôde.' },
    { bg: 'sol', glifo: '☼', texto: 'O sol, a um palmo do mar, fecha os olhos pela primeira vez em quatrocentos e doze anos.' },
  ],
};
