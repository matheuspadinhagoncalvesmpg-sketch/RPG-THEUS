# 🌟 Hora da Aventura: Crônicas de Ooo (RPG Pixel)

Um RPG em estilo pixel art vibrante inspirado no universo de **Hora de Aventura** (Adventure Time) na mágica Terra de Ooo!

---

## 🌐 Como Jogar Online (Localhost ou Web)

O servidor multiplayer integrado já está pronto e rodando!

### 1. No seu computador (Localhost)
1. O servidor Node.js já está rodando em: **[http://localhost:3000](http://localhost:3000)**
2. Para testar o multiplayer agora mesmo com você mesmo:
   - Abra **duas abas** do navegador em **[http://localhost:3000](http://localhost:3000)**
   - Crie um personagem diferente em cada aba (por exemplo, um Guerreiro na Aba 1 e um Mago ou Arqueiro na Aba 2).
   - Você verá os dois heróis lado a lado na tela, andando em tempo real, atacando juntos e conversando pelo chat!

### 2. Para reiniciar o servidor futuramente no terminal
```bash
npm start
# ou
node server.js
```
E acesse `http://localhost:3000`.

### 3. Para jogar com outras pessoas na mesma rede Wi-Fi / Lan
Basta passar o seu IP local para seus amigos (ex: `http://192.168.x.x:3000`).

### 4. Para colocar na internet futuramente
Você pode subir esta mesma pasta gratuitamente em serviços de hospedagem como **Render**, **Railway**, **Fly.io** ou **Vercel** para qualquer pessoa do mundo entrar pelo link!

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
