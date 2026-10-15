# Plano do mapa: bancos, recompensas, chefes, corações e interligação

Este documento registra o que **aprendemos** olhando o desenho de um metroidvania de referência (o Hollow Knight) e como o THEUS **aplica as mesmas lições do seu jeito** (sem copiar nada: nomes, itens, regiões e história são nossos).

## 1. Lições do estudo e como aplicamos

| Lição | Como o THEUS aplica | Onde está |
| :--- | :--- | :--- |
| **Fogueiras (bancos) espaçadas, sempre antes de um desafio** | Uma fogueira a cada 2 a 3 salas; **todo chefe e mini-chefe tem fogueira na sala anterior** (nunca dentro da arena). | `tools/bancos.mjs`, `tools/check-entities.mjs` |
| **Zona segura ao redor da fogueira** | Num raio de **10 blocos** de uma fogueira **não aparecem monstros** (nem invasões). | `SAFE_RADIUS` em `config.js` |
| **Monstros e recursos voltam só ao descansar** | Inimigos, árvores, pedras e minérios derrotados **só reaparecem ao sentar numa fogueira** (ou ao morrer, no solo). No multijogador, o descanso de um renova o mundo de todos. | `Game.respawnWorld`, mensagem `rest` |
| **Poucos corações, muito espalhados, em pedaços** | Vida vem em **Fragmentos de Vida**: **5 fragmentos = 1 coração**. Há 15 cristais pelo mapa, 1 por mini-chefe, 2 por Soberano e 1 a cada 6 Memórias. | `addFragments` |
| **Prêmios que exigem enfrentar algo** | **Baús chamam uma horda** de 2 a 3 ondas ao serem tocados e só abrem depois da última (no Hollow Knight, o Coliseu); os Baús de Memória ficam selados até o chefe da sala cair. Os mini-chefes dão fragmentos; os Soberanos dão fragmentos **e libertam almas**. | `TreasureChest.sealed` |
| **Mapa muito interligado, com atalhos** | O grafo de salas tem **7 laços independentes** (eram 2) e atalhos verticais com pulinho automático; o **Dossel das Lanternas** liga 4 salas de 3 regiões. | `tools/bancos.mjs` |
| **Segredos escondidos** | 14 **câmaras secretas** (atrás de paredes quebráveis) e 11 **Baús de Memória** nas salas de chefe, que só abrem quando o chefe cai. | `segredos.js` |
| **A história é uma recompensa** | **Memórias** (diários, cartas, ecos, inscrições, afrescos) rendem moedas, **fragmentos a cada 6** e **bônus ao completar um reino**; revelações importantes vêm em **cenas**. | `memorias.js`, `cutscene.js` |
| **Mercadores que fazem parte do mundo** | Quatro NPCs novos, cada um de um reino, vendem os itens que o jogador acha no mapa (para repor); alguns **andam** pela região. Tudo se paga com **moedas ou materiais** (a construção foi removida; os materiais viraram moeda de troca). | `lojas.js`, `dialog.js` |
| **Mapa que se compra** | O Oren vende o mapa de cada região. | `Mapas do Oren` |

## 2. Os números hoje

| Região (reino) | Salas | Fogueiras | Baús | Cristais de Vida | Chefes | Mini-chefes / Soberanos | NPCs | Memórias |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Campos (Reino de Brasa) | 9 | 3 | 5 | 4 | 0 | 0 | 2 | 11 |
| Bosque (Reino das Lanternas) | 17 | 6 | 8 | 4 | 1 (Cavaleiro de Musgo) | 3 | 2 | 14 |
| Ruínas (Reino dos Doze Tronos) | 19 | 7 | 7 | 3 | 1 (Alvar) | 5 Soberanos (+ Eliar no Trono) | 1 | 20 |
| Cristal (Reino de Cristal) | 9 | 3 | 5 | 3 | 0 | 1 (Golem) | 1 | 10 |
| Jardins (Reino da Maré) | 12 | 3 | 7 | 1 | 1 (Ondina) | 1 (Lampreia) | 1 | 7 |
| **Total** | **66** | **22** | **32** | **15** | **3** | **11** | **7** | **62** |

Pior distância de qualquer sala até uma fogueira: **2 salas**.

## 3. Distribuição planejada de recompensas

A ideia é que **cada tipo de recompensa fique num tipo de lugar**, e o jogador aprenda a ler o mapa:

| Recompensa | Onde fica | Exige |
| :--- | :--- | :--- |
| **Armas** | Baús em câmaras secretas ou depois de mini-chefes | Achar o buraco secreto + limpar a sala |
| **Armaduras** | Baús profundos (Cripta Rasa, Arsenal, Ossário) e lojas | Vencer guardiões |
| **Fragmentos de Vida** | Plataformas altas (parkour), mini-chefes, Soberanos, Memórias | Habilidade, luta ou curiosidade |
| **Habilidades** | Chefes (Cavaleiro de Musgo → dash; Mariposa Rainha → planar) e câmaras de prova | Vencer o chefe |
| **Memórias** | Salas de beco, Salões dos Soberanos, bibliotecas | Explorar |
| **Materiais** | Árvores, pedras e minérios (voltam ao descansar); baús | Quebrar e voltar |

## 4. Chefes distribuídos

- **Campos:** nenhum chefe; o mundo apresenta o jogo e o Oren.
- **Bosque:** o Cavaleiro de Musgo (dash) + Besouro-Rei, Vespa Rainha e **Mariposa Rainha** (planar).
- **Ruínas:** cinco **Soberanos** (Dalva, Rúben, Lídia, Marta, Sibila), cada um num Salão; **Eliar** antes de **Alvar**.
- **Cristal:** Golem Rachado.
- **Jardins:** Ondina (Rainha das Marés) + Lampreia Anciã.

## 5. Próximos passos (expansão planejada)

1. **Campos e Cristal** estão pequenos: +4 salas cada, ligando os dois por um túnel e com um mini-chefe novo em cada.
2. **Mais um chefe de região** em Campos (um guardião ligado à Velha Acendedora) para o primeiro desafio de verdade.
3. **Mais laços** entre Ruínas e Cristal (um elevador de cristal) e entre Jardins e Bosque (uma correnteza).
4. **Segunda leva de Memórias** (meta: 60), com uma Memória-chave por Soberano libertado.
5. **Mais NPCs com função**: um ferreiro de bronze nas Ruínas, uma curandeira nos Jardins (troca fragmentos por pistas).
6. Ligar a libertação das almas aos **finais** (final secreto "A Roda Descansa").
