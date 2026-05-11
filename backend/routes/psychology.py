from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import PsychologyTag, User
from schemas import PsychologyTagCreate, PsychologyTagOut
from auth import get_current_user

router = APIRouter(prefix="/psychology", tags=["psychology"])


@router.get("/", response_model=list[PsychologyTagOut])
def list_tags(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(PsychologyTag).filter(PsychologyTag.user_id == current_user.id).order_by(PsychologyTag.name).all()


@router.post("/", response_model=PsychologyTagOut, status_code=201)
def create_tag(payload: PsychologyTagCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name required")
    existing = db.query(PsychologyTag).filter(PsychologyTag.name == name, PsychologyTag.user_id == current_user.id).first()
    if existing:
        return existing
    tag = PsychologyTag(name=name, user_id=current_user.id)
    db.add(tag); db.commit(); db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tag = db.get(PsychologyTag, tag_id)
    if not tag or tag.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(tag); db.commit()
