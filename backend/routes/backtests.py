from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from typing import Optional

from database import get_db
from models import BacktestTrade, Factor
from schemas import BacktestTradeCreate, BacktestTradeOut
from auth import get_current_user
from models import User

router = APIRouter(prefix="/backtests", tags=["backtests"])

def _get_or_404(db: Session, trade_id: int, current_user: User) -> BacktestTrade:
    trade = db.query(BacktestTrade).filter(BacktestTrade.id == trade_id, BacktestTrade.user_id == current_user.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Backtest Trade not found")
    return trade

def _resolve_factors(db: Session, factor_ids: list[int], current_user: User) -> list[Factor]:
    if not factor_ids:
        return []
    factors = db.query(Factor).filter(Factor.id.in_(factor_ids), Factor.user_id == current_user.id).all()
    if len(factors) != len(factor_ids):
        raise HTTPException(status_code=400, detail="One or more factor IDs not found or unauthorized")
    return factors

@router.post("/", response_model=BacktestTradeOut, status_code=201)
def create_backtest(payload: BacktestTradeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    factors = _resolve_factors(db, payload.factor_ids, current_user)
    trade = BacktestTrade(
        user_id=current_user.id,
        symbol=payload.symbol,
        direction=payload.direction,
        risk=payload.risk,
        rr=payload.rr,
        result=payload.result,
        pnl_pct=payload.pnl_pct,
        date=payload.date,
        session=payload.session,
        psychology=payload.psychology or [],
        trade_type=payload.trade_type,
        factors=factors,
        strategy_id=payload.strategy_id,
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return trade

@router.get("/", response_model=list[BacktestTradeOut])
def list_backtests(
    symbol: Optional[str] = Query(None),
    direction: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filters = [BacktestTrade.user_id == current_user.id]
    if symbol:
        filters.append(BacktestTrade.symbol == symbol)
    if direction:
        filters.append(BacktestTrade.direction == direction)
    if result:
        filters.append(BacktestTrade.result == result)
    if from_date:
        filters.append(BacktestTrade.date >= from_date)
    if to_date:
        filters.append(BacktestTrade.date <= to_date)

    return (
        db.query(BacktestTrade)
        .filter(and_(*filters))
        .order_by(BacktestTrade.date.desc())
        .all()
    )

@router.delete("/{trade_id}", status_code=204)
def delete_backtest(trade_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trade = _get_or_404(db, trade_id, current_user)
    db.delete(trade)
    db.commit()
