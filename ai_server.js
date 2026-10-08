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
Regiões: Campos do Crepúsculo (início, Abrigo com banco), Bosque das Lanternas (Cavaleiro de Musgo guarda o Santuário do Vento com o Manto do Vento/dash),
Ruínas Suspensas (Ponte Partida exige dash; Torre dos Ventos exige escalar paredes com as Garras de Pedra, achadas na Galeria dos Escaladores),
Cavernas de Cristal (sob um chão rachado no Abrigo; guardam as Asas de Cinza/pulo duplo). A Chama da Alma (magia) está atrás de uma parede oca nas Raízes Profundas.
Geo é o dinheiro. ALMA enche ao acertar golpes; segurar o botão de alma cura.`;

const PERSONAS = {
  oren: 'Você é Oren, o Andarilho: um velho cartógrafo gentil e melancólico, fala devagar, usa metáforas sobre caminhos e o pôr do sol.',
  mira: 'Você é Mira, a Mercadora: animada, gananciosa de um jeito simpático, ri com "hehe", adora geo e fofoca sobre o reino. Vende Fragmento de Vida (120 geo), Afiar a Lâmina (220) e Vaso Antigo (300).',
  eco: 'Você é o Eco da Lanterna: um espírito sussurrante e enigmático que fala em frases curtas e poéticas, guarda memórias de Vésper.',
};

const BOSS_PERSONAS = {
  moss: 'o Cavaleiro de Musgo, guardião antigo, honrado e lento nas palavras, coberto de musgo',
  king: 'o Rei Sem Coroa, arrogante, frio, teatral, que roubou a Coroa da Aurora',
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
  return `Progresso do herói: habilidades = ${have.join(', ') || 'nenhuma'}; Cavaleiro de Musgo ${p.bosses?.moss ? 'derrotado' : 'vivo'}; Rei Sem Coroa ${p.bosses?.king ? 'derrotado' : 'vivo'}; geo = ${clamp(p.geo, 0, 99999, 0)}; sala atual = ${str(p.room, 40)}.`;
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
Herói: máscaras ${clamp(s.masks, 0, 20, 5)}/${clamp(s.masksMax, 1, 20, 5)}, alma ${clamp(s.soul, 0, 99, 0)}, morreu ${clamp(s.deaths, 0, 999, 0)} vezes nesta sala.
Estilo de jogo recente: golpes de lado ${clamp(s.style?.side, 0, 999, 0)}, para cima ${clamp(s.style?.up, 0, 999, 0)}, para baixo (pogo) ${clamp(s.style?.down, 0, 999, 0)}, dashes ${clamp(s.style?.dash, 0, 999, 0)}, curas ${clamp(s.style?.heal, 0, 999, 0)}, dano sofrido ${clamp(s.style?.hurt, 0, 999, 0)}, distância média dos inimigos ${clamp(s.style?.dist, 0, 999, 100)}px.
${boss ? `Chefe em luta: ${boss}, vida ${clamp(s.bossHp, 0, 1, 1) * 100}%.` : ''}
Objetivo: luta desafiadora e justa. Se o herói está quase morrendo ou morreu muito aqui, alivie um pouco; se está dominando, pressione e explore os pontos fracos do estilo dele.
Responda APENAS com JSON:
{"aggression": 0.0-1.0, "speed": 0.8-1.3, "cooldown": 0.7-1.4, "tactic": "swarm"|"flank"|"kite"|"ambush",
 "bossWeights": ${s.boss === 'moss' ? '{"charge":n,"leap":n,"combo":n}' : s.boss === 'king' ? '{"tele":n,"orbs":n,"dive":n}' : 'null'},
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
      else send(404, { error: 'rota' });
    } catch (e) {
      console.error('[IA]', e.message);
      send(502, { error: 'falha na IA' });
    }
  });
  return true;
}
