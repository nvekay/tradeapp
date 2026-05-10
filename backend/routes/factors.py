from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Factor
from schemas import FactorCreate, FactorOut

router = APIRouter(prefix="/factors", tags=["factors"])


@router.get("/", response_model=list[FactorOut])
def list_factors(db: Session = Depends(get_db)):
    return db.query(Factor).order_by(Factor.name).all()


@router.post("/", response_model=FactorOut, status_code=201)
def create_factor(payload: FactorCreate, db: Session = Depends(get_db)):
    existing = db.query(Factor).filter(Factor.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Factor already exists")
    factor = Factor(name=payload.name)
    db.add(factor)
    db.commit()
    db.refresh(factor)
    return factor


@router.delete("/{factor_id}", status_code=204)
def delete_factor(factor_id: int, db: Session = Depends(get_db)):
    factor = db.get(Factor, factor_id)
    if not factor:
        raise HTTPException(status_code=404, detail="Factor not found")
    db.delete(factor)
    db.commit()
