'use strict';
/* ===== helpers ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const fmt = (n, d = 2) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ===== state (localStorage guarded) ===== */
const KEY = 'cm_proto_v1';
let mem = null;
const defaults = () => ({ user: null, stars: 0, streak: 0, lessonsDone: [], practiceDone: {}, seenOnboarding: false });
function load() { if (mem) return mem; try { mem = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { mem = defaults(); } return mem; }
function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { } }
const S = () => load();

/* ===== icons ===== */
const ic = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 21V5"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M17 8v12"/><rect x="4.5" y="8" width="5" height="7" rx="1"/><rect x="14.5" y="11" width="5" height="6" rx="1"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>',
  fire: '<svg viewBox="0 0 24 24" fill="#f5883d"><path d="M12 2c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>'
};
const starSvg = (on) => `<svg viewBox="0 0 24 24"><path fill="${on ? '#f5b83d' : '#2b3038'}" d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>`;

/* ===== toast / nav ===== */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
const scr = $('#screen');
let cur = { name: '', arg: null };
function go(name, arg) {
  cur = { name, arg };
  const noTabs = ['onboarding', 'signup', 'lesson', 'practice', 'feedback', 'lessonDone'];
  const tabs = !noTabs.includes(name);
  scr.className = 'screen' + (tabs ? ' has-tabs' : '');
  scr.innerHTML = '';
  (screens[name])(arg);
  scr.scrollTop = 0;
  const tb = $('#tabbar');
  tb.hidden = !tabs;
  if (tabs) renderTabs(name);
  try { history.replaceState(null, '', '#' + name); } catch (e) { }
}
function renderTabs(active) {
  const items = [['home', 'בית', ic.home], ['lessons', 'שיעורים', ic.book], ['practiceHome', 'תרגול', ic.chart, true], ['market', 'שוק', ic.trend], ['profile', 'פרופיל', ic.user]];
  $('#tabbar').innerHTML = items.map(([id, label, icon, mid]) => `<button class="tab${active === id ? ' on' : ''}${mid ? ' mid' : ''}" data-go="${id}">${icon}<span>${label}</span></button>`).join('');
}
document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-go]');
  if (g) { go(g.dataset.go, g.dataset.arg); }
});

/* ===== sparkline / candle art ===== */
function sparkPath(vals, w, h) {
  const mn = Math.min(...vals), mx = Math.max(...vals), pad = 3;
  const pts = vals.map((v, i) => [i / (vals.length - 1) * w, h - pad - (v - mn) / (mx - mn || 1) * (h - pad * 2)]);
  let d = 'M' + pts[0].join(',');
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`; }
  return { d, area: d + ` L${w},${h} L0,${h} Z` };
}
let sid = 0;
function spark(vals, up) {
  const c = up ? '#1fd69b' : '#f0553f', id = 'sp' + (sid++), p = sparkPath(vals, 74, 34);
  return `<svg class="spark" viewBox="0 0 74 34"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><path d="${p.area}" fill="url(#${id})"/><path d="${p.d}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`;
}
function artCandles(seed) {
  const r = rng(seed); let p = 60, out = '<line x1="0" x2="400" y1="90" y2="90" stroke="#262b33" stroke-dasharray="4 5"/><line x1="0" x2="400" y1="170" y2="170" stroke="#262b33" stroke-dasharray="4 5"/><line x1="0" x2="400" y1="250" y2="250" stroke="#262b33" stroke-dasharray="4 5"/>';
  for (let i = 0; i < 11; i++) {
    const o = p, c = p + (r() - .46) * 48, hi = Math.max(o, c) + r() * 16, lo = Math.min(o, c) - r() * 16; p = c;
    const y = (v) => 270 - v * 1.9, x = 40 + i * 31, up = c >= o, col = up ? '#1fd69b' : '#f0553f';
    out += `<line x1="${x}" x2="${x}" y1="${y(hi)}" y2="${y(lo)}" stroke="${col}" stroke-width="2.4" stroke-linecap="round"/><rect x="${x - 7}" y="${y(Math.max(o, c))}" width="14" height="${Math.max(5, Math.abs(y(o) - y(c)))}" rx="3" fill="${col}"/>`;
  }
  return `<svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice">${out}</svg>`;
}

/* ===== demo market data (fictional, not real quotes) ===== */
const MARKET = [
  { n: 'מדד הדגמה 100', s: 'מדד', p: 1842.35, c: 1.24, col: '#2f6fed', k: 'index', v: [10, 11, 10.5, 12, 11.6, 13, 12.4, 14, 15, 14.6, 16] },
  { n: 'מדד טכנולוגיה הדגמה', s: 'מדד', p: 962.8, c: -0.62, col: '#8a5cf6', k: 'index', v: [16, 15, 15.5, 14, 14.4, 13, 13.8, 12, 12.6, 11.4, 11.9] },
  { n: 'אלפא בע"מ', s: 'ALFA', p: 128.4, c: 2.31, col: '#f2994a', k: 'stock', v: [8, 9, 8.6, 10, 11, 10.4, 12, 11.2, 13, 14, 15] },
  { n: 'ביתא תעשיות', s: 'BETA', p: 54.12, c: -1.08, col: '#1ea7a1', k: 'stock', v: [14, 13, 13.6, 12.2, 12.8, 11, 11.8, 10.4, 10, 9.2, 9.6] },
  { n: 'גמא אנרגיה', s: 'GAMA', p: 87.9, c: 0.44, col: '#d8559a', k: 'stock', v: [10, 10.6, 10.2, 11, 10.8, 11.6, 11.2, 12, 11.6, 12.4, 12.2] }
];
function marketRows(filter) {
  return MARKET.filter(m => filter === 'all' || m.k === filter).map(m => `
    <div class="row" data-soon="1"><div class="logo" style="background:${m.col}">${m.s.slice(0, 2)}</div>
    <div class="nm"><b>${m.n}</b><span>${m.s}</span></div>${spark(m.v, m.c >= 0)}
    <div class="px"><b>${fmt(m.p)}</b><span class="${m.c >= 0 ? 'up' : 'down'}">${m.c >= 0 ? '+' : ''}${fmt(m.c)}%</span></div></div>`).join('');
}
document.addEventListener('click', (e) => { if (e.target.closest('[data-soon]')) toast('בקרוב: השוק הפתוח'); });

/* ===== lessons content ===== */
const WARN_DAY = 'מסחר יומי קשה יותר, ובדרך כלל מפסידים בו יותר. מקור: לא ידוע, יתווסף.';
const LESSONS = [
  {
    id: 'l1', title: 'מה זה שוק ההון?', min: 8, color: '#1fd69b', slides: [
      { t: 'מניה היא חלק קטן מחברה', b: 'כשקונים מניה, קונים חתיכה קטנה מחברה. אם החברה גדלה ושווה יותר, החתיכה שלך יכולה להיות שווה יותר. אם החברה נחלשת, היא יכולה להיות שווה פחות.', v: 'pie' },
      { t: 'הבורסה היא השוק', b: 'הבורסה היא מקום שבו אנשים קונים ומוכרים מניות. כל עסקה היא בין מי שרוצה לקנות לבין מי שרוצה למכור.', v: 'market' },
      { t: 'המחיר זז לפי ביקוש', b: 'כשיותר אנשים רוצים לקנות מניה מאשר למכור אותה, המחיר נוטה לעלות. כשיותר אנשים רוצים למכור, המחיר נוטה לרדת.', v: 'scale' },
      { t: 'תמיד יש סיכון', b: 'מחיר של מניה יכול לרדת, ואפשר להפסיד כסף. אף אחד לא יכול להבטיח רווח, ולכן לומדים לנהל סיכון.', v: 'candles' },
      { t: 'יש כמה סגנונות', b: 'יש מי שמחזיק מניות שנים (טווח ארוך), יש מי שמחזיק שבועות (סווינג), ויש מי שקונה ומוכר באותו יום (יומי). אין סגנון אחד נכון לכולם.', w: WARN_DAY, v: 'styles' }
    ],
    q: { q: 'מה קורה למחיר כשיותר אנשים רוצים לקנות מאשר למכור?', o: ['הוא נוטה לעלות', 'הוא נוטה לרדת', 'הוא תמיד נשאר זהה'], a: 0 }
  },
  {
    id: 'l2', title: 'איך קוראים נרות', min: 9, color: '#6aa8ff', slides: [
      { t: 'נר אחד הוא פרק זמן אחד', b: 'כל נר בגרף מראה מה קרה למחיר בפרק זמן מסוים, למשל יום אחד. הוא מראה ארבעה מחירים: פתיחה, סגירה, הכי גבוה והכי נמוך.', v: 'candle1' },
      { t: 'ירוק ואדום', b: 'נר ירוק אומר שהמחיר בסגירה היה גבוה מהפתיחה. נר אדום אומר שהוא היה נמוך מהפתיחה.', v: 'candle2' },
      { t: 'הגוף והפתילים', b: 'הגוף הוא המרחק בין הפתיחה לסגירה. הקווים הדקים למעלה ולמטה הם הפתילים, והם מראים עד איפה המחיר הגיע בדרך.', v: 'candle1' },
      { t: 'גרף הוא הרבה נרות ברצף', b: 'כשמסתכלים על הרבה נרות יחד אפשר לראות כיוון: עלייה, ירידה או תנועה לצדדים. זה עוזר להחליט, אבל לא מבטיח מה יקרה.', v: 'candles' }
    ],
    q: { q: 'נר ירוק אומר ש...', o: ['הסגירה גבוהה מהפתיחה', 'הסגירה נמוכה מהפתיחה', 'לא היו עסקאות'], a: 0 }
  },
  {
    id: 'l3', title: 'כניסה, סטופ ויעד', min: 10, color: '#f5b83d', slides: [
      { t: 'תוכנית לפני עסקה', b: 'לפני שנכנסים לעסקה מחליטים שלושה דברים: באיזה מחיר נכנסים, באיזה מחיר יוצאים אם טעינו, ובאיזה מחיר יוצאים אם צדקנו.', v: 'rr' },
      { t: 'כניסה', b: 'הכניסה היא המחיר שבו קונים. כניסה טובה היא כזאת שיש לה סיבה, למשל אזור שבו המחיר כבר עצר בעבר.', v: 'rr' },
      { t: 'סטופ', b: 'הסטופ הוא המחיר שבו יוצאים כדי להגביל הפסד. מניחים אותו במקום שאם המחיר מגיע אליו, התוכנית שלנו כנראה לא נכונה.', v: 'rr' },
      { t: 'יעד', b: 'היעד הוא המחיר שבו לוקחים רווח. כדאי שהיעד יהיה רחוק מהכניסה יותר מהסטופ, כדי שגם אם טועים לפעמים, התוכנית עדיין הגיונית.', v: 'rr' },
      { t: 'בתרגול אין כסף אמיתי', b: 'בתרגילים של האפליקציה תסמנו כניסה, סטופ ויעד על גרף, תריצו אותו ותקבלו משוב. זה לימודי בלבד ולא המלצה לשום עסקה.', v: 'rr' }
    ],
    q: { q: 'מה תפקיד הסטופ?', o: ['להגביל הפסד', 'להבטיח רווח', 'לקנות עוד מניות'], a: 0 }
  },
  {
    id: 'l4', title: 'יחס סיכוי וסיכון', min: 8, color: '#f0553f', slides: [
      { t: 'כמה מסכנים וכמה מרוויחים', b: 'סיכון הוא המרחק בין הכניסה לסטופ. סיכוי הוא המרחק בין הכניסה ליעד. היחס ביניהם אומר אם התוכנית שווה את המאמץ.', v: 'rr' },
      { t: 'דוגמה עם מספרים', b: 'כניסה ב-100, סטופ ב-95, יעד ב-110. הסיכון הוא 5, הסיכוי הוא 10, והיחס הוא 1 ל-2. כלומר על כל שקל שמסכנים, מכוונים לשני שקלים.', v: 'rr' },
      { t: 'יחס טוב לא מבטיח רווח', b: 'גם תוכנית עם יחס טוב יכולה להפסיד. המטרה היא תוכנית הגיונית שחוזרים עליה, לא ניצחון בכל עסקה.', v: 'candles' }
    ],
    q: { q: 'כניסה 100, סטופ 95, יעד 110. מה היחס?', o: ['1 ל-2', '1 ל-1', '2 ל-1'], a: 0 }
  },
  { id: 'l5', title: 'תמיכה והתנגדות', min: 9, color: '#8a5cf6', soon: true, slides: [] },
  { id: 'l6', title: 'ניהול סיכונים', min: 10, color: '#d8559a', soon: true, slides: [] }
];
function lessonVis(v) {
  const g = '#1fd69b', r = '#f0553f';
  const candle = (x, o, c, h, l, up) => { const col = up ? g : r; return `<line x1="${x}" x2="${x}" y1="${h}" y2="${l}" stroke="${col}" stroke-width="3" stroke-linecap="round"/><rect x="${x - 14}" y="${Math.min(o, c)}" width="28" height="${Math.abs(o - c)}" rx="5" fill="${col}"/>`; };
  const lab = (x, y, t) => `<text x="${x}" y="${y}" fill="#8b93a1" font-size="12" font-family="Heebo,sans-serif" text-anchor="middle">${t}</text>`;
  const V = {
    pie: `<svg viewBox="0 0 300 170"><circle cx="150" cy="85" r="58" fill="#1c2026"/><path d="M150 85 L150 27 A58 58 0 0 1 200 114 Z" fill="${g}"/>${lab(150, 160, 'המניה שלך: חלק קטן מהחברה')}</svg>`,
    market: `<svg viewBox="0 0 300 170"><rect x="40" y="40" width="80" height="70" rx="14" fill="#1c2026"/><rect x="180" y="40" width="80" height="70" rx="14" fill="#1c2026"/><path d="M125 65h50M125 85h50" stroke="${g}" stroke-width="3" stroke-linecap="round"/><path d="M168 58l9 7-9 7M132 78l-9 7 9 7" fill="none" stroke="${g}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${lab(80, 130, 'קונה')}${lab(220, 130, 'מוכר')}${lab(150, 160, 'הבורסה')}</svg>`,
    scale: `<svg viewBox="0 0 300 170"><path d="M150 140V60M100 140h100" stroke="#5d6571" stroke-width="4" stroke-linecap="round"/><path d="M60 80l180-20" stroke="${g}" stroke-width="5" stroke-linecap="round"/><rect x="40" y="80" width="50" height="30" rx="8" fill="#1c2026"/><rect x="210" y="40" width="50" height="30" rx="8" fill="${g}" opacity=".85"/>${lab(65, 100, 'מכירה')}${lab(235, 60, 'קנייה')}</svg>`,
    candles: `<svg viewBox="0 0 300 170">${candle(60, 100, 70, 55, 120, true)}${candle(105, 70, 90, 50, 105, false)}${candle(150, 90, 55, 40, 100, true)}${candle(195, 55, 80, 35, 95, false)}${candle(240, 80, 40, 25, 100, true)}</svg>`,
    styles: `<svg viewBox="0 0 300 170"><g font-family="Heebo,sans-serif" font-size="13" fill="#c9cfd8" text-anchor="middle"><rect x="20" y="40" width="80" height="80" rx="16" fill="#1c2026"/><rect x="110" y="40" width="80" height="80" rx="16" fill="#1c2026"/><rect x="200" y="40" width="80" height="80" rx="16" fill="#1c2026"/><text x="60" y="86">טווח</text><text x="60" y="104">ארוך</text><text x="150" y="86">סווינג</text><text x="240" y="86">יומי</text></g></svg>`,
    candle1: `<svg viewBox="0 0 300 170">${candle(120, 100, 55, 35, 130, true)}<g stroke="#5d6571" stroke-dasharray="3 4"><path d="M145 35h70M145 55h70M145 100h70M145 130h70"/></g><g font-family="Heebo,sans-serif" font-size="12" fill="#8b93a1"><text x="222" y="39">הכי גבוה</text><text x="222" y="59">סגירה</text><text x="222" y="104">פתיחה</text><text x="222" y="134">הכי נמוך</text></g></svg>`,
    candle2: `<svg viewBox="0 0 300 170">${candle(90, 110, 60, 45, 130, true)}${candle(210, 60, 110, 45, 130, false)}${lab(90, 158, 'ירוק: עלייה')}${lab(210, 158, 'אדום: ירידה')}</svg>`,
    rr: `<svg viewBox="0 0 300 170"><rect x="30" y="35" width="240" height="50" rx="8" fill="${g}" opacity=".14"/><rect x="30" y="85" width="240" height="40" rx="8" fill="${r}" opacity=".16"/><path d="M30 35h240" stroke="${g}" stroke-width="2.5"/><path d="M30 85h240" stroke="#6aa8ff" stroke-width="2.5"/><path d="M30 125h240" stroke="${r}" stroke-width="2.5"/><g font-family="Heebo,sans-serif" font-size="13" font-weight="700"><text x="262" y="29" fill="${g}" text-anchor="end">יעד 110</text><text x="262" y="79" fill="#6aa8ff" text-anchor="end">כניסה 100</text><text x="262" y="148" fill="${r}" text-anchor="end">סטופ 95</text></g></svg>`
  };
  return V[v] || '';
}

/* ===== screens ===== */
const screens = {};

/* onboarding */
screens.onboarding = (i = 0) => {
  i = +i || 0;
  const slides = [
    ['למדו שוק הון בצורה אחרת', 'שיעורים קצרים של כ-10 דקות, ואחריהם תרגול על גרף נרות. בלי משעמם ובלי מילים מסובכות.', 11],
    ['תרגלו על מקרים אמיתיים בלי כסף אמיתי', 'מסמנים כניסה, סטופ ויעד, מריצים את הגרף ומקבלים משוב מיידי. טעות היא חלק מהלמידה.', 23],
    ['צברו כוכבים והתקדמו', 'כל תרגיל שנכון נותן כוכבים. הכול לימודי בלבד, בלי המלצות השקעה ובלי הבטחות לרווח.', 37]
  ];
  const [h, p, seed] = slides[i];
  scr.innerHTML = `<div class="ob anim">
    <button class="skip link" id="skip">דלג</button>
    <div class="ob-art">${artCandles(seed)}<div class="ob-card"><span class="eyebrow">כוכבים</span><b>${'★'.repeat(i + 1)}</b></div></div>
    <h1>${h}</h1><p>${p}</p>
    <div class="dots">${slides.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="grow"></div>
    <button class="btn primary" id="next">${i === 2 ? 'בואו נתחיל' : 'המשך'}</button></div>`;
  $('#skip').onclick = () => { S().seenOnboarding = true; save(); go('signup'); };
  $('#next').onclick = () => { if (i === 2) { S().seenOnboarding = true; save(); go('signup'); } else screens.onboarding(i + 1); };
};

/* signup */
screens.signup = () => {
  const st = { goal: 'להבין איך זה עובד', terms: false };
  scr.innerHTML = `<div class="anim">
    <div class="top"><button class="icon-btn" id="bk">${ic.back}</button><span></span></div>
    <h1>יוצרים חשבון</h1><p class="muted" style="margin-top:8px">שנייה אחת ואתם בפנים. אין כסף אמיתי באפליקציה.</p>
    <div class="field"><label>איך לקרוא לך?</label><input class="inp" id="nm" placeholder="השם שלך" autocomplete="off"><div class="err-t" id="e-nm"></div></div>
    <div class="field"><label>גיל</label><input class="inp" id="age" type="number" inputmode="numeric" placeholder="15 ומעלה" min="1" max="99"><div class="err-t" id="e-age"></div></div>
    <div class="field"><label>אימייל</label><input class="inp" id="em" type="email" dir="ltr" style="text-align:right" placeholder="name@example.com"><div class="err-t" id="e-em"></div></div>
    <div class="field"><label>מה המטרה שלך?</label><div class="chips" id="goals">${['להבין איך זה עובד', 'ללמוד לקרוא גרפים', 'סתם סקרנות'].map(g => `<button class="chip${g === st.goal ? ' on' : ''}">${g}</button>`).join('')}</div></div>
    <button class="check" id="terms"><i></i><span>אני מבין שהתוכן לימודי בלבד, אין בו המלצות השקעה והבטחות לרווח, ואין כסף אמיתי באפליקציה.</span></button>
    <div class="err-t" id="e-t"></div>
    <div style="height:18px"></div>
    <button class="btn primary" id="go">יצירת חשבון</button></div>`;
  $('#bk').onclick = () => go('onboarding', 0);
  $('#goals').onclick = (e) => { const c = e.target.closest('.chip'); if (!c) return; $$('.chip', $('#goals')).forEach(x => x.classList.remove('on')); c.classList.add('on'); st.goal = c.textContent; };
  $('#terms').onclick = () => { st.terms = !st.terms; $('#terms').classList.toggle('on', st.terms); };
  const setErr = (id, msg, inp) => { $('#e-' + id).textContent = msg || ''; if (inp) $('#' + inp).classList.toggle('err', !!msg); return !!msg; };
  $('#go').onclick = () => {
    const nm = $('#nm').value.trim(), age = +$('#age').value, em = $('#em').value.trim();
    let bad = false;
    bad = setErr('nm', nm.length < 2 ? 'כתבו שם של לפחות שתי אותיות' : '', 'nm') || bad;
    bad = setErr('age', !age ? 'כתבו גיל' : age < 15 ? 'האפליקציה מיועדת לגיל 15 ומעלה' : '', 'age') || bad;
    bad = setErr('em', /^\S+@\S+\.\S+$/.test(em) ? '' : 'כתבו אימייל תקין', 'em') || bad;
    bad = setErr('t', st.terms ? '' : 'צריך לאשר כדי להמשיך') || bad;
    if (bad) return;
    Object.assign(S(), { user: { name: nm, age, email: em, goal: st.goal }, streak: 1 }); save();
    go('home');
  };
};

/* home */
screens.home = () => {
  const s = S(), u = s.user || { name: 'אורח' };
  const nextL = LESSONS.find(l => !l.soon && !s.lessonsDone.includes(l.id)) || LESSONS[0];
  const done = s.lessonsDone.length, total = LESSONS.filter(l => !l.soon).length;
  scr.innerHTML = `<div class="anim">
    <div class="hello"><div class="avatar">${u.name[0]}</div><div class="t"><span class="eyebrow">שלום</span><b>${u.name}</b></div>
      <div class="pill">${ic.fire}${s.streak}</div><div class="pill" style="color:var(--gold)">${ic.star}${s.stars}</div></div>
    <div class="hero"><span class="tag">${ic.play.replace('<svg', '<svg width="12" height="12"')} ממשיכים מאיפה שעצרת</span>
      <h3>${nextL.title}</h3><p>שיעור של ${nextL.min} דקות, ואחריו תרגול.</p>
      <div class="row"><div class="bar"><i style="width:${Math.round(done / total * 100)}%"></i></div><span class="muted" style="font-size:13px">${done}/${total}</span></div>
      <button class="btn primary" data-go="lesson" data-arg="${nextL.id}">המשך לשיעור</button></div>
    <div class="mini"><div class="card"><span class="eyebrow">תרגול יומי</span><div class="big">${ic.chart.replace('<svg', '<svg width="28" height="28" style="color:var(--green)"')}</div><button class="link" style="margin-top:8px" data-go="practice" data-arg="0">התחל תרגיל</button></div>
      <div class="card"><span class="eyebrow">כוכבים שצברת</span><div class="big" style="color:var(--gold)">${s.stars} ★</div><span class="muted" style="font-size:12px">עד 3 בכל תרגיל</span></div></div>
    <div class="sec"><h3>מצב השוק (הדגמה)</h3><button class="link" data-go="market">הכול</button></div>
    <div class="filters" id="flt"><button class="chip on" data-f="all">הכול</button><button class="chip" data-f="index">מדדים</button><button class="chip" data-f="stock">מניות</button></div>
    <div class="rows card" id="mrows" style="padding:4px 16px">${marketRows('all')}</div>
    <p class="demo-note">נתוני הדגמה בדויים, לא מחירים אמיתיים. השוק הפתוח יתווסף בהמשך.</p>
    <div class="sec"><h3>המסלול שלך</h3><button class="link" data-go="lessons">כל השיעורים</button></div>
    ${LESSONS.slice(0, 3).map(l => lessonCard(l)).join('')}</div>`;
  $('#flt').onclick = (e) => { const c = e.target.closest('.chip'); if (!c) return; $$('.chip', $('#flt')).forEach(x => x.classList.remove('on')); c.classList.add('on'); $('#mrows').innerHTML = marketRows(c.dataset.f); };
};
function lessonCard(l) {
  const done = S().lessonsDone.includes(l.id);
  const cls = l.soon ? 'lock' : done ? 'done' : '';
  return `<button class="les ${cls}" ${l.soon ? 'data-soon="1"' : `data-go="lesson" data-arg="${l.id}"`}>
    <div class="ic" style="color:${done ? '#04251b' : l.color}">${l.soon ? ic.lock : done ? ic.check : ic.book}</div>
    <div class="tx"><b>${l.title}</b><span>${l.soon ? 'בקרוב' : l.min + ' דקות'}</span></div>${done ? '<span class="st">הושלם</span>' : ''}</button>`;
}

/* lessons list */
screens.lessons = () => {
  scr.innerHTML = `<div class="anim"><div class="top"><h2>שיעורים</h2><span class="pill" style="color:var(--gold)">${ic.star}${S().stars}</span></div>
    <p class="muted" style="margin-bottom:18px">כל שיעור קצר, וממשיכים לתרגול.</p>${LESSONS.map(lessonCard).join('')}</div>`;
};

/* lesson player */
screens.lesson = (id) => {
  const L = LESSONS.find(x => x.id === id) || LESSONS[0];
  let i = 0, answered = false;
  const n = L.slides.length + 1;
  const draw = () => {
    const quiz = i === L.slides.length;
    const sl = L.slides[i];
    scr.innerHTML = `<div class="anim">
      <div class="top"><button class="icon-btn" id="bk">${ic.x}</button><span class="muted" style="font-size:13px">${L.title}</span><span style="width:42px"></span></div>
      <div class="prog">${Array.from({ length: n }, (_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="slide">${quiz ? `<span class="tag">בדיקה קטנה</span><h2>${L.q.q}</h2><div class="grow">${L.q.o.map((o, k) => `<button class="opt" data-k="${k}">${o}</button>`).join('')}</div><div id="qm" class="muted" style="margin-top:14px;min-height:22px"></div>`
        : `<span class="tag">${i + 1} מתוך ${L.slides.length}</span><h2>${sl.t}</h2><p>${sl.b}</p><div class="vis">${lessonVis(sl.v)}</div>${sl.w ? `<div class="warn">${sl.w}</div>` : ''}<div class="grow"></div>`}</div>
      <div class="nav2">${i > 0 && !quiz ? `<button class="btn ghost" id="pv" style="flex:none;width:90px">חזרה</button>` : ''}<button class="btn primary" id="nx" ${quiz ? 'disabled' : ''}>${quiz ? 'סיום שיעור' : 'הבא'}</button></div></div>`;
    $('#bk').onclick = () => go('lessons');
    const pv = $('#pv'); if (pv) pv.onclick = () => { i--; draw(); };
    $('#nx').onclick = () => {
      if (!quiz) { i++; draw(); return; }
      const s = S(); if (!s.lessonsDone.includes(L.id)) { s.lessonsDone.push(L.id); s.stars += 1; save(); }
      go('lessonDone', L.id);
    };
    if (quiz) $$('.opt').forEach(b => b.onclick = () => {
      if (answered) return;
      const ok = +b.dataset.k === L.q.a;
      b.classList.add(ok ? 'ok' : 'bad');
      if (ok) { answered = true; $('#qm').innerHTML = '<span class="up">נכון! כל הכבוד.</span>'; $('#nx').disabled = false; }
      else $('#qm').innerHTML = '<span class="down">לא בדיוק, נסו שוב.</span>';
    });
  };
  draw();
};
screens.lessonDone = (id) => {
  const L = LESSONS.find(x => x.id === id) || LESSONS[0];
  scr.className = 'screen';
  scr.innerHTML = `<div class="fb ok anim" style="padding-top:60px"><div class="big-ic" style="color:var(--green)">${ic.check}</div>
    <h1>סיימת את השיעור!</h1><p class="muted" style="margin:6px 20px 0">${L.title}</p>
    <div class="stars"><span class="pop">${starSvg(true)}</span></div><p class="muted">קיבלת כוכב אחד</p>
    <div class="btns" style="margin-top:34px"><button class="btn primary" data-go="practice" data-arg="0">עכשיו לתרגול</button><button class="btn ghost" data-go="home">חזרה לבית</button></div></div>`;
  $('#tabbar').hidden = true;
};

/* market (placeholder, demo data) */
screens.market = () => {
  scr.innerHTML = `<div class="anim"><div class="top"><h2>השוק</h2><button class="icon-btn" data-soon="1">${ic.search}</button></div>
    <div class="card" style="margin-bottom:16px;background:linear-gradient(160deg,#17201d,#13171b)"><span class="eyebrow">מצב השוק (הדגמה)</span><div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><h1 class="up">+1.24%</h1>${spark(MARKET[0].v, true).replace('class="spark"', 'class="spark" style="width:130px;height:56px"')}</div></div>
    <div class="filters" id="flt"><button class="chip on" data-f="all">הכול</button><button class="chip" data-f="index">מדדים</button><button class="chip" data-f="stock">מניות</button></div>
    <div class="rows card" id="mrows" style="padding:4px 16px;margin-top:10px">${marketRows('all')}</div>
    <p class="demo-note">נתוני הדגמה בדויים, לא מחירים אמיתיים. השוק הפתוח עוד לא נבנה.</p></div>`;
  $('#flt').onclick = (e) => { const c = e.target.closest('.chip'); if (!c) return; $$('.chip', $('#flt')).forEach(x => x.classList.remove('on')); c.classList.add('on'); $('#mrows').innerHTML = marketRows(c.dataset.f); };
};

/* profile */
screens.profile = () => {
  const s = S(), u = s.user || { name: 'אורח', age: '', email: '' };
  const bd = [['👣', 'צעד ראשון', s.lessonsDone.length > 0], ['⭐', '3 כוכבים', s.stars >= 3], ['🎯', 'תרגיל מושלם', Object.values(s.practiceDone).some(v => v === 3)]];
  scr.innerHTML = `<div class="anim"><div class="pf"><div class="avatar">${u.name[0]}</div><h1 style="font-size:24px">${u.name}</h1><span class="muted" dir="ltr">${u.email || ''}</span></div>
    <div class="stat3"><div class="card"><b style="color:var(--gold)">${s.stars}</b><span>כוכבים</span></div><div class="card"><b>${s.streak}</b><span>ימים ברצף</span></div><div class="card"><b>${s.lessonsDone.length}</b><span>שיעורים</span></div></div>
    <div class="sec"><h3>הישגים</h3></div><div class="badges">${bd.map(([e, t, on]) => `<div class="badge${on ? '' : ' off'}"><i>${e}</i>${t}</div>`).join('')}</div>
    <div style="height:22px"></div><button class="btn ghost" id="rs">איפוס אב הטיפוס</button>
    <p class="disc">התוכן באפליקציה לימודי בלבד. אין בו המלצות השקעה או הבטחות לרווח, ואין כסף אמיתי. ${WARN_DAY}</p></div>`;
  $('#rs').onclick = () => { mem = defaults(); save(); go('onboarding', 0); };
};

/* ===== practice engine ===== */
const SCEN = [
  { name: 'תיקון בתוך מגמה עולה', info: 'המחיר עלה, ירד קצת, ועכשיו עצר. קנייה (לונג).', seed: 7, past: [[0, 100], [8, 107], [15, 119], [20, 114], [23, 110.5], [25, 111.5]], fut: [[0, 111.5], [4, 117], [8, 123], [13, 128]], hint: 'חפשו את הנקודה הנמוכה האחרונה שהמחיר עצר בה. הסטופ מתחתיה, והכניסה קרובה למחיר הנוכחי.' },
  { name: 'פריצה מעל תקרה', info: 'המחיר נע בטווח ופרץ מעליו. קנייה (לונג).', seed: 13, past: [[0, 102], [4, 106], [8, 101], [12, 106], [16, 104], [20, 106], [25, 106.8]], fut: [[0, 106.8], [3, 104.6], [8, 111], [13, 118]], hint: 'הסטופ צריך להיות מתחת לתחתית הטווח האחרונה, כדי שתנודה קטנה לא תוציא אתכם.' },
  { name: 'ירידה אל אזור תמיכה', info: 'המחיר ירד הרבה ונעצר באזור שבו עצר קודם. קנייה (לונג).', seed: 21, past: [[0, 140], [10, 131], [18, 124], [22, 120.5], [25, 121.5]], fut: [[0, 121.5], [4, 125], [9, 130], [13, 134]], hint: 'מצאו את המחיר הכי נמוך בנרות האחרונים. הסטופ מתחתיו, והיעד גבוה מספיק כדי שיחס הסיכוי והסיכון יהיה טוב.' }
];
function buildScen(sc) {
  const r = rng(sc.seed), N = 26, M = 14;
  const interp = (pts, k) => { for (let j = 1; j < pts.length; j++) if (k <= pts[j][0]) { const [a, pa] = pts[j - 1], [b, pb] = pts[j]; return pa + (pb - pa) * (k - a) / (b - a); } return pts[pts.length - 1][1]; };
  const candles = []; let prev = sc.past[0][1];
  for (let k = 0; k < N + M; k++) {
    const target = k < N ? interp(sc.past, k) : interp(sc.fut, k - N + 0);
    const noise = (r() - .5) * 2.2;
    let c = k === 0 ? target : target + noise, o = prev;
    if (k === N - 1) c = sc.past[sc.past.length - 1][1];
    const hi = Math.max(o, c) + r() * 1.5 + .3, lo = Math.min(o, c) - r() * 1.5 - .3;
    candles.push({ o, c, h: hi, l: lo }); prev = c;
  }
  const past = candles.slice(0, N), last = past[N - 1].c;
  const recent = past.slice(-10), swingLow = Math.min(...recent.map(c => c.l));
  const atr = past.slice(-14).reduce((a, c) => a + (c.h - c.l), 0) / 14;
  return { candles, N, M, last, swingLow, atr };
}
function evaluate(P, plan) {
  const { entry, stop, target } = plan, risk = entry - stop, reward = target - entry, rr = reward / risk;
  const checks = [
    { ok: Math.abs(entry - P.last) <= 1.5 * P.atr, t: 'כניסה', good: 'הכניסה קרובה למחיר הנוכחי, אז אפשר באמת להיכנס שם.', bad: 'הכניסה רחוקה מהמחיר הנוכחי. כניסה כזאת היא ניחוש, ולא תוכנית.' },
    { ok: stop <= P.swingLow && stop >= P.swingLow - 3 * P.atr, t: 'סטופ', good: 'הסטופ נמצא מתחת לנקודה הנמוכה האחרונה, ולא רחוק מדי.', bad: stop > P.swingLow ? 'הסטופ קרוב מדי: הוא נמצא מעל הנקודה הנמוכה האחרונה, ותנודה רגילה תוציא אתכם.' : 'הסטופ רחוק מדי, ולכן ההפסד האפשרי גדול יותר מהצורך.' },
    { ok: rr >= 1.5, t: 'יחס סיכוי וסיכון', good: `היחס הוא 1 ל-${fmt(rr, 1)}, וזה יחס הגיוני.`, bad: `היחס הוא 1 ל-${fmt(Math.max(rr, 0), 1)}. כדאי שהיעד יהיה רחוק מהכניסה לפחות פי 1.5 מהסטופ.` }
  ];
  return { checks, rr, passed: checks.filter(c => c.ok).length };
}
function simulate(P, plan) {
  for (let k = P.N; k < P.candles.length; k++) {
    const c = P.candles[k];
    if (c.l <= plan.stop) return { res: 'stop', at: k };
    if (c.h >= plan.target) return { res: 'target', at: k };
  }
  return { res: 'none', at: P.candles.length - 1 };
}

screens.practiceHome = () => {
  const d = S().practiceDone;
  scr.innerHTML = `<div class="anim"><div class="top"><h2>תרגול</h2><span class="pill" style="color:var(--gold)">${ic.star}${S().stars}</span></div>
    <p class="muted" style="margin-bottom:18px">בחרו מקרה. אלה גרפי הדגמה לימודיים, לא נתוני שוק אמיתיים.</p>
    ${SCEN.map((s, i) => `<button class="les" data-go="practice" data-arg="${i}"><div class="ic" style="color:var(--green)">${ic.chart}</div><div class="tx"><b>${s.name}</b><span>${s.info}</span></div><span class="st" style="direction:ltr">${'★'.repeat(d[i] || 0)}${'☆'.repeat(3 - (d[i] || 0))}</span></button>`).join('')}</div>`;
};

screens.practice = (idx = 0) => {
  idx = +idx || 0;
  const sc = SCEN[idx % SCEN.length], P = buildScen(sc);
  const W = 358, H = 330, AX = 46, plotW = W - AX, slot = plotW / (P.N + P.M), bw = slot * .62;
  const all = P.candles, lo = Math.min(...all.map(c => c.l)) - 3, hi = Math.max(...all.map(c => c.h)) + 3;
  const y = (v) => 8 + (hi - v) / (hi - lo) * (H - 24);
  const priceAt = (py) => hi - (py - 8) / (H - 24) * (hi - lo);
  const cx = (k) => 6 + k * slot + slot / 2;
  const plan = { entry: null, stop: null, target: null };
  let tool = 'entry', shown = P.N, running = false;
  scr.innerHTML = `<div class="anim">
    <div class="pr-head"><button class="icon-btn" id="bk">${ic.back}</button><div class="tt"><b>${sc.name}</b><span>${sc.info}</span></div><button class="icon-btn" id="hb" style="color:var(--gold)">${ic.bulb}</button></div>
    <div class="pbox"><div class="meta"><div><span class="hl">מחיר נוכחי</span><div class="price" id="px">${fmt(P.last)}</div></div><div class="hl" style="text-align:left">מקרה הדגמה #${idx + 1}</div></div>
      <svg class="chart" id="ch" viewBox="0 0 ${W} ${H}"></svg></div>
    <div class="tools" id="tools">
      <button class="tool t-entry on" data-t="entry">כניסה<b id="v-entry">--</b></button>
      <button class="tool t-stop" data-t="stop">סטופ<b id="v-stop">--</b></button>
      <button class="tool t-target" data-t="target">יעד<b id="v-target">--</b></button></div>
    <div class="instr" id="ins">לחצו על הגרף כדי לסמן כניסה</div>
    <div class="rr"><span>סיכון: <b id="rk">--</b></span><span>סיכוי: <b id="rw">--</b></span><span>יחס: <b id="rt">--</b></span></div>
    <div class="actions"><button class="btn ghost" id="rset">איפוס</button><button class="btn primary" id="run" disabled>הרץ את הגרף</button></div>
    <div id="hintBox"></div></div>`;
  const svg = $('#ch');
  const el = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; };
  function draw() {
    svg.innerHTML = '';
    const step = (hi - lo) > 40 ? 10 : 5, t0 = Math.ceil(lo / step) * step;
    for (let v = t0; v < hi; v += step) { el('line', { x1: 0, x2: plotW, y1: y(v), y2: y(v), stroke: '#262b33', 'stroke-dasharray': '3 5' }); const t = el('text', { x: W - 4, y: y(v) + 4, fill: '#5d6571', 'font-size': 11, 'text-anchor': 'end', 'font-family': 'Heebo,sans-serif' }); t.textContent = Math.round(v); }
    el('rect', { x: 6 + P.N * slot, y: 0, width: plotW - 6 - P.N * slot, height: H, fill: '#ffffff', opacity: .025 });
    el('line', { x1: 6 + P.N * slot, x2: 6 + P.N * slot, y1: 0, y2: H, stroke: '#3a414b', 'stroke-dasharray': '2 4' });
    if (shown === P.N) { const t = el('text', { x: 6 + P.N * slot + (plotW - 6 - P.N * slot) / 2, y: H / 2, fill: '#5d6571', 'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Heebo,sans-serif' }); t.textContent = 'העתיד'; }
    if (state.hint) { el('rect', { x: 0, y: y(P.swingLow + P.atr * .3), width: plotW, height: y(P.swingLow - P.atr * .6) - y(P.swingLow + P.atr * .3), fill: '#f5b83d', opacity: .12 }); const t = el('text', { x: 8, y: y(P.swingLow - P.atr * .6) + 13, fill: '#f5b83d', 'font-size': 11, 'font-family': 'Heebo,sans-serif' }); t.textContent = 'נקודה נמוכה אחרונה'; }
    for (let k = 0; k < shown; k++) {
      const c = P.candles[k], up = c.c >= c.o, col = up ? '#1fd69b' : '#f0553f', x = cx(k);
      el('line', { x1: x, x2: x, y1: y(c.h), y2: y(c.l), stroke: col, 'stroke-width': 1.4, 'stroke-linecap': 'round' });
      el('rect', { x: x - bw / 2, y: y(Math.max(c.o, c.c)), width: bw, height: Math.max(2, Math.abs(y(c.o) - y(c.c))), rx: 1.5, fill: col });
    }
    const lv = [['entry', '#6aa8ff', 'כניסה'], ['stop', '#f0553f', 'סטופ'], ['target', '#1fd69b', 'יעד']];
    if (plan.entry && plan.stop) el('rect', { x: 0, y: y(plan.entry), width: plotW, height: y(plan.stop) - y(plan.entry), fill: '#f0553f', opacity: .08 });
    if (plan.entry && plan.target) el('rect', { x: 0, y: y(plan.target), width: plotW, height: y(plan.entry) - y(plan.target), fill: '#1fd69b', opacity: .08 });
    lv.forEach(([k, col, label]) => {
      if (plan[k] == null) return;
      el('line', { x1: 0, x2: plotW, y1: y(plan[k]), y2: y(plan[k]), stroke: col, 'stroke-width': 1.8, 'stroke-dasharray': k === 'entry' ? '0' : '6 4' });
      el('rect', { x: W - AX + 2, y: y(plan[k]) - 11, width: AX - 4, height: 22, rx: 8, fill: col });
      const t = el('text', { x: W - AX / 2, y: y(plan[k]) + 4, fill: k === 'stop' ? '#fff' : '#04140e', 'font-size': 10.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Heebo,sans-serif' }); t.textContent = fmt(plan[k], 1);
      const t2 = el('text', { x: 8, y: y(plan[k]) - 5, fill: col, 'font-size': 11, 'font-weight': 700, 'font-family': 'Heebo,sans-serif' }); t2.textContent = label;
    });
    if (state.mark) { const m = state.mark; el('circle', { cx: cx(m.at), cy: y(m.res === 'target' ? plan.target : plan.stop), r: 7, fill: m.res === 'target' ? '#1fd69b' : '#f0553f', stroke: '#0b0d10', 'stroke-width': 2 }); }
    updateReadout();
  }
  const state = { hint: false, mark: null };
  function updateReadout() {
    ['entry', 'stop', 'target'].forEach(k => { $('#v-' + k).textContent = plan[k] == null ? '--' : fmt(plan[k]); });
    const ok = plan.entry != null && plan.stop != null && plan.target != null;
    if (plan.entry != null && plan.stop != null) $('#rk').textContent = fmt(plan.entry - plan.stop);
    else $('#rk').textContent = '--';
    if (plan.entry != null && plan.target != null) $('#rw').textContent = fmt(plan.target - plan.entry); else $('#rw').textContent = '--';
    if (ok && plan.entry > plan.stop) $('#rt').textContent = '1:' + fmt((plan.target - plan.entry) / (plan.entry - plan.stop), 1); else $('#rt').textContent = '--';
    $('#run').disabled = !ok || running;
    $$('.tool').forEach(b => b.classList.toggle('on', b.dataset.t === tool));
    const names = { entry: 'כניסה', stop: 'סטופ', target: 'יעד' };
    $('#ins').textContent = ok ? 'אפשר לגרור כדי לתקן, ואז ללחוץ על הרץ את הגרף' : `לחצו על הגרף כדי לסמן ${names[tool]}`;
  }
  const nextTool = () => { const order = ['entry', 'stop', 'target']; tool = order.find(k => plan[k] == null) || tool; };
  let dragging = false;
  const setFromEvent = (e) => {
    if (running) return;
    const rect = svg.getBoundingClientRect(), py = (e.clientY - rect.top) * (H / rect.height);
    let v = Math.min(hi - 1, Math.max(lo + 1, priceAt(py)));
    plan[tool] = Math.round(v * 10) / 10; draw();
  };
  svg.addEventListener('pointerdown', (e) => { if (running) return; dragging = true; try { svg.setPointerCapture(e.pointerId); } catch (_) { } setFromEvent(e); });
  svg.addEventListener('pointermove', (e) => { if (dragging) setFromEvent(e); });
  const end = () => { if (!dragging) return; dragging = false; nextTool(); updateReadout(); };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  $('#tools').onclick = (e) => { const b = e.target.closest('.tool'); if (!b || running) return; tool = b.dataset.t; updateReadout(); };
  $('#bk').onclick = () => go('practiceHome');
  $('#hb').onclick = () => { state.hint = !state.hint; $('#hintBox').innerHTML = state.hint ? `<div class="hint">רמז: ${sc.hint}</div>` : ''; draw(); };
  $('#rset').onclick = () => { if (running) return; plan.entry = plan.stop = plan.target = null; tool = 'entry'; state.mark = null; shown = P.N; draw(); };
  $('#run').onclick = () => {
    if (plan.stop >= plan.entry) return toast('הסטופ צריך להיות מתחת לכניסה');
    if (plan.target <= plan.entry) return toast('היעד צריך להיות מעל הכניסה');
    running = true; $('#run').disabled = true;
    const sim = simulate(P, plan), ev = evaluate(P, plan);
    const timer = setInterval(() => {
      if (shown > sim.at) {
        clearInterval(timer);
        if (sim.res !== 'none') state.mark = { res: sim.res, at: sim.at };
        draw();
        setTimeout(() => go('feedback', { idx, plan, ev, sim }), 1000);
        return;
      }
      shown++; $('#px').textContent = fmt(P.candles[shown - 1].c); draw();
    }, 380);
  };
  window.__P = P; window.__plan = plan; // dev access for tests
  draw();
};

/* feedback */
screens.feedback = ({ idx, plan, ev, sim }) => {
  const ok = ev.passed === 3, stars = ev.passed, s = S();
  const prev = s.practiceDone[idx] || 0;
  if (stars > prev) { s.stars += stars - prev; s.practiceDone[idx] = stars; save(); }
  const outcome = { target: 'המחיר הגיע ליעד', stop: 'המחיר הגיע לסטופ', none: 'המחיר לא הגיע לא ליעד ולא לסטופ' }[sim.res];
  const risk = plan.entry - plan.stop, reward = plan.target - plan.entry;
  scr.className = 'screen';
  $('#tabbar').hidden = true;
  const conf = ok ? `<div class="confetti">${Array.from({ length: 26 }, (_, k) => `<i style="left:${(k * 37) % 100}%;background:${['#1fd69b', '#f5b83d', '#6aa8ff', '#f0553f'][k % 4]};animation-delay:${(k % 7) * .12}s"></i>`).join('')}</div>` : '';
  scr.innerHTML = `${conf}<div class="fb ${ok ? 'ok' : 'no'} anim">
    <div class="big-ic" style="color:${ok ? 'var(--green)' : 'var(--red)'}">${ok ? ic.check : ic.x}</div>
    <h1>${ok ? 'תוכנית מצוינת!' : stars === 2 ? 'כמעט!' : 'לא הפעם'}</h1>
    <p class="muted" style="margin:0 24px">${ok ? 'כל שלושת החלקים בתוכנית נכונים.' : 'יש כאן משהו לתקן, וזה בסדר. נסו שוב עם הרמזים.'}</p>
    <div class="stars">${[0, 1, 2].map(k => `<span class="${k < stars ? 'pop' : ''}" style="animation-delay:${k * .18}s">${starSvg(k < stars)}</span>`).join('')}</div>
    <div class="res"><div><small>סיכון</small><b>${fmt(risk)}</b></div><div><small>סיכוי</small><b>${fmt(reward)}</b></div><div><small>יחס</small><b>1:${fmt(reward / risk, 1)}</b></div></div>
    <div class="checks">${ev.checks.map(c => `<div class="ck ${c.ok ? 'ok' : 'no'}"><div class="m">${c.ok ? '✓' : '✕'}</div><div><b>${c.t}</b><span>${c.ok ? c.good : c.bad}</span></div></div>`).join('')}
      <div class="ck ${sim.res === 'target' ? 'ok' : sim.res === 'stop' ? 'no' : 'ok'}" style="opacity:.9"><div class="m" style="background:var(--card2);color:var(--text)">i</div><div><b>מה קרה בגרף</b><span>${outcome}. תוכנית טובה יכולה להפסיד לפעמים, ותוכנית חלשה יכולה להרוויח במזל. לכן בודקים את התוכנית ולא רק את התוצאה.</span></div></div></div>
    <div class="btns">${ok ? `<button class="btn primary" data-go="practice" data-arg="${(idx + 1) % SCEN.length}">לתרגיל הבא</button>` : `<button class="btn primary" data-go="practice" data-arg="${idx}">נסו שוב</button>`}<button class="btn ghost" data-go="home">חזרה לבית</button></div>
    <p class="disc">תרגיל לימודי על גרף הדגמה, בלי כסף אמיתי. אין כאן המלצת השקעה.</p></div>`;
};

/* ===== boot ===== */
(function boot() {
  const s = S();
  const h = (location.hash || '').replace('#', '');
  const open = ['home', 'lessons', 'market', 'profile', 'practiceHome'];
  if (!s.user) go(s.seenOnboarding ? 'signup' : 'onboarding', 0);
  else go(open.includes(h) ? h : 'home');
})();
