'use strict';
/* ===== shared bits ===== */
let sid = 0;
function sparkPath(vals, w, h) {
  const mn = Math.min(...vals), mx = Math.max(...vals), pad = 3;
  const pts = vals.map((v, i) => [i / (vals.length - 1) * w, h - pad - (v - mn) / (mx - mn || 1) * (h - pad * 2)]);
  let d = 'M' + pts[0].map(n => n.toFixed(1)).join(',');
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += ` C${cx.toFixed(1)},${y0.toFixed(1)} ${cx.toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`; }
  return { d, area: d + ` L${w},${h} L0,${h} Z` };
}
function spark(vals, up, w = 74, h = 34) {
  const c = up ? '#1ff0b0' : '#ff6048', id = 'sp' + (sid++), p = sparkPath(vals, w, h);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" style="width:${w}px;height:${h}px"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".4"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><path d="${p.area}" fill="url(#${id})"/><path d="${p.d}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" style="filter:drop-shadow(0 0 3px ${c})"/></svg>`;
}
function artCandles(seed) {
  const r = rng(seed); let p = 60, out = '<line x1="0" x2="400" y1="90" y2="90" stroke="#262b33" stroke-dasharray="4 5"/><line x1="0" x2="400" y1="170" y2="170" stroke="#262b33" stroke-dasharray="4 5"/><line x1="0" x2="400" y1="250" y2="250" stroke="#262b33" stroke-dasharray="4 5"/>';
  for (let i = 0; i < 11; i++) {
    const o = p, c = p + (r() - .46) * 48, hi = Math.max(o, c) + r() * 16, lo = Math.min(o, c) - r() * 16; p = c;
    const y = (v) => 270 - v * 1.9, x = 40 + i * 31, up = c >= o, col = up ? '#1ff0b0' : '#ff6048';
    out += `<g class="cn" style="animation-delay:${i * 80}ms"><line x1="${x}" x2="${x}" y1="${y(hi)}" y2="${y(lo)}" stroke="${col}" stroke-width="2.4" stroke-linecap="round"/><rect x="${x - 7}" y="${y(Math.max(o, c))}" width="14" height="${Math.max(5, Math.abs(y(o) - y(c)))}" rx="3" fill="${col}"/></g>`;
  }
  return `<svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice">${out}</svg>`;
}
const chgCls = (v) => v >= 0 ? 'up' : 'down';
function assetRow(a) {
  return `<button class="row" data-go="asset" data-arg="${a.id}"><div class="logo" style="background:${a.col}">${a.s.slice(0, 2)}</div>
    <div class="nm"><b>${a.n}</b><span>${a.sec}</span></div>${spark(a.spark, a.chg >= 0)}
    <div class="px"><b data-px="${a.id}">${fmt(a.price)}</b><span class="${chgCls(a.chg)}" data-chg="${a.id}">${sgn(a.chg)}%</span></div></button>`;
}
/* live-update prices inside rows / tickers */
function livePrices() {
  const flash = (el, cls) => { el.classList.remove('fu', 'fd'); void el.offsetWidth; el.classList.add(cls); };
  onTick(() => {
    $$('[data-px]').forEach(el => { const a = byId(el.dataset.px), t = fmt(a.price); if (el.textContent !== t) { const up = a.price > parseFloat(el.textContent.replace(/,/g, '')); el.textContent = t; flash(el, up ? 'fu' : 'fd'); } });
    $$('[data-chg]').forEach(el => { const a = byId(el.dataset.chg); el.textContent = sgn(a.chg) + '%'; el.className = chgCls(a.chg); });
  });
}
function tickerHTML() {
  const item = (a) => `<span class="tk"><b>${a.s}</b><i data-px="${a.id}">${fmt(a.price)}</i><em class="${chgCls(a.chg)}" data-chg="${a.id}">${sgn(a.chg)}%</em></span>`;
  const row = ASSETS.map(item).join('');
  return `<div class="ticker"><div class="tr">${row}${row}</div></div>`;
}
const lessonsDone = () => A().lessonsDone;
/* ===== glossary helpers: any term can be tapped for a plain explanation ===== */
const term = (id, label) => `<button class="term" data-term="${id}">${label || GLOSS[id].t}</button>`;
const learn = (ids) => `<div class="learn"><span>לא בטוחים?</span>${ids.map(i => `<button class="lchip" data-term="${i}">מה זה ${GLOSS[i].t}?</button>`).join('')}</div>`;
function openTerm(id) {
  const g = GLOSS[id]; if (!g) return;
  const L = g.lesson && LESSONS.find(l => l.id === g.lesson), done = L && lessonsDone().includes(L.id), vis = g.v ? sceneSVG(g.v) : '';
  openSheet(`<span class="tag">מילון</span><h3 style="margin-top:8px">${g.t}</h3><p class="def">${g.def}</p>${vis ? `<div class="vis">${vis}</div>` : ''}<div class="ex"><b>דוגמה:</b> ${g.ex}</div>
    ${L ? `<button class="btn ghost small" data-go="lesson" data-arg="${L.id}" style="margin-top:12px">${done ? 'לחזור על השיעור' : 'לשיעור המלא'}: ${L.title}</button>` : ''}
    <button class="btn primary small" data-close="1" style="margin-top:8px">הבנתי</button>`, 'term');
}
screens.glossary = () => {
  scr.innerHTML = `<div class="anim"><div class="top"><button class="icon-btn" data-go="lessons">${ic.back}</button><h2>מילון מונחים</h2><span style="width:42px"></span></div>
    <p class="muted" style="margin-bottom:14px">כל מילה שלא ברורה, כאן בשפה פשוטה. לחצו על מונח כדי לראות הסבר ואיור.</p>
    <div class="card" style="padding:4px 16px">${Object.entries(GLOSS).map(([id, g]) => `<button class="grow-row" data-term="${id}"><div><b>${g.t}</b><span>${g.def}</span></div>${ic.back}</button>`).join('')}</div></div>`;
};

const ALL_DONE = () => LESSONS.every(l => lessonsDone().includes(l.id));
const portfolioOpen = () => PROTOTYPE_OPEN_PORTFOLIO || ALL_DONE() || A().demoUnlock;

/* ===== onboarding ===== */
screens.onboarding = (i = 0) => {
  i = +i || 0;
  const slides = [
    ['למדו שוק הון בצורה אחרת', 'שיעורים קצרים ומצוירים, ואחריהם תרגול על גרף. בלי משעמם ובלי מילים מסובכות.', 'wow'],
    ['לומדים להחליט, לא לנחש', 'קוראים גרף, מחליטים אם בכלל לקנות, ובונים תוכנית עם סטופ ויעד. בלי כסף אמיתי.', 'think'],
    ['חוקרים ומתאמנים בתיק וירטואלי', 'אחרי השיעורים מקבלים 5,000 ש"ח וירטואליים לתרגול. הכול לימודי, בלי המלצות השקעה.', 'cheer']
  ];
  const [h, p] = slides[i];
  scr.innerHTML = `<div class="ob anim">
    <div class="ob-top"><button class="link" id="lg">יש לי חשבון</button><button class="link" id="skip">דלג</button></div>
    <div class="ob-art">${obScene(i)}</div>
    <h1>${h}</h1><p>${p}</p>
    <div class="dots">${slides.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="grow"></div>
    <button class="btn primary" id="next">${i === 2 ? 'בואו נתחיל' : 'המשך'}</button></div>`;
  const done = (to) => { loadDB().seenOnboarding = true; save(); go(to); };
  $('#skip').onclick = () => done('signup');
  $('#lg').onclick = () => done('login');
  $('#next').onclick = () => { if (i === 2) done('signup'); else screens.onboarding(i + 1); };
};

/* ===== sign in / sign up: glass cards ===== */
const fi = {
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="5.5" width="16" height="14.5" rx="3"/><path d="M8 3.5v4M16 3.5v4M4 10.5h16"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="M4 8l8 5.5L20 8"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2.6"/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  candle: '<svg viewBox="0 0 48 48"><g stroke="#10180a" stroke-width="3.4" stroke-linecap="round"><path d="M16 9v30M32 13v26"/></g><rect x="10.5" y="17" width="11" height="15" rx="3" fill="#10180a"/><rect x="26.5" y="21" width="11" height="12" rx="3" fill="#10180a"/></svg>'
};
const authLogo = () => `<div class="authlogo"><div class="lgi">${fi.candle}</div><h1><span>לומדים</span> <b>שוק הון</b></h1><p>ללמוד, לתרגל, להבין</p></div>`;
const gfield = (id, icon, ph, extra = '', type = 'text', dirLtr = false) => `<div class="gf"><span class="lead">${icon}</span><input class="gi" id="${id}" type="${type}" placeholder="${ph}" ${dirLtr ? 'dir="ltr" style="text-align:right"' : ''} ${extra}>${type === 'password' ? `<button type="button" class="eye" data-eye="${id}" aria-label="הצגת סיסמה">${fi.eye}</button>` : ''}</div><div class="err-t" id="e-${id}"></div>`;
const socials = (verb) => `<div class="orline"><span>או</span></div><button class="soc" data-prov="google"><i class="pm g">G</i>${verb} עם Google</button><button class="soc" data-prov="apple"><i class="pm a">A</i>${verb} עם Apple</button>`;
function bindAuth(root) {
  $$('[data-eye]', root).forEach(b => b.onclick = () => { const i = $('#' + b.dataset.eye); i.type = i.type === 'password' ? 'text' : 'password'; b.classList.toggle('on', i.type === 'text'); });
  $$('[data-prov]', root).forEach(b => b.onclick = () => providerFlow(b.dataset.prov));
}
/* demo only: there is no real Google or Apple connection in the prototype */
function providerFlow(kind) {
  const nm = kind === 'google' ? 'Google' : 'Apple', old = Object.values(loadDB().accounts).find(a => a.provider === kind);
  openSheet(`<div class="prov"><i class="pm big ${kind === 'google' ? 'g' : 'a'}">${kind === 'google' ? 'G' : 'A'}</i><h3>המשך עם ${nm}</h3>
    <p class="muted" style="font-size:13.5px;line-height:1.6;margin:6px 0 14px">בגרסת ההדגמה אין חיבור אמיתי ל-${nm}. בגרסה האמיתית השם והאימייל יגיעו משם, ונצטרך רק את הגיל.</p>
    ${old ? `<button class="btn primary" id="pgo">כניסה כ-${old.name}</button>` : `<div class="gf"><span class="lead">${fi.user}</span><input class="gi" id="pn" placeholder="איך לקרוא לך?"></div><div class="gf" style="margin-top:10px"><span class="lead">${fi.cal}</span><input class="gi" id="pa" type="number" inputmode="numeric" placeholder="גיל (15 ומעלה)"></div><div class="err-t" id="pe"></div><button class="btn primary" id="pgo" style="margin-top:12px">המשך</button>`}
    <button class="btn ghost small" data-close="1" style="margin-top:8px">ביטול</button></div>`);
  $('#pgo').onclick = () => {
    const db = loadDB();
    if (old) { db.session = old.email; save(); closeSheet(); toast('ברוך שובך, ' + old.name); go('home'); return; }
    const nmv = $('#pn').value.trim(), age = +$('#pa').value;
    if (nmv.length < 2) { $('#pe').textContent = 'כתבו שם של לפחות שתי אותיות'; return; }
    if (!age || age < 15) { $('#pe').textContent = age ? 'האפליקציה מיועדת לגיל 15 ומעלה' : 'כתבו גיל'; return; }
    const email = `${kind}.demo@example.com`; const ac = newAcct(nmv, age, email, Math.random().toString(36).slice(2), 'להבין איך זה עובד'); ac.provider = kind;
    db.accounts[email] = ac; db.session = email; save(); closeSheet(); go('home');
  };
}

screens.login = () => {
  scr.innerHTML = `<div class="auth anim">
    <button class="icon-btn" id="bk" style="margin:4px 0 0">${ic.back}</button>${authLogo()}
    <div class="glass"><h2>כניסה לחשבון</h2>
      ${gfield('em', fi.mail, 'אימייל', 'autocomplete="username"', 'email', true)}
      ${gfield('pw', fi.lock, 'סיסמה', 'autocomplete="current-password"', 'password', true)}
      <div class="rowx"><button class="check on" id="rem" type="button"><i></i><span>זכור אותי</span></button><button class="link" id="fg" type="button">שכחתי סיסמה</button></div>
      <button class="btn primary" id="go">${fi.lock.replace('<svg', '<svg width="18" height="18"')} כניסה</button>
      ${socials('כניסה')}
      <p class="alt">אין לך חשבון? <button class="link" id="su">יצירת חשבון</button></p></div>
    <p class="demo-note" style="text-align:center">אב טיפוס: החשבונות נשמרים רק בדפדפן הזה.</p></div>`;
  bindAuth(scr);
  $('#rem').onclick = () => $('#rem').classList.toggle('on');
  $('#bk').onclick = () => go('onboarding', 0);
  $('#su').onclick = () => go('signup');
  $('#fg').onclick = () => toast('באב הטיפוס אין איפוס סיסמה');
  const setErr = (id, msg) => { $('#e-' + id).textContent = msg || ''; $('#' + id).closest('.gf').classList.toggle('err', !!msg); return !!msg; };
  const submit = () => {
    const em = $('#em').value.trim().toLowerCase(), pw = $('#pw').value, acc = loadDB().accounts[em];
    let bad = setErr('em', /^\S+@\S+\.\S+$/.test(em) ? (acc ? '' : 'לא מצאנו חשבון עם האימייל הזה') : 'כתבו אימייל תקין');
    if (!bad) bad = setErr('pw', !pw ? 'כתבו סיסמה' : acc.pass !== hash(pw) ? 'הסיסמה לא נכונה' : ''); else setErr('pw', '');
    if (bad) return;
    loadDB().session = em; save(); toast('ברוך שובך, ' + acc.name); go('home');
  };
  $('#go').onclick = submit;
  $('#pw').onkeydown = (e) => { if (e.key === 'Enter') submit(); };
};

screens.signup = () => {
  const st = { goal: 'להבין איך זה עובד', terms: false };
  scr.innerHTML = `<div class="auth anim">
    <button class="icon-btn" id="bk" style="margin:4px 0 0">${ic.back}</button>${authLogo()}
    <div class="glass"><h2>יצירת חשבון</h2>
      ${gfield('nm', fi.user, 'איך לקרוא לך?', 'autocomplete="off"')}
      ${gfield('age', fi.cal, 'גיל (15 ומעלה)', 'min="1" max="99" inputmode="numeric"', 'number')}
      ${gfield('em', fi.mail, 'אימייל', 'autocomplete="username"', 'email', true)}
      ${gfield('pw', fi.lock, 'סיסמה (לפחות 4 תווים)', 'autocomplete="new-password"', 'password', true)}
      <div class="goals"><span>מה המטרה שלך?</span><div class="chips" id="goals">${['להבין איך זה עובד', 'ללמוד לקרוא גרפים', 'סתם סקרנות'].map(g => `<button class="chip${g === st.goal ? ' on' : ''}" type="button">${g}</button>`).join('')}</div></div>
      <button class="check" id="terms" type="button"><i></i><span>אני מבין שהתוכן לימודי בלבד, אין בו המלצות השקעה והבטחות לרווח, ואין כסף אמיתי באפליקציה.</span></button>
      <div class="err-t" id="e-t"></div>
      <button class="btn primary" id="go">${fi.lock.replace('<svg', '<svg width="18" height="18"')} יצירת חשבון</button>
      ${socials('הרשמה')}
      <p class="alt">כבר יש לך חשבון? <button class="link" id="li">התחברות</button></p></div></div>`;
  bindAuth(scr);
  $('#bk').onclick = () => go('onboarding', 0);
  $('#li').onclick = () => go('login');
  $('#goals').onclick = (e) => { const c = e.target.closest('.chip'); if (!c) return; $$('.chip', $('#goals')).forEach(x => x.classList.remove('on')); c.classList.add('on'); st.goal = c.textContent; };
  $('#terms').onclick = () => { st.terms = !st.terms; $('#terms').classList.toggle('on', st.terms); };
  const setErr = (id, msg) => { $('#e-' + id).textContent = msg || ''; const f = $('#' + id); if (f && f.closest('.gf')) f.closest('.gf').classList.toggle('err', !!msg); return !!msg; };
  $('#go').onclick = () => {
    const nm = $('#nm').value.trim(), age = +$('#age').value, em = $('#em').value.trim().toLowerCase(), pw = $('#pw').value;
    let bad = false;
    bad = setErr('nm', nm.length < 2 ? 'כתבו שם של לפחות שתי אותיות' : '') || bad;
    bad = setErr('age', !age ? 'כתבו גיל' : age < 15 ? 'האפליקציה מיועדת לגיל 15 ומעלה' : '') || bad;
    bad = setErr('em', !/^\S+@\S+\.\S+$/.test(em) ? 'כתבו אימייל תקין' : loadDB().accounts[em] ? 'כבר יש חשבון עם האימייל הזה. אפשר להתחבר' : '') || bad;
    bad = setErr('pw', pw.length < 4 ? 'הסיסמה צריכה להיות לפחות 4 תווים' : '') || bad;
    bad = setErr('t', st.terms ? '' : 'צריך לאשר כדי להמשיך') || bad;
    if (bad) return;
    loadDB().accounts[em] = newAcct(nm, age, em, pw, st.goal); loadDB().session = em; save();
    go('home');
  };
};

/* ===== home ===== */
screens.home = () => {
  const s = A(), nextL = LESSONS.find(l => !s.lessonsDone.includes(l.id));
  const done = s.lessonsDone.length, total = LESSONS.length, open = portfolioOpen();
  const eq = equity(s), pl = eq - START_CASH, xp = (s.xp || 0) % 100;
  const movers = [...ASSETS].sort((x, y) => Math.abs(y.chg) - Math.abs(x.chg)).slice(0, 5);
  const heroVis = nextL ? (nextL.slides[0] || {}).v : 'riskline';
  const R = 52, C = 2 * Math.PI * R, ring = (frac, big) => `<svg viewBox="0 0 120 120" class="rg"><circle cx="60" cy="60" r="${R}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="9"/><circle cx="60" cy="60" r="${R}" fill="none" stroke="#c8ff3d" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C.toFixed(0)}" stroke-dashoffset="${(C * (1 - frac)).toFixed(0)}" transform="rotate(-90 60 60)" style="filter:drop-shadow(0 0 5px #c8ff3d)"/><text x="60" y="68" text-anchor="middle" fill="#fff" font-size="26" font-weight="800" font-family="Heebo,sans-serif">${big}</text></svg>`;
  const xcards = [
    ['practiceHome', 'תרגול', 'קוראים גרף ומחליטים', 'support', ''],
    ['market', 'שוק', 'חוקרים מדדים ומניות', 'riskline', ''],
    ['glossary', 'מילון', 'כל מילה בשפה פשוטה', 'candle1', ''],
    ['portfolio', 'התיק שלי', open ? money(eq) : 'נפתח בסיום השיעורים', 'size', open ? '' : 'lk']
  ];
  scr.innerHTML = `<div class="anim home">
    <div class="hello"><button class="avatar ringed" data-go="profile" aria-label="פרופיל"><svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="26" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="3"/><circle cx="28" cy="28" r="26" fill="none" stroke="#ffc94d" stroke-width="3" stroke-linecap="round" stroke-dasharray="163" stroke-dashoffset="${(163 * (1 - xp / 100)).toFixed(0)}" transform="rotate(-90 28 28)"/></svg><span>${s.name[0]}</span></button>
      <div class="t"><span class="eyebrow">שלום, רמה ${lvl(s)}</span><b>${s.name}</b></div>
      <div class="pill">${ic.fire}${s.streak}</div><div class="pill gold">${ic.star}${s.stars}</div></div>
    <button class="hero2" data-go="${nextL ? 'lesson' : 'portfolio'}" ${nextL ? `data-arg="${nextL.id}"` : ''}>
      <div class="h2art">${sceneSVG(heroVis)}</div>
      <div class="h2in"><div class="h2t"><span class="tag">${nextL ? 'המשך מאיפה שעצרת' : 'סיימת את כל השיעורים'}</span>
        <h2>${nextL ? nextL.title : 'עכשיו אפשר לחקור ולתרגל'}</h2><p>${nextL ? nextL.min + ' דקות' : 'התיק הוירטואלי מחכה לך'}</p></div>
        <div class="h2r">${ring(done / total, done + '/' + total)}</div></div>
      <span class="h2go">${nextL ? 'להמשיך' : 'לתיק שלי'} ${ic.back}</span></button>
    <div class="sec2"><h3>לחקור</h3></div>
    <div class="rail">${xcards.map(([go, t, d, v, cls], i) => `<button class="xcard ${cls}" data-go="${go}" style="animation-delay:${.15 + i * .07}s"><div class="xart">${sceneSVG(v)}${cls ? `<div class="xlock">${ic.lock}</div>` : ''}</div><b>${t}</b><span>${d}</span></button>`).join('')}</div>
    <div class="sec2"><h3>זזים עכשיו <span class="live"></span></h3><button class="link" data-go="market">הכול</button></div>
    <div class="rail arail">${movers.map(a => `<button class="acard" data-go="asset" data-arg="${a.id}"><div class="ah"><div class="logo" style="background:${a.col}">${a.s.slice(0, 2)}</div><span>${a.s}</span></div>${spark(a.spark, a.chg >= 0, 128, 40)}<b data-px="${a.id}">${fmt(a.price)}</b><em class="${chgCls(a.chg)}" data-chg="${a.id}">${sgn(a.chg)}%</em></button>`).join('')}</div>
    <p class="demo-note" style="text-align:center">נתוני הדגמה בדויים שנעים בזמן אמת.</p></div>`;
  livePrices();
};
function lessonCard(l) {
  const done = lessonsDone().includes(l.id);
  return `<button class="les ${done ? 'done' : ''}" data-go="lesson" data-arg="${l.id}">
    <div class="ic" style="color:${done ? '#04251b' : l.color}">${done ? ic.check : ic.book}</div>
    <div class="tx"><b>${l.title}</b><span>${l.min} דקות</span></div>${done ? '<span class="st">הושלם</span>' : ''}</button>`;
}

/* ===== lessons ===== */
screens.lessons = () => {
  const d = lessonsDone().length;
  scr.innerHTML = `<div class="anim"><div class="top"><h2>שיעורים</h2><span class="pill gold">${ic.star}${A().stars}</span></div>
    <div class="card prog-card"><div style="display:flex;justify-content:space-between"><b>${d} מתוך ${LESSONS.length} שיעורים</b><span class="muted" style="font-size:13px">${portfolioOpen() ? 'התיק פתוח' : 'התיק נפתח בסיום'}</span></div>
      <div class="bar" style="margin-top:12px"><i style="width:${Math.round(d / LESSONS.length * 100)}%"></i></div></div>
    <button class="card gl-link" data-go="glossary"><div>${ic.book}</div><div><b>מילון מונחים</b><span class="muted">תמיכה, התנגדות, סטופ ועוד, בשפה פשוטה</span></div></button>
    <div style="height:14px"></div>${LESSONS.map(lessonCard).join('')}</div>`;
};
screens.lesson = (id) => {
  const L = LESSONS.find(x => x.id === id) || LESSONS[0];
  let i = 0, answered = false, dir = 1;
  const n = L.slides.length + 1, say = SAY[L.id] || [];
  const draw = () => {
    const quiz = i === L.slides.length, sl = L.slides[i];
    scr.innerHTML = `<div class="lp">
      <div class="top"><button class="icon-btn" id="bk">${ic.x}</button><span class="muted" style="font-size:13px">${L.title}</span><span style="width:42px"></span></div>
      <div class="prog">${Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'on' : k === i ? 'on cur' : ''}"></i>`).join('')}</div>
      <div class="slide ${dir > 0 ? 'in-r' : 'in-l'}">${quiz
        ? `<span class="tag">בדיקה קטנה</span><h2>${L.q.q}</h2><div class="grow">${L.q.o.map((o, k) => `<button class="opt" data-k="${k}">${o}</button>`).join('')}</div><div id="qm" class="muted" style="margin-top:14px;min-height:22px"></div>`
        : `<div class="scene-card">${sceneSVG(sl.v)}<span class="cnt">${i + 1}/${L.slides.length}</span></div>
           <div class="tip-note">${ic.bulb}<span>${say[i] || 'שימו לב לאיור.'}</span></div>
           <h2>${sl.t}</h2><p>${sl.b}</p>${toyHTML(sl.x)}${sl.w ? `<div class="warn">${sl.w}</div>` : ''}<div class="grow"></div>`}</div>
      <div class="nav2">${i > 0 && !quiz ? `<button class="btn ghost" id="pv" style="flex:none;width:90px">חזרה</button>` : ''}<button class="btn primary" id="nx" ${quiz ? 'disabled' : ''}>${quiz ? 'סיום שיעור' : 'הבא'}</button></div></div>`;
    scr.scrollTop = 0;
    $('#bk').onclick = () => go('lessons');
    const pv = $('#pv'); if (pv) pv.onclick = () => { i--; dir = -1; draw(); };
    if (!quiz) bindToy(sl.x, scr);
    $('#nx').onclick = () => {
      if (!quiz) { i++; dir = 1; draw(); return; }
      const s = A(), first = !s.lessonsDone.includes(L.id);
      if (first) { s.lessonsDone.push(L.id); s.stars += 1; s.xp = (s.xp || 0) + 20; save(); }
      markActive(s);
      go('lessonDone', { id: L.id, gained: first ? 20 : 0, before: (s.xp || 0) - (first ? 20 : 0) });
    };
    if (quiz) $$('.opt').forEach(b => b.onclick = (e) => {
      if (answered) return;
      const ok = +b.dataset.k === L.q.a;
      b.classList.add(ok ? 'ok' : 'bad');
      if (ok) { answered = true; burst(e.clientX, e.clientY, '#ffc94d', 16); $('#qm').innerHTML = '<span class="up">נכון! כל הכבוד.</span>'; $('#nx').disabled = false; }
      else { $('#qm').innerHTML = '<span class="down">לא בדיוק, נסו שוב.</span>'; b.classList.add('shake'); }
    });
  };
  draw();
};
function confetti(n = 30) {
  if (reduceMotion) return '';
  return `<div class="confetti">${Array.from({ length: n }, (_, k) => `<i style="left:${(k * 37) % 100}%;background:${['#1ff0b0', '#ffc94d', '#60a5fa', '#ff6048', '#a78bfa'][k % 5]};animation-delay:${(k % 7) * .12}s"></i>`).join('')}</div>`;
}
screens.lessonDone = (a) => {
  const id = a.id || a, L = LESSONS.find(x => x.id === id) || LESSONS[0], gained = a.gained || 0;
  const ac = A(), all = ALL_DONE(), left = LESSONS.length - lessonsDone().length;
  const xp1 = ac.xp || 0, xp0 = a.before != null ? a.before : xp1, up = Math.floor(xp1 / 100) > Math.floor(xp0 / 100);
  scr.innerHTML = `${confetti(46)}<div class="ldone anim"><div class="rays"></div>
    <div class="dm"><svg viewBox="0 0 120 120" width="150" height="150"><circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="8"/><circle class="ringp" cx="60" cy="60" r="50" fill="none" stroke="#1ff0b0" stroke-width="8" stroke-linecap="round" stroke-dasharray="314" stroke-dashoffset="314" transform="rotate(-90 60 60)" style="filter:drop-shadow(0 0 8px #1ff0b0)"/><path class="checkp" d="M38 62l16 16 30-34" fill="none" stroke="#1ff0b0" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="90" stroke-dashoffset="90"/></svg></div>
    <h1>סיימת את השיעור!</h1><p class="muted" style="margin:6px 20px 0">${L.title}</p>
    <div class="stars"><span class="pop">${starSvg(true)}</span></div>
    <div class="card xpc"><div class="xpt"><b data-cu="${gained}" data-pre="+" data-suf=" נק' ניסיון">+${gained}</b><span class="muted">רמה ${lvl(ac)}</span></div>
      <div class="bar"><i id="xpf" style="width:${(xp0 % 100)}%"></i></div>${up ? '<div class="lvlup">עליתם רמה!</div>' : `<span class="muted" style="font-size:12.5px">עוד ${100 - (xp1 % 100)} נקודות לרמה הבאה</span>`}</div>
    ${all ? `<div class="card unlock" style="margin-top:14px">${ic.wallet}<b>התיק הוירטואלי נפתח!</b><span class="muted">מחכים לך 5,000 ש"ח וירטואליים לתרגול</span></div>` : `<p class="muted" style="margin-top:14px">עוד ${left} שיעורים עד שהתיק הוירטואלי ייפתח</p>`}
    <div class="btns" style="margin-top:18px"><button class="btn primary" data-go="${all ? 'portfolio' : 'practiceHome'}">${all ? 'לתיק שלי' : 'עכשיו לתרגול'}</button><button class="btn ghost" data-go="home">חזרה לבית</button></div></div>`;
  setTimeout(() => { const f = $('#xpf'); if (f) f.style.width = (xp1 % 100) + '%'; }, 350);
};

/* ===== profile ===== */
screens.profile = () => {
  const s = A();
  const bd = [['👣', 'צעד ראשון', s.lessonsDone.length > 0], ['⭐', '3 כוכבים', s.stars >= 3], ['🎯', 'תרגיל מושלם', Object.values(s.practiceDone).some(v => v === 3)], ['📚', 'כל השיעורים', ALL_DONE()], ['💼', 'עסקה ראשונה', s.portfolio.hist.length > 0], ['🧘', 'סבלנות', Object.entries(s.practiceDone).some(([k, v]) => v === 3 && SCEN.find(x => x.id === k && x.action === 'wait'))]];
  scr.innerHTML = `<div class="anim"><div class="top"><button class="icon-btn" data-go="home">${ic.back}</button><h2>פרופיל</h2><span style="width:42px"></span></div>
    <div class="pf"><div class="avatar big">${s.name[0]}</div><h1 style="font-size:24px">${s.name}</h1><span class="muted" dir="ltr">${s.email || ''}</span></div>
    <div class="stat3"><div class="card"><b class="gold">${s.stars}</b><span>כוכבים</span></div><div class="card"><b>${s.streak}</b><span>ימים ברצף</span></div><div class="card"><b>${s.lessonsDone.length}/${LESSONS.length}</b><span>שיעורים</span></div></div>
    <div class="sec"><h3>הישגים</h3></div><div class="badges">${bd.map(([e, t, on]) => `<div class="badge${on ? '' : ' off'}"><i>${e}</i>${t}</div>`).join('')}</div>
    <button class="premcard" data-go="paywall"><div class="pmi">${s.premium ? '✓' : '★'}</div><div><b>${s.premium ? 'המנוי פעיל' : 'שדרוג לפרימיום'}</b><span>${s.premium ? 'אפשר לראות מה כלול' : 'ללמוד בלי גבולות. עד 50% הנחה'}</span></div>${ic.back}</button>
    <div class="sec"><h3>כלי הדגמה</h3></div>
    <button class="btn ghost" id="un" style="margin-bottom:10px">${portfolioOpen() ? 'התיק פתוח' : 'פתח את התיק בלי לסיים שיעורים'}</button>
    <button class="btn ghost" id="lo" style="margin-bottom:10px">התנתקות</button>
    <button class="btn ghost" id="rs">מחיקת החשבון הזה</button>
    <p class="disc">התוכן באפליקציה לימודי בלבד. אין בו המלצות השקעה או הבטחות לרווח, ואין כסף אמיתי. ${WARN_DAY}</p></div>`;
  $('#un').onclick = () => { if (!portfolioOpen()) { A().demoUnlock = true; save(); toast('התיק נפתח להדגמה'); go('profile'); } };
  $('#lo').onclick = () => { loadDB().session = null; save(); go('login'); };
  let sure = false;
  $('#rs').onclick = () => { if (!sure) { sure = true; $('#rs').textContent = 'בטוח? לחצו שוב כדי למחוק'; return; } delete loadDB().accounts[loadDB().session]; loadDB().session = null; save(); go('onboarding', 0); };
};
