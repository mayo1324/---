const { launch, APP, seed, mkAcct } = require('./lib');
(async () => {
  const { b, p, errs } = await launch(390,844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(400); await p.evaluate(mkAcct);
  const r = await p.evaluate(()=>{
    const out=[]; const bad=(m)=>out.push(m);
    const ids=new Set();
    LESSONS.forEach(L=>{
      if(ids.has(L.id)) bad('dup lesson id '+L.id); ids.add(L.id);
      if(!L.title) bad(L.id+' no title');
      const QS=L.qs||[L.q];
      QS.forEach((q,i)=>{ if(!q||!q.q) bad(`${L.id} q${i} missing text`); else { if(!(q.a>=0&&q.a<q.o.length)) bad(`${L.id} q${i} answer idx out of range`); if(new Set(q.o).size!==q.o.length) bad(`${L.id} q${i} duplicate options`); if(q.o.some(x=>!x||/undefined/.test(x))) bad(`${L.id} q${i} bad option`); if(!q.why) bad(`${L.id} q${i} no why`);} });
      L.slides.forEach((s,i)=>{ if(!s.t||!s.b) bad(`${L.id} slide ${i} missing t/b`); try{ const sv=sceneSVG(s.v); if(!sv||sv.length<30) bad(`${L.id} slide ${i} scene '${s.v}' empty`);}catch(e){bad(`${L.id} slide ${i} scene error ${e.message}`)} 
        const all=(s.t||'')+(s.b||'')+(s.w||''); if(/undefined|NaN|\[object/.test(all)) bad(`${L.id} slide ${i} bad text`); });
      (L.src||[]).forEach(x=>{ try{ new URL(x.u) }catch(e){ bad(`${L.id} bad src url ${x.u}`) } });
    });
    // order / modules
    PLAN_ORDER.forEach(id=>{ if(!LESSONS.find(l=>l.id===id)) bad('PLAN_ORDER has unknown '+id)}); LESSONS.forEach(L=>{ if(!PLAN_ORDER.includes(L.id)) bad('lesson not in PLAN_ORDER '+L.id)});
    LESSONS.forEach(L=>{ if(!MODULES.find(m=>m.id===L.module)) bad('lesson without module '+L.id); });
    // dashes in user-facing text
    const dash=/[–—]/; const scan=(s,w)=>{ if(typeof s==='string'&&dash.test(s)) bad('long dash in '+w+': '+s.slice(0,50)); };
    LESSONS.forEach(L=>{ scan(L.title,L.id); L.slides.forEach((s,i)=>{scan(s.t,L.id+'.t'+i);scan(s.b,L.id+'.b'+i);scan(s.w,L.id+'.w'+i)}); (L.qs||[L.q]).forEach(q=>{scan(q.q,L.id+'.q');q.o.forEach(o=>scan(o,L.id+'.o'));scan(q.why,L.id+'.why')}); });
    // cases
    SCEN.forEach((s,i)=>{ if(!s.id) bad('case '+i+' no id'); try{ const P=buildScen(s); if(P.candles.length!==P.N+P.M) bad('case '+(i+1)+' candles count'); if(P.candles.some(c=>[c.o,c.h,c.l,c.c].some(v=>!isFinite(v)))) bad('case '+(i+1)+' NaN candle'); if(P.candles.some(c=>c.h<Math.max(c.o,c.c)-1e-6||c.l>Math.min(c.o,c.c)+1e-6)) bad('case '+(i+1)+' bad OHLC'); if(Math.abs(P.candles[P.N-1].c-100)>0.5) bad('case '+(i+1)+' not rebased to 100: '+P.candles[P.N-1].c); }catch(e){bad('case '+(i+1)+' build error '+e.message)} });
    // glossary
    if(typeof GLOSS!=='undefined'){ Object.entries(GLOSS).forEach(([k,g])=>{ const t=JSON.stringify(g); if(t.length<12||/undefined/.test(t)) bad('gloss '+k+' weak'); if(/[\u2013\u2014]/.test(t)) bad('gloss '+k+' long dash'); }); }
    return {out, lessons:LESSONS.length, cases:SCEN.length};
  });
  console.log(r.lessons,'lessons',r.cases,'cases; problems:',r.out.length); r.out.forEach(x=>console.log(' -',x));
  await b.close();
})();
