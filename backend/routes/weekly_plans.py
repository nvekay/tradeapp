from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User, WeeklyPlan
from schemas import WeeklyPlanOut, WeeklyPlanUpsert

router = APIRouter(prefix="/weekly-plans", tags=["weekly-plans"])


@router.get("/{week_start}", response_model=WeeklyPlanOut)
def get_weekly_plan(week_start: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.week_start == week_start,
        WeeklyPlan.user_id == current_user.id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Weekly plan not found")
    return plan


@router.put("/{week_start}", response_model=WeeklyPlanOut)
def upsert_weekly_plan(week_start: str, payload: WeeklyPlanUpsert, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(WeeklyPlan).filter(
        WeeklyPlan.week_start == week_start,
        WeeklyPlan.user_id == current_user.id,
    ).first()

    if not plan:
        plan = WeeklyPlan(week_start=week_start, user_id=current_user.id)
        db.add(plan)

    update_data = payload.model_dump(exclude_unset=True)
    update_data.pop("week_start", None)
    for field, value in update_data.items():
        setattr(plan, field, value)

    db.commit()
    db.refresh(plan)
    return plan
