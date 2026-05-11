from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_

from database import get_db
from models import Strategy, Trade, User
from schemas import StrategyCreate, StrategyUpdate, StrategyOut
from auth import get_current_user

router = APIRouter(prefix="/strategies", tags=["strategies"])


def _enrich_stats(strategy: Strategy, db: Session):
    trades = db.query(Trade).filter(Trade.strategy_id == strategy.id).all()
    total = len(trades)
    wins = sum(1 for t in trades if t.pnl_pct > 0)
    total_pnl = sum(t.pnl_pct for t in trades)
    avg_rr = sum(t.rr for t in trades) / total if total else 0.0
    return {
        "total_trades": total,
        "winrate": round(wins / total * 100, 1) if total else 0.0,
        "total_pnl_pct": round(total_pnl, 2),
        "avg_rr": round(avg_rr, 2),
    }


def _to_out(strategy: Strategy, db: Session) -> dict:
    stats = _enrich_stats(strategy, db)
    return {
        "id": strategy.id,
        "name": strategy.name,
        "description": strategy.description,
        "status": strategy.status,
        "color": strategy.color,
        "emoji": strategy.emoji,
        "allowed_directions": strategy.allowed_directions or [],
        "allowed_sessions": strategy.allowed_sessions or [],
        "allowed_symbols": strategy.allowed_symbols or [],
        "trade_type": strategy.trade_type,
        "max_risk_pct": strategy.max_risk_pct,
        "min_rr": strategy.min_rr,
        "setup_checklist": strategy.setup_checklist or [],
        "sl_logic": strategy.sl_logic,
        "tp_logic": strategy.tp_logic,
        "is_default": getattr(strategy, "is_default", False),
        "created_at": strategy.created_at,
        "updated_at": strategy.updated_at,
        **stats,
    }


@router.get("/", response_model=list[StrategyOut])
def list_strategies(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(Strategy).filter(Strategy.user_id == current_user.id).order_by(Strategy.created_at.desc()).all()
    return [_to_out(s, db) for s in rows]


@router.get("/{strategy_id}", response_model=StrategyOut)
def get_strategy(strategy_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(Strategy).filter(and_(Strategy.id == strategy_id, Strategy.user_id == current_user.id)).first()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return _to_out(s, db)


@router.post("/", response_model=StrategyOut, status_code=201)
def create_strategy(payload: StrategyCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = Strategy(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        status=payload.status,
        color=payload.color,
        emoji=payload.emoji,
        allowed_directions=[d.value for d in payload.allowed_directions],
        allowed_sessions=[s.value for s in payload.allowed_sessions],
        allowed_symbols=payload.allowed_symbols,
        trade_type=payload.trade_type,
        max_risk_pct=payload.max_risk_pct,
        min_rr=payload.min_rr,
        setup_checklist=payload.setup_checklist,
        sl_logic=payload.sl_logic,
        tp_logic=payload.tp_logic,
        is_default=payload.is_default,
    )
    if payload.is_default:
        db.query(Strategy).filter(Strategy.user_id == current_user.id, Strategy.is_default == True).update({"is_default": False})
    db.add(s); db.commit(); db.refresh(s)
    return _to_out(s, db)


@router.put("/{strategy_id}", response_model=StrategyOut)
def update_strategy(strategy_id: int, payload: StrategyUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(Strategy).filter(and_(Strategy.id == strategy_id, Strategy.user_id == current_user.id)).first()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")
    data = payload.model_dump(exclude_unset=True)
    if "allowed_directions" in data and data["allowed_directions"] is not None:
        data["allowed_directions"] = [d.value if hasattr(d, "value") else d for d in data["allowed_directions"]]
    if "allowed_sessions" in data and data["allowed_sessions"] is not None:
        data["allowed_sessions"] = [x.value if hasattr(x, "value") else x for x in data["allowed_sessions"]]
    if data.get("is_default"):
        db.query(Strategy).filter(Strategy.user_id == current_user.id, Strategy.id != s.id, Strategy.is_default == True).update({"is_default": False})
    for k, v in data.items():
        setattr(s, k, v)
    db.commit(); db.refresh(s)
    return _to_out(s, db)


@router.delete("/{strategy_id}", status_code=204)
def delete_strategy(strategy_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(Strategy).filter(and_(Strategy.id == strategy_id, Strategy.user_id == current_user.id)).first()
    if not s:
        raise HTTPException(status_code=404, detail="Strategy not found")
    db.delete(s); db.commit()
