// /api/admin/* – admin panel API. Session cookie + password stored (hashed) in D1.
import {
  json, bad, ensureSchema, now, uid, clean, getSetting, setSetting, hashPassword, passwordMatches,
  currentAdmin, sessionCookie, clearCookie, rateLimited, clientIp,
} from '../../../lib/core.js';

const STATUSES = ['new', 'reviewing', 'contacted', 'closed'];
const LANGS = ['en', 'sq', 'de', 'sl', 'fr', 'it', 'zh', 'be', 'ro-MD', 'ru', 'uz'];

const body = async (request) => {
  try { return await request.json(); } catch { return {}; }
};

async function appsWithFiles(env, where = '', binds = []) {
  const apps = await env.DB.prepare(`SELECT * FROM applications ${where} ORDER BY created_at DESC LIMIT 1000`).bind(...binds).all();
  const files = await env.DB.prepare('SELECT id, app_id, kind, name, size, ct, created_at FROM files ORDER BY created_at').all();
  const byApp = {};
  for (const f of files.results) (byApp[f.app_id] ||= []).push(f);
  return apps.results.map((a) => ({ ...a, data: JSON.parse(a.data || '{}'), files: byApp[a.id] || [] }));
}

async function deleteFilesOf(env, appId) {
  const files = await env.DB.prepare('SELECT r2_key FROM files WHERE app_id = ?').bind(appId).all();
  if (files.results.length && env.FILES) await env.FILES.delete(files.results.map((f) => f.r2_key));
  await env.DB.prepare('DELETE FROM files WHERE app_id = ?').bind(appId).run();
  return files.results.length;
}

export async function onRequest({ request, env, params }) {
  await ensureSchema(env);
  const path = (params.path || []).join('/');
  const method = request.method;
  const ip = clientIp(request);

  // State-changing requests must come from our own admin page (CSRF protection, with SameSite=Strict cookies).
  if (method !== 'GET' && request.headers.get('x-wn-admin') !== '1') return bad('Forbidden', 403);

  // ---------- public auth endpoints ----------
  if (path === 'status' && method === 'GET') {
    const configured = !!(await getSetting(env, 'admin_hash'));
    const admin = await currentAdmin(request, env);
    return json({ configured, loggedIn: !!admin, email: admin?.email || null });
  }

  if (path === 'setup' && method === 'POST') {
    if (await getSetting(env, 'admin_hash')) return bad('Already configured', 409);
    const b = await body(request);
    const email = clean(b.email, 200).toLowerCase();
    const password = String(b.password || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Shkruani një e-mail të saktë.');
    if (password.length < 10) return bad('Fjalëkalimi duhet të ketë të paktën 10 shkronja.');
    const h = await hashPassword(password);
    await setSetting(env, 'admin_email', email);
    await setSetting(env, 'admin_salt', h.salt);
    await setSetting(env, 'admin_hash', h.hash);
    await setSetting(env, 'session_version', '1');
    return json({ ok: true }, 200, { 'set-cookie': await sessionCookie(env, email) });
  }

  if (path === 'login' && method === 'POST') {
    if (await rateLimited(env, 'login:' + ip, 8, 900)) return bad('Shumë përpjekje. Provoni pas 15 minutash.', 429);
    const b = await body(request);
    const email = clean(b.email, 200).toLowerCase();
    const okEmail = email === (await getSetting(env, 'admin_email'));
    const okPass = await passwordMatches(env, String(b.password || ''));
    if (!okEmail || !okPass) return bad('E-maili ose fjalëkalimi është i gabuar.', 401);
    return json({ ok: true }, 200, { 'set-cookie': await sessionCookie(env, email) });
  }

  if (path === 'logout' && method === 'POST') return json({ ok: true }, 200, { 'set-cookie': clearCookie() });

  // ---------- everything below requires login ----------
  const admin = await currentAdmin(request, env);
  if (!admin) return bad('Not logged in', 401);

  if (path === 'password' && method === 'POST') {
    const b = await body(request);
    if (!(await passwordMatches(env, String(b.current || '')))) return bad('Fjalëkalimi aktual është i gabuar.', 400);
    const next = String(b.next || '');
    if (next.length < 10) return bad('Fjalëkalimi i ri duhet të ketë të paktën 10 shkronja.');
    const h = await hashPassword(next);
    await setSetting(env, 'admin_salt', h.salt);
    await setSetting(env, 'admin_hash', h.hash);
    const v = String(parseInt((await getSetting(env, 'session_version')) || '1', 10) + 1);
    await setSetting(env, 'session_version', v); // logs out all other sessions
    return json({ ok: true }, 200, { 'set-cookie': await sessionCookie(env, admin.email) });
  }

  // ----- applications -----
  if (path === 'applications' && method === 'GET') return json({ items: await appsWithFiles(env) });

  let m = path.match(/^applications\/([\w-]+)$/);
  if (m && method === 'PATCH') {
    const b = await body(request);
    if (b.status !== undefined) {
      if (!STATUSES.includes(b.status)) return bad('Invalid status');
      await env.DB.prepare('UPDATE applications SET status = ? WHERE id = ?').bind(b.status, m[1]).run();
    }
    if (b.note !== undefined) await env.DB.prepare('UPDATE applications SET note = ? WHERE id = ?').bind(clean(b.note, 3000), m[1]).run();
    return json({ ok: true });
  }
  if (m && method === 'DELETE') {
    await deleteFilesOf(env, m[1]);
    await env.DB.prepare('UPDATE candidates SET app_id = NULL WHERE app_id = ?').bind(m[1]).run();
    await env.DB.prepare('DELETE FROM applications WHERE id = ?').bind(m[1]).run();
    return json({ ok: true });
  }
  m = path.match(/^applications\/([\w-]+)\/files$/);
  if (m && method === 'DELETE') return json({ ok: true, deleted: await deleteFilesOf(env, m[1]) });

  m = path.match(/^files\/([\w-]+)$/);
  if (m && method === 'GET') {
    const f = await env.DB.prepare('SELECT * FROM files WHERE id = ?').bind(m[1]).first();
    if (!f || !env.FILES) return bad('Not found', 404);
    const range = request.headers.get('range');
    let obj;
    if (range) {
      const r = range.match(/bytes=(\d+)-(\d*)/);
      if (r) {
        const offset = parseInt(r[1], 10);
        const end = r[2] ? parseInt(r[2], 10) : f.size - 1;
        obj = await env.FILES.get(f.r2_key, { range: { offset, length: end - offset + 1 } });
        if (!obj) return bad('Not found', 404);
        return new Response(obj.body, {
          status: 206,
          headers: {
            'content-type': f.ct, 'content-range': `bytes ${offset}-${end}/${f.size}`, 'accept-ranges': 'bytes',
            'content-length': String(end - offset + 1), 'cache-control': 'private, no-store',
          },
        });
      }
    }
    obj = await env.FILES.get(f.r2_key);
    if (!obj) return bad('Not found', 404);
    const dl = new URL(request.url).searchParams.get('download') === '1';
    return new Response(obj.body, {
      headers: {
        'content-type': f.ct, 'accept-ranges': 'bytes', 'content-length': String(f.size), 'cache-control': 'private, no-store',
        'content-disposition': `${dl ? 'attachment' : 'inline'}; filename="${(f.name || 'file').replace(/[^\w.\- ]/g, '_')}"`,
      },
    });
  }

  if (path === 'import' && method === 'POST') {
    const b = await body(request);
    const items = Array.isArray(b.items) ? b.items : [];
    let added = 0;
    for (const it of items) {
      const id = clean(it.id, 80) || uid();
      const exists = await env.DB.prepare('SELECT id FROM applications WHERE id = ?').bind(id).first();
      if (exists) continue;
      const type = ['employer', 'worker', 'agency'].includes(it.type) ? it.type : 'worker';
      const status = STATUSES.includes(it.status) ? it.status : 'new';
      const data = typeof it.data === 'object' && it.data ? it.data : {};
      await env.DB.prepare('INSERT INTO applications (id, type, created_at, status, lang, data, note) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(id, type, clean(it.created_at, 40) || now(), status, null, JSON.stringify(data), clean(it.note, 3000) || null).run();
      added++;
    }
    return json({ ok: true, added });
  }

  // ----- jobs -----
  if (path === 'jobs' && method === 'GET') {
    return json({ items: (await env.DB.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all()).results });
  }
  if (path === 'jobs' && method === 'POST') {
    const b = await body(request);
    if (!clean(b.title)) return bad('Pozicioni është i detyrueshëm.');
    const id = uid();
    await env.DB.prepare('INSERT INTO jobs (id, title, country, sector, pay, description, published, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, clean(b.title, 200), clean(b.country, 120), clean(b.sector, 120), clean(b.pay, 300), clean(b.description, 4000), b.published === false ? 0 : 1, now()).run();
    return json({ ok: true, id });
  }
  m = path.match(/^jobs\/([\w-]+)$/);
  if (m && method === 'PATCH') {
    const b = await body(request);
    const cur = await env.DB.prepare('SELECT * FROM jobs WHERE id = ?').bind(m[1]).first();
    if (!cur) return bad('Not found', 404);
    const v = (k, max) => (b[k] !== undefined ? clean(b[k], max) : cur[k]);
    await env.DB.prepare('UPDATE jobs SET title = ?, country = ?, sector = ?, pay = ?, description = ?, published = ? WHERE id = ?')
      .bind(v('title', 200), v('country', 120), v('sector', 120), v('pay', 300), v('description', 4000),
        b.published !== undefined ? (b.published ? 1 : 0) : cur.published, m[1]).run();
    return json({ ok: true });
  }
  if (m && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM jobs WHERE id = ?').bind(m[1]).run();
    return json({ ok: true });
  }

  // ----- candidates (public, anonymous profiles) -----
  if (path === 'candidates' && method === 'GET') {
    return json({ items: (await env.DB.prepare('SELECT * FROM candidates ORDER BY sort ASC, created_at ASC').all()).results });
  }
  if (path === 'candidates' && method === 'POST') {
    const b = await body(request);
    if (!clean(b.profession)) return bad('Profesioni është i detyrueshëm.');
    const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM candidates').first();
    let code = clean(b.code, 20);
    if (!code) {
      const last = await env.DB.prepare("SELECT code FROM candidates WHERE code LIKE 'WN-%' ORDER BY code DESC LIMIT 1").first();
      const n = last ? parseInt(last.code.slice(3), 10) + 1 : 1;
      code = 'WN-' + String(n).padStart(3, '0');
    }
    const id = uid();
    await env.DB.prepare(`INSERT INTO candidates (id, code, profession, experience, location, nationality, languages, status, published, app_id, sort, created_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, code, clean(b.profession, 120), clean(b.experience, 60), clean(b.location, 120), clean(b.nationality, 120),
        clean(b.languages, 200), ['available', 'interviewing', 'placed'].includes(b.status) ? b.status : 'available',
        b.published === false ? 0 : 1, clean(b.app_id, 80) || null, count.n, now()).run();
    return json({ ok: true, id, code });
  }
  m = path.match(/^candidates\/([\w-]+)$/);
  if (m && method === 'PATCH') {
    const b = await body(request);
    const cur = await env.DB.prepare('SELECT * FROM candidates WHERE id = ?').bind(m[1]).first();
    if (!cur) return bad('Not found', 404);
    const v = (k, max) => (b[k] !== undefined ? clean(b[k], max) : cur[k]);
    const status = b.status !== undefined && ['available', 'interviewing', 'placed'].includes(b.status) ? b.status : cur.status;
    await env.DB.prepare(`UPDATE candidates SET code = ?, profession = ?, experience = ?, location = ?, nationality = ?, languages = ?,
                          status = ?, published = ?, sort = ? WHERE id = ?`)
      .bind(v('code', 20), v('profession', 120), v('experience', 60), v('location', 120), v('nationality', 120), v('languages', 200),
        status, b.published !== undefined ? (b.published ? 1 : 0) : cur.published,
        b.sort !== undefined ? parseInt(b.sort, 10) || 0 : cur.sort, m[1]).run();
    return json({ ok: true });
  }
  if (m && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM candidates WHERE id = ?').bind(m[1]).run();
    return json({ ok: true });
  }

  // ----- editable texts (overrides of the page texts, per language) -----
  if (path === 'texts' && method === 'GET') {
    return json({ items: (await env.DB.prepare('SELECT lang, key, value FROM texts').all()).results });
  }
  if (path === 'texts' && method === 'PUT') {
    const b = await body(request);
    const lang = LANGS.includes(b.lang) ? b.lang : null;
    const key = clean(b.key, 80);
    if (!lang || !/^[\w.-]+$/.test(key)) return bad('Invalid text key');
    const value = clean(b.value, 4000);
    if (!value) await env.DB.prepare('DELETE FROM texts WHERE lang = ? AND key = ?').bind(lang, key).run();
    else await env.DB.prepare('INSERT INTO texts (lang, key, value) VALUES (?, ?, ?) ON CONFLICT(lang, key) DO UPDATE SET value = excluded.value')
      .bind(lang, key, value).run();
    return json({ ok: true });
  }

  return bad('Not found', 404);
}
