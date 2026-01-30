import os
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.models import User, DashboardConfig
from app.schemas import LoginRequest, Token, UserCreate, UserResponse
from app.auth import verify_password, get_password_hash, create_access_token
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

def _debug_log(msg: str, data: dict, hypothesis_id: str = ""):
    # #region agent log
    try:
        log_path = os.environ.get("DEBUG_LOG_PATH") or str(Path(__file__).resolve().parent.parent.parent.parent.parent / ".cursor" / "debug.log")
        payload = {"message": msg, "data": data, "timestamp": __import__("time").time() * 1000, "sessionId": "debug-session", "hypothesisId": hypothesis_id, "location": "auth.py:login"}
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")
    except Exception:
        pass
    # #endregion


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    # #region agent log
    _debug_log("login request", {"email": credentials.email, "password_len": len(credentials.password)}, "C")
    # #endregion
    user = db.query(User).filter(User.email == credentials.email).first()
    # #region agent log
    _debug_log("user lookup", {"email": credentials.email, "user_found": user is not None, "user_id": getattr(user, "id", None)}, "A")
    # #endregion
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    # #region agent log
    pwd_ok = verify_password(credentials.password, user.password_hash)
    _debug_log("password check", {"user_id": user.id, "password_ok": pwd_ok, "hash_prefix": (user.password_hash or "")[:20]}, "B")
    # #endregion
    if not pwd_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "department": user.department},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    import json
    password_hash = get_password_hash(user_data.password)
    skills_json = json.dumps(user_data.skills)
    
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=password_hash,
        role=user_data.role,
        department=user_data.department,
        skills=skills_json
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    dashboard_config = DashboardConfig(
        user_id=new_user.id,
        show_leaves=True,
        show_learning=True,
        show_compliance=True
    )
    db.add(dashboard_config)
    db.commit()
    
    new_user.skills = user_data.skills
    return new_user
