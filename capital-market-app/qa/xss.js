const { launch, APP, seed } = require('./lib');
(async()=>{ const issues=[]; const ok=(c,m)=>{if(!c)issues.push(m)};
 const {b,p,errs}=await launch(390,844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(400);
 await p.exposeFunction('__pwn',()=>{ issues.push('XSS EXECUTED'); });
 await p.evaluate(()=>go('signup')); await p.waitForTimeout(400);
 const payload='<img src=x onerror="__pwn()"><b>x</b>';
 await p.fill('#nm',payload); await p.fill('#age','20'); await p.fill('#em','x@y.co'); await p.fill('#pw','abcd'); await p.click('#go'); await p.waitForTimeout(900);
 await p.evaluate(()=>{closeSheetNow()});
 for (const n of ['home','profile','community','lessons','portfolio','market']) { await p.evaluate(n=>go(n),n); await p.waitForTimeout(500); }
 const injected = await p.evaluate(()=>!!document.querySelector('#phone img[src="x"]')); ok(!injected,'name rendered as HTML (img injected)');
 await p.evaluate(()=>go('community')); await p.waitForTimeout(500);
 const hasPost = await p.evaluate(()=>!!document.querySelector('textarea,#pt,#post'));
 console.log('community has input', hasPost);
 console.log('ISSUES',issues.length); issues.forEach(i=>console.log(' -',i)); await b.close(); })();
