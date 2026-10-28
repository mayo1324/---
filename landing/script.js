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
  gsap.set('.loader__words i', { yPercent: 110 });

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

  /* loader */
  const count = { v: 0 };
  const countEl = $('.loader__count');
  const intro = gsap.timeline({
    onComplete: () => {
      $('.loader').style.display = 'none';
      body.classList.remove('is-loading');
      if (lenis) lenis.start();
      ScrollTrigger.refresh();
    },
  });
  intro
    .to('.loader__words i', { yPercent: 0, duration: 1, stagger: 0.3, ease: 'expo.out' }, 0.1)
    .to(count, {
      v: 100, duration: 2.3, ease: 'power2.inOut',
      onUpdate: () => { countEl.textContent = String(Math.round(count.v)).padStart(3, '0'); },
    }, 0)
    .to('.loader__line i', { scaleX: 1, duration: 2.3, ease: 'power2.inOut' }, 0)
    .to('.loader__words i', { yPercent: -110, duration: 0.7, stagger: 0.08, ease: 'expo.in' }, 2.45)
    .to('.loader__meta', { opacity: 0, duration: 0.4 }, 2.5)
    .to('.loader__panel--top', { yPercent: -100, duration: 1.2, ease: 'expo.inOut' }, 3.0)
    .to('.loader__panel--bottom', { yPercent: 100, duration: 1.2, ease: 'expo.inOut' }, 3.0)
    .add(heroIn(), 3.5);
  if (reduce) intro.progress(1);

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

  /* work: horizontal pinned scroll */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 721px)', () => {
    const track = $('.work__track');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.work', start: 'top top', end: () => '+=' + (dist() + innerHeight * 0.4),
        pin: '.work__pin', scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (s) => gsap.set('.work__bar i', { scaleX: s.progress }),
      },
    });
  });
  mm.add('(max-width: 720px)', () => {
    $$('.proj').forEach((p) => {
      gsap.from(p, { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 88%', once: true } });
    });
  });

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
