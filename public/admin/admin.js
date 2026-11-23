// Worknexa admin panel (plain JS, no build step).
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function api(path, opts = {}) {
    const res = await fetch('/api/admin/' + path, {
      method: opts.method || 'GET',
      headers: { 'content-type': 'application/json', 'x-wn-admin': '1' },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: 'same-origin',
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== 'login') { showAuth(); throw new Error('Not logged in'); }
    if (!res.ok) throw new Error(data.error || 'Gabim ' + res.status);
    return data;
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2200);
  }

  const STATUS = { new: 'E re', reviewing: 'Në shqyrtim', contacted: 'E kontaktuar', closed: 'E mbyllur' };
  const TYPE = { worker: 'Punëtor', employer: 'Punëdhënës', agency: 'Agjenci' };
  const FIELD = {
    name: 'Emri', company: 'Firma', profession: 'Profesioni', experience: 'Përvoja (vjet)', country: 'Vendi',
    languages: 'Gjuhët', phone: 'Telefoni', email: 'E-mail', sector: 'Sektori', quantity: 'Numri i punëtorëve',
    destination: 'Destinacioni', availability: 'Disponueshmëria', message: 'Mesazhi', video_link: 'Link videoje',
    interest: 'Interesi', consent_at: 'Pëlqimi më', vacancyId: 'Oferta e zgjedhur', sectorInterest: 'Sektori i zgjedhur',
  };
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleString('sq-AL', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; } };
  const fmtSize = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.round(b / 1024) + ' KB');

  // ---------- auth ----------
  let configured = true;
  function showAuth() {
    $('#nav').hidden = true;
    $$('.tab').forEach((t) => (t.hidden = true));
    $('#auth').hidden = false;
    $('#authTitle').textContent = configured ? 'Hyr në panel' : 'Krijo llogarinë e administratorit';
    $('#authHint').textContent = configured ? '' : 'Ky është hapi i parë dhe bëhet vetëm një herë. Zgjidhni e-mailin dhe një fjalëkalim të fortë (të paktën 10 shkronja).';
    $('#pw2wrap').hidden = configured;
    $('#authBtn').textContent = configured ? 'Hyr' : 'Krijo llogarinë';
    $('[name=password]').autocomplete = configured ? 'current-password' : 'new-password';
  }

  $('#authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    $('#authErr').textContent = '';
    if (!configured && f.password.value !== f.password2.value) { $('#authErr').textContent = 'Fjalëkalimet nuk përputhen.'; return; }
    try {
      await api(configured ? 'login' : 'setup', { method: 'POST', body: { email: f.email.value, password: f.password.value } });
      f.reset();
      start();
    } catch (err) { $('#authErr').textContent = err.message; }
  });

  async function start() {
    const s = await api('status');
    configured = s.configured;
    if (!s.loggedIn) return showAuth();
    $('#auth').hidden = true;
    $('#nav').hidden = false;
    $('#whoami').textContent = 'I kyçur si ' + s.email;
    openTab(location.hash.slice(1) || 'apps');
  }

  // ---------- tabs ----------
  const loaders = {};
  function openTab(name) {
    if (!$('#tab-' + name)) name = 'apps';
    $$('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.tab === name));
    $$('.tab').forEach((t) => (t.hidden = t.id !== 'tab-' + name));
    history.replaceState(null, '', '#' + name);
    loaders[name] && loaders[name]();
  }
  $$('#nav button').forEach((b) => b.addEventListener('click', () => openTab(b.dataset.tab)));

  // ---------- applications ----------
  let apps = [];
  loaders.apps = async () => {
    apps = (await api('applications')).items;
    renderApps();
  };

  function renderApps() {
    const q = $('#q').value.trim().toLowerCase();
    const st = $('#fStatus').value;
    const ty = $('#fType').value;
    const list = apps.filter((a) =>
      (!st || a.status === st) && (!ty || a.type === ty) &&
      (!q || JSON.stringify(a.data).toLowerCase().includes(q) || (a.note || '').toLowerCase().includes(q)));
    $('#newCount').textContent = apps.filter((a) => a.status === 'new').length || '';
    $('#apps').innerHTML = list.length ? list.map(appHtml).join('') : '<div class="empty">Nuk ka aplikime.</div>';
  }

  function appHtml(a) {
    const d = a.data;
    const title = d.name || d.company || '(pa emër)';
    const rows = Object.entries(d).filter(([k]) => k !== 'name').map(([k, v]) => {
      let val = esc(v);
      if (k === 'email') val = `<a href="mailto:${esc(v)}">${esc(v)}</a>`;
      if (k === 'phone') val = `<a href="tel:${esc(String(v).replace(/[^\d+]/g, ''))}">${esc(v)}</a> · <a href="https://wa.me/${esc(String(v).replace(/[^\d]/g, ''))}" target="_blank" rel="noopener">WhatsApp</a>`;
      if (k === 'video_link') val = `<a href="${esc(v)}" target="_blank" rel="noopener noreferrer">${esc(v)}</a>`;
      if (k === 'consent_at') val = esc(fmtDate(v));
      return `<dt>${esc(FIELD[k] || k)}</dt><dd>${val}</dd>`;
    }).join('');
    const media = a.files.map((f) => f.kind === 'photo'
      ? `<img src="/api/admin/files/${f.id}" alt="Foto" loading="lazy" data-full="/api/admin/files/${f.id}">`
      : `<video src="/api/admin/files/${f.id}" controls preload="metadata"></video>`).join('');
    const fileLinks = a.files.map((f) => `<a href="/api/admin/files/${f.id}?download=1">${f.kind === 'photo' ? 'Foto' : 'Video'} (${fmtSize(f.size)})</a>`).join(' · ');
    return `<article class="item st-${a.status}" data-id="${a.id}">
      <div class="row1">
        <div><h3>${esc(title)}</h3><div class="meta"><span class="tag">${esc(TYPE[a.type] || a.type)}</span> · ${esc(fmtDate(a.created_at))} · ${esc(a.id.slice(0, 8))}</div></div>
        <div class="ctrl">
          <select data-act="status" aria-label="Statusi">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === a.status ? 'selected' : ''}>${v}</option>`).join('')}</select>
        </div>
      </div>
      <dl>${rows}</dl>
      ${media ? `<div class="media">${media}</div><div class="meta">Shkarko: ${fileLinks}</div>` : ''}
      <div class="note"><textarea data-act="note" rows="2" placeholder="Shënimet tuaja (shihen vetëm këtu)…">${esc(a.note || '')}</textarea></div>
      <div class="more">
        ${a.type === 'worker' ? '<button class="ghost" data-act="tocand">Shto te kandidatët në faqe</button>' : ''}
        ${a.files.length ? '<button class="danger" data-act="delfiles">Fshi fotot/videon</button>' : ''}
        <button class="danger" data-act="delete">Fshi aplikimin</button>
      </div>
    </article>`;
  }

  ['#q', '#fStatus', '#fType'].forEach((s) => $(s).addEventListener('input', renderApps));

  $('#apps').addEventListener('change', async (e) => {
    const card = e.target.closest('.item'); if (!card) return;
    const a = apps.find((x) => x.id === card.dataset.id);
    if (e.target.dataset.act === 'status') {
      await api('applications/' + a.id, { method: 'PATCH', body: { status: e.target.value } });
      a.status = e.target.value; card.className = 'item st-' + a.status;
      $('#newCount').textContent = apps.filter((x) => x.status === 'new').length || '';
      toast('Statusi u ruajt');
    }
    if (e.target.dataset.act === 'note') {
      await api('applications/' + a.id, { method: 'PATCH', body: { note: e.target.value } });
      a.note = e.target.value; toast('Shënimi u ruajt');
    }
  });

  $('#apps').addEventListener('click', async (e) => {
    const img = e.target.closest('img[data-full]');
    if (img) { $('#lightbox .lb-body').innerHTML = `<img src="${img.dataset.full}" alt="">`; $('#lightbox').hidden = false; return; }
    const act = e.target.dataset.act; if (!act) return;
    const card = e.target.closest('.item');
    const a = apps.find((x) => x.id === card.dataset.id);
    if (act === 'delete') {
      if (!confirm('Ta fshij përgjithmonë këtë aplikim bashkë me fotot dhe videon? Nuk kthehet më.')) return;
      await api('applications/' + a.id, { method: 'DELETE' });
      apps = apps.filter((x) => x !== a); renderApps(); toast('Aplikimi u fshi');
    }
    if (act === 'delfiles') {
      if (!confirm('Të fshihen përgjithmonë fotot dhe videoja e këtij aplikimi?')) return;
      await api('applications/' + a.id + '/files', { method: 'DELETE' });
      a.files = []; renderApps(); toast('Skedarët u fshinë');
    }
    if (act === 'tocand') {
      const d = a.data;
      const f = $('#candForm');
      f.reset();
      f.id.value = '';
      f.profession.value = d.profession || '';
      f.experience.value = d.experience ? d.experience + (/^\d+$/.test(d.experience) ? ' vjet' : '') : '';
      f.location.value = d.country || '';
      f.languages.value = d.languages || '';
      f.app_id.value = a.id;
      openTab('cands');
      toast('Plotësoni dhe kontrolloni të dhënat, pastaj ruani');
    }
  });

  $('#lightbox').addEventListener('click', () => ($('#lightbox').hidden = true));

  $('#exportCsv').addEventListener('click', () => {
    const keys = ['type', 'status', 'created_at', ...Object.keys(FIELD).filter((k) => k !== 'consent_at')];
    const lines = [keys.join(';')];
    for (const a of apps) {
      lines.push(keys.map((k) => {
        const v = k in a ? a[k] : a.data[k];
        return '"' + String(v ?? '').replace(/"/g, '""') + '"';
      }).join(';'));
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'worknexa-aplikimet-' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
  });

  // ---------- candidates ----------
  const CSTATUS = { available: 'I disponueshëm', interviewing: 'Në intervistë', placed: 'I punësuar' };
  let cands = [];
  loaders.cands = async () => {
    cands = (await api('candidates')).items;
    $('#cands').innerHTML = cands.length ? cands.map((c) => `
      <article class="item" data-id="${c.id}">
        <div class="row1">
          <div><h3>${esc(c.code)} · ${esc(c.profession)}</h3>
          <div class="meta">${esc([c.experience, c.location, c.nationality, c.languages].filter(Boolean).join(' · '))}</div></div>
          <div class="ctrl"><span class="tag">${esc(CSTATUS[c.status] || c.status)}</span><span class="tag">${c.published ? 'Në faqe' : 'I fshehur'}</span></div>
        </div>
        <div class="more">
          <button class="ghost" data-act="edit">Ndrysho</button>
          <button class="ghost" data-act="toggle">${c.published ? 'Fshihe nga faqja' : 'Shfaqe në faqe'}</button>
          <button class="ghost" data-act="up">↑</button><button class="ghost" data-act="down">↓</button>
          <button class="danger" data-act="delete">Fshi</button>
        </div>
      </article>`).join('') : '<div class="empty">Ende nuk ka kandidatë në faqe.</div>';
  };

  $('#candForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const body = {
      code: f.code.value, profession: f.profession.value, experience: f.experience.value, location: f.location.value,
      nationality: f.nationality.value, languages: f.languages.value, status: f.status.value, published: f.published.checked, app_id: f.app_id.value,
    };
    try {
      if (f.id.value) await api('candidates/' + f.id.value, { method: 'PATCH', body });
      else await api('candidates', { method: 'POST', body });
      f.reset(); f.id.value = ''; f.app_id.value = '';
      $('#candErr').textContent = '';
      toast('Kandidati u ruajt'); loaders.cands();
    } catch (err) { $('#candErr').textContent = err.message; }
  });
  $('#candForm').addEventListener('reset', (e) => { e.target.id.value = ''; e.target.app_id.value = ''; });

  $('#cands').addEventListener('click', async (e) => {
    const act = e.target.dataset.act; if (!act) return;
    const id = e.target.closest('.item').dataset.id;
    const i = cands.findIndex((c) => c.id === id);
    const c = cands[i];
    if (act === 'edit') {
      const f = $('#candForm');
      ['id', 'code', 'profession', 'experience', 'location', 'nationality', 'languages', 'status'].forEach((k) => (f[k].value = c[k] || ''));
      f.published.checked = !!c.published;
      f.scrollIntoView({ behavior: 'smooth' });
    }
    if (act === 'toggle') { await api('candidates/' + id, { method: 'PATCH', body: { published: !c.published } }); loaders.cands(); }
    if (act === 'delete') {
      if (!confirm('Ta heq kandidatin ' + c.code + ' nga faqja dhe nga lista?')) return;
      await api('candidates/' + id, { method: 'DELETE' }); loaders.cands();
    }
    if (act === 'up' || act === 'down') {
      const j = act === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= cands.length) return;
      [cands[i], cands[j]] = [cands[j], cands[i]];
      await Promise.all(cands.map((x, k) => api('candidates/' + x.id, { method: 'PATCH', body: { sort: k } })));
      loaders.cands();
    }
  });

  // ---------- jobs ----------
  let jobs = [];
  loaders.jobs = async () => {
    jobs = (await api('jobs')).items;
    $('#jobs').innerHTML = jobs.length ? jobs.map((j) => `
      <article class="item" data-id="${j.id}">
        <div class="row1">
          <div><h3>${esc(j.title)}</h3><div class="meta">${esc([j.country, j.sector, j.pay].filter(Boolean).join(' · '))} · ${esc(fmtDate(j.created_at))}</div></div>
          <div class="ctrl"><span class="tag">${j.published ? 'Publikuar' : 'Draft'}</span></div>
        </div>
        ${j.description ? `<p>${esc(j.description).replace(/\n/g, '<br>')}</p>` : ''}
        <div class="more">
          <button class="ghost" data-act="edit">Ndrysho</button>
          <button class="ghost" data-act="toggle">${j.published ? 'Hiqe nga faqja' : 'Publikoje'}</button>
          <button class="danger" data-act="delete">Fshi</button>
        </div>
      </article>`).join('') : '<div class="empty">Ende nuk ka oferta.</div>';
  };

  $('#jobForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const body = { title: f.title.value, country: f.country.value, sector: f.sector.value, pay: f.pay.value, description: f.description.value, published: f.published.checked };
    try {
      if (f.id.value) await api('jobs/' + f.id.value, { method: 'PATCH', body });
      else await api('jobs', { method: 'POST', body });
      f.reset(); f.id.value = ''; $('#jobErr').textContent = '';
      toast('Oferta u ruajt'); loaders.jobs();
    } catch (err) { $('#jobErr').textContent = err.message; }
  });
  $('#jobForm').addEventListener('reset', (e) => (e.target.id.value = ''));

  $('#jobs').addEventListener('click', async (e) => {
    const act = e.target.dataset.act; if (!act) return;
    const id = e.target.closest('.item').dataset.id;
    const j = jobs.find((x) => x.id === id);
    if (act === 'edit') {
      const f = $('#jobForm');
      ['id', 'title', 'country', 'sector', 'pay', 'description'].forEach((k) => (f[k].value = j[k] || ''));
      f.published.checked = !!j.published;
      f.scrollIntoView({ behavior: 'smooth' });
    }
    if (act === 'toggle') { await api('jobs/' + id, { method: 'PATCH', body: { published: !j.published } }); loaders.jobs(); }
    if (act === 'delete') {
      if (!confirm('Ta fshij këtë ofertë?')) return;
      await api('jobs/' + id, { method: 'DELETE' }); loaders.jobs();
    }
  });

  // ---------- texts ----------
  const LANGS = ['en', 'sq', 'de', 'sl', 'fr', 'it', 'zh', 'be', 'ro-MD', 'ru', 'uz'];
  const SECTIONS = { vacancy: 'Oferta e Gjatani Construction (blloku i madh)', jobs: 'Lista "Vende pune" (ofertat nga paneli)', candidates: 'Seksioni "Kandidatët"' };
  let overrides = [];
  loaders.texts = async () => {
    overrides = (await api('texts')).items;
    const lang = $('#tLang').value;
    const res = await fetch((lang === 'en' ? '/' : '/' + lang + '/') + '?raw=1', { cache: 'no-store' });
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const mine = Object.fromEntries(overrides.filter((o) => o.lang === lang).map((o) => [o.key, o.value]));

    $('#sections').innerHTML = '<h2>Seksionet</h2>' + Object.entries(SECTIONS).map(([k, label]) => {
      const hidden = overrides.some((o) => o.key === 'hide.' + k && o.value === '1');
      return `<label class="check"><input type="checkbox" data-sec="${k}" ${hidden ? '' : 'checked'}> ${esc(label)} – shfaqe në faqe</label>`;
    }).join('');

    const seen = new Set();
    const rows = [];
    for (const el of doc.querySelectorAll('[data-wn]')) {
      const key = el.getAttribute('data-wn');
      if (seen.has(key)) continue;
      seen.add(key);
      const original = el.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim();
      const label = el.getAttribute('data-wn-label') || key;
      const cur = mine[key] ?? original;
      rows.push(`<div class="text-row" data-key="${esc(key)}" data-orig="${esc(original)}">
        <div class="k"><span>${esc(label)}</span>${key in mine ? '<span class="changed">ndryshuar</span>' : ''}</div>
        <textarea rows="${Math.min(6, Math.max(2, Math.ceil(cur.length / 90)))}">${esc(cur)}</textarea>
        <div class="more"><button class="primary" data-act="save">Ruaj</button>${key in mine ? '<button class="ghost" data-act="restore">Rikthe origjinalin</button>' : ''}</div>
      </div>`);
    }
    $('#texts').innerHTML = rows.join('') || '<div class="empty">Nuk u gjetën tekste.</div>';
  };
  $('#tLang').addEventListener('change', loaders.texts);

  $('#texts').addEventListener('click', async (e) => {
    const act = e.target.dataset.act; if (!act) return;
    const row = e.target.closest('.text-row');
    const lang = $('#tLang').value;
    const key = row.dataset.key;
    let value = act === 'restore' ? '' : row.querySelector('textarea').value.trim();
    if (value === row.dataset.orig) value = '';
    await api('texts', { method: 'PUT', body: { lang, key, value } });
    toast(act === 'restore' ? 'U rikthye teksti origjinal' : 'Teksti u ruajt');
    loaders.texts();
  });

  $('#sections').addEventListener('change', async (e) => {
    const k = e.target.dataset.sec; if (!k) return;
    const value = e.target.checked ? '' : '1';
    await Promise.all(LANGS.map((lang) => api('texts', { method: 'PUT', body: { lang, key: 'hide.' + k, value } })));
    toast(e.target.checked ? 'Seksioni shfaqet' : 'Seksioni u fsheh');
    overrides = (await api('texts')).items;
  });

  // ---------- account ----------
  $('#pwForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    try {
      await api('password', { method: 'POST', body: { current: f.current.value, next: f.next.value } });
      f.reset(); $('#pwErr').textContent = ''; toast('Fjalëkalimi u ndryshua');
    } catch (err) { $('#pwErr').textContent = err.message; }
  });
  $('#importBtn').addEventListener('click', async () => {
    try {
      const items = JSON.parse($('#importJson').value);
      const r = await api('import', { method: 'POST', body: { items: Array.isArray(items) ? items : items.items } });
      $('#importMsg').textContent = 'U importuan ' + r.added + ' aplikime.';
      $('#importJson').value = '';
    } catch (err) { $('#importMsg').textContent = err.message; }
  });
  $('#logout').addEventListener('click', async () => { await api('logout', { method: 'POST' }); location.reload(); });

  start().catch(() => showAuth());
})();
