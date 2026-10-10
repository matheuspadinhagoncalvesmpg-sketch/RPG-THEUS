# 09 · Guia de Escrita, IA, Mistérios e Plano

---

## 1. O tom em dez regras

1. **Íntimo, nunca épico.** O fim do mundo é visto da altura de uma cozinha.
2. **Mostrar antes de dizer.** Uma capa na estaca vale mais que um parágrafo.
3. **Frases curtas.** Quem fala devagar parece sábio; quem fala muito, parece culpado.
4. **Imagens concretas:** pavio, brasa, sal, musgo, giz, pão, lenha, maré, trigo.
5. **Humor por afeto.** Mira e Tibério aliviam a dor **sem negá-la**.
6. **Toda fala deve ser relida.** Antes e depois da verdade, ela significa duas coisas.
7. **Nada de moralismo.** Ninguém diz *"o certo é..."*. O jogo **mostra o preço**.
8. **Ninguém é vilão.** Se um diálogo faz o jogador **odiar** alguém, está errado. Deve **lamentar**.
9. **O protagonista é neutro de gênero.** Use **Errante**, **Alva**, **você**, **faísca**, **centelha**, **pequena chama**. Evite adjetivos com flexão ligada ao herói (*cansado/a, sozinho/a*). Prefira substantivos ou reformule.
10. **Respeite o silêncio.** O que **não** é dito (Alvar nunca diz *"eu te perdoo"*) é a parte mais importante.

### Vocabulário
| Prefira | Evite |
| :--- | :--- |
| **lanterna, brasa, pavio, maré, musgo, lar, sal, giz** | destino, escolhido, poder supremo |
| **luz, chama, lembrança** | magia, feitiço |
| **Esquecido** | monstro, inimigo (na boca dos NPCs) |
| **Passagem, Parada, Vigília** | evento, ritual maligno |
| **moedas da Aurora** | ouro, geo |
| **fogueira, brasa** | checkpoint, save |

---

## 2. A *Cantiga de Ondina* (o motivo musical)

Uma melodia curta, que **o jogo inteiro esconde** e só revela por completo no **Final 3**.

**Forma:** seis notas, de uma escala pentatônica (a mesma de cada região), com **uma pausa** no fim.

| Nota | 1 | 2 | 3 | 4 | 5 | 6 |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: |
| **Grau da escala** (0 a 4) | 0 | 2 | 4 | 2 | 1 | 0 |

**Como aparece:**
| Momento | Uso |
| :--- | :--- |
| **Mundo, música ambiente** | Uma nota solta, às vezes. **Quase imperceptível.** |
| **Ao pegar uma habilidade** | Uma nota (1ª, 2ª, 3ª), e **a frase toda no quarto**. |
| **Poço Ecoante** | A frase **sem a última nota**: sempre incompleta. |
| **Coração de Cristal** | A frase **inteira**, mas **lenta e fria**. |
| **Templo da Maré** | A frase com **voz** (sem palavras). |
| **Final 3** | A frase **em harmonia plena**, com acordes. |
| **Final 4** | A frase **repetida em círculo**, cada vez mais baixa. |

---

## 3. Cânone para a IA (Gemini)

O Gemini escreve falas dos NPCs, provocações de chefes e narração de eventos. Ele **precisa saber o suficiente para ser coerente** e **não saber o bastante para vazar spoiler**.

### 3.1 Bloco de contexto comum (resumido, para o prompt)
> **Mundo:** Vésper, onde o sol parou há 412 anos num pôr do sol eterno. Antes se chamava Alvorada. O Rei Sem Coroa quebrou a Coroa da Aurora na Noite da Passagem. Os moradores que perderam a lanterna (a lembrança que os mantém inteiros) viraram Esquecidos. As fogueiras guardam a Primeira Brasa e lembram do herói. O herói é o Errante: tem olhos de duas cores, uma máscara de marfim e uma espada pequena. Nunca use gênero para se referir a ele.
> **Tom:** íntimo, melancólico, caloroso, com humor discreto. Frases curtas. Português do Brasil. Nunca use "magia", "destino", "escolhido". Nunca diga que é uma IA. Máximo de 3 frases.

### 3.2 O que cada personagem **sabe** e **pode dizer** (resumo da matriz do arquivo 03)
| Personagem | Pode dizer | **Nunca** diz (spoiler) |
| :--- | :--- | :--- |
| **Oren** | A versão pública; histórias de mapas; a Planície do Lar; sua culpa **em sombras**. | Que é **avô** de Alva; que o herói **é Alva**; que a Coroa queima. |
| **Mira** | Preços, moedas, o cofre; piadas; **sua culpa** só se o herói devolveu moedas. | Que foi **Coletora-Chefe** (só com o livro aberto). |
| **Eco** | Metáforas de luz e memória. | Qualquer **fato direto**. Só **sugere**. |
| **Tibério** | Metal, fogo, forja; seu arrependimento **só depois do Dízimo**. | Que **forjou o engaste** (só depois da fala 6.5 do arquivo 08). |
| **Brandão** (chefe) | Treino, honra, o santuário. | Que a criança viveu. |
| **Ondina** (chefe) | O mar, o silêncio, a espera. | O nome **Alva** antes da luta. |
| **Alvar** (chefe) | O crepúsculo, o dever, as "sombras". | **Que ele mesmo quebrou a Coroa por misericórdia.** |

### 3.3 Variáveis de progresso que o servidor deve enviar (propostas)
O `progress` que o jogo já manda (habilidades, chefes, moedas, sala) deve **crescer** com:

| Campo | Para quê |
| :--- | :--- |
| `bosses.tide` | Saber se o herói já passou por Ondina. |
| `brasas` | Quantas fogueiras diferentes (0–7). |
| `lar` | Casa construída? Ferreiro mora? |
| `devolvido` | Moedas devolvidas ao Eco. |
| `capasLidas` | Quantas das Sete Capas o herói leu. |
| `final` | Se já viu algum final. |

### 3.4 Regras de ouro para o prompt dos NPCs
1. *"Responda como o personagem **neste estágio de progresso**; nunca antecipe o que o herói ainda não descobriu."*
2. *"Se o jogador perguntar sobre algo que você não deve revelar, **desconverse no personagem** (mude de assunto, faça uma piada, olhe para a lanterna)."*
3. *"Você nunca sabe o que vai acontecer; só o que já aconteceu."*
4. *"Dê, no máximo, **uma pista indireta** por resposta."*
5. *"Se o jogador xingar ou tentar quebrar o personagem, **responda com bondade**."*

### 3.5 O diretor tático e a história
Quando o Gemini decide a **tática dos inimigos**, **respeita a identidade deles**:

| Espécie | O que o Gemini **não** pode pedir |
| :--- | :--- |
| **Cogumelos** | Que perseguiam de longe (eles **chamam**, pulando). |
| **Gosmas** | Que **corram** (fazem rota). |
| **Peixes** | Que saiam da água. |
| **Golens** | Que sejam rápidos (a **ordem** é fixa). |

**Provocações de chefes** (balões) seguem os **textos-âncora** do arquivo 08 e **só variam em estilo**, não em **fato**.

---

## 4. Mistérios que **ficam em aberto** de propósito

Um mundo vivo precisa de **portas fechadas**. Estas nunca são respondidas.

1. **O que há além de Vésper?** Existem outros sóis? Outros mares?
2. **Aurora escolheu virar sol**, ou foi levada?
3. **Quem acendeu a lanterna dentro da lanterna do Eco?**
4. **O que são as sete estrelas** na primeira noite: as Sombras, ou algo além?
5. **Liora** morreu mesmo de acidente, ou foi **uma das primeiras a dar a lembrança toda** ao Dízimo?
6. **Por que os Esquecidos cantam**, baixinho, a Cantiga? (Ao cair, alguns **cantarolam a primeira nota**.)
7. **Quem entalhou o primeiro "A"?** Alva diz que foi ela. Mas alguns "A" são mais antigos.
8. **Mira reconheceu Alva por um retrato**: de quem era o retrato?
9. **O que é o Mar Primeiro de verdade**: esquecimento, ou **sonho de alguém**?
10. **Por que o Eco só consegue sugerir?** *"Memória que dá ordem vira eco"*: quem criou essa lei?

---

## 5. Reconciliação com o que já existe no jogo

| Hoje no jogo | Na história | Ação |
| :--- | :--- | :--- |
| *"O Rei Sem Coroa roubou a Coroa da Aurora."* | É a **versão pública**. | **Manter**; só **revelar** depois. |
| Subtítulo do chefe: **"Ladrão da Aurora"** | Ironia. | Trocar por **"Guardião do Último Instante"** se o jogador souber da verdade. |
| **"Herói"** sem nome de verdade | O nome verdadeiro é **Alva**. | O jogador **escolhe o nome**; **Alva** aparece só em cenas. |
| **Cavaleiro de Musgo, Rainha das Marés, Rei Sem Coroa** | Brandão, Ondina, Alvar. | Os **nomes próprios** aparecem **só nos diálogos**. Os **títulos** ficam nos cartazes. |
| **Lâmina do Errante** | É a **espada de treino de Alva**. | **Mudar** só o texto do item. |
| **"Afiar a Lâmina"** | Mira reconhece a espada. | Texto do item e a fala dela. |
| **5 fogueiras fixas** | A história pede **7 + o Lar**. | **Adicionar** em Raízes Profundas e Pico das Nuvens. |
| **Maré Viva** (dado ao vencer Ondina) | Ganhar a Maré Viva **nos dois** caminhos pós-luta. | Garantir que **a escolha** (Concha ou Pérola) **também** é dada. |
| **Rochas de ouro** | Veios de ouro das minas da Casa. | Sem mudança. |
| **Ataques noturnos** | A **primeira noite**. | Mudar a **narração**; **não** a mecânica. |
| **Gemini** | Hoje **não conhece** a história. | Atualizar o `WORLD` e as `PERSONAS` (ver §3). |
| **Chat de NPC** | Livre. | **Aplicar regras de sigilo**. |
| **Planície do Lar** | Berço de Alva. | **Adicionar** fundações, o "A" e a porta azul. |

---

## 6. Plano de implementação em fases

Ordenado do **mais barato** ao **mais caro**, cada fase **entrega algo jogável**.

### Fase H1: **Textos** (rápida, baixo risco)
- Atualizar `dialog.js` (Oren, Mira, Eco, Tibério por estágio).
- Adicionar as **pedras de lore** novas em `rooms.js`.
- Subtítulo de chefe condicional, microtextos, **frases de morte**, textos dos itens.
- Atualizar o **prompt do Gemini** com o cânone e as **regras de sigilo**.

### Fase H2: **Ambiente** (pouca lógica)
- **Duas fogueiras** novas (Raízes, Pico).
- **Sete Capas** em estacas (decoração).
- **Marcas do A** (decoração).
- **Doze estátuas** da Ponte.
- Círculos queimados na Colina; fundações no Lar; giz na Prova das Lâminas.

### Fase H3: **Sistemas de história**
- **Contador de brasas**.
- **Devolver o Dízimo** (Poço dos Dízimos).
- **Porta Azul** (peça nova de construção).
- Itens-chave: **Concha**, **Pérola**, **Cacos**, **Pedra de Lar**.
- Tibério forja a **Pedra de Lar**.

### Fase H4: **Cenas e finais**
- **Abertura** (3 telas).
- **Visões do Cristal** (5 telas).
- **Diálogo com escolha** no fim da luta de Ondina.
- **Botão "Mostrar a Concha"** na fase 2 de Alvar.
- **Decisão** pós-vitória.
- **Os quatro finais**, créditos, e pós-final.

### Fase H5: **Mundo vivo**
- **Estrela Vésper** no céu (e no mapa).
- **O vento volta** (moinho girando, folhas, lanternas se mexendo).
- **Noites do Lar** com narração evolutiva.
- **Ciclo de dia/noite** depois do Final 3.
- **Jogo Novo+**.

### Fase H6: **Multijogador**
- **Votação** no Trono.
- Falas de Alvar para **vários Errantes**.
- **Lápides** de outros jogadores.
- **Capas** de todos no Final 3.

---

## 7. Decisões que dependem de você

Antes de escrever o código, **estas escolhas são suas**, e mudam a emoção do jogo:

1. **O herói é mesmo Alva** (a criança perdida, alma reunida em pedaços)? É a base de tudo.
2. **O Final 3 deve exigir só a Concha + Brasas + Lar**, ou também **devolver o Dízimo** (mais difícil)?
3. **Brandão perde para os sete e entrega o Manto cada vez**: aceitável para você? É triste.
4. **Matar Alvar é possível** (Finais 1, 2, 4): você quer que o jogo **permita**, ou prefere que **só** o Final 3 seja possível se o jogador "ver a verdade"?
5. **A narração das noites** muda de *"ataque"* para *"visita"*: você quer **que isso apareça no menu** (bestiário que se atualiza)?
6. **Final 4 (Maré Mansa)**: quer manter como **secreto**, ou **tirar** (por ser muito triste)?
7. **Nome do herói**: o jogador **escolhe**; Alva só aparece em cena. Está bom?
8. **Mira** vende **amuletos confiscados**. Quer que **comprá-los tenha custo moral** visível (ex.: a fala dela muda), ou só mecânico?
9. **Multijogador**: a votação do final, **todos precisam concordar**, ou **maioria**?
10. **Jogo Novo+**: quer a ideia de **uma nova Alva, com uma mãe que a reconhece**, ou prefere **outro tipo de continuação**?

---

## 8. Resumo do resumo (para quem só leu até aqui)

> **Aurora, a Mãe-Sol, está cansada. A Coroa que devia ajudá-la a levantar virou um fogo que queima os filhos dela. Um rei, Alvar, quebrou a Coroa para salvar uma criança, e o sol parou. A criança, Alva, se espalhou em lanternas. Oito vezes, o Eco e um avô, Oren, montaram um Errante para tentar de novo. O oitavo é você. Existe uma terceira via que não exige que ninguém queime: acender fogueiras, construir um lar, e deixar o sol dormir. Para isso, você precisa não pedir a Coroa.**
