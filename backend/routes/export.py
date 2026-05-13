from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from database import get_db
from models import User, Trade, Factor, Strategy, DailyJournal, WeeklyPlan, PsychologyTag, UserSymbol
from auth import get_current_user

router = APIRouter(prefix="/export", tags=["export"])


def _trade_dict(t: Trade) -> dict:
    return {
        "id": t.id, "symbol": t.symbol, "direction": t.direction,
        "risk": t.risk, "rr": t.rr, "result": t.result, "pnl_pct": t.pnl_pct,
        "date": t.date.isoformat() if t.date else None,
        "session": t.session, "notes": t.notes,
        "screenshot_5m": t.screenshot_5m, "screenshot_1h": t.screenshot_1h, "screenshot_4h": t.screenshot_4h,
        "screenshots": t.screenshots or [],
        "psychology": t.psychology or [], "rating": t.rating,
        "trade_type": t.trade_type,
        "strategy_id": t.strategy_id,
        "factor_ids": [f.id for f in t.factors],
    }


def _strategy_dict(s: Strategy) -> dict:
    return {
        "id": s.id, "name": s.name, "description": s.description, "status": s.status,
        "color": s.color, "emoji": s.emoji,
        "allowed_directions": s.allowed_directions or [],
        "allowed_sessions": s.allowed_sessions or [],
        "allowed_symbols": s.allowed_symbols or [],
        "trade_type": s.trade_type, "max_risk_pct": s.max_risk_pct, "min_rr": s.min_rr,
        "setup_checklist": s.setup_checklist or [],
        "sl_logic": s.sl_logic, "tp_logic": s.tp_logic,
        "is_default": getattr(s, "is_default", False),
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


@router.get("/all")
def export_all(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trades = db.query(Trade).filter(Trade.user_id == current_user.id).all()
    strategies = db.query(Strategy).filter(Strategy.user_id == current_user.id).all()
    factors = db.query(Factor).filter(Factor.user_id == current_user.id).all()
    journal = db.query(DailyJournal).filter(DailyJournal.user_id == current_user.id).all()
    weekly_plans = db.query(WeeklyPlan).filter(WeeklyPlan.user_id == current_user.id).all()
    psy = db.query(PsychologyTag).filter(PsychologyTag.user_id == current_user.id).all()
    syms = db.query(UserSymbol).filter(UserSymbol.user_id == current_user.id).all()

    data = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user": {"email": current_user.email, "account_size": current_user.account_size, "currency": current_user.currency},
        "trades": [_trade_dict(t) for t in trades],
        "strategies": [_strategy_dict(s) for s in strategies],
        "factors": [{"id": f.id, "name": f.name} for f in factors],
        "journal": [{"date": j.date, "pre_mood": j.pre_mood, "pre_plan": j.pre_plan, "post_mood": j.post_mood, "post_learned": j.post_learned} for j in journal],
        "weekly_plans": [{"week_start": w.week_start, "focus": w.focus, "watchlist": w.watchlist, "risk_plan": w.risk_plan, "notes": w.notes} for w in weekly_plans],
        "psychology_tags": [{"id": p.id, "name": p.name} for p in psy],
        "symbols": [{"id": s.id, "name": s.name} for s in syms],
    }
    filename = f"tradestat-backup-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.json"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    return JSONResponse(content=data, headers=headers)
