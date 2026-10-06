'use strict';
/* ===== helpers ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const fmt = (n, d = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const money = (n, d = 0) => (n < 0 ? '-' : '') + '₪' + fmt(Math.abs(n), d);
const sgn = (n, d = 2) => (n >= 0 ? '+' : '-') + fmt(Math.abs(n), d);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const reduceMotion = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
const hash = (s) => { let h = 5381; for (const ch of String(s)) h = ((h << 5) + h + ch.charCodeAt(0)) | 0; return String(h); };

/* ===== storage: accounts kept in this browser only (demo, not real security) ===== */
const KEY = 'cm_proto_v2';
let DB = null;
function loadDB() {
  if (DB) return DB;
  try { DB = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { DB = null; }
  if (!DB || !DB.accounts) DB = { accounts: {}, session: null, seenOnboarding: false };
  return DB;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } }
const START_CASH = 5000;
const newAcct = (name, age, email, pass, goal) => ({ name, age, email, pass: hash(pass), goal, stars: 0, xp: 0, streak: 1, lessonsDone: [], practiceDone: {}, watch: ['ALFA', 'IDX100'], portfolio: { cash: START_CASH, pos: {}, hist: [], eq: [START_CASH, START_CASH] }, demoUnlock: false });
const GUEST = newAcct('אורח', 16, '', 'x', '');
const A = () => { const d = loadDB(); return (d.session && d.accounts[d.session]) || GUEST; };
const loggedIn = () => { const d = loadDB(); return !!(d.session && d.accounts[d.session]); };

/* ===== icons ===== */
const ic = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 21V5"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M17 8v12"/><rect x="4.5" y="8" width="5" height="7" rx="1"/><rect x="14.5" y="11" width="5" height="6" rx="1"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7a2 2 0 012-2h11v4"/><path d="M4 7v11a2 2 0 002 2h14V9H6a2 2 0 01-2-2z"/><circle cx="16.5" cy="14.5" r="1.2" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>',
  fire: '<svg viewBox="0 0 24 24" fill="#ff8a3d"><path d="M12 2c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  starO: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>'
};
const starSvg = (on) => `<svg viewBox="0 0 24 24"><path fill="${on ? '#ffc94d' : '#2b3038'}" d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>`;

/* ===== toast / sheet ===== */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }
function openSheet(html, id = 'sheet') { const s = $('#' + id); s.innerHTML = `<div class="sheet-bg" data-close="1"></div><div class="sheet-body">${html}</div>`; s.hidden = false; requestAnimationFrame(() => s.classList.add('open')); }
function closeSheet(id = 'sheet') { const s = $('#' + id); s.classList.remove('open'); setTimeout(() => { if (!s.classList.contains('open')) { s.hidden = true; s.innerHTML = ''; } }, 250); }
document.addEventListener('click', (e) => { const c = e.target.closest('[data-close]'); if (c) { const sh = c.closest('.sheet'); closeSheet(sh ? sh.id : 'sheet'); } const t = e.target.closest('[data-term]'); if (t) openTerm(t.dataset.term); });

/* ===== router ===== */
const screens = {};
const scr = $('#screen');
const ticks = [];
const onTick = (fn) => ticks.push(fn);
let cur = { name: '', arg: null };
const NO_TABS = ['onboarding', 'login', 'signup', 'lesson', 'lessonDone', 'practice', 'feedback', 'asset'];
const TAB_OF = { asset: 'market', practiceHome: 'practiceHome', profile: '', glossary: 'lessons' };
let navToken = 0, booted = false;
function go(name, arg) {
  cur = { name, arg };
  const tok = ++navToken;
  const render = () => {
    ticks.length = 0;
    closeSheetNow();
    const tabs = !NO_TABS.includes(name);
    scr.className = 'screen' + (tabs ? ' has-tabs' : '');
    scr.innerHTML = '';
    screens[name](arg);
    scr.scrollTop = 0;
    const tb = $('#tabbar');
    tb.hidden = !tabs;
    if (tabs) renderTabs(name in TAB_OF ? TAB_OF[name] : name);
    runCountUps();
    try { history.replaceState(null, '', '#' + name); } catch (e) { }
  };
  if (!booted || reduceMotion) { booted = true; render(); return; }
  const sw = $('#sweep'); sw.classList.remove('run'); void sw.offsetWidth; sw.classList.add('run');
  scr.classList.add('leaving');
  setTimeout(() => { if (tok !== navToken) return; render(); scr.classList.add('entering'); setTimeout(() => scr.classList.remove('entering'), 520); }, 170);
}
const lvl = (a) => 1 + Math.floor((a.xp || 0) / 100);
function closeSheetNow() { ['sheet', 'term'].forEach(id => { const s = $('#' + id); s.hidden = true; s.classList.remove('open'); s.innerHTML = ''; }); }
function renderTabs(active) {
  const items = [['home', 'בית', ic.home], ['lessons', 'שיעורים', ic.book], ['practiceHome', 'תרגול', ic.chart, true], ['market', 'שוק', ic.trend], ['portfolio', 'תיק', ic.wallet]];
  $('#tabbar').innerHTML = items.map(([id, label, icon, mid]) => `<button class="tab${active === id ? ' on' : ''}${mid ? ' mid' : ''}" data-go="${id}">${icon}<span>${label}</span></button>`).join('');
}
document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-go]');
  if (g) go(g.dataset.go, g.dataset.arg);
  if (e.target.closest('[data-soon]')) toast('בקרוב');
});

/* count-up numbers: <span data-cu="1234.5" data-d="2" data-pre="₪"> */
function runCountUps(root = scr) {
  $$('[data-cu]', root).forEach(el => {
    const to = parseFloat(el.dataset.cu), d = +(el.dataset.d || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    const show = (v) => { el.textContent = (v < 0 ? '-' : (el.dataset.plus && v > 0 ? '+' : '')) + pre + fmt(Math.abs(v), d) + suf; };
    if (reduceMotion) return show(to);
    const t0 = performance.now(), dur = 900;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); show(to * e); if (k < 1) requestAnimationFrame(step); else show(to); };
    requestAnimationFrame(step);
  });
}

/* ===== animated background: drifting candles + aurora (behind everything) ===== */
function initBg() {
  const cv = $('#bg'); if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
  let W = 390, H = 844;
  const fit = () => { const r = cv.getBoundingClientRect(); W = r.width || 390; H = r.height || 844; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  fit(); addEventListener('resize', fit);
  const r = rng(5), SL = 20;
  let p = 0;
  const mk = () => { const o = p; p = p * .985 + (r() - .47) * 16; return { o, c: p, h: Math.max(o, p) + r() * 9, l: Math.min(o, p) - r() * 9 }; };
  const cs = []; for (let i = 0; i < 26; i++) cs.push(mk());
  let off = 0, last = 0, line = [];
  function draw(t) {
    if (document.hidden) return requestAnimationFrame(draw);
    if (t - last < 33 && !reduceMotion) return requestAnimationFrame(draw);
    const dt = Math.min(60, t - last); last = t;
    if (!reduceMotion) { off += dt * 0.012; if (off >= SL) { off -= SL; cs.shift(); cs.push(mk()); } }
    ctx.clearRect(0, 0, W, H);
    const base = H * .66, k = 1.5;
    ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    cs.forEach((c, i) => {
      const x = i * SL - off, up = c.c >= c.o, col = up ? '31,240,176' : '255,96,72', a = .11;
      ctx.strokeStyle = `rgba(${col},${a + .05})`; ctx.fillStyle = `rgba(${col},${a})`;
      ctx.beginPath(); ctx.moveTo(x, base - c.h * k); ctx.lineTo(x, base - c.l * k); ctx.stroke();
      const y1 = base - Math.max(c.o, c.c) * k, y2 = base - Math.min(c.o, c.c) * k;
      ctx.fillRect(x - 5, y1, 10, Math.max(3, y2 - y1));
    });
    ctx.strokeStyle = 'rgba(31,240,176,.22)'; ctx.lineWidth = 2; ctx.shadowColor = 'rgba(31,240,176,.6)'; ctx.shadowBlur = 12;
    ctx.beginPath(); cs.forEach((c, i) => { const x = i * SL - off, y = base - c.c * k; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.shadowBlur = 0;
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
