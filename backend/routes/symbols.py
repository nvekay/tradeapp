from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import UserSymbol, User
from schemas import UserSymbolCreate, UserSymbolOut
from auth import get_current_user

router = APIRouter(prefix="/symbols", tags=["symbols"])


@router.get("/", response_model=list[UserSymbolOut])
def list_symbols(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(UserSymbol).filter(UserSymbol.user_id == current_user.id).order_by(UserSymbol.name).all()


@router.post("/", response_model=UserSymbolOut, status_code=201)
def create_symbol(payload: UserSymbolCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = payload.name.strip().upper()
    if not name:
        raise HTTPException(status_code=400, detail="Name required")
    existing = db.query(UserSymbol).filter(UserSymbol.name == name, UserSymbol.user_id == current_user.id).first()
    if existing:
        return existing
    sym = UserSymbol(name=name, user_id=current_user.id)
    db.add(sym); db.commit(); db.refresh(sym)
    return sym


@router.delete("/{symbol_id}", status_code=204)
def delete_symbol(symbol_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sym = db.get(UserSymbol, symbol_id)
    if not sym or sym.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Symbol not found")
    db.delete(sym); db.commit()
