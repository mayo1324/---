const { chromium } = require('playwright');
(async()=>{ const issues=[]; const ok=(c,m)=>{if(!c)issues.push(m)};
 const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
 for (const [w,h] of [[360,740],[1280,800],[820,1100]]) {
  const ctx = await b.newContext({viewport:{width:w,height:h}}); const p = await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120))});
  await p.route(/fonts\./, r=>r.abort());
  const bad=[]; p.on('response',r=>{ if(r.status()>=400) bad.push(r.status()+' '+r.url()) });
  await p.goto('http://localhost:8777/'); await p.waitForTimeout(1500);
  const sw = await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth); ok(!sw,`${w}: horizontal scroll on landing`);
  const links = await p.evaluate(()=>[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')));
  for (const l of [...new Set(links)]) { if(l.startsWith('#')){ ok(await p.evaluate(l=>!!document.querySelector(l),l),`${w}: anchor ${l} missing`); continue; } const r = await p.request.get('http://localhost:8777/'+l.replace(/^\.\//,'')); ok(r.status()<400,`${w}: link ${l} -> ${r.status()}`); }
  ok(await p.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)),`${w}: broken image`);
  // scroll whole page to trigger reveals, check all .rv became visible
  const H=await p.evaluate(()=>document.body.scrollHeight); for(let y=0;y<H;y+=300){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(60)}
  await p.waitForTimeout(800); const hidden = await p.evaluate(()=>[...document.querySelectorAll('.rv')].filter(e=>getComputedStyle(e).opacity<0.9).length); ok(hidden===0,`${w}: ${hidden} sections never revealed`);
  const nums = await p.evaluate(()=>[...document.querySelectorAll('[data-n]')].map(e=>e.textContent+'/'+e.dataset.n)); ok(nums.every(x=>{const [a,b2]=x.split('/');return a===b2}),`${w}: counters ${nums}`);
  if (bad.length) issues.push(`${w}: bad responses ${bad.join(', ')}`);
  const u=errs.filter(e=>!/ERR_FAILED|fonts/.test(e)); if(u.length) issues.push(`${w}: errors ${u.join('|')}`);
  // terms page
  await p.goto('http://localhost:8777/terms.html'); ok(await p.evaluate(()=>document.querySelectorAll('h2').length)===13,'terms.html sections'); 
  // mobile menu etc
  await ctx.close();
 }
 // PWA install criteria and offline of /app/
 { const ctx = await b.newContext({viewport:{width:390,height:844}}); const p = await ctx.newPage(); await p.route(/fonts\./, r=>r.abort());
   await p.goto('http://localhost:8777/app/'); await p.waitForTimeout(2500);
   const m = await p.evaluate(async()=>{ const l=document.querySelector('link[rel=manifest]').href; const j=await (await fetch(l)).json(); const reg=await navigator.serviceWorker.getRegistration(); return {j, sw:reg&&reg.active&&reg.active.state, scope:reg&&reg.scope}; });
   ok(m.sw==='activated','sw not active'); ok(m.j.icons.length>=2&&m.j.start_url&&m.j.display==='standalone','manifest incomplete');
   for (const ic of m.j.icons){ const r=await p.request.get('http://localhost:8777/app/'+ic.src); ok(r.status()===200,'icon '+ic.src); }
   await p.evaluate(()=>{ localStorage.setItem('cm_proto_v2', JSON.stringify({accounts:{}, session:null, terms:{v:3}, seenOnboarding:true})); });
   await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(1500);
   ok(await p.evaluate(()=>typeof go==='function' && !!document.querySelector('#screen').innerText.length),'app should load offline');
   await p.evaluate(()=>{ const d=loadDB(); const a=newAcct('נועה',16,'o@x.co','abcd','x'); a.seenIntro=a.seenWelcome=true; a.openAll=true; d.accounts['o@x.co']=a; d.session='o@x.co'; save(); go('lesson','l1'); });
   await p.waitForTimeout(600); ok(await p.evaluate(()=>cur.name==='lesson'&&!!document.querySelector('.slide')),'lesson works offline');
   await ctx.close(); }
 console.log('ISSUES',issues.length); issues.forEach(i=>console.log(' -',i)); await b.close(); })();
