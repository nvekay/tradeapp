import urllib.request
import json

BASE = "http://localhost:8000"


def api(method, path, data=None):
    body = json.dumps(data, ensure_ascii=False).encode("utf-8") if data else None
    req = urllib.request.Request(
        BASE + path, data=body, method=method,
        headers={"Content-Type": "application/json; charset=utf-8"} if body else {},
    )
    with urllib.request.urlopen(req) as r:
        raw = r.read()
        return json.loads(raw.decode("utf-8")) if raw else None


# clear trades
for t in api("GET", "/trades/"):
    api("DELETE", f"/trades/{t['id']}")

factors = {f["name"]: f["id"] for f in api("GET", "/factors/")}
print("Factors:", list(factors.keys()))

fvg = factors.get("FVG")
ob  = factors.get("OB retest")
bos = factors.get("BOS")

trades = [
    {"symbol": "GER40", "direction": "long",  "risk": 1.0, "rr": 3.0, "result": "take",
     "date": "2026-05-01T09:30:00Z", "session": "london",
     "psychology": ["По системе ✅", "Вышел раньше времени"],
     "factor_ids": [fvg, bos], "rating": 5},

    {"symbol": "GER40", "direction": "short", "risk": 1.0, "rr": 2.0, "result": "stop",
     "date": "2026-05-02T10:15:00Z", "session": "london",
     "psychology": ["FOMO / открылся на эмоциях"],
     "factor_ids": [ob], "rating": 2},

    {"symbol": "US30",  "direction": "long",  "risk": 1.5, "rr": 2.0, "result": "take",
     "date": "2026-05-03T15:00:00Z", "session": "new_york",
     "psychology": ["По системе ✅"],
     "factor_ids": [fvg, ob], "rating": 4},

    {"symbol": "US30",  "direction": "long",  "risk": 1.0, "rr": 1.0, "result": "b/e",
     "date": "2026-05-04T14:00:00Z", "session": "overlap",
     "psychology": ["Вышел раньше времени"],
     "factor_ids": [], "rating": 3},

    {"symbol": "NAS100","direction": "short", "risk": 2.0, "rr": 1.5, "result": "take",
     "date": "2026-05-05T14:30:00Z", "session": "new_york",
     "psychology": ["По системе ✅", "Боялся упустить прибыль"],
     "factor_ids": [ob, bos], "rating": 5},

    {"symbol": "GER40", "direction": "long",  "risk": 1.0, "rr": 2.5, "result": "stop",
     "date": "2026-05-06T09:00:00Z", "session": "london",
     "psychology": ["Нарушил правила входа"],
     "factor_ids": [fvg], "rating": 1},
]

for t in trades:
    r = api("POST", "/trades/", t)
    print(f"  Created trade {r['id']}: {r['symbol']} {r['result']} pnl={r['pnl_pct']} psych_count={len(r['psychology'])}")

print("Done.")
