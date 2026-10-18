const { launch, APP } = require('./lib');
(async()=>{ const issues=[]; const ok=(c,m)=>{if(!c)issues.push(m)};
 const {b,p,errs}=await launch(390,844);
 await p.addInitScript(()=>{ window.__store={}; window.__user={uid:'u5',name:'דנה גוגל',email:'X@Y.co'};
  window.__FBMOCK={ async signIn(){ return window.__user; }, async getDoc(u){ return __store[u]||null; }, async setDoc(u,d){ __store[u]=Object.assign(__store[u]||{},d); }, async signOut(){}, async deleteAccount(u){delete __store[u]}, async redirectUser(){return null}, async currentUser(){return null} };
  if(!sessionStorage.getItem('i')){ sessionStorage.setItem('i','1'); localStorage.setItem('cm_proto_v2', JSON.stringify({accounts:{}, session:null, terms:{v:3}, seenOnboarding:true})); } });
 await p.goto(APP); await p.waitForTimeout(500);
 const closeS=async()=>{ await p.waitForTimeout(1800); await p.evaluate(()=>closeSheetNow()); await p.waitForTimeout(250); };
 const accts = ()=>p.evaluate(()=>Object.keys(loadDB().accounts));
 // 1. password account, then Google with same email (different case)
 await p.evaluate(()=>go('signup')); await p.waitForTimeout(400);
 await p.fill('#nm','דנה סיסמה'); await p.fill('#age','17'); await p.fill('#em','x@y.co'); await p.fill('#pw','abcd'); await p.click('#go'); await p.waitForTimeout(900);
 await p.evaluate(()=>{ closeSheetNow(); A().lessonsDone=['l1','l2']; A().stars=2; save(); loadDB().session=null; save(); go('login'); }); await p.waitForTimeout(500);
 await closeS(); await p.click('[data-prov=google]'); await p.waitForTimeout(1200);
 let st = await p.evaluate(()=>({n:cur.name,s:loadDB().session,name:A().name,l:A().lessonsDone,uid:A().uid,noPass:!!A().noPass,toast:document.querySelector('.toast')&&document.querySelector('.toast').textContent}));
 ok(st.n==='home','1: home after google'); ok(st.s==='x@y.co','1: session key is lowercase email: '+st.s); ok((await accts()).length===1,'1: exactly one account: '+(await accts())); ok(st.name==='דנה סיסמה','1: local name kept: '+st.name); ok(st.l.length===2,'1: progress kept'); ok(st.uid==='u5','1: uid attached'); ok(!st.noPass,'1: password account must keep its password'); ok(/חיברנו/.test(st.toast||''),'1: linked toast: '+st.toast);
 await p.waitForTimeout(2000); ok(await p.evaluate(()=>JSON.stringify(__store.u5&&__store.u5.lessonsDone))==='["l1","l2"]','1: progress pushed to cloud after linking');
 // password login still works
 await p.evaluate(()=>{ closeSheetNow(); go('profile') }); await p.waitForTimeout(400); await closeS(); await p.click('#lo'); await p.waitForTimeout(500);
 await p.fill('#em','x@y.co'); await p.fill('#pw','abcd'); await p.click('#go'); await p.waitForTimeout(800); ok(await p.evaluate(()=>cur.name)==='home','1: password login still works after linking');
 // 2. Google first, then email signup/login with same email
 await p.evaluate(()=>{ closeSheetNow(); loadDB().accounts={}; loadDB().session=null; save(); window.__user={uid:'u6',name:'גוגל בלבד',email:'g@y.co'}; go('login'); }); await p.waitForTimeout(500);
 await closeS(); await p.click('[data-prov=google]'); await p.waitForTimeout(1000);
 ok(await p.evaluate(()=>A().noPass===true&&loadDB().session==='g@y.co'),'2: new google account keyed by email, noPass');
 await p.evaluate(()=>{ closeSheetNow(); loadDB().session=null; save(); go('signup'); }); await p.waitForTimeout(500);
 await p.fill('#nm','מישהו'); await p.fill('#age','20'); await p.fill('#em','G@Y.co'); await p.fill('#pw','abcd'); await p.click('#go'); await p.waitForTimeout(300);
 ok(/Google/.test(await p.evaluate(()=>document.querySelector('#e-em').textContent)),'2: signup with google email shows Google message');
 ok((await accts()).length===1,'2: signup must not create a duplicate');
 await p.evaluate(()=>go('login')); await p.waitForTimeout(400); await p.fill('#em','g@y.co'); await p.fill('#pw','abcd'); await p.click('#go'); await p.waitForTimeout(300);
 ok(/Google/.test(await p.evaluate(()=>document.querySelector('#e-pw').textContent)),'2: password login for google-only account explains Google');
 // 3. legacy g:uid account migrates
 await p.evaluate(()=>{ const d=loadDB(); d.accounts={}; const a=newAcct('ישן',16,'old@y.co','cloud:u7','x'); a.uid='u7'; a.lessonsDone=['l1']; d.accounts['g:u7']=a; d.session=null; save(); window.__user={uid:'u7',name:'ישן',email:'old@y.co'}; go('login'); }); await p.waitForTimeout(500);
 await closeS(); await p.click('[data-prov=google]'); await p.waitForTimeout(1000);
 ok(JSON.stringify(await accts())==='["old@y.co"]','3: legacy key migrated to email: '+JSON.stringify(await accts())); ok(await p.evaluate(()=>A().lessonsDone.length)===1,'3: legacy progress kept');
 // 4. legacy + password account both present -> merged
 await p.evaluate(()=>{ const d=loadDB(); d.accounts={}; const a=newAcct('סיסמה',16,'m@y.co','abcd','x'); a.lessonsDone=['l1']; d.accounts['m@y.co']=a; const g=newAcct('גוגל',16,'m@y.co','cloud:u8','x'); g.uid='u8'; g.lessonsDone=['l2','l3']; d.accounts['g:u8']=g; d.session=null; save(); window.__user={uid:'u8',name:'גוגל',email:'m@y.co'}; go('login'); }); await p.waitForTimeout(500);
 await closeS(); await p.click('[data-prov=google]'); await p.waitForTimeout(1000);
 ok(JSON.stringify(await accts())==='["m@y.co"]','4: merged into one account: '+JSON.stringify(await accts())); ok(await p.evaluate(()=>A().lessonsDone.slice().sort().join())==='l1,l2,l3','4: progress merged: '+await p.evaluate(()=>A().lessonsDone));
 // 5. no email from provider
 await p.evaluate(()=>{ const d=loadDB(); d.accounts={}; d.session=null; save(); window.__user={uid:'u9',name:'ללא מייל',email:''}; go('login'); }); await p.waitForTimeout(500);
 await closeS(); await p.click('[data-prov=google]'); await p.waitForTimeout(1000); ok(JSON.stringify(await accts())==='["g:u9"]','5: no-email account keyed by uid: '+JSON.stringify(await accts()));
 const u=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e)); if(u.length) issues.push('errors '+u.join('|').slice(0,300));
 console.log('ISSUES',issues.length); issues.forEach(i=>console.log(' -',i)); await b.close(); })();
