const { launch, APP, seed, mkAcct } = require('./lib');
(async()=>{ const {b,p}=await launch(360,740); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(400); await p.evaluate(mkAcct); await p.evaluate(()=>go('market')); await p.waitForTimeout(800);
 console.log('idle', await p.evaluate(()=>getComputedStyle(document.querySelector('#fbfab')).opacity));
 await p.evaluate(()=>document.querySelector('#screen').scrollBy(0,200)); await p.waitForTimeout(200);
 console.log('scrolling', await p.evaluate(()=>getComputedStyle(document.querySelector('#fbfab')).opacity), await p.evaluate(()=>document.body.className));
 await p.waitForTimeout(1200); console.log('after', await p.evaluate(()=>getComputedStyle(document.querySelector('#fbfab')).opacity));
 await b.close(); })();
