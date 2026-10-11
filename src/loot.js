// Conteúdo dos baús de tesouro do mundo (letra "t" nas salas). A ordem segue a das letras "t" na sala.
// weapon: arma (equipada ao abrir) · geo: moedas · res: materiais · armor: armadura.
export const LOOT = {
  campos_moinho: [{ weapon: 'adaga', geo: 30 }],
  bosque_gruta: [{ weapon: 'lanca', geo: 40 }],
  mirante_ventos: [{ weapon: 'arco', geo: 60 }],
  cristal_veio: [{ weapon: 'cajado', res: { crystal: 3 } }],
  jardins_gruta: [{ weapon: 'machado', geo: 80, res: { ore: 3 } }],
};
