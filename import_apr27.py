# -*- coding: utf-8 -*-
import urllib.request, json
from datetime import datetime

BASE = "http://localhost:8000"

def api(method, path, body=None):
    url = BASE + path
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode("utf-8"))

existing = {f["name"].lower(): f for f in api("GET", "/factors/")}

def get_or_create(name):
    key = name.lower()
    if key in existing:
        return existing[key]["id"]
    f = api("POST", "/factors/", {"name": name})
    existing[key] = f
    return f["id"]

TRADES = [
    {
        "date": "April 27, 2026", "position": "long", "result": "take",
        "rating": 4, "rr": 2.0, "trade_type": "trend",
        "factors": ["1h RB", "4h sweep", "5m entry", "smt"],
        "psychology": [],
        "notes": "Правильный OF, но 1h дал ресвип, стоп с запасом",
        "ss1h": "https://www.tradingview.com/x/Jcr0PWlG/",
        "ss4h": "https://www.tradingview.com/x/r31j77M1/",
    },
    {
        "date": "April 27, 2026", "position": "long", "result": "take",
        "rating": 4, "rr": 2.0, "trade_type": "trend",
        "factors": ["1h RB", "4h sweep", "5m entry", "Донабор"],
        "psychology": [],
        "notes": "После ресвипа сделал донабор",
        "ss1h": "https://www.tradingview.com/x/Jcr0PWlG/",
        "ss4h": "https://www.tradingview.com/x/r31j77M1/",
    },
]

for t in TRADES:
    dt = datetime.strptime(t["date"], "%B %d, %Y").replace(hour=10, minute=0)
    payload = {
        "symbol": "GER40", "direction": t["position"],
        "risk": 1.0, "rr": t["rr"], "result": t["result"],
        "date": dt.isoformat() + "Z", "session": "london",
        "notes": t["notes"],
        "screenshot_1h": t["ss1h"], "screenshot_4h": t["ss4h"],
        "psychology": t["psychology"],
        "factor_ids": [get_or_create(f) for f in t["factors"]],
        "rating": t["rating"], "trade_type": t["trade_type"],
    }
    r = api("POST", "/trades/", payload)
    print(f"Created: {t['date']} {t['notes'][:30]} -> id={r['id']}")

print("Done!")
