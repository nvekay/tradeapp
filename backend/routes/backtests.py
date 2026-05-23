from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from typing import Optional

from database import get_db
from models import BacktestTrade, BacktestSession, Factor, User
from schemas import BacktestTradeCreate, BacktestTradeOut, BacktestSessionCreate, BacktestSessionOut
from auth import get_current_user

router = APIRouter(prefix="/backtests", tags=["backtests"])

# --- Sessions ---

@router.get("/sessions", response_model=list[BacktestSessionOut])
def list_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(BacktestSession).filter(BacktestSession.user_id == current_user.id).order_by(BacktestSession.created_at.desc()).all()

@router.post("/sessions", response_model=BacktestSessionOut, status_code=201)
def create_session(payload: BacktestSessionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = BacktestSession(
        user_id=current_user.id,
        name=payload.name,
        symbol=payload.symbol,
        start_date=payload.start_date,
        end_date=payload.end_date,
        strategy_id=payload.strategy_id
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions/{session_id}", response_model=BacktestSessionOut)
def get_session(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(BacktestSession).filter(BacktestSession.id == session_id, BacktestSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(BacktestSession).filter(BacktestSession.id == session_id, BacktestSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()

# --- Trades ---

def _get_or_404_trade(db: Session, trade_id: int, current_user: User) -> BacktestTrade:
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

@router.post("/trades", response_model=BacktestTradeOut, status_code=201)
def create_backtest(payload: BacktestTradeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    factors = _resolve_factors(db, payload.factor_ids, current_user)
    trade = BacktestTrade(
        user_id=current_user.id,
        backtest_session_id=payload.backtest_session_id,
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
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return trade

@router.get("/trades", response_model=list[BacktestTradeOut])
def list_backtests(
    session_id: int = Query(...),
    direction: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filters = [BacktestTrade.user_id == current_user.id, BacktestTrade.backtest_session_id == session_id]
    if direction:
        filters.append(BacktestTrade.direction == direction)
    if result:
        filters.append(BacktestTrade.result == result)

    return (
        db.query(BacktestTrade)
        .filter(and_(*filters))
        .order_by(BacktestTrade.date.desc())
        .all()
    )

@router.delete("/trades/{trade_id}", status_code=204)
def delete_backtest(trade_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trade = _get_or_404_trade(db, trade_id, current_user)
    db.delete(trade)
    db.commit()
