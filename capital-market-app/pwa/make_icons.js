const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const n of [192, 512]) {
    const p = await b.newPage({ viewport: { width: n, height: n } });
    await p.setContent(`<body style="margin:0"><div style="width:${n}px;height:${n}px;background:linear-gradient(145deg,#eaff8a,#a8d812 60%,#6f9a05);display:grid;place-items:center"><svg width="${n*0.52}" height="${n*0.52}" viewBox="0 0 48 48"><g stroke="#10180a" stroke-width="3.4" stroke-linecap="round"><path d="M16 9v30M32 13v26"/></g><rect x="10.5" y="17" width="11" height="15" rx="3" fill="#10180a"/><rect x="26.5" y="21" width="11" height="12" rx="3" fill="#10180a"/></svg></div>`);
    await p.screenshot({ path: `/home/user/---/capital-market-app/pwa/icon-${n}.png` });
  }
  await b.close();
})();
