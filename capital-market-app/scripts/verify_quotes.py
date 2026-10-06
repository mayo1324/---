import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GUIDE = ROOT / "outputs" / "style_guide.md"
LINE = re.compile(r'"([^"]+)"\s*\|\s*(video\d+\.txt)')


def norm(s):
    s = re.sub(r"[^\w\s]|_", " ", s, flags=re.UNICODE)
    return re.sub(r"\s+", " ", s).strip()


def main():
    if not GUIDE.exists():
        sys.exit(f"לא נמצא {GUIDE}")
    cache = {}
    found, missing = [], []
    for quote, fname in LINE.findall(GUIDE.read_text(encoding="utf-8")):
        path = ROOT / "sources" / fname
        if fname not in cache:
            cache[fname] = norm(path.read_text(encoding="utf-8")) if path.exists() else None
        ok = cache[fname] is not None and norm(quote) in cache[fname]
        (found if ok else missing).append((quote, fname))
    print(f"נמצאו ({len(found)}):")
    for q, f in found:
        print(f'  + "{q}" | {f}')
    print(f"לא נמצאו ({len(missing)}):")
    for q, f in missing:
        print(f'  - "{q}" | {f}')
    total = len(found) + len(missing)
    pct = 100 * len(found) / total if total else 0
    print(f"אחוז תקינים: {pct:.1f}% ({len(found)}/{total})")
    sys.exit(0 if not missing and total else 1)


if __name__ == "__main__":
    main()
