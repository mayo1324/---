const { launch, APP, seed, mkAcct } = require('./lib');
(async()=>{ const {b,p}=await launch(390,844); await p.addInitScript(seed()); await p.goto(APP); await p.waitForTimeout(400); await p.evaluate(mkAcct);
 const r = await p.evaluate(()=>({
  mods: MODULES.map(m=>({id:m.id,t:m.t||m.title||m.n,desc:m.d||m.sub||'',lessons:LESSONS.filter(l=>l.module===m.id).map(l=>[l.id,l.title,l.slides.length,(l.qs||[l.q]).length,l.mins||l.min||l.dur||''])})),
  gloss: Object.keys(GLOSS).length, glossKeys:Object.keys(GLOSS).slice(0,80),
  assets: ASSETS.map(a=>[a.id,a.n,a.t||a.type||a.k||'']),
  steps: typeof STEPS!=='undefined'?STEPS.map(s=>s[0]+':'+s[1]):null,
  levels: typeof LEVELS!=='undefined'?JSON.stringify(LEVELS).slice(0,300):null,
  lvlTitle: LVL_TITLE, startCash: START_CASH,
  cases: SCEN.map((s,i)=>[i+1,s.trend,s.action,(typeof practiceLevel==='function'?practiceLevel(s):'')]),
  tabs: TAB_ITEMS.map(t=>t[0]+':'+t[1]),
  bot: typeof BOT_RULES!=='undefined'?BOT_RULES.length:null,
  comm: typeof COMM_DEMO!=='undefined'?COMM_DEMO.length:null,
  fb: typeof FB_LINES!=='undefined'?Object.keys(FB_LINES):null, ver: APP_VERSION, terms: TERMS_TEXT.map(t=>t[0]),
  badges: null
 }));
 console.log(JSON.stringify(r,null,1).slice(0,9000)); await b.close(); })();
