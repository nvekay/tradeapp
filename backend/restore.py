
import json
import os
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Base, Factor, Trade, TradeFactors, DailyJournal

DATABASE_URL = "postgresql://journal_user:ImB4x34AcBRp2T5q7m@localhost:5432/journal_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Create tables if not exist
Base.metadata.create_all(bind=engine)

with open("dump.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for f_data in data["factors"]:
    db.merge(Factor(id=f_data["id"], name=f_data["name"]))

for t_data in data["trades"]:
    db.merge(Trade(
        id=t_data["id"],
        symbol=t_data["symbol"],
        direction=t_data["direction"],
        risk=t_data["risk"],
        rr=t_data["rr"],
        result=t_data["result"],
        pnl_pct=t_data["pnl_pct"],
        date=datetime.fromisoformat(t_data["date"]),
        session=t_data["session"],
        notes=t_data["notes"],
        screenshot_5m=t_data["screenshot_5m"],
        screenshot_1h=t_data["screenshot_1h"],
        screenshot_4h=t_data["screenshot_4h"],
        psychology=t_data["psychology"],
        rating=t_data["rating"],
        trade_type=t_data["trade_type"]
    ))

for tf_data in data["trade_factors"]:
    db.merge(TradeFactors(trade_id=tf_data["trade_id"], factor_id=tf_data["factor_id"]))

for j_data in data["daily_journal"]:
    db.merge(DailyJournal(
        id=j_data["id"],
        date=j_data["date"],
        pre_mood=j_data["pre_mood"],
        pre_plan=j_data["pre_plan"],
        post_mood=j_data["post_mood"],
        post_learned=j_data["post_learned"]
    ))

db.commit()

db.execute(text("SELECT setval('factors_id_seq', COALESCE((SELECT MAX(id)+1 FROM factors), 1), false);"))
db.execute(text("SELECT setval('trades_id_seq', COALESCE((SELECT MAX(id)+1 FROM trades), 1), false);"))
db.execute(text("SELECT setval('daily_journal_id_seq', COALESCE((SELECT MAX(id)+1 FROM daily_journal), 1), false);"))
db.commit()
print("Restore successful.")
