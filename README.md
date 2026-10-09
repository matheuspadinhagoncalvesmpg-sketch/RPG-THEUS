# THEUS: Ecos de Vésper

Um metroidvania 2D com exploração no estilo **Hollow Knight** e coleta e construção no estilo **Terraria**, feito em JavaScript puro com canvas e pensado primeiro para **jogar no celular** (e também no PC, com teclado ou controle).

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
| Modo construção | botão de martelo | B | LB |
| Colocar / remover peça | toque no cenário / picareta | clique esquerdo / direito, teclas 1-8 e 0 | — |
| Falar / descansar / ler | ↑ ou botão que aparece | ↑ ou E | Y |
| Mapa | botão no topo | M ou Tab | Select |
| Pausa | botão no topo | Esc ou P | Start |

O jogo tem um **Manual dos controles** completo na pausa e na tela inicial. No celular dá para **deslizar o dedo** de um botão para outro (por exemplo, do pulo para o ataque). Tamanho e transparência dos botões, vibração e som ficam em **Pausa → opções**.

---

## 🗺️ O mundo

16 salas conectadas, em 4 regiões, com mapa automático:

- **Planície do Lar**: terra livre a oeste do início, a principal zona para construir sua base.
- **Campos do Crepúsculo**: colinas sob um pôr do sol eterno. Abrigo com banco, Oren o andarilho e Mira a mercadora.
- **Bosque das Lanternas**: floresta escura e cheia de vaga-lumes. Esconde um segredo atrás de uma parede.
- **Ruínas Suspensas**: ilhas flutuando entre as nuvens, uma torre para escalar e o trono do Rei.
- **Cavernas de Cristal**: chega-se por um chão rachado no Abrigo (golpeie para baixo...).

### Coleta e construção (estilo Terraria)
- Golpeie **árvores, rochas, veios de minério e cristais** para coletar **madeira, pedra, minério e cristal**.
- Em **zonas de construção** (Planície do Lar, Santuário do Vento e Coração de Cristal) aperte **B** ou o martelo e construa: blocos de madeira, pedra e cristal, plataformas, tochas, estandartes, baús e **fogueiras**, que viram seu ponto de descanso e renascimento.
- A picareta (ou o clique direito) remove a peça e devolve os materiais. Tudo fica salvo.
- **Bancada** e **Forja** fabricam Lanterna, espadas (Minério x1,5 e Cristal x2,2) e armaduras de madeira, pedra e cristal (+1 a +3 corações), que aparecem no herói.
- **Baús** guardam materiais.
- Monte uma casa (fogueira, tocha, baú, bancada e 10 blocos) e o ferreiro **Tibério** se muda para a base e passa a vender materiais.
- Com a base habitada, a planície sofre **ataques noturnos** em ondas; defender rende moedas e materiais. O Gemini narra os eventos.

### Combate e exploração
- Pulo com altura variável, *coyote time* e *buffer* de pulo.
- Golpe para os lados, para cima e para baixo, com **quique (pogo)** em inimigos e espinhos.
- **ALMA**: cada golpe acerta e enche o vaso; segure para curar uma máscara.
- **Fogueiras** salvam o jogo e restauram a vida.
- Ao morrer, você deixa uma **lápide** com todas as moedas. Volte até ela para recuperar.
- Habilidades que abrem caminhos novos: **Manto do Vento** (dash), **Garras de Pedra** (escalar paredes), **Asas de Cinza** (pulo duplo) e **Chama da Alma** (magia).
- Chefes: **Cavaleiro de Musgo** e **O Rei Sem Coroa**, cada um com segunda fase.
- Loja, cristais de vida escondidos, paredes e chãos quebráveis, veios de ouro.
- Inimigos: gosmas, cogumelos saltitantes, morcegos de brasa, flores carnívoras e golens de pedra.

---

## 🧠 IA Gemini

Com a variável `GEMINI_API_KEY` no servidor (veja `.env.example`):
- **Personagens vivos**: depois das falas, você conversa em texto livre com Oren, Mira e o Eco. Eles respondem no personagem, sabendo do seu progresso, e dão dicas do próximo passo.
- **Diretor tático dos inimigos**: a cada poucos segundos o Gemini analisa como você joga (vida, mortes na sala, se usa pogo, dash, distância) e define a estratégia da sala: agressividade, velocidade, intervalo entre ataques e tática (*enxame*, *flanco*, *distância*, *emboscada*). Também escolhe quais ataques os chefes priorizam e escreve as provocações deles.
- O movimento quadro a quadro continua local (a IA leva cerca de 1 s para responder). Sem chave ou sem internet, um diretor local faz o mesmo papel com regras fixas.

---

## 🧩 Estrutura do código

```
index.html        telas e interface
style.css         visual e layout (adaptado a celular, com safe-area)
sw.js             cache offline (PWA)
server.js         servidor (arquivos + rotas da IA), sem dependências
ai_server.js      integração com o Gemini (chave só no servidor)
src/
  main.js         título, criação do herói, opções
  game.js         núcleo: salas, transições, combate, câmera
  player.js       física e ações do herói
  enemies.js      inimigos comuns e projéteis
  bosses.js       chefes
  build.js        modo construção (estilo Terraria)
  crafting.js     bancada, forja, baú e loja do ferreiro
  raids.js        ferreiro que se muda e ataques noturnos à base
  entities.js     fogueiras, personagens, recursos, moedas, lápide, construções
  rooms.js        mapa do mundo (editável)
  world.js        grade de blocos e conexão entre salas
  physics.js      colisão
  render.js       fundo em paralaxe, blocos, luz
  art.js          desenho vetorial do herói e objetos
  ai.js           diretor tático e conversa com personagens (cliente)
  input.js        teclado, controle e toque multitoque
  audio.js        efeitos e música sintetizados
  ui.js           HUD, diálogos, mapa, loja
  dialog.js       falas e itens da loja
  save.js         salvamento local
tools/check-world.mjs   valida as conexões entre as salas (npm run check)
```

Para criar ou editar salas, mexa em `src/rooms.js` e rode `npm run check` para conferir se as aberturas entre salas batem.
