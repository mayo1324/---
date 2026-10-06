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
    id: 'l1', title: 'מה זה שוק ההון?', min: 6, color: '#1ff0b0', slides: [
      { t: 'מניה היא חתיכה קטנה מחברה', b: 'כשקונים מניה, אתם הופכים לבעלים של חתיכה קטנה מחברה. אם החברה מצליחה, החתיכה שלכם שווה יותר.', v: 'pie' },
      { t: 'הבורסה היא השוק', b: 'בבורסה אנשים קונים ומוכרים מניות, כמו בשוק רגיל. אחד רוצה למכור, אחד רוצה לקנות, ומסכימים על מחיר.', v: 'market' },
      { t: 'המחיר זז כל הזמן', b: 'כשהרבה אנשים רוצים לקנות, המחיר עולה. כשהרבה רוצים למכור, המחיר יורד. נסו בעצמכם!', v: 'scale', x: 'scale' },
      { t: 'אפשר להפסיד', b: 'המחיר יכול לרדת, ואז מפסידים כסף. אף אחד לא יכול להבטיח רווח. לכן לומדים לשלוט בהפסד.', v: 'coaster' },
      { t: 'יש כמה סגנונות', b: 'יש מי שמחזיק מניה שנים, ויש מי שקונה ומוכר באותו יום. אין סגנון אחד נכון לכולם.', w: WARN_DAY, v: 'styles' }
    ],
    q: { q: 'כשהרבה אנשים רוצים לקנות מניה, מה קורה למחיר?', o: ['הוא נוטה לעלות', 'הוא נוטה לרדת', 'הוא לא משתנה'], a: 0 }
  },
  {
    id: 'l2', title: 'איך קוראים נרות', min: 7, color: '#60a5fa', slides: [
      { t: 'נר אחד = פרק זמן אחד', b: 'כל נר בגרף מספר מה קרה למחיר בפרק זמן, למשל ביום אחד. הוא מראה איפה המחיר התחיל, איפה נגמר, ומה היה הכי גבוה והכי נמוך.', v: 'candle1' },
      { t: 'ירוק עלה, אדום ירד', b: 'נר ירוק אומר שהמחיר נגמר גבוה יותר ממה שהתחיל. נר אדום אומר שהוא נגמר נמוך יותר. לחצו וראו.', v: 'candle2', x: 'flip' },
      { t: 'הקווים הדקים', b: 'הקווים הדקים מעל ומתחת לנר מראים עד איפה המחיר הגיע באמצע, גם אם חזר.', v: 'candle1' },
      { t: 'גרף הוא הרבה נרות', b: 'כשמסתכלים על הרבה נרות ברצף רואים איך המחיר התנהג. בשיעורים הבאים נלמד לזהות כיוון, רצפה ותקרה.', v: 'coaster' }
    ],
    q: { q: 'נר ירוק אומר ש...', o: ['המחיר נגמר גבוה ממה שהתחיל', 'המחיר נגמר נמוך ממה שהתחיל', 'לא קרה כלום'], a: 0 }
  },
  {
    id: 'l3', title: 'מדד, נפח וממוצע נע', min: 6, color: '#38bdf8', slides: [
      { t: 'מדד הוא סל של חברות', b: 'מדד הוא מספר אחד שמראה מה קורה להרבה חברות יחד. אם רובן עולות, המדד עולה.', v: 'index' },
      { t: 'נפח: כמה סחרו', b: 'הנפח מראה כמה מניות עברו מיד ליד. עמודה גבוהה אומרת שהיה הרבה מסחר.', v: 'volume' },
      { t: 'ממוצע נע: קו שמחליק', b: 'זה קו שמראה את המחיר הממוצע של הזמן האחרון. הוא מחליק את הקפיצות, וככה רואים בקלות לאן המחיר הולך.', v: 'ma' },
      { t: 'תנודתיות: כמה קופץ', b: 'נכס תנודתי קופץ חזק למעלה ולמטה. נכס שקט זז לאט. תנודתי יכול להרוויח הרבה, וגם להפסיד הרבה.', v: 'coaster' }
    ],
    q: { q: 'מה זה מדד?', o: ['מספר שמסכם הרבה חברות', 'מניה של חברה אחת', 'מחיר של מטבע'], a: 0 }
  },
  {
    id: 'l4', title: 'מגמה: לאן הגרף הולך?', min: 6, color: '#a3e635', slides: [
      { t: 'מגמה = הכיוון הכללי', b: 'מגמה אומרת לאן המחיר הולך בגדול: למעלה, למטה, או בלי כיוון. מסתכלים על הרבה נרות ולא על נר אחד.', v: 'trendUp' },
      { t: 'מגמה עולה', b: 'המחיר עולה, יורד קצת, ועולה שוב. כל ירידה נעצרת גבוה יותר מהקודמת. בציור: הנקודות הצהובות הולכות ועולות.', v: 'trendUp' },
      { t: 'מגמה יורדת', b: 'ההפך: כל ניסיון לעלות נעצר נמוך יותר מהקודם. בציור: הנקודות הצהובות הולכות ויורדות.', v: 'trendDown' },
      { t: 'בלי כיוון', b: 'לפעמים המחיר קופץ למעלה ולמטה באותו מקום. כשאין כיוון, קשה לתכנן עסקה, ולכן לפעמים מחכים.', v: 'trendSide' }
    ],
    q: { q: 'הנקודות הנמוכות בגרף הולכות וגבוהות יותר. איזו מגמה זו?', o: ['עולה', 'יורדת', 'בלי כיוון'], a: 0 }
  },
  {
    id: 'l5', title: 'תמיכה: הרצפה', min: 5, color: '#fbbf24', slides: [
      { t: 'תמיכה היא רצפה', b: 'תמיכה היא מקום שהמחיר ירד אליו, נעצר, וחזר למעלה. כמו כדור שקופץ מהרצפה.', v: 'support' },
      { t: 'איך מוצאים אותה?', b: 'מסתכלים על הנקודות הנמוכות בגרף. אם המחיר ירד לאותו מקום כמה פעמים וחזר למעלה, זו תמיכה.', v: 'support' },
      { t: 'זה אזור, לא קו', b: 'המחיר לא תמיד נעצר בדיוק באותו מספר. לכן חושבים על אזור קטן ולא על קו אחד.', v: 'support' },
      { t: 'למה זה חשוב?', b: 'אם קונים ליד הרצפה, אפשר לשים את הסטופ קצת מתחתיה. ושימו לב: לפעמים הרצפה נשברת, ואין שום הבטחה.', v: 'support' }
    ],
    q: { q: 'מה זו תמיכה?', o: ['מקום שהמחיר נעצר וחזר למעלה', 'מקום שהמחיר נעצר וחזר למטה', 'המחיר הכי גבוה'], a: 0 }
  },
  {
    id: 'l6', title: 'התנגדות: התקרה', min: 4, color: '#a78bfa', slides: [
      { t: 'התנגדות היא תקרה', b: 'התנגדות היא ההפך מתמיכה: מקום שהמחיר עלה אליו, נעצר, וחזר למטה.', v: 'resist' },
      { t: 'איך מוצאים אותה?', b: 'מסתכלים על הנקודות הגבוהות בגרף. אם המחיר הגיע לאותו מקום כמה פעמים ונעצר, זו התנגדות.', v: 'resist' },
      { t: 'למה זה חשוב?', b: 'התקרה עוזרת לבחור יעד לרווח: אולי שם המחיר ייעצר. לפעמים המחיר פורץ את התקרה ועולה, ואז בודקים שוב.', v: 'resist' }
    ],
    q: { q: 'איפה כדאי לחשוב על יעד לרווח?', o: ['לפני התקרה', 'מתחת לרצפה', 'במחיר הקנייה'], a: 0 }
  },
  {
    id: 'l7', title: 'כניסה, סטופ ויעד', min: 8, color: '#fb923c', slides: [
      { t: 'מתכננים לפני שקונים', b: 'לפני עסקה מחליטים שלושה דברים: באיזה מחיר קונים, מתי יוצאים אם טעינו, ומתי יוצאים עם רווח.', v: 'rr' },
      { t: 'כניסה', b: 'כניסה היא הרגע שבו קונים. כדאי להיכנס כשיש סיבה שרואים בגרף, לא כשיש תחושה.', v: 'rr' },
      { t: 'סטופ: יוצאים אם טעינו', b: 'סטופ הוא מחיר שאם המחיר יורד אליו, יוצאים מהעסקה. כך ההפסד נשאר קטן. שמים אותו קצת מתחת לרצפה.', v: 'rr' },
      { t: 'יעד: יוצאים עם רווח', b: 'יעד הוא מחיר שבו יוצאים ולוקחים רווח. כדאי שהרווח האפשרי יהיה גדול מההפסד האפשרי.', v: 'rr' },
      { t: 'בתרגול לא מנחשים', b: 'בתרגיל קוראים את הגרף, מחליטים אם לקנות בכלל, ובונים תוכנית צעד אחרי צעד. זה לימוד בלבד ולא המלצה.', v: 'rr' }
    ],
    q: { q: 'למה צריך סטופ?', o: ['כדי להגביל הפסד', 'כדי להבטיח רווח', 'כדי לקנות עוד'], a: 0 }
  },
  {
    id: 'l8', title: 'סיכוי מול סיכון', min: 6, color: '#fb7185', slides: [
      { t: 'כמה מרוויחים מול כמה מפסידים', b: 'סיכון הוא כמה אפשר להפסיד (מהכניסה עד הסטופ). סיכוי הוא כמה אפשר להרוויח (מהכניסה עד היעד).', v: 'rr' },
      { t: 'דוגמה', b: 'קונים ב-100. סטופ ב-95, יעד ב-110. מפסידים עד 5, מרוויחים עד 10. כלומר הרווח האפשרי כפול מההפסד. זה נקרא יחס 1 ל-2.', v: 'rr' },
      { t: 'גם תוכנית טובה מפסידה לפעמים', b: 'יחס טוב לא מבטיח ניצחון. אבל כשהרווח האפשרי גדול מההפסד, אפשר לטעות לא מעט פעמים ועדיין לא להפסיד בסך הכול.', v: 'coaster' }
    ],
    q: { q: 'קונים ב-100, סטופ ב-95, יעד ב-110. מה היחס?', o: ['1 ל-2', '1 ל-1', '2 ל-1'], a: 0 }
  },
  {
    id: 'l9', title: 'לא מהמרים: שולטים בסיכון', min: 8, color: '#f472b6', slides: [
      { t: 'הימור או תוכנית?', b: 'הימור זה להחליט לפי תחושה ולשים כמה שבא. תוכנית זה להחליט מראש כמה מוכנים להפסיד, ורק אז כמה לקנות.', v: 'size' },
      { t: 'קודם כמה מפסידים', b: 'כלל אצבע ללימוד: מסכנים אחוז קטן מהתיק בעסקה. בתיק של 5,000 ש"ח, אחוז אחד הוא 50 ש"ח. אחרי זה מחשבים כמה מניות לקנות כדי שההפסד לא יעבור 50 ש"ח.', v: 'size' },
      { t: 'לא הכול במקום אחד', b: 'אם כל הכסף במניה אחת ויש לה יום רע, הכול נפגע. פיזור בין כמה נכסים מקטין את הסיכון, אבל לא מבטל אותו.', v: 'styles' },
      { t: 'לפעמים מחכים', b: 'כשהגרף לא ברור, אין סיבה לקנות. להחליט לא לקנות היא גם החלטה, ולפעמים הכי חכמה.', v: 'coaster' }
    ],
    q: { q: 'בתיק של 5,000 ש"ח מסכנים 1%. כמה ש"ח זה?', o: ['50 ש"ח', '500 ש"ח', '5 ש"ח'], a: 0 }
  }
];
/* ===== glossary: plain words ===== */
const GLOSS = {
  share: { t: 'מניה', lesson: 'l1', v: 'pie', def: 'חתיכה קטנה מחברה. מי שקונה מניה הוא בעלים של חלק קטן מהחברה.', ex: 'אם החברה מצליחה, המניה שלכם שווה יותר.' },
  exchange: { t: 'בורסה', lesson: 'l1', v: 'market', def: 'המקום שבו קונים ומוכרים מניות.', ex: 'כמו שוק: מי שרוצה למכור פוגש מי שרוצה לקנות.' },
  index: { t: 'מדד', lesson: 'l3', v: 'index', def: 'מספר אחד שמראה מה קורה להרבה חברות ביחד.', ex: 'אם רוב החברות עולות, גם המדד עולה.' },
  candle: { t: 'נר', lesson: 'l2', v: 'candle1', def: 'סימן אחד בגרף שמראה מה קרה למחיר בפרק זמן אחד.', ex: 'נר ירוק: המחיר עלה. נר אדום: המחיר ירד.' },
  volume: { t: 'נפח', lesson: 'l3', v: 'volume', def: 'כמה מניות נסחרו. עמודה גבוהה אומרת הרבה מסחר.', ex: 'ביום עם עמודה גבוהה הרבה אנשים קנו ומכרו.' },
  ma: { t: 'ממוצע נע', lesson: 'l3', v: 'ma', def: 'קו שמראה את המחיר הממוצע של הזמן האחרון. הוא מחליק קפיצות ועוזר לראות כיוון.', ex: 'אם הגרף כל הזמן מעל הקו, בדרך כלל המחיר עולה.' },
  volatility: { t: 'תנודתיות', lesson: 'l3', v: 'candles', def: 'כמה המחיר קופץ. תנודתי הוא נכס שקופץ חזק, שקט הוא נכס שזז לאט.', ex: 'תנודתיות גבוהה: אפשר להרוויח הרבה, וגם להפסיד הרבה.' },
  trend: { t: 'מגמה', lesson: 'l4', v: 'trendUp', def: 'לאן המחיר הולך בגדול: למעלה, למטה, או בלי כיוון.', ex: 'מגמה עולה: כל ירידה נעצרת גבוה יותר מהקודמת.' },
  support: { t: 'תמיכה', lesson: 'l5', v: 'support', def: 'הרצפה: מקום שהמחיר ירד אליו, נעצר, וחזר למעלה.', ex: 'אם המחיר ירד פעמיים ל-110 וחזר למעלה, 110 הוא תמיכה.' },
  resistance: { t: 'התנגדות', lesson: 'l6', v: 'resist', def: 'התקרה: מקום שהמחיר עלה אליו, נעצר, וחזר למטה.', ex: 'אם המחיר עלה פעמיים ל-120 וחזר למטה, 120 הוא התנגדות.' },
  entry: { t: 'כניסה', lesson: 'l7', v: 'rr', def: 'הרגע והמחיר שבהם קונים.', ex: 'בתרגול הכניסה היא תמיד במחיר הנוכחי.' },
  stop: { t: 'סטופ', lesson: 'l7', v: 'rr', def: 'מחיר שאם המחיר יורד אליו, יוצאים מהעסקה כדי לא להפסיד יותר.', ex: 'קונים ב-100 ושמים סטופ ב-95: מפסידים עד 5 ליחידה.' },
  target: { t: 'יעד', lesson: 'l7', v: 'rr', def: 'מחיר שבו יוצאים מהעסקה ולוקחים רווח.', ex: 'קונים ב-100 ושמים יעד ב-110: מרוויחים עד 10 ליחידה.' },
  rr: { t: 'סיכוי מול סיכון', lesson: 'l8', v: 'rr', def: 'משווים כמה אפשר להרוויח לכמה אפשר להפסיד.', ex: 'מפסידים עד 5 ומרוויחים עד 10: הרווח כפול, והיחס הוא 1 ל-2.' },
  risk: { t: 'כמה מפסידים', lesson: 'l9', v: 'size', def: 'הסכום שמוכנים להפסיד בעסקה אחת אם טועים. מחליטים אותו קודם, ורק אז מחשבים כמה לקנות.', ex: 'בתיק של 5,000 ש"ח, 1% הם 50 ש"ח.' },
  diversify: { t: 'פיזור', lesson: 'l9', v: 'styles', def: 'לא לשים את כל הכסף בנכס אחד. כך יום רע של נכס אחד לא פוגע בהכול.', ex: 'תיק עם כמה מניות שונות מפוזר יותר מתיק עם מניה אחת.' },
  wait: { t: 'לחכות', lesson: 'l9', v: 'candles', def: 'להחליט לא לקנות עכשיו. כשאין סיבה ברורה, זו לפעמים ההחלטה הכי חכמה.', ex: 'גרף בלי כיוון ובלי רצפה ברורה הוא סיבה לחכות.' },
  cash: { t: 'מזומן', v: '', def: 'כסף פנוי בתיק שעוד לא קנו איתו כלום.', ex: 'אפשר להשאיר מזומן ולחכות להזדמנות.' },
  virtual: { t: 'כסף וירטואלי', v: '', def: 'כסף לתרגול בלבד. הוא לא אמיתי ואין סיכון לכסף שלכם.', ex: 'התיק של 5,000 ש"ח באפליקציה הוא וירטואלי.' }
};
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
    trendUp: `<svg viewBox="0 0 300 170"><polyline points="20,140 60,98 82,112 130,66 152,82 205,36 228,50 278,16" fill="none" stroke="${g}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><g fill="#fbbf24"><circle cx="82" cy="112" r="5"/><circle cx="152" cy="82" r="5"/><circle cx="228" cy="50" r="5"/></g>${lab(150, 162, 'הנקודות הנמוכות (בצהוב) הולכות וגבוהות יותר')}</svg>`,
    trendDown: `<svg viewBox="0 0 300 170"><polyline points="20,20 60,62 82,48 130,94 152,78 205,124 228,110 278,146" fill="none" stroke="${r}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/><g fill="#fbbf24"><circle cx="82" cy="48" r="5"/><circle cx="152" cy="78" r="5"/><circle cx="228" cy="110" r="5"/></g>${lab(150, 162, 'הנקודות הגבוהות (בצהוב) הולכות ונמוכות יותר')}</svg>`,
    trendSide: `<svg viewBox="0 0 300 170"><g stroke="#5d6571" stroke-dasharray="4 5"><path d="M10 50h280M10 110h280"/></g><polyline points="20,100 55,56 90,104 125,54 160,108 195,58 230,104 280,70" fill="none" stroke="#8b93a1" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>${lab(150, 150, 'קופץ למעלה ולמטה באותו טווח, בלי כיוון')}</svg>`,
    resist: `<svg viewBox="0 0 300 170"><rect x="10" y="40" width="280" height="22" fill="#a78bfa" opacity=".16"/><path d="M10 51h280" stroke="#a78bfa" stroke-width="2" stroke-dasharray="5 4"/>${candle(50, 100, 70, 52, 122, true)}${candle(95, 70, 95, 50, 110, false)}${candle(140, 105, 72, 52, 125, true)}${candle(185, 72, 100, 50, 118, false)}${candle(230, 100, 68, 50, 122, true)}${lab(150, 160, 'המחיר עצר באזור הזה כמה פעמים וחזר למטה')}</svg>`,
    index: `<svg viewBox="0 0 300 170"><rect x="60" y="22" width="180" height="104" rx="22" fill="#1c2026" stroke="#2c333c"/><g fill="${g}" opacity=".9"><circle cx="100" cy="56" r="11"/><circle cx="150" cy="56" r="11" fill="#60a5fa"/><circle cx="200" cy="56" r="11" fill="#fbbf24"/><circle cx="100" cy="92" r="11" fill="#a78bfa"/><circle cx="150" cy="92" r="11" fill="${r}"/><circle cx="200" cy="92" r="11"/></g>${lab(150, 152, 'מדד = סל של הרבה חברות, מספר אחד לכולן')}</svg>`,
    volume: `<svg viewBox="0 0 300 170"><g fill="${g}" opacity=".75"><rect x="30" y="100" width="22" height="30" rx="4"/><rect x="62" y="80" width="22" height="50" rx="4"/><rect x="94" y="108" width="22" height="22" rx="4"/><rect x="126" y="44" width="22" height="86" rx="4" fill="${r}"/><rect x="158" y="70" width="22" height="60" rx="4"/><rect x="190" y="96" width="22" height="34" rx="4"/><rect x="222" y="60" width="22" height="70" rx="4" fill="${r}"/></g>${lab(150, 156, 'עמודה גבוהה = הרבה מסחר באותו זמן')}</svg>`,
    ma: `<svg viewBox="0 0 300 170"><polyline points="20,110 45,70 70,100 95,50 120,86 145,40 170,76 195,34 220,64 250,28 280,46" fill="none" stroke="#5d6571" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 100 C100 90 160 60 280 36" fill="none" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round"/>${lab(150, 156, 'הקו הצהוב מחליק את הקפיצות ומראה כיוון')}</svg>`,
    size: `<svg viewBox="0 0 300 170"><rect x="30" y="40" width="240" height="26" rx="13" fill="#1c2026"/><rect x="30" y="40" width="12" height="26" rx="6" fill="${r}"/><g font-family="Heebo,sans-serif" font-size="13" fill="#c9cfd8" text-anchor="middle"><text x="150" y="102">תיק 5,000 ש"ח</text><text x="150" y="126" fill="${r}" font-weight="700">מסכנים 1% = 50 ש"ח</text></g></svg>`
  };
  return (V[v] || '').replace(/<svg viewBox/g, '<svg direction="ltr" viewBox');
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
