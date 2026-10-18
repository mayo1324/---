const { launch, APP } = require('./lib');
(async()=>{ const issues=[]; const ok=(c,m)=>{if(!c)issues.push(m)};
 const {b,p,errs}=await launch(390,844);
 await p.addInitScript(()=>{ window.__store={}; window.__log=[]; window.__mode='ok';
  window.__FBMOCK={ async signIn(k){ if(__mode==='denied'){const e=new Error('x');e.code='auth/unauthorized-domain';throw e} if(__mode==='closed'){const e=new Error('x');e.code='auth/popup-closed-by-user';throw e} return {uid:'u9',name:'',email:'a@b.co'}; },
   async getDoc(u){ if(__mode==='readfail') throw new Error('offline'); return __store[u]||null; }, async setDoc(u,d){ if(__mode==='writefail') throw new Error('offline'); __store[u]=Object.assign(__store[u]||{},d); },
   async signOut(){__log.push('out')}, async deleteAccount(u){ if(__mode==='delfail') throw new Error('recent'); delete __store[u]; __log.push('del')}, async redirectUser(){return null}, async currentUser(){return null} };
  localStorage.setItem('cm_proto_v2', JSON.stringify({accounts:{}, session:null, terms:{v:3}, seenOnboarding:true})); });
 await p.goto(APP); await p.waitForTimeout(500);
 // merge unit tests
 const m = await p.evaluate(()=>{ const r=[]; 
   const a={lessonsDone:['l1'],practiceDone:{1:2},stars:3,xp:50,days:{},skills:{}}; mergeProgress(a,{lessonsDone:['l2','l1'],practiceDone:{1:1,2:3},stars:9,xp:10,days:{'2026-01-01':1}});
   r.push(JSON.stringify([a.lessonsDone,a.practiceDone,a.stars,a.xp]));
   const c={}; try{ mergeProgress(c,{}); r.push('empty ok '+JSON.stringify(c)); }catch(e){ r.push('EMPTY FAIL '+e.message) }
   const d={lessonsDone:['l1']}; try{ mergeProgress(d,null); r.push('null ok'); }catch(e){ r.push('NULL FAIL '+e.message) }
   const e2={}; try{ mergeProgress(e2,{lessonsDone:['x'],skills:{trend:{n:3,ok:2}},watch:['A']}); r.push('skills ok '+JSON.stringify(e2.skills)); }catch(e){ r.push('SKILLS FAIL '+e.message) }
   return r; }); console.log(m.join('\n'));
 ok(!m.some(x=>/FAIL/.test(x)),'merge threw');
 // sign in with no cloud doc, no name -> name falls back
 await p.evaluate(()=>go('login')); await p.waitForTimeout(400); await p.click('[data-prov=google]'); await p.waitForTimeout(900);
 let st = await p.evaluate(()=>({n:cur.name,a:A()&&{name:A().name,uid:A().uid,email:A().email}})); ok(st.n==='home','google signin -> home, got '+st.n); ok(st.a&&st.a.name,'google account has a name: '+JSON.stringify(st.a));
 // progress saved to cloud after change
 await p.evaluate(()=>{ A().lessonsDone.push('l1'); A().stars=2; save(); }); await p.waitForTimeout(2200);
 ok(await p.evaluate(()=>JSON.stringify(__store.u9&&__store.u9.lessonsDone))==='["l1"]','progress pushed to cloud');
 // write failure does not break app
 await p.evaluate(()=>{__mode='writefail'; A().stars=5; save();}); await p.waitForTimeout(2000); ok(await p.evaluate(()=>cur.name)==='home','write failure keeps app running');
 await p.evaluate(()=>{__mode='ok'});
 // logout clears session + signOut called
 await p.evaluate(()=>go('profile')); await p.waitForTimeout(400); await p.click('#lo'); await p.waitForTimeout(500);
 ok(await p.evaluate(()=>loadDB().session)===null,'logout clears session'); ok(await p.evaluate(()=>__log.includes('out')),'firebase signOut called');
 // sign in again -> cloud progress restored even if local wiped
 await p.evaluate(()=>{ delete loadDB().accounts['a@b.co']; save(); __store.u9.lessonsDone=['l1','l2','l3']; });
 await p.evaluate(()=>go('login')); await p.waitForTimeout(400); await p.click('[data-prov=google]'); await p.waitForTimeout(900);
 ok(await p.evaluate(()=>A().lessonsDone.length)===3,'cloud progress restored on new device: '+await p.evaluate(()=>A().lessonsDone));
 // errors
 for (const [mode,re] of [['denied',/לא מורשית/],['closed',null],['readfail',null]]) {
   await p.evaluate(()=>{loadDB().session=null;save();go('login')}); await p.waitForTimeout(400); await p.evaluate(m=>{__mode=m},mode); await p.click('[data-prov=google]'); await p.waitForTimeout(700);
   const t = await p.evaluate(()=>document.querySelector('.toast')&&document.querySelector('.toast').textContent);
   if(re) ok(re.test(t||''),`${mode}: toast missing (${t})`);
   const btn = await p.evaluate(()=>document.querySelector('[data-prov=google]')&&document.querySelector('[data-prov=google]').innerText); 
   if(mode!=='readfail') ok(btn&&/Google/.test(btn)&&!/מתחברים/.test(btn),`${mode}: button not restored (${btn})`);
 }
 // delete with failure keeps account, success removes
 await p.evaluate(()=>{__mode='ok';loadDB().session=null;save();go('login')}); await p.waitForTimeout(400); await p.click('[data-prov=google]'); await p.waitForTimeout(800);
 await p.evaluate(()=>{closeSheetNow();go('profile')}); await p.waitForTimeout(400); await p.evaluate(()=>{__mode='delfail'}); await p.click('#rs'); await p.click('#rs'); await p.waitForTimeout(600);
 ok(await p.evaluate(()=>!!loadDB().accounts['a@b.co']),'failed cloud delete must keep local account');
 await p.evaluate(()=>{__mode='ok'}); await p.click('#rs'); await p.waitForTimeout(700);
 ok(await p.evaluate(()=>!loadDB().accounts['a@b.co']&&!__store.u9),'delete removes local+cloud');
 const u=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e)); if(u.length) issues.push('errors '+u.join('|').slice(0,300));
 console.log('ISSUES',issues.length); issues.forEach(i=>console.log(' -',i)); await b.close(); })();
