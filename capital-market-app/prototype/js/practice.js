'use strict';
/* ===== practice: learn to decide, not to guess =====
   Flow: read the chart -> decide (enter or wait) -> mark support -> stop -> risk size -> target -> run.
   Entry is fixed at the market price, so nothing is a blind guess. Feedback scores the PROCESS. */
const TREND_NAME = { up: 'עולה', down: 'יורדת', side: 'אין כיוון ברור' };
const RISK_OPTS = [[.5, '0.5%'], [1, '1%'], [2, '2%'], [5, '5%']];
const STEPS = [['read', 'קריאה'], ['decide', 'החלטה'], ['support', 'תמיכה'], ['stop', 'סטופ'], ['size', 'גודל'], ['target', 'יעד']];

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
  const ch = [];
  ch.push({ t: 'קריאת הגרף', ok: st.trend === sc.trend, good: `נכון, המגמה בגרף ${TREND_NAME[sc.trend]}. זה מה שקובע אם בכלל יש תוכנית.`, bad: `המגמה בגרף הזה ${TREND_NAME[sc.trend]}. כדאי להסתכל על הנקודות הנמוכות והגבוהות: האם הן עולות, יורדות או חוזרות על עצמן?` });
  ch.push({ t: 'להיכנס או לחכות', ok: st.decision === sc.action, good: sc.action === 'wait' ? 'החלטתם לחכות, וזו ההחלטה הנכונה כאן. לא חייבים להיות בעסקה כל הזמן.' : 'זיהיתם שיש כאן סיבה אמיתית לבנות תוכנית.', bad: sc.why });
  if (st.decision === 'enter' && st.plan) {
    const pl = st.plan, rr = (pl.target - P.last) / (P.last - pl.stop), sz = sizing(P, pl);
    ch.push({ t: 'אזור תמיכה', ok: Math.abs(pl.support - P.swingLow) <= .9 * P.atr, good: 'סימנתם את התמיכה במקום שבו המחיר באמת עצר בנקודות הנמוכות האחרונות.', bad: 'התמיכה צריכה להיות במקום שבו המחיר כבר עצר וחזר למעלה. חפשו את הנקודה הנמוכה האחרונה.' });
    ch.push({ t: 'סטופ', ok: pl.stop <= P.swingLow && pl.stop >= P.swingLow - 2.5 * P.atr, good: 'הסטופ נמצא מתחת לתמיכה, עם מרווח סביר. אם המחיר מגיע אליו, התוכנית כנראה לא נכונה.', bad: pl.stop > P.swingLow ? 'הסטופ קרוב מדי: הוא נמצא מעל הנקודה הנמוכה האחרונה, ותנודה רגילה תוציא אתכם.' : 'הסטופ רחוק מדי, והפסד אפשרי גדול יותר מהצורך.' });
    ch.push({ t: 'גודל הסיכון', ok: pl.risk <= 2, good: `סיכנתם ${pl.risk}% מהתיק, כלומר עד ${money(sz.riskMoney)}. כלל אצבע לימודי הוא עד 2%.`, bad: `סיכנתם ${pl.risk}% מהתיק, כלומר עד ${money(sz.riskMoney)}. זה גדול, וכמה הפסדים ברצף יפגעו בתיק. כלל אצבע לימודי הוא עד 2%.` });
    ch.push({ t: 'יעד ויחס סיכוי וסיכון', ok: rr >= 1.5, good: `היחס הוא 1 ל-${fmt(rr, 1)}, כלומר הסיכוי גדול מהסיכון.`, bad: `היחס הוא 1 ל-${fmt(Math.max(rr, 0), 1)}. כדאי שהיעד יהיה רחוק מהכניסה לפחות פי 1.5 מהסטופ.` });
  }
  const fails = ch.filter(c => !c.ok).length;
  return { checks: ch, fails, stars: fails === 0 ? 3 : fails === 1 ? 2 : fails === 2 ? 1 : 0 };
}

/* ----- list ----- */
screens.practiceHome = () => {
  const d = A().practiceDone;
  scr.innerHTML = `<div class="anim"><div class="top"><h2>תרגול</h2><span class="pill gold">${ic.star}${A().stars}</span></div>
    <div class="card howto"><b>בתרגול לא מנחשים</b><div class="how">${['קוראים את הגרף', 'מחליטים אם בכלל להיכנס', 'בונים תוכנית: תמיכה, סטופ, גודל, יעד'].map((t, i) => `<div><i>${i + 1}</i><span>${t}</span></div>`).join('')}</div>
      <span class="muted" style="font-size:13px">הציון על התהליך ולא על המזל. לפעמים ההחלטה הנכונה היא לחכות.</span></div>
    <div style="height:14px"></div>
    ${SCEN.map((s, i) => `<button class="les" data-go="practice" data-arg="${i}"><div class="ic" style="color:var(--green)">${ic.chart}</div><div class="tx"><b>מקרה ${i + 1}</b><span>גרף הדגמה · קראו, החליטו, בנו תוכנית</span></div><span class="st" style="direction:ltr">${'★'.repeat(d[s.id] || 0)}${'☆'.repeat(3 - (d[s.id] || 0))}</span></button>`).join('')}
    <p class="demo-note">הגרפים נוצרים בקוד ואינם נתוני שוק אמיתיים. אין כאן המלצת השקעה.</p></div>`;
};

/* ----- the exercise ----- */
screens.practice = (idx = 0) => {
  idx = (+idx || 0) % SCEN.length;
  const sc = SCEN[idx], P = buildScen(sc);
  const W = 358, H = 300, AX = 46, plotW = W - AX, slot = (plotW - 8) / (P.N + P.M), bw = slot * .62;
  const all = P.candles, lo = Math.min(...all.map(c => c.l)) - 3, hi = Math.max(...all.map(c => c.h)) + 3;
  const y = (v) => 8 + (hi - v) / (hi - lo) * (H - 24), priceAt = (py) => hi - (py - 8) / (H - 24) * (hi - lo), cx = (k) => 6 + k * slot + slot / 2;
  const st = { step: 'read', trend: null, decision: null, support: null, stop: null, risk: null, target: null, hint: false, running: false, shown: P.N, mark: null };
  scr.innerHTML = `<div class="anim">
    <div class="pr-head"><button class="icon-btn" id="bk">${ic.back}</button><div class="tt"><b>מקרה ${idx + 1}</b><span>גרף הדגמה, בלי כסף אמיתי</span></div><button class="icon-btn" id="hb" style="color:var(--gold)" aria-label="רמז">${ic.bulb}</button></div>
    <div class="pbox"><div class="meta"><div><span class="hl">מחיר נוכחי</span><div class="price" id="px">${fmt(P.last)}</div></div><div class="hl" style="text-align:left">תיק תרגול ${money(START_CASH)}</div></div>
      <svg class="chart" id="ch" viewBox="0 0 ${W} ${H}"></svg></div>
    <div class="steps" id="dots"></div><div id="panel" class="panel"></div><div id="hintBox"></div></div>`;
  const svg = $('#ch');
  const el = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; };
  const txt = (x, yy, t, fill, size = 11, anchor = 'start', w = 600) => { const e = el('text', { x, y: yy, fill, 'font-size': size, 'font-weight': w, 'text-anchor': anchor, 'font-family': 'Heebo,sans-serif' }); e.textContent = t; };
  const plan = () => ({ support: st.support, stop: st.stop, target: st.target, risk: st.risk });
  function draw() {
    svg.innerHTML = '';
    const step = (hi - lo) > 40 ? 10 : 5;
    for (let v = Math.ceil(lo / step) * step; v < hi; v += step) { el('line', { x1: 0, x2: plotW, y1: y(v), y2: y(v), stroke: '#fff', 'stroke-opacity': .06, 'stroke-dasharray': '3 5' }); txt(W - 4, y(v) + 4, Math.round(v), '#5d6571', 11, 'end', 400); }
    el('rect', { x: 6 + P.N * slot, y: 0, width: plotW - 6 - P.N * slot, height: H, fill: '#fff', opacity: .03 });
    el('line', { x1: 6 + P.N * slot, x2: 6 + P.N * slot, y1: 0, y2: H, stroke: '#3a414b', 'stroke-dasharray': '2 4' });
    if (st.shown === P.N) txt(6 + P.N * slot + (plotW - 6 - P.N * slot) / 2, H / 2, 'העתיד', '#5d6571', 12, 'middle', 400);
    if (st.hint) { el('rect', { x: 0, y: y(P.swingLow + P.atr * .35), width: plotW, height: y(P.swingLow - P.atr * .6) - y(P.swingLow + P.atr * .35), fill: '#fbbf24', opacity: .13 }); txt(8, y(P.swingLow - P.atr * .6) + 13, 'הנקודות הנמוכות האחרונות', '#fbbf24', 11, 'start', 500); }
    for (let k = 0; k < st.shown; k++) { const c = P.candles[k], up = c.c >= c.o, col = up ? '#1ff0b0' : '#ff6048', x = cx(k); el('line', { x1: x, x2: x, y1: y(c.h), y2: y(c.l), stroke: col, 'stroke-width': 1.4, 'stroke-linecap': 'round' }); el('rect', { x: x - bw / 2, y: y(Math.max(c.o, c.c)), width: bw, height: Math.max(2, Math.abs(y(c.o) - y(c.c))), rx: 1.5, fill: col }); }
    const lv = [];
    if (st.decision === 'enter') lv.push(['entry', P.last, '#6aa8ff', 'כניסה (מחיר שוק)', '0']);
    if (st.support != null) lv.push(['support', st.support, '#fbbf24', 'תמיכה', '2 4']);
    if (st.stop != null) lv.push(['stop', st.stop, '#ff6048', 'סטופ', '6 4']);
    if (st.target != null) lv.push(['target', st.target, '#1fd69b', 'יעד', '6 4']);
    if (st.stop != null && st.decision === 'enter') el('rect', { x: 0, y: y(P.last), width: plotW, height: Math.max(0, y(st.stop) - y(P.last)), fill: '#ff6048', opacity: .09 });
    if (st.target != null && st.decision === 'enter') el('rect', { x: 0, y: y(st.target), width: plotW, height: Math.max(0, y(P.last) - y(st.target)), fill: '#1fd69b', opacity: .09 });
    lv.forEach(([k, v, col, label, dash]) => {
      el('line', { x1: 0, x2: plotW, y1: y(v), y2: y(v), stroke: col, 'stroke-width': 1.8, 'stroke-dasharray': dash });
      el('rect', { x: W - AX + 2, y: y(v) - 11, width: AX - 4, height: 22, rx: 8, fill: col }); txt(W - AX / 2, y(v) + 4, fmt(v, 1), k === 'stop' ? '#fff' : '#04140e', 10.5, 'middle', 700); txt(8, y(v) - 5, label, col, 11, 'start', 700);
    });
    if (st.mark) { const m = st.mark; el('circle', { cx: cx(m.at + P.N), cy: y(m.res === 'target' ? st.target : st.stop), r: 7, fill: m.res === 'target' ? '#1fd69b' : '#ff6048', stroke: '#0b0d10', 'stroke-width': 2 }); }
  }
  const tapStep = () => ['support', 'stop', 'target'].includes(st.step) && !st.running;
  function setFromEvent(e) {
    const rect = svg.getBoundingClientRect(), py = (e.clientY - rect.top) * (H / rect.height);
    let v = clamp(priceAt(py), lo + 1, hi - 1);
    const snap = (arr) => { let best = null, bd = 12; arr.forEach(p => { const d = Math.abs(y(p) - py); if (d < bd) { bd = d; best = p; } }); return best; };
    if (st.step === 'support') { const s = snap(P.candles.slice(0, P.N).map(c => c.l)); if (s != null) v = s; }
    if (st.step === 'target') { const s = snap(P.candles.slice(0, P.N).map(c => c.h)); if (s != null) v = s; }
    v = Math.round(v * 10) / 10; st[st.step] = v; draw(); readout();
  }
  let dragging = false;
  svg.addEventListener('pointerdown', (e) => { if (!tapStep()) return; dragging = true; try { svg.setPointerCapture(e.pointerId); } catch (_) { } setFromEvent(e); });
  svg.addEventListener('pointermove', (e) => { if (dragging) setFromEvent(e); });
  const end = () => { dragging = false; }; svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);

  const path = () => st.decision === 'wait' ? ['read', 'decide'] : STEPS.map(s => s[0]);
  function dots() { const p = path(), cur = p.indexOf(st.step); $('#dots').innerHTML = STEPS.filter(s => p.includes(s[0])).map((s, i) => `<span class="${i < cur ? 'done' : i === cur ? 'on' : ''}"><i>${i < cur ? '✓' : i + 1}</i>${s[1]}</span>`).join(''); }
  function nav(next, label, disabled) { return `<div class="pnav">${st.step !== 'read' ? '<button class="btn ghost small" id="pb" style="flex:none;width:84px">חזרה</button>' : ''}<button class="btn primary small" id="pn" ${disabled ? 'disabled' : ''}>${label || 'הבא'}</button></div>`; }
  function goStep(s) { st.step = s; panel(); }
  function panel() {
    dots(); const p = $('#panel'); let h = '', nextStep = null, label = '', dis = false;
    if (st.step === 'read') {
      h = `<h3>מה אתם רואים בגרף?</h3><p class="muted">הסתכלו על הנקודות הנמוכות והגבוהות. לאן הן הולכות?</p><div class="opts">${[['up', 'מגמה עולה'], ['down', 'מגמה יורדת'], ['side', 'אין כיוון ברור']].map(([k, t]) => `<button class="opt${st.trend === k ? ' sel' : ''}" data-k="${k}">${t}</button>`).join('')}</div>`; nextStep = 'decide'; dis = !st.trend;
    } else if (st.step === 'decide') {
      h = `<h3>יש כאן סיבה להיכנס לעסקת קנייה?</h3><p class="muted">גם להחליט לחכות זו החלטה. לא חייבים להיות בעסקה כל הזמן.</p><div class="opts">${[['enter', 'כן, אפשר לבנות תוכנית'], ['wait', 'לא, מחכים']].map(([k, t]) => `<button class="opt${st.decision === k ? ' sel' : ''}" data-k="${k}">${t}</button>`).join('')}</div>`; dis = !st.decision; nextStep = st.decision === 'wait' ? 'run' : 'support'; label = st.decision === 'wait' ? 'ראו מה קרה' : 'הבא';
    } else if (st.step === 'support') {
      h = `<h3>סמנו את אזור התמיכה</h3><p class="muted">לחצו על הגרף במקום שבו המחיר ירד, עצר וחזר למעלה. הסימון נצמד לנקודה נמוכה קרובה.</p><div class="ro" id="ro">${st.support != null ? 'תמיכה: <b>' + fmt(st.support) + '</b>' : 'עוד לא סומן'}</div>`; nextStep = 'stop'; dis = st.support == null;
    } else if (st.step === 'stop') {
      h = `<h3>איפה הסטופ?</h3><p class="muted">מתחת לתמיכה, עם מרווח קטן. אם המחיר מגיע לשם, התוכנית כנראה לא נכונה.</p><div class="chips"><button class="chip" id="auto">מתחת לתמיכה</button></div><div class="ro" id="ro">${st.stop != null ? 'סטופ: <b>' + fmt(st.stop) + '</b> · סיכון ליחידה: <b>' + fmt(P.last - st.stop) + '</b>' : 'לחצו על הגרף או על הכפתור'}</div>`; nextStep = 'size'; dis = st.stop == null || st.stop >= P.last;
    } else if (st.step === 'size') {
      const sz = st.risk ? sizing(P, plan()) : null;
      h = `<h3>כמה מהתיק מסכנים בעסקה?</h3><p class="muted">קודם מחליטים כמה מוכנים להפסיד, ורק אז מחשבים כמה לקנות. כלל אצבע לימודי: עד 2%.</p><div class="chips" id="rk">${RISK_OPTS.map(([v, t]) => `<button class="chip${st.risk === v ? ' on' : ''}" data-v="${v}">${t}</button>`).join('')}</div>
        <div class="ro" id="ro">${sz ? `אם הסטופ יופעל תפסידו עד <b>${money(sz.riskMoney)}</b>. כמות לקנייה: <b>${sz.qty}</b> (${fmt(sz.pct, 0)}% מהתיק)${sz.capped ? '. הכמות הוגבלה לגודל התיק' : ''}` : 'בחרו אחוז סיכון'}</div>`; nextStep = 'target'; dis = !st.risk;
    } else if (st.step === 'target') {
      const risk = P.last - st.stop;
      h = `<h3>איפה היעד?</h3><p class="muted">היעד צריך להיות רחוק מהכניסה לפחות פי 1.5 מהסטופ. אפשר ללחוץ על הגרף, או לבחור מהכפתורים.</p><div class="chips" id="tg"><button class="chip" data-t="${P.last + risk * 2}">יחס 1:2</button><button class="chip" data-t="${P.last + risk * 3}">יחס 1:3</button><button class="chip" data-t="${P.recentHigh}">הגבוה האחרון</button></div>
        <div class="ro" id="ro">${roTarget()}</div>`; nextStep = 'run'; label = 'הרץ את הגרף'; dis = st.target == null || st.target <= P.last;
    }
    p.innerHTML = h + nav(nextStep, label, dis);
    $$('.opt', p).forEach(b => b.onclick = () => { if (st.step === 'read') st.trend = b.dataset.k; else st.decision = b.dataset.k; draw(); panel(); });
    const au = $('#auto'); if (au) au.onclick = () => { const base = st.support != null ? st.support : P.swingLow; st.stop = Math.round((base - P.atr * .5) * 10) / 10; draw(); panel(); };
    const rk = $('#rk'); if (rk) rk.onclick = (e) => { const b = e.target.closest('.chip'); if (!b) return; st.risk = +b.dataset.v; panel(); };
    const tg = $('#tg'); if (tg) tg.onclick = (e) => { const b = e.target.closest('.chip'); if (!b) return; st.target = Math.round(+b.dataset.t * 10) / 10; draw(); panel(); };
    const pb = $('#pb'); if (pb) pb.onclick = () => { const q = path(), i = q.indexOf(st.step); goStep(q[Math.max(0, i - 1)]); };
    $('#pn').onclick = () => { if (nextStep === 'run') run(); else goStep(nextStep); };
  }
  function roTarget() { if (st.target == null) return 'לחצו על הגרף או על אחד הכפתורים'; const rk = P.last - st.stop, rw = st.target - P.last; return `יעד: <b>${fmt(st.target)}</b> · סיכוי <b>${fmt(rw)}</b> מול סיכון <b>${fmt(rk)}</b> · יחס <b>1:${fmt(rw / rk, 1)}</b>`; }
  function readout() { const r = $('#ro'); if (!r) return; if (st.step === 'support') r.innerHTML = 'תמיכה: <b>' + fmt(st.support) + '</b>'; else if (st.step === 'stop') r.innerHTML = 'סטופ: <b>' + fmt(st.stop) + '</b> · סיכון ליחידה: <b>' + fmt(P.last - st.stop) + '</b>'; else if (st.step === 'target') r.innerHTML = roTarget(); const n = $('#pn'); if (n) n.disabled = st.step === 'support' ? st.support == null : st.step === 'stop' ? st.stop >= P.last : st.target <= P.last; }
  $('#bk').onclick = () => go('practiceHome');
  $('#hb').onclick = () => { st.hint = !st.hint; $('#hintBox').innerHTML = st.hint ? `<div class="hint">רמז: הסתכלו על הנקודות הנמוכות בנרות האחרונים. אם המחיר עצר שם יותר מפעם אחת, זה אזור שאפשר לבסס עליו תוכנית. אם הנקודות הנמוכות נשברות, המגמה לא עולה.</div>` : ''; draw(); };

  function run() {
    st.running = true; st.step = 'run'; $('#panel').innerHTML = '<div class="ro" style="text-align:center">מריצים את הגרף...</div>'; dots();
    const fut = P.candles.slice(P.N);
    const enter = st.decision === 'enter' && st.stop != null && st.target != null;
    const sim = enter ? simulate(fut, { stop: st.stop, target: st.target }) : { res: 'none', at: fut.length - 1 };
    const timer = setInterval(() => {
      if (st.shown - P.N > sim.at) {
        clearInterval(timer); if (sim.res !== 'none') st.mark = { res: sim.res, at: sim.at }; draw();
        setTimeout(() => go('feedback', { idx, st: { trend: st.trend, decision: st.decision, plan: enter ? plan() : null }, sim }), 1100); return;
      }
      st.shown++; $('#px').textContent = fmt(P.candles[st.shown - 1].c); draw();
    }, 360);
  }
  window.__P = P; window.__st = st; window.__SC = sc;
  draw(); panel();
};

/* ----- feedback ----- */
screens.feedback = ({ idx, st, sim }) => {
  const sc = SCEN[idx], P = buildScen(sc), ev = evaluate(sc, P, st), ok = ev.fails === 0;
  const ac = A(), prev = ac.practiceDone[sc.id] || 0;
  if (ev.stars > prev) { ac.stars += ev.stars - prev; ac.practiceDone[sc.id] = ev.stars; save(); }
  let money_ = '', alt = '', title, sub;
  const pl = st.plan;
  if (pl) {
    const sz = sizing(P, pl), fut = P.candles.slice(P.N);
    const pnl = sim.res === 'target' ? sz.qty * (pl.target - P.last) : sim.res === 'stop' ? -sz.qty * (P.last - pl.stop) : sz.qty * (fut[sim.at].c - P.last);
    const outcome = { target: 'המחיר הגיע ליעד', stop: 'המחיר הגיע לסטופ', none: 'המחיר לא הגיע לא ליעד ולא לסטופ' }[sim.res];
    money_ = `<div class="card pnl"><span class="eyebrow">בגרף הזה (כסף וירטואלי)</span><div class="wbig ${chgCls(pnl)}">${pnl >= 0 ? '+' : '-'}${money(Math.abs(pnl))}</div><span class="muted" style="font-size:13px">${outcome}</span></div>`;
    const drift = (sc.drift || 0.6) * .5, res = [], rrv = (pl.target - P.last) / (P.last - pl.stop);
    for (let k = 0; k < 7; k++) res.push(simulate(altFuture(P, sc.seed * 31 + k * 17 + 5, drift), { stop: pl.stop, target: pl.target }).res);
    const w = res.filter(r => r === 'target').length, l = res.filter(r => r === 'stop').length;
    alt = `<div class="card alt"><b>אותה תוכנית על 7 עתידים אחרים</b><div class="altrow">${res.map(r => `<i class="${r}">${r === 'target' ? '✓' : r === 'stop' ? '✕' : '·'}</i>`).join('')}</div><span class="muted" style="font-size:13px;line-height:1.6">${w} ליעד, ${l} לסטופ, ${7 - w - l} בלי הכרעה. תוצאה אחת בגרף אחד לא מוכיחה כלום. מה שבודקים הוא אם התוכנית הגיונית, ולא אם הפעם יצא רווח.</span><span class="muted" style="font-size:13px;line-height:1.6;display:block;margin-top:8px">חישוב מתמטי פשוט: ביחס של 1 ל-${fmt(rrv, 1)} מספיק שבערך ${fmt(100 / (1 + rrv), 0)}% מהעסקאות יגיעו ליעד כדי לא להפסיד (בלי עמלות). אלה גרפי הדגמה בדויים.</span></div>`;
    if (ok) { title = sim.res === 'target' ? 'תוכנית מצוינת!' : sim.res === 'stop' ? 'תוכנית טובה, והפעם המחיר לא שיתף פעולה' : 'תוכנית טובה, המחיר עוד לא החליט'; sub = sim.res === 'stop' ? 'הסטופ הגביל את ההפסד לסכום שהחלטתם עליו מראש. זה בדיוק התפקיד שלו.' : 'כל חלקי התוכנית נכונים.'; }
  } else if (st.decision === 'wait') {
    money_ = `<div class="card pnl"><span class="eyebrow">מה קרה בגרף</span><div class="wbig" style="font-size:20px">${sc.action === 'wait' ? 'חסכתם עסקה בלי תוכנית' : 'לא נכנסתם לעסקה'}</div><span class="muted" style="font-size:13px">${sc.why}</span></div>`;
  }
  if (!title) { title = ok ? 'החלטה מצוינת!' : ev.stars === 2 ? 'כמעט!' : 'לא הפעם'; sub = ok ? 'כל החלקים נכונים.' : 'יש כאן משהו לתקן, וזה בסדר. הכי חשוב להבין למה.'; }
  $('#tabbar').hidden = true;
  scr.innerHTML = `${ok ? confetti() : ''}<div class="fb ${ok ? 'ok' : 'no'} anim">
    <div class="big-ic" style="color:${ok ? 'var(--green)' : 'var(--red)'}">${ok ? ic.check : ic.x}</div>
    <h1 style="font-size:24px;padding:0 10px">${title}</h1><p class="muted" style="margin:0 24px">${sub}</p>
    <div class="stars">${[0, 1, 2].map(k => `<span class="${k < ev.stars ? 'pop' : ''}" style="animation-delay:${k * .18}s">${starSvg(k < ev.stars)}</span>`).join('')}</div>
    <p class="muted" style="font-size:12.5px">הכוכבים על התהליך, לא על התוצאה</p>
    ${money_}${alt}
    <div class="checks">${ev.checks.map(c => `<div class="ck ${c.ok ? 'ok' : 'no'}"><div class="m">${c.ok ? '✓' : '✕'}</div><div><b>${c.t}</b><span>${c.ok ? c.good : c.bad}</span></div></div>`).join('')}
      <div class="ck ok"><div class="m" style="background:var(--card2);color:var(--text)">i</div><div><b>על המקרה: ${sc.name}</b><span>${sc.why}</span></div></div></div>
    <div class="btns">${ok ? `<button class="btn primary" data-go="practice" data-arg="${(idx + 1) % SCEN.length}">למקרה הבא</button>` : `<button class="btn primary" data-go="practice" data-arg="${idx}">לנסות שוב</button>`}<button class="btn ghost" data-go="practiceHome">לכל המקרים</button></div>
    <p class="disc">תרגיל לימודי על גרף הדגמה, בלי כסף אמיתי. אין כאן המלצת השקעה.</p></div>`;
};
