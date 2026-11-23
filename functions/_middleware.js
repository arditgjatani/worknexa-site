// Runs for every request: applies admin-edited texts to the HTML pages and adds security headers.
import { ensureSchema } from '../lib/core.js';

const LANGS = ['sq', 'de', 'sl', 'fr', 'it', 'zh', 'be', 'ro-MD', 'ru', 'uz'];

const langOf = (pathname) => {
  const seg = pathname.split('/')[1];
  return LANGS.includes(seg) ? seg : 'en';
};

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function onRequest({ request, env, next }) {
  const res = await next();
  const url = new URL(request.url);
  const headers = new Headers(res.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('x-frame-options', 'SAMEORIGIN');
  if (url.pathname.startsWith('/admin')) {
    headers.set('x-robots-tag', 'noindex, nofollow');
    headers.set('cache-control', 'no-store');
  }

  const ct = res.headers.get('content-type') || '';
  // ?raw=1 shows the original texts (used by the admin panel to offer "restore original").
  if (!ct.includes('text/html') || url.pathname.startsWith('/admin') || !env.DB || url.searchParams.get('raw') === '1') {
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }

  let overrides = {};
  try {
    await ensureSchema(env);
    const rows = await env.DB.prepare('SELECT key, value FROM texts WHERE lang = ?').bind(langOf(url.pathname)).all();
    for (const r of rows.results) overrides[r.key] = r.value;
  } catch {
    overrides = {};
  }
  const out = new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  if (!Object.keys(overrides).length) return out;

  return new HTMLRewriter()
    .on('[data-wn-section]', {
      element(el) {
        // Sections can be hidden from the admin panel ("hide.<name>" = "1").
        if (overrides['hide.' + el.getAttribute('data-wn-section')] === '1') el.remove();
      },
    })
    .on('[data-wn]', {
      element(el) {
        const key = el.getAttribute('data-wn');
        if (!(key in overrides)) return;
        const v = overrides[key];
        const href = el.getAttribute('data-wn-href');
        if (href === 'mailto') el.setAttribute('href', 'mailto:' + v);
        if (href === 'wa') el.setAttribute('href', 'https://wa.me/' + v.replace(/[^\d]/g, ''));
        // Line breaks typed in the admin become <br>.
        el.setInnerContent(escapeHtml(v).replace(/\n/g, '<br>'), { html: true });
      },
    })
    .transform(out);
}
