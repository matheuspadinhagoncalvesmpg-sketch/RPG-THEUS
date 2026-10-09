// Jogador-robô para testar o multijogador.
// Uso: node tools/mp-bot.mjs <url> <ação> [código]
//   join <código>  entra no mundo, vai para a Colina do Despertar, dá golpes e constrói um bloco
//   host           cria um mundo, fica na Colina e manda fotos de inimigos (para testar o modo convidado)
const [url = 'ws://localhost:3100/ws', action = 'join', code] = process.argv.slice(2);
const ws = new WebSocket(url);
const log = (...a) => console.log('[bot]', ...a);
const got = {};
const send = (m) => ws.send(JSON.stringify(m));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  got[m.t] = (got[m.t] || 0) + 1;
  if (m.t === 'welcome') log('welcome', m.code, 'outros:', m.players.map((p) => p.name).join(','));
  if (m.t === 'error') log('ERRO', m.error);
  if (m.t === 'host') log('anfitrião de', m.room, '=', m.id);
  if (m.t === 'snap' && got.snap === 1) log('primeira foto: inimigos', JSON.stringify(m.e));
  if (m.t === 'hit') log('recebi golpe (sou anfitrião):', JSON.stringify(m));
  if (m.t === 'chat') log('chat', m.name, m.text);
};

ws.onopen = async () => {
  const st = (x) => send({ t: 'st', room: 'campos_inicio', x, y: 388, f: -1, s: 'run', a: 0, w: 'minerio', ar: 'pedra', n: 1, sit: 0, name: 'Robô', pr: { cloak: '#2f6f4f', hair: '#ffd166', eyes: 'green', skin: '#c68642' } });
  if (action === 'join') {
    send({ t: 'hello', world: code, name: 'Robô', profile: { cloak: '#2f6f4f', hair: '#ffd166', eyes: 'green', skin: '#c68642' } });
    await wait(400);
    for (let i = 0; i < 20; i++) { st(700 - i * 5); await wait(60); }
    send({ t: 'hit', eid: 0, dmg: 1, kx: 1, ky: 0 });
    send({ t: 'build', room: 'planicie_lar', idx: 30 * 44 + 6, id: 'stone_block' });
    send({ t: 'chat', text: 'oi, sou o robô!' });
    for (let i = 0; i < 20; i++) { st(600); await wait(60); }
  } else {
    send({ t: 'hello', create: true, name: 'Robô', profile: {} });
    await wait(400);
    for (let i = 0; i < 250; i++) {
      st(300);
      // finge um rastejante (eid 0) andando e com vida caindo, e some com o eid 1 (morreu)
      send({ t: 'snap', e: [[0, 'c', 820 - i * 2, 404, 3, -1, '', 100, 0]], p: [[600, 380, -2, 0, 'blob', 6, 0.2]], hb: [], n: 0, d: 0 });
      await wait(80);
    }
  }
  log('mensagens recebidas:', JSON.stringify(got));
  ws.close();
};
