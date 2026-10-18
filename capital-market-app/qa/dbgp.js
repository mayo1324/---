const { launch, APP, seed, mkAcct } = require('./lib');
(async () => {
  const { b, p } = await launch(390,844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(400); await p.evaluate(mkAcct);
  for (const i of [4,6,14]) {
    await p.evaluate(i=>{A().seenIntro=true;go('practice',i)},i); await p.waitForTimeout(500);
    await p.click('.opt[data-k]'); await p.click('#pn'); 
    let s=await p.evaluate(()=>__st.step); if(s==='line'){const r=await p.locator('#ch').boundingBox(); await p.mouse.move(r.x+r.width*.15,r.y+r.height*.7);await p.mouse.down();await p.mouse.move(r.x+r.width*.7,r.y+r.height*.4,{steps:8});await p.mouse.up(); await p.click('#pn');}
    s=await p.evaluate(()=>__st.step); if(s==='volume'){await p.click('.opt[data-k]');await p.click('#pn');}
    await p.click('.opt[data-k="enter"]'); await p.click('#pn');
    const r=await p.locator('#ch').boundingBox(); await p.mouse.click(r.x+r.width*.6,r.y+r.height*.7);
    console.log('case',i+1,'support',await p.evaluate(()=>[__st.support,__P.last,__P.swingLow,__P.atr]));
    const dis=await p.evaluate(()=>document.querySelector('#pn').disabled); console.log(' next disabled at support:',dis);
    if(dis){ await p.screenshot({path:`dbg_${i+1}.png`}); }
  }
  await b.close();
})();
