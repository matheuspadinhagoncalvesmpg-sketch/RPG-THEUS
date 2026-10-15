// Onde ficam as Memórias da segunda leva: câmaras escondidas atrás de paredes quebráveis
// e baús de chefe (selados até o chefe ou mini-chefe da sala cair). Dados + o gerador das câmaras.

// Cada câmara fica ao lado de uma sala-hospedeira, atrás de 3 blocos quebráveis na parede da borda.
// lado: L (à esquerda) | R (à direita) · piso: linha do chão principal da sala-hospedeira · bau: guarda também um baú de horda.
export const CAMARAS = [
  { id: 'campos_alto_camara', name: 'Câmara das Cartas', host: 'campos_alto', lado: 'R', piso: 13, memoria: 'alto_carta' },
  { bau: true, id: 'campos_marco_nicho', name: 'Nicho dos Errantes', host: 'campos_marco', lado: 'L', piso: 13, memoria: 'marco_errante' },
  { id: 'campos_cripta_arquivo', name: 'Arquivo dos Buscadores', host: 'campos_cripta', lado: 'R', piso: 12, memoria: 'cripta_ordem' },
  { id: 'bosque_cume_trilha', name: 'Trilha Esquecida', host: 'bosque_cume', lado: 'L', piso: 13, memoria: 'cume_trilha' },
  { id: 'bosque_cisterna_lanternas', name: 'Sala das Doze Lanternas', host: 'bosque_cisterna', lado: 'L', piso: 12, memoria: 'cisterna_fresco' },
  { bau: true, id: 'bosque_lago_toca', name: 'Toca do Pescador', host: 'bosque_lago', lado: 'R', piso: 14, memoria: 'lago_diario' },
  { bau: true, id: 'ruinas_obs_estudo', name: 'Estudo da Vigia', host: 'ruinas_observatorio', lado: 'L', piso: 21, memoria: 'obs_diario' },
  { bau: true, id: 'ruinas_mirante_ninho', name: 'Ninho dos Escaladores', host: 'ruinas_mirante_leste', lado: 'R', piso: 12, memoria: 'mirante_carta' },
  { bau: true, id: 'cristal_coracao_eco', name: 'Câmara do Eco', host: 'cristal_coracao', lado: 'R', piso: 10, memoria: 'coracao_eco' },
  { id: 'cristal_fundo_nicho', name: 'Nicho do Buscador', host: 'cristal_veio_fundo', lado: 'L', piso: 12, memoria: 'fundo_buscador' },
  { id: 'cristal_ossario_nomes', name: 'Muro dos Nomes', host: 'cristal_catacumba', lado: 'L', piso: 12, memoria: 'ossario_nomes' },
  { bau: true, id: 'jardins_gruta_bilhete', name: 'Gruta do Bilhete', host: 'jardins_gruta', lado: 'L', piso: 14, memoria: 'gruta_bilhete' },
  { id: 'jardins_trincheira_sino', name: 'Recife do Sino', host: 'jardins_trincheira', lado: 'L', piso: 14, memoria: 'sino_fresco' },
  { id: 'jardins_abissal_canto', name: 'Canto Final', host: 'jardins_abissal', lado: 'R', piso: 10, memoria: 'abissal_cantiga' },
];

// Baús das salas de chefe: [coluna, linha, Memória]. Só abrem depois que o chefe da sala cai.
export const BAUS_DE_CHEFE = {
  bosque_arena: [10, 12, 'moss_diario'],
  bosque_covil: [24, 10, 'besouro_eco'],
  ninho_vespa: [8, 12, 'vespa_carta'],
  bosque_mariposal: [6, 12, 'mariposa_eco'],
  cristal_geodo: [24, 13, 'golem_diario'],
  jardins_covil: [3, 10, 'lampreia_eco'],
  ruinas_salao_dalva: [36, 12, 'dalva_eco'],
  ruinas_salao_ruben: [26, 13, 'ruben_livro'],
  ruinas_salao_lidia: [30, 12, 'lidia_carta'],
  ruinas_salao_marta: [16, 12, 'marta_diario'],
  ruinas_salao_sibila: [30, 20, 'sibila_eco'],
};

const W = 14, H = 9, PISO = 6; // a câmara tem o chão três linhas acima do fundo

// Abre a parede da sala-hospedeira (blocos quebráveis) e cria a câmara colada a ela.
export function aplicarCamaras(defs) {
  const novas = [];
  for (const c of CAMARAS) {
    const host = defs.find((d) => d.id === c.host);
    const antes = host.build;
    const esq = c.lado === 'L';
    host.build = (b) => {
      antes(b);
      const borda = esq ? 0 : b.w - 1, dentro = esq ? 1 : b.w - 2;
      for (let y = c.piso - 3; y < c.piso; y++) {
        b.set(borda, y, 'X');
        if (b.g[y][dentro] === '#') b.set(dentro, y, 'X'); // paredes de 2 blocos de espessura
      }
    };
    novas.push({
      id: c.id, name: c.name, area: host.area, secreta: true,
      x: esq ? host.x - W : host.x + host.w, y: host.y + c.piso - PISO, w: W, h: H,
      build: (b) => {
        b.rect(0, 0, W, 2).rect(0, PISO, W, H - PISO);
        b.rect(esq ? 0 : W - 1, 2, 1, 4); // parede do fundo
        b.rect(esq ? W - 1 : 0, 2, 1, 1); // topo da abertura (3 blocos livres, na altura da parede quebrável)
        b.set(esq ? 4 : W - 5, 5, c.bau ? 't' : '$').set(7, 5, 'L'); // seis câmaras têm também um baú (com horda)
      },
    });
  }
  return [...defs, ...novas];
}
