// POST /api/interests – public registration form (employers, candidates, agencies).
import { json, bad, ensureSchema, now, uid, sign, clean, rateLimited, clientIp } from '../../lib/core.js';

const TYPES = ['employer', 'worker', 'agency'];
const FIELDS = ['company', 'country', 'name', 'email', 'phone', 'sector', 'quantity', 'message',
  'profession', 'experience', 'languages', 'destination', 'availability', 'video_link', 'interest',
  'vacancyId', 'sectorInterest'];

async function readBody(request) {
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) return await request.json();
  const fd = await request.formData();
  const o = {};
  for (const [k, v] of fd.entries()) if (typeof v === 'string') o[k] = v;
  return o;
}

export async function onRequestPost({ request, env }) {
  await ensureSchema(env);
  let body;
  try {
    body = await readBody(request);
  } catch {
    return bad('Invalid request');
  }

  // Honeypot: real people never fill the hidden "website" field.
  if (clean(body.website)) return json({ ok: true });

  if (await rateLimited(env, 'form:' + clientIp(request), 10, 600)) return bad('Too many requests, please try again later.', 429);

  let type = clean(body.type || body.kind || body.role, 20).toLowerCase();
  if (type === 'candidate') type = 'worker';
  if (!TYPES.includes(type)) type = body.company ? 'employer' : 'worker';

  const data = {};
  for (const f of FIELDS) {
    const v = clean(body[f], f === 'message' ? 3000 : 300);
    if (v) data[f] = v;
  }
  if (!data.name) return bad('Name is required');
  if (!data.email && !data.phone) return bad('Email or phone is required');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return bad('Invalid email');
  if (data.video_link && !/^https?:\/\//i.test(data.video_link)) delete data.video_link;
  const consent = body.consent === true || body.consent === 'on' || body.consent === 'true' || body.consent === '1';
  if (!consent) return bad('Consent is required');
  data.consent_at = now();

  const id = uid();
  const lang = clean(body.lang || body.language, 10) || null;
  await env.DB.prepare('INSERT INTO applications (id, type, created_at, status, lang, data) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, type, now(), 'new', lang, JSON.stringify(data)).run();

  // Short-lived token that allows uploading photos/video for this application only.
  const uploadToken = type === 'worker' ? await sign(env, { t: 'upload', app: id, exp: Date.now() + 1000 * 60 * 60 }) : null;
  return json({ ok: true, id, uploadToken });
}

export const onRequest = () => bad('Not found', 404);
