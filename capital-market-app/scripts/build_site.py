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
  "id": "./", "lang": "he", "dir": "rtl", "start_url": "./", "scope": "./", "display": "standalone", "orientation": "portrait",
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
# landing page (pwa/landing.html) with app screenshots
shutil.copytree(R / "pwa/shots", out / "shots")
(out / "index.html").write_text((R / "pwa/landing.html").read_text(encoding="utf-8").replace("{{DISC}}", disc).replace("{{BUILD}}", datetime.datetime.now().strftime("%d.%m.%Y %H:%M")), encoding="utf-8")
shutil.copy(R / "pwa/admin.html", out / "admin.html")
print("site ->", out, sorted(p.name for p in out.rglob("*") if p.is_file()))
