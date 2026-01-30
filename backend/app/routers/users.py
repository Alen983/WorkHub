from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path
import os
import uuid
import json
from app.database import get_db
from app.models import User, UserDocument
from app.schemas import UserResponse, UserProfileUpdate, UserDocumentResponse
from app.dependencies import get_current_user, require_role

router = APIRouter(prefix="/users", tags=["users"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "uploads"


def _json_load(s, default):
    if s is None or s == "":
        return default
    try:
        return json.loads(s)
    except Exception:
        return default


def _user_to_response(user: User, db: Session) -> dict:
    manager_name = None
    if getattr(user, "manager_id", None) and user.manager_id:
        manager = db.query(User).filter(User.id == user.manager_id).first()
        manager_name = manager.name if manager else None
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": user.department,
        "skills": _json_load(user.skills, []),
        "phone": getattr(user, "phone", None) or None,
        "address": getattr(user, "address", None) or None,
        "manager_id": getattr(user, "manager_id", None),
        "manager_name": manager_name,
        "interests": _json_load(getattr(user, "interests", None), []),
        "certifications": _json_load(getattr(user, "certifications", None), []),
        "career_preferences": _json_load(getattr(user, "career_preferences", None), {}),
    }


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _user_to_response(current_user, db)


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    update: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if update.name is not None:
        current_user.name = update.name
    if update.phone is not None:
        current_user.phone = update.phone
    if update.address is not None:
        current_user.address = update.address
    if update.manager_id is not None:
        current_user.manager_id = update.manager_id
    if update.skills is not None:
        current_user.skills = json.dumps(update.skills)
    if update.interests is not None:
        current_user.interests = json.dumps(update.interests)
    if update.certifications is not None:
        current_user.certifications = json.dumps(update.certifications)
    if update.career_preferences is not None:
        current_user.career_preferences = json.dumps(update.career_preferences)
    db.commit()
    db.refresh(current_user)
    return _user_to_response(current_user, db)


@router.get("/me/documents", response_model=List[UserDocumentResponse])
def list_my_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    docs = db.query(UserDocument).filter(UserDocument.user_id == current_user.id).order_by(UserDocument.uploaded_at.desc()).all()
    return docs


@router.post("/me/documents", response_model=UserDocumentResponse)
def upload_my_document(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    type: str = Form("certificate"),
):
    if type not in ("id", "certificate"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="type must be 'id' or 'certificate'")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "file").suffix or ".bin"
    safe_name = f"{current_user.id}_{uuid.uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / safe_name
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    rel_path = str(file_path)
    doc = UserDocument(
        user_id=current_user.id,
        type=type,
        filename=file.filename or safe_name,
        file_path=rel_path,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/me/documents/{doc_id}")
def get_my_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(UserDocument).filter(UserDocument.id == doc_id, UserDocument.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    path = Path(doc.file_path)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return FileResponse(path, filename=doc.filename)


@router.get("/managers")
def list_managers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(User).filter(User.role == "manager")
    if current_user.role == "employee":
        q = q.filter(User.department == current_user.department)
    managers = q.order_by(User.name).all()
    return [{"id": m.id, "name": m.name, "department": m.department} for m in managers]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "manager":
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if target_user.department != current_user.department:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Can only view users in your department")
        return _user_to_response(target_user, db)
    if current_user.role == "hr":
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return _user_to_response(target_user, db)
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return _user_to_response(current_user, db)


@router.get("", response_model=List[UserResponse])
def get_all_users(
    current_user: User = Depends(require_role("hr")),
    db: Session = Depends(get_db),
):
    users = db.query(User).all()
    return [_user_to_response(u, db) for u in users]


