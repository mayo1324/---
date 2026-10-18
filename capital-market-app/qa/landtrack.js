const { chromium } = require('playwright');
(async()=>{ const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const ctx=await b.newContext({viewport:{width:390,height:844}}); const p=await ctx.newPage(); const got=[]; const issues=[];
 await p.route(/fonts\./, r=>r.abort()); await p.route(/firestore\.googleapis\.com/, async r=>{ try{ const j=JSON.parse(r.request().postData()); got.push(Object.fromEntries(Object.entries(j.fields).map(([k,v])=>[k,v.stringValue??v.integerValue]))); }catch(e){} await r.fulfill({status:200,contentType:'application/json',body:'{}'}); });
 await p.goto('http://localhost:8791/?src=whatsapp'); await p.waitForTimeout(1000);
 await p.click('.cta a.btn'); await p.waitForTimeout(1500);
 console.log(got.map(x=>x.s+':'+x.e+':'+x.p).join(' | '));
 const vids=new Set(got.map(x=>x.vid)); if(vids.size!==1) issues.push('vid differs landing/app: '+[...vids]);
 if(!got.some(x=>x.e==='landing_view'&&x.p==='whatsapp')) issues.push('landing_view with src missing');
 if(!got.some(x=>x.e==='cta_click')) issues.push('cta_click missing');
 // admin page loads (sign-in needed) without JS errors
 const errs=[]; const p2=await ctx.newPage(); p2.on('pageerror',e=>errs.push(e.message)); await p2.goto('http://localhost:8791/admin.html'); await p2.waitForTimeout(1500); console.log('admin title', await p2.title(), 'errors', errs);
 // DNT
 const c2=await b.newContext({viewport:{width:390,height:844}, extraHTTPHeaders:{DNT:'1'}}); const p3=await c2.newPage(); const got3=[]; await p3.route(/fonts\./, r=>r.abort()); await p3.route(/firestore\.googleapis\.com/, r=>{got3.push(1); r.fulfill({status:200,body:'{}'})}); await p3.addInitScript(()=>{Object.defineProperty(navigator,'doNotTrack',{get:()=>'1'})}); await p3.goto('http://localhost:8791/'); await p3.waitForTimeout(1000); if(got3.length) issues.push('DNT ignored on landing');
 console.log('ISSUES',issues.length,issues); await b.close(); })();
