const { launch, APP, seed, mkAcct } = require('./lib');
(async()=>{ const {b,p,errs}=await launch(390,844); const issues=[]; const ok=(c,m)=>{if(!c)issues.push(m)};
 await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(400); await p.evaluate(mkAcct);
 await p.evaluate(()=>{ A().lessonsDone=LESSONS.map(l=>l.id); save(); });
 console.log('portfolioOpen', await p.evaluate(()=>portfolioOpen()));
 const ids = await p.evaluate(()=>ASSETS.map(a=>a.id));
 for (const id of ids.slice(0,6)) {
   await p.evaluate(id=>{closeSheetNow();go('asset',id)},id); await p.waitForTimeout(500);
   const cash0 = await p.evaluate(()=>A().portfolio.cash);
   await p.click('#by'); await p.waitForTimeout(300);
   await p.click('#ok'); await p.waitForTimeout(500);
   const st = await p.evaluate(id=>({cash:A().portfolio.cash,pos:A().portfolio.pos[id],name:cur.name}),id);
   ok(st.cash<cash0,`${id}: cash did not drop`); ok(st.pos&&st.pos.qty>0,`${id}: no position`); ok(st.name==='asset',`${id}: not back at asset (${st.name})`);
   await p.evaluate(()=>closeSheetNow());
   await p.click('#sl'); await p.waitForTimeout(300); await p.click('.chip[data-v="50"]'); await p.click('#ok'); await p.waitForTimeout(500);
   const st2 = await p.evaluate(id=>({pos:A().portfolio.pos[id]}),id); ok(st2.pos&&st2.pos.qty>0,`${id}: half-sell removed all`);
   await p.evaluate(()=>closeSheetNow()); await p.click('#sl'); await p.waitForTimeout(300); await p.click('#ok'); await p.waitForTimeout(500);
   const st3 = await p.evaluate(id=>({pos:A().portfolio.pos[id],cash:A().portfolio.cash}),id); ok(!st3.pos||st3.pos.qty<1e-9,`${id}: full sell left a position ${JSON.stringify(st3.pos)}`);
   await p.evaluate(()=>closeSheetNow());
 }
 const eqv = await p.evaluate(()=>[equity(A()),A().portfolio.cash]); console.log('equity/cash after round trips', eqv);
 // drain cash
 await p.evaluate(()=>{A().portfolio.cash=30;save();}); await p.evaluate(id=>{go('asset',id)},ids[0]); await p.waitForTimeout(400); await p.click('#by'); await p.waitForTimeout(300);
 ok(await p.evaluate(()=>document.querySelector('#ok').disabled),'buy should be disabled when cash<50'); await p.evaluate(()=>closeSheetNow());
 await p.evaluate(()=>{A().portfolio.cash=1000000;save();}); await p.evaluate(()=>go('portfolio')); await p.waitForTimeout(600);
 for (const t of ['alloc','hist']) { }
 const nanTxt = await p.evaluate(()=>/NaN|undefined|Infinity/.test(scr.innerText)); ok(!nanTxt,'portfolio shows NaN');
 // equity chart etc: none
 console.log('ISSUES',issues.length); issues.forEach(i=>console.log(' -',i)); const u=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e)); console.log('ERRORS',u.length,u.slice(0,5));
 await b.close(); })();
