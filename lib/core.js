// Shared helpers for Worknexa Pages Functions: responses, schema, auth.

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });

export const bad = (msg, status = 400) => json({ error: msg }, status);

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS applications (
     id TEXT PRIMARY KEY,
     type TEXT NOT NULL,
     created_at TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'new',
     lang TEXT,
     data TEXT NOT NULL,
     note TEXT
   )`,
  `CREATE INDEX IF NOT EXISTS idx_app_created ON applications(created_at)`,
  `CREATE TABLE IF NOT EXISTS files (
     id TEXT PRIMARY KEY,
     app_id TEXT NOT NULL,
     kind TEXT NOT NULL,
     r2_key TEXT NOT NULL,
     name TEXT,
     size INTEGER,
     ct TEXT,
     created_at TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_files_app ON files(app_id)`,
  `CREATE TABLE IF NOT EXISTS jobs (
     id TEXT PRIMARY KEY,
     title TEXT NOT NULL,
     country TEXT,
     sector TEXT,
     pay TEXT,
     description TEXT,
     published INTEGER NOT NULL DEFAULT 1,
     created_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS candidates (
     id TEXT PRIMARY KEY,
     code TEXT NOT NULL,
     profession TEXT NOT NULL,
     experience TEXT,
     location TEXT,
     nationality TEXT,
     languages TEXT,
     status TEXT NOT NULL DEFAULT 'available',
     published INTEGER NOT NULL DEFAULT 1,
     app_id TEXT,
     sort INTEGER NOT NULL DEFAULT 0,
     created_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS texts (
     lang TEXT NOT NULL,
     key TEXT NOT NULL,
     value TEXT NOT NULL,
     PRIMARY KEY (lang, key)
   )`,
  `CREATE TABLE IF NOT EXISTS settings (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL
   )`,
];

let schemaReady = false;
export async function ensureSchema(env) {
  if (schemaReady) return;
  if (!env.DB) throw new Error('D1 binding "DB" is missing');
  await env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s)));
  // Later additions (ignored if the column already exists).
  try { await env.DB.prepare('ALTER TABLE candidates ADD COLUMN photo TEXT').run(); } catch { /* exists */ }
  schemaReady = true;
}

export const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();

export async function getSetting(env, key) {
  const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
  return row ? row.value : null;
}
export async function setSetting(env, key, value) {
  await env.DB.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .bind(key, value).run();
}

// ---------- crypto ----------
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
export const randomToken = (bytes = 32) => b64u(crypto.getRandomValues(new Uint8Array(bytes)));

export async function hashPassword(password, saltB64) {
  const salt = saltB64 ? fromB64u(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256);
  return { salt: b64u(salt), hash: b64u(bits) };
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function hmacKey(env) {
  let secret = await getSetting(env, 'session_secret');
  if (!secret) {
    secret = randomToken(32);
    await setSetting(env, 'session_secret', secret);
  }
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

export async function sign(env, payload) {
  const body = b64u(enc.encode(JSON.stringify(payload)));
  const sig = b64u(await crypto.subtle.sign('HMAC', await hmacKey(env), enc.encode(body)));
  return `${body}.${sig}`;
}

export async function verify(env, token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = b64u(await crypto.subtle.sign('HMAC', await hmacKey(env), enc.encode(body)));
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64u(body)));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- admin auth ----------
export const SESSION_COOKIE = 'wn_admin';

export function getCookie(request, name) {
  const c = request.headers.get('cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function currentAdmin(request, env) {
  const p = await verify(env, getCookie(request, SESSION_COOKIE));
  if (!p || p.t !== 'admin') return null;
  const ver = (await getSetting(env, 'session_version')) || '1';
  if (String(p.v) !== ver) return null;
  return p;
}

export async function sessionCookie(env, email) {
  const ver = (await getSetting(env, 'session_version')) || '1';
  const token = await sign(env, { t: 'admin', email, v: ver, exp: Date.now() + 1000 * 60 * 60 * 24 * 14 });
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 14}`;
}

export const clearCookie = () => `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export async function passwordMatches(env, password) {
  const salt = await getSetting(env, 'admin_salt');
  const hash = await getSetting(env, 'admin_hash');
  if (!salt || !hash) return false;
  const h = await hashPassword(password, salt);
  return timingSafeEqual(h.hash, hash);
}

// Simple fixed-window rate limit stored in D1 settings (enough for a small site).
export async function rateLimited(env, bucket, limit, windowSec) {
  const win = Math.floor(Date.now() / 1000 / windowSec);
  const key = `rl:${bucket}:${win}`;
  const cur = parseInt((await getSetting(env, key)) || '0', 10);
  if (cur >= limit) return true;
  await setSetting(env, key, String(cur + 1));
  // occasional cleanup of old buckets
  if (Math.random() < 0.05) {
    await env.DB.prepare("DELETE FROM settings WHERE key LIKE 'rl:%' AND key NOT LIKE ?").bind(`rl:%:${win}`).run();
  }
  return false;
}

export const clientIp = (request) => request.headers.get('cf-connecting-ip') || 'local';

export const clean = (v, max = 2000) => (v == null ? '' : String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max));
