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

from routes import trades, factors, stats, journal
app.include_router(trades.router)
app.include_router(factors.router)
app.include_router(stats.router)
app.include_router(journal.router)
