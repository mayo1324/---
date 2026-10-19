const { chromium } = require('playwright');
(async()=>{ const issues=[]; const ok=(c,m)=>{if(!c)issues.push(m)};
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 const stub={'firebase-app.js':'export const initializeApp=()=>({});',
  'firebase-auth.js':`let cb; export const getAuth=()=>({}); export class GoogleAuthProvider{ setCustomParameters(){} } export const onAuthStateChanged=(a,f)=>{ cb=f; setTimeout(()=>f({email:'wrong@x.com'}),50); }; export const signInWithPopup=async()=>{}; export const signOut=async()=>{ window.__out=1; cb&&cb(null); };`,
  'firebase-firestore.js':`export const getFirestore=()=>({}); export const collection=()=>({}); export const where=()=>({}); export const orderBy=()=>({}); export const limit=()=>({}); export const query=()=>({}); export const getDocs=async()=>{ const e=new Error('Missing or insufficient permissions.'); e.code='permission-denied'; throw e; };`};
 await p.route(/fonts\./, r=>r.abort()); await p.route(/gstatic\.com\/firebasejs\/10\.12\.2\/(.*)/, r=>{ const f=r.request().url().split('/').pop(); r.fulfill({status:200,contentType:'text/javascript',body:stub[f]||''}); });
 await p.goto('http://localhost:8791/admin.html'); await p.waitForTimeout(900);
 const t=await p.innerText('body'); ok(/wrong@x\.com/.test(t),'shows the signed-in email'); ok(/החלפת חשבון/.test(t),'shows switch account button'); ok(/לא זה שכתבתם/.test(t),'explains wrong account');
 await p.click('#sw'); await p.waitForTimeout(300); ok(await p.evaluate(()=>window.__out===1),'signOut called'); ok(await p.isVisible('#in'),'login button back');
 ok(errs.length===0,'errors '+errs.join('|'));
 console.log('ISSUES',issues.length,issues); await p.screenshot({path:'/tmp/claude-0/qa/admin2.png'}); await b.close(); })();
