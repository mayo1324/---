const { launch, APP, seed, mkAcct } = require('./lib');
(async()=>{ const {b,p}=await launch(390,844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(400); await p.evaluate(mkAcct);
 const r = await p.evaluate(()=>SCEN.map((sc,i)=>{ const P=buildScen(sc); const out={case:i+1,trend:sc.trend,action:sc.action};
   const st={trend:sc.trend,decision:sc.action,volAns:sc.volq&&sc.volq.ans,line:null,plan:null};
   if(sc.action==='enter'){ const sup=P.swingLow, stop=Math.round((sup-P.atr*.5)*10)/10, rk=P.last-stop; st.plan={support:sup,stop,risk:1,target:Math.round((P.last+rk*2)*10)/10}; out.size=sizing(P,st.plan); out.lowsNear=P.candles.slice(0,P.N).filter(c=>Math.abs(c.l-P.swingLow)<=.9*P.atr).length; out.recentHigh=P.recentHigh>P.last; }
   const ev=evaluate(sc,P,st); out.stars=ev.stars; out.fails=ev.checks.filter(c=>!c.ok).map(c=>c.t); 
   // worst-case: wrong everything
   const bad=evaluate(sc,P,{trend:'zzz',decision:sc.action==='wait'?'enter':'wait',volAns:'zzz',line:null,plan:null}); out.badStars=bad.stars; return out; }));
 let problems=0; r.forEach(x=>{ if(x.stars!==3||x.badStars!==0||(x.size&&x.size.capped)) { problems++; console.log(JSON.stringify(x)); } });
 console.log('cases',r.length,'problem cases',problems, 'actions', r.reduce((m,x)=>(m[x.action]=(m[x.action]||0)+1,m),{}), 'trends', r.reduce((m,x)=>(m[x.trend]=(m[x.trend]||0)+1,m),{}));
 await b.close(); })();
