'use strict';
/* after the terms are approved (or if they already were), go to the right first screen */
function bootRoute() {
  const d = loadDB(), h = (location.hash || '').replace('#', '');
  const open = ['home', 'lessons', 'market', 'portfolio', 'practiceHome', 'profile'];
  if (loggedIn()) go(open.includes(h) ? h : 'home');
  else go(Object.keys(d.accounts).length ? 'login' : d.seenOnboarding ? 'signup' : 'onboarding', 0);
}
(function boot() {
  initBg();
  if (!termsOk()) go('terms'); else bootRoute();
})();
