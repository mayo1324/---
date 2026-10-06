import sys
from youtube_transcript_api import YouTubeTranscriptApi

VIDEOS = {"video1": "2nrOQT8uOy0", "video2": "1wFFlTnYWi4", "video3": "4njTdQuzh_g"}
api = YouTubeTranscriptApi()
for name, vid in VIDEOS.items():
    try:
        try:
            tr = api.fetch(vid, languages=["he", "iw"])
        except Exception:
            tr = api.fetch(vid)
        text = "\n".join(s.text.replace("\n", " ") for s in tr)
        open(f"sources/{name}.txt", "w", encoding="utf-8").write(text)
        print(name, "OK", getattr(tr, "language_code", "?"), getattr(tr, "is_generated", "?"), len(text))
    except Exception as e:
        print(name, "FAILED", type(e).__name__, str(e)[:200])
