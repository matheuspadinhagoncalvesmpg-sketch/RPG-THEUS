// Multijogador (mundos com código) + salvamento na nuvem. Sem dependências.
// Transporte: WebSocket feito à mão em /ws e, se o proxy bloquear, HTTP (polling) em /api/mp/*.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const MAX_PLAYERS = 6;
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_MSG = 32 * 1024;
const POLL_TIMEOUT = 12000;

let DATA = '';
const worlds = new Map();   // código → mundo
const clients = new Map();  // id → cliente
let nextId = 1;

export function initMultiplayer(server, root) {
  DATA = process.env.DATA_DIR || path.join(root, 'data');
  for (const d of ['worlds', 'saves']) fs.mkdirSync(path.join(DATA, d), { recursive: true });
  server.on('upgrade', onUpgrade);
  setInterval(sweep, 3000);
}

const randCode = (n) => Array.from(crypto.randomBytes(n), (b) => CODE_ABC[b % CODE_ABC.length]).join('');
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const validCode = (c, n) => typeof c === 'string' && c.length === n && [...c].every((ch) => CODE_ABC.includes(ch));

// ───────── Mundos ─────────
function worldFile(code) { return path.join(DATA, 'worlds', code + '.json'); }

function loadWorld(code) {
  if (worlds.has(code)) return worlds.get(code);
  try {
    const data = JSON.parse(fs.readFileSync(worldFile(code), 'utf8'));
    const w = { code, builds: data.builds || {}, players: new Map(), hosts: {}, saveTimer: null };
    worlds.set(code, w);
    return w;
  } catch (e) { return null; }
}

function persistWorld(w) {
  clearTimeout(w.saveTimer);
  w.saveTimer = setTimeout(() => {
    fs.writeFile(worldFile(w.code), JSON.stringify({ builds: w.builds }), () => {});
  }, 1500);
}

function sanitizeBuilds(b) {
  const out = {};
  if (!b || typeof b !== 'object') return out;
  for (const [room, items] of Object.entries(b).slice(0, 20)) {
    if (!/^[a-z_]{1,30}$/.test(room) || !items || typeof items !== 'object') continue;
    out[room] = {};
    for (const [idx, id] of Object.entries(items).slice(0, 2000))
      if (/^\d{1,5}$/.test(idx) && /^[a-z_]{1,20}$/.test(id)) out[room][idx] = id;
  }
  return out;
}

function publicPlayer(c) {
  return { id: c.id, name: c.name, profile: c.profile, room: c.room };
}

function toWorld(w, msg, except = null, room = null) {
  for (const c of w.players.values()) if (c !== except && (!room || c.room === room)) c.send(msg);
}

// Quem simula os inimigos de cada sala: o primeiro jogador que estiver nela.
function refreshHost(w, room) {
  if (!room) return;
  const cur = w.hosts[room];
  const inRoom = [...w.players.values()].filter((c) => c.room === room);
  if (cur && inRoom.some((c) => c.id === cur)) return;
  w.hosts[room] = inRoom.length ? inRoom[0].id : null;
  if (w.hosts[room]) toWorld(w, { t: 'host', room, id: w.hosts[room] }, null, room);
}

// ───────── Mensagens ─────────
function handle(c, msg) {
  if (!msg || typeof msg !== 'object') return;
  const w = c.world;
  switch (msg.t) {
    case 'hello': {
      if (w) return;
      c.name = clean(msg.name, 14) || 'Errante';
      const pr = msg.profile || {};
      c.profile = { cloak: clean(pr.cloak, 9), hair: clean(pr.hair, 9), eyes: clean(pr.eyes, 10), skin: clean(pr.skin, 9) };
      let world;
      if (msg.create) {
        let code;
        do { code = randCode(5); } while (worlds.has(code) || fs.existsSync(worldFile(code)));
        world = { code, builds: sanitizeBuilds(msg.builds), players: new Map(), hosts: {}, saveTimer: null };
        worlds.set(code, world);
        persistWorld(world);
      } else {
        const code = clean(msg.world, 5).toUpperCase();
        world = validCode(code, 5) ? loadWorld(code) : null;
        if (!world) return c.send({ t: 'error', error: 'Mundo não encontrado. Confira o código.' });
        if (world.players.size >= MAX_PLAYERS) return c.send({ t: 'error', error: 'Esse mundo está cheio (máximo 6).' });
      }
      c.world = world;
      world.players.set(c.id, c);
      c.send({ t: 'welcome', id: c.id, code: world.code, builds: world.builds, players: [...world.players.values()].filter((p) => p !== c).map(publicPlayer) });
      toWorld(world, { t: 'join', player: publicPlayer(c) }, c);
      break;
    }
    case 'st': {
      if (!w) return;
      const room = clean(msg.room, 30);
      if (room !== c.room) {
        const old = c.room;
        c.room = room;
        refreshHost(w, old);
        refreshHost(w, room);
        c.send({ t: 'host', room, id: w.hosts[room] });
      }
      msg.id = c.id;
      toWorld(w, msg, c);
      break;
    }
    case 'build': {
      if (!w) return;
      const room = clean(msg.room, 30), idx = String(msg.idx | 0), id = msg.id ? clean(msg.id, 20) : null;
      if (!/^[a-z_]{1,30}$/.test(room) || (id && !/^[a-z_]+$/.test(id))) return;
      w.builds[room] = w.builds[room] || {};
      if (id) w.builds[room][idx] = id; else delete w.builds[room][idx];
      persistWorld(w);
      toWorld(w, { t: 'build', room, idx: Number(idx), id, by: c.id }, c);
      break;
    }
    case 'snap': {
      // Só o anfitrião da sala manda o estado dos inimigos.
      if (!w || w.hosts[c.room] !== c.id) return;
      msg.room = c.room;
      toWorld(w, msg, c, c.room);
      break;
    }
    case 'hit': {
      if (!w) return;
      const host = w.players.get(w.hosts[c.room]);
      if (host && host !== c) host.send({ t: 'hit', eid: msg.eid, dmg: Number(msg.dmg) || 0, kx: Number(msg.kx) || 0, ky: Number(msg.ky) || 0 });
      break;
    }
    case 'chat': {
      if (!w) return;
      const text = clean(msg.text, 120);
      if (text) toWorld(w, { t: 'chat', id: c.id, name: c.name, text });
      break;
    }
  }
}

function drop(c) {
  if (!clients.has(c.id)) return;
  clients.delete(c.id);
  const w = c.world;
  if (!w) return;
  w.players.delete(c.id);
  toWorld(w, { t: 'leave', id: c.id });
  refreshHost(w, c.room);
  if (!w.players.size) setTimeout(() => { if (!w.players.size) worlds.delete(w.code); }, 60000);
}

function sweep() {
  const now = Date.now();
  for (const c of clients.values()) if (c.kind === 'poll' && now - c.seen > POLL_TIMEOUT) drop(c);
}

// ───────── WebSocket (RFC 6455, só o necessário) ─────────
function onUpgrade(req, socket) {
  if (req.url.split('?')[0] !== '/ws' || !req.headers['sec-websocket-key']) return socket.destroy();
  const accept = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  socket.setNoDelay(true);
  const c = {
    id: 'p' + nextId++, kind: 'ws', world: null, room: null,
    send(msg) {
      if (socket.destroyed) return;
      const data = Buffer.from(JSON.stringify(msg));
      const len = data.length;
      const head = len < 126 ? Buffer.from([0x81, len])
        : len < 65536 ? Buffer.from([0x81, 126, len >> 8, len & 255])
        : (() => { const b = Buffer.alloc(10); b[0] = 0x81; b[1] = 127; b.writeBigUInt64BE(BigInt(len), 2); return b; })();
      socket.write(Buffer.concat([head, data]));
    },
  };
  clients.set(c.id, c);
  let buf = Buffer.alloc(0);
  socket.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 2) {
      const op = buf[0] & 0x0f, masked = buf[1] & 0x80;
      let len = buf[1] & 0x7f, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (len > MAX_MSG) return socket.destroy();
      const maskAt = off;
      if (masked) off += 4;
      if (buf.length < off + len) return;
      const payload = Buffer.from(buf.subarray(off, off + len));
      if (masked) for (let i = 0; i < len; i++) payload[i] ^= buf[maskAt + (i & 3)];
      buf = buf.subarray(off + len);
      if (op === 8) return socket.end();
      if (op === 9) { socket.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload])); continue; }
      if (op === 1) { try { handle(c, JSON.parse(payload.toString('utf8'))); } catch (e) { /* mensagem inválida */ } }
    }
  });
  socket.on('close', () => drop(c));
  socket.on('error', () => drop(c));
}

// ───────── HTTP: polling e nuvem ─────────
const hits = new Map();
function limited(ip, max) {
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const h = (hits.get(ip) || []).filter((t) => now - t < 60000);
  h.push(now);
  hits.set(ip, h);
  return h.length > max;
}

function readBody(req, max, cb) {
  let raw = '';
  req.on('data', (d) => { raw += d; if (raw.length > max) req.destroy(); });
  req.on('end', () => { try { cb(JSON.parse(raw || '{}')); } catch (e) { cb(null); } });
}

export function handleMultiplayer(req, res) {
  const url = req.url.split('?')[0];
  if (!url.startsWith('/api/mp/') && !url.startsWith('/api/cloud/')) return false;
  const send = (code, obj) => {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(obj));
  };
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

  if (url === '/api/mp/status') { send(200, { ok: true, worlds: worlds.size }); return true; }

  // Polling: conecta e depois troca mensagens a cada ~100 ms.
  if (url === '/api/mp/connect' && req.method === 'POST') {
    if (limited(ip + ':c', 30)) { send(429, { error: 'devagar' }); return true; }
    const c = { id: 'p' + nextId++, kind: 'poll', world: null, room: null, out: [], seen: Date.now(), send(m) { if (this.out.length < 400) this.out.push(m); } };
    c.secret = crypto.randomBytes(12).toString('hex');
    clients.set(c.id, c);
    send(200, { sid: c.id, secret: c.secret });
    return true;
  }
  if (url === '/api/mp/poll' && req.method === 'POST') {
    readBody(req, MAX_MSG * 4, (body) => {
      const c = body && clients.get(body.sid);
      if (!c || c.kind !== 'poll' || c.secret !== body.secret) return send(410, { error: 'sessão expirada' });
      c.seen = Date.now();
      for (const m of (Array.isArray(body.msgs) ? body.msgs : []).slice(0, 60)) handle(c, m);
      const out = c.out; c.out = [];
      send(200, { msgs: out });
    });
    return true;
  }
  if (url === '/api/mp/leave' && req.method === 'POST') {
    readBody(req, 1000, (body) => {
      const c = body && clients.get(body.sid);
      if (c && c.secret === body.secret) drop(c);
      send(200, { ok: true });
    });
    return true;
  }

  // Nuvem: guarda o save com um código de 10 letras.
  if (url === '/api/cloud/save' && req.method === 'POST') {
    if (limited(ip + ':s', 30)) { send(429, { error: 'devagar' }); return true; }
    readBody(req, 300 * 1024, (body) => {
      if (!body || !validCode(body.code, 10) || !body.save || typeof body.save !== 'object') return send(400, { error: 'dados inválidos' });
      fs.writeFile(path.join(DATA, 'saves', body.code + '.json'), JSON.stringify(body.save), (err) => send(err ? 500 : 200, { ok: !err }));
    });
    return true;
  }
  if (url === '/api/cloud/load' && req.method === 'POST') {
    if (limited(ip + ':l', 20)) { send(429, { error: 'devagar' }); return true; }
    readBody(req, 1000, (body) => {
      if (!body || !validCode(body.code, 10)) return send(400, { error: 'código inválido' });
      fs.readFile(path.join(DATA, 'saves', body.code + '.json'), 'utf8', (err, txt) => {
        if (err) return send(404, { error: 'Nenhum progresso salvo com esse código.' });
        send(200, { save: JSON.parse(txt) });
      });
    });
    return true;
  }
  send(404, { error: 'rota' });
  return true;
}
