from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import timedelta
import os

from database import get_db
from models import User
from schemas import UserCreate, UserLogin, UserGoogleLogin, Token, UserOut
from auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    new_user = User(email=user_in.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    if not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=Token)
def google_login(payload: UserGoogleLogin, db: Session = Depends(get_db)):
    try:
        # Validate the token
        request = google_requests.Request()
        id_info = id_token.verify_oauth2_token(payload.credential, request, GOOGLE_CLIENT_ID)
        
        email = id_info.get('email')
        google_id = id_info.get('sub')
        
        if not email:
            raise HTTPException(status_code=400, detail="Google token does not contain email")
            
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Create user
            user = User(email=email, google_id=google_id)
            db.add(user)
            db.commit()
            db.refresh(user)
        elif not user.google_id:
            # Update existing user to link google account
            user.google_id = google_id
            db.commit()
            
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
