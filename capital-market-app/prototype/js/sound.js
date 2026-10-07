'use strict';
/* ===== sound: small synthesized sounds (Web Audio, no files). Quiet on purpose, with an on/off switch. ===== */
const SFX = (() => {
  const KEY = 'cm_sound';
  let ctx = null, master = null, on = true;
  try { on = localStorage.getItem(KEY) !== '0'; } catch (e) { }
  const ensure = () => {
    if (ctx) return ctx;
    try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); master = ctx.createGain(); master.gain.value = .16; master.connect(ctx.destination); } catch (e) { ctx = null; }
    return ctx;
  };
  /* one note: soft attack, exponential fade */
  const note = (f, t, d, type = 'sine', g = .5, to) => {
    const o = ctx.createOscillator(), v = ctx.createGain(), t0 = ctx.currentTime + t;
    o.type = type; o.frequency.setValueAtTime(f, t0); if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + d);
    v.gain.setValueAtTime(.0001, t0); v.gain.exponentialRampToValueAtTime(g, t0 + .012); v.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    o.connect(v); v.connect(master); o.start(t0); o.stop(t0 + d + .03);
  };
  const N = { C4: 262, G4: 392, E4: 330, C5: 523, E5: 659, G5: 784, A5: 880, C6: 1047, E6: 1319, G6: 1568 };
  const S = {
    tap: () => note(520, 0, .06, 'sine', .22),
    tab: () => note(660, 0, .07, 'sine', .25, 760),
    pick: () => note(440, 0, .07, 'triangle', .3, 520),
    correct: () => { note(N.E5, 0, .14, 'triangle', .5); note(N.A5, .09, .22, 'triangle', .5); },
    wrong: () => note(230, 0, .2, 'sine', .45, 175),
    pop: () => { note(700, 0, .08, 'sine', .35, 920); },
    star: () => { note(N.A5, 0, .12, 'triangle', .4); note(N.E6, .07, .2, 'sine', .3); },
    good: () => { [N.C5, N.E5, N.G5].forEach((f, k) => note(f, k * .09, .22, 'triangle', .5)); },
    oops: () => { note(N.G4, 0, .2, 'sine', .4); note(N.E4, .14, .3, 'sine', .4); },
    win: () => { [N.C5, N.E5, N.G5, N.C6].forEach((f, k) => note(f, k * .1, .32, 'triangle', .5)); note(N.E6, .42, .55, 'sine', .35); note(N.G6, .5, .6, 'sine', .22); note(N.C5, .4, .7, 'sine', .25); },
    level: () => { [N.C5, N.E5, N.G5, N.C6, N.E6].forEach((f, k) => note(f, k * .08, .3, 'triangle', .45)); note(N.G6, .5, .6, 'sine', .3); }
  };
  return {
    get on() { return on; },
    set(v) { on = !!v; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { } if (on) this.play('pop'); },
    unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); },
    play(name) {
      if (!on || !S[name]) return;
      try { const c = ensure(); if (!c) return; if (c.state === 'suspended') c.resume(); S[name](); } catch (e) { }
    }
  };
})();
document.addEventListener('pointerdown', () => SFX.unlock(), { capture: true });
/* light feedback for taps; quiz answers and results have their own sounds */
document.addEventListener('click', (e) => {
  if (e.target.closest('.tb, .tb-prof')) SFX.play('tab');
  else if (e.target.closest('.opt, .chip, .rk') && !e.target.closest('.lp')) SFX.play('pick');
  else if (e.target.closest('.btn.primary')) SFX.play('tap');
}, true);
