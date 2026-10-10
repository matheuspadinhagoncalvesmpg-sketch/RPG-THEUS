# 05 · Regiões e Salas

Cada região foi **um lugar que as pessoas amavam** antes de virar o que é. Cada sala existe **por um motivo** e **conta uma coisa**. Textos prontos para implementar estão marcados com **✦ novo** (ainda não existe no jogo) ou **◆ atual** (já existe; aqui está sua leitura nova).

```
                                  ┌─ Pico ─── TRONO
                      Torre ───────┤
   Planície ─ Colina ─ Abrigo ─ Moinho ─ Ponte ─┘ ─ Galeria
   do Lar    Despertar  Andarilhos   (Campos)       (Ruínas)
                │
                └ (chão rachado) ─ Poço Ecoante ─ Galeria Cintilante ─ Coração
                                         │                               │
                                      (Cavernas)                     (poço) ↓
                                                         Poço das Marés ─ Recife ─ Templo
                                                              (Jardins)      │
                                                                       Prova das Lâminas (secreta)
   Orla ─ Raízes ─ Clareira ─ Santuário   (Bosque, ligado ao Moinho)
```

---

## REGIÃO 1: Os Campos do Crepúsculo
*"onde o sol nunca termina de se pôr"*

**O que foi:** as terras de cultivo da Alvorada, onde se colhia o trigo do **Pão da Aurora** (o pão do rito de cada manhã).
**O que é agora:** colinas douradas e silenciosas, onde o povo **continua indo trabalhar** (as Gosmas).
**O que o jogador sente:** calma triste. *"Isto era bonito."*

### 1.1 Planície do Lar (`planicie_lar`)
| | |
| :--- | :--- |
| **Função** | O **lar de nascimento de Alva**. A base do jogador. |
| **O que foi** | A fazenda de **Oren e Liora**. A Casa deu a terra à família como "honra" quando levou a criança. |
| **O que o jogador vê** | Uma planície larga, um **cercado quebrado**, **fundações de uma casa antiga** (quase invisíveis). |
| **Segredo** | Entre as pedras da fundação, há **uma porta azul caída**. Dá para **reerguê-la** quando a casa é construída (ver `06`). |
| **Inimigos** | Poucos; **à noite, visitas**. |
| **O que conta** | **Construir aqui é um ato de resgate.** |

**◆ Placa (atual):** *"Terras livres. Corte árvores, quebre pedras e construa aqui o seu lar. (Aperte B ou o botão de martelo para construir.)"*
**✦ Complemento (ao lado da placa, mais antigo):** *"Selo da Casa da Aurora. Honra à família da criança escolhida."*
A palavra **"Honra"** deve parecer **fria**: um carimbo.

### 1.2 Colina do Despertar (`campos_inicio`)
| | |
| :--- | :--- |
| **Função** | Onde cada Errante **desperta**. O início do jogo. |
| **O que foi** | Um **marco da Casa** na estrada para a Torre. |
| **O que o jogador vê** | Uma colina com **círculos queimados no chão** (as sete anteriores acordaram aqui). |
| **Inimigos** | Uma gosma só: um **aviso gentil**. |

**◆ Pedra (atual), com leitura nova:**
> *Uma pedra antiga, gasta pelo vento. Duas palavras se sobrepõem: **ALVORADA**, riscada, e **VÉSPER**, entalhada por cima, com mão trêmula.*
> *"Quando a Coroa da Aurora voltar ao trono, o dia retornará."*

**✦ Segunda pedra pequena, ao lado (sem destaque):**
> *Sete círculos de terra queimada, um ao lado do outro. O oitavo é o seu.*

### 1.3 Abrigo dos Andarilhos (`campos_abrigo`)
| | |
| :--- | :--- |
| **Função** | Primeiro **refúgio**: fogueira, Oren, Mira. A **Primeira Brasa**. |
| **O que foi** | Parada da ordem dos **Andarilhos**, que carregam o fogo de lugar em lugar. |
| **Segredo** | **O chão rachado** (golpeie para baixo): é a **passagem secreta** que os Andarilhos usavam para as Cavernas. Eles a **esconderam** para que a Casa não achasse o Coração. |
| **Fogueira 1 (Brasa do Abrigo)** | **Capa vermelha** pendurada. Bilhete na capa: *"Não esperei o velho terminar de falar. Ele ia dizer alguma coisa importante."* |

### 1.4 Penhasco do Moinho (`campos_moinho`)
| | |
| :--- | :--- |
| **Função** | **Subida** para as Ruínas e ponte para o Bosque. |
| **O que foi** | O **moinho do Pão da Aurora**. As pás giravam com o vento do rito. Hoje estão **paradas**. |
| **O que conta** | O vento **parou** no mundo todo. Quando o Manto voltar, **as pás do moinho voltam a girar** (efeito de mundo). |

---

## REGIÃO 2: O Bosque das Lanternas
*"as luzes lembram de tudo"*

**O que foi:** o **Parque do Registro**. Quando alguém nascia em Alvorada, uma **lanterna** era pendurada no Bosque. Quando morria, a lanterna **se apagava com respeito**. O Bosque era um **cartório da alma**.
**O que é agora:** milhares de lanternas, **cada uma uma pessoa**. As **douradas** guardam algo de Alva.
**O que o jogador sente:** reverência. Cada luz é alguém.

### 2.1 Orla das Lanternas (`bosque_entrada`)
| | |
| :--- | :--- |
| **Função** | **Entrada.** Apresenta o Bosque, os espinhos, as flores carnívoras. |
| **O que conta** | O **Cristal de Vida** no alto é o **primeiro** presente de Aurora. Perto dele, **um "A" entalhado** na casca da árvore. |

### 2.2 Raízes Profundas (`bosque_raizes`)
| | |
| :--- | :--- |
| **Função** | Casa do **Eco**; **Prova da Chama**. |
| **O que foi** | A **raiz-mestra** do Registro: onde as lanternas mais antigas ficam. |
| **Segredo** | **A parede oca** (golpeie e escute) esconde a **Chama da Alma**: a lanterna que Ondina ocultou. |
| **Fogueira 2 (nova)** | **Capa verde.** Bilhete: *"Li todas as lanternas. Esqueci de acender a minha."* |

**✦ Texto ao tocar a lanterna escondida (momento importante):**
> *Uma lanterna pequena, sem pavio. Dentro dela, uma luz do tamanho de uma ervilha. Quando você a pega, ela não esquenta a mão. Esquenta o peito.*

### 2.3 Clareira do Cavaleiro (`bosque_arena`)
| | |
| :--- | :--- |
| **Função** | Arena do **primeiro chefe**. |
| **O que foi** | O **pátio de treino** da Guarda: onde Brandão ensinava Alva. |
| **O que o jogador vê** | **Bonecos de treino** quebrados cobertos de musgo, **uma espada de madeira minúscula** fincada no chão, perto da porta de saída. |

### 2.4 Santuário do Vento (`santuario_vento`)
| | |
| :--- | :--- |
| **Função** | **Prova do Vento.** Altar do Manto. |
| **O que foi** | O **santuário** de onde saía a corrida do rito. |
| **O que conta** | Quando o Manto é pego, **o vento volta ao mundo**. |
| **Fogueira 3** | **Capa roxa.** *"Venci o cavaleiro. Ele me chamou de outro nome. Eu não soube de quem era."* |

**◆ Altar (atual):** *"Quem corre com o vento jamais cai no abismo. Siga para o alto, além do moinho."*
**✦ Embaixo, em letra pequenina:** *"Guardado por Brandão, Capitão. Que ninguém o toque até que ela volte."*

---

## REGIÃO 3: As Ruínas Suspensas
*"um reino entre as nuvens"*

**O que foi:** **A Alvorada**, a capital: a cidade alta, **erguida pela luz** da Coroa para ficar mais perto do Sol. Era feita de luz, e **quando a luz parou, a cidade soltou-se do chão** e foi subindo, pedra por pedra.
**O que é agora:** pedaços de cidade **à deriva**, torres inclinadas, pontes cortadas.
**O que o jogador sente:** vertigem e solidão. *"Tanta gente morou aqui."*

### 3.1 Ponte Partida (`ruinas_abismo`)
| | |
| :--- | :--- |
| **Função** | Primeira prova do **dash** (a ponte tem um buraco). |
| **O que foi** | A **Ponte do Cortejo**: a rota da procissão da Passagem. **Doze estátuas** dos Alvoradores ladeavam o caminho. |
| **O que o jogador vê** | **Onze estátuas** de pé ou partidas, **uma inacabada**, e **um 13º pedestal vazio** com um **vão em forma de máscara**. |

**✦ As placas dos Doze** (uma por estátua, uma linha cada; o jogador *calcula sozinho* que a vida na Coroa só encurta):
| # | Placa |
| :-: | :--- |
| I | *Aurélia. A que cantava para o Sol. 121 anos de Coroa.* |
| II | *Solano. Ergueu a primeira ponte. 118 anos de Coroa.* |
| III | *Dalva. Amava as manhãs mais que o povo. 112 anos de Coroa.* |
| IV | *Hélio. Mandou plantar jardins no alto. 105 anos de Coroa.* |
| V | *Cecília. Pediu à Marinheira que encurtasse a primeira noite. 99 anos de Coroa.* |
| VI | *Rúben. Pôs o Dízimo por escrito. 92 anos de Coroa.* |
| VII | *Lídia. Criou a Guarda da Alvorada. 85 anos de Coroa.* |
| VIII | *Tadeu. Mandou forjar a Coroa nova. 77 anos de Coroa.* |
| IX | *Marta. Não deixou ninguém vê-la envelhecer. 69 anos de Coroa.* |
| X | *Iago. Chamou o Dízimo de Dever. 61 anos de Coroa.* |
| XI | *Sibila. A última a ver o sol nascer sem pressa. 54 anos de Coroa.* |
| XII | *(A estátua está sem placa. Os olhos foram riscados com um prego.)* |
| (13) | *(Um pedestal vazio. No vão, uma máscara que não está lá.)* |

> **A placa V** é a pista escondida do **Encurtamento das Noites**. Quem perceber, entende que **tudo começou com um pedido de "mais dia"**.

### 3.2 Torre dos Ventos (`ruinas_torre`)
| | |
| :--- | :--- |
| **Função** | **A grande subida** (Garras de Pedra). |
| **O que foi** | A **Escada do Sol**: os degraus por onde o Alvorador subia ao Trono. |
| **Por que não há degraus** | **Íris os cortou**, a pedido de Alvar, depois da Parada. *"Que ninguém suba até aqui por engano."* |
| **O que o jogador vê** | **Marcas de degraus** arrancadas na parede (como cicatrizes). |

### 3.3 Galeria dos Escaladores (`ruinas_galeria`)
| | |
| :--- | :--- |
| **Função** | **Prova da Pedra.** Dá as Garras. |
| **O que foi** | O **alojamento** dos Escaladores, que mantinham a Roda. |
| **Fogueira 4** | **Capa laranja.** *"Subi a Torre sem entender por que ela não tinha degraus. Entendi lá em cima."* |

**◆ Arranhões (atual):** *"Os antigos escaladores subiam a Torre sem degraus. As paredes eram seu caminho."*
**✦ Carta de Íris (arranhada fundo na pedra, logo depois):**
> *Eu cortei os degraus. Ele pediu e eu cortei. Não por medo da Coroa: por medo de que uma criança subisse e o Trono a aceitasse.*
> *Deixei as garras aqui. Para quem vier pelo coração, e não pela coroa.*
> *— Íris, que subiu todas as paredes menos esta.*

### 3.4 Pico das Nuvens (`ruinas_pico`)
| | |
| :--- | :--- |
| **Função** | **Última antessala.** O ar mais fino, o céu mais perto. |
| **O que o jogador vê** | **Um cobertor de criança** dobrado sobre uma pedra, o **segundo Cristal de Vida**, e um **"A"** entalhado. |
| **Fogueira 5 (nova)** | **Capa preta.** *"Cheguei ao Pico sem pressa. Fui o único. Ainda assim."* |

### 3.5 Trono do Crepúsculo (`trono`)
| | |
| :--- | :--- |
| **Função** | O **chefe final**. A **Roda do Dia**. |
| **O que o jogador vê** | **Sete montes de pedra** no corredor de entrada, cada um com **uma capa pendurada numa estaca** (as Sete Sombras). Ao fundo, a **Roda**: uma engrenagem imensa **parada**. Acima, o céu, com **Vésper** (a única estrela). |
| **O que conta** | O céu **é uma pintura de luz** mantida pela mão de Alvar. |

**✦ Ao entrar (sem destaque):**
> *Sete capas penduradas em estacas. Vermelha, verde, roxa, laranja, rosa, preta, bege. Na estaca mais perto da porta, uma oitava, vazia.*

---

## REGIÃO 4: As Cavernas de Cristal
*"o coração frio de Vésper"*

**O que foi:** as **minas** que sustentavam a cidade alta. Ouro de manhã, cristal de tarde.
**O que é agora:** o lugar onde **a última luz do sol caiu** e **virou pedra**. Cada cristal é um fragmento do **último pôr do sol real**.
**O que o jogador sente:** que está **dentro de uma memória**.

### 4.1 Poço Ecoante (`cristal_poco`)
| | |
| :--- | :--- |
| **Função** | Primeira descida. Fogueira. Pista da **voz**. |
| **O que conta** | O poço **repete** uma palavra, **cada vez mais clara**: *"...Al...va..."* |
| **Fogueira 6** | **Capa rosa.** *"Ouvi alguém me chamar no poço. Tive medo de responder."* |

### 4.2 Galeria Cintilante (`cristal_galeria`)
| | |
| :--- | :--- |
| **Função** | Corredor de combate: Gosmas **mineiras**, Cogumelos **brincando entre os cristais**. |
| **O que conta** | As **gosmas com lascas de cristal** mostram quem eram. |

### 4.3 Coração de Cristal (`cristal_coracao`)
| | |
| :--- | :--- |
| **Função** | **Prova da Cinza.** Dá as Asas. **Sala de revelações.** |
| **O que o jogador vê** | Um **cristal enorme e rachado, pulsando**: **o coração de Aurora**, frio e dormente. |
| **O que conta** | **A verdade sobre o Sol.** |

**◆ Inscrição (atual):** *"Das cinzas do último pôr do sol nasceram asas. Quem as veste toca o céu duas vezes."*

**✦ As Visões do Cristal** (cenas curtas que o herói **vê** ao tocar os cristais; cada uma é uma tela com 3-4 linhas, sem som, só a *Cantiga*):

1. **O Cortejo.** *Uma procissão atravessa uma ponte com doze estátuas. No meio, uma criança de manto azul e máscara de marfim segura a mão de um velho de barba cinzenta.*
2. **A Subida.** *Uma escadaria interna, cheia de mãos de escaladores. A criança sobe devagar e olha para trás, procurando alguém. Não acha.*
3. **A Coroa.** *Um trono. Uma coroa dourada pousa na cabeça da criança. Os olhos dela se acendem. Ela não grita: pergunta baixinho, "dói assim mesmo?"*
4. **A Mãe.** *Uma mulher de cabelos molhados irrompe pela porta. Fala. O velho a olha. O velho solta a Coroa. A Coroa se parte em três.*
5. **O Pôr do Sol.** *O sol, em forma de uma mulher gigante e luminosa, abre os olhos, olhos de duas cores. E olha, por um instante, para a criança caída. E não reconhece. E fecha os olhos, cansada.*

> A Visão 5 é a **que quebra o jogador**: *Aurora olhou, não reconheceu, e voltou a esperar.*

---

## REGIÃO 5: Os Jardins Submersos
*"onde a maré guarda segredos"*

**O que foi:** os **Jardins da Rainha**, na superfície, onde Ondina passava as tardes com Alva. Afundaram devagar quando a Marinheira passou a usar o mar para **segurar o esquecimento**.
**O que é agora:** um **recife luminoso**, repleto de algas, lanternas e peixes.
**O que o jogador sente:** **ternura**, não medo.

### 5.1 Poço das Marés (`jardins_poco`)
| | |
| :--- | :--- |
| **Função** | **Transição.** Primeira água. |
| **O que conta** | O poço é **o caminho que Ondina abriu para a voz subir**. |

### 5.2 Recife das Lanternas (`jardins_recife`)
| | |
| :--- | :--- |
| **Função** | Exploração aquática. **Amuleto: Vento Longo.** |
| **O que foi** | O **memorial** de Alva: Ondina pendurou, uma a uma, **as lanternas das lembranças que os peixes trouxeram**. |
| **O que o jogador vê** | **Centenas de lanternas** de cores quentes. Em cada uma, um **instante de Alva criança** (se o jogador tocar, ela pisca uma imagem de um segundo: uma brincadeira, um tombo, uma risada). |
| **Amuleto (Vento Longo)** | Uma **fita** do hem do Manto que Ondina guardou. |
| **Segredo** | O **teto** esconde a **Prova das Lâminas**. |

### 5.3 Templo da Maré (`jardins_templo`)
| | |
| :--- | :--- |
| **Função** | **Arena de Ondina.** Fogueira. |
| **O que foi** | O templo onde o Sol *dormia* todas as noites. A cama de luz do Sol. |
| **O que o jogador vê** | Uma **cúpula quebrada** por onde a luz de Vésper **entra em feixes**. **Uma cama enorme de coral vazia** (a cama do Sol). Ao fundo, **uma câmara pequena, fechada**. |
| **Fogueira 7** | **Capa bege.** *"Cheguei até a Rainha. Ela chorou ao me ver e eu não soube consolá-la."* |
| **Câmara de coral** | Onde está **o corpo de Alva**. Só abre **depois** da luta e da escolha. |

### 5.4 Prova das Lâminas (`desafio_espinhos`) · secreta
| | |
| :--- | :--- |
| **Função** | **O esconderijo de Alva criança.** Amuleto: **Lâmina Rápida**. |
| **O que conta** | **Alva inventou esta prova** para impressionar Brandão. É **um parquinho perigoso**. |
| **O que o jogador vê** | **Giz** nas paredes (setas, "COMEÇO", "FIM"), **um boneco de pau** pendurado, **uma medalha de madeira** onde está o amuleto. |

**✦ Placa de madeira torta, no início:**
> *PROVA DO ALVA*
> *Quem passar em 18 segundos ganha uma medalha.*
> *(O Brandão fez em 19.)*

---

## Mapa das Sete Fogueiras e das Sete Capas

Hoje o jogo tem **5 fogueiras fixas**. A história pede **7** (e uma 8ª, a do Lar).

| # | Fogueira | Capa | Existe? |
| :-: | :--- | :--- | :-: |
| 1 | Abrigo dos Andarilhos | Vermelha | ✔ |
| 2 | Raízes Profundas | Verde | **adicionar** |
| 3 | Santuário do Vento | Roxa | ✔ |
| 4 | Galeria dos Escaladores | Laranja | ✔ |
| 5 | Pico das Nuvens | Preta | **adicionar** |
| 6 | Poço Ecoante | Rosa | ✔ |
| 7 | Templo da Maré | Bege | ✔ |
| **8** | **O Lar (a que o jogador constrói)** | **A sua** | construível |

**Regra do final:** acender (descansar em) as sete lembra os sete antecessores. **A oitava é a sua escolha.**

---

## As Marcas do "A" (colecionáveis de história)

Um **"A" minúsculo, entalhado**, escondido perto de cada **Cristal de Vida** e em alguns lugares-chave:

| Onde | O que conta |
| :--- | :--- |
| Orla das Lanternas (Cristal) | Alva subia nas árvores aqui. |
| Pico das Nuvens (Cristal) | Alva ia sentar nas nuvens quando estava triste. |
| Coração de Cristal (Cristal) | Alva achou que o cristal era *"o sol dormindo"*. |
| Recife das Lanternas | Alva nadava aqui com Ondina. |
| Prova das Lâminas | O **A** maior, em giz, na porta. |
| Planície do Lar | **Um A** na pedra da fundação: o primeiro. |

**Efeito no jogo (opcional):** quando o herói passa perto de um A, **a mão dele treme** (animação sutil). Quem notar, nota.
