'use strict';
/* ===== feedback, welcome, about, error notice: for letting friends test the prototype ===== */
const FB_ERRORS = [];
function usageSummary() {
  const ac = A(), pd = ac.practiceDone || {};
  return `שיעורים: ${(ac.lessonsDone || []).length}/${LESSONS.length} | מקרי תרגול: ${Object.values(pd).filter(v => v > 0).length}/${SCEN.length} | כוכבים: ${ac.stars || 0} | רצף: ${streakDays(ac)} | מסך: ${cur.name}${cur.arg != null && typeof cur.arg !== 'object' ? ' ' + cur.arg : ''} | רוחב: ${innerWidth}`;
}
function buildFeedbackText(f) {
  const stars = f.rate ? '★'.repeat(f.rate) + '☆'.repeat(5 - f.rate) + ` (${f.rate}/5)` : 'לא דורג';
  return `משוב על האפליקציה (${APP_VERSION}, ${BUILD_DATE})\nדירוג: ${stars}\nנושא: ${f.topic || 'כללי'}\nהודעה: ${f.msg || '(בלי הודעה)'}` +
    (f.attach ? `\n--- נתוני שימוש אנונימיים ---\n${usageSummary()}\nדפדפן: ${navigator.userAgent.slice(0, 110)}${FB_ERRORS.length ? '\nשגיאות: ' + FB_ERRORS.slice(-3).join(' ; ') : ''}` : '');
}
function openFeedback() {
  const f = { rate: 0, topic: '', attach: true };
  const TOPICS = ['עיצוב', 'תוכן השיעורים', 'תרגול', 'קושי', 'באג', 'משהו אחר'];
  openSheet(`<h3>משוב על האפליקציה</h3><p class="muted" style="font-size:13.5px;line-height:1.55">שתי דקות של משוב עוזרות לנו מאוד. אין צורך בשם או באימייל.</p>
    <div class="fb-rate" id="fbr">${[1, 2, 3, 4, 5].map(n => `<button data-r="${n}" aria-label="${n} מתוך 5">★</button>`).join('')}</div>
    <div class="chips fb-topics" id="fbt">${TOPICS.map(t => `<button class="chip" data-t="${t}">${t}</button>`).join('')}</div>
    <textarea class="gi cq" id="fbm" rows="4" maxlength="600" placeholder="מה היה ברור, מה לא, מה היה משעמם, מה נשבר?"></textarea>
    <button class="check on" id="fba" type="button"><i></i><span>צרפו נתוני שימוש אנונימיים (כמה שיעורים ותרגולים עשיתי, סוג מכשיר). בלי שם ובלי אימייל.</span></button>
    <div class="fb-send"><button class="btn primary" id="fbs">שליחה</button><button class="btn ghost" id="fbc">העתקה</button></div>
    <div class="fb-extra" id="fbx"></div>
    <p class="demo-note" style="margin-top:10px">הטקסט לא נשלח אוטומטית לשום מקום. "שליחה" פותחת שיחה בוואטסאפ עם המשוב כתוב, ואתם רק לוחצים על שלח. אפשר גם ללחוץ "העתקה" ולהדביק איפה שנוח.</p>`);
  const cur_ = () => { f.msg = $('#fbm').value.trim(); return buildFeedbackText(f); };
  $('#fbr').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; f.rate = +b.dataset.r; $$('#fbr button').forEach(x => x.classList.toggle('on', +x.dataset.r <= f.rate)); };
  $('#fbt').onclick = (e) => { const b = e.target.closest('.chip'); if (!b) return; f.topic = b.dataset.t; $$('#fbt .chip').forEach(x => x.classList.toggle('on', x === b)); };
  $('#fba').onclick = () => { f.attach = !f.attach; $('#fba').classList.toggle('on', f.attach); };
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); toast('הועתק, אפשר להדביק'); } catch (e) { const ta = $('#fbm'); ta.value = t; ta.select(); toast('סמנו והעתיקו את הטקסט'); } };
  $('#fbc').onclick = () => copy(cur_());
  $('#fbs').onclick = async () => {
    const t = cur_(); if (f.rate === 0 && !f.msg) return toast('דרגו או כתבו משהו קודם');
    if (FEEDBACK_WHATSAPP) {
      /* some viewers (for example a preview inside another page) block WhatsApp, so the text is also copied and shown as a fallback */
      const url = `https://wa.me/${FEEDBACK_WHATSAPP}?text=${encodeURIComponent(t)}`, local = '0' + FEEDBACK_WHATSAPP.replace(/^972/, '');
      try { await navigator.clipboard.writeText(t); } catch (e) { }
      try { window.open(url, '_blank', 'noopener'); } catch (e) { }
      $('#fbx').innerHTML = `<p class="muted" style="font-size:13px;line-height:1.6">פותחים את וואטסאפ. אם הוא לא נפתח, ההודעה כבר הועתקה: הדביקו אותה בשיחה עם ${local}.</p><a class="btn ghost" target="_blank" rel="noopener noreferrer" href="${url}">לנסות שוב לפתוח את וואטסאפ</a>`;
      return;
    }
    if (navigator.share) { try { await navigator.share({ title: 'משוב על האפליקציה', text: t }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    const x = $('#fbx'), enc = encodeURIComponent(t); let h = '';
    if (FEEDBACK_WHATSAPP) h += `<a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${FEEDBACK_WHATSAPP}?text=${enc}">שליחה בוואטסאפ</a>`;
    if (FEEDBACK_EMAIL) h += `<a class="btn ghost" href="mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('משוב על האפליקציה')}&body=${enc}">שליחה במייל</a>`;
    x.innerHTML = h || '<p class="muted" style="font-size:13px">אין שיתוף במכשיר הזה. לחצו על "העתקה" והדביקו בוואטסאפ.</p>';
    if (!h) copy(t);
  };
}
function openAbout() {
  openSheet(`<h3>על גרסת הניסוי</h3><span class="muted" style="font-size:13px">${APP_VERSION} · ${BUILD_DATE}</span>
    <div class="about"><p><b>מה זה?</b> אב טיפוס של אפליקציה שמלמדת שוק הון לבני 15 ומעלה, עם שיעורים ותרגול על גרפים. אין כאן ייעוץ השקעות, המלצות או כסף אמיתי.</p>
    <p><b>מה אמיתי ומה הדגמה?</b> מקרי התרגול הם נתוני שוק אמיתיים מהעבר (מ-Yahoo Finance), לבדיקה פרטית בלבד ולא להפצה. לשונית "שוק", המנוי, התשלום, הקהילה וההתחברות עם Google ו-Apple הם הדגמה.</p>
    <p><b>תוכן השיעורים:</b> טיוטה שנכתבה לפי מקורות (בעיקר Investor.gov של ה-SEC והגדרות מויקיפדיה). עדיין לא נבדקה על ידי מומחה, ואין בה תוכן ישראלי ספציפי כמו מסים וחוקים.</p>
    <p><b>הפרטיות שלכם:</b> הכול נשמר רק בדפדפן שלכם. אין שרת ואין איסוף נתונים. משוב נשלח רק אם תבחרו לשלוח אותו.</p></div>
    <button class="btn ghost" id="abfb" style="margin-top:12px">משוב על האפליקציה</button>
    <button class="btn ghost danger" id="abrs" style="margin-top:10px">מחיקת כל הנתונים במכשיר הזה</button>`);
  $('#abfb').onclick = () => { closeSheet(); setTimeout(openFeedback, 280); };
  $('#abrs').onclick = () => { if (confirm('למחוק את כל החשבונות וההתקדמות במכשיר הזה?')) { try { localStorage.clear(); } catch (e) { } location.reload(); } };
}
function showWelcomeOnce() {
  const ac = A(); if (!ac || ac.seenWelcome) return; ac.seenWelcome = true; save();
  setTimeout(() => openSheet(`<span class="tag">ברוכים הבאים</span><h3 style="margin-top:8px">זו גרסת ניסוי</h3>
    <div class="steps2"><div><i>1</i><span>זה אב טיפוס. חלק מהדברים עוד לא סופיים, והמנוי והתשלום הם הדגמה בלבד.</span></div>
    <div><i>2</i><span>השיעורים והתרגול הם ללימוד בלבד, בלי ייעוץ השקעות ובלי כסף אמיתי. בתרגול רואים נתוני שוק אמיתיים מהעבר.</span></div>
    <div><i>3</i><span>מה הכי עוזר לנו: לנסות שיעור אחד ושני מקרי תרגול, ואז ללחוץ על "משוב" בפרופיל ולספר מה הבנתם, מה לא, ומה היה משעמם.</span></div></div>
    <button class="btn primary" data-close="1" style="margin-top:14px">מתחילים</button>`), 900);
}
/* friendly notice when something breaks, and the details travel with the feedback */
let errShown = false;
function onAppError(msg) {
  FB_ERRORS.push(String(msg).slice(0, 90)); if (errShown) return; errShown = true;
  const b = document.createElement('div'); b.className = 'errbar'; b.innerHTML = '<span>משהו לא עבד כמו שצריך. אם זה חוזר, שלחו לנו משוב ונתקן.</span><button class="link" id="erfb">משוב</button><button class="link" id="erx" aria-label="סגירה">✕</button>';
  $('#phone').appendChild(b); $('#erx').onclick = () => b.remove(); $('#erfb').onclick = () => { b.remove(); openFeedback(); };
}
window.addEventListener('error', (e) => onAppError((e.message || 'error') + (e.lineno ? ' @' + e.lineno : '')));
window.addEventListener('unhandledrejection', (e) => onAppError('promise: ' + ((e.reason && e.reason.message) || e.reason)));
const _homeScreen = screens.home; screens.home = (a) => { _homeScreen(a); showWelcomeOnce(); };

/* a small feedback button that stays on every screen, bottom left */
(function () {
  const b = document.createElement('button'); b.id = 'fbfab'; b.className = 'fbfab'; b.setAttribute('aria-label', 'משוב');
  b.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/><path d="M12 8.5v3M12 13.6v.01"/></svg><span>משוב</span>';
  b.onclick = openFeedback; $('#phone').appendChild(b);
})();
