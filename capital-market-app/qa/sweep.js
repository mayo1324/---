const { launch, APP, seed, mkAcct } = require('./lib');
(async () => {
  const issues=[]; 
  for (const W of [360,390,430]) {
    const { b, p, errs } = await launch(W,W===360?740:844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(400); await p.evaluate(mkAcct);
    const assets = await p.evaluate(()=>ASSETS.map(a=>a.id||a.t||a.sym));
    const screensList = [['home'],['lessons'],['market'],['portfolio'],['profile'],['glossary'],['community'],['practiceHome'],['paywall'],['terms'],['terms','view'],['onboarding',0],['onboarding',1],['onboarding',2],['login'],['signup'],['lessonDone',{id:'l1',gained:20,before:0}],...assets.slice(0,12).map(a=>['asset',a]),['feedback',{idx:0,st:{trend:'up',decision:'wait',line:null,volAns:null,plan:null},sim:{res:'none',at:5}}]];
    for (const [n,a] of screensList) {
      await p.evaluate(([n,a])=>{ try{ closeSheetNow(); }catch(e){} if(!['login','signup','onboarding'].includes(n)){ } go(n,a); },[n,a]); await p.waitForTimeout(650);
      const r = await p.evaluate(()=>{ const cw=document.documentElement.clientWidth; const out=[]; document.querySelectorAll('#phone *').forEach(e=>{ if(e.closest('svg')&&e.tagName!=='svg') return; if(e.tagName==='I'&&!e.textContent) return; if(e.tagName==='svg'&&e.parentElement&&e.parentElement.id==='phone') return; const b=e.getBoundingClientRect(); if(b.width===0||b.height===0) return; const cs=getComputedStyle(e); if(cs.position==='fixed') return; if(e.closest('.ticker,.tr,.confetti,.rays,.hero')) return; if(b.right>cw+2||b.left<-2){ out.push(e.tagName.toLowerCase()+'.'+String(e.className).slice(0,25)+' '+Math.round(b.left)+'..'+Math.round(b.right)); } });
        const clipped=[...document.querySelectorAll('#scr button,#scr .chip,#scr h1,#scr h2,#scr h3,#scr .tag,#scr b')].filter(e=>e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflow!=='visible'&&!e.closest('.ticker')).map(e=>e.className+':'+(e.textContent||'').slice(0,20));
        return {out:out.slice(0,4),clipped:clipped.slice(0,3),name:cur.name,bad:/NaN|undefined|\[object/.test(scr.innerText)}; });
      if (r.name!==n && !(n==='practiceHome')) issues.push(`${W}px ${n}: ended on ${r.name}`);
      if (r.out.length) issues.push(`${W}px ${n}: overflow ${JSON.stringify(r.out)}`);
      if (r.clipped.length) issues.push(`${W}px ${n}: clipped text ${JSON.stringify(r.clipped)}`);
      if (r.bad) issues.push(`${W}px ${n}: NaN/undefined text`);
    }
    const u=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e)); if(u.length) issues.push(`${W}px errors: ${u.join(' | ')}`);
    await b.close();
  }
  console.log('ISSUES', issues.length); issues.forEach(i=>console.log(' -',i));
})();
