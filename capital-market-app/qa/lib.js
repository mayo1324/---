const { chromium } = require('playwright');
exports.launch = async (w=390,h=844,opts={}) => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport:{width:w,height:h}, ...opts });
  const p = await ctx.newPage(); const errs=[];
  p.on('pageerror', e => errs.push('PAGEERR '+e.message));
  p.on('console', m => { if (m.type()==='error') errs.push('CONSOLE '+m.text().slice(0,160)); });
  p.on('requestfailed', r => { if(!/fonts\.|gstatic|googleapis/.test(r.url())) errs.push('REQFAIL '+r.url().slice(0,100)); });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  return { b, ctx, p, errs };
};
exports.APP = process.env.APP_URL || 'file:///home/user/---/capital-market-app/review/app.html';
exports.seed = (extra='') => `localStorage.setItem('cm_proto_v2', JSON.stringify({accounts:{}, session:null, terms:{v:3}, seenOnboarding:true}));`;
exports.mkAcct = `(()=>{ const d=loadDB(); const a=newAcct('נועה',16,'n@x.co','abcd','להבין איך זה עובד'); a.seenIntro=a.seenWelcome=true; a.openAll=true; d.accounts['n@x.co']=a; d.session='n@x.co'; save(); })()`;
