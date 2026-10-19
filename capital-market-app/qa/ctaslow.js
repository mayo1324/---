const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}); const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
 await p.route(/fonts\./, r=>r.abort()); await p.route(/firestore\.googleapis\.com/, ()=>{ /* never answer */ });
 await p.goto('http://localhost:8791/'); await p.waitForTimeout(500); const t0=Date.now(); await p.click('.cta a.btn'); await p.waitForURL(/app\/index\.html/,{timeout:3000}); console.log('navigated after', Date.now()-t0,'ms'); await b.close(); })();
