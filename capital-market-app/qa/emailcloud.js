const { launch, APP } = require('./lib');
(async()=>{ const issues=[]; const ok=(c,m)=>{if(!c)issues.push(m)};
 const {b,p,errs}=await launch(390,844);
 p.on('dialog', d=>{ d.accept(globalThis.__pw||'secret1'); });
 await p.addInitScript(()=>{ window.__store={}; window.__users={}; window.__log=[]; window.__cur=null;
  const err=(c)=>{const e=new Error(c); e.code=c; return e;};
  window.__FBMOCK={ async signIn(){ const u={uid:'gB',name:'גוגל',email:'m@y.co'}; return u; },
   async createUser(em,pw){ if(__users[em]) throw err('auth/email-already-in-use'); if(pw.length<6) throw err('auth/weak-password'); const u={uid:'p'+Object.keys(__users).length,email:em,pw}; __users[em]=u; __log.push('create '+em); return {uid:u.uid,email:em,name:''}; },
   async signInEmail(em,pw){ const u=__users[em]; if(!u||u.pw!==pw) throw err('auth/invalid-credential'); __log.push('signin '+em); return {uid:u.uid,email:em,name:''}; },
   async sendReset(em){ __log.push('reset '+em); },
   async getDoc(u){ return __store[u]||null; }, async setDoc(u,d){ __store[u]=Object.assign(__store[u]||{},d); }, async signOut(){__log.push('out')}, async deleteAccount(u,pw){ __log.push('del '+u+' '+pw); delete __store[u]; }, async redirectUser(){return null}, async currentUser(){return null} };
  if(!sessionStorage.getItem('i')){ sessionStorage.setItem('i','1'); localStorage.setItem('cm_ea','1'); localStorage.setItem('cm_proto_v2', JSON.stringify({accounts:{}, session:null, terms:{v:3}, seenOnboarding:true})); } });
 await p.goto(APP); await p.waitForTimeout(500);
 const closeS=async()=>{ await p.waitForTimeout(1800); await p.evaluate(()=>closeSheetNow()); await p.waitForTimeout(200); };
 const acct=()=>p.evaluate(()=>({k:Object.keys(loadDB().accounts), a:A()&&{uid:A().uid,cp:A().cloudPass,pass:A().pass,name:A().name}}));
 ok(await p.evaluate(()=>emailCloud()),'emailCloud flag on');
 // 1. signup, short password rejected, then ok
 await p.evaluate(()=>go('signup')); await p.waitForTimeout(400);
 await p.fill('#nm','דנה'); await p.fill('#age','17'); await p.fill('#em','D@X.co'); await p.fill('#pw','abcd'); await p.click('#go'); await p.waitForTimeout(300);
 ok(/6/.test(await p.evaluate(()=>document.querySelector('#e-pw').textContent)),'short password shows 6-char message');
 await p.fill('#pw','secret1'); await p.click('#go'); await p.waitForTimeout(1200);
 let a=await acct(); ok(a.k[0]==='d@x.co'&&a.a.cp&&a.a.uid==='p0'&&a.a.pass==='','1: cloud account created, no local password: '+JSON.stringify(a));
 ok(await p.evaluate(()=>__log.includes('create d@x.co')),'1: firebase createUser called');
 await p.evaluate(()=>{ A().lessonsDone=['l1','l2']; A().stars=2; save(); }); await p.waitForTimeout(2200);
 ok(await p.evaluate(()=>JSON.stringify(__store.p0&&__store.p0.lessonsDone))==='["l1","l2"]','1: progress in cloud');
 // 2. logout, wrong pw, right pw, new device restore
 await closeS(); await p.evaluate(()=>go('profile')); await p.waitForTimeout(400); await p.click('#lo'); await p.waitForTimeout(500);
 await p.fill('#em','d@x.co'); await p.fill('#pw','wrongpw'); await p.click('#go'); await p.waitForTimeout(500);
 ok(/לא נכונים/.test(await p.evaluate(()=>document.querySelector('#e-pw').textContent)),'2: wrong password message');
 await p.evaluate(()=>{ loadDB().accounts={}; save(); }); // wipe local = new device
 await p.fill('#pw','secret1'); await p.click('#go'); await p.waitForTimeout(1200);
 a=await acct(); ok(await p.evaluate(()=>cur.name)==='home','2: login reaches home'); ok(a.a&&a.a.name==='דנה','2: name restored from cloud: '+JSON.stringify(a)); ok(await p.evaluate(()=>A().lessonsDone.length)===2,'2: progress restored on new device');
 // 3. duplicate signup
 await closeS(); await p.evaluate(()=>{ loadDB().session=null; save(); loadDB().accounts={}; go('signup'); }); await p.waitForTimeout(400);
 await p.fill('#nm','אחר'); await p.fill('#age','20'); await p.fill('#em','d@x.co'); await p.fill('#pw','secret2'); await p.click('#go'); await p.waitForTimeout(600);
 ok(/כבר יש חשבון/.test(await p.evaluate(()=>document.querySelector('#e-em').textContent)),'3: duplicate email message');
 // 4. forgot password
 await p.evaluate(()=>go('login')); await p.waitForTimeout(400); await p.fill('#em','d@x.co'); await p.click('#fg'); await p.waitForTimeout(500);
 ok(await p.evaluate(()=>__log.includes('reset d@x.co')),'4: reset email requested');
 // 5. legacy local account migrates
 await p.evaluate(()=>{ const d=loadDB(); d.accounts={}; const x=newAcct('ישן',16,'old@x.co','oldpass','x'); x.lessonsDone=['l1']; d.accounts['old@x.co']=x; d.session=null; save(); go('login'); }); await p.waitForTimeout(400);
 await p.fill('#em','old@x.co'); await p.fill('#pw','oldpass'); await p.click('#go'); await p.waitForTimeout(1500);
 a=await acct(); ok(await p.evaluate(()=>cur.name)==='home','5: legacy login works'); ok(a.a.cp&&a.a.pass===''&&a.a.uid,'5: legacy account moved to cloud: '+JSON.stringify(a)); ok(await p.evaluate(()=>__log.includes('create old@x.co')),'5: createUser for migration');
 // 6. password account then Google with same email -> one account, both uids
 await closeS(); await p.evaluate(()=>{ loadDB().session=null; save(); go('login'); }); await p.waitForTimeout(400);
 await p.evaluate(()=>{ const d=loadDB(); d.accounts={}; const x=newAcct('מייל',16,'m@y.co','',''); x.pass=''; x.cloudPass=true; x.uid='pm'; x.uids=['pm']; x.lessonsDone=['l1']; d.accounts['m@y.co']=x; __store.pm={lessonsDone:['l1','l3']}; save(); });
 await p.click('[data-prov=google]'); await p.waitForTimeout(1500);
 a=await acct(); ok(a.k.length===1&&a.k[0]==='m@y.co','6: one account'); ok(await p.evaluate(()=>A().uids.sort().join())==='gB,pm','6: both uids kept: '+await p.evaluate(()=>A().uids)); ok(await p.evaluate(()=>A().lessonsDone.slice().sort().join())==='l1,l3','6: progress merged from both ids');
 ok(await p.evaluate(()=>A().cloudPass===true),'6: password kept after google link');
 // 7. delete cloud-password account
 await closeS(); await p.evaluate(()=>{ go('profile'); }); await p.waitForTimeout(500); globalThis.__pw='mypw123'; await p.click('#rs'); await p.click('#rs'); await p.waitForTimeout(800);
 ok(await p.evaluate(()=>__log.some(x=>/^del /.test(x)&&/mypw123/.test(x))),'7: password passed to deleteAccount: '+await p.evaluate(()=>__log.slice(-3)));
 const u=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e)); if(u.length) issues.push('errors '+u.join('|').slice(0,250));
 console.log('ISSUES',issues.length); issues.forEach(i=>console.log(' -',i)); await b.close(); })();
