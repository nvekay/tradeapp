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
from auth import get_current_user
from models import User

router = APIRouter(prefix="/trades", tags=["trades"])

def _get_or_404(db: Session, trade_id: int, current_user: User) -> Trade:
    trade = db.query(Trade).filter(Trade.id == trade_id, Trade.user_id == current_user.id).first()
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trade

def _resolve_factors(db: Session, factor_ids: list[int], current_user: User) -> list[Factor]:
    if not factor_ids:
        return []
    factors = db.query(Factor).filter(Factor.id.in_(factor_ids), Factor.user_id == current_user.id).all()
    if len(factors) != len(factor_ids):
        raise HTTPException(status_code=400, detail="One or more factor IDs not found or unauthorized")
    return factors

@router.post("/", response_model=TradeOut, status_code=201)
def create_trade(payload: TradeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    factors = _resolve_factors(db, payload.factor_ids, current_user)
    trade = Trade(
        user_id=current_user.id,
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
        strategy_id=payload.strategy_id,
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filters = [Trade.user_id == current_user.id]
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filters = [Trade.user_id == current_user.id]
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
def get_trade(trade_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _get_or_404(db, trade_id, current_user)

@router.put("/{trade_id}", response_model=TradeOut)
def update_trade(trade_id: int, payload: TradeUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trade = _get_or_404(db, trade_id, current_user)
    update_data = payload.model_dump(exclude_unset=True)
    factor_ids = update_data.pop("factor_ids", None)
    for field, value in update_data.items():
        setattr(trade, field, value)
    if factor_ids is not None:
        trade.factors = _resolve_factors(db, factor_ids, current_user)
    db.commit()
    db.refresh(trade)
    return trade

@router.delete("/{trade_id}", status_code=204)
def delete_trade(trade_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    trade = _get_or_404(db, trade_id, current_user)
    db.delete(trade)
    db.commit()

@router.post("/import-html", response_model=dict)
def import_html(
    file: UploadFile = File(...),
    balance: float = Form(100000.0),
    current_user: User = Depends(get_current_user),
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
            user_id=current_user.id,
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

@router.post("/import-csv", response_model=dict)
def import_csv(
    file: UploadFile = File(...),
    balance: float = Form(100000.0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Import closed positions from broker CSV (Russian column headers)."""
    raw = file.file.read()
    # Try utf-8 first, then cp1251 (Windows Russian)
    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            content = raw.decode("cp1251")
        except UnicodeDecodeError:
            content = raw.decode("utf-8", errors="ignore")

    # Detect delimiter (CSV may use ; or ,)
    sample = content[:2048]
    delim = ";" if sample.count(";") > sample.count(",") else ","
    reader = csv.reader(io.StringIO(content), delimiter=delim)

    rows = list(reader)
    if len(rows) < 2:
        raise HTTPException(status_code=400, detail="Empty CSV")

    header = [h.strip().lower() for h in rows[0]]

    # Map Russian/English headers to indices
    def find_col(*candidates):
        for c in candidates:
            for i, h in enumerate(header):
                if c.lower() in h:
                    return i
        return -1

    col_id      = find_col("id")
    col_symbol  = find_col("символ", "symbol")
    col_open_t  = find_col("время открытия", "open time", "open_time")
    col_volume  = find_col("объём", "объем", "volume")
    col_dir     = find_col("направление", "direction", "type")
    col_close_t = find_col("время закрытия", "close time")
    col_open_p  = find_col("цена открытия", "open price")
    col_close_p = find_col("цена закрытия", "close price")
    col_sl      = find_col("стоп-лосс", "stop loss", "s/l", "sl")
    col_tp      = find_col("тейк-профит", "take profit", "t/p", "tp")
    col_profit  = find_col("прибыль", "profit")
    col_reason  = find_col("причина", "reason", "comment")

    if col_symbol < 0 or col_open_t < 0 or col_dir < 0 or col_profit < 0:
        raise HTTPException(status_code=400, detail="CSV missing required columns (Symbol, Open Time, Direction, Profit)")

    # Pre-fetch existing imported trade IDs to skip duplicates
    existing_notes = {
        t.notes for t in db.query(Trade.notes).filter(Trade.user_id == current_user.id, Trade.notes.like("Imported ID:%")).all()
    }

    def parse_dt(s: str):
        s = (s or "").strip()
        for fmt in ("%d/%m/%Y %H:%M:%S", "%d.%m.%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S",
                    "%d/%m/%Y %H:%M", "%d.%m.%Y %H:%M"):
            try:
                return datetime.strptime(s, fmt)
            except ValueError:
                continue
        return None

    def parse_num(s: str):
        if not s:
            return None
        try:
            return float(s.replace(" ", "").replace(",", "."))
        except ValueError:
            return None

    imported = 0
    skipped = 0
    for row in rows[1:]:
        if not row or len(row) <= col_profit:
            continue

        # Skip total/summary row (first cell starts with "Всего" or "Total")
        first = (row[0] if row else "").strip().lower()
        if first in ("всего", "total", "итого", ""):
            continue

        tid = row[col_id].strip() if col_id >= 0 and col_id < len(row) else ""
        note = f"Imported ID: {tid}" if tid else None
        if note and note in existing_notes:
            skipped += 1
            continue

        symbol = row[col_symbol].strip() if col_symbol < len(row) else ""
        if not symbol:
            continue

        open_dt = parse_dt(row[col_open_t]) if col_open_t < len(row) else None
        if not open_dt:
            continue

        profit = parse_num(row[col_profit]) if col_profit < len(row) else None
        if profit is None:
            continue

        direction_str = (row[col_dir].strip().upper() if col_dir < len(row) else "")
        open_price  = parse_num(row[col_open_p]) if col_open_p >= 0 and col_open_p < len(row) else None
        close_price = parse_num(row[col_close_p]) if col_close_p >= 0 and col_close_p < len(row) else None
        sl          = parse_num(row[col_sl]) if col_sl >= 0 and col_sl < len(row) else None
        tp          = parse_num(row[col_tp]) if col_tp >= 0 and col_tp < len(row) else None
        reason      = (row[col_reason].strip().lower() if col_reason >= 0 and col_reason < len(row) else "")

        # Determine result from reason text first, fall back to profit sign
        if "стоп" in reason or "stop" in reason or "[sl]" in reason or "s/l" in reason:
            result = Result.stop
        elif "тейк" in reason or "take" in reason or "[tp]" in reason or "t/p" in reason or "profit" in reason:
            result = Result.take
        elif profit > 0:
            result = Result.take
        elif profit < 0:
            result = Result.stop
        else:
            result = Result.be

        # RR from broker SL/TP prices when available
        rr = 1.0
        if open_price and sl and tp and direction_str in ("BUY", "SELL"):
            if direction_str == "BUY":
                risk_dist = max(open_price - sl, 1e-6)
                reward_dist = max(tp - open_price, 1e-6)
            else:
                risk_dist = max(sl - open_price, 1e-6)
                reward_dist = max(open_price - tp, 1e-6)
            rr = round(reward_dist / risk_dist, 2)

        # Risk is fixed default; PnL derived from risk*RR
        risk = 1.0
        if result == Result.stop:
            pnl_pct = -risk
        elif result == Result.take:
            pnl_pct = risk * rr
        else:
            pnl_pct = 0.0

        direction = Direction.long if direction_str == "BUY" else Direction.short

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
            user_id=current_user.id,
            symbol=symbol,
            direction=direction,
            risk=round(risk, 2),
            rr=round(rr, 2),
            result=result,
            pnl_pct=round(pnl_pct, 4),
            date=open_dt,
            session=session,
            notes=note or "Imported from CSV",
            rating=0,
        )
        db.add(trade)
        if note:
            existing_notes.add(note)
        imported += 1

    db.commit()
    return {"imported": imported, "skipped": skipped}

