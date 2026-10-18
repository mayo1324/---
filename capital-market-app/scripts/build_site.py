"""Build the deployable site folder: landing page at /, the PWA app at /app/, terms at /terms.html.
Usage: python3 scripts/build_site.py OUT_DIR"""
import subprocess, sys, json, re, shutil, datetime, html
from pathlib import Path
R = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1]); shutil.rmtree(out, ignore_errors=True); (out / "app").mkdir(parents=True)
subprocess.run([sys.executable, str(R / "scripts/build_artifact.py"), str(out / "app/index.html"), "--standalone", "--pwa"], check=True)
build = datetime.date.today().strftime("%Y%m%d%H%M")
# icons (drawn by pwa/make_icons.js into pwa/)
for n in ("icon-192.png", "icon-512.png"): shutil.copy(R / "pwa" / n, out / "app" / n)
shutil.copy(R / "pwa" / "icon-512.png", out / "icon-512.png")
(out / "app/manifest.json").write_text(json.dumps({
  "name": "לומדים שוק הון", "short_name": "שוק הון", "description": "ללמוד, לתרגל ולהבין את שוק ההון. תוכן לימודי, בלי כסף אמיתי.",
  "lang": "he", "dir": "rtl", "start_url": "./", "scope": "./", "display": "standalone", "orientation": "portrait",
  "background_color": "#07090c", "theme_color": "#07090c",
  "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable"}, {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]
}, ensure_ascii=False, indent=1), encoding="utf-8")
(out / "app/sw.js").write_text("""/* offline support: the app is saved on the phone after the first visit */
const V = 'cm-%s';
const CORE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k.startsWith('cm-')).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url);
  /* never cache sign-in or database traffic */
  if (/googleapis\\.com$|firebaseapp\\.com$|google\\.com$/.test(u.hostname) && !/fonts\\./.test(u.hostname)) return;
  if (/gstatic\\.com$/.test(u.hostname) && !/fonts\\./.test(u.hostname)) return;
  /* app page: network first (so updates arrive), saved copy when offline; fonts and icons: saved copy first */
  if (r.mode === 'navigate' || u.origin === location.origin) {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
  } else if (/fonts\\.(googleapis|gstatic)\\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })));
  }
});
""" % build, encoding="utf-8")
# terms page from the app's own text
t = (R / "prototype/js/terms.js").read_text(encoding="utf-8")
body = t[t.index("const TERMS_TEXT"):]
items = re.findall(r"\['((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'\]", body)
ver = re.search(r"TERMS_VERSION = (\d+)", t).group(1)
sec = "\n".join(f"<h2>{html.escape(a)}</h2><p>{html.escape(b.replace(chr(92)+chr(39), chr(39)))}</p>" for a, b in items)
CSS = """:root{--bg:#07090c;--card:#12161b;--tx:#eef1f4;--mu:#9aa4af;--li:#c8ff3d}*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--tx);font-family:Heebo,system-ui,sans-serif;line-height:1.7;font-size:17px}
a{color:var(--li)}.w{max-width:760px;margin:0 auto;padding:0 20px}h1,h2,h3{line-height:1.25}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 26px;border-radius:16px;background:linear-gradient(180deg,#d8ff6a,#a8e012);color:#10180a;font-weight:800;text-decoration:none;border:0;font:inherit;font-weight:800;cursor:pointer}
.btn.o{background:transparent;color:var(--tx);border:1.5px solid #3a434d}"""
disc = "גרסת ניסוי. התוכן לימודי בלבד ואינו ייעוץ השקעות. אין כסף אמיתי באפליקציה."
(out / "terms.html").write_text(f"""<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>תקנון ופרטיות | לומדים שוק הון</title>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;800&display=swap" rel="stylesheet"><style>{CSS}
h2{{font-size:20px;margin:30px 0 4px}}p{{margin:0;color:#cfd6dd}}.top{{padding:26px 0 6px}}.note{{background:var(--card);border-radius:14px;padding:14px 16px;color:var(--mu);font-size:15px}}</style></head><body><div class="w">
<div class="top"><a href="./">&rarr; חזרה לדף הראשי</a><h1>תקנון, תנאי שימוש ופרטיות</h1><p class="note">טיוטה לגרסת ניסוי, עדיין לא נבדקה על ידי עורך דין. גרסה {ver}.</p></div>
{sec}<p style="margin:40px 0 60px;color:var(--mu)">{disc}</p></div></body></html>""", encoding="utf-8")
# landing page
(out / "index.html").write_text(f"""<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>לומדים שוק הון</title><meta name="description" content="ללמוד, לתרגל ולהבין את שוק ההון בעברית, לבני 15 ומעלה. שיעורים קצרים ותרגול על גרפים אמיתיים, בלי כסף אמיתי.">
<meta name="theme-color" content="#07090c"><link rel="icon" href="icon-512.png"><link rel="apple-touch-icon" href="icon-512.png">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&display=swap" rel="stylesheet"><style>{CSS}
.hero{{text-align:center;padding:56px 0 40px;background:radial-gradient(600px 300px at 50% 0,rgba(200,255,61,.16),transparent)}}
.hero img{{width:92px;height:92px;border-radius:26px;box-shadow:0 0 40px rgba(200,255,61,.3)}}h1{{font-size:clamp(32px,7vw,48px);margin:18px 0 8px}}h1 b{{color:var(--li)}}
.sub{{color:var(--mu);font-size:19px;margin:0 auto 26px;max-width:520px}}.cta{{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}}
section{{padding:34px 0}}h2{{font-size:26px;margin:0 0 16px}}.g{{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(210px,1fr))}}
.c{{background:var(--card);border-radius:18px;padding:18px}}.c h3{{margin:0 0 4px;font-size:18px}}.c p{{margin:0;color:var(--mu);font-size:15.5px}}
.step{{display:flex;gap:12px;align-items:flex-start;margin:10px 0}}.n{{flex:none;width:30px;height:30px;border-radius:50%;background:var(--li);color:#10180a;font-weight:800;display:grid;place-items:center}}
.tabs{{display:flex;gap:8px;margin-bottom:12px}}.tabs button{{flex:1;min-height:48px;border-radius:14px;border:1.5px solid #3a434d;background:transparent;color:var(--tx);font:inherit;font-weight:700;cursor:pointer}}.tabs button.on{{background:var(--li);color:#10180a;border-color:var(--li)}}
.pane{{display:none;background:var(--card);border-radius:18px;padding:12px 18px}}.pane.on{{display:block}}
.warn{{background:var(--card);border-radius:18px;padding:16px 18px;color:#cfd6dd;font-size:15.5px}}footer{{padding:30px 0 60px;color:var(--mu);font-size:14.5px;text-align:center}}
#ins{{display:none}}</style></head><body>
<header class="hero"><div class="w"><img src="icon-512.png" alt="" width="92" height="92"><h1>לומדים <b>שוק הון</b></h1>
<p class="sub">ללמוד, לתרגל ולהבין. שיעורים קצרים בעברית ותרגול על גרפים אמיתיים מהעבר, בלי כסף אמיתי. לבני 15 ומעלה.</p>
<div class="cta"><a class="btn" href="app/">פתיחת האפליקציה</a><button class="btn o" id="ins">התקנה בטלפון</button><a class="btn o" href="#install">איך מתקינים?</a></div></div></header>
<main class="w"><section><h2>מה בפנים</h2><div class="g">
<div class="c"><h3>שיעורים קצרים</h3><p>27 שיעורים בחמישה נושאים, מהיסודות ועד סיכון וניהול כסף. כל שיעור נגמר בשאלות קצרות.</p></div>
<div class="c"><h3>תרגול על גרפים</h3><p>20 מקרים אמיתיים מהעבר. מחליטים בלי לדעת מה הנכס, ובסוף רואים מה קרה ולמה.</p></div>
<div class="c"><h3>בלי כסף אמיתי</h3><p>הכול הדמיה לימודית. אין קנייה, אין מכירה ואין המלצות השקעה.</p></div>
<div class="c"><h3>עובד גם בלי אינטרנט</h3><p>אחרי הפתיחה הראשונה האפליקציה נשמרת בטלפון, והשיעורים והתרגול זמינים בכל מקום.</p></div></div></section>
<section id="install"><h2>איך מורידים לטלפון</h2><div class="tabs" role="tablist"><button class="on" data-t="a">אנדרואיד</button><button data-t="i">אייפון</button></div>
<div class="pane on" id="p-a"><div class="step"><span class="n">1</span><span>פתחו את הדף הזה ב-Chrome.</span></div><div class="step"><span class="n">2</span><span>לחצו על "התקנה בטלפון" למעלה. אם אין כפתור, לחצו על שלוש הנקודות בפינה ובחרו <b>התקנת אפליקציה</b>.</span></div><div class="step"><span class="n">3</span><span>האייקון יופיע במסך הבית. פותחים ממנו כמו כל אפליקציה.</span></div></div>
<div class="pane" id="p-i"><div class="step"><span class="n">1</span><span>פתחו את הדף הזה ב-<b>Safari</b> (לא בדפדפן אחר).</span></div><div class="step"><span class="n">2</span><span>לחצו על כפתור השיתוף, הריבוע עם החץ כלפי מעלה.</span></div><div class="step"><span class="n">3</span><span>גללו ובחרו <b>הוספה למסך הבית</b>, ואז "הוספה".</span></div></div></section>
<section><div class="warn"><b>חשוב לדעת:</b> {disc} התחברות עם Google וסנכרון ההתקדמות דורשים אינטרנט. השיעורים והתרגול עובדים גם בלי.</div></section></main>
<footer><div class="w"><a href="terms.html">תקנון ופרטיות</a><p>© לומדים שוק הון, גרסת ניסוי</p></div></footer>
<script>document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{{document.querySelectorAll('.tabs button,.pane').forEach(x=>x.classList.remove('on'));b.classList.add('on');document.getElementById('p-'+b.dataset.t).classList.add('on')}});
/iphone|ipad/i.test(navigator.userAgent)&&document.querySelector('[data-t=i]').click();
let dp;addEventListener('beforeinstallprompt',e=>{{e.preventDefault();dp=e;const i=document.getElementById('ins');i.style.display='inline-flex';i.onclick=()=>{{dp.prompt();dp=null;i.style.display='none'}}}});</script></body></html>""", encoding="utf-8")
print("site ->", out, sorted(p.name for p in out.rglob("*") if p.is_file()))
