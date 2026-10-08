# 🌟 Hora da Aventura: Crônicas de Ooo (RPG Pixel)

Um RPG em estilo pixel art inspirado em **Hora de Aventura**, agora **jogável direto no celular**.

## 📱 Jogar no celular (sem servidor)

O jogo funciona **sozinho no navegador** (modo solo) — basta abrir `index.html` hospedado em qualquer lugar estático (ex.: GitHub Pages). No celular:

1. Abra o link no Chrome (Android) ou Safari (iPhone).
2. Menu do navegador → **Adicionar à tela inicial** (vira um app em tela cheia).
3. Jogue deitado: **joystick flutuante** na metade esquerda da tela, botões de ataque/habilidade/poção/sanduíche na direita, **mira automática** nos monstros, **vibração** ao bater/apanhar.
4. Seu progresso é **salvo sozinho** no aparelho (botão ▶ CONTINUAR na tela inicial).

Se houver um servidor Node rodando (`npm start`), o jogo conecta nele e vira **multiplayer**; se não houver, cai automaticamente no modo solo. Use `?solo` na URL para forçar o modo solo.

## 🆕 Novidades da v2

- 🗺️ **5 biomas**: Colinas de Ooo, Reino Doce, Reino Gelado, Floresta Assombrada e Ruínas dos Esqueletos, com chão, decoração e minimapa próprios.
- 👻 **Novos monstros**: Fantasma da Floresta e Golem de Gelo. Monstros voltam para casa e renascem.
- 📜 **9 missões em sequência** (Princesa Jujuba explica a atual), com recompensa automática.
- 🛒 **Loja do BMO**: poções, sanduíches e melhorias permanentes (ataque, vida, mana).
- 🎁 Itens melhores se equipam sozinhos; os piores viram moedas.
- 🏰 **Dungeon infinita visível**: salas, corredores, portal de saída, portal para o próximo andar (abre ao derrotar o chefe).
- 💨 **Esquiva (dash)** com invulnerabilidade rápida.
- 👑 **Chefes atiram anéis de projéteis** (mais rápidos com menos vida).
- 🌗 **Ciclo dia/noite** com luz ao redor do herói; dungeon com **3 temas** (roxo, fogo, gelo).
- 🧭 Minimapa, limites do mundo, câmera presa ao mapa.
- 💾 Salvamento automático (localStorage).
- 🐞 Corrigido: no multiplayer o XP e o ouro nunca eram concedidos.

## 🕹️ Controles

| Ação | Teclado / Mouse | Celular |
| :--- | :--- | :--- |
| Mover | `WASD` / Setas | Joystick (toque na metade esquerda) |
| Atacar | `Espaço` / clique | ⚔️ (segure para atacar em sequência) |
| Habilidade | `E` / clique direito | 🌀 |
| Esquiva | `Shift` / `R` | 💨 |
| Poção / Sanduíche | `Q` / `F` | 🧪 / 🥪 |
| Falar com NPC / Loja | `T` | botão 💬 Falar (aparece perto de NPCs) |
| Chat | `Enter` | ⌨️ |
| Som / Tela cheia | `M` / ⛶ | 🔊 / ⛶ |

## 🌐 Multiplayer (opcional)

```bash
npm install
npm start      # http://localhost:3000
```
Opcional: `GEMINI_API_KEY` no `.env` para os NPCs conversarem com IA. Veja `HOSTINGER_DEPLOY.md` para hospedar.

---

## 🧙‍♂️ Criação de Personagem

Antes de iniciar sua jornada, você pode personalizar seu herói:
- **Nome do Aventureiro**: Escolha o nome da sua lenda.
- **3 Classes Iniciais**:
  1. ⚔️ **Guerreiro**: Especialista em combate corpo a corpo com a espada heroica, mais vida e defesa, além da habilidade especial *Ataque Furacão* (giro de 360° com dano em área).
  2. 🔮 **Mago**: Mestre das artes místicas, lança projéteis arcanos luminosos e possui a habilidade *Explosão Arcana / Nova Cósmica* devastadora.
  3. 🏹 **Arqueiro**: Rápido e preciso, dispara flechas à distância com alta velocidade e usa a habilidade *Chuva de Flechas* em leque.
- **Customização Visual em Pixel Art**:
  - Cor da roupa/túnica (Azul Clássico, Vermelho Rubro, Verde Floresta, Roxo Místico, Laranja Solar).
  - Cor do chapéu/cabelo (Capuz de Urso Branco estilo Finn, Loiro, Castanho, Azul Gélido, Rosa Chiclete).
  - Tom de pele.
  - Acessórios (Mochila verde de aventura, Capa de herói ou Nenhum).
- **Preview em Tempo Real**: Veja como seu personagem fica em grande escala antes de entrar no mundo!

---

## 🕹️ Controles

| Ação | Tecla / Mouse |
| :--- | :--- |
| **Mover o Herói** | `W`, `A`, `S`, `D` ou `Setas do Teclado` |
| **Atacar / Interagir** | `Barra de Espaço` ou `Clique Esquerdo do Mouse` |
| **Habilidade Especial** | Tecla `E` ou `Clique Direito do Mouse` |
| **Tomar Poção Doce** | Tecla `Q` |
| **Ligar/Desligar Som** | Tecla `M` ou botão `🔊` no topo |
| **Conversar com NPCs** | Aproxime-se e pressione `Espaço` |

---

## 🗺️ O Que Há na Terra de Ooo

- **Casa da Árvore**: O ponto de partida clássico de Finn e Jake.
- **NPCs Amigáveis**: Converse com o **Jake o Cão** e com o **BMO** para receber dicas e diálogos divertidos ("Matemático!").
- **Inimigos**:
  - Slimes de Gelatina Doce saltitantes.
  - Cogumelos Travessos com saltos rápidos.
  - Esqueletos Guardiões nas ruínas.
  - 👑 **O Grande Rei Gelatina Doce** (Chefão com coroa e vida massiva no norte).
- **Baús de Tesouro**: Encontre baús dourados escondidos pelo mapa contendo moedas de ouro e poções extras.
- **Progressão**: Ganhe XP derrotando monstros para subir de nível, aumentar sua vida máxima, mana e ataque!
- **Áudio Sintetizado**: Músicas e efeitos retrô chiptune integrados diretamente via Web Audio API sem necessidade de downloads adicionais.
