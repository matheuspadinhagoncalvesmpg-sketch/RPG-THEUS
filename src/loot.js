// Conteúdo dos baús de tesouro do mundo (letra "t" nas salas). A ordem segue a das letras "t" na sala.
// weapon: arma (equipada ao abrir) · geo: moedas · res: materiais · armor: armadura.
export const LOOT = {
  campos_moinho: [{ weapon: 'adaga', geo: 30 }],
  bosque_gruta: [{ weapon: 'lanca', geo: 40 }],
  mirante_ventos: [{ weapon: 'arco', geo: 60 }],
  cristal_veio: [{ weapon: 'cajado', res: { crystal: 3 } }],
  jardins_gruta: [{ weapon: 'machado', geo: 80, res: { ore: 3 } }],
  campos_brejo: [{ geo: 50, res: { wood: 6 } }],
  campos_cripta: [{ armor: 'madeira', geo: 60 }],
  bosque_cisterna: [{ res: { crystal: 4, ore: 3 }, geo: 90 }],
  ruinas_arsenal: [{ armor: 'pedra', geo: 80 }],
  ruinas_observatorio: [{ geo: 150, res: { crystal: 3 } }],
  cristal_abismo: [{ res: { crystal: 6, stone: 4 }, geo: 100 }],
  jardins_nascente: [{ res: { ore: 4 }, geo: 120 }],
  campos_ermo: [{ geo: 70, res: { stone: 5, ore: 2 } }],
  campos_marco: [{ geo: 110, res: { wood: 6, ore: 3 } }],
  bosque_cume: [{ geo: 140, res: { ore: 3, crystal: 2 } }],
  ruinas_mirante_leste: [{ geo: 200, res: { crystal: 4, ore: 4 } }],
  jardins_salao: [{ geo: 130, res: { crystal: 3 } }],
  jardins_coral: [{ weapon: 'tridente', geo: 200 }],
};
