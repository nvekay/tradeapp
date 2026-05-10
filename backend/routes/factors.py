from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Factor, User
from schemas import FactorCreate, FactorOut
from auth import get_current_user

router = APIRouter(prefix="/factors", tags=["factors"])


@router.get("/", response_model=list[FactorOut])
def list_factors(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Factor).filter(Factor.user_id == current_user.id).order_by(Factor.name).all()


@router.post("/", response_model=FactorOut, status_code=201)
def create_factor(payload: FactorCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(Factor).filter(Factor.name == payload.name, Factor.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Factor already exists")
    factor = Factor(name=payload.name, user_id=current_user.id)
    db.add(factor)
    db.commit()
    db.refresh(factor)
    return factor


@router.delete("/{factor_id}", status_code=204)
def delete_factor(factor_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    factor = db.get(Factor, factor_id)
    if not factor or factor.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Factor not found")
    db.delete(factor)
    db.commit()
