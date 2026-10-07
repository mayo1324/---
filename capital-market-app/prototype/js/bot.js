'use strict';
/* ===== app helper bot + community (demo) =====
   The bot is rule-based (ready-made answers, no AI model, no server). It only answers questions about using this app
   and where things are. It does not answer questions about what to buy or sell. After an answer a pop-up offers to open the place. */
const BOT_ADVICE = /תמליץ|המלצ|מה (כדאי )?(לקנות|למכור|להשקיע)|האם (כדאי|לקנות|למכור|להשקיע)|להשקיע ב|תחזית|יעלה|יירד|תרוויח|איזו מניה|איזה מניה|איזה נכס כדאי|כדאי לי לקנות|כדאי לקנות|כדאי למכור/;
const BOT_INTENTS = [
  { k: ['שכחתי סיסמה', 'איפוס סיסמה'], a: 'בגרסת הניסוי אי אפשר לאפס סיסמה. אפשר להירשם עם אימייל חדש. החשבונות נשמרים בדפדפן בלבד.', go: ['profile', 0, 'פרופיל'] },
  { k: ['קהילה', 'להתייעץ', 'לשאול אנשים', 'אנשים אחרים', 'משתמשים אחרים', 'חברים באפליקציה'], a: 'בקהילה אפשר לשאול שאלות על הלמידה ועל האפליקציה ולראות מה שואלים אחרים. אין שם המלצות השקעה. כרגע זו הדגמה עם דוגמאות.', go: ['community', 0, 'קהילה'] },
  { k: ['סאונד', 'צליל', 'קול', 'שקט', 'להשתיק', 'מוזיקה'], a: 'אפשר להפעיל או לכבות את הצלילים בפרופיל, תחת "הגדרות".', go: ['profile', 0, 'פרופיל'] },
  { k: ['מנוי', 'פרימיום', 'תשלום', 'לשלם', 'מחיר'], a: 'מסך המנוי נמצא בפרופיל, בכרטיס "שדרוג לפרימיום". בגרסת הניסוי זו הדגמה: אין חיוב אמיתי וכל התכנים פתוחים.', go: ['paywall', 0, 'מסך המנוי'] },
  { k: ['מחק', 'להתנתק', 'התנתק', 'יציאה', 'חשבון', 'פרופיל', 'הגדרות', 'שם שלי'], a: 'הפרופיל נמצא בעיגול בצד המסך. שם אפשר לראות סטטיסטיקות והישגים, לכבות סאונד, להתנתק או למחוק את החשבון.', go: ['profile', 0, 'פרופיל'] },
  { k: ['רצף', 'כוכב', 'כוכבים', 'נקודות', 'רמה', 'הישג', 'xp'], a: 'רצף הימים עולה כשמסיימים שיעור או תרגיל באותו יום. כוכבים מקבלים על שיעורים ועל חשיבה נכונה בתרגול, והנקודות מעלות רמה.', go: ['profile', 0, 'פרופיל'] },
  { k: ['מילון', 'מונח', 'מושג', 'מילה', 'מה זה', 'הגדרה', 'סטופ', 'תמיכה', 'התנגדות', 'נפח', 'נר'], a: 'כל המונחים מוסברים במילון בשפה פשוטה, עם איור ודוגמה. אפשר גם ללחוץ על כל מונח עם קו מקווקו כדי לראות הסבר.', go: ['glossary', 0, 'מילון'] },
  { k: ['תרגול', 'תרגיל', 'לתרגל', 'מקרה', 'מקרים'], a: 'התרגול נמצא בלשונית "תרגול". יש 10 מקרים: מסתכלים על גרף אמיתי מהעבר בלי לדעת מה הנכס, מחליטים אם לקנות או לחכות, ובונים תוכנית. הציון הוא על החשיבה ולא על המזל.', go: ['practiceHome', 0, 'תרגול'] },
  { k: ['תיק', 'ארנק', 'וירטואלי', 'כסף פנוי'], a: 'התיק הוירטואלי נמצא בלשונית "תיק". יש בו כסף לתרגול בלבד, ואפשר לראות שם פוזיציות והיסטוריה. הוא נפתח אחרי סיום השיעורים, או מהפרופיל בכלי ההדגמה.', go: ['portfolio', 0, 'תיק'] },
  { k: ['לקנות', 'קנייה', 'קונים', 'למכור', 'מכירה', 'מוכרים', 'עסקה', 'סטופ לוס'], a: 'קונים ומוכרים בכסף וירטואלי במסך של נכס: נכנסים ללשונית "שוק", בוחרים נכס ולוחצים על "קנייה". אפשר גם לקבוע סטופ ויעד. התיק צריך להיות פתוח.', go: ['market', 0, 'שוק'] },
  { k: ['שוק', 'מניה', 'מניות', 'מדד', 'מדדים', 'נכס', 'נכסים', 'מחירים', 'גרף'], a: 'בלשונית "שוק" אפשר לחפש מדדים ומניות, לראות גרפים עם כלי ציור ולהוסיף למעקב. הנתונים שם בדויים ומיועדים להדגמה.', go: ['market', 0, 'שוק'] },
  { k: ['שיעור', 'שיעורים', 'ללמוד', 'לימוד', 'לימודים', 'חידון', 'מתחילים', 'להתחיל', 'מאיפה', 'איפה אני מתחיל', 'עזרה'], a: 'הכי טוב להתחיל מהשיעורים: כל שיעור קצר, עם איורים ובדיקה קטנה בסוף. אחריהם אפשר לעבור לתרגול.', go: ['lessons', 0, 'שיעורים'] },
  { k: ['בית', 'ראשי', 'דף הבית', 'מסך ראשי'], a: 'מסך הבית מראה איפה עצרת, את הרצף והכוכבים שלך, ואת הצעדים הבאים.', go: ['home', 0, 'מסך הבית'] },
  { k: ['שלום', 'היי', 'הי', 'מה נשמע', 'תודה'], a: 'היי! אני עוזר אוטומטי לאפליקציה. אפשר לשאול אותי איפה דברים נמצאים ומה עושים, למשל "איפה המילון?" או "איך מתרגלים?".' }
];
const BOT_CHIPS = ['איפה אני מתחיל?', 'איך מתרגלים?', 'איפה המילון?', 'איך קונים באפליקציה?', 'איפה הקהילה?'];
const botNorm = (s) => String(s || '').toLowerCase().replace(/[֑-ׇ]/g, '').replace(/["'׳״.,!?;:()\-]/g, ' ').replace(/\s+/g, ' ').trim();
function botAnswer(q) {
  const t = botNorm(q);
  if (!t) return { a: 'כתבו שאלה על האפליקציה.' };
  if (BOT_ADVICE.test(t)) return { a: 'אני עוזר רק בשאלות על האפליקציה: איפה דברים נמצאים ומה עושים. אני לא נותן המלצות השקעה או ייעוץ, ולא אומר מה לקנות או למכור. לשאלות על הלמידה אפשר לעבור לשיעורים או לשאול בקהילה.', go: ['lessons', 0, 'שיעורים'] };
  const hit = BOT_INTENTS.find(it => it.k.some(w => t.includes(botNorm(w))));
  if (hit) return hit;
  return { a: 'לא הבנתי. אני עוזר רק בשאלות על האפליקציה. אפשר לשאול למשל: "איפה המילון?", "איך מתרגלים?" או "איפה הקהילה?".' };
}

/* ----- floating button, chat sheet, "take me there" pop-up ----- */
const botLog = [];
(function initBot() {
  const ph = $('#phone');
  const fab = document.createElement('button');
  fab.id = 'botfab'; fab.className = 'botfab'; fab.hidden = true; fab.setAttribute('aria-label', 'עוזר האפליקציה');
  fab.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9 11h.01M12 11h.01M15 11h.01"/></svg>';
  const pop = document.createElement('div'); pop.id = 'navpop'; pop.className = 'navpop'; pop.hidden = true;
  ph.appendChild(fab); ph.appendChild(pop);
  let popT = 0;
  const hidePop = () => { clearTimeout(popT); pop.classList.remove('show'); setTimeout(() => { if (!pop.classList.contains('show')) pop.hidden = true; }, 250); };
  window.botAskGo = (label, name, arg) => {
    pop.innerHTML = `<div class="np-t"><b>רוצה שאקח אותך ל${label}?</b><span>אפשר לעבור לשם ישר.</span></div><div class="np-b"><button class="btn primary small" id="np-go">קח אותי</button><button class="btn ghost small" id="np-no">לא עכשיו</button></div>`;
    pop.hidden = false; requestAnimationFrame(() => pop.classList.add('show'));
    $('#np-go').onclick = () => { hidePop(); closeSheet(); go(name, arg); };
    $('#np-no').onclick = hidePop;
    clearTimeout(popT); popT = setTimeout(hidePop, 12000);
  };
  const bubble = (who, text) => `<div class="bm ${who}">${text}</div>`;
  const addMsg = (who, text, asText) => {
    const box = $('#botmsgs'); if (!box) return;
    const d = document.createElement('div'); d.className = 'bm ' + who; if (asText) d.textContent = text; else d.innerHTML = text;
    box.appendChild(d); box.scrollTop = box.scrollHeight;
  };
  const ask = (q) => {
    q = String(q || '').trim().slice(0, 200); if (!q) return;
    botLog.push({ who: 'me', t: q }); addMsg('me', q, true);
    const r = botAnswer(q);
    const box = $('#botmsgs'), typing = document.createElement('div'); typing.className = 'bm bot typing'; typing.innerHTML = '<i></i><i></i><i></i>'; box.appendChild(typing); box.scrollTop = box.scrollHeight;
    setTimeout(() => {
      typing.remove(); botLog.push({ who: 'bot', t: r.a }); addMsg('bot', r.a, true); SFX.play('pop');
      if (r.go) setTimeout(() => botAskGo(r.go[2], r.go[0], r.go[1]), 500);
    }, reduceMotion ? 0 : 650);
  };
  fab.onclick = () => {
    hidePop();
    openSheet(`<div class="botbox"><div class="bothead"><div><h3>עוזר האפליקציה</h3><span class="muted">עוזר אוטומטי עם תשובות מוכנות. עונה רק על שאלות על האפליקציה, בלי המלצות השקעה.</span></div></div>
      <div class="botmsgs" id="botmsgs"></div>
      <div class="chips botchips">${BOT_CHIPS.map(c => `<button class="chip" data-bq="${c}">${c}</button>`).join('')}</div>
      <form class="botform" id="botform"><input class="gi" id="botq" placeholder="שאלו על האפליקציה" maxlength="200" autocomplete="off"><button class="btn primary small" type="submit">שלח</button></form></div>`);
    const box = $('#botmsgs');
    if (!botLog.length) botLog.push({ who: 'bot', t: 'היי! אני עוזר אוטומטי. אפשר לשאול אותי איפה דברים נמצאים באפליקציה ומה עושים. לשאלות על מה לקנות או למכור אני לא עונה.' });
    botLog.forEach(m => addMsg(m.who, m.t, true));
    $('#botform').onsubmit = (e) => { e.preventDefault(); const i = $('#botq'); const v = i.value; i.value = ''; ask(v); };
    $$('[data-bq]', $('#sheet')).forEach(b => b.onclick = () => ask(b.dataset.bq));
  };
})();

/* ----- community (demo: sample posts only, new posts stay in this browser) ----- */
const COMM_DEMO = [
  { n: 'נועם', age: 16, q: 'איך אני יודע אם התרגיל הלך טוב אם יצא לי הפסד?', a: [['מיכל', 17, 'הציון הוא על התהליך. אפשר לקבל 3 כוכבים גם כשהסטופ נפגע, כי ההפסד נשאר קטן.']] },
  { n: 'תומר', age: 15, q: 'איפה אני רואה שוב את המונחים שלמדתי?', a: [['יעל', 16, 'במילון. הוא בלשונית שיעורים, בכרטיס "מילון מונחים".']] },
  { n: 'שירה', age: 17, q: 'מישהו יודע איך מציירים קו מגמה בתרגול? נתקעתי בשלב 2.', a: [] }
];
const COMM_BLOCK = /תמליץ|המלצ|מה (כדאי )?(לקנות|למכור|להשקיע)|כדאי (לי )?(לקנות|למכור)|להשקיע ב|תחזית|יעלה|יירד|תרוויח|\d{7,}|@|https?:|www\./;
screens.community = () => {
  const ac = A(); ac.posts = ac.posts || [];
  const post = (n, age, q, a, mine) => `<div class="card cpost"><div class="cp-h"><i>${n[0]}</i><b>${n}${age ? `, ${age}` : ''}</b>${mine ? '' : '<button class="link cp-rep" data-rep="1">דיווח</button>'}</div><p>${q}</p>${a.map(([an, aa, at]) => `<div class="cp-a"><b>${an}, ${aa}</b><span>${at}</span></div>`).join('') || '<span class="muted" style="font-size:13px">עוד אין תשובות</span>'}</div>`;
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  scr.innerHTML = `<div class="anim"><div class="top"><h2>קהילה <span class="dtag">הדגמה</span></h2></div>
    <div class="card howto"><b style="display:block;margin-bottom:6px">כללי הקהילה</b><span class="muted" style="font-size:13.5px;line-height:1.7">שואלים ועונים על הלמידה ועל האפליקציה. לא כותבים המלצות על מה לקנות או למכור, ולא משתפים פרטים אישיים.</span>
      <span class="muted" style="font-size:12.5px;line-height:1.6">זו הדגמה: הפוסטים הקיימים הם דוגמאות, ופוסט חדש נשמר רק בדפדפן שלך. בגרסה האמיתית יהיו כאן משתמשים אמיתיים והשגחה.</span></div>
    <div class="card" style="margin-top:12px"><textarea class="gi cq" id="cq" rows="3" maxlength="200" placeholder="מה רוצים לשאול?"></textarea><button class="btn primary small" id="cpost" style="margin-top:10px">פרסום</button></div>
    <div id="clist" style="margin-top:12px">${ac.posts.slice().reverse().map(p => post('את.ה', '', esc(p.q), [], true)).join('')}${COMM_DEMO.map(p => post(p.n, p.age, p.q, p.a, false)).join('')}</div>
    <p class="demo-note" style="text-align:center">הקהילה היא להתייעצות על הלמידה בלבד, לא ייעוץ השקעות.</p></div>`;
  $('#cpost').onclick = () => {
    const q = $('#cq').value.trim();
    if (q.length < 5) return toast('כתבו שאלה קצת יותר ארוכה');
    if (COMM_BLOCK.test(botNorm(q)) || COMM_BLOCK.test(q)) return toast('כאן שואלים על הלמידה והאפליקציה, בלי המלצות השקעה ובלי פרטים אישיים');
    ac.posts.push({ q, t: Date.now() }); save(); SFX.play('pop'); screens.community();
  };
  scr.onclick = (e) => { if (e.target.closest('[data-rep]')) toast('תודה, הדיווח נשלח לבדיקה (הדגמה)'); };
};
