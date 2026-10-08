# THEUS: Ecos de Vésper

Um metroidvania 2D inspirado em **Hollow Knight**, feito em JavaScript puro com canvas e pensado primeiro para **jogar no celular** (e também no PC, com teclado ou controle).

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
| Atacar (↑ ou ↓ + ataque mira para cima/baixo) | ⚔ | X ou J | X |
| Dash | » | C, Shift ou L | RB / RT |
| ALMA: segure para **curar**, toque para **magia** | ✦ | V ou F | B |
| Falar / descansar / ler | ↑ ou botão que aparece | ↑ ou E | Y |
| Mapa | botão no topo | M ou Tab | Select |
| Pausa | botão no topo | Esc ou P | Start |

No celular dá para **deslizar o dedo** de um botão para outro (por exemplo, do pulo para o ataque). Tamanho e transparência dos botões, vibração e som ficam em **Pausa → opções**.

---

## 🗺️ O mundo

15 salas conectadas, em 4 regiões, com mapa automático:

- **Campos do Crepúsculo**: colinas sob um pôr do sol eterno. Abrigo com banco, Oren o andarilho e Mira a mercadora.
- **Bosque das Lanternas**: floresta escura e cheia de vaga-lumes. Esconde um segredo atrás de uma parede.
- **Ruínas Suspensas**: ilhas flutuando entre as nuvens, uma torre para escalar e o trono do Rei.
- **Cavernas de Cristal**: chega-se por um chão rachado no Abrigo (golpeie para baixo...).

### Mecânicas no estilo Hollow Knight
- Pulo com altura variável, *coyote time* e *buffer* de pulo.
- Golpe para os lados, para cima e para baixo, com **quique (pogo)** em inimigos e espinhos.
- **ALMA**: cada golpe acerta e enche o vaso; segure para curar uma máscara.
- **Bancos** salvam o jogo e restauram a vida.
- Ao morrer, você deixa sua **sombra** com todo o geo. Volte até ela para recuperar.
- Habilidades que abrem caminhos novos: **Manto do Vento** (dash), **Garras de Pedra** (escalar paredes), **Asas de Cinza** (pulo duplo) e **Chama da Alma** (magia).
- Chefes: **Cavaleiro de Musgo** e **O Rei Sem Coroa**, cada um com segunda fase.
- Loja, vasos de vida escondidos, paredes e chãos quebráveis, rochas de geo.

---

## 🧩 Estrutura do código

```
index.html        telas e interface
style.css         visual e layout (adaptado a celular, com safe-area)
sw.js             cache offline (PWA)
server.js         servidor estático simples (sem dependências)
src/
  main.js         título, criação do herói, opções
  game.js         núcleo: salas, transições, combate, câmera
  player.js       física e ações do herói
  enemies.js      inimigos comuns e projéteis
  bosses.js       chefes
  entities.js     bancos, personagens, itens, geo, sombra
  rooms.js        mapa do mundo (editável)
  world.js        grade de blocos e conexão entre salas
  physics.js      colisão
  render.js       fundo em paralaxe, blocos, luz
  art.js          desenho vetorial do herói e objetos
  input.js        teclado, controle e toque multitoque
  audio.js        efeitos e música sintetizados
  ui.js           HUD, diálogos, mapa, loja
  dialog.js       falas e itens da loja
  save.js         salvamento local
tools/check-world.mjs   valida as conexões entre as salas (npm run check)
```

Para criar ou editar salas, mexa em `src/rooms.js` e rode `npm run check` para conferir se as aberturas entre salas batem.
