from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from typing import Optional
import csv
import io
from fastapi.responses import StreamingResponse
from bs4 import BeautifulSoup

from database import get_db
from models import Trade, Factor
from schemas import TradeCreate, TradeUpdate, TradeOut, Result, Direction, Session as SessionSchema

router = APIRouter(prefix="/trades", tags=["trades"])

def _get_or_404(db: Session, trade_id: int) -> Trade:
    trade = db.get(Trade, trade_id)
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trade

def _resolve_factors(db: Session, factor_ids: list[int]) -> list[Factor]:
    if not factor_ids:
        return []
    factors = db.query(Factor).filter(Factor.id.in_(factor_ids)).all()
    if len(factors) != len(factor_ids):
        raise HTTPException(status_code=400, detail="One or more factor IDs not found")
    return factors

@router.post("/", response_model=TradeOut, status_code=201)
def create_trade(payload: TradeCreate, db: Session = Depends(get_db)):
    factors = _resolve_factors(db, payload.factor_ids)
    trade = Trade(
        symbol=payload.symbol,
        direction=payload.direction,
        risk=payload.risk,
        rr=payload.rr,
        result=payload.result,
        pnl_pct=payload.pnl_pct,
        date=payload.date,
        session=payload.session,
        notes=payload.notes,
        screenshot_5m=payload.screenshot_5m,
        screenshot_1h=payload.screenshot_1h,
        screenshot_4h=payload.screenshot_4h,
        psychology=payload.psychology,
        rating=payload.rating,
        trade_type=payload.trade_type,
        factors=factors,
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return trade

@router.get("/", response_model=list[TradeOut])
def list_trades(
    symbol: Optional[str] = Query(None),
    direction: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
    rating: Optional[int] = Query(None),
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    db: Session = Depends(get_db),
):
    filters = []
    if symbol:
        filters.append(Trade.symbol == symbol)
    if direction:
        filters.append(Trade.direction == direction)
    if result:
        filters.append(Trade.result == result)
    if rating is not None:
        filters.append(Trade.rating == rating)
    if from_date:
        filters.append(Trade.date >= from_date)
    if to_date:
        filters.append(Trade.date <= to_date)

    return (
        db.query(Trade)
        .filter(and_(*filters))
        .order_by(Trade.date.desc())
        .all()
    )

@router.get("/export-csv")
def export_csv(
    symbol: Optional[str] = Query(None),
    direction: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
    rating: Optional[int] = Query(None),
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    db: Session = Depends(get_db),
):
    filters = []
    if symbol:    filters.append(Trade.symbol == symbol)
    if direction: filters.append(Trade.direction == direction)
    if result:    filters.append(Trade.result == result)
    if rating is not None: filters.append(Trade.rating == rating)
    if from_date: filters.append(Trade.date >= from_date)
    if to_date:   filters.append(Trade.date <= to_date)

    trades = db.query(Trade).filter(and_(*filters)).order_by(Trade.date.asc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Symbol", "Direction", "Risk%", "RR", "Result", "PnL%",
        "Date", "Session", "Type", "Rating", "Psychology", "Factors", "Notes"
    ])
    for t in trades:
        writer.writerow([
            t.id, t.symbol, t.direction, t.risk, t.rr, t.result, t.pnl_pct,
            t.date.isoformat(), t.session, t.trade_type or "", t.rating,
            "; ".join(t.psychology or []),
            "; ".join(f.name for f in t.factors),
            t.notes or ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trades_export.csv"}
    )

@router.get("/{trade_id}", response_model=TradeOut)
def get_trade(trade_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, trade_id)

@router.put("/{trade_id}", response_model=TradeOut)
def update_trade(trade_id: int, payload: TradeUpdate, db: Session = Depends(get_db)):
    trade = _get_or_404(db, trade_id)
    update_data = payload.model_dump(exclude_unset=True)
    factor_ids = update_data.pop("factor_ids", None)
    for field, value in update_data.items():
        setattr(trade, field, value)
    if factor_ids is not None:
        trade.factors = _resolve_factors(db, factor_ids)
    db.commit()
    db.refresh(trade)
    return trade

@router.delete("/{trade_id}", status_code=204)
def delete_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = _get_or_404(db, trade_id)
    db.delete(trade)
    db.commit()

@router.post("/import-html", response_model=dict)
def import_html(
    file: UploadFile = File(...),
    balance: float = Form(100000.0),
    db: Session = Depends(get_db)
):
    content = file.file.read().decode("utf-8", errors="ignore")
    soup = BeautifulSoup(content, "html.parser")
    tables = soup.find_all("table")
    if not tables:
        raise HTTPException(status_code=400, detail="Invalid report format")
    
    trade_table = tables[-1]
    rows = trade_table.find_all("tr")
    
    imported = 0
    for row in rows:
        tds = row.find_all("td")
        if len(tds) < 13:
            continue
            
        tid = tds[0].text.strip()
        if not tid:
            continue
            
        symbol = tds[1].text.strip()
        open_time_str = tds[2].text.strip()
        direction_str = tds[4].text.strip().upper()
        
        try:
            profit_str = tds[-2].text.strip().replace(" ", "")
            profit = float(profit_str)
        except Exception:
            continue
            
        try:
            open_dt = datetime.strptime(open_time_str, "%d/%m/%Y %H:%M:%S")
        except Exception:
            continue
            
        pnl_pct = (profit / balance) * 100
        
        if profit > 0:
            result = Result.take
            risk = 1.0
            rr = max(pnl_pct, 0.01)
        elif profit < 0:
            result = Result.stop
            risk = max(abs(pnl_pct), 0.01)
            rr = 1.0
        else:
            result = Result.be
            risk = 1.0
            rr = 1.0
            
        if direction_str == "BUY":
            direction = Direction.long
        else:
            direction = Direction.short
            
        hour = open_dt.hour
        if 7 <= hour < 12:
            session = SessionSchema.london
        elif 12 <= hour < 16:
            session = SessionSchema.overlap
        elif 16 <= hour < 21:
            session = SessionSchema.new_york
        else:
            session = SessionSchema.asian
            
        trade = Trade(
            symbol=symbol,
            direction=direction,
            risk=round(risk, 2),
            rr=round(rr, 2),
            result=result,
            pnl_pct=round(pnl_pct, 4),
            date=open_dt,
            session=session,
            notes=f"Imported ID: {tid}",
            rating=0
        )
        db.add(trade)
        imported += 1
        
    db.commit()
    return {"imported": imported}
