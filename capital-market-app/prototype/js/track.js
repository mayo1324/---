'use strict';
/* ===== anonymous usage counting (to see how many open, sign up and come back) =====
   Sends only: a random id kept on this device, the event name, a short label (like a lesson id) and the time.
   No name, no email, no account id. Stored in our own Firestore project (Tel Aviv). Can be turned off in the profile.
   Respects "Do Not Track". The same code is inlined in the landing page. */
const TRACK = (() => {
  const K_ID = 'cm_vid', K_OFF = 'cm_noanalytics', K_Q = 'cm_evq';
  const ls = (f) => { try { return f(); } catch (e) { return null; } };
  const dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1';
  const url = () => `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/events?key=${FIREBASE_CONFIG.apiKey}`;
  const vid = () => { let v = ls(() => localStorage.getItem(K_ID)); if (!v) { v = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/-/g, '').slice(0, 24); ls(() => localStorage.setItem(K_ID, v)); } return v; };
  const on = () => !dnt && ls(() => localStorage.getItem(K_OFF)) !== '1' && typeof FIREBASE_CONFIG !== 'undefined' && !!FIREBASE_CONFIG.apiKey && /^https?:$/.test(location.protocol);
  const q = () => { try { return JSON.parse(localStorage.getItem(K_Q) || '[]'); } catch (e) { return []; } };
  const saveQ = (a) => ls(() => localStorage.setItem(K_Q, JSON.stringify(a.slice(-40))));
  const body = (x) => JSON.stringify({ fields: { vid: { stringValue: x.vid }, e: { stringValue: x.e }, p: { stringValue: x.p || '' }, s: { stringValue: x.s }, t: { integerValue: String(x.t) } } });
  let busy = false;
  const flush = async () => {
    if (busy || !on()) return; busy = true;
    try { for (let guard = 0; guard < 60; guard++) { const x = q()[0]; if (!x) break; const r = await fetch(url(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body(x), keepalive: true }); if (!r.ok && r.status !== 400 && r.status !== 403) break; const a = q(); a.shift(); saveQ(a); } } catch (e) { }
    busy = false;
  };
  addEventListener('online', flush);
  return {
    event(e, p) { if (!on()) return; const a = q(); a.push({ vid: vid(), e: String(e).slice(0, 30), p: String(p == null ? '' : p).slice(0, 40), s: 'app', t: Date.now() }); saveQ(a); flush(); },
    enabled: () => on(), optedOut: () => ls(() => localStorage.getItem(K_OFF)) === '1',
    setOptOut(v) { ls(() => v ? localStorage.setItem(K_OFF, '1') : localStorage.removeItem(K_OFF)); if (v) ls(() => localStorage.removeItem(K_Q)); }
  };
})();
const track = (e, p) => { try { TRACK.event(e, p); } catch (x) { } };
