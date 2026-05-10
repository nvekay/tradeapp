from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from database import get_db
from models import DailyJournal
from schemas import DailyJournalCreate, DailyJournalUpdate, DailyJournalOut

router = APIRouter(prefix="/journal", tags=["journal"])

@router.get("/", response_model=list[str])
def list_journal_dates(db: Session = Depends(get_db)):
    """Return all dates that have a journal entry."""
    entries = db.query(DailyJournal.date).order_by(DailyJournal.date.desc()).all()
    return [e.date for e in entries]

@router.get("/{date}", response_model=DailyJournalOut)
def get_journal(date: str, db: Session = Depends(get_db)):
    journal = db.query(DailyJournal).filter(DailyJournal.date == date).first()
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    return journal

@router.post("/", response_model=DailyJournalOut, status_code=201)
def create_journal(payload: DailyJournalCreate, db: Session = Depends(get_db)):
    journal = db.query(DailyJournal).filter(DailyJournal.date == payload.date).first()
    if journal:
        raise HTTPException(status_code=400, detail="Journal entry for this date already exists")
    
    new_journal = DailyJournal(
        date=payload.date,
        pre_mood=payload.pre_mood,
        pre_plan=payload.pre_plan,
        post_mood=payload.post_mood,
        post_learned=payload.post_learned
    )
    db.add(new_journal)
    db.commit()
    db.refresh(new_journal)
    return new_journal

@router.put("/{date}", response_model=DailyJournalOut)
def update_journal(date: str, payload: DailyJournalUpdate, db: Session = Depends(get_db)):
    journal = db.query(DailyJournal).filter(DailyJournal.date == date).first()
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
        
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(journal, field, value)
        
    db.commit()
    db.refresh(journal)
    return journal
