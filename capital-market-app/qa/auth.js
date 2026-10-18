const { launch, APP, seed } = require('./lib');
(async () => {
  const { b, p, errs } = await launch(390,844); const issues=[]; const ok=(c,m)=>{ if(!c) issues.push(m); };
  await p.addInitScript(()=>{ if(!sessionStorage.getItem('init')){ sessionStorage.setItem('init','1'); localStorage.setItem('cm_proto_v2', JSON.stringify({accounts:{}, session:null, terms:{v:2}, seenOnboarding:false})); } });
  await p.goto(APP); await p.waitForTimeout(600);
  const scrName = ()=>p.evaluate(()=>cur.name);
  ok(await scrName()==='onboarding','first screen should be onboarding, got '+await scrName());
  // go to signup
  await p.evaluate(()=>go('signup')); await p.waitForTimeout(500);
  // empty submit
  await p.click('#go'); await p.waitForTimeout(200);
  const errTxt = await p.evaluate(()=>[...document.querySelectorAll('[id^=e-]')].map(e=>e.textContent).filter(Boolean));
  ok(errTxt.length>=3, 'empty signup should show >=3 errors, got '+errTxt.length);
  // under age
  await p.fill('#nm','א'); await p.fill('#age','12'); await p.fill('#em','bad'); await p.fill('#pw','12'); await p.click('#go'); await p.waitForTimeout(200);
  const e2 = await p.evaluate(()=>[...document.querySelectorAll('[id^=e-]')].map(e=>e.textContent));
  ok(e2.some(t=>/15/.test(t)),'underage message missing'); ok(e2.some(t=>/אימייל/.test(t)),'bad email message missing'); ok(e2.some(t=>/4/.test(t)),'short password message missing');
  // valid
  await p.fill('#nm','דני'); await p.fill('#age','17'); await p.fill('#em','Dani@Test.com'); await p.fill('#pw','abcd'); await p.click('#go'); await p.waitForTimeout(900);
  ok(await scrName()!=='signup','valid signup should leave signup, at '+await scrName());
  await p.evaluate(()=>{ if(typeof closeSheetNow==='function') closeSheetNow(); });
  const acct = await p.evaluate(()=>({k:Object.keys(loadDB().accounts), s:loadDB().session, n:A()&&A().name}));
  ok(acct.k.includes('dani@test.com'),'email should be lowercased as key: '+acct.k); ok(acct.n==='דני','name saved');
  // logout via profile
  await p.waitForTimeout(2500); await p.evaluate(()=>{closeSheetNow();go('profile')}); await p.waitForTimeout(500); await p.click('#lo'); await p.waitForTimeout(500);
  ok(await scrName()==='login','logout should go to login, at '+await scrName());
  ok(await p.evaluate(()=>loadDB().session)===null,'session cleared');
  // login wrong pw
  await p.fill('#em','dani@test.com'); await p.fill('#pw','zzzz'); await p.click('#go'); await p.waitForTimeout(200);
  ok((await p.evaluate(()=>document.querySelector('#e-pw').textContent)).length>0,'wrong password should show error');
  await p.fill('#em','nobody@x.co'); await p.click('#go'); await p.waitForTimeout(200);
  ok(/לא מצאנו/.test(await p.evaluate(()=>document.querySelector('#e-em').textContent)),'unknown email error');
  // correct login with uppercase email
  await p.fill('#em','  DANI@test.com '); await p.fill('#pw','abcd'); await p.click('#go'); await p.waitForTimeout(800);
  ok(await scrName()==='home','login should reach home, at '+await scrName());
  // duplicate signup
  await p.evaluate(()=>{ loadDB().session=null; save(); go('signup'); }); await p.waitForTimeout(400);
  await p.fill('#nm','דני2'); await p.fill('#age','20'); await p.fill('#em','dani@test.com'); await p.fill('#pw','abcd'); await p.click('#go'); await p.waitForTimeout(200);
  ok(/כבר יש חשבון/.test(await p.evaluate(()=>document.querySelector('#e-em').textContent)),'duplicate email error');
  // reload persistence
  await p.evaluate(()=>{ const d=loadDB(); d.session='dani@test.com'; save(); go('home'); }); await p.reload(); await p.waitForTimeout(800);
  ok(await scrName()==='home','reload should keep session, at '+await scrName());
  // password eye toggle
  await p.evaluate(()=>go('login')); await p.waitForTimeout(500); await p.evaluate(()=>{loadDB().session=null}); 
  await p.click('[data-eye="pw"]'); ok(await p.evaluate(()=>document.querySelector('#pw').type)==='text','eye toggles to text');
  // google demo (no cloud config in tests? CLOUD_ON true) -> with mock
  // delete account
  await p.evaluate(()=>{ const d=loadDB(); d.session='dani@test.com'; save(); go('profile'); }); await p.waitForTimeout(500);
  await p.click('#rs'); await p.click('#rs'); await p.waitForTimeout(800);
  ok(!(await p.evaluate(()=>Object.keys(loadDB().accounts))).includes('dani@test.com'),'account deleted');
  console.log('screen after delete:', await scrName());
  console.log('ISSUES', issues.length); issues.forEach(i=>console.log(' -',i));
  const uniq=[...new Set(errs)]; console.log('ERRORS', uniq.length); uniq.forEach(e=>console.log(' *',e));
  await b.close();
})();
