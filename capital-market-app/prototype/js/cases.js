'use strict';
/* ===== practice cases built from REAL historical daily data (see cases-data.js) =====
   During practice the asset name and dates stay hidden and prices are rebased so the decision price is 100.
   Only the feedback screen reveals the name, the dates and what really happened.
   Texts below use numbers computed from the data. "Trend" rule: change between the first and last of the 60 candles
   shown, up or down by more than 6% counts as a trend, otherwise no direction. */
const CASE_N = 60, CASE_M = 60, TREND_PCT = 6;
const CASE_META = {
  1: { asset: 'מדד S&P 500', action: 'enter', vol: [5, 'normal'], why: (S) => `המחיר עלה כ-${S.up}% ב-60 הנרות האחרונים והוא קרוב לשיא שלהם. יש מגמה עולה ורצפה קרובה (כ-${S.sw}% מתחת למחיר), ולכן יש מקום הגיוני לסטופ. זה מצב שאפשר לבנות עליו תוכנית.` },
  2: { asset: 'מדד נאסד"ק', action: 'wait', vol: [5, 'high'], why: (S) => `המחיר עלה כ-${S.up}% ב-60 הנרות האחרונים והוא ליד השיא. הרצפה רחוקה, כ-${S.sw}% מתחת למחיר, ולכן סטופ מתחתיה יהיה רחוק והסיכון גדול. אחרי עלייה חדה כזאת אפשר לחכות. זה שיקול ולא כלל מוחלט.` },
  3: { asset: 'מדד S&P 500', action: 'wait', vol: [5, 'high'], why: (S) => `המחיר ירד כ-${S.dn}% ב-60 הנרות האחרונים, והוא נמצא בנקודה הנמוכה של 10 הנרות האחרונים, כלומר אין רצפה שהחזיקה. בלי רצפה ברורה אין מקום הגיוני לסטופ, ולכן עדיף לחכות.` },
  4: { asset: 'מדד S&P 500', action: 'enter', vol: [5, 'normal'], why: (S) => `המחיר עלה כ-${S.up}% ב-60 הנרות האחרונים והוא ליד השיא. יש מגמה עולה ורצפה קרובה (כ-${S.sw}% מתחת למחיר), ולכן יש מקום הגיוני לסטופ. גם תוכנית טובה יכולה להיכשל, ולכן יש סטופ.` },
  5: { asset: 'מניית אפל (AAPL)', action: 'enter', vol: [5, 'normal'], why: (S) => `המחיר ירד כ-${S.fromHigh}% מהשיא של 60 הנרות האחרונים, והוא נמצא קרוב לנקודה הנמוכה של 10 הנרות האחרונים (כ-${S.sw}% מעליה). זה תיקון אחרי עלייה, עם רצפה קרובה ומקום ברור לסטופ.` },
  6: { asset: 'מניית מטא (META)', action: 'enter', vol: [5, 'high'], why: (S) => `המחיר ירד כ-${S.dn}% ב-60 הנרות האחרונים, אבל הוא כ-${S.sw}% מעל הנקודה הנמוכה של 10 הנרות האחרונים, ולכן יש רצפה קרובה ומקום לסטופ. זו תוכנית עם סיכון גבוה יותר, כי המגמה כלפי מטה.` },
  7: { asset: 'מניית אנבידיה (NVDA)', action: 'enter', vol: [5, 'high'], why: (S) => `המחיר ירד כ-${S.dn}% ב-60 הנרות האחרונים, אבל הוא כ-${S.sw}% מעל הנקודה הנמוכה של 10 הנרות האחרונים, ולכן יש רצפה קרובה ומקום ברור לסטופ. גם כאן המגמה כלפי מטה, ולכן הסיכון גבוה.` },
  8: { asset: 'מניית נטפליקס (NFLX)', action: 'wait', vol: [8, 'normal'], why: (S) => `המחיר עלה כ-${S.up}% ב-60 הנרות האחרונים, אבל הוא כבר כ-${S.fromHigh}% מתחת לשיא. ירידה מהשיא אחרי עלייה חדה היא סימן לזהירות, והרצפה רחוקה (כ-${S.sw}% מתחת למחיר). אפשר לחכות.` },
  9: { asset: 'מניית טסלה (TSLA)', action: 'enter', vol: [5, 'low'], why: (S) => `המחיר ירד כ-${S.fromHigh}% מהשיא של 60 הנרות האחרונים, והוא כ-${S.sw}% מעל הנקודה הנמוכה של 10 הנרות האחרונים, ולכן יש רצפה ברורה. הנכס תנודתי: הטווח הממוצע של נר הוא כ-${S.atrPct}% מהמחיר, ולכן סטופ צמוד מדי עלול להיפגע גם כשהכיוון נכון.` },
  10: { asset: 'מדד ת"א 125', action: 'wait', vol: [5, 'high'], why: (S) => `המחיר עלה כ-${S.up}% בלבד ב-60 הנרות האחרונים, בלי מגמה ברורה, והוא כ-${S.fromHigh}% מתחת לשיא שלהם. אין סיבה ברורה לקנות, ולכן אפשר לחכות.` }
};
const VOL_WORD = { low: 'נמוך', normal: 'רגיל', high: 'גבוה' };
const fmtDate = (iso) => { const [y, m, d] = iso.split('-'); return `${+d}.${+m}.${y}`; };

function caseStats(raw) {
  const k0 = raw.di - (CASE_N - 1), past = raw.c.slice(k0, raw.di + 1), f = 100 / raw.c[raw.di][4];
  const cl = past.map(r => r[4] * f), last10 = past.slice(-10), r0 = (v) => Math.round(v);
  const ch60 = (cl[cl.length - 1] / cl[0] - 1) * 100, hi = Math.max(...past.map(r => r[2] * f));
  const atr = past.slice(-14).reduce((a, r) => a + (r[2] - r[3]) * f, 0) / 14;
  return { ch60, up: r0(Math.abs(ch60)), dn: r0(Math.abs(ch60)), fromHigh: r0((hi - 100) / hi * 100), sw: r0(100 - Math.min(...last10.map(r => r[3] * f))), atrPct: r0(atr), trend: ch60 > TREND_PCT ? 'up' : ch60 < -TREND_PCT ? 'down' : 'side' };
}
function caseVol(raw, w) {
  const past = raw.c.slice(raw.di - (CASE_N - 1), raw.di + 1), v = past.map(r => r[5]), avg = v.reduce((a, b) => a + b, 0) / v.length;
  const ratio = v.slice(-w).reduce((a, b) => a + b, 0) / w / avg;
  return { ratio, ans: ratio >= 1.15 ? 'high' : ratio <= .85 ? 'low' : 'normal' };
}
const SCEN = REAL_CASES.map(raw => {
  const m = CASE_META[raw.id], S = caseStats(raw), [w, expect] = m.vol, V = caseVol(raw, w);
  if (V.ans !== expect) console.warn('volume answer changed for case', raw.id, V.ans, expect);
  const wl = { 5: 'חמשת', 8: 'שמונת' }[w] + ' הנרות האחרונים';
  return {
    id: 'r' + raw.id, raw, asset: m.asset, trend: S.trend, action: m.action, S, why: m.why(S),
    volq: { q: `ב${wl} הנפח היה, בהשוואה לממוצע של כל הגרף:`, ans: V.ans, why: `ב${wl} הנפח היה בערך ${Math.round(V.ratio * 100)}% מהממוצע של הגרף, כלומר ${VOL_WORD[V.ans]}. (נפח גבוה: לפחות 115% מהממוצע. נמוך: עד 85%. בין לבין: רגיל.)` }
  };
});
