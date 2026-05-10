import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Factor, Trade, TradeFactors, DailyJournal

engine = create_engine("sqlite:///./trading.db")
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

data = {
    "factors": [{"id": f.id, "name": f.name} for f in db.query(Factor).all()],
    "trades": [],
    "trade_factors": [],
    "daily_journal": []
}

for t in db.query(Trade).all():
    data["trades"].append({
        "id": t.id,
        "symbol": t.symbol,
        "direction": t.direction,
        "risk": t.risk,
        "rr": t.rr,
        "result": t.result,
        "pnl_pct": t.pnl_pct,
        "date": t.date.isoformat(),
        "session": t.session,
        "notes": t.notes,
        "screenshot_5m": t.screenshot_5m,
        "screenshot_1h": t.screenshot_1h,
        "screenshot_4h": t.screenshot_4h,
        "psychology": t.psychology,
        "rating": t.rating,
        "trade_type": t.trade_type
    })

for tf in db.query(TradeFactors).all():
    data["trade_factors"].append({"trade_id": tf.trade_id, "factor_id": tf.factor_id})

for j in db.query(DailyJournal).all():
    data["daily_journal"].append({
        "id": j.id,
        "date": j.date,
        "pre_mood": j.pre_mood,
        "pre_plan": j.pre_plan,
        "post_mood": j.post_mood,
        "post_learned": j.post_learned
    })

with open("dump.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False)

print("Dumped to dump.json")
