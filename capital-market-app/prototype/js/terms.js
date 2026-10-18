'use strict';
/* ===== terms of use and privacy: shown on the first visit, must be approved to continue =====
   DRAFT for the test version. It was NOT reviewed by a lawyer. Have a lawyer review it before any public launch. */
const TERMS_VERSION = 1;
const TERMS_SUMMARY = [
  ['לימוד בלבד', 'התוכן באפליקציה לימודי. אין בו ייעוץ השקעות או המלצות.'],
  ['כסף וירטואלי', 'התרגול הוא על נתוני שוק אמיתיים מהעבר, בלי כסף אמיתי.'],
  ['הנתונים אצלכם', 'ההתקדמות נשמרת בדפדפן שלכם בלבד, בלי שרת.'],
  ['מגיל 15', 'מי שמתחת ל-18 משתמש בידיעת הורה או אפוטרופוס.']
];
const TERMS_TEXT = [
  ['מה זו האפליקציה', 'האפליקציה היא גרסת ניסוי ללימוד שוק ההון בעברית לבני 15 ומעלה: שיעורים, חידונים ותרגול על גרפים. היא נמצאת בפיתוח, ודברים בה יכולים להשתנות או להיפסק בכל עת.'],
  ['תוכן לימודי בלבד, ללא ייעוץ', 'כל מה שמופיע באפליקציה הוא תוכן לימודי כללי. אין בו ייעוץ השקעות, שיווק השקעות, ניהול תיקי השקעות או המלצה לקנות, למכור או להחזיק נייר ערך כלשהו, ואין לראות בו תחליף לייעוץ מקצועי המתחשב בנתונים האישיים שלכם. מפעילי האפליקציה אינם מציגים את עצמם כבעלי רישיון לייעוץ השקעות. לפני כל החלטה כספית אמיתית יש להתייעץ עם גורם מוסמך.'],
  ['סיכון', 'השקעה בניירות ערך כרוכה בסיכון, ואפשר להפסיד חלק מהכסף או את כולו. תוצאות בעבר אינן מבטיחות תוצאות בעתיד. מסחר יומי נחשב מסוכן במיוחד: גם רשות ניירות הערך האמריקאית (SEC) מזהירה שהוא כרוך בסיכון גבוה ובהפסדים משמעותיים בזמן קצר.'],
  ['תרגול וכסף וירטואלי', 'התיק והתרגול באפליקציה הם סימולציה בכסף וירטואלי. אין בהם כסף אמיתי, והתוצאות בהם אינן מעידות על תוצאות אמיתיות. בתרגול משתמשים בנתוני שוק אמיתיים מהעבר, בלי שם הנכס והתאריך עד סוף המקרה. החלטה "נכונה" בתרגול נקבעת לפי כללי לימוד שהוגדרו מראש ולא לפי התוצאה בדיעבד, והיא אינה המלצה לפעול כך במציאות.'],
  ['נתונים ומקורות', 'נתוני השוק בתרגול הם נתוני עבר שהתקבלו משירות Yahoo Finance. הם נועדו לבדיקה פרטית בלבד, לא להפצה, ועלולים להכיל אי דיוקים. לשונית "שוק" מציגה נתוני הדגמה בדויים. תוכן השיעורים נכתב על סמך מקורות ציבוריים, בעיקר אתר Investor.gov של רשות ניירות הערך האמריקאית וערכים בוויקיפדיה. הוא טיוטה שלא נבדקה על ידי מומחה, ואינו כולל כללים ספציפיים לישראל כגון מסים. המנוי והתשלום באפליקציה הם הדגמה בלבד.'],
  ['גיל ושימוש', 'השימוש מיועד לבני 15 ומעלה. מי שטרם מלאו לו 18 מצהיר שהוריו או אפוטרופסו מודעים לשימוש שלו באפליקציה. אין להשתמש באפליקציה לשום מטרה בלתי חוקית, ואין לנסות לשבש את פעולתה.'],
  ['פרטיות ונתונים אישיים', 'בהרשמה אפשר להזין שם, גיל, אימייל וסיסמה. הפרטים האלה, וההתקדמות שלכם (שיעורים, כוכבים, תוצאות תרגול), נשמרים רק בדפדפן שלכם, במכשיר שלכם. אין שרת, ולכן אנחנו לא מקבלים אותם ולא אוספים אותם. הסיסמה נשמרת בצורה פשוטה שאינה מאובטחת באמת, ולכן אל תשתמשו בסיסמה שאתם משתמשים בה במקום אחר. אפשר למחוק את הכול בכל עת דרך "על גרסת הניסוי" בפרופיל, או בניקוי נתוני האתר בדפדפן. ההתחברות עם Google ו-Apple היא הדגמה ואינה מחוברת לחשבונות אמיתיים.'],
  ['עוגיות ואחסון מקומי', 'האפליקציה אינה משתמשת בעוגיות פרסום או מעקב. היא משתמשת באחסון המקומי של הדפדפן (Local Storage) כדי לזכור את ההתקדמות, את ההגדרות (כמו צליל) ואת אישור התנאים האלה. האפליקציה טוענת גופנים משירות Google Fonts, ולכן כתובת ה-IP שלכם עשויה להיחשף לגוגל בעת הטעינה, בכפוף למדיניות הפרטיות שלה. אין באפליקציה אנליטיקה או פרסומות.'],
  ['משוב', 'כפתור המשוב מכין הודעה קצרה ופותח את וואטסאפ. ההודעה לא נשלחת עד שתלחצו על "שלח", והשימוש בוואטסאפ כפוף לתנאים ולמדיניות הפרטיות שלו.'],
  ['קניין רוחני', 'העיצוב, האיורים, הטקסטים והקוד של האפליקציה שייכים למפעיליה, ואין להעתיקם או להפיצם ללא רשות. מקורות חיצוניים ונתוני שוק שייכים לבעליהם ומשמשים כאן בהתאם לאמור בסעיף "נתונים ומקורות".'],
  ['הגבלת אחריות', 'האפליקציה ניתנת "כפי שהיא", בלי התחייבות לדיוק, לשלמות או לזמינות. ככל שהדין מתיר, מפעילי האפליקציה לא יישאו באחריות לנזק או להפסד כלשהם, ישירים או עקיפים, הנובעים מהשימוש באפליקציה או מהסתמכות על התוכן שבה, ובכלל זה החלטות כספיות. השימוש הוא באחריות המשתמש.'],
  ['שינויים בתנאים', 'ייתכן שנעדכן את התנאים האלה. בשינוי מהותי נבקש את אישורכם מחדש.'],
  ['דין ויצירת קשר', 'על התנאים האלה יחול הדין הישראלי. שאלות והערות אפשר לשלוח דרך כפתור "משוב" באפליקציה.']
];
const termsOk = () => { const t = loadDB().terms; return !!(t && t.v === TERMS_VERSION); };
screens.terms = (mode) => {
  const view = mode === 'view', t = loadDB().terms;
  scr.innerHTML = `<div class="anim terms">
    ${view ? `<div class="top"><button class="icon-btn" id="tbk" aria-label="חזרה">${ic.back}</button><h2>תנאי שימוש ופרטיות</h2><span style="width:42px"></span></div>` : `<div class="tlogo">${authLogo ? authLogo() : ''}</div><h1 class="th">לפני שמתחילים</h1><p class="muted tsub">קראו ואשרו את תנאי השימוש והפרטיות. זה לוקח דקה.</p>`}
    <div class="tsum">${TERMS_SUMMARY.map(([h, p]) => `<div><b>${h}</b><span>${p}</span></div>`).join('')}</div>
    <div class="tfull"><h3>התקנון המלא</h3><span class="muted tver">גרסת ניסוי · תנאים מגרסה ${TERMS_VERSION} · ${BUILD_DATE}</span>
      ${TERMS_TEXT.map(([h, p], i) => `<section><h4>${i + 1}. ${h}</h4><p>${p}</p></section>`).join('')}</div>
    ${view ? `<p class="muted tver" style="text-align:center">${t ? 'אושר בתאריך ' + new Date(t.at).toLocaleDateString('he-IL') : ''}</p>` : `<div class="tend" id="tend">
      <button class="check" id="tc1" type="button"><i></i><span>קראתי והבנתי את תנאי השימוש והפרטיות. אני מבין/ה שהתוכן באפליקציה לימודי בלבד ואינו ייעוץ השקעות או המלצה.</span></button>
      <button class="check" id="tc2" type="button"><i></i><span>אני בן/בת 15 ומעלה. אם אני מתחת ל-18, ההורה או האפוטרופוס שלי יודעים שאני משתמש/ת באפליקציה.</span></button>
      <div class="slide2 off" id="sl" role="slider" tabindex="0" aria-label="החליקו לאישור והמשך" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div class="sl-fill"></div><span class="sl-txt" id="slt">סמנו את שתי התיבות כדי לאשר</span>
        <div class="sl-knob" id="slk"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></div></div></div>`}
  </div>${view ? '' : '<button class="tgo" id="tgo" type="button">קפצו לסוף ואשרו <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg></button>'}`;
  if (view) { $('#tbk').onclick = () => go('profile'); return; }
  const st = { a: false, b: false, done: false }, sl = $('#sl'), knob = $('#slk'), fill = $('.sl-fill', sl), KW = 56;
  const unlocked = () => st.a && st.b;
  const upd = () => { sl.classList.toggle('off', !unlocked()); $('#slt').textContent = unlocked() ? 'החליקו לאישור' : 'סמנו את שתי התיבות כדי לאשר'; };
  const setP = (p) => { const max = sl.clientWidth - KW - 8; knob.style.transform = `translateX(${-p * max}px)`; fill.style.width = (KW + 8 + p * max) + 'px'; sl.setAttribute('aria-valuenow', Math.round(p * 100)); $('#slt').style.opacity = 1 - Math.min(1, p * 1.6); };
  const finish = () => {
    if (st.done) return; st.done = true; setP(1); sl.classList.add('ok'); knob.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'; $('#slt').textContent = 'אושר!'; $('#slt').style.opacity = 1;
    const d = loadDB(); d.terms = { v: TERMS_VERSION, at: new Date().toISOString() }; save(); SFX.play('win');
    if (!reduceMotion) {
      const r = knob.getBoundingClientRect(), ph = $('#phone').getBoundingClientRect(), x = r.left + r.width / 2 - ph.left, y = r.top + r.height / 2 - ph.top;
      const ov = document.createElement('div'); ov.className = 'appr'; ov.style.setProperty('--x', x + 'px'); ov.style.setProperty('--y', y + 'px'); ov.innerHTML = `<i></i><i></i><i></i>${confetti(46)}`; $('#phone').appendChild(ov); setTimeout(() => ov.remove(), 2200);
    }
    setTimeout(() => { scr.onscroll = null; bootRoute(); }, reduceMotion ? 150 : 1150);
  };
  $('#tc1').onclick = () => { st.a = !st.a; $('#tc1').classList.toggle('on', st.a); upd(); };
  $('#tc2').onclick = () => { st.b = !st.b; $('#tc2').classList.toggle('on', st.b); upd(); };
  let drag = null;
  knob.addEventListener('pointerdown', (e) => { if (!unlocked() || st.done) return; drag = { x: e.clientX }; knob.style.transition = fill.style.transition = 'none'; try { knob.setPointerCapture(e.pointerId); } catch (_) { } });
  knob.addEventListener('pointermove', (e) => { if (!drag) return; const max = sl.clientWidth - KW - 8; setP(Math.max(0, Math.min(1, (drag.x - e.clientX) / max))); });
  const end = () => { if (!drag) return; drag = null; const max = sl.clientWidth - KW - 8, cur_ = Math.abs(+(knob.style.transform.match(/-?[\d.]+/) || [0])[0]) / max; knob.style.transition = fill.style.transition = 'transform .4s cubic-bezier(.34,1.56,.64,1), width .4s cubic-bezier(.34,1.56,.64,1)'; if (cur_ >= .9) finish(); else setP(0); };
  knob.addEventListener('pointerup', end); knob.addEventListener('pointercancel', end);
  sl.addEventListener('keydown', (e) => { if (!unlocked()) return; if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowLeft') { e.preventDefault(); finish(); } });
  $('#tgo').onclick = () => scr.scrollTo({ top: scr.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
  scr.onscroll = () => { const near = scr.scrollHeight - scr.scrollTop - scr.clientHeight < 140; $('#tgo') && $('#tgo').classList.toggle('gone', near); };
};
