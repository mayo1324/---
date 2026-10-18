"""Checks outputs/lessons/*.json: every source quote must appear in its saved source file,
no long dashes in user-facing text, 4 to 6 slides, 3 quiz questions, valid answer index.
Usage: python3 scripts/verify_lessons.py [file.json ...]"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCENES = set()
art = "".join((ROOT / "prototype" / "js" / n).read_text(encoding="utf-8") for n in ("art.js", "art2.js"))
SCENES |= set(re.findall(r"^  ([A-Za-z0-9_]+):", art, re.M)) | set(re.findall(r"SCENES\.([A-Za-z0-9_]+) =", art))
DASH = re.compile("[—–‒―]")


def norm(s):
    s = re.sub(r"[^\w\s]|_", " ", s.casefold(), flags=re.UNICODE)
    return re.sub(r"\s+", " ", s).strip()


def main():
    files = [Path(a) for a in sys.argv[1:]] or sorted((ROOT / "outputs" / "lessons").glob("*.json"))
    bad = total = 0
    cache = {}
    for f in files:
        for L in json.loads(f.read_text(encoding="utf-8")):
            lid = L.get("id", "?")
            req = {r["key"] for r in L.get("scene_requests", [])}
            texts = [L.get("title", "")] + [s.get(k, "") for s in L.get("slides", []) for k in ("t", "b", "w")] + [x for q in L.get("qs", []) for x in [q["q"], q.get("why", "")] + q["o"]]
            probs = []
            if not 4 <= len(L.get("slides", [])) <= 6: probs.append("slides must be 4-6")
            if len(L.get("qs", [])) != 3: probs.append("need exactly 3 quiz questions")
            for q in L.get("qs", []):
                if not (0 <= q.get("a", -1) < len(q["o"])) or len(q["o"]) != 3: probs.append(f"bad quiz item: {q['q'][:30]}")
            if any(DASH.search(t) for t in texts): probs.append("long dash in text")
            for s in L.get("slides", []):
                if s.get("v") not in SCENES and s.get("v") not in req: probs.append(f"unknown scene {s.get('v')}")
            if not L.get("src"): probs.append("no sources")
            for s in L.get("src", []):
                total += 1
                p = ROOT / s["f"]
                if s["f"] not in cache: cache[s["f"]] = norm(p.read_text(encoding="utf-8")) if p.exists() else None
                if cache[s["f"]] is None or norm(s["q"]) not in cache[s["f"]]:
                    probs.append(f"quote not found in {s['f']}: {s['q'][:50]}")
            print(("OK  " if not probs else "FAIL") + f" {lid} {L.get('title','')}" + ("" if not probs else "\n     " + "\n     ".join(probs)))
            bad += bool(probs)
    print(f"{bad} lessons with problems, {total} quotes checked")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
