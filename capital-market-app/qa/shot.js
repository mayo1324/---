const { launch, APP, seed, mkAcct } = require('./lib');
(async()=>{ const {b,p}=await launch(360,740); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(400); await p.evaluate(mkAcct);
 for (const n of process.argv.slice(2)) { await p.evaluate(n=>go(n),n); await p.waitForTimeout(800); await p.screenshot({path:`s_${n}.png`}); }
 await b.close(); })();
