'use strict';
/* ===== fictional market (NOT real quotes). Prices move live, in memory only. ===== */
const ASSETS = [
  { id: 'IDX100', n: 'מדד הדגמה 100', s: 'IDX100', k: 'index', sec: 'מדד רחב', price: 1842.35, vol: .9, trend: 1, seed: 101, col: '#3b82f6', about: 'מדד בדוי שמדמה סל של 100 חברות דמיוניות. הוא נועד לתרגול בלבד.' },
  { id: 'TECH', n: 'מדד טכנולוגיה הדגמה', s: 'TECH', k: 'index', sec: 'מדד ענפי', price: 962.8, vol: 1.5, trend: -1, seed: 102, col: '#8b5cf6', about: 'מדד בדוי של חברות טכנולוגיה דמיוניות. נע חזק יותר מהמדד הרחב.' },
  { id: 'ENRG', n: 'מדד אנרגיה הדגמה', s: 'ENRG', k: 'index', sec: 'מדד ענפי', price: 417.6, vol: 1.2, trend: 1, seed: 103, col: '#f59e0b', about: 'מדד בדוי של חברות אנרגיה דמיוניות, לתרגול בלבד.' },
  { id: 'BANK', n: 'מדד בנקים הדגמה', s: 'BANK', k: 'index', sec: 'מדד ענפי', price: 1203.1, vol: .8, trend: 0, seed: 104, col: '#14b8a6', about: 'מדד בדוי של בנקים דמיוניים. תנועה שקטה יחסית.' },
  { id: 'ALFA', n: 'אלפא טכנולוגיות', s: 'ALFA', k: 'stock', sec: 'טכנולוגיה', price: 128.4, vol: 1.6, trend: 1, seed: 201, col: '#f2994a', about: 'חברה דמיונית שמפתחת תוכנה. כל הנתונים כאן בדויים.' },
  { id: 'BETA', n: 'ביתא תעשיות', s: 'BETA', k: 'stock', sec: 'תעשייה', price: 54.12, vol: 1.1, trend: -1, seed: 202, col: '#1ea7a1', about: 'חברה דמיונית בתחום התעשייה. כל הנתונים כאן בדויים.' },
  { id: 'GAMA', n: 'גמא אנרגיה', s: 'GAMA', k: 'stock', sec: 'אנרגיה', price: 87.9, vol: 1.3, trend: 1, seed: 203, col: '#e0559c', about: 'חברה דמיונית בתחום האנרגיה. כל הנתונים כאן בדויים.' },
  { id: 'DLTA', n: 'דלתא פארמה', s: 'DLTA', k: 'stock', sec: 'בריאות', price: 212.5, vol: 1.8, trend: 0, seed: 204, col: '#6366f1', about: 'חברה דמיונית בתחום התרופות. תנודתית יחסית, נתונים בדויים.' },
  { id: 'EPSI', n: 'אפסילון בנקאות', s: 'EPSI', k: 'stock', sec: 'פיננסים', price: 33.74, vol: .9, trend: 1, seed: 205, col: '#0ea5e9', about: 'בנק דמיוני. כל הנתונים כאן בדויים.' },
  { id: 'ZETA', n: 'זטא נדל"ן', s: 'ZETA', k: 'stock', sec: 'נדל"ן', price: 71.05, vol: 1.0, trend: -1, seed: 206, col: '#a3a3a3', about: 'חברת נדל"ן דמיונית. כל הנתונים כאן בדויים.' },
  { id: 'ETA', n: 'אתא מזון', s: 'ETA', k: 'stock', sec: 'צריכה', price: 19.9, vol: .7, trend: 1, seed: 207, col: '#84cc16', about: 'חברת מזון דמיונית. תנודתיות נמוכה, נתונים בדויים.' },
  { id: 'THTA', n: 'תטא תקשורת', s: 'THTA', k: 'stock', sec: 'תקשורת', price: 46.3, vol: 1.2, trend: 0, seed: 208, col: '#ef4444', about: 'חברת תקשורת דמיונית. כל הנתונים כאן בדויים.' }
];
const byId = (id) => ASSETS.find(a => a.id === id);
const TF = [['1D', 'יום', 78], ['1W', 'שבוע', 35], ['1M', 'חודש', 22], ['3M', '3 חודשים', 65], ['1Y', 'שנה', 260]];
const TF_SIGMA = { '1D': .0011, '1W': .0026, '1M': .0085, '3M': .0095, '1Y': .0115 };

function genSeries(a, tf) {
  const cfg = TF.find(t => t[0] === tf), n = cfg[2];
  const r = rng(a.seed * 13 + TF.indexOf(cfg) * 7 + 3);
  const sg = TF_SIGMA[tf] * a.vol, drift = a.trend * sg * .12;
  let p = 100; const cs = [];
  for (let i = 0; i < n; i++) {
    const o = p, c = o * (1 + (r() - .5) * 2 * sg + drift);
    const h = Math.max(o, c) * (1 + r() * sg * .7), l = Math.min(o, c) * (1 - r() * sg * .7);
    cs.push({ o, c, h, l, v: Math.round(40 + r() * 60 + Math.abs(c - o) / o / sg * 25) }); p = c;
  }
  const k = a.price / cs[n - 1].c;
  cs.forEach(c => { c.o *= k; c.c *= k; c.h *= k; c.l *= k; });
  return cs;
}
function series(a, tf) { a.ser = a.ser || {}; if (!a.ser[tf]) a.ser[tf] = genSeries(a, tf); return a.ser[tf]; }
ASSETS.forEach(a => { a.open = series(a, '1D')[0].o; a.chg = (a.price / a.open - 1) * 100; a.spark = series(a, '1M').map(c => c.c); });

/* date labels (demo calendar ending today) */
const TODAY = new Date(2026, 9, 6);
function bizDaysBack(k) { const d = new Date(TODAY); while (k > 0) { d.setDate(d.getDate() - 1); if (d.getDay() !== 5 && d.getDay() !== 6) k--; } return d; }
const dfmt = (d) => d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
function labelOf(tf, i, n) {
  if (tf === '1D') { const m = 9 * 60 + 30 + i * 5; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }
  if (tf === '1W') { const day = Math.floor(i / 7), hr = 10 + (i % 7); return `${dfmt(bizDaysBack(4 - day))} ${hr}:00`; }
  return dfmt(bizDaysBack(n - 1 - i));
}
const sma = (cs, p) => cs.map((_, i) => i < p - 1 ? null : cs.slice(i - p + 1, i + 1).reduce((a, c) => a + c.c, 0) / p);

/* ===== live engine ===== */
let tickN = 0;
const equity = (ac) => { const p = ac.portfolio; return p.cash + Object.entries(p.pos).reduce((s, [id, x]) => s + x.qty * byId(id).price, 0); };
function sellPos(ac, id, qty, why) {
  const a = byId(id), pos = ac.portfolio.pos[id]; if (!pos) return 0;
  qty = Math.min(qty, pos.qty); const gain = qty * (a.price - pos.avg);
  ac.portfolio.cash += qty * a.price; pos.qty -= qty;
  if (pos.qty < 0.0001) delete ac.portfolio.pos[id];
  ac.portfolio.hist.unshift({ t: Date.now(), type: 'sell', id, qty, price: a.price, pnl: gain, why: why || '' });
  ac.portfolio.hist.length = Math.min(ac.portfolio.hist.length, 40);
  return gain;
}
function liveStep() {
  if (document.hidden) return;
  tickN++;
  ASSETS.forEach(a => {
    const r = (Math.random() - .5) * 2;
    a.price = Math.max(1, a.price * (1 + r * a.vol * .0016 + a.trend * .00002));
    a.chg = (a.price / a.open - 1) * 100; a.spark[a.spark.length - 1] = a.price;
    if (a.ser) Object.values(a.ser).forEach(cs => { const c = cs[cs.length - 1]; c.c = a.price; c.h = Math.max(c.h, a.price); c.l = Math.min(c.l, a.price); });
  });
  if (loggedIn()) {
    const ac = A();
    Object.keys(ac.portfolio.pos).forEach(id => {
      const x = ac.portfolio.pos[id], a = byId(id);
      if (x.stop && a.price <= x.stop) { const g = sellPos(ac, id, x.qty, 'סטופ'); toast(`הסטופ של ${a.n} הופעל. ${g >= 0 ? 'רווח' : 'הפסד'} של ${money(Math.abs(g))}`); save(); }
      else if (x.target && a.price >= x.target) { const g = sellPos(ac, id, x.qty, 'יעד'); toast(`היעד של ${a.n} הושג. רווח של ${money(g)}`); save(); }
    });
    if (tickN % 3 === 0) { ac.portfolio.eq.push(equity(ac)); if (ac.portfolio.eq.length > 90) ac.portfolio.eq.shift(); }
    if (tickN % 10 === 0) save();
  }
  ticks.forEach(f => f());
}
setInterval(liveStep, 1500);

/* ===== lessons ===== */
const WARN_DAY = 'מסחר יומי קשה יותר, ובדרך כלל מפסידים בו יותר. מקור: לא ידוע, יתווסף.';
const LESSONS = [
  {
    id: 'l1', title: 'מה זה שוק ההון?', min: 8, color: '#1ff0b0', slides: [
      { t: 'מניה היא חלק קטן מחברה', b: 'כשקונים מניה, קונים חתיכה קטנה מחברה. אם החברה גדלה ושווה יותר, החתיכה שלך יכולה להיות שווה יותר. אם החברה נחלשת, היא יכולה להיות שווה פחות.', v: 'pie' },
      { t: 'הבורסה היא השוק', b: 'הבורסה היא מקום שבו אנשים קונים ומוכרים מניות. כל עסקה היא בין מי שרוצה לקנות לבין מי שרוצה למכור.', v: 'market' },
      { t: 'המחיר זז לפי ביקוש', b: 'כשיותר אנשים רוצים לקנות מניה מאשר למכור אותה, המחיר נוטה לעלות. כשיותר אנשים רוצים למכור, המחיר נוטה לרדת.', v: 'scale' },
      { t: 'תמיד יש סיכון', b: 'מחיר של מניה יכול לרדת, ואפשר להפסיד כסף. אף אחד לא יכול להבטיח רווח, ולכן לומדים לנהל סיכון.', v: 'candles' },
      { t: 'יש כמה סגנונות', b: 'יש מי שמחזיק מניות שנים (טווח ארוך), יש מי שמחזיק שבועות (סווינג), ויש מי שקונה ומוכר באותו יום (יומי). אין סגנון אחד נכון לכולם.', w: WARN_DAY, v: 'styles' }
    ],
    q: { q: 'מה קורה למחיר כשיותר אנשים רוצים לקנות מאשר למכור?', o: ['הוא נוטה לעלות', 'הוא נוטה לרדת', 'הוא תמיד נשאר זהה'], a: 0 }
  },
  {
    id: 'l2', title: 'איך קוראים נרות', min: 9, color: '#60a5fa', slides: [
      { t: 'נר אחד הוא פרק זמן אחד', b: 'כל נר בגרף מראה מה קרה למחיר בפרק זמן מסוים, למשל יום אחד. הוא מראה ארבעה מחירים: פתיחה, סגירה, הכי גבוה והכי נמוך.', v: 'candle1' },
      { t: 'ירוק ואדום', b: 'נר ירוק אומר שהמחיר בסגירה היה גבוה מהפתיחה. נר אדום אומר שהוא היה נמוך מהפתיחה.', v: 'candle2' },
      { t: 'הגוף והפתילים', b: 'הגוף הוא המרחק בין הפתיחה לסגירה. הקווים הדקים למעלה ולמטה הם הפתילים, והם מראים עד איפה המחיר הגיע בדרך.', v: 'candle1' },
      { t: 'גרף הוא הרבה נרות ברצף', b: 'כשמסתכלים על הרבה נרות יחד אפשר לראות כיוון: עלייה, ירידה או תנועה לצדדים. זה עוזר להחליט, אבל לא מבטיח מה יקרה.', v: 'candles' }
    ],
    q: { q: 'נר ירוק אומר ש...', o: ['הסגירה גבוהה מהפתיחה', 'הסגירה נמוכה מהפתיחה', 'לא היו עסקאות'], a: 0 }
  },
  {
    id: 'l3', title: 'כניסה, סטופ ויעד', min: 10, color: '#fbbf24', slides: [
      { t: 'תוכנית לפני עסקה', b: 'לפני שנכנסים לעסקה מחליטים שלושה דברים: באיזה מחיר נכנסים, באיזה מחיר יוצאים אם טעינו, ובאיזה מחיר יוצאים אם צדקנו.', v: 'rr' },
      { t: 'כניסה', b: 'הכניסה היא המחיר שבו קונים. כניסה טובה היא כזאת שיש לה סיבה שרואים בגרף, ולא תחושה.', v: 'rr' },
      { t: 'סטופ', b: 'הסטופ הוא המחיר שבו יוצאים כדי להגביל הפסד. מניחים אותו במקום שאם המחיר מגיע אליו, התוכנית שלנו כנראה לא נכונה.', v: 'rr' },
      { t: 'יעד', b: 'היעד הוא המחיר שבו לוקחים רווח. כדאי שהיעד יהיה רחוק מהכניסה יותר מהסטופ, כדי שהתוכנית תהיה הגיונית גם אם טועים לפעמים.', v: 'rr' },
      { t: 'בתרגול אין כסף אמיתי', b: 'בתרגילים של האפליקציה לא מנחשים. קוראים את הגרף, מחליטים אם בכלל להיכנס, ובונים תוכנית צעד אחר צעד. זה לימודי בלבד ולא המלצה לשום עסקה.', v: 'rr' }
    ],
    q: { q: 'מה תפקיד הסטופ?', o: ['להגביל הפסד', 'להבטיח רווח', 'לקנות עוד מניות'], a: 0 }
  },
  {
    id: 'l4', title: 'יחס סיכוי וסיכון', min: 8, color: '#fb7185', slides: [
      { t: 'כמה מסכנים וכמה מרוויחים', b: 'סיכון הוא המרחק בין הכניסה לסטופ. סיכוי הוא המרחק בין הכניסה ליעד. היחס ביניהם אומר אם התוכנית שווה את המאמץ.', v: 'rr' },
      { t: 'דוגמה עם מספרים', b: 'כניסה ב-100, סטופ ב-95, יעד ב-110. הסיכון הוא 5, הסיכוי הוא 10, והיחס הוא 1 ל-2. כלומר על כל שקל שמסכנים, מכוונים לשני שקלים.', v: 'rr' },
      { t: 'יחס טוב לא מבטיח רווח', b: 'גם תוכנית עם יחס טוב יכולה להפסיד. המטרה היא תוכנית הגיונית שחוזרים עליה, לא ניצחון בכל עסקה.', v: 'candles' }
    ],
    q: { q: 'כניסה 100, סטופ 95, יעד 110. מה היחס?', o: ['1 ל-2', '1 ל-1', '2 ל-1'], a: 0 }
  },
  {
    id: 'l5', title: 'תמיכה והתנגדות', min: 9, color: '#a78bfa', slides: [
      { t: 'אזור שבו המחיר עצר', b: 'תמיכה היא אזור שבו המחיר ירד, עצר וחזר למעלה, ואולי כמה פעמים. מסתכלים על הנקודות הנמוכות בגרף ורואים איפה זה קרה.', v: 'support' },
      { t: 'התנגדות היא ההפך', b: 'התנגדות היא אזור שבו המחיר עלה, עצר וחזר למטה. אלה הנקודות הגבוהות בגרף.', v: 'support' },
      { t: 'אזור ולא קו מדויק', b: 'אלה אזורים ולא מספרים מדויקים. המחיר יכול להיכנס אליהם קצת ולצאת. לכן משאירים מרווח קטן.', v: 'support' },
      { t: 'לא מבטיחים כלום', b: 'לפעמים אזור נשבר והמחיר ממשיך. תמיכה היא רמז שאפשר לבנות עליו תוכנית, ולא הבטחה.', v: 'candles' }
    ],
    q: { q: 'איפה מניחים סטופ בעסקת קנייה, לפי מה שלמדנו?', o: ['מתחת לאזור התמיכה', 'מעל המחיר הנוכחי', 'בדיוק על המחיר הנוכחי'], a: 0 }
  },
  {
    id: 'l6', title: 'ניהול סיכונים, לא הימורים', min: 10, color: '#f472b6', slides: [
      { t: 'הימור מול תוכנית', b: 'הימור הוא להחליט לפי תחושה ולסכן כמה שבא לך. תוכנית היא להחליט מראש כמה מוכנים להפסיד, ורק אז לבחור את גודל העסקה.', v: 'size' },
      { t: 'קודם כמה מפסידים, אחר כך כמה קונים', b: 'כלל אצבע לימודי: מסכנים אחוז קטן מהתיק בעסקה אחת, למשל 1%. בתיק של 5,000 ש"ח זה 50 ש"ח. אם הסטופ רחוק, קונים פחות. אם הוא קרוב, קונים יותר.', v: 'size' },
      { t: 'לא הכול במקום אחד', b: 'כשכל הכסף נמצא במניה אחת, מקרה רע אחד פוגע בהכול. פיזור בין כמה נכסים מקטין את הסיכון הזה, אבל לא מבטל אותו.', v: 'styles' },
      { t: 'לפעמים הכי נכון לחכות', b: 'כשהגרף לא ברור, אין סיבה להיכנס. להחליט לא לעשות עסקה היא גם החלטה, ולפעמים היא הטובה ביותר. אין חובה להיות בעסקה כל הזמן.', v: 'candles' }
    ],
    q: { q: 'בתיק של 5,000 ש"ח מסכנים 1% בעסקה. כמה ש"ח זה?', o: ['50 ש"ח', '500 ש"ח', '5 ש"ח'], a: 0 }
  }
];
function lessonVis(v) {
  const g = '#1ff0b0', r = '#ff6048';
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
    rr: `<svg viewBox="0 0 300 170"><rect x="30" y="35" width="240" height="50" rx="8" fill="${g}" opacity=".14"/><rect x="30" y="85" width="240" height="40" rx="8" fill="${r}" opacity=".16"/><path d="M30 35h240" stroke="${g}" stroke-width="2.5"/><path d="M30 85h240" stroke="#6aa8ff" stroke-width="2.5"/><path d="M30 125h240" stroke="${r}" stroke-width="2.5"/><g font-family="Heebo,sans-serif" font-size="13" font-weight="700"><text x="262" y="29" fill="${g}" text-anchor="end">יעד 110</text><text x="262" y="79" fill="#6aa8ff" text-anchor="end">כניסה 100</text><text x="262" y="148" fill="${r}" text-anchor="end">סטופ 95</text></g></svg>`,
    support: `<svg viewBox="0 0 300 170"><rect x="10" y="108" width="280" height="22" fill="#fbbf24" opacity=".14"/><path d="M10 119h280" stroke="#fbbf24" stroke-width="2" stroke-dasharray="5 4"/>${candle(50, 70, 100, 55, 118, false)}${candle(95, 100, 85, 70, 120, true)}${candle(140, 85, 60, 45, 100, true)}${candle(185, 60, 100, 50, 116, false)}${candle(230, 100, 70, 62, 120, true)}${lab(150, 160, 'המחיר עצר באזור הזה כמה פעמים')}</svg>`,
    size: `<svg viewBox="0 0 300 170"><rect x="30" y="40" width="240" height="26" rx="13" fill="#1c2026"/><rect x="30" y="40" width="12" height="26" rx="6" fill="${r}"/><g font-family="Heebo,sans-serif" font-size="13" fill="#c9cfd8" text-anchor="middle"><text x="150" y="102">תיק 5,000 ש"ח</text><text x="150" y="126" fill="${r}" font-weight="700">מסכנים 1% = 50 ש"ח</text></g></svg>`
  };
  return V[v] || '';
}

/* ===== practice scenarios (synthetic charts, not real market data) ===== */
const SCEN = [
  { id: 's1', name: 'תיקון בתוך מגמה עולה', seed: 7, trend: 'up', action: 'enter', past: [[0, 100], [8, 107], [15, 119], [20, 114], [23, 110.5], [25, 111.5]], fut: [[0, 111.5], [4, 117], [8, 123], [13, 128]], drift: 1.1,
    why: 'המחיר עלה, ירד קצת ועצר באזור שבו כבר עצר. יש מגמה, יש אזור תמיכה ברור, ויש מקום הגיוני לסטופ. זה מצב שאפשר לבנות עליו תוכנית.' },
  { id: 's2', name: 'פריצה וחזרה לבדיקה', seed: 13, trend: 'up', action: 'enter', past: [[0, 102], [4, 106], [8, 101], [12, 106], [16, 104], [20, 106], [25, 106.8]], fut: [[0, 106.8], [3, 104.6], [8, 111], [13, 118]], drift: .8,
    why: 'המחיר נע בטווח ופרץ מעליו. הנקודות הנמוכות האחרונות נותנות מקום ברור לסטופ, והמגמה כלפי מעלה.' },
  { id: 's3', name: 'ירידה מתמשכת', seed: 21, trend: 'down', action: 'wait', past: [[0, 140], [8, 134], [14, 130], [20, 124], [25, 120.5]], fut: [[0, 120.5], [5, 116], [10, 112], [13, 109]],
    why: 'כל פעם שהמחיר ניסה לעלות הוא חזר למטה, והנקודות הנמוכות נשברות אחת אחרי השנייה. קנייה כאן היא נגד המגמה, ואין אזור תמיכה שהחזיק. החלטה טובה היא לא להיכנס.' },
  { id: 's4', name: 'גרף מבולבל', seed: 31, trend: 'side', action: 'wait', past: [[0, 100], [3, 104], [6, 98], [9, 103], [12, 97.5], [15, 103.5], [18, 98.5], [21, 103], [25, 100.5]], fut: [[0, 100.5], [4, 104], [8, 98], [13, 101]],
    why: 'המחיר קופץ למעלה ולמטה בלי כיוון, והוא באמצע הטווח, רחוק מהקצוות. אין תמיכה ברורה ואין סיבה להיכנס. כשאין תוכנית, לא עושים עסקה.' },
  { id: 's5', name: 'תוכנית טובה, תוצאה רעה', seed: 41, trend: 'up', action: 'enter', past: [[0, 100], [8, 108], [15, 120], [20, 115], [23, 112.5], [25, 113.2]], fut: [[0, 113.2], [4, 108], [6, 106.5], [10, 116], [13, 122]], drift: .9,
    why: 'הגרף נראה כמו תיקון בתוך מגמה עולה, אבל הפעם התיקון עמוק יותר. תוכנית טובה לא מבטיחה ניצחון. הסטופ הגביל את ההפסד, וזה בדיוק התפקיד שלו.' }
];
