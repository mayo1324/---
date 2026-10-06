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
const portfolioOpen = () => ALL_DONE() || A().demoUnlock;

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

/* ===== login ===== */
screens.login = () => {
  scr.innerHTML = `<div class="anim">
    <div class="top"><button class="icon-btn" id="bk">${ic.back}</button><span></span></div>
    <h1>טוב לראות אותך שוב</h1><p class="muted" style="margin-top:8px">התחברו כדי להמשיך מאיפה שעצרתם.</p>
    <div class="field"><label for="em">אימייל</label><input class="inp" id="em" type="email" dir="ltr" style="text-align:right" placeholder="name@example.com" autocomplete="username"><div class="err-t" id="e-em"></div></div>
    <div class="field"><label for="pw">סיסמה</label><input class="inp" id="pw" type="password" dir="ltr" style="text-align:right" placeholder="הסיסמה שלך" autocomplete="current-password"><div class="err-t" id="e-pw"></div></div>
    <button class="link" id="fg" style="margin-top:12px">שכחתי סיסמה</button>
    <div style="height:22px"></div>
    <button class="btn primary" id="go">התחברות</button>
    <p class="muted" style="text-align:center;margin-top:22px;font-size:14px">אין לך חשבון? <button class="link" id="su">יצירת חשבון</button></p>
    <p class="demo-note" style="text-align:center">אב טיפוס: החשבונות נשמרים רק בדפדפן הזה.</p></div>`;
  $('#bk').onclick = () => go('onboarding', 0);
  $('#su').onclick = () => go('signup');
  $('#fg').onclick = () => toast('באב הטיפוס אין איפוס סיסמה');
  const setErr = (id, msg) => { $('#e-' + id).textContent = msg || ''; $('#' + id).classList.toggle('err', !!msg); return !!msg; };
  const submit = () => {
    const em = $('#em').value.trim().toLowerCase(), pw = $('#pw').value, acc = loadDB().accounts[em];
    let bad = setErr('em', /^\S+@\S+\.\S+$/.test(em) ? (acc ? '' : 'לא מצאנו חשבון עם האימייל הזה') : 'כתבו אימייל תקין');
    if (!bad) bad = setErr('pw', !pw ? 'כתבו סיסמה' : acc.pass !== hash(pw) ? 'הסיסמה לא נכונה' : '');
    else setErr('pw', '');
    if (bad) return;
    loadDB().session = em; save(); toast('ברוך שובך, ' + acc.name); go('home');
  };
  $('#go').onclick = submit;
  $('#pw').onkeydown = (e) => { if (e.key === 'Enter') submit(); };
};

/* ===== signup ===== */
screens.signup = () => {
  const st = { goal: 'להבין איך זה עובד', terms: false };
  scr.innerHTML = `<div class="anim">
    <div class="top"><button class="icon-btn" id="bk">${ic.back}</button><span></span></div>
    <h1>יוצרים חשבון</h1><p class="muted" style="margin-top:8px">שנייה אחת ואתם בפנים. אין כסף אמיתי באפליקציה.</p>
    <div class="field"><label for="nm">איך לקרוא לך?</label><input class="inp" id="nm" placeholder="השם שלך" autocomplete="off"><div class="err-t" id="e-nm"></div></div>
    <div class="field"><label for="age">גיל</label><input class="inp" id="age" type="number" inputmode="numeric" placeholder="15 ומעלה" min="1" max="99"><div class="err-t" id="e-age"></div></div>
    <div class="field"><label for="em">אימייל</label><input class="inp" id="em" type="email" dir="ltr" style="text-align:right" placeholder="name@example.com" autocomplete="username"><div class="err-t" id="e-em"></div></div>
    <div class="field"><label for="pw">סיסמה</label><input class="inp" id="pw" type="password" dir="ltr" style="text-align:right" placeholder="לפחות 4 תווים" autocomplete="new-password"><div class="err-t" id="e-pw"></div></div>
    <div class="field"><label>מה המטרה שלך?</label><div class="chips" id="goals">${['להבין איך זה עובד', 'ללמוד לקרוא גרפים', 'סתם סקרנות'].map(g => `<button class="chip${g === st.goal ? ' on' : ''}">${g}</button>`).join('')}</div></div>
    <button class="check" id="terms"><i></i><span>אני מבין שהתוכן לימודי בלבד, אין בו המלצות השקעה והבטחות לרווח, ואין כסף אמיתי באפליקציה.</span></button>
    <div class="err-t" id="e-t"></div>
    <div style="height:18px"></div>
    <button class="btn primary" id="go">יצירת חשבון</button>
    <p class="muted" style="text-align:center;margin-top:20px;font-size:14px">כבר יש לך חשבון? <button class="link" id="li">התחברות</button></p></div>`;
  $('#bk').onclick = () => go('onboarding', 0);
  $('#li').onclick = () => go('login');
  $('#goals').onclick = (e) => { const c = e.target.closest('.chip'); if (!c) return; $$('.chip', $('#goals')).forEach(x => x.classList.remove('on')); c.classList.add('on'); st.goal = c.textContent; };
  $('#terms').onclick = () => { st.terms = !st.terms; $('#terms').classList.toggle('on', st.terms); };
  const setErr = (id, msg, inp) => { $('#e-' + id).textContent = msg || ''; if (inp) $('#' + inp).classList.toggle('err', !!msg); return !!msg; };
  $('#go').onclick = () => {
    const nm = $('#nm').value.trim(), age = +$('#age').value, em = $('#em').value.trim().toLowerCase(), pw = $('#pw').value;
    let bad = false;
    bad = setErr('nm', nm.length < 2 ? 'כתבו שם של לפחות שתי אותיות' : '', 'nm') || bad;
    bad = setErr('age', !age ? 'כתבו גיל' : age < 15 ? 'האפליקציה מיועדת לגיל 15 ומעלה' : '', 'age') || bad;
    bad = setErr('em', !/^\S+@\S+\.\S+$/.test(em) ? 'כתבו אימייל תקין' : loadDB().accounts[em] ? 'כבר יש חשבון עם האימייל הזה. אפשר להתחבר' : '', 'em') || bad;
    bad = setErr('pw', pw.length < 4 ? 'הסיסמה צריכה להיות לפחות 4 תווים' : '', 'pw') || bad;
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
  const R = 52, C = 2 * Math.PI * R, ring = (frac, big) => `<svg viewBox="0 0 120 120" class="rg"><circle cx="60" cy="60" r="${R}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="9"/><circle cx="60" cy="60" r="${R}" fill="none" stroke="#1ff0b0" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C.toFixed(0)}" stroke-dashoffset="${(C * (1 - frac)).toFixed(0)}" transform="rotate(-90 60 60)" style="filter:drop-shadow(0 0 5px #1ff0b0)"/><text x="60" y="68" text-anchor="middle" fill="#fff" font-size="26" font-weight="800" font-family="Heebo,sans-serif">${big}</text></svg>`;
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
