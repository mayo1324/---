'use strict';
/* ===== market ===== */
screens.market = () => {
  const st = { f: 'all', q: '' };
  const idx = byId('IDX100');
  scr.innerHTML = `<div class="anim"><div class="top"><h2>שוק <span class="live"></span></h2><span class="pill gold">${ic.star}${A().stars}</span></div>
    <div class="card mk-hero"><span class="eyebrow">${idx.n}</span>
      <div class="mk-row"><div><div class="mk-big gtext" data-px="${idx.id}">${fmt(idx.price)}</div><span class="${chgCls(idx.chg)}" data-chg="${idx.id}">${sgn(idx.chg)}%</span></div>${spark(idx.spark, idx.chg >= 0, 130, 56)}</div></div>
    <label class="search">${ic.search}<input id="q" placeholder="חיפוש מדד או מניה" autocomplete="off"></label>
    <div class="filters" id="flt">${[['all', 'הכול'], ['index', 'מדדים'], ['stock', 'מניות'], ['watch', 'מעקב']].map(([k, t], i) => `<button class="chip${i ? '' : ' on'}" data-f="${k}">${t}</button>`).join('')}</div>
    <div class="rows card" id="mrows" style="padding:4px 16px;margin-top:10px"></div>
    <p class="demo-note">נתוני הדגמה בדויים שנעים בזמן אמת, לא מחירים אמיתיים. אפשר ללחוץ על כל נכס ולחקור את הגרף שלו.</p></div>`;
  const list = () => {
    const w = A().watch;
    const items = ASSETS.filter(a => (st.f === 'all' || (st.f === 'watch' ? w.includes(a.id) : a.k === st.f)) && (!st.q || (a.n + a.s + a.sec).toLowerCase().includes(st.q)));
    $('#mrows').innerHTML = items.length ? items.map(assetRow).join('') : `<p class="muted" style="padding:22px 0;text-align:center">${st.f === 'watch' ? 'עוד לא הוספת נכסים למעקב. פתחו נכס ולחצו על הכוכב.' : 'לא נמצאו תוצאות'}</p>`;
  };
  list();
  $('#q').oninput = (e) => { st.q = e.target.value.trim().toLowerCase(); list(); };
  $('#flt').onclick = (e) => { const c = e.target.closest('.chip'); if (!c) return; $$('.chip', $('#flt')).forEach(x => x.classList.remove('on')); c.classList.add('on'); st.f = c.dataset.f; list(); };
  livePrices();
};

/* ===== asset detail: chart you can explore ===== */
screens.asset = (id) => {
  const a = byId(id) || ASSETS[0];
  const st = { tf: '1M', mode: 'candle', ma: false, vol: false, cross: null };
  const held = () => A().portfolio.pos[a.id];
  scr.innerHTML = `<div class="anim as">
    <div class="top"><button class="icon-btn" id="bk">${ic.back}</button><div class="as-t"><b>${a.n}</b><span>${a.s} · ${a.sec}</span></div><button class="icon-btn" id="wt" aria-label="מעקב"></button></div>
    <div class="as-price"><div class="gtext" id="pp">${fmt(a.price)}</div><div id="pc" class="chgchip"></div></div>
    <div class="tfs" id="tfs">${TF.map(t => `<button class="tf${t[0] === st.tf ? ' on' : ''}" data-tf="${t[0]}">${t[1]}</button>`).join('')}</div>
    <div class="cbox"><div class="tip" id="tip"></div><svg class="chart" id="ch"></svg>
      <div class="ctl"><div class="seg" id="seg"><button class="on" data-m="candle">נרות</button><button data-m="line">קו</button></div>
        <button class="tg" id="tma">ממוצע נע</button><button class="tg" id="tvol">נפח</button></div></div>
    <div class="stats" id="stats"></div>
    <div class="card" style="margin-top:14px"><b style="font-size:15px">על הנכס</b><p class="muted" style="font-size:14px;line-height:1.6;margin-top:6px">${a.about}</p></div>
    <p class="demo-note">גרף הדגמה שנוצר בקוד. אין כאן מחירים אמיתיים ואין המלצת השקעה.</p>
    <div class="buybar"><button class="btn sell" id="sl" ${held() ? '' : 'style="opacity:.45"'}>מכירה</button><button class="btn primary" id="by">קנייה</button></div></div>`;
  const svg = $('#ch');
  const el = (n, at, p) => { const e = document.createElementNS(NS, n); for (const k in at) e.setAttribute(k, at[k]); (p || svg).appendChild(e); return e; };
  const W = 358, H = 250, VH = 46, AX = 44;
  function stats(cs) {
    const hi = Math.max(...cs.map(c => c.h)), lo = Math.min(...cs.map(c => c.l)), o = cs[0].o, l = cs[cs.length - 1].c, ch = (l / o - 1) * 100;
    const vl = a.vol < .9 ? 'נמוכה' : a.vol < 1.4 ? 'בינונית' : 'גבוהה';
    const row = (k, v, c) => `<div><span>${k}</span><b class="${c || ''}">${v}</b></div>`;
    $('#stats').innerHTML = row('שינוי בתקופה', sgn(ch) + '%', chgCls(ch)) + row('פתיחת התקופה', fmt(o)) + row('הכי גבוה', fmt(hi)) + row('הכי נמוך', fmt(lo)) + row('תנודתיות', vl) + row('נפח ממוצע (הדגמה)', fmt(cs.reduce((s, c) => s + c.v, 0) / cs.length, 0));
  }
  function tip() {
    const cs = series(a, st.tf), i = st.cross == null ? cs.length - 1 : st.cross, c = cs[i], up = c.c >= c.o;
    $('#tip').innerHTML = `<span class="tl">${st.cross == null ? 'עכשיו' : labelOf(st.tf, i, cs.length)}</span><span>פתיחה <b>${fmt(c.o)}</b></span><span>גבוה <b>${fmt(c.h)}</b></span><span>נמוך <b>${fmt(c.l)}</b></span><span>סגירה <b class="${up ? 'up' : 'down'}">${fmt(c.c)}</b></span>`;
  }
  function draw() {
    const cs = series(a, st.tf), n = cs.length, ph = H, tot = H + (st.vol ? VH + 8 : 0);
    svg.setAttribute('viewBox', `0 0 ${W} ${tot}`); svg.innerHTML = '';
    const mx = Math.max(...cs.map(c => c.h)), mn = Math.min(...cs.map(c => c.l)), pad = (mx - mn) * .08 || 1, hi = mx + pad, lo = mn - pad;
    const y = (v) => 8 + (hi - v) / (hi - lo) * (ph - 22), pw = W - AX, slot = (pw - 8) / n, x = (i) => 4 + i * slot + slot / 2;
    const up = cs[n - 1].c >= cs[0].o, col = up ? '#1ff0b0' : '#ff6048';
    for (let k = 0; k < 5; k++) { const v = lo + (hi - lo) * k / 4, yy = y(v); el('line', { x1: 0, x2: pw, y1: yy, y2: yy, stroke: '#ffffff', 'stroke-opacity': .06, 'stroke-dasharray': '3 5' }); const t = el('text', { x: W - 2, y: yy + 4, fill: '#6b7280', 'font-size': 10.5, 'text-anchor': 'end', 'font-family': 'Heebo,sans-serif' }); t.textContent = fmt(v, v > 500 ? 0 : 1); }
    if (st.mode === 'candle') {
      const bw = Math.max(1, slot * .66);
      cs.forEach((c, i) => { const u = c.c >= c.o, cl = u ? '#1ff0b0' : '#ff6048'; el('line', { x1: x(i), x2: x(i), y1: y(c.h), y2: y(c.l), stroke: cl, 'stroke-width': Math.max(.8, Math.min(1.4, bw * .4)) }); el('rect', { x: x(i) - bw / 2, y: y(Math.max(c.o, c.c)), width: bw, height: Math.max(1.2, Math.abs(y(c.o) - y(c.c))), rx: bw > 4 ? 1.5 : 0, fill: cl }); });
    } else {
      const defs = el('defs', {}), g = el('linearGradient', { id: 'ag', x1: 0, y1: 0, x2: 0, y2: 1 }, defs); el('stop', { offset: 0, 'stop-color': col, 'stop-opacity': .32 }, g); el('stop', { offset: 1, 'stop-color': col, 'stop-opacity': 0 }, g);
      const pts = cs.map((c, i) => `${x(i).toFixed(1)},${y(c.c).toFixed(1)}`);
      el('path', { d: `M${pts.join(' L')} L${x(n - 1)},${ph - 14} L${x(0)},${ph - 14} Z`, fill: 'url(#ag)' });
      el('path', { d: `M${pts.join(' L')}`, fill: 'none', stroke: col, 'stroke-width': 2.2, 'stroke-linejoin': 'round', style: `filter:drop-shadow(0 0 5px ${col})` });
    }
    if (st.ma) { const p = n > 100 ? 50 : 10, m = sma(cs, p), d = m.map((v, i) => v == null ? '' : `${d0(i, m)}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' '); el('path', { d, fill: 'none', stroke: '#fbbf24', 'stroke-width': 1.7, 'stroke-linecap': 'round' }); }
    function d0(i, m) { return i === m.findIndex(v => v != null) ? 'M' : 'L'; }
    const last = cs[n - 1].c; el('line', { x1: 0, x2: pw, y1: y(last), y2: y(last), stroke: col, 'stroke-width': 1, 'stroke-dasharray': '2 3', 'stroke-opacity': .7 });
    el('rect', { x: W - AX + 1, y: y(last) - 10, width: AX - 2, height: 20, rx: 7, fill: col }); const lt = el('text', { x: W - AX / 2, y: y(last) + 4, fill: '#04140e', 'font-size': 10.5, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Heebo,sans-serif' }); lt.textContent = fmt(last, last > 500 ? 0 : 1);
    if (st.vol) { const mv = Math.max(...cs.map(c => c.v)); cs.forEach((c, i) => { const hh = c.v / mv * VH, u = c.c >= c.o; el('rect', { x: x(i) - Math.max(.5, slot * .33), y: ph + 8 + VH - hh, width: Math.max(1, slot * .66), height: hh, fill: u ? '#1ff0b0' : '#ff6048', opacity: .45 }); }); }
    if (st.cross != null) { const i = st.cross, c = cs[i]; el('line', { x1: x(i), x2: x(i), y1: 0, y2: tot, stroke: '#fff', 'stroke-opacity': .35, 'stroke-dasharray': '3 3' }); el('line', { x1: 0, x2: pw, y1: y(c.c), y2: y(c.c), stroke: '#fff', 'stroke-opacity': .25, 'stroke-dasharray': '3 3' }); el('circle', { cx: x(i), cy: y(c.c), r: 4.5, fill: '#fff', stroke: col, 'stroke-width': 2 }); }
    tip(); stats(cs);
  }
  function head() {
    const cs = series(a, st.tf); $('#pp').textContent = fmt(a.price);
    const ch = (cs[cs.length - 1].c / cs[0].o - 1) * 100; $('#pc').className = 'chgchip ' + chgCls(ch); $('#pc').textContent = `${sgn(ch)}% ב${TF.find(t => t[0] === st.tf)[1]}`;
    const on = A().watch.includes(a.id); $('#wt').innerHTML = on ? ic.star : ic.starO; $('#wt').style.color = on ? '#ffc94d' : '';
  }
  head(); draw();
  let down = false;
  const idxAt = (e) => { const r = svg.getBoundingClientRect(), n = series(a, st.tf).length, px = (e.clientX - r.left) / r.width * W, pw = W - AX, slot = (pw - 8) / n; return clamp(Math.floor((px - 4) / slot), 0, n - 1); };
  svg.addEventListener('pointerdown', (e) => { down = true; try { svg.setPointerCapture(e.pointerId); } catch (_) { } st.cross = idxAt(e); draw(); });
  svg.addEventListener('pointermove', (e) => { if (!down) return; const i = idxAt(e); if (i !== st.cross) { st.cross = i; draw(); } });
  const up = () => { if (!down) return; down = false; st.cross = null; draw(); };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  $('#tfs').onclick = (e) => { const b = e.target.closest('.tf'); if (!b) return; st.tf = b.dataset.tf; $$('.tf', $('#tfs')).forEach(x => x.classList.toggle('on', x === b)); head(); draw(); svg.classList.remove('swap'); void svg.getBoundingClientRect(); svg.classList.add('swap'); };
  $('#seg').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; st.mode = b.dataset.m; $$('button', $('#seg')).forEach(x => x.classList.toggle('on', x === b)); draw(); };
  $('#tma').onclick = () => { st.ma = !st.ma; $('#tma').classList.toggle('on', st.ma); draw(); };
  $('#tvol').onclick = () => { st.vol = !st.vol; $('#tvol').classList.toggle('on', st.vol); draw(); };
  $('#bk').onclick = () => go('market');
  $('#wt').onclick = () => { const w = A().watch, i = w.indexOf(a.id); if (i >= 0) { w.splice(i, 1); toast('הוסר מהמעקב'); } else { w.push(a.id); toast('נוסף למעקב'); } save(); head(); };
  $('#by').onclick = () => openTrade(a, 'buy');
  $('#sl').onclick = () => openTrade(a, 'sell');
  onTick(() => { if (down) return; head(); draw(); });
};

/* ===== virtual trade sheet ===== */
function openTrade(a, side) {
  if (!portfolioOpen()) {
    openSheet(`<div class="lockbox">${ic.lock}<h3>התיק עדיין נעול</h3><p class="muted">אפשר לסחור בכסף וירטואלי אחרי שמסיימים את כל ${LESSONS.length} השיעורים. בינתיים אפשר לחקור את הגרף כמה שרוצים.</p>
      <button class="btn primary" data-go="lessons">להמשך השיעורים</button><button class="btn ghost" style="margin-top:10px" data-close="1">סגירה</button></div>`);
    return;
  }
  const ac = A(), P = ac.portfolio, pos = P.pos[a.id];
  if (side === 'sell' && !pos) { toast('אין לך פוזיציה בנכס הזה'); return; }
  if (side === 'buy') {
    const st = { amt: Math.min(500, Math.floor(P.cash)), stop: 0, tgt: 0 };
    const eq = equity(ac);
    const render = () => {
      const qty = st.amt / a.price, share = st.amt / eq * 100, risk = st.stop ? st.amt * st.stop / 100 : 0;
      const warns = []; if (share > 25) warns.push(`זה ${fmt(share, 0)}% מהתיק בנכס אחד. ריכוז גבוה מגדיל סיכון.`); if (!st.stop) warns.push('בלי סטופ ההפסד פתוח. כדאי להחליט מראש עד איפה מוכנים להפסיד.');
      $('#tsheet').innerHTML = `<h3>קנייה: ${a.n}</h3><p class="muted" style="font-size:13px">מחיר ${fmt(a.price)} · כסף פנוי ${money(P.cash)} · כסף וירטואלי</p>
        <label class="lbl" for="amt">כמה להשקיע: <b id="av">${money(st.amt)}</b></label>
        <input id="amt" type="range" min="50" max="${Math.max(50, Math.floor(P.cash))}" step="50" value="${st.amt}" ${P.cash < 50 ? 'disabled' : ''}>
        <div class="sumr"><span>כמות</span><b>${fmt(qty, 2)}</b><span>חלק מהתיק</span><b>${fmt(share, 0)}%</b></div>
        <label class="lbl">סטופ (יציאה אוטומטית בהפסד)</label>
        <div class="chips" data-k="stop">${[[0, 'ללא'], [3, '3%-'], [5, '5%-'], [10, '10%-']].map(([v, t]) => `<button class="chip${st.stop === v ? ' on' : ''}" data-v="${v}">${t}</button>`).join('')}</div>
        <label class="lbl">יעד (יציאה אוטומטית ברווח)</label>
        <div class="chips" data-k="tgt">${[[0, 'ללא'], [5, '5%+'], [10, '10%+'], [20, '20%+']].map(([v, t]) => `<button class="chip${st.tgt === v ? ' on' : ''}" data-v="${v}">${t}</button>`).join('')}</div>
        ${st.stop ? `<div class="info">אם הסטופ יופעל, ההפסד יהיה בערך ${money(risk)} (${fmt(risk / eq * 100, 1)}% מהתיק).</div>` : ''}
        ${warns.map(w => `<div class="hint">${w}</div>`).join('')}
        <button class="btn primary" id="ok" style="margin-top:14px" ${P.cash < 50 ? 'disabled' : ''}>אישור קנייה</button><button class="btn ghost" data-close="1" style="margin-top:8px">ביטול</button>`;
      $('#amt').oninput = (e) => { st.amt = +e.target.value; $('#av').textContent = money(st.amt); renderSoft(); };
      $$('.chips', $('#tsheet')).forEach(g => g.onclick = (e) => { const b = e.target.closest('.chip'); if (!b) return; st[g.dataset.k] = +b.dataset.v; render(); });
      $('#ok').onclick = () => {
        const q = st.amt / a.price, ex = P.pos[a.id];
        const np = ex ? { qty: ex.qty + q, avg: (ex.qty * ex.avg + st.amt) / (ex.qty + q) } : { qty: q, avg: a.price };
        np.stop = st.stop ? a.price * (1 - st.stop / 100) : (ex && ex.stop) || 0; np.target = st.tgt ? a.price * (1 + st.tgt / 100) : (ex && ex.target) || 0;
        P.pos[a.id] = np; P.cash -= st.amt; P.hist.unshift({ t: Date.now(), type: 'buy', id: a.id, qty: q, price: a.price, amt: st.amt }); P.hist.length = Math.min(P.hist.length, 40);
        P.eq.push(equity(ac)); save(); closeSheet(); toast(`קנית ${fmt(q, 2)} של ${a.s} (וירטואלי)`); go('asset', a.id);
      };
    };
    const renderSoft = () => { const qty = st.amt / a.price, share = st.amt / eq * 100, sm = $('.sumr', $('#tsheet')); sm.innerHTML = `<span>כמות</span><b>${fmt(qty, 2)}</b><span>חלק מהתיק</span><b>${fmt(share, 0)}%</b>`; };
    openSheet('<div id="tsheet"></div>'); render();
  } else {
    const st = { pct: 100 };
    const render = () => {
      const q = pos.qty * st.pct / 100, g = q * (a.price - pos.avg);
      $('#tsheet').innerHTML = `<h3>מכירה: ${a.n}</h3><p class="muted" style="font-size:13px">יש לך ${fmt(pos.qty, 2)} · מחיר קנייה ממוצע ${fmt(pos.avg)} · מחיר עכשיו ${fmt(a.price)}</p>
        <label class="lbl">כמה למכור?</label>
        <div class="chips">${[25, 50, 100].map(v => `<button class="chip${st.pct === v ? ' on' : ''}" data-v="${v}">${v}%</button>`).join('')}</div>
        <div class="info" style="margin-top:14px">מוכרים ${fmt(q, 2)} בערך ${money(q * a.price)}. ${g >= 0 ? 'רווח' : 'הפסד'} של <b class="${chgCls(g)}">${money(Math.abs(g), 2)}</b>.</div>
        <button class="btn sell" id="ok" style="margin-top:14px">אישור מכירה</button><button class="btn ghost" data-close="1" style="margin-top:8px">ביטול</button>`;
      $$('.chip', $('#tsheet')).forEach(b => b.onclick = () => { st.pct = +b.dataset.v; render(); });
      $('#ok').onclick = () => { const gg = sellPos(ac, a.id, pos.qty * st.pct / 100, ''); P.eq.push(equity(ac)); save(); closeSheet(); toast(`נמכר. ${gg >= 0 ? 'רווח' : 'הפסד'} ${money(Math.abs(gg), 2)} (וירטואלי)`); go('asset', a.id); };
    };
    openSheet('<div id="tsheet"></div>'); render();
  }
}

/* ===== portfolio ===== */
screens.portfolio = () => {
  const ac = A(), P = ac.portfolio;
  if (!portfolioOpen()) {
    const done = ac.lessonsDone.length;
    scr.innerHTML = `<div class="anim"><div class="top"><h2>התיק שלי</h2><span></span></div>
      <div class="lockhero"><div class="lk-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="#262b33" stroke-width="9"/><circle cx="60" cy="60" r="52" fill="none" stroke="#1ff0b0" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(done / LESSONS.length * 327).toFixed(0)} 327" transform="rotate(-90 60 60)" style="filter:drop-shadow(0 0 6px #1ff0b0)"/></svg><div class="lk-in">${ic.lock}<b>${done}/${LESSONS.length}</b></div></div>
        <h1 style="font-size:24px;margin-top:18px">התיק עדיין נעול</h1>
        <p class="muted" style="margin:8px 10px 0;line-height:1.6">מסיימים את כל השיעורים ומקבלים תיק וירטואלי של ${money(START_CASH)} לתרגול. אין כסף אמיתי.</p></div>
      <div class="card prev"><span class="eyebrow">ככה זה ייראה</span><div class="wbig gtext" style="filter:blur(5px)">${money(START_CASH)}</div><div class="bar" style="margin-top:12px;filter:blur(3px)"><i style="width:40%"></i></div></div>
      <div style="height:16px"></div><button class="btn primary" data-go="${done < LESSONS.length ? 'lessons' : 'home'}">להמשך השיעורים</button>
      <p class="demo-note" style="text-align:center">לבדיקת אב הטיפוס אפשר לפתוח את התיק מראש בפרופיל.</p></div>`;
    return;
  }
  const eq0 = equity(ac), pl0 = eq0 - START_CASH;
  const posList = Object.entries(P.pos);
  scr.innerHTML = `<div class="anim"><div class="top"><h2>התיק שלי <span class="live"></span></h2><span class="vbadge">כסף וירטואלי</span></div>
    <div class="card pf-hero"><span class="eyebrow">שווי התיק</span><div class="wbig gtext" id="eqv">${money(eq0, 2)}</div>
      <div class="pf-row"><span id="eqp" class="chgchip ${chgCls(pl0)}">${sgn(pl0 / START_CASH * 100)}%</span><span id="eqs" class="muted" style="font-size:13px"><bdi dir="ltr">${sgn(pl0, 2)} ₪</bdi> מההתחלה</span></div>
      <svg class="chart eqc" id="eqc" viewBox="0 0 330 90"></svg></div>
    <div class="mini"><div class="card"><span class="eyebrow">כסף פנוי</span><div class="mbig" id="cash">${money(P.cash)}</div></div><div class="card"><span class="eyebrow">מושקע</span><div class="mbig" id="inv">${money(eq0 - P.cash)}</div></div></div>
    <div class="sec"><h3>פיזור התיק</h3></div><div class="card"><div class="alloc" id="alloc"></div><div class="legend" id="legend"></div></div>
    <div class="sec"><h3>פוזיציות</h3><button class="link" data-go="market">לחקור עוד</button></div>
    <div id="poss"></div>
    <div class="sec"><h3>היסטוריית עסקאות</h3></div><div class="card" id="hist" style="padding:4px 16px"></div>
    <div style="height:16px"></div><button class="btn ghost" id="rs">איפוס התיק ל-${money(START_CASH)}</button>
    <p class="disc">כל הכסף והמחירים כאן וירטואליים ובדויים, לצורך תרגול בלבד. אין כאן המלצת השקעה.</p></div>`;
  const colOf = (id) => id === 'cash' ? '#64748b' : byId(id).col;
  function paint(first) {
    const eq = equity(ac), pl = eq - START_CASH;
    $('#eqv').textContent = money(eq, 2); const p = $('#eqp'); p.textContent = sgn(pl / START_CASH * 100) + '%'; p.className = 'chgchip ' + chgCls(pl); $('#eqs').innerHTML = `<bdi dir="ltr">${sgn(pl, 2)} ₪</bdi> מההתחלה`;
    $('#cash').textContent = money(P.cash); $('#inv').textContent = money(eq - P.cash);
    const e = P.eq.length > 1 ? P.eq : [START_CASH, START_CASH]; const mn = Math.min(...e), mx = Math.max(...e), up = e[e.length - 1] >= e[0];
    const rng_ = (mx - mn) || 1, pts = e.map((v, i) => [i / (e.length - 1) * 330, 8 + (1 - (v - mn) / rng_) * 70]);
    const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' '), c = up ? '#1ff0b0' : '#ff6048';
    $('#eqc').innerHTML = `<defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><path d="${d} L330,90 L0,90 Z" fill="url(#eg)"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linejoin="round" style="filter:drop-shadow(0 0 5px ${c})"/><circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="4" fill="#fff" stroke="${c}" stroke-width="2"/>`;
    const parts = [['cash', P.cash], ...Object.entries(P.pos).map(([id, x]) => [id, x.qty * byId(id).price])];
    $('#alloc').innerHTML = parts.map(([id, v]) => `<i style="width:${(v / eq * 100).toFixed(2)}%;background:${colOf(id)}"></i>`).join('');
    $('#legend').innerHTML = parts.map(([id, v]) => `<span><i style="background:${colOf(id)}"></i>${id === 'cash' ? 'מזומן' : byId(id).s} ${fmt(v / eq * 100, 0)}%</span>`).join('');
    const list = Object.entries(P.pos);
    $('#poss').innerHTML = list.length ? list.map(([id, x]) => { const a = byId(id), v = x.qty * a.price, g = x.qty * (a.price - x.avg), gp = (a.price / x.avg - 1) * 100; return `<button class="les pos" data-go="asset" data-arg="${id}"><div class="logo" style="background:${a.col}">${a.s.slice(0, 2)}</div><div class="tx"><b>${a.n}</b><span><bdi dir="ltr">${fmt(x.qty, 2)}</bdi> יחידות · ${x.stop ? 'סטופ <bdi dir="ltr">' + fmt(x.stop) + '</bdi>' : 'בלי סטופ'}${x.target ? ' · יעד <bdi dir="ltr">' + fmt(x.target) + '</bdi>' : ''}</span></div><div class="px"><b>${money(v)}</b><span class="${chgCls(g)}">${sgn(gp)}%</span></div></button>`; }).join('')
      : `<div class="card empty">${ic.wallet}<b>עוד אין פוזיציות</b><span class="muted">בחרו נכס בשוק, חקרו את הגרף ובנו תוכנית לפני שקונים.</span><button class="btn primary small" data-go="market" style="margin-top:12px;width:auto;padding:0 22px">לשוק</button></div>`;
    if (first) $('#hist').innerHTML = P.hist.length ? P.hist.slice(0, 8).map(h => { const a = byId(h.id); return `<div class="hrow"><div><b>${h.type === 'buy' ? 'קנייה' : 'מכירה'} · ${a.s}</b><span>${fmt(h.qty, 2)} ב-${fmt(h.price)}${h.why ? ' · ' + h.why : ''}</span></div><b class="${h.type === 'sell' ? chgCls(h.pnl) : ''}">${h.type === 'sell' ? sgn(h.pnl, 2) + ' ₪' : money(h.amt)}</b></div>`; }).join('') : '<p class="muted" style="padding:18px 0;text-align:center">עוד לא בוצעו עסקאות</p>';
  }
  paint(true);
  onTick(() => paint(false));
  let sure = false;
  $('#rs').onclick = () => { if (!sure) { sure = true; $('#rs').textContent = 'בטוח? לחצו שוב לאיפוס'; return; } ac.portfolio = { cash: START_CASH, pos: {}, hist: [], eq: [START_CASH, START_CASH] }; save(); toast('התיק אופס'); go('portfolio'); };
};
