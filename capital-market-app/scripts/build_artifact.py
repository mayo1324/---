"""Bundle prototype/ into one self-contained HTML body page (for publishing as an artifact)."""
import re, sys
from pathlib import Path
root = Path(__file__).resolve().parent.parent / "prototype"
out = Path(sys.argv[1])
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "style.css").read_text(encoding="utf-8")
order = ["core", "data", "art", "screens1", "screens2", "practice", "boot"]
js = "\n".join((root / "js" / f"{n}.js").read_text(encoding="utf-8") for n in order)
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
out.write_text(page, encoding="utf-8")
print(out, len(page))
