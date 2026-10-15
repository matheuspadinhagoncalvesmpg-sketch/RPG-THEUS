# THEUS: Ecos de Vésper

Um metroidvania 2D com exploração no estilo **Hollow Knight** e coleta, baús e trocas no estilo **Terraria**, feito em JavaScript puro com canvas e pensado primeiro para **jogar no celular** (e também no PC, com teclado ou controle).

> Em Vésper o sol parou no crepúsculo. O Rei Sem Coroa roubou a Coroa da Aurora, e só um Errante, com um olho da cor do ocaso e outro da aurora, pode devolver o dia ao reino.

---

## ▶️ Como jogar

```bash
npm start
```
Abra **http://localhost:3000**. Para jogar no celular na mesma rede Wi-Fi, acesse `http://SEU-IP:3000`.

Também funciona em qualquer hospedagem estática (veja [HOSTINGER_DEPLOY.md](HOSTINGER_DEPLOY.md)) e pode ser **instalado como app** (PWA) pelo menu "Adicionar à tela inicial". Depois da primeira visita, roda offline.

### Controles

| Ação | Celular | Teclado | Controle |
| :--- | :--- | :--- | :--- |
| Mover / olhar | Joystick (lado esquerdo, aparece onde você tocar) | ← → ↑ ↓ ou WASD | Analógico / D-pad |
| Pular (segure para pular mais alto) | ▲ | Espaço, Z ou K | A |
| Atacar (↑ ou ↓ + ataque mira para cima/baixo) | ⚔ | **clique esquerdo** (mira no cursor), X ou J | X |
| Dash | » | C, Shift ou L | RB / RT |
| ALMA: segure para **curar**, toque para **magia** | ✦ | **clique direito**, V ou F | B |
| Falar / descansar / ler | ↑ ou botão que aparece | ↑ ou E | Y |
| Mapa | botão no topo | M ou Tab | Select |
| Pausa | botão no topo | Esc ou P | Start |

O jogo tem um **Manual dos controles** completo na pausa e na tela inicial. No celular dá para **deslizar o dedo** de um botão para outro (por exemplo, do pulo para o ataque). Tamanho e transparência dos botões, vibração e som ficam em **Pausa → opções**.

---

## 🗺️ O mundo

66 salas conectadas (mais 14 câmaras secretas), em 5 regiões, com mapa automático:

- **Planície do Lar**: a oeste do início, onde ficava a casa de porta azul do velho Oren.
- **Campos do Crepúsculo**: colinas sob um pôr do sol eterno. Abrigo com banco, Oren o andarilho e Mira a mercadora.
- **Bosque das Lanternas**: floresta escura e cheia de vaga-lumes. Esconde um segredo atrás de uma parede.
- **Ruínas Suspensas**: ilhas flutuando entre as nuvens, uma torre para escalar e o trono do Rei.
- **Cavernas de Cristal**: chega-se por um chão rachado no Abrigo (golpeie para baixo...).
- **Jardins Submersos**: um poço no Coração de Cristal desce a recifes inundados, com algas, bolhas, peixes-lanterna e o Templo da Maré. Dentro d'água o herói flutua e nada; perto da superfície o pulo vira um salto para fora.

### Coleta e trocas (estilo Terraria)
- Golpeie **árvores, rochas, veios de minério e cristais** para coletar **madeira, pedra, minério e cristal**. Eles voltam quando você descansa numa fogueira.
- Não há construção: os materiais são **moeda de troca**, mas cada NPC só aceita o que precisa. O Brum (mineiro) tem pedra de sobra e quer cristal e madeira; o Tomé quer cristal e madeira; a Selene, pedra e minério; a Nami, madeira e minério; o Oren, madeira e pedra; a Mira aceita tudo, mas paga pouco. Na loja, troque a *forma de pagamento* e veja o que ela aceita.
- A Lanterna, as espadas de Minério e de Cristal e as armaduras são vendidas pelos NPCs (e também achadas em baús).

### Combate e exploração
- Pulo com altura variável, *coyote time* e *buffer* de pulo.
- Golpe para os lados, para cima e para baixo, com **quique (pogo)** em inimigos e espinhos.
- **ALMA**: cada golpe acerta e enche o vaso; segure para curar uma máscara.
- **Fogueiras** salvam o jogo e restauram a vida.
- Ao morrer, você deixa uma **lápide** com todas as moedas. Volte até ela para recuperar.
- Habilidades que abrem caminhos novos: **Manto do Vento** (dash), **Garras de Pedra** (escalar paredes), **Asas de Cinza** (pulo duplo) e **Chama da Alma** (magia).
- Chefes: **Cavaleiro de Musgo**, **Rainha das Marés** (opcional, nos Jardins) e **O Rei Sem Coroa**, cada um com segunda fase.
- **Amuletos** (Pausa → Amuletos): equipe até 3, trocando só ao descansar numa fogueira. Alma Faminta, Vento Longo, Ímã de Moedas, Pele de Pedra, Lâmina Rápida e Maré Viva. Estão escondidos, são prêmio de chefe, são vendidos pela Mira ou valem um **desafio cronometrado**.
- **Segredo**: no recife, o teto esconde uma sala com a Prova das Lâminas. Pise no selo dourado e alcance o amuleto antes do tempo acabar.
- Loja, cristais de vida escondidos, paredes e chãos quebráveis, veios de ouro.
- Inimigos: gosmas, cogumelos saltitantes, morcegos de brasa, flores carnívoras e golens de pedra.

---

### Armas, baús e inventário (estilo Terraria)
O herói começa com a Lâmina do Errante e acha outras armas em **baús de tesouro** espalhados pelo mundo ou as compra dos NPCs: Adaga de Osso (rápida), Lança do Caçador (alcance longo), Machado de Pedra (pesado), Espada de Minério, Espada de Cristal, **Arco do Caçador** (flechas) e **Cajado da Névoa** (orbes). Cada arma tem raridade, dano e recarga próprios. Abra o **Inventário** com **Q** (ou pelo botão da mochila no celular) para equipar armas, ver armadura, materiais e itens. Os baús também dão moedas, materiais e armaduras.

### Mundo vivo (regras do mapa)
- **Zonas seguras:** perto de cada fogueira não aparecem monstros.
- **Respawn pelo descanso:** monstros e recursos só voltam ao sentar numa fogueira (no multijogador, o descanso de um renova para todos).
- **Fragmentos de Vida:** cinco fragmentos = um coração; cristais, mini-chefes, Soberanos e Memórias dão fragmentos.
- **Baús com horda:** tocar num baú de tesouro chama 2 ou 3 ondas de monstros da região (a última com um capitão); o baú só abre depois da última onda. Sair da sala ou morrer cancela a prova. Há bem menos baús, e seis deles ficam em câmaras secretas. Os **Baús de Memória**, nas salas de chefe e mini-chefe, só abrem quando o chefe cai (inimigos comuns não contam).
- **Câmaras secretas:** 14 câmaras escondidas atrás de paredes quebráveis (golpeie as paredes de beco) guardam Memórias; não aparecem nem no mapa comprado até serem visitadas.
- **Os Soberanos:** cinco salões nas Ruínas com chefes que são os reis e rainhas antigos presos pelo Regente; Eliar luta no Trono antes de Alvar. Cada Soberano tem uma mecânica própria: **Dalva** canta (invulnerável cantando, exposta no silêncio), **Rúben** marca dívidas explosivas no chão, **Lídia** chama a Guarda e fica protegida enquanto ela viver, **Marta** deixa reflexos que repetem o ataque e **Sibila** varre o salão com o Olhar. Cada alma libertada enfraquece Alvar. Ver `docs/historia/10-revisao-reis-e-reinos.md`.
- **Memórias e cenas:** 62 Memórias, guardadas em baús de chefe, câmaras secretas e achados pelo mapa. A história vem em diários, cartas, ecos, inscrições e afrescos (Diário do Errante no menu) e em cenas nos momentos de reviravolta.
- **NPCs com lojas:** Tomé, Selene, Brum e Nami vendem os itens achados no mapa; Oren, Tomé e Nami andam pela região.
- **IA:** só controla chefes, eventos raros e a conversa dos NPCs; inimigos comuns têm regras fixas (sincroniza melhor no multijogador).
- Plano completo do mapa: `docs/PLANO_DO_MAPA.md`.

### Asas de Seda e inimigos regionais
O novo mini-chefe **Mariposa Rainha** (Covil acima do Ninho Alto, no Bosque) concede as **Asas de Seda**: segure o pulo no ar para planar e atravessar abismos largos, como o **Vendaval**, que leva ao **Olho da Tempestade**. Cada região também ganhou um inimigo próprio: Mariposa Lanterneira (Bosque), Espinhudo (Campos), Atirador de Cristal (Cristal), Fantasma (Ruínas) e Água-viva (Jardins).

### Viagem rápida
Descansando numa fogueira, o menu de pausa mostra **Viajar entre fogueiras**: escolha qualquer fogueira onde você já descansou e chegue sentado nela.

### Mapas do Oren
O Oren desenha mapas por região (Campos 40, Bosque 90, Ruínas 140, Cristal 110, Jardins 130 moedas). Comprado o mapa, o desenho de todas as salas da região aparece (esmaecido) no mapa; as salas já visitadas ficam em destaque.

### Mini-chefes
Quatro câmaras opcionais (Gruta Sob as Raízes → Covil do Besouro-Rei, Veio de Cristal → Geodo do Golem, Mirante dos Ventos → Ninho da Vespa Rainha, Gruta das Marés → Covil da Lampreia). Cada mini-chefe dá um **Fragmento de Vida** (+1 coração). A fogueira fica sempre *antes* da arena, nunca dentro dela.

### Invasões (eventos raros, estilo Terraria)
De tempos em tempos (a cada ~8–13 min de jogo, depois de vencer o Cavaleiro de Musgo) uma horda temática ataca a região onde você está: Horda de Gosmas (Campos), Enxame das Lanternas (Bosque), Marcha dos Golems (Ruínas), Procissão de Cacos (Cristal) e Cardume Faminto (Jardins). Há aviso, barra de progresso no topo, ondas contínuas e, no fim, um **capitão** com aura dourada. Vencer dá moedas e materiais; morrer ou sair da região dispersa a horda. A IA (Gemini) só decide *se é a hora*, o título, a frase de aviso e a força (0,8–1,4×); sem IA, um sorteio local faz o mesmo. No multijogador o anfitrião comanda e todos veem a barra.

### Testes do mundo
```bash
node tools/check-world.mjs      # salas sobrepostas e aberturas sem saída
node tools/check-entities.mjs   # entidades dentro de blocos/flutuando, arenas sem portão
node tools/reach.mjs            # usa a física REAL do herói para achar lugares inalcançáveis e armadilhas sem volta
node tools/reach.mjs --margem=0.9 --estrito   # estrito: só vale voltar à fogueira do Abrigo
```

## 🌐 Multijogador e nuvem

- Em **Multijogador e nuvem** (tela inicial ou pausa), crie um **mundo** e passe o código de 5 letras, ou entre no mundo de alguém (até 6 jogadores).
- Todos se veem na mesma sala, com animações, espada, armadura e nome. Monstros e chefes são os mesmos para todos: o primeiro jogador da sala simula e os outros acompanham e acertam os mesmos inimigos. Se ele sair, outro assume.
- Habilidades, materiais e moedas são de cada um; o mundo (monstros, chefes e descansos) é o mesmo para todos.
- Tem **chat** (botão de balão ou tecla T).
- **Salvar na nuvem**: cada aparelho tem um código de 10 letras. Digite-o em outro aparelho para continuar de onde parou.
- Conexão por WebSocket, com reserva automática por HTTP. Mundos e saves ficam na pasta `data/` do servidor (fora do Git).

---

## 🧠 IA Gemini

Com a variável `GEMINI_API_KEY` no servidor (veja `.env.example`):
- **Personagens vivos**: depois das falas, você conversa em texto livre com Oren, Mira e o Eco. Eles respondem no personagem, sabendo do seu progresso, e dão dicas do próximo passo.
- **Diretor tático dos inimigos**: a cada poucos segundos o Gemini analisa como você joga (vida, mortes na sala, se usa pogo, dash, distância) e define a estratégia da sala: agressividade, velocidade, intervalo entre ataques e tática (*enxame*, *flanco*, *distância*, *emboscada*). Também escolhe quais ataques os chefes priorizam e escreve as provocações deles.
- O movimento quadro a quadro continua local (a IA leva cerca de 1 s para responder). Sem chave ou sem internet, um diretor local faz o mesmo papel com regras fixas.

---

## 📖 A história

A história completa (mundo, mitologia, personagens, chefes, monstros, finais e textos prontos) está na **bíblia da história**, em [`docs/historia/`](docs/historia/README.md). A pasta contém spoilers e **não é servida pelo site**.

---

## 🧩 Estrutura do código

```
index.html        telas e interface
style.css         visual e layout (adaptado a celular, com safe-area)
sw.js             cache offline (PWA)
server.js         servidor (arquivos + rotas da IA), sem dependências
ai_server.js      integração com o Gemini (chave só no servidor)
mp_server.js      multijogador (WebSocket sem dependências + HTTP) e nuvem
src/
  main.js         título, criação do herói, opções
  game.js         núcleo: salas, transições, combate, câmera
  player.js       física e ações do herói
  enemies.js      inimigos comuns e projéteis
  bosses.js       chefes
  crafting.js     inventário, lojas (moedas ou materiais), diário e viagem
  lojas.js        o que cada NPC vende
  segredos.js     câmaras secretas e baús de chefe com Memórias
  hordas.js       ondas de monstros que abrem os baús de tesouro
  entities.js     fogueiras, personagens, recursos, moedas, lápide
  rooms.js        mapa do mundo (editável)
  world.js        grade de blocos e conexão entre salas
  physics.js      colisão
  render.js       fundo em paralaxe, blocos, luz
  art.js          desenho vetorial do herói e objetos
  ai.js           diretor tático e conversa com personagens (cliente)
  net.js          multijogador no cliente
  cloud.js        salvar na nuvem
  input.js        teclado, controle e toque multitoque
  audio.js        efeitos e música sintetizados
  ui.js           HUD, diálogos, mapa, loja
  dialog.js       falas e itens da loja
  save.js         salvamento local
tools/check-world.mjs   valida as conexões entre as salas (npm run check)
tools/mp-bot.mjs        jogador-robô para testar o multijogador
```

Para criar ou editar salas, mexa em `src/rooms.js` e rode `npm run check` para conferir se as aberturas entre salas batem.
