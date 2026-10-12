// As Memórias de Vésper: cada pedaço da história tem a forma de quem o deixou
// (diário, carta, eco, inscrição ou fresco) e rende uma recompensa ao ser lido pela primeira vez.
// Ver docs/historia/10-revisao-reis-e-reinos.md.
//
import { VISOES } from './story.js';

// tipo:   diario | carta | eco | inscricao | fresco
// regiao: campos | bosque | ruinas | cristal | jardins  (um reino de Alvorada cada)

export const TIPOS = {
  diario: { nome: 'Diário', cor: '#ffcf7a' },
  carta: { nome: 'Carta', cor: '#f0b6a0' },
  eco: { nome: 'Eco', cor: '#9fe3ff' },
  inscricao: { nome: 'Inscrição', cor: '#d9d2c5' },
  fresco: { nome: 'Fresco', cor: '#c9b8ff' },
};

export const REINOS = {
  campos: { nome: 'Reino de Brasa', cor: '#ffb35c' },
  bosque: { nome: 'Reino das Lanternas', cor: '#7fd394' },
  ruinas: { nome: 'Reino dos Doze Tronos', cor: '#b8b0ff' },
  cristal: { nome: 'Reino de Cristal', cor: '#7ef0ff' },
  jardins: { nome: 'Reino da Maré', cor: '#7affd4' },
};

export const MEMORIAS = {
  // ───────────── REINO DE BRASA (Campos) ─────────────
  inicio_circulos: { tipo: 'fresco', regiao: 'campos', titulo: 'Sete círculos', linhas: ['Sete círculos de terra queimada, um ao lado do outro, sobre a colina. O oitavo é o seu: a grama ainda está morna.'] },
  inicio_pedra: { tipo: 'inscricao', regiao: 'campos', titulo: 'A pedra da Colina', linhas: ['Duas palavras se sobrepõem na pedra: ALVORADA, riscada, e VÉSPER, entalhada por cima, com mão trêmula.', '"VÉSPER: Quando a Coroa da Aurora voltar ao trono, o dia retornará."'] },
  lar_placa: { tipo: 'inscricao', regiao: 'campos', titulo: 'Placa do Lar', linhas: ['"Terras livres. Corte árvores, quebre pedras e construa aqui o seu lar."', '(Aperte B, ou o botão de martelo, para construir.)', 'Embaixo, um selo mais antigo, quase apagado: "Selo da Casa da Aurora. Honra à família da criança escolhida."'] },
  lar_fundacao: { tipo: 'fresco', regiao: 'campos', titulo: 'Fundação', linhas: ['Pedras de uma fundação, quase enterradas na terra. Numa delas, um "A" minúsculo, entalhado por mãos pequenas.'] },
  brejo_acendedora: { tipo: 'diario', regiao: 'campos', titulo: 'A Velha Acendedora', linhas: ['"Dia 3 das Brumas. Acendi sete fogueiras na noite do Dízimo para chamar os meninos de volta do campo. Voltaram seis. O sétimo foi levado pela Casa na manhã seguinte. Era o dos olhos de duas cores."', '"Guardo a brasa dele numa panela de barro. Dizem que as brasas lembram. Eu lembro por ela."'] },
  ermo_lavrador: { tipo: 'carta', regiao: 'campos', titulo: 'Ao Sol, de um lavrador', linhas: ['"Mãe-Sol: o Dízimo desta safra segue em anexo: uma brasa por casa, como manda a lei. Mas minha filha pergunta por que você nunca responde."', '"Eu disse que você está cansada. Ela disse que, então, a gente podia dar menos. A Casa não achou graça. Fecho esta carta com a brasa menor."'] },
  marco_errantes: { tipo: 'inscricao', regiao: 'campos', titulo: 'Marco dos Errantes', linhas: ['Um marco de pedra cercado por sete montes de cinzas. Num deles, uma capa dobrada. Riscado com a ponta de uma espada:', '"Aqui terminam os que se cansaram. Que a próxima criança não pare."'] },
  cripta_buscador: { tipo: 'diario', regiao: 'campos', titulo: 'Diário de um Buscador', linhas: ['"Terceira criança deste ciclo. Olhos de ocaso e aurora, como diz o Registro. A mãe não chorou: já tinha aprendido a esconder."', '"Ordens do Regente: levar sem barulho, antes do amanhecer. Pergunto-me quem lembrará dela quando eu não lembrar mais de mim."'] },

  // ───────────── REINO DAS LANTERNAS (Bosque) ─────────────
  arena_espada: { tipo: 'fresco', regiao: 'bosque', titulo: 'A espada de madeira', linhas: ['Uma espada de madeira, minúscula, fincada no chão. Alguém a deixou aqui como quem deixa um recado a uma criança que ainda não chegou.'] },
  santuario_altar: { tipo: 'inscricao', regiao: 'bosque', titulo: 'Altar do Vento', linhas: ['Gravado no altar: "Quem corre com o vento jamais cai no abismo. Siga para o alto, além do moinho."', 'Em letra pequenina, no rodapé: "Guardado por Brandão, Capitão. Que ninguém o toque até que a centelha volte."'] },
  cume_lanterna: { tipo: 'carta', regiao: 'bosque', titulo: 'Para quando você voltar a ter dúvidas', linhas: ['Daqui se vê o Trono, longe, no alto das Ruínas. O vento sopra daquele lado. Alguém deixou uma lanterna apagada no parapeito, e um bilhete:', '"Para quando você voltar a ter dúvidas. Acenda, e lembre de quem te mandou até aqui. (Tomé)"'] },
  ninho_bilhete: { tipo: 'carta', regiao: 'bosque', titulo: 'Bilhete no ninho', linhas: ['Um ninho enorme feito de lanternas quebradas. Dentro, um bilhete amarrado com fio de pavio:', '"Para o próximo que chegar aqui: o Cavaleiro de Musgo também fazia ninhos. Ele era mais gentil do que parecia."'] },
  vendaval_poste: { tipo: 'inscricao', regiao: 'bosque', titulo: 'Poste do Vendaval', linhas: ['Um poste de bronze rasgado pelo vento. Preso nele, um pedaço de seda dourada, ainda inteiro:', '"Só quem aprendeu a cair devagar atravessa o Vendaval."'] },
  copas_diario: { tipo: 'diario', regiao: 'bosque', titulo: 'Guarda-de-Trilha Sem Sombra', linhas: ['"Todas as noites eu percorria as sete copas com uma lanterna na ponta de uma vara. Nunca perdi ninguém. Nem uma criança, nem um bêbado, nem um cachorro."', '"Hoje não há mais noite. Percorro as copas do mesmo jeito, para ninguém. Alguém precisa lembrar que o escuro existia."'] },
  dossel_fresco: { tipo: 'fresco', regiao: 'bosque', titulo: 'Fresco das Lanternas', linhas: ['Na madeira, um fresco desbotado: uma criança de manto azul segura uma lanterna acesa. Ao redor dela, centenas de lanternas, uma para cada filho nascido no reino.', 'A pintura termina onde a madeira apodreceu. A última lanterna está acesa.'] },

  // ───────────── REINO DOS DOZE TRONOS (Ruínas) ─────────────
  abismo_1: { tipo: 'inscricao', regiao: 'ruinas', titulo: 'Estátuas I, II e III', linhas: ['Uma estátua quebrada. Na base: "Aurélia. A que cantava para o Sol. 121 anos de Coroa."', '"Solano. Ergueu a primeira ponte. 118 anos de Coroa."', '"Dalva. Amava as manhãs mais que o povo. 112 anos de Coroa."'] },
  abismo_2: { tipo: 'inscricao', regiao: 'ruinas', titulo: 'Estátuas IV, V e VI', linhas: ['"Hélio. Mandou plantar jardins no alto. 105 anos de Coroa."', '"Cecília. Pediu à Marinheira que encurtasse a primeira noite. 99 anos de Coroa."', '"Rúben. Pôs o Dízimo por escrito. 92 anos de Coroa."'] },
  abismo_3: { tipo: 'inscricao', regiao: 'ruinas', titulo: 'Estátuas VII, VIII e IX', linhas: ['"Lídia. Criou a Guarda da Alvorada. 85 anos de Coroa."', '"Tadeu. Mandou forjar a Coroa nova. 77 anos de Coroa."', '"Marta. Não deixou ninguém vê-la envelhecer. 69 anos de Coroa."'] },
  abismo_4: { tipo: 'inscricao', regiao: 'ruinas', titulo: 'Estátuas X, XI e XII', linhas: ['"Iago. Chamou o Dízimo de Dever. 61 anos de Coroa."', '"Sibila. A última a ver o sol nascer sem pressa. 54 anos de Coroa."', 'A décima segunda estátua não tem placa. Alguém riscou os olhos dela com um prego, um por um.', 'Mais adiante, um pedestal vazio, com um vão em forma de máscara.'] },
  galeria_carta: { tipo: 'carta', regiao: 'ruinas', titulo: 'Carta de Íris', linhas: ['Arranhões profundos na pedra, em letra de quem subia paredes: "Os antigos escaladores subiam a Torre sem degraus. As paredes eram seu caminho."', 'Mais fundo, outra mão arranhou uma carta: "Eu cortei os degraus. Ele pediu e eu cortei. Não por medo da Coroa: por medo de que uma criança subisse e o Trono a aceitasse."', '"Deixei as garras aqui. Para quem vier pelo coração, e não pela coroa. (Íris, que subiu todas as paredes menos esta.)"'] },
  pico_cobertor: { tipo: 'fresco', regiao: 'ruinas', titulo: 'O cobertor', linhas: ['Um cobertor de criança, dobrado com cuidado sobre uma pedra. Alguém vinha aqui para ficar a sós.', 'No tecido, bordado com linha azul, um "A".'] },
  biblioteca_registro: { tipo: 'inscricao', regiao: 'ruinas', titulo: 'Registro das Crianças', linhas: ['Estantes de pedra, livros que viraram pó. Um sobrevive, preso por uma corrente:', '"Registro das Crianças da Virada. Doze soberanos. Doze mãos pequenas."'] },
  biblioteca_dizimo: { tipo: 'diario', regiao: 'ruinas', titulo: 'Diário de Selene', linhas: ['"O Dízimo não era pedido. Era cobrado. A cada soberano que morria, a Casa devolvia uma criança ao Sol: a mais nova que nascesse na hora certa."', '"Eu copiei esses nomes por quarenta anos. Hoje li todos de uma vez, e a letra de cada um é a mesma, e a mão que escrevia era a do Regente."'] },
  biblioteca_ultimo: { tipo: 'carta', regiao: 'ruinas', titulo: 'Rascunho de Eliar', linhas: ['Uma página riscada, escrita às pressas: "Se houver uma décima terceira criança, eu me nego. Já me neguei duas vezes e vou me negar a terceira."', '"Alvar vai dizer que a Coroa é o único caminho. Eu vou dizer que a mãe está cansada. Um de nós dois vai ter razão. E o outro vai ter a Guarda."', 'Embaixo, em outra letra, fria: "Prendam-no."'] },
  telhado_bronze: { tipo: 'inscricao', regiao: 'ruinas', titulo: 'O telescópio de bronze', linhas: ['No telhado, uma estrutura de bronze aponta para o horizonte onde o sol deveria sair. Gravado no metal:', '"Quatrocentos e doze anos olhando para o mesmo lado."'] },
  mirante_estatua: { tipo: 'inscricao', regiao: 'ruinas', titulo: 'A estátua sem rosto', linhas: ['Uma estátua sem rosto olha para o oeste, para a Torre. Na base:', '"A quem subiu sem degraus: o vento ainda guarda o seu nome."'] },
  obs_telescopio: { tipo: 'eco', regiao: 'ruinas', titulo: 'Eco da Última Vigia', linhas: ['Um telescópio quebrado aponta para a única estrela do céu: Vésper. A lente está riscada, como por um dedo:', '"Ela está olhando... ela sempre esteve... a estrela é... o olho dela... devagar, devagar..."'] },
  torreao_vigia: { tipo: 'diario', regiao: 'ruinas', titulo: 'Diário do Vigia', linhas: ['"Primeiro turno desde a Parada. O sol está onde sempre esteve. Revezamos os turnos para ninguém enlouquecer. Ainda assim, alguém enlouquece."', '"Hoje vi, no horizonte, um brilho de duas cores. Não contei a ninguém. Acho que era uma criança caminhando."'] },

  // ───────────── REINO DE CRISTAL ─────────────
  coracao_vidro: { tipo: 'eco', regiao: 'cristal', titulo: 'Inscrição viva', linhas: ['Uma inscrição brilha no cristal: "Das cinzas do último pôr do sol nasceram asas. Quem as veste toca o céu duas vezes."'] },
  visoes: { tipo: 'eco', regiao: 'cristal', titulo: 'Visões do Coração', linhas: VISOES, flag: 'visoes' },
  catacumba_buscadores: { tipo: 'inscricao', regiao: 'cristal', titulo: 'Nichos dos Buscadores', linhas: ['Nichos de pedra, cada um com uma lanterna apagada e um nome gravado: dezenas de Buscadores.', 'No fundo, um nicho vazio, com a inscrição: "Reservado a quem trouxer a criança de volta."'] },
  veio_mineiro: { tipo: 'diario', regiao: 'cristal', titulo: 'Brum, o Mineiro Que Ouviu a Terra', linhas: ['"Hoje o geodo cantou três notas. Perguntei à parede o que queria dizer. Ela me respondeu, e eu juro que foi uma voz de mulher: \'cansada\'."', '"Contei ao capataz. Ele disse que mineiros que ouvem vozes vão para a Casa. Parei de contar."'] },
  veio_fundo_nota: { tipo: 'carta', regiao: 'cristal', titulo: 'Nota no cristal', linhas: ['Riscado numa lasca de cristal: "Aqui embaixo o canto é mais claro. Se alguém ler isto: não conte à Casa o que o geodo diz. Eles vão tentar fazer o geodo calar."'] },
  ossario_fresco: { tipo: 'fresco', regiao: 'cristal', titulo: 'O ossário', linhas: ['Ossos arrumados com cuidado, em fileiras, cada um com uma lasca de cristal na mão. Quem os enterrou queria que não ficassem sozinhos.', 'Em cima, pintado com cinza: um sol com os olhos fechados.'] },

  // ───────────── REINO DA MARÉ (Jardins) ─────────────
  espinhos_placa: { tipo: 'inscricao', regiao: 'jardins', titulo: 'Prova do Alva', linhas: ['PROVA DO ALVA', 'Quem passar em 18 segundos ganha uma medalha. (O Brandão fez em 19.)'] },
  costa_sino: { tipo: 'diario', regiao: 'jardins', titulo: 'A Menina do Sino', linhas: ['"Eu toco o sino do recife toda tarde, para os pescadores saberem a hora de voltar. Hoje ninguém volta, mas eu toco."', '"A moça do mar vem escutar, às vezes. Ela não diz o nome. Mas, quando eu paro, ela pede mais um."'] },
  salao_corais: { tipo: 'fresco', regiao: 'jardins', titulo: 'Corais cantores', linhas: ['Os corais do salão formam desenhos regulares: um sol, uma onda, um sol, uma onda. Quem os cultivou queria ensinar ao mar o ritmo do dia.'] },
};

// Memórias na ordem das salas (cada sala usa uma lista, na ordem em que as pedras "L" aparecem).
export const LORE_SALAS = {
  planicie_lar: ['lar_placa', 'lar_fundacao'],
  campos_inicio: ['inicio_circulos', 'inicio_pedra'],
  campos_brejo: ['brejo_acendedora'],
  campos_ermo: ['ermo_lavrador'],
  campos_marco: ['marco_errantes'],
  campos_cripta: ['cripta_buscador'],
  bosque_arena: ['arena_espada'],
  santuario_vento: ['santuario_altar'],
  bosque_cume: ['cume_lanterna'],
  bosque_ninho_alto: ['ninho_bilhete'],
  bosque_vendaval: ['vendaval_poste'],
  bosque_copas: ['copas_diario'],
  bosque_dossel: ['dossel_fresco'],
  ruinas_abismo: ['abismo_1', 'abismo_2', 'abismo_3', 'abismo_4'],
  ruinas_galeria: ['galeria_carta'],
  ruinas_pico: ['pico_cobertor'],
  ruinas_biblioteca: ['biblioteca_registro', 'biblioteca_dizimo', 'biblioteca_ultimo'],
  ruinas_telhado: ['telhado_bronze'],
  ruinas_mirante_leste: ['mirante_estatua'],
  ruinas_observatorio: ['obs_telescopio'],
  ruinas_torreao: ['torreao_vigia'],
  cristal_coracao: ['coracao_vidro', 'visoes'],
  cristal_catacumba: ['catacumba_buscadores'],
  cristal_veio: ['veio_mineiro'],
  cristal_veio_fundo: ['veio_fundo_nota'],
  cristal_ossario: ['ossario_fresco'],
  desafio_espinhos: ['espinhos_placa'],
  jardins_costa: ['costa_sino'],
  jardins_salao: ['salao_corais'],
};

// Quantas Memórias cada reino tem (para o diário e a recompensa de completar).
export const MEMORIAS_POR_REINO = (() => {
  const out = {};
  for (const m of Object.values(MEMORIAS)) out[m.regiao] = (out[m.regiao] || 0) + 1;
  return out;
})();
