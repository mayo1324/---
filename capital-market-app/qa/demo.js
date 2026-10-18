const { launch, APP, seed, mkAcct } = require('./lib');
(async()=>{ const {b,p,errs}=await launch(390,844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(400); await p.evaluate(mkAcct); await p.evaluate(()=>go('profile')); await p.waitForTimeout(500);
 console.log('hidden:', await p.evaluate(()=>!document.querySelector('#un')&&!document.querySelector('#ua')&&!/כלי הדגמה/.test(scr.innerText)));
 await p.goto(APP+'?demo=1'); await p.waitForTimeout(500); await p.evaluate(()=>go('profile')); await p.waitForTimeout(500);
 console.log('with ?demo=1:', await p.evaluate(()=>!!document.querySelector('#un')&&!!document.querySelector('#ua')));
 console.log('errors', [...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e))); await b.close(); })();
