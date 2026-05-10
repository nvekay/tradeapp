# -*- coding: utf-8 -*-
import urllib.request
import urllib.error
import json
from datetime import datetime

BASE = "http://localhost:8000"

def api(method, path, body=None):
    url = BASE + path
    data = json.dumps(body, ensure_ascii=False).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{method} {path} -> {e.code}: {e.read().decode()}")

# trades to import (April 27 excluded)
TRADES_RAW = [
    # May 7 - short take (trend)
    {
        "date": "May 7, 2026", "pair": "GER40", "position": "short",
        "result": "take", "rating": 3, "rr": 2.0, "trade_type": "trend",
        "factors": ["1h sweep", "4h rb", "5m entry", "smt"],
        "psychology": ["По системе ✅"],
        "notes": "Таргет тяну по EU50",
        "ss5m": "https://www.tradingview.com/x/e376SdmV/",
        "ss1h": "https://www.tradingview.com/x/hfRyeKG4/",
        "ss4h": "https://www.tradingview.com/x/cMOkSfDt/",
    },
    # May 7 - long stop (countertrend)
    {
        "date": "May 7, 2026", "pair": "GER40", "position": "long",
        "result": "stop", "rating": 2, "rr": 1.0, "trade_type": "countertrend",
        "factors": ["1h ob", "4h ob", "5m entry", "smt"],
        "psychology": ["FOMO / открылся на эмоциях"],
        "notes": "Не последовал системе",
        "ss5m": None,
        "ss1h": "https://www.tradingview.com/x/bq62GkNH/",
        "ss4h": "https://www.tradingview.com/x/qUzMJFvG/",
    },
    # April 29 - long take (trend)
    {
        "date": "April 29, 2026", "pair": "GER40", "position": "long",
        "result": "take", "rating": 4, "rr": 3.0, "trade_type": "trend",
        "factors": ["1h ob", "4h ob", "5m entry"],
        "psychology": [],
        "notes": "Просто поза",
        "ss5m": None,
        "ss1h": "https://www.tradingview.com/x/H5YtW8kS/",
        "ss4h": "https://www.tradingview.com/x/5OEqdWMS/",
    },
    # April 28 - long take (trend)
    {
        "date": "April 28, 2026", "pair": "GER40", "position": "long",
        "result": "take", "rating": 4, "rr": 2.27, "trade_type": "trend",
        "factors": ["1h ob", "4h ob", "5m entry"],
        "psychology": [],
        "notes": "Аналог прошлой позы, чуть другая",
        "ss5m": None,
        "ss1h": "https://www.tradingview.com/x/H5YtW8kS/",
        "ss4h": "https://www.tradingview.com/x/5OEqdWMS/",
    },
    # April 28 - long b/e (countertrend)
    {
        "date": "April 28, 2026", "pair": "GER40", "position": "long",
        "result": "b/e", "rating": 3, "rr": 1.0, "trade_type": "countertrend",
        "factors": ["1h sweep", "4h sweep", "5m entry"],
        "psychology": [],
        "notes": "День 50/50, вышел и перезашёл в шорт",
        "ss5m": None,
        "ss1h": "https://www.tradingview.com/x/3IMNpwLo/",
        "ss4h": "https://www.tradingview.com/x/LhyxX9vW/",
    },
]

# --- Step 1: get/create all needed factors ---
existing = {f["name"]: f["id"] for f in api("GET", "/factors/")}
print(f"Existing factors: {list(existing.keys())}")

needed = set()
for t in TRADES_RAW:
    needed.update(t["factors"])

factor_ids = dict(existing)
for name in needed:
    if name not in factor_ids:
        f = api("POST", "/factors/", {"name": name})
        factor_ids[name] = f["id"]
        print(f"Created factor: {name} (id={f['id']})")
    else:
        print(f"Factor exists: {name} (id={factor_ids[name]})")

# --- Step 2: create trades ---
PSYCH_MAP = {
    "По системе ✅": "По системе ✅",
    "FOMO / открылся на эмоциях": "FOMO / открылся на эмоциях",
}

for t in TRADES_RAW:
    dt = datetime.strptime(t["date"], "%B %d, %Y").replace(hour=10, minute=0)
    payload = {
        "symbol": t["pair"],
        "direction": t["position"],
        "risk": 1.0,
        "rr": t["rr"],
        "result": t["result"],
        "date": dt.isoformat() + "Z",
        "session": "london",
        "notes": t["notes"] or None,
        "screenshot_5m": t["ss5m"] or None,
        "screenshot_1h": t["ss1h"] or None,
        "screenshot_4h": t["ss4h"] or None,
        "psychology": t["psychology"],
        "factor_ids": [factor_ids[f] for f in t["factors"]],
        "rating": t["rating"],
        "trade_type": t["trade_type"],
    }
    result = api("POST", "/trades/", payload)
    print(f"Created trade: {t['date']} {t['pair']} {t['position']} {t['result']} -> id={result['id']}")

print("\nDone!")
