// GET /media/* – public site images stored in R2 under "media/" (uploaded from the admin panel).
export async function onRequestGet({ env, params }) {
  const name = (params.path || []).join('/');
  if (!env.FILES || !/^[\w\/.-]+\.(jpg|jpeg|png|webp)$/.test(name) || name.includes('..')) {
    return new Response('Not found', { status: 404 });
  }
  const obj = await env.FILES.get('media/' + name);
  if (!obj) return new Response('Not found', { status: 404 });
  return new Response(obj.body, {
    headers: { 'content-type': obj.httpMetadata?.contentType || 'image/jpeg', 'cache-control': 'public, max-age=86400' },
  });
}
