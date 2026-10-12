// IA do Gemini no servidor: falas dos personagens e "diretor tático" dos inimigos.
// A chave fica só aqui no servidor (variável GEMINI_API_KEY), nunca vai para o navegador.
import fs from 'node:fs';
import path from 'node:path';

// Lê o arquivo .env (sem dependências) se existir.
export function loadEnv(root) {
  try {
    const txt = fs.readFileSync(path.join(root, '.env'), 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch (e) { /* sem .env: tudo bem */ }
}

const WORLD = `Mundo: Vésper, um reino onde o sol parou no crepúsculo. O Rei Sem Coroa roubou a Coroa da Aurora e espera no Trono, no alto das Ruínas Suspensas.
O herói é o Errante, com um olho da cor do ocaso (vermelho) e outro da aurora (azul).
Regiões: Planície do Lar (terra livre a oeste do início, onde o herói pode construir sua base com madeira, pedra, minério e cristal), Campos do Crepúsculo (início, Abrigo com fogueira), Bosque das Lanternas (o Cavaleiro de Musgo guarda o bosque; quem o vence ganha o Manto do Vento/dash),
Ruínas Suspensas (Ponte Partida exige dash; Torre dos Ventos exige escalar paredes com as Garras de Pedra, achadas na Galeria dos Escaladores),
Jardins Submersos (um poço no Coração de Cristal leva a um recife e ao Templo da Maré, onde vive a Rainha das Marés; há um teto secreto no recife e um amuleto numa prova cronometrada), Cavernas de Cristal (sob um chão rachado no Abrigo; guardam as Asas de Cinza/pulo duplo). A Chama da Alma (magia) está atrás de uma parede oca nas Raízes Profundas.
O dinheiro são moedas. ALMA enche ao acertar golpes; segurar o botão de alma cura. Fogueiras salvam o jogo. Ao morrer, o herói deixa uma lápide com as moedas.`;

const PERSONAS = {
  oren: 'Você é Oren, o Andarilho: um velho cartógrafo gentil e melancólico, fala devagar, usa metáforas sobre caminhos e o pôr do sol.',
  mira: 'Você é Mira, a Mercadora: animada, gananciosa de um jeito simpático, ri com "hehe", adora moedas e fofoca sobre o reino. Vende Fragmento de Vida (120 moedas), Afiar a Lâmina (220) e Vaso Antigo (300).',
  smith: 'Você é Tibério, o Ferreiro: robusto, bem-humorado e direto, fala de metal, fogo e trabalho duro. Mora na base que o herói construiu na Planície do Lar e vende madeira, pedra, minério e cristal por moedas. Conhece as receitas da forja: Espada de Minério, Espada de Cristal e armaduras de madeira, pedra e cristal.',
  tome: 'Você é Tomé, o Lanterneiro: ex guarda-de-trilha do Reino das Lanternas, calmo e paciente, fala de trilhas, lanternas e do Capitão Brandão. Vende amuletos e lenha.',
  selene: 'Você é Selene, a Cronista: a última escriba dos Doze Tronos, formal e melancólica, fala de livros e nomes de soberanos. Sabe que o Regente apagava a história. Vende armas das Ruínas e pistas de Memórias.',
  brum: 'Você é Brum, o Mineiro: rouco e sussurrado, ouviu o geodo cantar "cansada". Vende armaduras e cristais.',
  nami: 'Você é Nami, a Pescadora: alegre e sábia, toca o sino do recife; sabe em segredo que há alguém dormindo no coral do Templo. Vende arcos, cajados e adagas.',
  eco: 'Você é o Eco da Lanterna: um espírito sussurrante e enigmático que fala em frases curtas e poéticas, guarda memórias de Vésper.',
};

const BOSS_PERSONAS = {
  moss: 'o Cavaleiro de Musgo, guardião antigo, honrado e lento nas palavras, coberto de musgo',
  tide: 'a Rainha das Marés, uma água-viva imensa e serena que guarda o Templo submerso; fala em metáforas do mar',
  king: 'o Rei Sem Coroa, o Regente Alvar que nunca foi coroado: arrogante, frio, teatral, que prendeu as almas dos soberanos',
  sob_dalva: 'Dalva, soberana cantora, doce e quebrada, fala em versos curtos',
  sob_ruben: 'Rúben, o escrivão do Dízimo, fala em dívidas e contas',
  sob_lidia: 'Lídia, capitã da Guarda, só dá ordens militares curtas',
  sob_marta: 'Marta, vaidosa e assustada de si mesma, fala de espelhos',
  sob_sibila: 'Sibila, a última vigia, fala devagar e olhando para a luz',
  sob_eliar: 'Eliar, o rei verdadeiro, sereno e triste, que se recusou a coroar a criança',
};

const MAX_BODY = 6000;
const hits = new Map();

function rateLimited(ip, limit = 40) {
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const h = (hits.get(ip) || []).filter((t) => now - t < 60000);
  h.push(now);
  hits.set(ip, h);
  return h.length > limit;
}

async function gemini(prompt, { json = false, maxTokens = 220 } = {}) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      signal: ctrl.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: json ? 0.7 : 0.9,
          maxOutputTokens: maxTokens,
          ...(json ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    });
    if (!res.ok) throw new Error('Gemini HTTP ' + res.status);
    const data = await res.json();
    return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
  } finally {
    clearTimeout(timer);
  }
}

const clamp = (v, a, b, d) => (typeof v === 'number' && isFinite(v) ? Math.min(b, Math.max(a, v)) : d);
const str = (v, n) => String(v ?? '').replace(/[\r\n]+/g, ' ').slice(0, n);

function progressText(p = {}) {
  const ab = p.abilities || {};
  const have = Object.entries({ dash: 'Manto do Vento', wallJump: 'Garras de Pedra', doubleJump: 'Asas de Cinza', spell: 'Chama da Alma' })
    .filter(([k]) => ab[k]).map(([, v]) => v);
  return `Progresso do herói: habilidades = ${have.join(', ') || 'nenhuma'}; Cavaleiro de Musgo ${p.bosses?.moss ? 'derrotado' : 'vivo'}; Rei Sem Coroa ${p.bosses?.king ? 'derrotado' : 'vivo'}; moedas = ${clamp(p.geo, 0, 99999, 0)}; sala atual = ${str(p.room, 40)}.`;
}

async function npcReply(body) {
  const persona = PERSONAS[body.npc];
  if (!persona) throw new Error('npc inválido');
  const history = (Array.isArray(body.history) ? body.history : []).slice(-6)
    .map((h) => `${h.who === 'npc' ? 'Você' : 'Errante'}: ${str(h.text, 200)}`).join('\n');
  const prompt = `${persona}
${WORLD}
${progressText(body.progress)}
Regras: responda SEMPRE em português do Brasil, em no máximo 3 frases curtas, sem markdown, sempre no personagem.
Nunca diga que é uma IA. Dê dicas só do PRÓXIMO passo que o herói ainda não fez, de forma indireta. Se perguntarem algo fora do mundo de Vésper, desconverse no personagem.
Conversa até agora:
${history}
Errante: ${str(body.message, 200)}
Você:`;
  const reply = await gemini(prompt, { maxTokens: 160 });
  return { reply: reply.replace(/^Você:\s*/i, '').slice(0, 400) };
}

async function director(body) {
  const s = body.state || {};
  const boss = BOSS_PERSONAS[s.boss];
  const prompt = `Você é o diretor tático dos inimigos de um jogo de plataforma 2D estilo Hollow Knight. Decida a estratégia dos próximos segundos.
${WORLD}
Situação: sala "${str(s.room, 40)}", inimigos vivos: ${str(JSON.stringify(s.enemies || {}), 200)}.
Herói: corações ${clamp(s.masks, 0, 20, 5)}/${clamp(s.masksMax, 1, 20, 5)}, alma ${clamp(s.soul, 0, 99, 0)}, morreu ${clamp(s.deaths, 0, 999, 0)} vezes nesta sala.
Estilo de jogo recente: golpes de lado ${clamp(s.style?.side, 0, 999, 0)}, para cima ${clamp(s.style?.up, 0, 999, 0)}, para baixo (pogo) ${clamp(s.style?.down, 0, 999, 0)}, dashes ${clamp(s.style?.dash, 0, 999, 0)}, curas ${clamp(s.style?.heal, 0, 999, 0)}, dano sofrido ${clamp(s.style?.hurt, 0, 999, 0)}, distância média dos inimigos ${clamp(s.style?.dist, 0, 999, 100)}px.
${boss ? `Chefe em luta: ${boss}, vida ${clamp(s.bossHp, 0, 1, 1) * 100}%.` : ''}
Objetivo: luta desafiadora e justa. Se o herói está quase morrendo ou morreu muito aqui, alivie um pouco; se está dominando, pressione e explore os pontos fracos do estilo dele.
Responda APENAS com JSON:
{"aggression": 0.0-1.0, "speed": 0.8-1.3, "cooldown": 0.7-1.4, "tactic": "swarm"|"flank"|"kite"|"ambush",
 "bossWeights": ${s.boss === 'moss' ? '{"charge":n,"leap":n,"combo":n}' : s.boss === 'king' ? '{"tele":n,"orbs":n,"dive":n}' : s.boss === 'tide' ? '{"bubbles":n,"sweep":n,"slam":n}' : 'null'},
 "taunt": ${boss ? '"uma fala curta (até 10 palavras) do chefe, em português, provocando o herói conforme a situação"' : 'null'},
 "reason": "explicação curta"}`;
  const raw = await gemini(prompt, { json: true, maxTokens: 200 });
  const j = JSON.parse(raw.replace(/^```json|```$/g, ''));
  const tactics = ['swarm', 'flank', 'kite', 'ambush'];
  const w = j.bossWeights && typeof j.bossWeights === 'object' ? j.bossWeights : null;
  const weights = w ? Object.fromEntries(Object.entries(w).slice(0, 4).map(([k, v]) => [str(k, 10), clamp(v, 0, 10, 1)])) : null;
  return {
    aggression: clamp(j.aggression, 0, 1, 0.5),
    speed: clamp(j.speed, 0.8, 1.3, 1),
    cooldown: clamp(j.cooldown, 0.7, 1.4, 1),
    tactic: tactics.includes(j.tactic) ? j.tactic : 'swarm',
    bossWeights: weights,
    taunt: j.taunt ? str(j.taunt, 80) : null,
    reason: str(j.reason, 120),
    source: 'gemini',
  };
}

const EVENTS = {
  smith_arrive: 'Um ferreiro chamado Tibério acabou de se mudar para a base que o herói construiu na Planície do Lar.',
  raid_start: 'Anoiteceu e uma horda de monstros está prestes a atacar a base do herói na Planície do Lar.',
  raid_end: 'O herói acabou de defender sua base de um ataque noturno.',
  invasion_end: 'O herói acabou de derrotar o capitão de uma invasão de monstros numa região de Vésper e a horda se desfez.',
};

// Invasão rara: a IA só decide se é a hora, o tom e a força. O jogo executa tudo.
async function invasionPlan(body) {
  const prompt = `Você é o diretor de eventos raros de Vésper, um jogo de aventura sombrio e poético (estilo Hollow Knight com invasões como no Terraria).
${WORLD}
Uma invasão está prestes a acontecer na região "${str(body.area, 20)}": "${str(body.invasionName, 40)}" (${str(body.invasionSub, 80)}).
Herói: ${str(body.name, 20)}, corações ${clamp(body.masks, 0, 20, 5)}/${clamp(body.masksMax, 1, 20, 5)}, invasões já vencidas ${clamp(body.done, 0, 999, 0)}, mortes nesta sala ${clamp(body.deaths, 0, 999, 0)}.
Decida: "go" false se o herói está fraco ou machucado demais agora (a invasão é adiada); "scale" de 0.8 (suave) a 1.4 (brutal) conforme a força dele; "title" um nome curto e poético para a invasão (até 28 caracteres, sem revelar spoilers da história); "line" UMA frase de aviso, em português do Brasil, até 20 palavras, sem aspas e sem markdown.
Responda APENAS com JSON: {"go": true|false, "scale": 0.8-1.4, "title": "...", "line": "..."}`;
  const raw = await gemini(prompt, { json: true, maxTokens: 160 });
  const j = JSON.parse(raw.replace(/^```json|```$/g, ''));
  return {
    go: j.go !== false,
    scale: clamp(j.scale, 0.8, 1.4, 1),
    title: j.title ? str(j.title, 28) : null,
    line: j.line ? str(j.line, 140).replace(/^["'“]|["'”]$/g, '') : null,
  };
}

async function narrate(body) {
  const ev = EVENTS[body.event];
  if (!ev) throw new Error('evento inválido');
  const c = body.context || {};
  const prompt = `Você é o narrador de Vésper, um jogo de aventura sombrio e poético.
${WORLD}
Evento: ${ev} O herói se chama "${str(c.name, 20)}". Ataques já defendidos: ${clamp(c.raids, 0, 999, 0)}.
Escreva UMA frase de narração, em português do Brasil, com no máximo 18 palavras, sem aspas e sem markdown.`;
  const line = await gemini(prompt, { maxTokens: 60 });
  return { line: line.replace(/^["'“]|["'”]$/g, '').slice(0, 160) };
}

// Trata /api/ai/*. Retorna true se a rota foi atendida.
export function handleAI(req, res) {
  const url = req.url.split('?')[0];
  if (!url.startsWith('/api/ai/')) return false;
  const send = (code, obj) => {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(obj));
  };
  const enabled = !!process.env.GEMINI_API_KEY;
  if (url === '/api/ai/status') { send(200, { enabled }); return true; }
  if (req.method !== 'POST') { send(405, { error: 'método' }); return true; }
  if (!enabled) { send(503, { error: 'IA desligada: defina GEMINI_API_KEY' }); return true; }
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (rateLimited(ip)) { send(429, { error: 'muitas requisições' }); return true; }

  let raw = '';
  req.on('data', (c) => {
    raw += c;
    if (raw.length > MAX_BODY) { req.destroy(); }
  });
  req.on('end', async () => {
    try {
      const body = JSON.parse(raw || '{}');
      if (url === '/api/ai/npc') send(200, await npcReply(body));
      else if (url === '/api/ai/director') send(200, await director(body));
      else if (url === '/api/ai/narrate') send(200, await narrate(body));
      else if (url === '/api/ai/event') send(200, await invasionPlan(body));
      else send(404, { error: 'rota' });
    } catch (e) {
      console.error('[IA]', e.message);
      send(502, { error: 'falha na IA' });
    }
  });
  return true;
}
