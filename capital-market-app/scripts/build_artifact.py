"""Bundle prototype/ into one self-contained HTML body page (for publishing as an artifact)."""
import re, sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent / "prototype"
out = Path(sys.argv[1])
standalone = "--standalone" in sys.argv
pwa = "--pwa" in sys.argv
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "style.css").read_text(encoding="utf-8")
order = ["config", "core", "sound", "data", "lessons-extra", "art", "art2", "cases-data", "cases", "screens1", "screens2", "practice", "bot", "feedback", "track", "cloud", "terms", "boot"]
js = "\n".join((root / "js" / f"{n}.js").read_text(encoding="utf-8") for n in order).replace("__BUILD_DATE__", __import__("datetime").datetime.now().strftime("%d.%m.%Y %H:%M"))
body = re.search(r'<div class="stage">.*?</div>\s*</div>\s*(?=<script)', html, re.S).group(0)
page = f'''<title>לומדים שוק הון</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{{color-scheme:dark}}
{css}
body{{background:#0b0d10}}
@media (min-width:481px){{body{{background:#d9dde3}}}}
</style>
<div dir="rtl" lang="he">
{body}
</div>
<script>
{js}
</script>
'''
import base64
icon = base64.b64encode((root / "icon.png").read_bytes()).decode()
HEAD = ('<meta name="theme-color" content="#07090c"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">'
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="לומדים שוק הון">'
        f'<link rel="apple-touch-icon" href="data:image/png;base64,{icon}"><link rel="icon" href="data:image/png;base64,{icon}">')
if pwa:
    HEAD += '<link rel="manifest" href="manifest.json">'
    page += "<script>if('serviceWorker' in navigator && location.protocol.startsWith('http')){addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}</script>"
if standalone:
    page = '<!doctype html>\n<html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' + HEAD + page + '</body></html>'
out.write_text(page, encoding="utf-8")
print(out, len(page))
