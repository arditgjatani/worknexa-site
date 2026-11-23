// Worknexa extras: candidate photo/video upload, "Candidates" and "Vacancies" sections from the admin panel.
(() => {
  const LANG = (document.documentElement.lang || 'en').replace('_', '-');
  const T = {
    en: { yrs: 'years', photos: 'Photos (optional)', photosHint: 'Up to 3 photos, JPG/PNG/WEBP, max 5 MB each.', video: 'Short video introduction (optional)', videoHint: 'One video up to 60 seconds and 50 MB (MP4, MOV, WEBM).', link: 'Or paste a video link (YouTube / Google Drive)', tooBig: 'File is too large:', badType: 'File type not allowed:', tooLong: 'The video is longer than 60 seconds.', tooMany: 'You can add up to 3 photos.', uploading: 'Uploading files…', uploadFail: 'Your registration was saved, but some files could not be uploaded. You can send them by WhatsApp.', remove: 'Remove',
      cEyebrow: 'Available candidates', cTitle: 'Workers ready for your team.', cText: 'Pre-registered candidates looking for work in Slovenia, Belgium and across Europe. Request a candidate and we will send you the full profile and arrange an introduction.', cExp: 'Experience', cLoc: 'Currently in', cNat: 'Nationality', cLang: 'Languages', cBtn: 'Request this candidate →', cNote: "Profiles are shown without names or contact details to protect candidates' privacy. Full CVs are shared only with registered employers, with the candidate's consent.", cMsg: 'I am interested in candidate', st: { available: 'Available', interviewing: 'Interviewing', placed: 'Placed' },
      jEyebrow: 'Vacancies', jTitle: 'Open positions', jBtn: 'Apply →', jMsg: 'I am interested in the vacancy:' },
    sq: { yrs: 'vjet', photos: 'Foto (jo e detyrueshme)', photosHint: 'Deri në 3 foto, JPG/PNG/WEBP, deri në 5 MB secila.', video: 'Video e shkurtër prezantimi (jo e detyrueshme)', videoHint: 'Një video deri në 60 sekonda dhe 50 MB (MP4, MOV, WEBM).', link: 'Ose vendosni një link videoje (YouTube / Google Drive)', tooBig: 'Skedari është shumë i madh:', badType: 'Ky lloj skedari nuk lejohet:', tooLong: 'Videoja është më e gjatë se 60 sekonda.', tooMany: 'Mund të shtoni deri në 3 foto.', uploading: 'Po ngarkohen skedarët…', uploadFail: 'Regjistrimi u ruajt, por disa skedarë nuk u ngarkuan. Mund t’i dërgoni me WhatsApp.', remove: 'Hiq',
      cEyebrow: 'Kandidatë të disponueshëm', cTitle: 'Punëtorë gati për ekipin tuaj.', cText: 'Kandidatë të regjistruar që kërkojnë punë në Slloveni, Belgjikë dhe në gjithë Evropën. Kërkoni një kandidat dhe ne ju dërgojmë profilin e plotë dhe organizojmë njohjen.', cExp: 'Përvoja', cLoc: 'Ndodhet në', cNat: 'Shtetësia', cLang: 'Gjuhët', cBtn: 'Kërko këtë kandidat →', cNote: 'Profilet shfaqen pa emra dhe kontakte për të mbrojtur privatësinë e kandidatëve. CV-të e plota u jepen vetëm punëdhënësve të regjistruar, me pëlqimin e kandidatit.', cMsg: 'Jam i interesuar për kandidatin', st: { available: 'I disponueshëm', interviewing: 'Në intervistë', placed: 'I punësuar' },
      jEyebrow: 'Vende pune', jTitle: 'Pozicione të hapura', jBtn: 'Apliko →', jMsg: 'Jam i interesuar për vendin e punës:' },
    de: { yrs: 'Jahre', photos: 'Fotos (optional)', photosHint: 'Bis zu 3 Fotos, JPG/PNG/WEBP, je max. 5 MB.', video: 'Kurzes Vorstellungsvideo (optional)', videoHint: 'Ein Video bis 60 Sekunden und 50 MB (MP4, MOV, WEBM).', link: 'Oder Videolink einfügen (YouTube / Google Drive)', tooBig: 'Datei ist zu groß:', badType: 'Dateityp nicht erlaubt:', tooLong: 'Das Video ist länger als 60 Sekunden.', tooMany: 'Sie können bis zu 3 Fotos hinzufügen.', uploading: 'Dateien werden hochgeladen…', uploadFail: 'Ihre Registrierung wurde gespeichert, aber einige Dateien konnten nicht hochgeladen werden. Sie können sie per WhatsApp senden.', remove: 'Entfernen',
      cEyebrow: 'Verfügbare Kandidaten', cTitle: 'Arbeitskräfte für Ihr Team.', cText: 'Registrierte Kandidaten, die Arbeit in Slowenien, Belgien und ganz Europa suchen. Fordern Sie einen Kandidaten an – wir senden Ihnen das vollständige Profil und organisieren ein Kennenlernen.', cExp: 'Erfahrung', cLoc: 'Aktuell in', cNat: 'Staatsangehörigkeit', cLang: 'Sprachen', cBtn: 'Kandidat anfragen →', cNote: 'Profile werden zum Schutz der Privatsphäre ohne Namen und Kontaktdaten angezeigt. Vollständige Lebensläufe erhalten nur registrierte Arbeitgeber mit Zustimmung des Kandidaten.', cMsg: 'Ich interessiere mich für Kandidat', st: { available: 'Verfügbar', interviewing: 'Im Gespräch', placed: 'Vermittelt' },
      jEyebrow: 'Stellenangebote', jTitle: 'Offene Stellen', jBtn: 'Bewerben →', jMsg: 'Ich interessiere mich für die Stelle:' },
    sl: { yrs: 'let', photos: 'Fotografije (neobvezno)', photosHint: 'Do 3 fotografije, JPG/PNG/WEBP, največ 5 MB vsaka.', video: 'Kratek predstavitveni video (neobvezno)', videoHint: 'En video do 60 sekund in 50 MB (MP4, MOV, WEBM).', link: 'Ali prilepite povezavo do videa (YouTube / Google Drive)', tooBig: 'Datoteka je prevelika:', badType: 'Vrsta datoteke ni dovoljena:', tooLong: 'Video je daljši od 60 sekund.', tooMany: 'Dodate lahko največ 3 fotografije.', uploading: 'Nalaganje datotek…', uploadFail: 'Vaša prijava je shranjena, nekaterih datotek pa ni bilo mogoče naložiti. Pošljete jih lahko prek WhatsAppa.', remove: 'Odstrani',
      cEyebrow: 'Razpoložljivi kandidati', cTitle: 'Delavci, pripravljeni za vašo ekipo.', cText: 'Prijavljeni kandidati, ki iščejo delo v Sloveniji, Belgiji in po vsej Evropi. Zaprosite za kandidata in poslali vam bomo celoten profil ter uredili predstavitev.', cExp: 'Izkušnje', cLoc: 'Trenutno v', cNat: 'Državljanstvo', cLang: 'Jeziki', cBtn: 'Zaprosi za kandidata →', cNote: 'Profili so prikazani brez imen in kontaktov zaradi varstva zasebnosti. Celotni življenjepisi so na voljo le prijavljenim delodajalcem, s soglasjem kandidata.', cMsg: 'Zanima me kandidat', st: { available: 'Na voljo', interviewing: 'V razgovoru', placed: 'Zaposlen' },
      jEyebrow: 'Prosta delovna mesta', jTitle: 'Odprta delovna mesta', jBtn: 'Prijavi se →', jMsg: 'Zanima me delovno mesto:' },
    fr: { yrs: 'ans', photos: 'Photos (facultatif)', photosHint: 'Jusqu’à 3 photos, JPG/PNG/WEBP, 5 Mo max. chacune.', video: 'Courte vidéo de présentation (facultatif)', videoHint: 'Une vidéo de 60 secondes et 50 Mo maximum (MP4, MOV, WEBM).', link: 'Ou collez un lien vidéo (YouTube / Google Drive)', tooBig: 'Fichier trop volumineux :', badType: 'Type de fichier non autorisé :', tooLong: 'La vidéo dépasse 60 secondes.', tooMany: 'Vous pouvez ajouter jusqu’à 3 photos.', uploading: 'Envoi des fichiers…', uploadFail: 'Votre inscription est enregistrée, mais certains fichiers n’ont pas pu être envoyés. Vous pouvez les envoyer par WhatsApp.', remove: 'Retirer',
      cEyebrow: 'Candidats disponibles', cTitle: 'Des travailleurs prêts pour votre équipe.', cText: 'Des candidats inscrits qui recherchent un emploi en Slovénie, en Belgique et dans toute l’Europe. Demandez un candidat : nous vous envoyons le profil complet et organisons une présentation.', cExp: 'Expérience', cLoc: 'Actuellement en', cNat: 'Nationalité', cLang: 'Langues', cBtn: 'Demander ce candidat →', cNote: 'Les profils sont affichés sans nom ni coordonnées pour protéger la vie privée des candidats. Les CV complets ne sont transmis qu’aux employeurs inscrits, avec l’accord du candidat.', cMsg: 'Je suis intéressé par le candidat', st: { available: 'Disponible', interviewing: 'En entretien', placed: 'Placé' },
      jEyebrow: 'Offres d’emploi', jTitle: 'Postes ouverts', jBtn: 'Postuler →', jMsg: 'Je suis intéressé par l’offre :' },
    it: { yrs: 'anni', photos: 'Foto (facoltativo)', photosHint: 'Fino a 3 foto, JPG/PNG/WEBP, max 5 MB ciascuna.', video: 'Breve video di presentazione (facoltativo)', videoHint: 'Un video fino a 60 secondi e 50 MB (MP4, MOV, WEBM).', link: 'Oppure incolla un link al video (YouTube / Google Drive)', tooBig: 'File troppo grande:', badType: 'Tipo di file non consentito:', tooLong: 'Il video supera i 60 secondi.', tooMany: 'Puoi aggiungere fino a 3 foto.', uploading: 'Caricamento dei file…', uploadFail: 'La registrazione è stata salvata, ma alcuni file non sono stati caricati. Puoi inviarli via WhatsApp.', remove: 'Rimuovi',
      cEyebrow: 'Candidati disponibili', cTitle: 'Lavoratori pronti per il tuo team.', cText: 'Candidati registrati che cercano lavoro in Slovenia, Belgio e in tutta Europa. Richiedi un candidato: ti invieremo il profilo completo e organizzeremo una presentazione.', cExp: 'Esperienza', cLoc: 'Attualmente in', cNat: 'Nazionalità', cLang: 'Lingue', cBtn: 'Richiedi questo candidato →', cNote: 'I profili sono mostrati senza nomi né contatti per tutelare la privacy dei candidati. I CV completi sono condivisi solo con datori di lavoro registrati, con il consenso del candidato.', cMsg: 'Sono interessato al candidato', st: { available: 'Disponibile', interviewing: 'In colloquio', placed: 'Collocato' },
      jEyebrow: 'Offerte di lavoro', jTitle: 'Posizioni aperte', jBtn: 'Candidati →', jMsg: 'Sono interessato all’offerta:' },
    zh: { yrs: '年', photos: '照片（可选）', photosHint: '最多3张照片，JPG/PNG/WEBP，每张不超过5 MB。', video: '简短自我介绍视频（可选）', videoHint: '一个视频，不超过60秒和50 MB（MP4、MOV、WEBM）。', link: '或粘贴视频链接（YouTube / Google Drive）', tooBig: '文件过大：', badType: '不允许的文件类型：', tooLong: '视频超过60秒。', tooMany: '最多可添加3张照片。', uploading: '正在上传文件…', uploadFail: '您的登记已保存，但部分文件未能上传。您可以通过WhatsApp发送。', remove: '删除',
      cEyebrow: '可用候选人', cTitle: '为您的团队准备好的工人。', cText: '已登记的候选人，正在寻找斯洛文尼亚、比利时及欧洲各地的工作。申请候选人后，我们将发送完整资料并安排介绍。', cExp: '经验', cLoc: '目前所在地', cNat: '国籍', cLang: '语言', cBtn: '申请此候选人 →', cNote: '为保护候选人隐私，资料不显示姓名和联系方式。完整简历仅在候选人同意后提供给已登记的雇主。', cMsg: '我对以下候选人感兴趣', st: { available: '可用', interviewing: '面试中', placed: '已安置' },
      jEyebrow: '职位空缺', jTitle: '招聘职位', jBtn: '申请 →', jMsg: '我对以下职位感兴趣：' },
    be: { yrs: 'гадоў', photos: 'Фота (неабавязкова)', photosHint: 'Да 3 фота, JPG/PNG/WEBP, да 5 МБ кожнае.', video: 'Кароткае відэа-прадстаўленне (неабавязкова)', videoHint: 'Адно відэа да 60 секунд і 50 МБ (MP4, MOV, WEBM).', link: 'Або ўстаўце спасылку на відэа (YouTube / Google Drive)', tooBig: 'Файл занадта вялікі:', badType: 'Тып файла не дазволены:', tooLong: 'Відэа даўжэйшае за 60 секунд.', tooMany: 'Можна дадаць да 3 фота.', uploading: 'Загрузка файлаў…', uploadFail: 'Вашая рэгістрацыя захавана, але некаторыя файлы не загрузіліся. Іх можна даслаць праз WhatsApp.', remove: 'Выдаліць',
      cEyebrow: 'Даступныя кандыдаты', cTitle: 'Работнікі, гатовыя для вашай каманды.', cText: 'Зарэгістраваныя кандыдаты, якія шукаюць працу ў Славеніі, Бельгіі і па ўсёй Еўропе. Запытайце кандыдата — мы дашлём поўны профіль і арганізуем знаёмства.', cExp: 'Досвед', cLoc: 'Цяпер у', cNat: 'Грамадзянства', cLang: 'Мовы', cBtn: 'Запытаць кандыдата →', cNote: 'Профілі паказваюцца без імёнаў і кантактаў дзеля абароны прыватнасці. Поўныя рэзюмэ перадаюцца толькі зарэгістраваным працадаўцам са згоды кандыдата.', cMsg: 'Мяне цікавіць кандыдат', st: { available: 'Даступны', interviewing: 'На сумоўі', placed: 'Працаўладкаваны' },
      jEyebrow: 'Вакансіі', jTitle: 'Адкрытыя пазіцыі', jBtn: 'Падаць заяўку →', jMsg: 'Мяне цікавіць вакансія:' },
    'ro-MD': { yrs: 'ani', photos: 'Fotografii (opțional)', photosHint: 'Până la 3 fotografii, JPG/PNG/WEBP, max. 5 MB fiecare.', video: 'Scurt video de prezentare (opțional)', videoHint: 'Un video de până la 60 de secunde și 50 MB (MP4, MOV, WEBM).', link: 'Sau lipiți un link video (YouTube / Google Drive)', tooBig: 'Fișierul este prea mare:', badType: 'Tip de fișier nepermis:', tooLong: 'Videoclipul depășește 60 de secunde.', tooMany: 'Puteți adăuga până la 3 fotografii.', uploading: 'Se încarcă fișierele…', uploadFail: 'Înregistrarea a fost salvată, dar unele fișiere nu au putut fi încărcate. Le puteți trimite pe WhatsApp.', remove: 'Elimină',
      cEyebrow: 'Candidați disponibili', cTitle: 'Muncitori pregătiți pentru echipa dvs.', cText: 'Candidați înregistrați care caută de lucru în Slovenia, Belgia și în toată Europa. Solicitați un candidat și vă trimitem profilul complet și organizăm o întâlnire.', cExp: 'Experiență', cLoc: 'În prezent în', cNat: 'Cetățenie', cLang: 'Limbi', cBtn: 'Solicitați acest candidat →', cNote: 'Profilurile sunt afișate fără nume și date de contact pentru a proteja viața privată. CV-urile complete sunt transmise doar angajatorilor înregistrați, cu acordul candidatului.', cMsg: 'Sunt interesat de candidatul', st: { available: 'Disponibil', interviewing: 'La interviu', placed: 'Angajat' },
      jEyebrow: 'Locuri de muncă', jTitle: 'Posturi deschise', jBtn: 'Aplică →', jMsg: 'Sunt interesat de postul:' },
    ru: { yrs: 'лет', photos: 'Фото (необязательно)', photosHint: 'До 3 фото, JPG/PNG/WEBP, до 5 МБ каждое.', video: 'Короткое видео-представление (необязательно)', videoHint: 'Одно видео до 60 секунд и 50 МБ (MP4, MOV, WEBM).', link: 'Или вставьте ссылку на видео (YouTube / Google Drive)', tooBig: 'Файл слишком большой:', badType: 'Тип файла не разрешён:', tooLong: 'Видео длиннее 60 секунд.', tooMany: 'Можно добавить до 3 фото.', uploading: 'Загрузка файлов…', uploadFail: 'Ваша регистрация сохранена, но некоторые файлы не загрузились. Их можно отправить через WhatsApp.', remove: 'Удалить',
      cEyebrow: 'Доступные кандидаты', cTitle: 'Работники, готовые для вашей команды.', cText: 'Зарегистрированные кандидаты, ищущие работу в Словении, Бельгии и по всей Европе. Запросите кандидата — мы пришлём полный профиль и организуем знакомство.', cExp: 'Опыт', cLoc: 'Сейчас в', cNat: 'Гражданство', cLang: 'Языки', cBtn: 'Запросить кандидата →', cNote: 'Профили показаны без имён и контактов для защиты конфиденциальности. Полные резюме передаются только зарегистрированным работодателям с согласия кандидата.', cMsg: 'Меня интересует кандидат', st: { available: 'Доступен', interviewing: 'На собеседовании', placed: 'Трудоустроен' },
      jEyebrow: 'Вакансии', jTitle: 'Открытые позиции', jBtn: 'Откликнуться →', jMsg: 'Меня интересует вакансия:' },
    uz: { yrs: 'yil', photos: 'Rasmlar (ixtiyoriy)', photosHint: '3 tagacha rasm, JPG/PNG/WEBP, har biri 5 MB gacha.', video: 'Qisqa tanishtiruv videosi (ixtiyoriy)', videoHint: '60 soniya va 50 MB gacha bitta video (MP4, MOV, WEBM).', link: 'Yoki video havolasini qo‘ying (YouTube / Google Drive)', tooBig: 'Fayl juda katta:', badType: 'Bu fayl turi ruxsat etilmagan:', tooLong: 'Video 60 soniyadan uzun.', tooMany: '3 tagacha rasm qo‘shishingiz mumkin.', uploading: 'Fayllar yuklanmoqda…', uploadFail: 'Ro‘yxatdan o‘tishingiz saqlandi, lekin ba’zi fayllar yuklanmadi. Ularni WhatsApp orqali yuborishingiz mumkin.', remove: 'O‘chirish',
      cEyebrow: 'Mavjud nomzodlar', cTitle: 'Jamoangiz uchun tayyor ishchilar.', cText: 'Sloveniya, Belgiya va butun Yevropada ish qidirayotgan ro‘yxatdan o‘tgan nomzodlar. Nomzodni so‘rang — biz to‘liq profilni yuboramiz va tanishuvni tashkil qilamiz.', cExp: 'Tajriba', cLoc: 'Hozir', cNat: 'Fuqarolik', cLang: 'Tillar', cBtn: 'Ushbu nomzodni so‘rash →', cNote: 'Nomzodlarning maxfiyligini himoya qilish uchun profillar ism va aloqa ma’lumotlarisiz ko‘rsatiladi. To‘liq rezyumelar faqat nomzod roziligi bilan ro‘yxatdan o‘tgan ish beruvchilarga beriladi.', cMsg: 'Men ushbu nomzodga qiziqaman', st: { available: 'Mavjud', interviewing: 'Suhbatda', placed: 'Ishga joylashgan' },
      jEyebrow: 'Bo‘sh ish o‘rinlari', jTitle: 'Ochiq lavozimlar', jBtn: 'Ariza berish →', jMsg: 'Men ushbu ish o‘rniga qiziqaman:' },
  };
  const t = T[LANG] || T[LANG.split('-')[0]] || T.en;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------------- upload fields on the candidate form ----------------
  const LIM = { photo: { n: 3, bytes: 5 * 1048576, types: ['image/jpeg', 'image/png', 'image/webp'] }, video: { n: 1, bytes: 50 * 1048576, types: ['video/mp4', 'video/quicktime', 'video/webm'], secs: 60 } };
  const picked = { photo: [], video: [] };
  let uploadBox = null;

  function buildUploadBox() {
    const box = document.createElement('div');
    box.className = 'wn-upload';
    box.innerHTML = `
      <label class="wn-field"><span>${esc(t.photos)}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple data-kind="photo">
        <small>${esc(t.photosHint)}</small></label>
      <div class="wn-previews" data-prev="photo"></div>
      <label class="wn-field"><span>${esc(t.video)}</span>
        <input type="file" accept="video/mp4,video/quicktime,video/webm" data-kind="video">
        <small>${esc(t.videoHint)}</small></label>
      <div class="wn-previews" data-prev="video"></div>
      <label class="wn-field"><span>${esc(t.link)}</span>
        <input type="url" name="video_link" placeholder="https://"></label>
      <p class="wn-err" role="alert"></p>
      <div class="wn-progress" hidden><div></div><span>${esc(t.uploading)}</span></div>`;
    box.addEventListener('change', onPick);
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rm]'); if (!b) return;
      e.preventDefault();
      const [kind, i] = b.dataset.rm.split(':');
      picked[kind].splice(+i, 1);
      renderPreviews();
    });
    return box;
  }

  const videoDuration = (file) => new Promise((res) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); res(v.duration); };
    v.onerror = () => res(0);
    v.src = URL.createObjectURL(file);
  });

  async function onPick(e) {
    const input = e.target;
    const kind = input.dataset.kind;
    if (!kind) return;
    const err = uploadBox.querySelector('.wn-err');
    err.textContent = '';
    for (const f of [...input.files]) {
      const L = LIM[kind];
      if (!L.types.includes(f.type)) { err.textContent = `${t.badType} ${f.name}`; continue; }
      if (f.size > L.bytes) { err.textContent = `${t.tooBig} ${f.name}`; continue; }
      if (kind === 'video') {
        const d = await videoDuration(f);
        if (d > L.secs + 1) { err.textContent = t.tooLong; continue; }
        picked.video = [f];
        continue;
      }
      if (picked.photo.length >= L.n) { err.textContent = t.tooMany; break; }
      picked.photo.push(f);
    }
    input.value = '';
    renderPreviews();
  }

  function renderPreviews() {
    for (const kind of ['photo', 'video']) {
      const el = uploadBox.querySelector(`[data-prev="${kind}"]`);
      el.innerHTML = picked[kind].map((f, i) => {
        const url = URL.createObjectURL(f);
        const media = kind === 'photo' ? `<img src="${url}" alt="">` : `<video src="${url}" muted></video>`;
        return `<div class="wn-thumb">${media}<button type="button" data-rm="${kind}:${i}" aria-label="${esc(t.remove)}">×</button></div>`;
      }).join('');
    }
  }

  function uploadOne(token, kind, file, onProgress) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open('PUT', '/api/upload?kind=' + kind);
      x.setRequestHeader('x-upload-token', token);
      x.setRequestHeader('x-file-name', encodeURIComponent(file.name));
      x.setRequestHeader('content-type', file.type);
      x.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded);
      x.onload = () => (x.status < 300 ? resolve() : reject(new Error(x.responseText)));
      x.onerror = () => reject(new Error('network'));
      x.send(file);
    });
  }

  async function uploadAll(token) {
    const files = [...picked.photo.map((f) => ['photo', f]), ...picked.video.map((f) => ['video', f])];
    if (!files.length || !token) return true;
    const total = files.reduce((a, [, f]) => a + f.size, 0);
    const bar = uploadBox.querySelector('.wn-progress');
    bar.hidden = false;
    let done = 0;
    let ok = true;
    for (const [kind, f] of files) {
      try {
        await uploadOne(token, kind, f, (loaded) => (bar.firstElementChild.style.width = Math.round(((done + loaded) / total) * 100) + '%'));
      } catch { ok = false; }
      done += f.size;
    }
    bar.hidden = true;
    if (!ok) uploadBox.querySelector('.wn-err').textContent = t.uploadFail;
    picked.photo = []; picked.video = [];
    renderPreviews();
    return ok;
  }

  // Show the upload box only when the candidate tab of the registration form is active.
  function placeUploadBox() {
    const form = document.getElementById('interest-form');
    if (!form) return;
    const isCandidate = !!form.querySelector('[name="profession"]');
    if (isCandidate && (!uploadBox || !form.contains(uploadBox))) {
      uploadBox = uploadBox || buildUploadBox();
      const consent = form.querySelector('[name="consent"]');
      const anchor = consent ? consent.closest('label, div') : form.querySelector('button[type="submit"], button:not([type])');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(uploadBox, anchor);
      else form.appendChild(uploadBox);
    } else if (!isCandidate && uploadBox && form.contains(uploadBox)) {
      uploadBox.remove();
    }
  }

  // Wrap fetch so the existing form script keeps working: after a candidate is saved, upload the files.
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const isForm = /\/api\/interests(\?|$)/.test(url) && (init.method || 'GET').toUpperCase() === 'POST';
    if (!isForm) return origFetch(input, init);
    // Make sure the video link reaches the server even if the original script builds its own body.
    const link = uploadBox && document.contains(uploadBox) ? uploadBox.querySelector('[name="video_link"]').value.trim() : '';
    if (link && typeof init.body === 'string') {
      try { const b = JSON.parse(init.body); b.video_link = link; b.lang = b.lang || LANG; init = { ...init, body: JSON.stringify(b) }; } catch { /* not JSON */ }
    } else if (typeof init.body === 'string') {
      try { const b = JSON.parse(init.body); b.lang = b.lang || LANG; init = { ...init, body: JSON.stringify(b) }; } catch { /* not JSON */ }
    }
    const res = await origFetch(input, init);
    if (!res.ok) return res;
    const data = await res.clone().json().catch(() => null);
    if (data && data.uploadToken) await uploadAll(data.uploadToken);
    if (uploadBox) uploadBox.querySelector('[name="video_link"]').value = '';
    return res;
  };

  // ---------------- public "Vacancies" and "Candidates" sections ----------------
  function prefillEmployer(message) {
    const reg = document.getElementById('register');
    if (!reg) return;
    const tab = reg.querySelector('[role="tab"]');
    if (tab && tab.getAttribute('aria-selected') !== 'true') tab.click();
    setTimeout(() => {
      const msg = reg.querySelector('textarea[name="message"]');
      if (msg && !msg.value.includes(message)) msg.value = (message + ' ' + msg.value).trim();
      reg.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  }
  function prefillCandidate() {
    const reg = document.getElementById('register');
    if (!reg) return;
    const tabs = reg.querySelectorAll('[role="tab"]');
    if (tabs[1]) tabs[1].click();
    setTimeout(() => reg.scrollIntoView({ behavior: 'smooth' }), 80);
  }

  async function renderPublic() {
    const cSec = document.getElementById('kandidatet');
    const jSec = document.getElementById('vende-pune');
    if (!cSec && !jSec) return;
    let data;
    try { data = await (await origFetch('/api/public')).json(); } catch { return; }

    if (cSec) {
      if (!data.candidates || !data.candidates.length) { cSec.hidden = true; }
      else {
        cSec.hidden = false;
        cSec.querySelector('.cand-grid').innerHTML = data.candidates.map((c) => `
          <article class="cand-card">
            <div class="cand-top"><span class="cand-code">${esc(c.code)}</span><span class="cand-status st-${esc(c.status)}">${esc(t.st[c.status] || c.status)}</span></div>
            <h3>${esc(c.profession)}</h3>
            <ul class="cand-facts">
              ${c.experience ? `<li><span>${esc(t.cExp)}</span><span>${esc(/^\d+$/.test(c.experience) ? c.experience + ' ' + t.yrs : c.experience)}</span></li>` : ''}
              ${c.location ? `<li><span>${esc(t.cLoc)}</span><span>${esc(c.location)}</span></li>` : ''}
              ${c.nationality ? `<li><span>${esc(t.cNat)}</span><span>${esc(c.nationality)}</span></li>` : ''}
              ${c.languages ? `<li><span>${esc(t.cLang)}</span><span>${esc(c.languages)}</span></li>` : ''}
            </ul>
            <a class="cand-btn" href="#register" data-cand="${esc(c.code)}">${esc(t.cBtn)}</a>
          </article>`).join('');
        cSec.addEventListener('click', (e) => {
          const b = e.target.closest('[data-cand]'); if (!b) return;
          e.preventDefault();
          prefillEmployer(`${t.cMsg} ${b.dataset.cand}.`);
        });
      }
    }

    if (jSec) {
      if (!data.jobs || !data.jobs.length) { jSec.hidden = true; }
      else {
        jSec.hidden = false;
        jSec.querySelector('.cand-grid').innerHTML = data.jobs.map((j) => `
          <article class="cand-card">
            <div class="cand-top"><span class="cand-code">${esc([j.country, j.sector].filter(Boolean).join(' · '))}</span></div>
            <h3>${esc(j.title)}</h3>
            ${j.pay ? `<p class="job-pay">${esc(j.pay)}</p>` : ''}
            ${j.description ? `<p class="job-desc">${esc(j.description).replace(/\n/g, '<br>')}</p>` : ''}
            <a class="cand-btn" href="#register" data-job="${esc(j.title)}">${esc(t.jBtn)}</a>
          </article>`).join('');
        jSec.addEventListener('click', (e) => {
          const b = e.target.closest('[data-job]'); if (!b) return;
          e.preventDefault();
          prefillCandidate();
        });
      }
    }
  }

  function init() {
    placeUploadBox();
    const form = document.getElementById('interest-form');
    if (form) new MutationObserver(placeUploadBox).observe(form, { childList: true, subtree: true });
    renderPublic();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
