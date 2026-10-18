const { chromium } = require('playwright');
(async()=>{ const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
 for (const [w,h] of [[360,740],[390,844]]) { const p = await (await b.newContext({viewport:{width:w,height:h}})).newPage(); await p.route(/fonts\./, r=>r.abort());
  await p.goto('http://localhost:8778/'); await p.waitForTimeout(1200);
  const H=await p.evaluate(()=>document.body.scrollHeight); for(let y=0;y<=H;y+=200){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(120)}
  await p.waitForTimeout(1500);
  console.log(w, 'hidden', await p.evaluate(()=>[...document.querySelectorAll('.rv')].filter(e=>getComputedStyle(e).opacity<0.9).map(e=>e.className+' '+Math.round(e.getBoundingClientRect().top+scrollY))), 'counters', await p.evaluate(()=>[...document.querySelectorAll('[data-n]')].map(e=>e.textContent))); }
 await b.close(); })();
