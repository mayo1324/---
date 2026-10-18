const { launch, APP } = require('./lib');
(async()=>{ const issues=[]; const ok=(c,m)=>{if(!c)issues.push(m)};
 const {b,p,errs}=await launch(390,844); await p.goto(APP); await p.waitForTimeout(700);
 ok(await p.evaluate(()=>cur.name)==='terms','fresh visitor should see terms, got '+await p.evaluate(()=>cur.name));
 // slider locked before checkboxes
 const sl = p.locator('#sl'); const kb = await p.locator('#slk').boundingBox(); const tb = await sl.boundingBox();
 await p.mouse.move(kb.x+kb.width/2,kb.y+kb.height/2); await p.mouse.down(); await p.mouse.move(tb.x+5,kb.y+kb.height/2,{steps:8}); await p.mouse.up(); await p.waitForTimeout(500);
 ok(await p.evaluate(()=>cur.name)==='terms','slider must stay locked without checkboxes');
 await p.click('#tc1'); await p.click('#tc2'); await p.waitForTimeout(200);
 const kb2 = await p.locator('#slk').boundingBox();
 // partial drag returns
 await p.mouse.move(kb2.x+kb2.width/2,kb2.y+kb2.height/2); await p.mouse.down(); await p.mouse.move(kb2.x+kb2.width/2-40,kb2.y+kb2.height/2,{steps:5}); await p.mouse.up(); await p.waitForTimeout(600);
 ok(await p.evaluate(()=>cur.name)==='terms','partial slide should not approve');
 const kb3 = await p.locator('#slk').boundingBox(); const tb3 = await sl.boundingBox();
 await p.mouse.move(kb3.x+kb3.width/2,kb3.y+kb3.height/2); await p.mouse.down(); await p.mouse.move(tb3.x+6,kb3.y+kb3.height/2,{steps:12}); await p.mouse.up(); await p.waitForTimeout(2500);
 const n = await p.evaluate(()=>[cur.name, !!loadDB().terms, loadDB().terms&&loadDB().terms.v]);
 ok(n[0]!=='terms'&&n[1]&&n[2]===2,'full slide should approve: '+JSON.stringify(n));
 // reload keeps approval
 await p.reload(); await p.waitForTimeout(700); ok(await p.evaluate(()=>cur.name)!=='terms','approval should persist after reload');
 // old version re-asks
 await p.evaluate(()=>{loadDB().terms={v:1};save();}); await p.reload(); await p.waitForTimeout(700); ok(await p.evaluate(()=>cur.name)==='terms','old terms version must re-ask');
 // RTL slide direction: knob start side
 console.log('screen', n);
 const u=[...new Set(errs)].filter(e=>!/ERR_FAILED/.test(e)); if(u.length) issues.push('errors '+u.join('|').slice(0,200));
 console.log('ISSUES',issues.length); issues.forEach(i=>console.log(' -',i)); await b.close(); })();
