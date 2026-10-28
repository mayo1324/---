(() => {
  const body = document.body;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  $('#year').textContent = new Date().getFullYear();

  if (!window.gsap || !window.ScrollTrigger) {
    body.classList.remove('is-loading');
    $('.loader').remove();
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* smooth scroll */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = id === '#top' ? document.body : $(id);
      if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: id === '#top' ? 0 : -20, duration: 1.6 });
      else el.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* word splitter, keeps inline elements */
  const splitWords = (root, cls = 'w') => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span');
            w.className = cls;
            const i = document.createElement('span');
            i.className = 'wi';
            i.textContent = part;
            w.append(i);
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(root);
    return $$('.wi', root);
  };

  /* cursor */
  if (fine) {
    const cur = $('.cursor');
    const label = $('.cursor__ring b');
    const dx = gsap.quickTo('.cursor__dot', 'x', { duration: 0.12, ease: 'power3' });
    const dy = gsap.quickTo('.cursor__dot', 'y', { duration: 0.12, ease: 'power3' });
    const rx = gsap.quickTo('.cursor__ring', 'x', { duration: 0.55, ease: 'power3' });
    const ry = gsap.quickTo('.cursor__ring', 'y', { duration: 0.55, ease: 'power3' });
    addEventListener('mousemove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    $$('[data-cursor], .btn').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        const t = el.dataset.cursor;
        if (t) { label.textContent = t; cur.classList.add('is-label'); } else cur.classList.add('is-hover');
      });
      el.addEventListener('mouseleave', () => cur.classList.remove('is-hover', 'is-label'));
    });
  }

  /* magnetic buttons */
  if (fine && !reduce) {
    $$('.magnetic').forEach((el) => {
      const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, .5)' });
      const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, .5)' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.32);
        qy((e.clientY - (r.top + r.height / 2)) * 0.45);
      });
      el.addEventListener('mouseleave', () => { qx(0); qy(0); });
    });
  }

  /* card spotlight */
  $$('.card').forEach((c) => {
    c.addEventListener('mousemove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', e.clientX - r.left + 'px');
      c.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  });

  /* initial states */
  const heroWords = $$('.hero__title .inner');
  gsap.set(heroWords, { yPercent: 115, rotate: 3 });
  gsap.set(['.eyebrow', '.hero__sub', '.hero__cta > *', '.hero__scroll'], { opacity: 0, y: 26 });
  gsap.set('.nav', { yPercent: -160, opacity: 0 });
  gsap.set('.stage', { scale: 0.86, opacity: 0, rotateY: -18, rotateX: 8 });
  gsap.set('.chip', { scale: 0, opacity: 0 });
  gsap.set('.phone', { y: 120, opacity: 0 });
  gsap.set('.browser', { y: 80, opacity: 0 });
  gsap.set('.rings', { opacity: 0, scale: 0.8 });

  const heroIn = () => {
    const t = gsap.timeline({ defaults: { ease: 'expo.out' } });
    t.to('.nav', { yPercent: 0, opacity: 1, duration: 1.2 }, 0)
      .to('.eyebrow', { opacity: 1, y: 0, duration: 1 }, 0.1)
      .to(heroWords, { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.14 }, 0.15)
      .to('.hero__sub', { opacity: 1, y: 0, duration: 1.1 }, 0.7)
      .to('.hero__cta > *', { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.85)
      .to('.hero__scroll', { opacity: 1, y: 0, duration: 1 }, 1.2)
      .to('.stage', { scale: 1, opacity: 1, rotateY: 0, rotateX: 0, duration: 1.8 }, 0.2)
      .to('.rings', { opacity: 1, scale: 1, duration: 2 }, 0.3)
      .to('.browser', { y: 0, opacity: 1, duration: 1.5 }, 0.5)
      .to('.phone', { y: 0, opacity: 1, duration: 1.5 }, 0.75)
      .to('.chip', { scale: 1, opacity: 1, duration: 1, stagger: 0.18, ease: 'back.out(2)' }, 1.2);
    return t;
  };

  /* intro: walk into the screen */
  const finish = () => {
    $('#intro').style.display = 'none';
    body.classList.remove('is-loading');
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
  };
  const runIntro = () => {
    const stageEl = $('#introStage');
    const W = innerWidth, H = innerHeight;
    const portrait = W < H * 0.85;
    const base = portrait ? W / 900 : Math.max(W / 1600, H / 900);

    /* keys + dust */
    const rows = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.7], [1.6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.4], [1.9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.2], [2.4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.8], [1.3, 1.3, 1.3, 6.2, 1.3, 1.3, 1.3]];
    const keysEl = $('#keys');
    keysEl.style.gridTemplateRows = 'repeat(5, 1fr)';
    rows.forEach((r) => {
      const row = document.createElement('div');
      r.forEach((w, i) => {
        const k = document.createElement('i');
        k.style.flex = w;
        if (w > 1.2 && w !== 6.2 || i === 0 && w > 1) k.className = 'd';
        row.append(k);
      });
      keysEl.append(row);
    });
    const keyEls = $$('#keys i');
    const dust = $('#dust');
    for (let i = 0; i < 34; i++) {
      const d = document.createElement('span');
      d.style.left = Math.random() * 100 + '%';
      d.style.top = Math.random() * 100 + '%';
      d.style.transform = `scale(${0.6 + Math.random() * 1.4})`;
      dust.append(d);
    }

    /* measure everything at scale 1 */
    gsap.set(stageEl, { x: 0, y: 0, scale: 1, opacity: 1 });
    const loc = (el) => {
      const sr = stageEl.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height, cx: r.left - sr.left + r.width / 2, cy: r.top - sr.top + r.height / 2 };
    };
    const edBox = loc($('#ed'));
    const cvBox = loc($('#canvas'));
    const playBox = loc($('#play'));
    const tracksBox = loc($('#tracks'));
    const view = (fx, fy, S) => ({ x: W / 2 - fx * S, y: H / 2 - fy * S, scale: S });
    const startView = view(800, portrait ? 400 : 440, base * 0.96);
    const dollyView = view(800, 450, base * (portrait ? 1.06 : 1.1));
    const zoomS = Math.max(W / cvBox.w, H / cvBox.h) * 1.01;
    const zoomView = view(cvBox.cx, cvBox.cy, zoomS);
    gsap.set(stageEl, { ...startView, opacity: 0, transformOrigin: '0 0', force3D: false });

    /* initial states */
    const ui = ['.ed__top', '.ed__layers', '.ed__insp', '.ed__time'];
    gsap.set(ui, { opacity: 0 });
    gsap.set('.ed__stagewrap', { opacity: 0 });
    gsap.set('.trk i', { scaleX: 0 });
    gsap.set('.ed__layers u', { opacity: 0, x: -8 });
    gsap.set('.cv-wire i', { opacity: 0 });
    gsap.set('#cur', { x: edBox.w * 0.62, y: edBox.h * 0.62, opacity: 0 });
    gsap.set('#head', { x: 0 });
    gsap.set('.dust span', { opacity: 0 });

    const prog = { v: 0 };
    const tc = $('#tc');
    const render = $('#cvRender');
    const scan = $('#cvScan');
    const headMax = tracksBox.w - 20;
    const fmt = (n) => String(n).padStart(2, '0');
    const onProg = () => {
      const p = prog.v;
      gsap.set('#head', { x: p * headMax });
      const f = Math.round(p * 24 * 8);
      tc.textContent = `00:${fmt(Math.floor(f / 24))}:${fmt(f % 24)}`;
      render.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
      gsap.set(scan, { x: p * cvBox.w, opacity: p > 0.01 && p < 0.99 ? 1 : 0 });
      $('#count').textContent = String(Math.round(p * 100)).padStart(3, '0');
      gsap.set('#hudLine', { scaleX: p });
      if (Math.random() < 0.5) {
        const k = keyEls[(Math.random() * keyEls.length) | 0];
        k.classList.add('hit');
        setTimeout(() => k.classList.remove('hit'), 110);
      }
    };

    const tl = gsap.timeline({ onComplete: finish });
    tl.to(stageEl, { opacity: 1, duration: 1.2, ease: 'power1.out' }, 0)
      .to(stageEl, { ...dollyView, duration: 4.4, ease: 'power1.inOut' }, 0)
      .fromTo(['#barglow', '#lightcone', '#wallglow'], { opacity: 0 }, { keyframes: { opacity: [0, 0.8, 0.15, 0.9, 0.35, 1] }, duration: 1, ease: 'none', stagger: 0.04 }, 0.5)
      .to('#screenOff', { opacity: 0, duration: 0.7, ease: 'power2.out' }, 1.3)
      .to('#spill', { opacity: 1, duration: 1.4 }, 1.3)
      .to('.dust span', { opacity: 0.8, duration: 1.2, stagger: 0.03 }, 1.2)
      .to('.ed__stagewrap', { opacity: 1, duration: 0.6 }, 1.5)
      .to(ui, { opacity: 1, duration: 0.6, stagger: 0.1 }, 1.5)
      .to('.ed__layers u', { opacity: 1, x: 0, duration: 0.5, stagger: 0.07 }, 1.7)
      .to('.cv-wire i', { opacity: 1, duration: 0.5, stagger: 0.1 }, 1.8)
      .to('.trk i', { scaleX: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' }, 1.9)
      .to('#hud', { opacity: 1, duration: 0.6 }, 2)
      .to('#skip', { opacity: 1, duration: 0.6 }, 2)
      .to('#cur', { opacity: 1, duration: 0.3 }, 2.2)
      .to('#cur', { x: playBox.cx - edBox.x, y: playBox.cy - edBox.y, duration: 1.1, ease: 'power2.inOut' }, 2.3)
      .to('#cur', { scale: 0.82, duration: 0.1, yoyo: true, repeat: 1 }, 3.45)
      .fromTo('#ripple', { opacity: 1, scale: 0.3 }, { opacity: 0, scale: 1.6, duration: 0.6, ease: 'power2.out' }, 3.45)
      .add(() => $('#play').classList.add('on'), 3.5)
      .to('#cur', { x: edBox.w * 0.7, y: edBox.h * 0.42, duration: 1.2, ease: 'power2.inOut' }, 3.8)
      .to('.cv-wire', { opacity: 0, duration: 0.5 }, 3.6)
      .to(prog, { v: 1, duration: 2.1, ease: 'power1.inOut', onUpdate: onProg }, 3.6)
      .to('#hud', { opacity: 0, duration: 0.4 }, 5.7)
      .to('#skip', { opacity: 0, duration: 0.3 }, 5.7)
      .to('#cur', { opacity: 0, duration: 0.3 }, 5.7)
      .to(stageEl, { ...zoomView, duration: 1.9, ease: 'expo.inOut' }, 5.8)
      .to('#flash', { opacity: 1, duration: 0.45, ease: 'power2.in' }, 7.2)
      .add(heroIn(), 7.45)
      .to('#intro', { opacity: 0, duration: 0.9, ease: 'power2.out' }, 7.5);

    $('#skip').addEventListener('click', () => tl.timeScale(9));
  };

  if (reduce) {
    $('#intro').style.display = 'none';
    heroIn().progress(1);
    finish();
  } else {
    runIntro();
  }

  /* hero tilt + depth */
  if (fine && !reduce) {
    const stage = $('.stage');
    const layers = $$('.layer');
    const rY = gsap.quickTo(stage, 'rotateY', { duration: 1.2, ease: 'power3' });
    const rX = gsap.quickTo(stage, 'rotateX', { duration: 1.2, ease: 'power3' });
    const moves = layers.map((l) => [gsap.quickTo(l, 'x', { duration: 1.4, ease: 'power3' }), gsap.quickTo(l, 'y', { duration: 1.4, ease: 'power3' }), +l.dataset.depth]);
    $('.hero').addEventListener('mousemove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      rY(nx * -14); rX(ny * 10);
      moves.forEach(([x, y, d]) => { x(nx * -22 * d); y(ny * -16 * d); });
    });
  }

  /* hero scroll parallax */
  gsap.to('.hero__text', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__visual', { yPercent: 10, scale: 0.92, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* progress bar + nav hide */
  gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });
  let navHidden = false;
  ScrollTrigger.create({
    start: 120,
    onUpdate: (self) => {
      const hide = self.direction === 1;
      if (hide === navHidden) return;
      navHidden = hide;
      gsap.to('.nav', { yPercent: hide ? -170 : 0, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
    },
  });

  /* marquee speeds up with scroll velocity */
  const mq = gsap.to('.marquee__track', { xPercent: -50, ease: 'none', duration: 38, repeat: -1 });
  let boost = 1;
  ScrollTrigger.create({ onUpdate: (self) => { boost = Math.max(boost, 1 + Math.min(Math.abs(self.getVelocity()) / 350, 8)); } });
  gsap.ticker.add(() => {
    boost += (1 - boost) * 0.05;
    mq.timeScale(boost);
  });

  /* statement: words light up on scroll */
  const st = $('[data-scrub]');
  const stWords = splitWords(st);
  gsap.set(stWords, { opacity: 0.14 });
  gsap.to(stWords, {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: st, start: 'top 80%', end: 'bottom 45%', scrub: true },
  });

  /* headings */
  $$('[data-split]').forEach((h) => {
    const words = splitWords(h);
    gsap.set(words, { yPercent: 115, rotate: 4 });
    ScrollTrigger.create({
      trigger: h, start: 'top 85%', once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.07, ease: 'expo.out' }),
    });
  });

  /* labels */
  $$('.label').forEach((l) => {
    gsap.from(l, { opacity: 0, x: 30, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: l, start: 'top 90%', once: true } });
  });

  /* service cards */
  gsap.set('.card', { y: 110, opacity: 0, rotateX: -10, transformPerspective: 900 });
  ScrollTrigger.batch('.card', {
    start: 'top 88%', once: true,
    onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, rotateX: 0, duration: 1.4, stagger: 0.14, ease: 'expo.out', clearProps: 'transform' }),
  });

  const mm = gsap.matchMedia();

  /* work: ring of monitors, keeps turning */
  const rig = $('#rig');
  const ring = $('#ring');
  const mons = $$('.mon');
  const N = mons.length;
  const step = 360 / N;
  const names = mons.map((m) => ({ n: $('b', m).textContent, k: $('span', m).textContent, p: m.dataset.p }));
  let R = 1200;
  const layout = () => {
    const vw = innerWidth;
    const w = vw < 720 ? vw * 0.62 : Math.min(470, vw * 0.245);
    rig.style.setProperty('--w', w + 'px');
    rig.style.setProperty('--h', w / 1.6 + 36 + 'px');
    R = (N * (w + w * 0.05)) / (2 * Math.PI);
    mons.forEach((m, i) => { m.dataset.a = i * step; });
  };
  layout();
  addEventListener('resize', layout);

  let rot = 0, vel = 0, speed = 5, hover = false, dragging = false, last = 0, lastX = 0, shown = -1;
  const chipBtns = $$('.chip-btn');
  const setNow = (i) => {
    if (i === shown) return;
    shown = i;
    const d = names[i];
    gsap.to('#now', { opacity: 0, duration: 0.18, onComplete: () => {
      $('#nowName').textContent = d.n; $('#nowKind').textContent = d.k;
      gsap.to('#now', { opacity: 1, duration: 0.35 });
    } });
    chipBtns.forEach((c) => c.classList.toggle('is-on', c.dataset.p === d.p));
  };
  const place = () => {
    let best = -2, bi = 0;
    mons.forEach((m, i) => {
      const a = i * step + rot;
      const rad = (a * Math.PI) / 180;
      const c = Math.cos(rad);
      if (c > best) { best = c; bi = i; }
      const vis = Math.max(0, Math.min(1, (c + 0.5) / 0.75));
      m.style.opacity = vis.toFixed(3);
      m.style.transform = `rotateY(${a}deg) translateZ(${R}px) scale(${(0.9 + 0.1 * Math.max(0, c)).toFixed(3)})`;
      m.style.filter = `brightness(${(0.55 + 0.45 * Math.max(0, c)).toFixed(3)})`;
    });
    ring.style.transform = `translateZ(${-R}px)`;
    setNow(bi);
  };
  gsap.ticker.add((t, dt) => {
    const d = Math.min(dt, 64) / 1000;
    const target = reduce || hover || dragging ? 0 : speed;
    if (!dragging) {
      vel += (target - vel) * Math.min(1, d * 3);
      rot -= vel * d;
    }
    place();
  });
  ScrollTrigger.create({ trigger: '#work', start: 'top bottom', end: 'bottom top', onUpdate: (s) => { if (!dragging) vel += s.getVelocity() / 140 * 0.02; } });
  rig.addEventListener('mouseenter', () => { hover = true; });
  rig.addEventListener('mouseleave', () => { hover = false; });
  rig.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; last = performance.now(); rig.classList.add('is-drag'); rig.setPointerCapture(e.pointerId); });
  rig.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    const now = performance.now();
    rot -= dx * 0.16;
    vel = (-dx * 0.16) / Math.max(0.008, (now - last) / 1000) * -1;
    last = now;
  });
  const endDrag = () => { if (!dragging) return; dragging = false; rig.classList.remove('is-drag'); vel = Math.max(-90, Math.min(90, vel)); };
  rig.addEventListener('pointerup', endDrag);
  rig.addEventListener('pointercancel', endDrag);
  chipBtns.forEach((b) => b.addEventListener('click', () => {
    const idx = +b.dataset.goto;
    let t = -idx * step;
    t += Math.round((rot - t) / 360) * 360;
    gsap.to({ v: rot }, { v: t, duration: 1.4, ease: 'expo.inOut', onUpdate() { rot = this.targets()[0].v; vel = 0; } });
  }));
  gsap.from('.rig', { opacity: 0, y: 80, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.rig', start: 'top 85%', once: true } });

  /* numbers */
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } }),
    });
  });
  gsap.from('.num', { y: 60, opacity: 0, stagger: 0.15, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.numbers', start: 'top 80%', once: true } });

  /* process: stacked cards shrink as the next one covers them */
  mm.add('(min-width: 721px)', () => {
    const steps = $$('.step');
    steps.forEach((s, i) => {
      if (i === steps.length - 1) return;
      gsap.to(s, {
        scale: 0.93 - (steps.length - i) * 0.004, filter: 'brightness(0.55)', ease: 'none',
        scrollTrigger: { trigger: steps[i + 1], start: 'top 85%', end: 'top 25%', scrub: true },
      });
    });
    steps.forEach((s) => {
      gsap.from(s.querySelector('.step__no'), {
        xPercent: 30, opacity: 0, duration: 1.3, ease: 'expo.out',
        scrollTrigger: { trigger: s, start: 'top 80%', once: true },
      });
    });
  });

  /* pricing */
  gsap.set('.plan', { y: 100, opacity: 0 });
  ScrollTrigger.batch('.plan', {
    start: 'top 88%', once: true,
    onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 1.4, stagger: 0.15, ease: 'expo.out', clearProps: 'opacity,transform' }),
  });

  /* cta */
  if (fine && !reduce) {
    const cta = $('.cta');
    const gx = gsap.quickTo('.cta__glow', 'x', { duration: 1.2, ease: 'power3' });
    const gy = gsap.quickTo('.cta__glow', 'y', { duration: 1.2, ease: 'power3' });
    cta.addEventListener('mousemove', (e) => {
      const r = cta.getBoundingClientRect();
      gx((e.clientX - r.left - r.width / 2) * 0.5);
      gy((e.clientY - r.top - r.height / 2) * 0.5);
    });
  }
  gsap.from('.cta__row > *', { y: 50, opacity: 0, stagger: 0.12, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.cta__row', start: 'top 92%', once: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
