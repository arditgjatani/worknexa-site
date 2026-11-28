// PUT /api/upload?kind=cv|photo|video – candidate CV, photo or video upload (private, stored in R2).
// Header "x-upload-token" comes from the /api/interests response.
import { json, bad, ensureSchema, now, uid, verify, clean } from '../../lib/core.js';

const CV_TYPES = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

const LIMITS = {
  cv: { max: 2, bytes: 10 * 1024 * 1024, types: CV_TYPES },
  photo: { max: 3, bytes: 5 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] },
  video: { max: 1, bytes: 50 * 1024 * 1024, types: ['video/mp4', 'video/quicktime', 'video/webm'] },
};

function sniff(bytes) {
  const b = bytes;
  const hex = (i, n) => Array.from(b.slice(i, i + n)).map((x) => x.toString(16).padStart(2, '0')).join('');
  if (hex(0, 3) === 'ffd8ff') return 'image/jpeg';
  if (hex(0, 8) === '89504e470d0a1a0a') return 'image/png';
  if (hex(0, 4) === '52494646' && hex(8, 4) === '57454250') return 'image/webp';
  if (hex(0, 4) === '1a45dfa3') return 'video/webm';
  if (hex(0, 4) === '25504446') return 'application/pdf'; // "%PDF"
  if (hex(0, 8) === 'd0cf11e0a1b11ae1') return 'application/msword'; // old Word (.doc)
  if (hex(0, 4) === '504b0304') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; // .docx (zip)
  if (hex(4, 4) === '66747970') { // "ftyp"
    const brand = String.fromCharCode(...b.slice(8, 12));
    return brand.startsWith('qt') ? 'video/quicktime' : 'video/mp4';
  }
  return null;
}

export async function onRequestPut({ request, env }) {
  await ensureSchema(env);
  if (!env.FILES) return bad('File storage is not configured', 500);
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind');
  const lim = LIMITS[kind];
  if (!lim) return bad('Unknown file kind');

  const tok = await verify(env, request.headers.get('x-upload-token'));
  if (!tok || tok.t !== 'upload') return bad('Upload link expired. Please submit the form again.', 403);
  const appId = tok.app;

  const len = parseInt(request.headers.get('content-length') || '0', 10);
  if (len && len > lim.bytes) return bad('File is too large', 413);

  const existing = await env.DB.prepare('SELECT COUNT(*) AS n FROM files WHERE app_id = ? AND kind = ?').bind(appId, kind).first();
  if (existing.n >= lim.max) return bad('Too many files', 400);

  const buf = new Uint8Array(await request.arrayBuffer());
  if (buf.byteLength === 0) return bad('Empty file');
  if (buf.byteLength > lim.bytes) return bad('File is too large', 413);
  const ct = sniff(buf.slice(0, 16));
  if (!ct || !lim.types.includes(ct)) return bad('File type is not allowed');

  const id = uid();
  const ext = { 'application/pdf': 'pdf', 'application/msword': 'doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' }[ct];
  const key = `applications/${appId}/${kind}-${id}.${ext}`;
  await env.FILES.put(key, buf, { httpMetadata: { contentType: ct } });
  const name = clean(decodeURIComponent(request.headers.get('x-file-name') || ''), 200) || `${kind}.${ext}`;
  await env.DB.prepare('INSERT INTO files (id, app_id, kind, r2_key, name, size, ct, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, appId, kind, key, name, buf.byteLength, ct, now()).run();
  return json({ ok: true, id });
}

export const onRequest = () => bad('Not found', 404);
