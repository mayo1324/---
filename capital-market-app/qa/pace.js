const { launch, APP, seed } = require('./lib');
(async()=>{ const issues=[]; const ok=(c,m)=>{if(!c)issues.push(m)};
 const {b,p,errs}=await launch(390,844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(500);
 await p.evaluate(()=>{ const d=loadDB(); const a=newAcct('נועה',16,'n@x.co','abcd','x'); a.seenIntro=a.seenWelcome=true; d.accounts['n@x.co']=a; d.session='n@x.co'; save(); go('home'); }); await p.waitForTimeout(700);
 ok(await p.evaluate(()=>!!document.querySelector('.today')),'today tasks card shown');
 const doLesson = async(id)=>{ await p.evaluate(id=>go('lesson',id),id); await p.waitForTimeout(450);
   for(let i=0;i<40&&(await p.evaluate(()=>cur.name))==='lesson';i++){ const q=await p.evaluate(()=>!!document.querySelector('.opt')); if(q){ const k=await p.evaluate(id=>{const L=LESSONS.find(l=>l.id===id); const qs=L.qs||[L.q]; const qi=+((document.querySelector('.tag').textContent.match(/(\d) מתוך/)||[0,1])[1])-1; return qs[qi].a;},id); await p.click(`.opt[data-k="${k}"]`);} await p.click('#nx'); await p.waitForTimeout(260);} };
 await doLesson('l1'); await p.waitForTimeout(600);
 ok(await p.evaluate(()=>cur.name)==='lessonDone','first lesson completes');
 ok(await p.evaluate(()=>/מחר נפתח שיעור חדש/.test(scr.innerText)),'lessonDone teases tomorrow');
 ok(await p.evaluate(()=>todayNew('l'))===1,'todayNew counts the lesson');
 // second lesson blocked today
 await p.evaluate(()=>go('lesson','l10')); await p.waitForTimeout(800);
 ok(await p.evaluate(()=>cur.name)==='lessons','second lesson today is redirected to list: '+await p.evaluate(()=>cur.name));
 ok(await p.evaluate(()=>/השיעור הבא נפתח מחר/.test(document.body.innerText)),'message about tomorrow visible');
 ok(await p.evaluate(()=>!!document.querySelector('.daynote')&&!!document.querySelector('.pn.paced')),'lessons list shows paced state');
 await p.evaluate(()=>go('home')); await p.waitForTimeout(600);
 ok(await p.evaluate(()=>/מחר ממשיכים/.test(scr.innerText)),'home says continue tomorrow'); ok(await p.evaluate(()=>document.querySelector('.hero2').dataset.go==='practiceHome'),'home hero points to practice when waiting');
 // already finished lesson can be replayed
 await p.evaluate(()=>go('lesson','l1')); await p.waitForTimeout(500); ok(await p.evaluate(()=>cur.name)==='lesson','done lessons stay open');
 // practice: first new case ok, second blocked
 await p.evaluate(()=>go('practiceHome')); await p.waitForTimeout(600);
 const runCase = async(i)=>{ await p.evaluate(i=>{A().seenIntro=true;go('practice',i)},i); await p.waitForTimeout(500); if(await p.evaluate(()=>cur.name)!=='practice') return false;
   await p.click('.opt[data-k]'); await p.click('#pn'); let s=await p.evaluate(()=>__st.step); if(s==='line'){const r=await p.locator('#ch').boundingBox(); await p.mouse.move(r.x+r.width*.15,r.y+r.height*.7);await p.mouse.down();await p.mouse.move(r.x+r.width*.7,r.y+r.height*.4,{steps:6});await p.mouse.up();await p.click('#pn');}
   s=await p.evaluate(()=>__st.step); if(s==='volume'){await p.click('.opt[data-k]');await p.click('#pn');}
   await p.click('.opt[data-k="wait"]'); await p.click('#pn'); await p.waitForFunction(()=>cur.name==='feedback',null,{timeout:60000}); await p.waitForTimeout(400); return true; };
 ok(await runCase(0),'first new case allowed'); ok(await p.evaluate(()=>todayNew('c'))===1,'todayNew counts case');
 ok(!(await runCase(1)),'second new case today must be blocked');
 ok(await p.evaluate(()=>cur.name)==='practiceHome','redirected to practice home');
 await p.waitForTimeout(500); ok(await p.evaluate(()=>/נפתח מחר/.test(scr.innerText)),'practice home shows tomorrow label');
 ok(await runCase(0),'replaying a tried case is allowed');
 // next day: move dates back one day
 await p.evaluate(()=>{ const f=A().firstDay; Object.keys(f.l).forEach(k=>f.l[k]='2020-01-01'); Object.keys(f.c).forEach(k=>f.c[k]='2020-01-01'); save(); });
 await p.evaluate(()=>go('lesson','l10')); await p.waitForTimeout(600); ok(await p.evaluate(()=>cur.name)==='lesson','new day: next lesson opens');
 ok(await runCase(1),'new day: next case opens');
 // premium / openAll bypass
 await p.evaluate(()=>{ A().premium=true; save(); }); await p.evaluate(()=>go('lesson','l11')); await p.waitForTimeout(500);
 ok(await p.evaluate(()=>cur.name)==='lesson','premium skips pace (module B? l11 is module A)');
 // existing account without firstDay gets defaults
 await p.evaluate(()=>{ const d=loadDB(); delete d.accounts['n@x.co'].firstDay; DB=null; }); ok(await p.evaluate(()=>{ const a=loadDB().accounts['n@x.co']; return !!(a.firstDay&&a.firstDay.l&&a.firstDay.c); }),'firstDay default filled');
 const u=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e)); if(u.length) issues.push('errors '+u.join('|').slice(0,250));
 console.log('ISSUES',issues.length); issues.forEach(i=>console.log(' -',i)); await b.close(); })();
