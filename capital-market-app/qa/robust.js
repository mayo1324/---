const { launch, APP, seed, mkAcct } = require('./lib');
(async()=>{ const issues=[]; const ok=(c,m)=>{if(!c)issues.push(m)};
 // corrupt storage
 for (const [name,init] of [['corrupt json',()=>localStorage.setItem('cm_proto_v2','{bad')],['empty obj',()=>localStorage.setItem('cm_proto_v2','{}')],['storage throws',()=>{ Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}}); }],['old account shape',()=>localStorage.setItem('cm_proto_v2',JSON.stringify({accounts:{'a@b.co':{name:'א',email:'a@b.co',pass:'x'}},session:'a@b.co',terms:{v:3}}))],['session points to missing acct',()=>localStorage.setItem('cm_proto_v2',JSON.stringify({accounts:{},session:'ghost@x.co',terms:{v:3}}))]]) {
   const {b,p,errs}=await launch(390,844); await p.addInitScript(init); await p.goto(APP); await p.waitForTimeout(900);
   const st = await p.evaluate(()=>({n:cur&&cur.name,len:scr.innerText.length})); 
   const u=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e)); 
   if(u.length) issues.push(`${name}: errors ${u.join('|').slice(0,200)}`); if(!st.len) issues.push(`${name}: blank screen (${st.n})`);
   if(name==='old account shape'){ for(const s of ['home','lessons','profile','market','portfolio','practiceHome','community']){ await p.evaluate(s=>go(s),s); await p.waitForTimeout(400); } const u2=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e)); if(u2.length) issues.push(`${name}: screens errors ${u2.join('|').slice(0,250)}`); }
   console.log(name,'->',st.n); await b.close(); }
 // rapid interaction
 { const {b,p,errs}=await launch(390,844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(300); await p.evaluate(mkAcct); await p.evaluate(()=>go('home')); await p.waitForTimeout(600);
   for (let i=0;i<25;i++){ const ids=['lessons','market','home','portfolio','practiceHome']; await p.evaluate(id=>{const t=document.querySelector(`.tb[data-id="${id}"]`); t&&t.click()},ids[i%5]); await p.waitForTimeout(40); }
   await p.waitForTimeout(800); const st=await p.evaluate(()=>({n:cur.name,cls:scr.className,len:scr.innerText.length})); ok(st.len>10&&!/leaving/.test(st.cls),`rapid tab clicks left screen in bad state ${JSON.stringify(st)}`);
   await p.evaluate(()=>go('lesson','l1')); await p.waitForTimeout(500);
   for(let i=0;i<8;i++){ await p.evaluate(()=>{const n=document.querySelector('#nx'); n&&n.click(); n&&n.click(); n&&n.click()}); await p.waitForTimeout(30); }
   await p.waitForTimeout(800); const l=await p.evaluate(()=>({n:cur.name,txt:scr.innerText.slice(0,60)})); console.log('rapid next ->',JSON.stringify(l));
   const u=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e)); if(u.length) issues.push('rapid errors '+u.join('|').slice(0,200)); await b.close(); }
 // resize / landscape
 { const {b,p,errs}=await launch(390,844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(300); await p.evaluate(mkAcct); await p.evaluate(()=>go('home')); await p.waitForTimeout(500);
   await p.setViewportSize({width:844,height:390}); await p.waitForTimeout(400); const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,iw:innerWidth})); console.log('landscape',JSON.stringify(o)); 
   await p.screenshot({path:'land_app.png'}); await p.setViewportSize({width:1280,height:900}); await p.waitForTimeout(400); await p.screenshot({path:'desk_app.png'}); await b.close(); }
 console.log('ISSUES',issues.length); issues.forEach(i=>console.log(' -',i)); })();
