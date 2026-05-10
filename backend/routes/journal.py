from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from database import get_db
from models import DailyJournal, User
from schemas import DailyJournalCreate, DailyJournalUpdate, DailyJournalOut
from auth import get_current_user

router = APIRouter(prefix="/journal", tags=["journal"])

@router.get("/dates", response_model=list[str])
def get_journal_dates(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    journals = db.query(DailyJournal.date).filter(DailyJournal.user_id == current_user.id).all()
    return [j.date for j in journals]

@router.get("/{date}", response_model=DailyJournalOut)
def get_journal(date: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    journal = db.query(DailyJournal).filter(DailyJournal.date == date, DailyJournal.user_id == current_user.id).first()
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    return journal

@router.post("/", response_model=DailyJournalOut, status_code=201)
def create_journal(payload: DailyJournalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    journal = db.query(DailyJournal).filter(DailyJournal.date == payload.date, DailyJournal.user_id == current_user.id).first()
    if journal:
        raise HTTPException(status_code=400, detail="Journal entry for this date already exists")
    
    new_journal = DailyJournal(
        date=payload.date,
        pre_mood=payload.pre_mood,
        pre_plan=payload.pre_plan,
        post_mood=payload.post_mood,
        post_learned=payload.post_learned,
        user_id=current_user.id
    )
    db.add(new_journal)
    db.commit()
    db.refresh(new_journal)
    return new_journal

@router.put("/{date}", response_model=DailyJournalOut)
def update_journal(date: str, payload: DailyJournalUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    journal = db.query(DailyJournal).filter(DailyJournal.date == date, DailyJournal.user_id == current_user.id).first()
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
        
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(journal, field, value)
        
    db.commit()
    db.refresh(journal)
    return journal
