const { chromium } = require('playwright');
(async()=>{ const issues=[]; const ok=(c,m)=>{if(!c)issues.push(m)};
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); 
 const stub = (mode)=>({
  'firebase-app.js':'export const initializeApp=()=>({});',
  'firebase-auth.js':`export const getAuth=()=>({}); export const verifyPasswordResetCode=async(a,c)=>{ if(c==='bad') { const e=new Error('x'); e.code='auth/invalid-action-code'; throw e;} return 'dana@example.com'; }; export const confirmPasswordReset=async(a,c,p)=>{ window.__done=[c,p]; }; export const applyActionCode=async()=>{};`});
 const run=async(qs,fn)=>{ const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.route(/fonts\./, r=>r.abort()); await p.route(/gstatic\.com\/firebasejs\/10\.12\.2\/(.*)/, r=>{ const f=r.request().url().split('/').pop(); r.fulfill({status:200,contentType:'text/javascript',body:stub()[f]||''}); });
  await p.goto('http://localhost:8791/reset.html'+qs); await p.waitForTimeout(800); await fn(p); if(errs.length) issues.push('errors '+errs.join('|')); await ctx.close(); };
 await run('?mode=resetPassword&oobCode=good', async p=>{
   ok(/dana@example\.com/.test(await p.innerText('#box')),'shows the email');
   await p.screenshot({path:'/tmp/claude-0/qa/reset1.png'});
   await p.fill('#p1','abc'); await p.fill('#p2','abc'); await p.click('#go'); ok(/6 תווים/.test(await p.innerText('#e')),'short password message');
   await p.fill('#p1','secret12'); await p.fill('#p2','secret13'); await p.click('#go'); ok(/לא זהות/.test(await p.innerText('#e')),'mismatch message');
   await p.fill('#p2','secret12'); await p.click('#go'); await p.waitForTimeout(400); ok(/הסיסמה שונתה/.test(await p.innerText('#box')),'success message'); ok(JSON.stringify(await p.evaluate(()=>window.__done))==='["good","secret12"]','confirm called with code and password');
   ok((await p.getAttribute('.btn','href')).startsWith('app/index.html'),'button goes to the app'); await p.screenshot({path:'/tmp/claude-0/qa/reset2.png'}); });
 await run('?mode=resetPassword&oobCode=bad', async p=>{ ok(/פג תוקף/.test(await p.innerText('#box')),'bad code message'); });
 await run('', async p=>{ ok(/לא תקין/.test(await p.innerText('#box')),'missing code message'); });
 console.log('ISSUES',issues.length); issues.forEach(i=>console.log(' -',i)); await b.close(); })();
