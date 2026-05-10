from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from dotenv import load_dotenv
import models
import os

load_dotenv()

models.Base.metadata.create_all(bind=engine)

# migrations
from sqlalchemy import text
with engine.connect() as conn:
    for col, ddl in [("trade_type", "TEXT")]:
        try:
            conn.execute(text("ALTER TABLE trades ADD COLUMN " + col + " " + ddl))
            conn.commit()
        except Exception:
            pass

# Auto-seed admin user from env vars (runs every startup, keeps password in sync)
_ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL")
_ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
if _ADMIN_EMAIL and _ADMIN_PASSWORD:
    from sqlalchemy.orm import Session as _S
    from auth import get_password_hash as _hash
    with _S(engine) as _db:
        _u = _db.query(models.User).filter(models.User.email == _ADMIN_EMAIL).first()
        if not _u:
            _db.add(models.User(email=_ADMIN_EMAIL, hashed_password=_hash(_ADMIN_PASSWORD)))
            _db.commit()
            print("[seed] created admin:", _ADMIN_EMAIL)
        else:
            _u.hashed_password = _hash(_ADMIN_PASSWORD)
            _db.commit()
            print("[seed] synced admin password:", _ADMIN_EMAIL)

app = FastAPI(title="tradestat")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes import trades, factors, stats, journal, auth
app.include_router(auth.router)
app.include_router(trades.router)
app.include_router(factors.router)
app.include_router(stats.router)
app.include_router(journal.router)
