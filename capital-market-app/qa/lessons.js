const { launch, APP, seed, mkAcct } = require('./lib');
(async () => {
  const W = +process.argv[2]||390; const { b, p, errs } = await launch(W,844);
  await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(400); await p.evaluate(mkAcct);
  const ids = await p.evaluate(()=>LESSONS.map(l=>l.id)); console.log('lessons', ids.length);
  const issues=[];
  for (const id of ids) {
    await p.evaluate(id=>go('lesson',id), id); await p.waitForTimeout(450);
    const info = await p.evaluate(id=>{const L=LESSONS.find(l=>l.id===id);return {n:L.slides.length,q:(L.qs||[L.q]).length,title:L.title,qs:(L.qs||[L.q]).map(q=>({a:q.a,len:q.o.length}))}}, id);
    if (!info.n) issues.push(id+': no slides');
    let guard=0;
    while (guard++<40) {
      await p.waitForTimeout(260);
      const st = await p.evaluate(()=>({name:cur.name, quiz:!!document.querySelector('.opt'), nx:!!document.querySelector('#nx'),
        over: (()=>{const s=document.querySelector('.slide'); if(!s) return null; const r=document.documentElement.clientWidth; return [...document.querySelectorAll('#scr *')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.right>r+1||b.left<-1)}).slice(0,3).map(e=>e.tagName+'.'+e.className)})(),
        tc: (()=>{const el=document.querySelector('.slide h2,.slide p'); return !!el})() }));
      if (st.name!=='lesson') break;
      if (st.over && st.over.length) issues.push(`${id}: overflow ${JSON.stringify(st.over)}`);
      if (st.quiz) {
        const a = await p.evaluate(()=>{ const t=document.querySelector('.slide h2').textContent; const el=[...document.querySelectorAll('.opt')]; return {t, ks:el.map(e=>e.dataset.k)} });
        const qi = await p.evaluate(()=>+((document.querySelector('.tag').textContent.match(/(\d) מתוך/)||[0,1])[1])-1);
        const right = info.qs[qi]&&info.qs[qi].a;
        // wrong first
        const wrong = a.ks.find(k=>+k!==right); if (wrong!==undefined) { await p.click(`.opt[data-k="${wrong}"]`); await p.waitForTimeout(120); }
        await p.click(`.opt[data-k="${right}"]`); await p.waitForTimeout(150);
        const dis = await p.evaluate(()=>document.querySelector('#nx').disabled); if (dis) issues.push(`${id}: next disabled after correct answer`);
      }
      await p.click('#nx', {timeout:3000}).catch(e=>issues.push(id+': cannot click next '+e.message.slice(0,60)));
    }
    const fin = await p.evaluate(()=>cur.name); if (fin!=='lessonDone') issues.push(`${id}: ended on ${fin}`);
    const done = await p.evaluate(id=>A().lessonsDone.includes(id), id); if(!done) issues.push(id+': not marked done');
  }
  console.log('ISSUES', issues.length); issues.forEach(i=>console.log(' -',i));
  const uniq=[...new Set(errs)]; console.log('ERRORS', uniq.length); uniq.slice(0,15).forEach(e=>console.log(' *',e));
  console.log('stars/xp', await p.evaluate(()=>[A().stars,A().xp,A().lessonsDone.length]));
  await b.close();
})();
