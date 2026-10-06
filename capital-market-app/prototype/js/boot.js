'use strict';
(function boot() {
  initBg();
  const d = loadDB(), h = (location.hash || '').replace('#', '');
  const open = ['home', 'lessons', 'market', 'portfolio', 'practiceHome', 'profile'];
  if (loggedIn()) go(open.includes(h) ? h : 'home');
  else go(Object.keys(d.accounts).length ? 'login' : d.seenOnboarding ? 'signup' : 'onboarding', 0);
})();
