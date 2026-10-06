'use strict';
/* ===== practice: learn to decide, not to guess =====
   Flow: read the chart -> decide (buy or wait) -> mark the floor (support) -> stop -> how much to risk -> target -> run.
   Entry is fixed at the market price, so nothing is a blind guess. Feedback scores the PROCESS. */
const TREND_NAME = { up: 'עולה', down: 'יורדת', side: 'בלי כיוון' };
const RISK_OPTS = [[.5, 'זהיר'], [1, 'מומלץ ללמידה'], [2, 'בסדר'], [5, 'גבוה מדי']];
const STEPS = [['read', 'כיוון'], ['line', 'קו'], ['volume', 'נפח'], ['decide', 'החלטה'], ['support', 'רצפה'], ['stop', 'סטופ'], ['size', 'סכום'], ['target', 'יעד']];

function buildScen(sc) {
  const r = rng(sc.seed), N = 26, M = 14;
  const interp = (pts, k) => { for (let j = 1; j < pts.length; j++) if (k <= pts[j][0]) { const [a, pa] = pts[j - 1], [b, pb] = pts[j]; return pa + (pb - pa) * (k - a) / (b - a); } return pts[pts.length - 1][1]; };
  const candles = []; let prev = sc.past[0][1];
  for (let k = 0; k < N + M; k++) {
    const target = k < N ? interp(sc.past, k) : interp(sc.fut, k - N);
    let c = k === 0 ? target : target + (r() - .5) * 2.2; const o = prev;
    if (k === N - 1) c = sc.past[sc.past.length - 1][1];
    candles.push({ o, c, h: Math.max(o, c) + r() * 1.5 + .3, l: Math.min(o, c) - r() * 1.5 - .3 }); prev = c;
  }
  const vr = rng(sc.seed * 5 + 1);
  candles.forEach((c, k) => { const up = c.c >= c.o; let v; if (sc.volk === 'pullback') v = up ? 95 + vr() * 30 : 32 + vr() * 20; else if (sc.volk === 'breakout') v = k >= N - 3 ? 115 + vr() * 30 : 40 + vr() * 20 + (up ? 8 : 0); else if (sc.volk === 'sell') v = up ? 35 + vr() * 20 : 100 + vr() * 30; else v = 38 + vr() * 22; c.v = Math.round(v); });
  const past = candles.slice(0, N), last = past[N - 1].c;
  return { candles, N, M, last, swingLow: Math.min(...past.slice(-10).map(c => c.l)), recentHigh: Math.max(...past.slice(-20).map(c => c.h)), atr: past.slice(-14).reduce((a, c) => a + (c.h - c.l), 0) / 14 };
}
function altFuture(P, seed, drift) {
  const r = rng(seed); let p = P.last; const out = [];
  for (let i = 0; i < P.M; i++) { const o = p, c = o + drift + (r() - .5) * 2 * P.atr * .95; out.push({ o, c, h: Math.max(o, c) + r() * P.atr * .4, l: Math.min(o, c) - r() * P.atr * .4 }); p = c; }
  return out;
}
function simulate(cs, plan) {
  for (let k = 0; k < cs.length; k++) { if (cs[k].l <= plan.stop) return { res: 'stop', at: k }; if (cs[k].h >= plan.target) return { res: 'target', at: k }; }
  return { res: 'none', at: cs.length - 1 };
}
function sizing(P, plan) {
  const eq = START_CASH, riskMoney = eq * plan.risk / 100, per = P.last - plan.stop;
  let qty = per > 0 ? Math.floor(riskMoney / per) : 0, capped = false;
  if (qty * P.last > eq) { qty = Math.floor(eq / P.last); capped = true; }
  return { riskMoney, per, qty, value: qty * P.last, pct: qty * P.last / eq * 100, capped };
}
function evaluate(sc, P, st) {
  const ch = [], nm = TREND_NAME[sc.trend];
  ch.push({ t: 'כיוון הגרף', term: 'trend', ok: st.trend === sc.trend, good: `נכון! המגמה כאן ${nm}.`, bad: `המגמה כאן ${nm}. כדאי לבדוק אם הנקודות הנמוכות הולכות ועולות, יורדות או נשארות באותו מקום.` });
  if (st.line) {
    const sl = (st.line.p2 - st.line.p1) / (st.line.i2 - st.line.i1), th = .15 * P.atr, cls = sl > th ? 'up' : sl < -th ? 'down' : 'side';
    ch.push({ t: 'קו מגמה', term: 'trendline', ok: cls === sc.trend, good: `הקו שציירתם ${TREND_NAME[cls]}, בדיוק כמו המגמה בגרף.`, bad: `הקו שציירתם ${TREND_NAME[cls]}, אבל המגמה בגרף ${nm}. נסו לחבר נקודות נמוכות (או גבוהות) שבאמת באותו כיוון.` });
  }
  if (st.volAns) ch.push({ t: 'נפח', term: 'volume', ok: st.volAns === sc.volq.ans, good: sc.volq.why, bad: 'לא בדיוק. ' + sc.volq.why });
  ch.push({ t: 'לקנות או לחכות', term: 'wait', ok: st.decision === sc.action, good: sc.action === 'wait' ? 'נכון, כאן עדיף לחכות. לא חייבים לקנות כל הזמן.' : 'נכון, יש כאן סיבה טובה לבנות תוכנית.', bad: sc.why });
  if (st.decision === 'enter' && st.plan) {
    const pl = st.plan, rr = (pl.target - P.last) / (P.last - pl.stop), sz = sizing(P, pl);
    ch.push({ t: 'הרצפה (תמיכה)', term: 'support', ok: Math.abs(pl.support - P.swingLow) <= .9 * P.atr, good: 'מצאתם את הרצפה: המקום הנמוך שהמחיר עצר בו וחזר למעלה.', bad: 'הרצפה היא המקום הנמוך שהמחיר עצר בו וחזר למעלה. חפשו את הנקודות הנמוכות האחרונות בגרף.' });
    ch.push({ t: 'סטופ', term: 'stop', ok: pl.stop <= P.swingLow && pl.stop >= P.swingLow - 2.5 * P.atr, good: 'הסטופ נמצא קצת מתחת לרצפה. בדיוק במקום.', bad: pl.stop > P.swingLow ? 'הסטופ קרוב מדי, הוא אפילו מעל הרצפה. תנודה קטנה תוציא אתכם מהעסקה.' : 'הסטופ רחוק מדי, ותצטרכו להפסיד יותר מהצורך.' });
    ch.push({ t: 'כמה מפסידים', term: 'risk', ok: pl.risk <= 2, good: `בחרתם להפסיד עד ${money(sz.riskMoney)}. סכום קטן ובטוח.`, bad: `בחרתם להפסיד עד ${money(sz.riskMoney)} (${pl.risk}% מהתיק). זה גדול: כמה טעויות ברצף ידללו את התיק. כלל אצבע ללימוד: עד 2%.` });
    ch.push({ t: 'יעד', term: 'rr', ok: rr >= 1.5, good: `הרווח האפשרי גדול מההפסד האפשרי פי ${fmt(rr, 1)}. מצוין.`, bad: `הרווח האפשרי גדול מההפסד רק פי ${fmt(Math.max(rr, 0), 1)}. כדאי לפחות פי 1.5.` });
  }
  const fails = ch.filter(c => !c.ok).length;
  return { checks: ch, fails, stars: fails === 0 ? 3 : fails === 1 ? 2 : fails === 2 ? 1 : 0 };
}

/* ----- list ----- */
function needBanner() {
  const need = ['l4', 'l5', 'l7', 'l9'].map(id => LESSONS.find(l => l.id === id)).filter(l => !lessonsDone().includes(l.id));
  if (!need.length) return '';
  return `<div class="need"><b>חדשים בנושא?</b><span>מומלץ לראות קודם את השיעור: ${need[0].title}</span><button class="btn ghost small" data-go="lesson" data-arg="${need[0].id}">לשיעור</button></div>`;
}
screens.practiceHome = () => {
  const d = A().practiceDone;
  scr.innerHTML = `<div class="anim"><div class="top"><h2>תרגול</h2><span class="pill gold">${ic.star}${A().stars}</span></div>
    <div class="card howto"><b>איך זה עובד?</b><div class="how">${['רואים גרף של מניה בדויה', 'מחליטים אם לקנות או לחכות', 'אם קונים: בונים תוכנית צעד אחרי צעד', 'מריצים את הגרף ורואים מה קרה'].map((t, i) => `<div><i>${i + 1}</i><span>${t}</span></div>`).join('')}</div>
      <span class="muted" style="font-size:13px;line-height:1.6">אין כאן כסף אמיתי. הנקודות והכוכבים הם על החשיבה שלכם ולא על המזל. לפעמים התשובה הנכונה היא לחכות.</span></div>
    <div style="height:14px"></div>
    ${SCEN.map((s, i) => `<button class="les" data-go="practice" data-arg="${i}"><div class="ic" style="color:var(--lime)">${ic.chart}</div><div class="tx"><b>מקרה ${i + 1}</b><span>גרף הדגמה</span></div><span class="st" style="direction:ltr">${'★'.repeat(d[s.id] || 0)}${'☆'.repeat(3 - (d[s.id] || 0))}</span></button>`).join('')}
    <p class="demo-note">הגרפים נוצרים בקוד ואינם נתוני שוק אמיתיים. אין כאן המלצת השקעה.</p></div>`;
};

/* ----- the exercise ----- */
screens.practice = (idx = 0) => {
  idx = (+idx || 0) % SCEN.length;
  const sc = SCEN[idx], P = buildScen(sc);
  const W = 358, H = 300, VH = 54, AX = 46, plotW = W - AX, slot = (plotW - 8) / (P.N + P.M), bw = slot * .62;
  const all = P.candles, lo = Math.min(...all.map(c => c.l)) - 3, hi = Math.max(...all.map(c => c.h)) + 3;
  const y = (v) => 8 + (hi - v) / (hi - lo) * (H - 24), priceAt = (py) => hi - (py - 8) / (H - 24) * (hi - lo), cx = (k) => 6 + k * slot + slot / 2;
  const st = { step: 'read', line: null, drag: null, volAns: null, trend: null, decision: null, support: null, stop: null, risk: null, target: null, hint: false, running: false, shown: P.N, mark: null };
  scr.innerHTML = `<div class="anim">
    <div class="pr-head"><button class="icon-btn" id="bk">${ic.back}</button><div class="tt"><b>מקרה ${idx + 1}</b><span>גרף הדגמה, בלי כסף אמיתי</span></div><button class="icon-btn" id="hb" style="color:var(--gold)" aria-label="רמז">${ic.bulb}</button></div>
    <div class="pbox"><div class="meta"><div><span class="hl">מחיר עכשיו</span><div class="price" id="px">${fmt(P.last)}</div></div><div class="hl" style="text-align:left">תיק תרגול ${money(START_CASH)}</div></div>
      <svg class="chart" id="ch" viewBox="0 0 ${W} ${H + VH + 6}"></svg></div>
    <div class="steps" id="dots"></div><div id="panel" class="panel task"></div><div id="hintBox"></div></div>`;
  const svg = $('#ch');
  const el = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; };
  const txt = (x, yy, t, fill, size = 11, anchor = 'start', w = 600, cls) => { const e = el('text', { x, y: yy, fill, 'font-size': size, 'font-weight': w, 'text-anchor': anchor, 'font-family': 'Heebo,sans-serif' }); e.textContent = t; if (cls) e.setAttribute('class', cls); };
  const plan = () => ({ support: st.support, stop: st.stop, target: st.target, risk: st.risk });
  const tapStep = () => ['support', 'stop', 'target'].includes(st.step) && !st.running;
  function draw() {
    svg.innerHTML = '';
    const step = (hi - lo) > 40 ? 10 : 5;
    for (let v = Math.ceil(lo / step) * step; v < hi; v += step) { el('line', { x1: 0, x2: plotW, y1: y(v), y2: y(v), stroke: '#fff', 'stroke-opacity': .06, 'stroke-dasharray': '3 5' }); txt(W - 4, y(v) + 4, Math.round(v), '#5d6571', 11, 'end', 400); }
    el('rect', { x: 6 + P.N * slot, y: 0, width: plotW - 6 - P.N * slot, height: H, fill: '#fff', opacity: .03 });
    el('line', { x1: 6 + P.N * slot, x2: 6 + P.N * slot, y1: 0, y2: H, stroke: '#3a414b', 'stroke-dasharray': '2 4' });
    if (st.shown === P.N) txt(6 + P.N * slot + (plotW - 6 - P.N * slot) / 2, H / 2, 'העתיד', '#5d6571', 12, 'middle', 400);
    if (st.hint) { el('rect', { x: 0, y: y(P.swingLow + P.atr * .35), width: plotW, height: y(P.swingLow - P.atr * .6) - y(P.swingLow + P.atr * .35), fill: '#fbbf24', opacity: .13 }); txt(8, y(P.swingLow - P.atr * .6) + 13, 'הנקודות הנמוכות האחרונות', '#fbbf24', 11, 'start', 500); }
    for (let k = 0; k < st.shown; k++) { const c = P.candles[k], up = c.c >= c.o, col = up ? '#1ff0b0' : '#ff6048', x = cx(k); el('line', { x1: x, x2: x, y1: y(c.h), y2: y(c.l), stroke: col, 'stroke-width': 1.4, 'stroke-linecap': 'round' }); el('rect', { x: x - bw / 2, y: y(Math.max(c.o, c.c)), width: bw, height: Math.max(2, Math.abs(y(c.o) - y(c.c))), rx: 1.5, fill: col }); }
    /* volume panel */
    { const top = H + 6, vmax = 150; txt(8, top + 12, 'נפח', '#8b93a1', 10.5, 'start', 600);
      if (st.step === 'volume') el('rect', { x: 2, y: top - 2, width: plotW + 2, height: VH + 4, rx: 8, fill: '#fbbf24', opacity: .1, stroke: '#fbbf24', 'stroke-opacity': .5 });
      for (let k = 0; k < st.shown; k++) { const c = P.candles[k], hh = c.v / vmax * (VH - 6), up = c.c >= c.o; el('rect', { x: cx(k) - bw / 2, y: top + VH - hh, width: bw, height: hh, rx: 1.5, fill: up ? '#1ff0b0' : '#ff6048', opacity: .55 }); } }
    /* trend line drawn by the learner (extends into the future as a dashed projection) */
    { const ln = st.drag || st.line; if (ln && ln.i2 !== ln.i1) { const m = (ln.p2 - ln.p1) / (ln.i2 - ln.i1), last = P.N + P.M - 1, yAt = (i) => y(ln.p1 + m * (i - ln.i1));
      el('line', { x1: cx(ln.i1), y1: yAt(ln.i1), x2: cx(ln.i2), y2: yAt(ln.i2), stroke: '#fbbf24', 'stroke-width': 2.4, 'stroke-linecap': 'round' });
      el('line', { x1: cx(ln.i2), y1: yAt(ln.i2), x2: cx(last), y2: yAt(last), stroke: '#fbbf24', 'stroke-width': 1.6, 'stroke-dasharray': '5 5', opacity: .6 });
      [ln.i1, ln.i2].forEach(i => el('circle', { cx: cx(i), cy: yAt(i), r: 4, fill: '#fbbf24', stroke: '#0b0d10', 'stroke-width': 2 })); } }
    const lv = [];
    if (st.decision === 'enter') lv.push(['entry', P.last, '#6aa8ff', 'קנייה עכשיו', '0']);
    if (st.support != null) lv.push(['support', st.support, '#fbbf24', 'רצפה', '2 4']);
    if (st.stop != null) lv.push(['stop', st.stop, '#ff6048', 'סטופ', '6 4']);
    if (st.target != null) lv.push(['target', st.target, '#1fd69b', 'יעד', '6 4']);
    if (st.stop != null && st.decision === 'enter') el('rect', { x: 0, y: y(P.last), width: plotW, height: Math.max(0, y(st.stop) - y(P.last)), fill: '#ff6048', opacity: .09 });
    if (st.target != null && st.decision === 'enter') el('rect', { x: 0, y: y(st.target), width: plotW, height: Math.max(0, y(P.last) - y(st.target)), fill: '#1fd69b', opacity: .09 });
    lv.forEach(([k, v, col, label, dash]) => {
      el('line', { x1: 0, x2: plotW, y1: y(v), y2: y(v), stroke: col, 'stroke-width': 1.8, 'stroke-dasharray': dash });
      el('rect', { x: W - AX + 2, y: y(v) - 11, width: AX - 4, height: 22, rx: 8, fill: col }); txt(W - AX / 2, y(v) + 4, fmt(v, 1), k === 'stop' ? '#fff' : '#04140e', 10.5, 'middle', 700); txt(8, y(v) - 5, label, col, 11, 'start', 700);
    });
    if ((tapStep() && st[st.step] == null) || (st.step === 'line' && !st.line && !st.drag)) {
      el('rect', { x: 70, y: 22, width: 190, height: 30, rx: 15, fill: '#1ff0b0', opacity: .16 });
      txt(165, 42, st.step === 'line' ? 'גררו קו על הגרף' : 'לחצו כאן על הגרף', '#1ff0b0', 13, 'middle', 700, 'pulse');
    }
    if (st.mark) { const m = st.mark; el('circle', { cx: cx(m.at + P.N), cy: y(m.res === 'target' ? st.target : st.stop), r: 7, fill: m.res === 'target' ? '#1fd69b' : '#ff6048', stroke: '#0b0d10', 'stroke-width': 2 }); }
  }
  function setFromEvent(e) {
    const rect = svg.getBoundingClientRect(), py = (e.clientY - rect.top) * ((H + VH + 6) / rect.height);
    let v = clamp(priceAt(py), lo + 1, hi - 1);
    const snap = (arr) => { let best = null, bd = 12; arr.forEach(p => { const d = Math.abs(y(p) - py); if (d < bd) { bd = d; best = p; } }); return best; };
    if (st.step === 'support') { const s = snap(P.candles.slice(0, P.N).map(c => c.l)); if (s != null) v = s; }
    if (st.step === 'target') { const s = snap(P.candles.slice(0, P.N).map(c => c.h)); if (s != null) v = s; }
    v = Math.round(v * 10) / 10; st[st.step] = v; draw(); readout();
  }
  let dragging = false;
  const idxPrice = (e) => { const rect = svg.getBoundingClientRect(), px = (e.clientX - rect.left) * (W / rect.width); const i = clamp(Math.round((px - 6 - slot / 2) / slot), 0, P.N - 1); let v = clamp(priceAt((e.clientY - rect.top) * ((H + VH + 6) / rect.height)), lo + 1, hi - 1); const c = P.candles[i], yy = (e.clientY - rect.top) * ((H + VH + 6) / rect.height); [c.l, c.h].forEach(q => { if (Math.abs(y(q) - yy) < 12) v = q; }); return { i, v: Math.round(v * 10) / 10 }; };
  svg.addEventListener('pointerdown', (e) => { if (st.step === 'line' && !st.running) { const q = idxPrice(e); st.drag = { i1: q.i, p1: q.v, i2: q.i, p2: q.v }; dragging = 'line'; try { svg.setPointerCapture(e.pointerId); } catch (_) { } draw(); return; } if (!tapStep()) return; dragging = true; try { svg.setPointerCapture(e.pointerId); } catch (_) { } setFromEvent(e); });
  svg.addEventListener('pointermove', (e) => { if (dragging === 'line' && st.drag) { const q = idxPrice(e); st.drag.i2 = q.i; st.drag.p2 = q.v; draw(); } else if (dragging) setFromEvent(e); });
  const end = () => { if (dragging === 'line' && st.drag) { const d = st.drag; st.drag = null; if (Math.abs(d.i2 - d.i1) >= 6) { if (d.i2 < d.i1) Object.assign(d, { i1: d.i2, p1: d.p2, i2: d.i1, p2: d.p1 }); st.line = d; } else toast('מתחו קו ארוך יותר, לפחות 6 נרות'); draw(); panel(); } dragging = false; }; svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);

  const path = () => st.decision === 'wait' ? ['read', 'line', 'volume', 'decide'] : STEPS.map(s => s[0]);
  const hd = (title, body) => { const p = path(), n = p.indexOf(st.step) + 1; return `<span class="tk-n">שלב ${n} מתוך ${p.length}</span><h3>${title}</h3><p>${body}</p>`; };
  function dots() { const p = path(), cur = p.indexOf(st.step); $('#dots').innerHTML = STEPS.filter(s => p.includes(s[0])).map((s, i) => `<span class="${i < cur ? 'done' : i === cur ? 'on' : ''}"><i>${i < cur ? '✓' : i + 1}</i>${s[1]}</span>`).join(''); }
  function nav(label, disabled) { return `<div class="pnav">${st.step !== 'read' ? '<button class="btn ghost small" id="pb" style="flex:none;width:84px">חזרה</button>' : ''}<button class="btn primary small" id="pn" ${disabled ? 'disabled' : ''}>${label || 'הבא'}</button></div>`; }
  function goStep(s) { st.step = s; panel(); draw(); }
  function roSize() {
    if (!st.risk) return 'בחרו סכום';
    const sz = sizing(P, plan());
    return sz.capped ? `כדי להפסיד רק ${money(sz.riskMoney)} הייתם צריכים לקנות יותר ממה שיש בתיק. זה סימן שהסכום שבחרתם גדול מדי.` : `אם טועים, תפסידו בערך <b>${money(sz.riskMoney)}</b>. לפי זה תקנו <b>${sz.qty}</b> מניות, בערך ${money(sz.value)}.`;
  }
  function roTarget() {
    if (st.target == null) return 'לחצו על הגרף או על אחד הכפתורים';
    const rk = P.last - st.stop, rw = st.target - P.last, rr = rw / rk, sz = sizing(P, plan());
    return `הרווח האפשרי גדול מההפסד פי <b>${fmt(rr, 1)}</b>. ${rr < 1.5 ? 'זה קטן מדי, כדאי לפחות פי 1.5.' : 'מצוין!'}<div class="two"><div class="w">אם מצליחים<b>+${money(sz.qty * rw)}</b></div><div class="l">אם טועים<b>-${money(sz.qty * rk)}</b></div></div>`;
  }
  function panel() {
    dots(); const p = $('#panel'); let h = '', next = null, label = '', dis = false;
    if (st.step === 'read') {
      h = needBanner() + hd('לאן הגרף הולך?', 'הסתכלו על הנרות. האם המחיר בגדול <b>עולה</b>, <b>יורד</b>, או קופץ <b>בלי כיוון</b>?') + `<div class="opts">${[['up', 'עולה'], ['down', 'יורד'], ['side', 'בלי כיוון']].map(([k, t]) => `<button class="opt${st.trend === k ? ' sel' : ''}" data-k="${k}">${t}</button>`).join('')}</div>${learn(['trend', 'candle'])}`; next = 'line'; dis = !st.trend;
    } else if (st.step === 'line') {
      const ln = st.line, sl = ln ? (ln.p2 - ln.p1) / (ln.i2 - ln.i1) : 0, cls = !ln ? '' : sl > .15 * P.atr ? 'עולה' : sl < -.15 * P.atr ? 'יורד' : 'כמעט ישר';
      h = hd('מתחו קו מגמה', 'גררו עם האצבע על הגרף, מנקודה אחת לאחרת, <b>לאורך הנקודות הנמוכות</b> (או הגבוהות). הקו המקווקו ממשיך לעתיד. זה נקרא ' + term('trendline') + '.') + `<div class="chips"><button class="chip" id="clr">נקה קו</button></div><div class="ro" id="ro">${ln ? 'הקו שציירתם: <b>' + cls + '</b>' : 'עוד לא ציירתם קו'}</div>${learn(['trendline', 'trend'])}`; next = 'volume'; dis = !ln;
    } else if (st.step === 'volume') {
      const vq = sc.volq;
      h = hd('מה אומר הנפח?', 'הסתכלו על העמודות בתחתית הגרף. כל עמודה היא כמה מסחר היה באותו נר. ' + vq.q) + `<div class="opts">${[['low', 'נמוך'], ['high', 'גבוה']].map(([k, t]) => `<button class="opt${st.volAns === k ? ' sel' : ''}" data-k="${k}">${t}</button>`).join('')}</div>${learn(['volume'])}`; next = 'decide'; dis = !st.volAns;
    } else if (st.step === 'decide') {
      h = hd('האם כדאי לקנות עכשיו?', 'קונים רק כשיש סיבה טובה. אם אין, <b>מחכים</b>, וגם זו תשובה נכונה לפעמים.') + `<div class="opts">${[['enter', 'כן, יש סיבה לקנות'], ['wait', 'לא, מחכים']].map(([k, t]) => `<button class="opt${st.decision === k ? ' sel' : ''}" data-k="${k}">${t}</button>`).join('')}</div>${learn(['wait', 'entry'])}`; dis = !st.decision; next = st.decision === 'wait' ? 'run' : 'support'; label = st.decision === 'wait' ? 'ראו מה קרה' : 'הבא';
    } else if (st.step === 'support') {
      h = hd('סמנו את הרצפה', 'מצאו מקום שהמחיר ירד אליו ואז חזר למעלה. <b>לחצו על הגרף ליד אחת הנקודות הנמוכות.</b> הסימון יתפוס לנקודה הקרובה. זה נקרא ' + term('support') + '.') + `<div class="ro" id="ro">${st.support != null ? 'סימנתם: <b>' + fmt(st.support) + '</b>' : 'עוד לא סימנתם'}</div>${learn(['support'])}`; next = 'stop'; dis = st.support == null;
    } else if (st.step === 'stop') {
      h = hd('מתי יוצאים אם טעיתם?', 'בחרו מחיר קצת <b>מתחת לרצפה</b>. אם המחיר ירד עד לשם, יוצאים מהעסקה כדי לא להפסיד יותר. זה נקרא ' + term('stop') + '.') + `<div class="chips"><button class="chip" id="auto">שים לי מתחת לרצפה</button></div><div class="ro" id="ro">${st.stop != null ? 'סטופ: <b>' + fmt(st.stop) + '</b> (אם המחיר יורד לשם, מפסידים ' + fmt(P.last - st.stop) + ' על כל מניה)' : 'לחצו על הגרף או על הכפתור'}</div>${learn(['stop'])}`; next = 'size'; dis = st.stop == null || st.stop >= P.last;
    } else if (st.step === 'size') {
      h = hd('כמה כסף מוכנים להפסיד אם טעיתם?', 'מחליטים קודם כמה מפסידים, ורק אז כמה לקנות. בתיק של ' + money(START_CASH) + ' כדאי להפסיד סכום קטן.') + `<div class="riskgrid" id="rk">${RISK_OPTS.map(([v, t]) => `<button class="rk${st.risk === v ? ' on' : ''}${v >= 5 ? ' warn' : ''}" data-v="${v}"><b>${money(START_CASH * v / 100)}</b><span>${v}% · ${t}</span></button>`).join('')}</div><div class="ro" id="ro">${roSize()}</div>${learn(['risk'])}`; next = 'target'; dis = !st.risk;
    } else if (st.step === 'target') {
      const risk = P.last - st.stop;
      h = hd('עד איזה מחיר מחכים לרווח?', 'בחרו מחיר שבו יוצאים עם רווח. הרווח האפשרי צריך להיות <b>גדול מההפסד האפשרי</b>, לפחות פי 1.5. זה נקרא ' + term('target') + '.') + `<div class="chips" id="tg"><button class="chip" data-t="${P.last + risk * 2}">רווח כפול מההפסד</button><button class="chip" data-t="${P.last + risk * 3}">רווח פי 3</button><button class="chip" data-t="${P.recentHigh}">הגבוה האחרון בגרף</button></div><div class="ro" id="ro">${roTarget()}</div>${learn(['target', 'rr', 'resistance'])}`; next = 'run'; label = 'הרץ את הגרף'; dis = st.target == null || st.target <= P.last;
    }
    p.innerHTML = h + nav(label, dis);
    $$('.opt', p).forEach(b => b.onclick = () => { if (st.step === 'read') st.trend = b.dataset.k; else if (st.step === 'volume') st.volAns = b.dataset.k; else st.decision = b.dataset.k; draw(); panel(); });
    const cl = $('#clr'); if (cl) cl.onclick = () => { st.line = null; draw(); panel(); };
    const au = $('#auto'); if (au) au.onclick = () => { const base = st.support != null ? st.support : P.swingLow; st.stop = Math.round((base - P.atr * .5) * 10) / 10; draw(); panel(); };
    const rk = $('#rk'); if (rk) rk.onclick = (e) => { const b = e.target.closest('.rk'); if (!b) return; st.risk = +b.dataset.v; panel(); };
    const tg = $('#tg'); if (tg) tg.onclick = (e) => { const b = e.target.closest('.chip'); if (!b) return; st.target = Math.round(+b.dataset.t * 10) / 10; draw(); panel(); };
    const pb = $('#pb'); if (pb) pb.onclick = () => { const q = path(), i = q.indexOf(st.step); goStep(q[Math.max(0, i - 1)]); };
    $('#pn').onclick = () => { if (next === 'run') run(); else goStep(next); };
  }
  function readout() {
    const r = $('#ro'); if (!r) return;
    if (st.step === 'support') r.innerHTML = 'סימנתם: <b>' + fmt(st.support) + '</b>';
    else if (st.step === 'stop') r.innerHTML = 'סטופ: <b>' + fmt(st.stop) + '</b> (אם המחיר יורד לשם, מפסידים ' + fmt(P.last - st.stop) + ' על כל מניה)';
    else if (st.step === 'target') r.innerHTML = roTarget();
    const n = $('#pn'); if (n) n.disabled = st.step === 'support' ? st.support == null : st.step === 'stop' ? st.stop >= P.last : st.target <= P.last;
  }
  $('#bk').onclick = () => go('practiceHome');
  $('#hb').onclick = () => { st.hint = !st.hint; $('#hintBox').innerHTML = st.hint ? `<div class="hint">רמז: הסתכלו על הנקודות הנמוכות בנרות האחרונים (מסומנות בצהוב). אם המחיר עצר שם וחזר למעלה, זו הרצפה. אם הנקודות הנמוכות כל הזמן נשברות, הגרף לא עולה.</div>` : ''; draw(); };

  function run() {
    st.running = true; st.step = 'run'; $('#panel').innerHTML = '<div class="ro" style="text-align:center;margin:0">מריצים את הגרף ורואים מה קרה...</div>'; dots(); draw();
    const fut = P.candles.slice(P.N);
    const enter = st.decision === 'enter' && st.stop != null && st.target != null;
    const sim = enter ? simulate(fut, { stop: st.stop, target: st.target }) : { res: 'none', at: fut.length - 1 };
    const timer = setInterval(() => {
      if (st.shown - P.N > sim.at) {
        clearInterval(timer); if (sim.res !== 'none') st.mark = { res: sim.res, at: sim.at }; draw();
        setTimeout(() => go('feedback', { idx, st: { trend: st.trend, decision: st.decision, line: st.line, volAns: st.volAns, plan: enter ? plan() : null }, sim }), 1100); return;
      }
      st.shown++; $('#px').textContent = fmt(P.candles[st.shown - 1].c); draw();
    }, 360);
  }
  window.__P = P; window.__st = st; window.__SC = sc;
  draw(); panel();
  if (!A().seenIntro) {
    A().seenIntro = true; save();
    openSheet(`<span class="tag">לפני שמתחילים</span><h3 style="margin-top:8px">מה עושים בתרגיל?</h3>
      <p class="def">זה גרף של מניה בדויה. אתם מחליטים מה לעשות, כמו בחיים אבל בלי כסף אמיתי.</p>
      <div class="steps2"><div><i>1</i><span>קוראים את הגרף ורואים לאן הוא הולך</span></div><div><i>2</i><span>מחליטים: לקנות או לחכות</span></div><div><i>3</i><span>אם קונים, בונים תוכנית: איפה הרצפה, מתי יוצאים אם טעינו, כמה מוכנים להפסיד, ועד איפה מחכים לרווח</span></div><div><i>4</i><span>מריצים את הגרף ורואים מה קרה</span></div></div>
      <div class="info">לא מקבלים נקודות על מזל. מקבלים נקודות על חשיבה נכונה. בכל שלב יש כפתור "מה זה...?" אם משהו לא ברור.</div>
      <button class="btn primary" data-close="1" style="margin-top:14px">הבנתי, מתחילים</button>`);
  }
};

/* ----- feedback ----- */
screens.feedback = ({ idx, st, sim }) => {
  const sc = SCEN[idx], P = buildScen(sc), ev = evaluate(sc, P, st), ok = ev.fails === 0;
  const ac = A(), prev = ac.practiceDone[sc.id] || 0;
  if (ev.stars > prev) { ac.stars += ev.stars - prev; ac.xp = (ac.xp || 0) + (ev.stars - prev) * 10; ac.practiceDone[sc.id] = ev.stars; save(); }
  markActive(ac);
  let result = '', alt = '', title, sub;
  const pl = st.plan;
  if (pl) {
    const sz = sizing(P, pl), fut = P.candles.slice(P.N), rrv = (pl.target - P.last) / (P.last - pl.stop);
    const pnl = sim.res === 'target' ? sz.qty * (pl.target - P.last) : sim.res === 'stop' ? -sz.qty * (P.last - pl.stop) : sz.qty * (fut[sim.at].c - P.last);
    const outcome = { target: 'המחיר הגיע ליעד, יצאתם עם רווח', stop: 'המחיר ירד לסטופ, יצאתם והפסדתם סכום קטן שהחלטתם עליו מראש', none: 'המחיר לא הגיע לא ליעד ולא לסטופ' }[sim.res];
    result = `<div class="card pnl"><span class="eyebrow">מה קרה בגרף הזה (כסף וירטואלי)</span><div class="wbig ${chgCls(pnl)}">${pnl >= 0 ? '+' : '-'}${money(Math.abs(pnl))}</div><span class="muted" style="font-size:13.5px;line-height:1.5">${outcome}.</span></div>`;
    const drift = (sc.drift || 0.6) * .5, res = [];
    for (let k = 0; k < 7; k++) res.push(simulate(altFuture(P, sc.seed * 31 + k * 17 + 5, drift), { stop: pl.stop, target: pl.target }).res);
    const w = res.filter(r => r === 'target').length, l = res.filter(r => r === 'stop').length;
    alt = `<div class="card alt"><b>בדיקה נוספת: אותה תוכנית, 7 גרפים אחרים</b><div class="altrow">${res.map(r => `<i class="${r}">${r === 'target' ? '✓' : r === 'stop' ? '✕' : '·'}</i>`).join('')}</div>
      <span class="muted" style="font-size:13.5px;line-height:1.65">${w} הגיעו ליעד, ${l} ירדו לסטופ. זה בסדר! כשהרווח האפשרי גדול מההפסד, מספיק להצליח בערך 1 מכל ${Math.round(1 + rrv)} פעמים כדי לא להפסיד בסך הכול. תוצאה אחת לא מוכיחה כלום, ולכן בודקים את התוכנית ולא רק את התוצאה. (גרפים אקראיים בדויים, עם הנחה של עלייה קלה. זו הדגמה ולא סטטיסטיקה אמיתית.)</span></div>`;
    if (ok) { title = sim.res === 'target' ? 'תוכנית מצוינת!' : sim.res === 'stop' ? 'תוכנית טובה, אבל הפעם לא הצליח' : 'תוכנית טובה'; sub = sim.res === 'stop' ? 'זה קורה גם לתוכניות טובות. הסטופ עשה את שלו: ההפסד נשאר קטן.' : 'כל החלקים בתוכנית נכונים.'; }
  } else if (st.decision === 'wait') {
    result = `<div class="card pnl"><span class="eyebrow">מה קרה בגרף</span><div class="wbig" style="font-size:20px">${sc.action === 'wait' ? 'לא הפסדתם כלום' : 'לא קניתם'}</div><span class="muted" style="font-size:13.5px;line-height:1.5">${sc.why}</span></div>`;
  }
  if (!title) { title = ok ? 'החלטה מצוינת!' : ev.stars === 2 ? 'כמעט!' : 'לא הפעם'; sub = ok ? 'הכול נכון.' : 'יש כאן משהו לתקן, וזה בסדר. הכי חשוב להבין למה.'; }
  $('#tabbar').hidden = true;
  scr.innerHTML = `${ok ? confetti() : ''}<div class="fb ${ok ? 'ok' : 'no'} anim">
    <div class="big-ic" style="color:${ok ? 'var(--green)' : 'var(--red)'}">${ok ? ic.check : ic.x}</div>
    <h1 style="font-size:24px;padding:0 10px">${title}</h1><p class="muted" style="margin:0 24px;line-height:1.55">${sub}</p>
    <div class="stars">${[0, 1, 2].map(k => `<span class="${k < ev.stars ? 'pop' : ''}" style="animation-delay:${k * .18}s">${starSvg(k < ev.stars)}</span>`).join('')}</div>
    <p class="muted" style="font-size:12.5px">הכוכבים על החשיבה שלכם, לא על המזל</p>
    ${result}
    <div class="checks"><b style="display:block;margin:6px 2px 10px;font-size:16px">מה עשיתם טוב ומה לתקן</b>${ev.checks.map(c => `<div class="ck ${c.ok ? 'ok' : 'no'}"><div class="m">${c.ok ? '✓' : '✕'}</div><div><b>${c.term ? term(c.term, c.t) : c.t}</b><span>${c.ok ? c.good : c.bad}</span></div></div>`).join('')}
      <div class="ck ok"><div class="m" style="background:var(--card2);color:var(--text)">i</div><div><b>על המקרה</b><span>${sc.why}</span></div></div></div>
    ${alt}
    <div class="btns">${ok ? `<button class="btn primary" data-go="practice" data-arg="${(idx + 1) % SCEN.length}">למקרה הבא</button>` : `<button class="btn primary" data-go="practice" data-arg="${idx}">לנסות שוב</button>`}<button class="btn ghost" data-go="practiceHome">לכל המקרים</button></div>
    <p class="disc">תרגיל לימודי על גרף הדגמה, בלי כסף אמיתי. אין כאן המלצת השקעה.</p></div>`;
};
