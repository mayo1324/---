const { launch, APP, seed, mkAcct } = require('./lib');
(async()=>{ const issues=[]; const ok=(c,m)=>{if(!c)issues.push(m)};
 const run = async (setup, fn) => { const {b,p,errs}=await launch(390,844); const got=[]; 
   await p.route(/firestore\.googleapis\.com/, async r=>{ try{ const j=JSON.parse(r.request().postData()); got.push(Object.fromEntries(Object.entries(j.fields).map(([k,v])=>[k,v.stringValue??v.integerValue]))); }catch(e){} await r.fulfill({status:200,contentType:'application/json',body:'{}'}); });
   await p.addInitScript(setup); await p.goto(APP); await p.waitForTimeout(800); await fn(p,got); const u=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e)); if(u.length) issues.push('errors '+u.join('|').slice(0,200)); await b.close(); return got; };
 // 1. normal flow
 let g = await run(seed(), async(p,got)=>{
   await p.evaluate(()=>go('signup')); await p.waitForTimeout(300);
   await p.fill('#nm','דני'); await p.fill('#age','17'); await p.fill('#em','t@t.co'); await p.fill('#pw','abcd'); await p.click('#go'); await p.waitForTimeout(2600);
   await p.evaluate(()=>{ closeSheetNow(); A().openAll=true; go('lesson','l1'); }); await p.waitForTimeout(400);
   for(let i=0;i<30&&(await p.evaluate(()=>cur.name))==='lesson';i++){ const q=await p.evaluate(()=>!!document.querySelector('.opt')); if(q){ const k=await p.evaluate(()=>{ const L=LESSONS.find(l=>l.id==='l1'); const qs=L.qs||[L.q]; const qi=+((document.querySelector('.tag').textContent.match(/(\d) מתוך/)||[0,1])[1])-1; return qs[qi].a; }); await p.click(`.opt[data-k="${k}"]`); } await p.click('#nx'); await p.waitForTimeout(280); }
   await p.evaluate(()=>go('paywall')); await p.waitForTimeout(300); await p.waitForTimeout(500); });
 const names = g.map(x=>x.e+(x.p?':'+x.p:'')); console.log(names.join(' '));
 ['app_open','signup_view','signup_done:email','lesson_start:l1','lesson_done:l1','paywall_view'].forEach(n=>ok(names.includes(n),'missing event '+n));
 ok(g.every(x=>x.vid&&x.vid.length>=16&&x.s==='app'&&Object.keys(x).sort().join()==='e,p,s,t,vid'),'event shape wrong'); ok(!JSON.stringify(g).match(/t@t\.co|דני|abcd/),'PII leaked into events');
 ok(new Set(g.map(x=>x.vid)).size===1,'vid must be stable');
 // 2. opt-out
 g = await run(()=>{ localStorage.setItem('cm_noanalytics','1'); localStorage.setItem('cm_proto_v2', JSON.stringify({accounts:{}, session:null, terms:{v:3}, seenOnboarding:true})); }, async p=>{ await p.evaluate(()=>go('signup')); await p.waitForTimeout(500); });
 ok(g.length===0,'opt-out must send nothing: '+g.length);
 // 3. toggle in profile
 g = await run(seed(), async(p,got)=>{ await p.evaluate(mkAcct); await p.evaluate(()=>go('profile')); await p.waitForTimeout(500); await p.click('#ana'); await p.waitForTimeout(200); const n0=got.length; await p.evaluate(()=>go('lessons')); await p.evaluate(()=>go('signup')); await p.waitForTimeout(600);
   ok(await p.evaluate(()=>localStorage.getItem('cm_noanalytics')==='1'),'toggle sets opt-out'); ok(got.length===n0,'events after opt-out: '+(got.length-n0)); });
 // 4. offline queue then flush
 { const {b,p,ctx}=await launch(390,844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(500); await ctx.setOffline(true); await p.evaluate(()=>{ track('lesson_done','l9'); }); await p.waitForTimeout(500);
   const q=await p.evaluate(()=>JSON.parse(localStorage.getItem('cm_evq')||'[]').length); ok(q>=1,'offline events kept in queue: '+q); await b.close(); }
 // 5. terms v3 re-ask and no events before approval
 g = await run(()=>{ localStorage.setItem('cm_proto_v2', JSON.stringify({accounts:{}, session:null, terms:{v:2}})); }, async p=>{ await p.waitForTimeout(600); ok(await p.evaluate(()=>cur.name)==='terms','old terms version re-asks'); });
 ok(g.length===0,'no events before terms approval: '+g.map(x=>x.e));
 console.log('ISSUES',issues.length); issues.forEach(i=>console.log(' -',i)); })();
