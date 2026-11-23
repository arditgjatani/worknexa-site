// GET /api/candphoto/:id – public picture of a published candidate card (uploaded by the admin).
import { bad, ensureSchema } from '../../../lib/core.js';

export async function onRequestGet({ env, params }) {
  await ensureSchema(env);
  const c = await env.DB.prepare('SELECT photo, published FROM candidates WHERE id = ?').bind(params.id).first();
  if (!c || !c.published || !c.photo || !c.photo.startsWith('r2:') || !env.FILES) return bad('Not found', 404);
  const obj = await env.FILES.get(c.photo.slice(3));
  if (!obj) return bad('Not found', 404);
  return new Response(obj.body, {
    headers: { 'content-type': obj.httpMetadata?.contentType || 'image/jpeg', 'cache-control': 'public, max-age=300' },
  });
}
