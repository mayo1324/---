const { launch, APP, seed, mkAcct } = require('./lib');
(async()=>{ const issues=[]; const ok=(c,m)=>{if(!c)issues.push(m)};
 // 1. hash routes with logged in account
 for (const h of ['lesson','lesson/zzz','practice','asset','feedback','nonexistent','lessonDone','community','market','portfolio','profile','glossary','paywall','paysuccess','terms']) {
   const {b,p,errs}=await launch(390,844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(300); await p.evaluate(mkAcct);
   await p.goto(APP+'#'+h); await p.reload(); await p.waitForTimeout(900);
   const st = await p.evaluate(()=>({n:cur&&cur.name, txt:scr.innerText.length, bad:/NaN|undefined|\[object/.test(scr.innerText)}));
   const u=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e));
   if(u.length) issues.push(`hash #${h}: errors ${u.join(' | ').slice(0,200)}`); if(!st.txt) issues.push(`hash #${h}: blank screen (${st.n})`); if(st.bad) issues.push(`hash #${h}: bad text`);
   await b.close();
 }
 // 2. logged out + hash to protected screens
 for (const h of ['home','lessons','profile','portfolio']) {
   const {b,p,errs}=await launch(390,844); await p.addInitScript(seed()); await p.goto(APP+'#'+h); await p.waitForTimeout(800);
   const n=await p.evaluate(()=>cur.name); if(!['login','signup','onboarding'].includes(n)) issues.push(`logged-out #${h} shows ${n}`);
   const u=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e)); if(u.length) issues.push(`logged-out #${h}: ${u.join('|').slice(0,150)}`); await b.close();
 }
 // 3. bot
 { const {b,p,errs}=await launch(390,844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(300); await p.evaluate(mkAcct); await p.evaluate(()=>go('home')); await p.waitForTimeout(600);
   await p.click('#botfab'); await p.waitForTimeout(500);
   const hasInput = await p.evaluate(()=>!!document.querySelector('#sheet input, #sheet textarea')); ok(hasInput,'bot has input');
   for (const q of ['מה זה מניה','איך מתרגלים','איפה התיק שלי','מי ראש הממשלה','','א','<script>alert(1)</script>','סטופ','אפל','איך מוחקים חשבון']) {
     await p.evaluate(q=>{ const i=document.querySelector('#sheet input, #sheet textarea'); if(i){ i.value=q; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})); const f=i.closest('form'); if(f) f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); const b=document.querySelector('#sheet button[type=submit],#sheet #bsend,#sheet .send'); if(b) b.click(); } },q); await p.waitForTimeout(200);
   }
   const inj = await p.evaluate(()=>!!document.querySelector('#sheet script')); ok(!inj,'bot XSS: script element injected');
   const bad = await p.evaluate(()=>/NaN|undefined/.test(document.querySelector('#sheet').innerText)); ok(!bad,'bot text has undefined');
   const u=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e)); if(u.length) issues.push('bot errors '+u.join('|').slice(0,200)); await b.close(); }
 // 4. feedback
 { const {b,p,errs}=await launch(390,844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(300); await p.evaluate(mkAcct); await p.evaluate(()=>go('home')); await p.waitForTimeout(600);
   await p.evaluate(()=>{ window.__opened=[]; window.open=(u)=>{window.__opened.push(u); return {}}; Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window.__clip=t}},configurable:true}); });
   await p.click('#fbfab'); await p.waitForTimeout(500);
   const sheetTxt = await p.evaluate(()=>document.querySelector('#sheet').innerText); ok(sheetTxt.length>20,'feedback sheet empty');
   ok(!/NaN|undefined/.test(sheetTxt),'feedback sheet bad text');
   // click through stars
   const stars = await p.$$('#sheet [data-star], #sheet .star'); console.log('star buttons', stars.length);
   if (stars.length) await stars[stars.length-1].click(); await p.waitForTimeout(150);
   const chipsN = await p.$$('#sheet .chip'); if (chipsN.length) await chipsN[0].click(); await p.waitForTimeout(150);
   const send = await p.$('#sheet #fbsend, #sheet #fbs, #sheet .btn.primary'); if (send) { await send.click(); await p.waitForTimeout(400); }
   const op = await p.evaluate(()=>({o:window.__opened,c:window.__clip})); console.log('feedback open/clip', JSON.stringify(op).slice(0,300));
   ok(op.o.length===1 && /wa\.me\/972584363245/.test(op.o[0]),'WhatsApp url wrong: '+JSON.stringify(op.o));
   const u=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e)); if(u.length) issues.push('feedback errors '+u.join('|').slice(0,200)); await b.close(); }
 console.log('ISSUES',issues.length); issues.forEach(i=>console.log(' -',i));
})();
