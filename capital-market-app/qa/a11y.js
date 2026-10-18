const { launch, APP, seed, mkAcct } = require('./lib');
(async()=>{ const {b,p}=await launch(390,844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(400); await p.evaluate(mkAcct);
 const agg={};
 for (const [n,a] of [['home'],['lessons'],['market'],['practice',0],['lesson','l1'],['profile'],['login'],['signup'],['portfolio'],['glossary'],['community']]) {
  await p.evaluate(([n,a])=>{closeSheetNow();go(n,a)},[n,a]); await p.waitForTimeout(600);
  const r = await p.evaluate(()=>{ const out={noname:[],small:[],noalt:[],nolabel:[]}; 
    document.querySelectorAll('#phone button, #phone a, #phone [role=button]').forEach(e=>{ const r=e.getBoundingClientRect(); if(!r.width||getComputedStyle(e).visibility==='hidden'||e.closest('[hidden]')) return; const name=(e.getAttribute('aria-label')||e.textContent||e.getAttribute('title')||'').trim(); if(!name) out.noname.push(e.className+'#'+e.id); if((r.width<40||r.height<40)&&!e.closest('.tr,.ticker')) out.small.push((e.className||e.id)+' '+Math.round(r.width)+'x'+Math.round(r.height)); });
    document.querySelectorAll('#phone img').forEach(i=>{ if(!i.hasAttribute('alt')) out.noalt.push(i.src.slice(0,30)); });
    document.querySelectorAll('#phone input,#phone textarea,#phone select').forEach(i=>{ const id=i.id; if(!(i.getAttribute('aria-label')||i.placeholder||(id&&document.querySelector('label[for="'+id+'"]'))||i.closest('label'))) out.nolabel.push(id||i.className); });
    return out; });
  for (const k in r) r[k].forEach(x=>{ (agg[k]=agg[k]||{})[x]=(agg[k][x]||[]).concat(n); });
 }
 for (const k in agg) { console.log('==',k); Object.entries(agg[k]).forEach(([x,s])=>console.log('  ',x,'<-',[...new Set(s)].join(','))); }
 console.log('html lang/dir', await p.evaluate(()=>[document.documentElement.lang, document.documentElement.dir, document.querySelector('[dir=rtl]')?1:0, document.title]));
 await b.close(); })();
