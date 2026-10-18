'use strict';
/* ===== cloud sign-in and sync (Firebase) =====
   Google works when FIREBASE_CONFIG is set. Apple stays a demo until it is enabled in CLOUD_PROVIDERS.
   Progress is also kept in this browser; signed-in users get it saved to their own document in the cloud.
   The Firebase SDK is loaded from Google's CDN only when needed. */
const CLOUD_ON = typeof FIREBASE_CONFIG !== 'undefined' && !!FIREBASE_CONFIG.apiKey;
const CLOUD_PROVIDERS = { google: true, apple: false };
const FB_SDK = '10.12.2';
const CLOUD_FIELDS = ['name', 'goal', 'stars', 'xp', 'lessonsDone', 'practiceDone', 'skills', 'days', 'watch', 'portfolio', 'posts', 'seenIntro', 'seenWelcome'];

/* adapter: the real one talks to Firebase; tests can put a fake one in window.__FBMOCK */
const FBA = window.__FBMOCK || (() => {
  let A, F, auth, db, ready = null;
  const base = `https://www.gstatic.com/firebasejs/${FB_SDK}/`;
  const init = () => ready || (ready = (async () => {
    const [AppM, AuthM, FsM] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
    A = AuthM; F = FsM; const app = AppM.initializeApp(FIREBASE_CONFIG); auth = A.getAuth(app); auth.languageCode = 'he'; db = F.getFirestore(app);
    try { await auth.authStateReady(); } catch (e) { }
  })());
  const prov = (k) => { if (k === 'google') { const p = new A.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); return p; } const p = new A.OAuthProvider('apple.com'); p.addScope('email'); p.addScope('name'); return p; };
  const u2 = (u) => u && { uid: u.uid, name: u.displayName || '', email: u.email || '' };
  return {
    init,
    async signIn(kind) {
      await init(); const p = prov(kind);
      try { const r = await A.signInWithPopup(auth, p); return u2(r.user); }
      catch (e) { if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') { try { localStorage.setItem('cm_redirect', '1'); } catch (_) { } await A.signInWithRedirect(auth, p); return null; } throw e; }
    },
    async redirectUser() { await init(); const r = await A.getRedirectResult(auth); return r && u2(r.user); },
    async currentUser() { await init(); return u2(auth.currentUser); },
    async signOut() { await init(); await A.signOut(auth); },
    async getDoc(uid) { await init(); const s = await F.getDoc(F.doc(db, 'users', uid)); return s.exists() ? s.data() : null; },
    async setDoc(uid, data) { await init(); await F.setDoc(F.doc(db, 'users', uid), data, { merge: true }); },
    async deleteAccount(uid) {
      await init(); await F.deleteDoc(F.doc(db, 'users', uid));
      try { await A.deleteUser(auth.currentUser); }
      catch (e) { if (e.code === 'auth/requires-recent-login') { await A.reauthenticateWithPopup(auth.currentUser, prov('google')); await A.deleteUser(auth.currentUser); } else throw e; }
    }
  };
})();

const clean = (x) => JSON.parse(JSON.stringify(x));
/* merge what is saved in the cloud into the local account: keep the best of both */
function mergeProgress(local, cloud) {
  if (!cloud) return local;
  const uni = (a, b) => Array.from(new Set([...(a || []), ...(b || [])]));
  local.lessonsDone = uni(local.lessonsDone, cloud.lessonsDone);
  local.practiceDone = Object.assign({}, cloud.practiceDone || {}, local.practiceDone || {});
  Object.keys(cloud.practiceDone || {}).forEach(k => { local.practiceDone[k] = Math.max(local.practiceDone[k] || 0, cloud.practiceDone[k] || 0); });
  local.stars = Math.max(local.stars || 0, cloud.stars || 0); local.xp = Math.max(local.xp || 0, cloud.xp || 0);
  local.days = Object.assign({}, cloud.days || {}, local.days || {});
  local.skills = Object.assign({}, cloud.skills || {}, local.skills || {});
  Object.keys(cloud.skills || {}).forEach(k => { const a = local.skills[k], b = cloud.skills[k]; if (a && b && b.n > a.n) local.skills[k] = b; });
  local.watch = uni(local.watch, cloud.watch);
  if (cloud.portfolio && (cloud.updatedAt || 0) > (local.cloudAt || 0)) local.portfolio = cloud.portfolio;
  ['name', 'goal'].forEach(k => { if (!local[k] && cloud[k]) local[k] = plain(cloud[k]); });
  local.seenIntro = local.seenIntro || cloud.seenIntro; local.seenWelcome = local.seenWelcome || cloud.seenWelcome;
  if (cloud.posts) local.posts = (local.posts && local.posts.length >= cloud.posts.length) ? local.posts : cloud.posts;
  return local;
}
let pushT = 0, pushing = false;
function cloudPush() {
  const ac = A(); if (!ac || !ac.uid) return;
  clearTimeout(pushT); pushT = setTimeout(async () => {
    if (pushing) return cloudPush(); pushing = true;
    try { const data = {}; CLOUD_FIELDS.forEach(k => { if (ac[k] !== undefined) data[k] = ac[k]; }); data.updatedAt = Date.now(); await FBA.setDoc(ac.uid, clean(data)); ac.cloudAt = data.updatedAt; try { localStorage.setItem(KEY, JSON.stringify(loadDB())); } catch (e) { } }
    catch (e) { /* offline or blocked: keep working locally, try again on the next save */ }
    pushing = false;
  }, 1500);
}
/* One account per email: a Google sign-in with an email that already has an account (password or Google) joins that account */
async function onCloudUser(u) {
  const d = loadDB(), ek = plain(u.email).toLowerCase(), legacy = 'g:' + u.uid, key = ek || legacy; let cloud = null, warn = false, linked = false, created = false;
  try { cloud = await FBA.getDoc(u.uid); } catch (e) { warn = true; }
  let ac = d.accounts[key];
  /* an older Google account saved under another key moves to the email key (or merges into the account that already has it) */
  const oldKey = d.accounts[legacy] ? legacy : Object.keys(d.accounts).find(k => k !== key && d.accounts[k] && d.accounts[k].uid === u.uid);
  if (oldKey) { if (!ac) { ac = d.accounts[oldKey]; } else { mergeProgress(ac, d.accounts[oldKey]); ac.uid = ac.uid || u.uid; } delete d.accounts[oldKey]; }
  if (ac && !ac.uid && !ac.noPass) linked = true; /* a password account that now gets Google as well */
  if (!ac) { created = true; ac = newAcct(u.name || 'משתמש', 15, u.email || '', 'cloud:' + u.uid, 'להבין איך זה עובד'); ac.noPass = true; ac.provider = 'google'; ac.seenIntro = false; }
  ac.uid = u.uid; ac.google = true;
  mergeProgress(ac, cloud);
  ac.name = plain(ac.name && ac.name !== 'משתמש' ? ac.name : (u.name || 'משתמש')) || 'משתמש'; ac.email = plain(u.email || ac.email);
  d.accounts[key] = ac; d.session = key; d.seenOnboarding = true; save(); cloudPush();
  if (warn) toast('לא הצלחנו לטעון התקדמות מהענן. ממשיכים מקומית.');
  track(created ? 'signup_done' : 'login', 'google');
  return { ac, linked, created };
}
const CLOUD_ERR = {
  'auth/unauthorized-domain': 'הכתובת הזאת עדיין לא מורשית להתחברות. אפשר להמשיך בלי Google.',
  'auth/network-request-failed': 'אין חיבור לאינטרנט. נסו שוב.',
  'auth/operation-not-allowed': 'ההתחברות הזאת עדיין לא הופעלה.',
  'auth/account-exists-with-different-credential': 'כבר יש חשבון עם האימייל הזה בדרך אחרת.'
};
let signTok = 0;
async function cloudSignIn(kind, btn) {
  const my = ++signTok, lab = btn && btn.dataset.lab != null ? btn.dataset.lab : (btn && btn.innerHTML);
  let cancelled = false;
  if (btn) { btn.dataset.lab = lab; btn.innerHTML = '<span class="spin"></span> מתחברים... (לחצו לביטול)'; btn.onclick = () => { cancelled = true; signTok++; reset(); }; }
  const reset = () => { clearTimeout(slow); if (btn) { btn.innerHTML = lab; btn.onclick = () => cloudSignIn(kind, btn); } };
  /* a slow sign-in (common on phones) keeps working: after a while just tell the user to wait */
  const slow = setTimeout(() => { if (btn && my === signTok) btn.innerHTML = '<span class="spin"></span> עוד רגע, זה לוקח קצת זמן...'; }, 6000);
  try {
    const u = await FBA.signIn(kind); if (cancelled || my !== signTok) return; if (!u) return; /* redirect in progress */
    const r = await onCloudUser(u); reset(); SFX.play('pop'); toast(r.linked ? 'חיברנו את Google לחשבון הקיים שלך. שלום, ' + r.ac.name : 'שלום, ' + r.ac.name); go('home');
  } catch (e) {
    if (cancelled || my !== signTok) return; reset();
    if (e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) { /* closed on purpose */ }
    else { toast(CLOUD_ERR[e && e.code] || 'ההתחברות נכשלה. אפשר לנסות שוב או להמשיך בלי Google.'); try { FB_ERRORS.push('auth ' + ((e && e.code) || e)); } catch (_) { } }
  }
}
/* at start: finish a redirect login, and pull the latest progress for a signed-in user */
async function cloudResume() {
  if (!CLOUD_ON) return;
  const ac = loggedIn() ? A() : null; let redirected = false;
  try { redirected = localStorage.getItem('cm_redirect') === '1'; localStorage.removeItem('cm_redirect'); } catch (e) { }
  if (!ac && !redirected) return; if (ac && !ac.uid && !redirected) return;
  try {
    if (redirected) { const u = await FBA.redirectUser(); if (u) { await onCloudUser(u); go('home'); return; } }
    if (ac && ac.uid) { const cloud = await FBA.getDoc(ac.uid); if (cloud) { mergeProgress(ac, cloud); save(); if (cur.name === 'home') go('home'); } }
  } catch (e) { }
}
async function cloudSignOut() { const ac = A(); if (ac && ac.uid) { try { await FBA.signOut(); } catch (e) { } } }
async function cloudDeleteAccount() { const ac = A(); if (ac && ac.uid) { await FBA.deleteAccount(ac.uid); } }
