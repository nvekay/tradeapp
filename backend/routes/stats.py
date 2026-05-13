from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from collections import defaultdict
from datetime import datetime
from typing import Optional
from database import get_db
from models import Trade, Factor, TradeFactors, DailyJournal, User
from auth import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])


def _trades(db: Session, from_date: Optional[str], to_date: Optional[str], current_user: User) -> list[Trade]:
    q = db.query(Trade).filter(Trade.user_id == current_user.id, Trade.result != "open").order_by(Trade.date.asc())
    if from_date:
        q = q.filter(Trade.date >= datetime.fromisoformat(from_date.replace('Z', '')))
    if to_date:
        q = q.filter(Trade.date <= datetime.fromisoformat(to_date.replace('Z', '')))
    return q.all()


@router.get("/summary")
def summary(
    current_user: User = Depends(get_current_user),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    db: Session = Depends(get_db),
):
    trades = _trades(db, from_date, to_date, current_user)
    if not trades:
        return {
            "total_trades": 0, "winrate": 0.0, "total_pnl_pct": 0.0,
            "avg_pnl_pct": 0.0, "avg_win": 0.0, "avg_loss": 0.0,
            "max_drawdown": 0.0, "best_trade": None, "worst_trade": None,
        }

    wins = [t for t in trades if t.pnl_pct > 0]
    losses = [t for t in trades if t.pnl_pct < 0]
    total_pnl = round(sum(t.pnl_pct for t in trades), 4)

    cumulative = peak = max_dd = 0.0
    for t in trades:
        cumulative += t.pnl_pct
        if cumulative > peak:
            peak = cumulative
        dd = peak - cumulative
        if dd > max_dd:
            max_dd = dd

    best = max(trades, key=lambda t: t.pnl_pct)
    worst = min(trades, key=lambda t: t.pnl_pct)

    return {
        "total_trades": len(trades),
        "winrate": round(len(wins) / len(trades) * 100, 2),
        "total_pnl_pct": total_pnl,
        "avg_pnl_pct": round(total_pnl / len(trades), 4),
        "avg_win": round(sum(t.pnl_pct for t in wins) / len(wins), 4) if wins else 0.0,
        "avg_loss": round(sum(t.pnl_pct for t in losses) / len(losses), 4) if losses else 0.0,
        "max_drawdown": round(max_dd, 4),
        "best_trade": {"id": best.id, "pnl_pct": best.pnl_pct, "symbol": best.symbol, "date": best.date},
        "worst_trade": {"id": worst.id, "pnl_pct": worst.pnl_pct, "symbol": worst.symbol, "date": worst.date},
    }


@router.get("/pnl-curve")
def pnl_curve(
    current_user: User = Depends(get_current_user),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    db: Session = Depends(get_db),
):
    trades = _trades(db, from_date, to_date, current_user)
    cumulative = 0.0
    points = []
    for t in trades:
        cumulative = round(cumulative + t.pnl_pct, 4)
        points.append({"date": t.date.date().isoformat(), "pnl_pct": cumulative, "trade_id": t.id})
    return points


@router.get("/by-symbol")
def by_symbol(
    current_user: User = Depends(get_current_user),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    db: Session = Depends(get_db),
):
    trades = _trades(db, from_date, to_date, current_user)
    buckets: dict[str, list[Trade]] = defaultdict(list)
    for t in trades:
        buckets[t.symbol].append(t)

    result = []
    for symbol, ts in sorted(buckets.items()):
        wins = [t for t in ts if t.pnl_pct > 0]
        result.append({
            "symbol": symbol, "total_trades": len(ts),
            "winrate": round(len(wins) / len(ts) * 100, 2),
            "total_pnl_pct": round(sum(t.pnl_pct for t in ts), 4),
            "avg_pnl_pct": round(sum(t.pnl_pct for t in ts) / len(ts), 4),
        })
    return result


@router.get("/by-psychology")
def by_psychology(
    current_user: User = Depends(get_current_user),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    db: Session = Depends(get_db),
):
    trades = _trades(db, from_date, to_date, current_user)
    buckets: dict[str, list[float]] = defaultdict(list)
    for t in trades:
        for tag in (t.psychology or []):
            buckets[tag].append(t.pnl_pct)

    result = []
    for tag, pnls in sorted(buckets.items()):
        wins = [p for p in pnls if p > 0]
        result.append({
            "tag": tag, "total_trades": len(pnls),
            "winrate": round(len(wins) / len(pnls) * 100, 2),
            "avg_pnl_pct": round(sum(pnls) / len(pnls), 4),
        })
    return result


@router.get("/by-factor")
def by_factor(
    current_user: User = Depends(get_current_user),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    db: Session = Depends(get_db),
):
    from_dt = datetime.fromisoformat(from_date.replace('Z', '')) if from_date else None
    to_dt = datetime.fromisoformat(to_date.replace('Z', '')) if to_date else None

    q = (
        db.query(Factor.name, Trade.pnl_pct)
        .join(TradeFactors, Factor.id == TradeFactors.factor_id)
        .join(Trade, Trade.id == TradeFactors.trade_id)
        .filter(Trade.user_id == current_user.id)
    )
    if from_dt:
        q = q.filter(Trade.date >= from_dt)
    if to_dt:
        q = q.filter(Trade.date <= to_dt)

    buckets: dict[str, list[float]] = defaultdict(list)
    for name, pnl in q.all():
        buckets[name].append(pnl)

    result = []
    for name, pnls in sorted(buckets.items()):
        wins = [p for p in pnls if p > 0]
        result.append({
            "factor": name, "total_trades": len(pnls),
            "winrate": round(len(wins) / len(pnls) * 100, 2),
            "avg_pnl_pct": round(sum(pnls) / len(pnls), 4),
        })
    return result


@router.get("/journal-correlation")
def journal_correlation(
    current_user: User = Depends(get_current_user),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    db: Session = Depends(get_db),
):
    trades = _trades(db, from_date, to_date, current_user)
    journals = db.query(DailyJournal).filter(DailyJournal.user_id == current_user.id).all()
    
    journal_map = {j.date: j for j in journals}
    
    # group trades by date string
    trades_by_date = defaultdict(list)
    for t in trades:
        date_str = t.date.date().isoformat()
        trades_by_date[date_str].append(t)
        
    mood_stats = defaultdict(lambda: {"pnls": [], "trades": 0})
    
    for date_str, daily_trades in trades_by_date.items():
        journal = journal_map.get(date_str)
        if journal and journal.pre_mood is not None:
            for t in daily_trades:
                mood_stats[journal.pre_mood]["pnls"].append(t.pnl_pct)
                mood_stats[journal.pre_mood]["trades"] += 1
                
    result = []
    for mood, data in sorted(mood_stats.items()):
        pnls = data["pnls"]
        wins = [p for p in pnls if p > 0]
        result.append({
            "mood": mood,
            "total_trades": len(pnls),
            "winrate": round(len(wins) / len(pnls) * 100, 2) if pnls else 0.0,
            "avg_pnl_pct": round(sum(pnls) / len(pnls), 4) if pnls else 0.0,
        })
        
    return result
