// As Memórias de Vésper: cada pedaço da história tem a forma de quem o deixou
// (diário, carta, eco, inscrição ou fresco) e rende uma recompensa ao ser lido pela primeira vez.
// Ver docs/historia/10-revisao-reis-e-reinos.md.
//
import { VISOES } from './story.js';
import { CAMARAS } from './segredos.js';

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
  lar_placa: { tipo: 'inscricao', regiao: 'campos', titulo: 'Placa do Lar', linhas: ['"Casa dos Oren. Porta azul. Quem passar, entre."', 'Embaixo, um selo mais novo, da Casa da Aurora: "Propriedade confiscada. Honra à família da criança escolhida."'] },
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
  // ───────────── Segunda leva: guardadas em baús de chefe ou em passagens secretas ─────────────
  // Reino de Brasa (câmaras secretas)
  alto_carta: { tipo: 'carta', regiao: 'campos', titulo: 'Carta que ninguém entregou', linhas: ['Papel dobrado em quatro, guardado dentro de uma caixa de latão: "Ao Regente da Casa da Aurora. Paguei o Dízimo de sete safras, e minha neta continua sem voltar."', '"Escrevi ao Sol. Recebi resposta: \'ninguém volta do Sol\'. A letra era cuidadosa, a mesma de todas as respostas."', '"Mas o Sol não escreve cartas. Quem está respondendo as minhas?"'] },
  marco_errante: { tipo: 'diario', regiao: 'campos', titulo: 'Diário de um Errante sem nome', linhas: ['"Fomos sete. O velho deu a cada um de nós um mapa e uma palavra para repetir: Alva."', '"Perguntei quem era. Ele olhou para a lareira e disse: \'Alguém que eu não protegi.\' Não perguntei mais."', '"Se você está lendo isto, é porque eu não passei do Bosque. A palavra continua valendo. Diga-a quando tiver medo."'] },
  cripta_ordem: { tipo: 'carta', regiao: 'campos', titulo: 'Ordem selada do Regente', linhas: ['"Aos Buscadores. A criança de olhos duplos não deve ser tocada: apenas observada e escoltada até a Passagem. Inteira. Sem marcas."', '"Nenhuma menção à Coroa em voz alta, nem entre vocês. Ela não é minha. Ainda."', 'Embaixo, a assinatura: "Alvar, Regente da Casa da Aurora". Só Regente. Nenhum outro título.'] },
  // Reino das Lanternas
  moss_diario: { tipo: 'diario', regiao: 'bosque', titulo: 'Diário de Brandão', linhas: ['"Ano 412 de guarda. Ordem da Regência: manter o Santuário do Vento até a criança chegar. Entendi \'até a criança chegar\' como uma promessa. Hoje entendi que era um prazo."', '"O golpe de cima para baixo, eu ensinei a uma menina de cinco anos que corria demais. Ela caía e eu ria. Ela se levantava e pedia mais um."', '"Não lembro o nome dela. Lembro só que ela me chamava de \'Capitão Barba\'."'] },
  besouro_eco: { tipo: 'eco', regiao: 'bosque', titulo: 'Eco do Besouro-Rei', linhas: ['Um zumbido grave, quase uma canção: "Eu... era o pastor... dos besouros... a Casa... pôs uma lanterna... no meu casco..."', '"Luz demais. Luz o dia inteiro. Disseram que era honra. Eu só queria... a sombra... da gruta..."', 'O eco se desfaz num ruído de asas.'] },
  vespa_carta: { tipo: 'carta', regiao: 'bosque', titulo: 'Para a Rainha do Ninho', linhas: ['"Querida Rainha: a Casa pediu mel dourado para o ritual. Você deu. Pediu mais. Você deu."', '"Agora pedem a colmeia inteira, e eu não sei dizer não à Casa. Você nunca soube dizer não a mim."', '"Perdoe-me. Eu vou te trazer flores todo ano, mesmo que seja só para o seu túmulo."'] },
  mariposa_eco: { tipo: 'eco', regiao: 'bosque', titulo: 'Eco da Lanterna-Mãe', linhas: ['Uma luz suave e trêmula: "Eu acendia todas as outras. Cada lanterna do reino, uma criança."', '"Quando apagaram a primeira, eu senti. Depois a segunda. Eu fui apagando devagar, uma a uma, dentro de mim."', '"Elas pararam de ser lanternas. Viraram fome. Me perdoe, filha. Eu não soube segurá-las."'] },
  cume_trilha: { tipo: 'carta', regiao: 'bosque', titulo: 'Confissão do Guarda-de-Trilha', linhas: ['"Eu dizia que nunca perdi ninguém. Menti. Perdi uma."', '"Na noite da Passagem, uma menina de manto azul passou descalça, procurando a mãe. Eu lhe disse para seguir as lanternas até o Regente. Era o caminho mais seguro."', '"Era o caminho dele. Eu deixei uma criança na estrada que levava ao Trono, e acendi a lanterna para ela não se perder."'] },
  cisterna_fresco: { tipo: 'fresco', regiao: 'bosque', titulo: 'As doze lanternas', linhas: ['No fundo da cisterna, doze lanternas pintadas em fila. Onze acesas.', 'A décima segunda foi riscada com uma lâmina e repintada de branco. Embaixo, em letra apressada:', '"Ele não morreu. Ele foi arrancado."'] },
  lago_diario: { tipo: 'diario', regiao: 'bosque', titulo: 'Diário do pescador de luz', linhas: ['"O Guarda-de-Trilha Sem Sombra dizia que quem não tem sombra não é seguido por nada. Eu ria. Hoje entendi."', '"A sombra não é o medo. A sombra é a Casa. Ela vai atrás de todos nós, mesmo à noite, mesmo sem lua."', '"Os peixes-lanterna do lago não têm sombra. Talvez por isso sejam os únicos que nunca fugiram."'] },
  // Reino dos Doze Tronos
  dalva_eco: { tipo: 'eco', regiao: 'ruinas', titulo: 'Último canto de Dalva', linhas: ['Uma melodia sem palavras, e por baixo dela uma voz de mulher: "Cantei para a Roda cem anos. Cada nota, um dia que não acabou."', '"Ele me disse que era uma honra. Que eu seria lembrada pela voz."', '"Fui lembrada. Mas não por mim. Pelo cansaço da Roda, que agora canta com a minha garganta."'] },
  ruben_livro: { tipo: 'diario', regiao: 'ruinas', titulo: 'Livro-caixa de Rúben', linhas: ['Colunas de números em tinta escura. Ao fim de cada página, a mesma anotação: "Saldo: uma criança".', '"Nota ao Regente: o livro não fecha. Resposta do Regente, na margem: \'Fechará quando você parar de contar.\'"', '"Parei de contar na página 400. O livro continuou somando sozinho."'] },
  lidia_carta: { tipo: 'carta', regiao: 'ruinas', titulo: 'Última ordem de Lídia', linhas: ['"À Guarda da Alvorada. Se esta carta chegar a vocês, saibam: eu desobedeci à Casa uma vez, e foi a melhor noite da minha vida."', '"Deixei uma menina cruzar a ponte sem escolta. Ela atravessou correndo, e eu fiquei olhando as costas dela."', '"Quando o Regente me perguntou quem foi, eu disse: ninguém. Foi a primeira vez que menti. Foi a única vez que me senti capitã."'] },
  marta_diario: { tipo: 'diario', regiao: 'ruinas', titulo: 'Diário dos espelhos', linhas: ['"Hoje quebrei o décimo espelho. Atrás de cada um, a mesma mulher cansada."', '"O Regente disse que continuo jovem porque estou \'na Roda\'. Como se fosse um elogio."', '"Eu pedi para envelhecer. Ele sorriu e disse que eu seria útil assim. Foi a primeira vez que vi o Regente ter medo: não de mim, do que acontece se eu morrer."'] },
  sibila_eco: { tipo: 'eco', regiao: 'ruinas', titulo: 'O que Sibila viu', linhas: ['Uma voz serena e vagarosa: "Vi o último amanhecer do alto do Observatório. Foi lento, tão lento."', '"E vi o Regente no Trono, sem coroa na cabeça. As mãos fechadas em torno de três pedaços de ouro. As mãos tremiam."', '"Ele nunca a usou. Ele só a segurava. Eu percebi que ele nunca foi rei... e que tinha medo de ser."'] },
  obs_diario: { tipo: 'diario', regiao: 'ruinas', titulo: 'Estudos da Vigia', linhas: ['"A estrela parada no céu não é uma estrela. Medi o brilho por quarenta noites: ele pisca, bem devagar, num ritmo de respiração."', '"Vésper é o olho do Sol, entreaberto. Ela não se pôs: ela está tentando dormir e algo não deixa."', '"Se alguém quebrar a Roda, o olho se fecha. E o dia, que estava esperando por ela, finalmente nasce."'] },
  mirante_carta: { tipo: 'carta', regiao: 'ruinas', titulo: 'Carta da Mestra Íris', linhas: ['Gravada a faca, na pedra do ninho: "Aos que vierem escalar. Subimos sem degraus porque a Casa tirou os degraus da Torre."', '"Só chega ao Trono quem quer muito. Foi pedido de um rei: Eliar. Ele queria que alguém chegasse."', '"Não sei se foi ideia dele ou esperança. Subam assim mesmo."'] },
  // Reino de Cristal
  golem_diario: { tipo: 'diario', regiao: 'cristal', titulo: 'Diário do Capataz', linhas: ['"Mandei o Brum à Casa por contar do geodo. Disse a mim mesmo que era regra."', '"Hoje o geodo cantou para mim também, e entendi por que ele tinha medo. A voz é de mulher. É tão cansada que dói no osso."', '"Quero buscá-lo de volta. Mas não consigo mais sair da pedra: eu estou virando a parede."'] },
  coracao_eco: { tipo: 'eco', regiao: 'cristal', titulo: 'Eco do Sol', linhas: ['Uma voz enorme, baixa, quase um sussurro de mãe: "Estou tão cansada... Ele diz que a Roda precisa de mim. Eu só queria dormir um pouco."', '"A menina dos olhos diferentes... deixem-na ir. Ela não é uma refeição. Ela é a minha filha."', 'O cristal se aquece por um instante, como um abraço.'] },
  fundo_buscador: { tipo: 'carta', regiao: 'cristal', titulo: 'Carta de um Buscador arrependido', linhas: ['"Eu levei a terceira criança do ciclo. Ela me pediu para segurar o sino dela, e eu não pude: era regra."', '"Tenho o sino agora. Toca sozinho, de madrugada. Já não sei se é o sino ou o remorso."', '"Se algum dia alguém procurar por ela: ela não chorou. Ela me disse \'obrigada por me levar com cuidado\'. Eu nunca me perdoei por isso."'] },
  ossario_nomes: { tipo: 'inscricao', regiao: 'cristal', titulo: 'Muro dos Nomes', linhas: ['Um muro de cristal, inteiro coberto de nomes: Tiago, Maria, Luzia, Pedro... centenas de crianças, uma linha para cada.', 'As últimas linhas estão em branco. Só uma tem uma letra, sozinha, entalhada com cuidado: "A."', 'Alguém passou o dedo ali tantas vezes que a letra brilha.'] },
  // Reino da Maré
  lampreia_eco: { tipo: 'eco', regiao: 'jardins', titulo: 'Eco da Lampreia', linhas: ['Um som úmido, como bolhas subindo: "Eu era a mais antiga do recife. Cantava com a moça do mar."', '"A luz da Casa queimou meus olhos. Mesmo assim, eu sentia quando ela chorava perto de mim."', '"Ela me chamava de \'velha amiga\'. Eu nunca soube dizer a ela que também era."'] },
  gruta_bilhete: { tipo: 'carta', regiao: 'jardins', titulo: 'Bilhete de Ondina', linhas: ['Um papel selado em cera, impossivelmente seco debaixo d\'água: "Oren: ela respira. Está crescendo. Não diga a ninguém."', '"Não venha me ver. Você é o primeiro lugar onde eles procuram."', '"Ela já pergunta pelo avô. Eu respondo que ele está atrasado, e que vai trazer lanternas."'] },
  sino_fresco: { tipo: 'fresco', regiao: 'jardins', titulo: 'A Menina do Sino', linhas: ['Um fresco de coral: uma menina descalça, um sino na mão, um recife atrás dela cheio de barcos pequenos.', 'Cada barco tem uma luz. Um deles, o último, está apagado, e alguém pintou por cima uma mão aberta.'] },
  abissal_cantiga: { tipo: 'inscricao', regiao: 'jardins', titulo: 'A cantiga do Dízimo', linhas: ['Gravada em madrepérola, a canção que o Reino da Maré cantava ao pôr do sol:', '"Que o sol volte e me leve, mas não me leve a ela. Que o mar se cale e me guarde, mas não guarde a ela."', 'Embaixo, em letra mais nova: "Cantamos todos os dias. Ele nunca respondeu."'] },
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
  ...Object.fromEntries(CAMARAS.map((c) => [c.id, [c.memoria]])), // câmaras secretas
};

// Quantas Memórias cada reino tem (para o diário e a recompensa de completar).
export const MEMORIAS_POR_REINO = (() => {
  const out = {};
  for (const m of Object.values(MEMORIAS)) out[m.regiao] = (out[m.regiao] || 0) + 1;
  return out;
})();
