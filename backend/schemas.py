from pydantic import BaseModel, field_validator, model_validator
from enum import Enum
from datetime import datetime
from typing import Optional, Literal


class Direction(str, Enum):
    long = "long"
    short = "short"


class Result(str, Enum):
    take = "take"
    stop = "stop"
    be = "b/e"


class Session(str, Enum):
    london = "london"
    new_york = "new_york"
    asian = "asian"
    overlap = "overlap"


# --- User ---

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserGoogleLogin(BaseModel):
    credential: str

class UserOut(BaseModel):
    id: int
    email: str

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Factor ---

class FactorCreate(BaseModel):
    name: str


class FactorOut(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


# --- Trade ---

class TradeBase(BaseModel):
    symbol: str
    direction: Direction
    risk: float = 1.0
    rr: float
    result: Result
    date: datetime
    session: Session
    notes: Optional[str] = None
    screenshot_5m: Optional[str] = None
    screenshot_1h: Optional[str] = None
    screenshot_4h: Optional[str] = None
    psychology: list[str] = []
    rating: int = 0
    trade_type: Optional[Literal["trend", "countertrend"]] = None
    strategy_id: Optional[int] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        if not 0 <= v <= 5:
            raise ValueError("rating must be between 0 and 5")
        return v

    @field_validator("risk")
    @classmethod
    def risk_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("risk must be positive")
        return v

    @field_validator("rr")
    @classmethod
    def rr_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("rr must be positive")
        return v


class TradeCreate(TradeBase):
    factor_ids: list[int] = []
    pnl_pct: Optional[float] = None

    @model_validator(mode="after")
    def calc_pnl(self) -> "TradeCreate":
        if self.result == Result.take:
            self.pnl_pct = round(self.risk * self.rr, 4)
        elif self.result == Result.stop:
            self.pnl_pct = round(-self.risk, 4)
        else:
            self.pnl_pct = 0.0
        return self


class TradeUpdate(BaseModel):
    symbol: Optional[str] = None
    direction: Optional[Direction] = None
    risk: Optional[float] = None
    rr: Optional[float] = None
    result: Optional[Result] = None
    date: Optional[datetime] = None
    session: Optional[Session] = None
    notes: Optional[str] = None
    screenshot_5m: Optional[str] = None
    screenshot_1h: Optional[str] = None
    screenshot_4h: Optional[str] = None
    psychology: Optional[list[str]] = None
    rating: Optional[int] = None
    trade_type: Optional[Literal["trend", "countertrend"]] = None
    strategy_id: Optional[int] = None
    factor_ids: Optional[list[int]] = None
    pnl_pct: Optional[float] = None

    @model_validator(mode="after")
    def recalc_pnl(self) -> "TradeUpdate":
        if self.result is not None and self.risk is not None and self.rr is not None:
            if self.result == Result.take:
                self.pnl_pct = round(self.risk * self.rr, 4)
            elif self.result == Result.stop:
                self.pnl_pct = round(-self.risk, 4)
            else:
                self.pnl_pct = 0.0
        return self


class TradeOut(TradeBase):
    id: int
    pnl_pct: float
    factors: list[FactorOut] = []

    model_config = {"from_attributes": True}


# --- Daily Journal ---

class DailyJournalBase(BaseModel):
    date: str
    pre_mood: Optional[int] = None
    pre_plan: Optional[str] = None
    post_mood: Optional[int] = None
    post_learned: Optional[str] = None

class DailyJournalCreate(DailyJournalBase):
    pass

class DailyJournalUpdate(BaseModel):
    pre_mood: Optional[int] = None
    pre_plan: Optional[str] = None
    post_mood: Optional[int] = None
    post_learned: Optional[str] = None

class DailyJournalOut(DailyJournalBase):
    id: int

    model_config = {"from_attributes": True}


# --- Strategy ---

class StrategyStatus(str, Enum):
    active = "active"
    draft = "draft"
    archived = "archived"


class StrategyBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: StrategyStatus = StrategyStatus.active
    color: Optional[str] = "#2563EB"
    emoji: Optional[str] = "🎯"
    allowed_directions: list[Direction] = []
    allowed_sessions: list[Session] = []
    allowed_symbols: list[str] = []
    trade_type: Optional[Literal["trend", "countertrend"]] = None
    max_risk_pct: float = 1.0
    min_rr: float = 1.5
    setup_checklist: list[str] = []
    sl_logic: Optional[str] = None
    tp_logic: Optional[str] = None


class StrategyCreate(StrategyBase):
    pass


class StrategyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[StrategyStatus] = None
    color: Optional[str] = None
    emoji: Optional[str] = None
    allowed_directions: Optional[list[Direction]] = None
    allowed_sessions: Optional[list[Session]] = None
    allowed_symbols: Optional[list[str]] = None
    trade_type: Optional[Literal["trend", "countertrend"]] = None
    max_risk_pct: Optional[float] = None
    min_rr: Optional[float] = None
    setup_checklist: Optional[list[str]] = None
    sl_logic: Optional[str] = None
    tp_logic: Optional[str] = None


class StrategyOut(StrategyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    # Aggregated stats (populated by the endpoint)
    total_trades: int = 0
    winrate: float = 0.0
    total_pnl_pct: float = 0.0
    avg_rr: float = 0.0

    model_config = {"from_attributes": True}
