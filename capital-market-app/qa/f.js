const { launch, APP, seed, mkAcct } = require('./lib');
(async()=>{ const {b,p}=await launch(360,740); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(400); await p.evaluate(mkAcct);
 for (const n of ['home','portfolio','profile']) { await p.evaluate(n=>go(n),n); await p.waitForTimeout(700);
  console.log(n, await p.evaluate(()=>{const cw=document.documentElement.clientWidth; return [...document.querySelectorAll('#phone svg')].filter(e=>{const b=e.getBoundingClientRect(); return b.width>0&&(b.right>cw+2||b.left<-2)&&!e.parentElement.closest('svg')}).map(e=>e.parentElement.className+' > svg '+e.getAttribute('class')+' '+Math.round(e.getBoundingClientRect().left)+'..'+Math.round(e.getBoundingClientRect().right))})); }
 await b.close(); })();
