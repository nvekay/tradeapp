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
            conn.execute(text(f"ALTER TABLE trades ADD COLUMN {col} {ddl}"))
            conn.commit()
        except Exception:
            pass

# ── Auto-seed admin user from env vars ──────────────────────────────────────
ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

if ADMIN_EMAIL and ADMIN_PASSWORD:
    from sqlalchemy.orm import Session as DBSession
    from auth import get_password_hash
    with DBSession(engine) as db:
        existing = db.query(models.User).filter(models.User.email == ADMIN_EMAIL).first()
        if not existing:
            user = models.User(
                email=ADMIN_EMAIL,
                hashed_password=get_password_hash(ADMIN_PASSWORD)
            )
            db.add(user)
            db.commit()
            print(f"[seed] Admin user created: {ADMIN_EMAIL}")
        else:
            # Update password if it changed
            new_hash = get_password_hash(ADMIN_PASSWORD)
            if existing.hashed_password != new_hash:
                existing.hashed_password = new_hash
                db.commit()
                print(f"[seed] Admin password updated: {ADMIN_EMAIL}")
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Trading Journal")

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