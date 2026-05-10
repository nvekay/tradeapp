from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from datetime import datetime, timezone
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)

    trades = relationship("Trade", back_populates="user")
    factors = relationship("Factor", back_populates="user")
    journals = relationship("DailyJournal", back_populates="user")


class Factor(Base):
    __tablename__ = "factors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    user = relationship("User", back_populates="factors")
    trades = relationship("Trade", secondary="trade_factors", back_populates="factors")


class TradeFactors(Base):
    __tablename__ = "trade_factors"

    trade_id = Column(Integer, ForeignKey("trades.id", ondelete="CASCADE"), primary_key=True)
    factor_id = Column(Integer, ForeignKey("factors.id", ondelete="CASCADE"), primary_key=True)


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String, nullable=False)
    direction = Column(String, nullable=False)       # "long" | "short"
    risk = Column(Float, nullable=False, default=1.0)
    rr = Column(Float, nullable=False)
    result = Column(String, nullable=False)          # "take" | "stop" | "b/e"
    pnl_pct = Column(Float, nullable=False)
    date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    session = Column(String, nullable=False)         # "london" | "new_york" | "asian" | "overlap"
    notes = Column(Text, nullable=True)
    screenshot_5m = Column(String, nullable=True)
    screenshot_1h = Column(String, nullable=True)
    screenshot_4h = Column(String, nullable=True)
    psychology = Column(JSON, nullable=False, default=list)
    rating = Column(Integer, nullable=False, default=0)
    trade_type = Column(String, nullable=True)  # "trend" | "countertrend"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    user = relationship("User", back_populates="trades")
    factors = relationship("Factor", secondary="trade_factors", back_populates="trades")


class DailyJournal(Base):
    __tablename__ = "daily_journal"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False) # format YYYY-MM-DD
    pre_mood = Column(Integer, nullable=True)
    pre_plan = Column(Text, nullable=True)
    post_mood = Column(Integer, nullable=True)
    post_learned = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    user = relationship("User", back_populates="journals")
