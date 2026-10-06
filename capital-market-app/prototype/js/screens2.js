'use strict';
/* ===== market ===== */
screens.market = () => {
  const st = { f: 'all', q: '' };
  const idx = byId('IDX100');
  scr.innerHTML = `<div class="anim"><div class="top"><h2>שוק <span class="live"></span></h2><span class="pill gold">${ic.star}${A().stars}</span></div>
    <div class="card mk-hero"><span class="eyebrow">${idx.n}</span>
      <div class="mk-row"><div><div class="mk-big gtext" data-px="${idx.id}">${fmt(idx.price)}</div><span class="${chgCls(idx.chg)}" data-chg="${idx.id}">${sgn(idx.chg)}%</span></div>${spark(idx.spark, idx.chg >= 0, 130, 56)}</div></div>
    ${learn(['index', 'share', 'exchange'])}
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
  const st = { tf: '1M', mode: 'candle', ma: false, vol: false, cross: null, tool: '', tmp: null };
  const dkey = () => a.id + '|' + st.tf, lines = () => ((A().draws = A().draws || {})[dkey()] = (A().draws || {})[dkey()] || []);
  const held = () => A().portfolio.pos[a.id];
  scr.innerHTML = `<div class="anim as">
    <div class="top"><button class="icon-btn" id="bk">${ic.back}</button><div class="as-t"><b>${a.n}</b><span>${a.s} · ${a.sec}</span></div><button class="icon-btn" id="wt" aria-label="מעקב"></button></div>
    <div class="as-price"><div class="gtext" id="pp">${fmt(a.price)}</div><div id="pc" class="chgchip"></div></div>
    <div class="tfs" id="tfs">${TF.map(t => `<button class="tf${t[0] === st.tf ? ' on' : ''}" data-tf="${t[0]}">${t[1]}</button>`).join('')}</div>
    <div class="cbox"><div class="tip" id="tip"></div><svg class="chart" id="ch"></svg>
      <div class="ctl"><button class="toolsbtn" id="tools"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20l9-9M13 11l3-3 4 4-3 3zM4 20l3-1 9-9"/></svg>כלי ניתוח</button></div></div>
    <div id="modebar"></div>
    <div class="insight" id="dh" hidden></div>
    <div id="poscard"></div>
    <div class="kpis" id="kpis"></div>
    <button class="morebtn" id="more">עוד נתונים ומידע על הנכס</button>
    <div id="moreBox" hidden><div class="stats" id="stats"></div><div class="card" style="margin-top:12px"><b style="font-size:15px">על הנכס</b><p class="muted" style="font-size:14px;line-height:1.6;margin-top:6px">${a.about}</p></div>${learn(['volatility', 'candle'])}<p class="demo-note">גרף הדגמה שנוצר בקוד. אין כאן מחירים אמיתיים ואין המלצת השקעה.</p></div>
    <div class="buybar"><button class="btn sell" id="sl" ${held() ? '' : 'style="opacity:.45"'}>מכירה</button><button class="btn primary" id="by">קנייה</button></div></div>`;
  const svg = $('#ch');
  const el = (n, at, p) => { const e = document.createElementNS(NS, n); for (const k in at) e.setAttribute(k, at[k]); (p || svg).appendChild(e); return e; };
  const W = 358, H = 250, VH = 46, AX = 44;
  function stats(cs) {
    const hi = Math.max(...cs.map(c => c.h)), lo = Math.min(...cs.map(c => c.l)), o = cs[0].o, l = cs[cs.length - 1].c, ch = (l / o - 1) * 100;
    const vl = a.vol < .9 ? 'נמוכה' : a.vol < 1.4 ? 'בינונית' : 'גבוהה';
    const row = (k, v, c) => `<div><span>${k}</span><b class="${c || ''}">${v}</b></div>`;
    $('#kpis').innerHTML = row('שינוי בתקופה', sgn(ch) + '%', chgCls(ch)) + row('הכי גבוה', fmt(hi)) + row('הכי נמוך', fmt(lo));
    $('#stats').innerHTML = row('פתיחת התקופה', fmt(o)) + row(term('volatility'), vl) + row('נפח ממוצע (הדגמה)', fmt(cs.reduce((s, c) => s + c.v, 0) / cs.length, 0));
  }
  function tip() {
    const cs = series(a, st.tf), i = st.cross == null ? cs.length - 1 : st.cross, c = cs[i], up = c.c >= c.o;
    $('#tip').innerHTML = `<span class="tl">${st.cross == null ? 'עכשיו' : labelOf(st.tf, i, cs.length)}</span><span>פתיחה <b>${fmt(c.o)}</b></span><span>גבוה <b>${fmt(c.h)}</b></span><span>נמוך <b>${fmt(c.l)}</b></span><span>סגירה <b class="${up ? 'up' : 'down'}">${fmt(c.c)}</b></span>`;
  }
  function draw() {
    const cs = series(a, st.tf), n = cs.length, ph = H, tot = H + (st.vol ? VH + 8 : 0);
    svg.setAttribute('viewBox', `0 0 ${W} ${tot}`); svg.innerHTML = '';
    const pos = held(), lv = pos ? [pos.avg, pos.stop, pos.target].filter(Boolean) : [], mx = Math.max(...cs.map(c => c.h), ...lv), mn = Math.min(...cs.map(c => c.l), ...lv), pad = (mx - mn) * .08 || 1, hi = mx + pad, lo = mn - pad;
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
    /* the learner's open position: entry, stop and target */
    if (pos) {
      const L2 = [['avg', pos.avg, '#6aa8ff', 'כניסה', '0'], ['stop', pos.stop, '#ff6048', 'סטופ', '6 4'], ['target', pos.target, '#1fd69b', 'יעד', '6 4']].filter(l => l[1]);
      if (pos.stop) el('rect', { x: 0, y: y(pos.avg), width: pw, height: Math.max(0, y(pos.stop) - y(pos.avg)), fill: '#ff6048', opacity: .1 });
      if (pos.target) el('rect', { x: 0, y: y(pos.target), width: pw, height: Math.max(0, y(pos.avg) - y(pos.target)), fill: '#1fd69b', opacity: .1 });
      L2.forEach(([k, v, col, label, dsh]) => {
        el('line', { x1: 0, x2: pw, y1: y(v), y2: y(v), stroke: col, 'stroke-width': 1.8, 'stroke-dasharray': dsh });
        el('rect', { x: W - AX + 1, y: y(v) - 10, width: AX - 2, height: 20, rx: 7, fill: col });
        const t = el('text', { x: W - AX / 2, y: y(v) + 4, fill: k === 'stop' ? '#fff' : '#04140e', 'font-size': 10, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Heebo,sans-serif' }); t.textContent = fmt(v, v > 500 ? 0 : 1);
        const t2 = el('text', { x: 6, y: y(v) - 5, fill: col, 'font-size': 11, 'font-weight': 700, 'font-family': 'Heebo,sans-serif' }); t2.textContent = label;
      });
    }
    /* learner drawings */
    st.view = { x, y, n, hi, lo, pw, ph, slot };
    const all = lines().concat(st.tmp ? [st.tmp] : []);
    all.forEach(l => {
      if (l.t === 'h') { el('line', { x1: 0, x2: pw, y1: y(l.p), y2: y(l.p), stroke: '#fbbf24', 'stroke-width': 1.6, 'stroke-dasharray': '6 4' }); el('rect', { x: W - AX + 1, y: y(l.p) - 9, width: AX - 2, height: 18, rx: 6, fill: '#fbbf24' }); const t = el('text', { x: W - AX / 2, y: y(l.p) + 4, fill: '#1a1204', 'font-size': 10, 'font-weight': 700, 'text-anchor': 'middle', 'font-family': 'Heebo,sans-serif' }); t.textContent = fmt(l.p, l.p > 500 ? 0 : 1); }
      else if (l.i2 !== l.i1) { const m = (l.p2 - l.p1) / (l.i2 - l.i1), yAt = (i) => y(l.p1 + m * (i - l.i1)), iEnd = n - 1 + Math.round((pw - x(n - 1)) / slot); el('line', { x1: x(l.i1), y1: yAt(l.i1), x2: x(l.i2), y2: yAt(l.i2), stroke: '#fbbf24', 'stroke-width': 2.4, 'stroke-linecap': 'round' }); el('line', { x1: x(l.i2), y1: yAt(l.i2), x2: x(iEnd), y2: yAt(iEnd), stroke: '#fbbf24', 'stroke-width': 1.5, 'stroke-dasharray': '5 5', opacity: .65 }); [l.i1, l.i2].forEach(i => el('circle', { cx: x(i), cy: yAt(i), r: 4, fill: '#fbbf24', stroke: '#0b0d10', 'stroke-width': 2 })); }
    });
    if (st.cross != null) { const i = st.cross, c = cs[i]; el('line', { x1: x(i), x2: x(i), y1: 0, y2: tot, stroke: '#fff', 'stroke-opacity': .35, 'stroke-dasharray': '3 3' }); el('line', { x1: 0, x2: pw, y1: y(c.c), y2: y(c.c), stroke: '#fff', 'stroke-opacity': .25, 'stroke-dasharray': '3 3' }); el('circle', { cx: x(i), cy: y(c.c), r: 4.5, fill: '#fff', stroke: col, 'stroke-width': 2 }); }
    tip(); stats(cs); dhint();
  }
  function head() {
    const cs = series(a, st.tf); $('#pp').textContent = fmt(a.price);
    const ch = (cs[cs.length - 1].c / cs[0].o - 1) * 100; $('#pc').className = 'chgchip ' + chgCls(ch); $('#pc').textContent = `${sgn(ch)}% ב${TF.find(t => t[0] === st.tf)[1]}`;
    posCard();
    const on = A().watch.includes(a.id); $('#wt').innerHTML = on ? ic.star : ic.starO; $('#wt').style.color = on ? '#ffc94d' : '';
  }
  /* compact strip; the full position details live in a sheet so the page stays calm */
  function posCard() {
    const box = $('#poscard'); if (!box) return; const pos = held();
    if (!pos) { box.innerHTML = ''; return; }
    const g = pos.qty * (a.price - pos.avg), gp = (a.price / pos.avg - 1) * 100;
    box.innerHTML = `<button class="posstrip" id="ps"><div class="l"><span>הפוזיציה שלך</span><b class="${chgCls(g)}">${g >= 0 ? '+' : '-'}${money(Math.abs(g), 2)} (${sgn(gp)}%)</b></div><div class="lv"><em class="s">סטופ ${pos.stop ? fmt(pos.stop) : 'אין'}</em><em class="t">יעד ${pos.target ? fmt(pos.target) : 'אין'}</em></div>${ic.back}</button>`;
    $('#ps').onclick = posSheet;
  }
  function posSheet() {
    const pos = held(); if (!pos) return;
    const v = pos.qty * a.price, g = pos.qty * (a.price - pos.avg), gp = (a.price / pos.avg - 1) * 100;
    const sd = pos.stop ? (a.price - pos.stop) / a.price * 100 : null, td = pos.target ? (pos.target / a.price - 1) * 100 : null;
    openSheet(`<h3>הפוזיציה שלך ב${a.n}</h3>
      <div class="pgrid" style="margin-top:12px"><div><span>כמות</span><b>${fmt(pos.qty, 2)}</b></div><div><span>מחיר כניסה</span><b>${fmt(pos.avg)}</b></div><div><span>שווי עכשיו</span><b>${money(v)}</b></div><div><span>רווח או הפסד</span><b class="${chgCls(g)}">${g >= 0 ? '+' : '-'}${money(Math.abs(g), 2)} (${sgn(gp)}%)</b></div></div>
      <div class="plv"><div class="pl s"><i></i><span>${term('stop')}</span><b>${pos.stop ? fmt(pos.stop) : 'לא נקבע'}</b><em>${sd != null ? 'עוד ' + fmt(sd, 1) + '% מתחת למחיר' : 'ההפסד פתוח'}</em></div>
      <div class="pl t"><i></i><span>${term('target')}</span><b>${pos.target ? fmt(pos.target) : 'לא נקבע'}</b><em>${td != null ? 'עוד ' + fmt(td, 1) + '% מעל המחיר' : ''}</em></div></div>
      <div class="chips"><button class="chip" data-a="pstop">${pos.stop ? 'שנה סטופ' : 'קבע סטופ'}</button><button class="chip" data-a="ptgt">${pos.target ? 'שנה יעד' : 'קבע יעד'}</button>${pos.stop ? '<button class="chip" data-a="xstop">הסר סטופ</button>' : ''}${pos.target ? '<button class="chip" data-a="xtgt">הסר יעד</button>' : ''}</div>
      <button class="btn ghost small" data-close="1" style="margin-top:14px">סגירה</button>`);
    $$('#sheet [data-a]').forEach(b => b.onclick = () => {
      const k = b.dataset.a;
      if (k === 'xstop') { pos.stop = 0; save(); toast('הסטופ הוסר'); closeSheet(); posCard(); draw(); return; }
      if (k === 'xtgt') { pos.target = 0; save(); toast('היעד הוסר'); closeSheet(); posCard(); draw(); return; }
      closeSheet(); setTool(k);
    });
  }
  /* analysis tools sheet: chart type, indicators and drawing, so the main screen stays clean */
  function openTools() {
    openSheet(`<h3>כלי ניתוח</h3>
      <label class="lbl">סוג גרף</label><div class="seg" id="seg">${[['candle', 'נרות'], ['line', 'קו']].map(([k, t]) => `<button class="${st.mode === k ? 'on' : ''}" data-m="${k}">${t}</button>`).join('')}</div>
      <label class="lbl">להוסיף לגרף</label><div class="chips"><button class="chip${st.ma ? ' on' : ''}" id="tma">ממוצע נע</button><button class="chip${st.vol ? ' on' : ''}" id="tvol">נפח</button><button class="qm" data-term="ma" aria-label="מה זה ממוצע נע">?</button><button class="qm" data-term="volume" aria-label="מה זה נפח">?</button></div>
      <label class="lbl">לצייר על הגרף</label><div class="drawgrid">${[['trend', 'קו מגמה', 'גוררים בין שתי נקודות'], ['h', 'קו אופקי', 'תמיכה או התנגדות'], ['erase', 'מחיקה', 'נוגעים ליד קו']].map(([k, t, d]) => `<button class="dg" data-t="${k}"><b>${t}</b><span>${d}</span></button>`).join('')}</div>
      <p class="muted" style="font-size:12.5px;margin-top:10px">הציורים נשמרים לכל נכס ולכל טווח זמן.</p>
      ${learn(['trendline', 'support', 'resistance'])}
      <button class="btn primary small" data-close="1" style="margin-top:14px">סיום</button>`);
    const q = (x) => $(x, $('#sheet'));
    $$('#seg button', $('#sheet')).forEach(b => b.onclick = () => { st.mode = b.dataset.m; $$('#seg button', $('#sheet')).forEach(x => x.classList.toggle('on', x === b)); draw(); });
    q('#tma').onclick = (e) => { st.ma = !st.ma; e.currentTarget.classList.toggle('on', st.ma); draw(); };
    q('#tvol').onclick = (e) => { st.vol = !st.vol; e.currentTarget.classList.toggle('on', st.vol); draw(); };
    $$('.dg', $('#sheet')).forEach(b => b.onclick = () => { closeSheet(); setTool(b.dataset.t); });
  }
  const MODE = { trend: ['קו מגמה', 'גררו על הגרף מנקודה לנקודה'], h: ['קו אופקי', 'לחצו על הגרף במחיר הרצוי'], erase: ['מחיקה', 'לחצו ליד קו כדי למחוק'], pstop: ['קביעת סטופ', 'לחצו על הגרף מתחת למחיר עכשיו'], ptgt: ['קביעת יעד', 'לחצו על הגרף מעל המחיר עכשיו'] };
  function setTool(t) {
    st.tool = t; svg.classList.toggle('drawing', !!t);
    const mb = $('#modebar');
    if (!t) mb.innerHTML = '';
    else { mb.innerHTML = `<div class="modebarin"><div><b>${MODE[t][0]}</b><span>${MODE[t][1]}</span></div><button id="mend">סיום</button></div>`; $('#mend').onclick = () => setTool(''); }
    dhint();
  }
  function dhint() {
    const h = $('#dh'); if (!h) return; const cs = series(a, st.tf), last = cs[cs.length - 1].c, L = lines();
    const tl = [...L].reverse().find(l => l.t === 'trend'), hl = [...L].reverse().find(l => l.t === 'h'); let note = '';
    if (!st.tool && tl) { const m = (tl.p2 - tl.p1) / (tl.i2 - tl.i1), at = tl.p1 + m * (cs.length - 1 - tl.i1); note = `קו המגמה ${m > 0 ? 'עולה' : 'יורד'}. המחיר עכשיו ${last >= at ? 'מעל הקו' : 'מתחת לקו'} (${fmt(Math.abs(last / at - 1) * 100, 1)}%). זו עדיין תצפית, לא תחזית.`; }
    else if (!st.tool && hl) note = `המחיר עכשיו ${last >= hl.p ? 'מעל' : 'מתחת'} לקו האופקי ב-${fmt(Math.abs(last / hl.p - 1) * 100, 1)}%.`;
    h.hidden = !note; h.textContent = note;
  }
  function coord(e) { const r = svg.getBoundingClientRect(), v = st.view, tot = +svg.getAttribute('viewBox').split(' ')[3], px = (e.clientX - r.left) / r.width * W, py = (e.clientY - r.top) / r.height * tot; return { i: clamp(Math.round((px - 4 - v.slot / 2) / v.slot), 0, v.n - 1), p: v.hi - (py - 8) / (v.ph - 22) * (v.hi - v.lo), px, py }; }
  function distLine(l, px, py) { const v = st.view; if (l.t === 'h') return Math.abs(v.y(l.p) - py); const m = (l.p2 - l.p1) / (l.i2 - l.i1), yy = v.y(l.p1 + m * ((px - 4 - v.slot / 2) / v.slot - l.i1)); return Math.abs(yy - py); }
  head(); draw();
  let down = false;
  const idxAt = (e) => { const r = svg.getBoundingClientRect(), n = series(a, st.tf).length, px = (e.clientX - r.left) / r.width * W, pw = W - AX, slot = (pw - 8) / n; return clamp(Math.floor((px - 4) / slot), 0, n - 1); };
  svg.addEventListener('pointerdown', (e) => {
    down = true; try { svg.setPointerCapture(e.pointerId); } catch (_) { }
    if (st.tool === 'pstop' || st.tool === 'ptgt') { const c = coord(e), pos = held(), pr = Math.round(c.p * 100) / 100;
      if (pos) { if (st.tool === 'pstop') { if (pr >= a.price) toast('הסטופ צריך להיות מתחת למחיר עכשיו'); else { pos.stop = pr; save(); toast('הסטופ נקבע ב-' + fmt(pr)); st.tool = ''; } } else { if (pr <= a.price) toast('היעד צריך להיות מעל המחיר עכשיו'); else { pos.target = pr; save(); toast('היעד נקבע ב-' + fmt(pr)); st.tool = ''; } } }
      setTool(st.tool); posCard(); draw(); return; }
    if (st.tool === 'trend') { const c = coord(e); st.tmp = { t: 'trend', i1: c.i, p1: c.p, i2: c.i, p2: c.p }; draw(); return; }
    if (st.tool === 'h') { const c = coord(e); st.tmp = { t: 'h', p: c.p }; draw(); return; }
    if (st.tool === 'erase') { const c = coord(e), L = lines(); let bi = -1, bd = 18; L.forEach((l, k) => { const d = distLine(l, c.px, c.py); if (d < bd) { bd = d; bi = k; } }); if (bi >= 0) { L.splice(bi, 1); save(); toast('הקו נמחק'); } draw(); return; }
    st.cross = idxAt(e); draw();
  });
  svg.addEventListener('pointermove', (e) => { if (!down) return;
    if (st.tool === 'trend' && st.tmp) { const c = coord(e); st.tmp.i2 = c.i; st.tmp.p2 = c.p; draw(); return; }
    if (st.tool === 'h' && st.tmp) { st.tmp.p = coord(e).p; draw(); return; }
    if (st.tool) return;
    const i = idxAt(e); if (i !== st.cross) { st.cross = i; draw(); } });
  const up = () => { if (!down) return; down = false; if (st.tool === 'trend' && st.tmp) { const t = st.tmp; st.tmp = null; if (Math.abs(t.i2 - t.i1) >= 3) { if (t.i2 < t.i1) Object.assign(t, { i1: t.i2, p1: t.p2, i2: t.i1, p2: t.p1 }); lines().push(t); save(); } else toast('מתחו קו ארוך יותר'); }
    else if (st.tool === 'h' && st.tmp) { lines().push(st.tmp); st.tmp = null; save(); }
    st.cross = null; draw(); };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  $('#tfs').onclick = (e) => { const b = e.target.closest('.tf'); if (!b) return; st.tf = b.dataset.tf; $$('.tf', $('#tfs')).forEach(x => x.classList.toggle('on', x === b)); head(); draw(); svg.classList.remove('swap'); void svg.getBoundingClientRect(); svg.classList.add('swap'); };
  $('#tools').onclick = openTools;
  $('#more').onclick = () => { const b = $('#moreBox'); b.hidden = !b.hidden; $('#more').textContent = b.hidden ? 'עוד נתונים ומידע על הנכס' : 'פחות'; if (!b.hidden) b.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' }); };
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
        <label class="lbl">${term('stop')} (יציאה אוטומטית בהפסד)</label>
        <div class="chips" data-k="stop">${[[0, 'ללא'], [3, '3%-'], [5, '5%-'], [10, '10%-']].map(([v, t]) => `<button class="chip${st.stop === v ? ' on' : ''}" data-v="${v}">${t}</button>`).join('')}</div>
        <label class="lbl">${term('target')} (יציאה אוטומטית ברווח)</label>
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
  scr.innerHTML = `<div class="anim"><div class="top"><h2>התיק שלי <span class="live"></span></h2><button class="vbadge" data-term="virtual">כסף וירטואלי ?</button></div>
    <div class="card pf-hero"><span class="eyebrow">שווי התיק</span><div class="wbig gtext" id="eqv">${money(eq0, 2)}</div>
      <div class="pf-row"><span id="eqp" class="chgchip ${chgCls(pl0)}">${sgn(pl0 / START_CASH * 100)}%</span><span id="eqs" class="muted" style="font-size:13px"><bdi dir="ltr">${sgn(pl0, 2)} ₪</bdi> מההתחלה</span></div>
      <svg class="chart eqc" id="eqc" viewBox="0 0 330 90"></svg></div>
    <div class="mini"><div class="card"><span class="eyebrow">${term('cash', 'כסף פנוי')}</span><div class="mbig" id="cash">${money(P.cash)}</div></div><div class="card"><span class="eyebrow">מושקע</span><div class="mbig" id="inv">${money(eq0 - P.cash)}</div></div></div>
    <div class="sec"><h3>${term('diversify', 'פיזור')} התיק</h3></div><div class="card"><div class="alloc" id="alloc"></div><div class="legend" id="legend"></div></div>${learn(['diversify', 'cash', 'risk'])}
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
      : `<div class="card empty">${ic.wallet}<b>עוד אין פוזיציות</b><span class="muted">בחרו נכס בשוק, חקרו את הגרף ובנו תוכנית לפני שקונים.</span><div style="display:flex;gap:8px;margin-top:12px"><button class="btn primary small" data-go="market" style="width:auto;padding:0 22px">לשוק</button><button class="btn ghost small" id="smp" style="width:auto;padding:0 18px">טעינת דוגמה</button></div></div>`;
    if (first) $('#hist').innerHTML = P.hist.length ? P.hist.slice(0, 8).map(h => { const a = byId(h.id); return `<div class="hrow"><div><b>${h.type === 'buy' ? 'קנייה' : 'מכירה'} · ${a.s}</b><span>${fmt(h.qty, 2)} ב-${fmt(h.price)}${h.why ? ' · ' + h.why : ''}</span></div><b class="${h.type === 'sell' ? chgCls(h.pnl) : ''}">${h.type === 'sell' ? sgn(h.pnl, 2) + ' ₪' : money(h.amt)}</b></div>`; }).join('') : '<p class="muted" style="padding:18px 0;text-align:center">עוד לא בוצעו עסקאות</p>';
  }
  paint(true);
  $('#poss').addEventListener('click', (ev) => { if (!ev.target.closest('#smp')) return; [['ALFA', 600, -.02, .06, .12], ['IDX100', 900, .015, .05, .1], ['GAMA', 450, -.03, .07, .15]].forEach(([id, amt, d, sp, tp]) => { const a = byId(id), avg = a.price * (1 - d), q = amt / avg; if (P.cash >= amt) { P.cash -= amt; P.pos[id] = { qty: q, avg, stop: avg * (1 - sp), target: avg * (1 + tp) }; P.hist.unshift({ t: Date.now(), type: 'buy', id, qty: q, price: avg, amt }); } }); P.eq.push(equity(ac)); save(); toast('נטענו 3 פוזיציות לדוגמה'); go('portfolio'); });
  onTick(() => paint(false));
  let sure = false;
  $('#rs').onclick = () => { if (!sure) { sure = true; $('#rs').textContent = 'בטוח? לחצו שוב לאיפוס'; return; } ac.portfolio = { cash: START_CASH, pos: {}, hist: [], eq: [START_CASH, START_CASH] }; save(); toast('התיק אופס'); go('portfolio'); };
};
