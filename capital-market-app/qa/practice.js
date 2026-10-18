const { launch, APP, seed, mkAcct } = require('./lib');
(async () => {
  const mode = process.argv[2]||'enter'; const only = process.argv[3]?process.argv[3].split(',').map(Number):null;
  const { b, p, errs } = await launch(390,844); const issues=[];
  await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(400); await p.evaluate(mkAcct);
  const N = await p.evaluate(()=>SCEN.length); console.log('cases', N);
  for (let i=0;i<N;i++) { if (only && !only.includes(i)) continue;
    await p.evaluate(i=>{ A().seenIntro=true; go('practice',i); }, i); await p.waitForTimeout(500);
    const g = async (fn)=>p.evaluate(fn);
    const click = async (sel,t=2000)=>p.click(sel,{timeout:t});
    try {
      // read
      await click('.opt[data-k]'); await click('#pn');
      await p.waitForTimeout(150);
      let step = await g(()=>__st.step);
      if (step==='line') {
        const r = await p.locator('#ch').boundingBox();
        await p.mouse.move(r.x+r.width*.15, r.y+r.height*.7); await p.mouse.down(); await p.mouse.move(r.x+r.width*.45, r.y+r.height*.55,{steps:5}); await p.mouse.move(r.x+r.width*.7, r.y+r.height*.4,{steps:5}); await p.mouse.up();
        await p.waitForTimeout(100); await click('#pn');
      }
      step = await g(()=>__st.step);
      if (step==='volume') { await click('.opt[data-k]'); await click('#pn'); }
      step = await g(()=>__st.step);
      if (step!=='decide') issues.push(`case ${i+1}: expected decide got ${step}`);
      await click(`.opt[data-k="${mode==='enter'?'enter':'wait'}"]`); await click('#pn');
      if (mode==='enter') {
        const r = await p.locator('#ch').boundingBox();
        // support: click near lowest candle low
        const sup = await g(()=>{const e=__P; return e.swingLow}); 
        await p.mouse.click(r.x+r.width*.6, r.y+r.height*.7); await p.waitForTimeout(100);
        if (await g(()=>__st.support==null)) issues.push(`case ${i+1}: support not set by click`);
        await click('#pn');
        await click('#auto'); await click('#pn');
        await click('.rk'); await click('#pn');
        await p.waitForTimeout(100);
        const chips = await p.$$('#tg .chip'); if (chips.length) await chips[chips.length-1].click(); else issues.push(`case ${i+1}: no target chips`);
        const dis = await g(()=>document.querySelector('#pn').disabled); if (dis) issues.push(`case ${i+1}: next disabled at target (last chip)`);
        await click('#pn');
      }
      await p.waitForFunction(()=>cur.name==='feedback',null,{timeout:60000});
      await p.waitForTimeout(500);
      const fb = await g(()=>({ txt: scr.innerText.length, hasReveal: /20\d\d|19\d\d/.test(scr.innerText), over:[...document.querySelectorAll('#scr *')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&b.right>document.documentElement.clientWidth+1}).length, nan:/NaN|undefined|null/.test(scr.innerText), title:(scr.querySelector('h1,h2')||{}).textContent }));
      if (fb.nan) issues.push(`case ${i+1}: NaN/undefined in feedback`);
      if (fb.over) issues.push(`case ${i+1}: horizontal overflow in feedback (${fb.over})`);
      if (!fb.hasReveal) issues.push(`case ${i+1}: no reveal of dates in feedback`);
      console.log(`case ${i+1} ok`, fb.title);
    } catch(e) { issues.push(`case ${i+1}: ${e.message.slice(0,120)}`); await p.screenshot({path:`/tmp/claude-0/qa/fail_${mode}_${i+1}.png`}); }
  }
  console.log('ISSUES', issues.length); issues.forEach(i=>console.log(' -',i));
  const uniq=[...new Set(errs)]; console.log('ERRORS', uniq.length); uniq.slice(0,15).forEach(e=>console.log(' *',e));
  console.log('practiceDone', await p.evaluate(()=>JSON.stringify(A().practiceDone)));
  await b.close();
})();
