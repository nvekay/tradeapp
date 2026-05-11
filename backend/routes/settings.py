from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserSettings, UserSettingsUpdate
from auth import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/", response_model=UserSettings)
def get_settings(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/", response_model=UserSettings)
def update_settings(payload: UserSettingsUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(current_user, k, v)
    db.commit(); db.refresh(current_user)
    return current_user
