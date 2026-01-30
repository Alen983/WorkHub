from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, CompliancePolicy, LearningContent, DashboardConfig
from app.schemas import (
    UserCreate, UserResponse,
    CompliancePolicyCreate, CompliancePolicyResponse,
    LearningContentCreate, LearningContentResponse
)
from app.dependencies import require_role
from app.auth import get_password_hash
import json

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/user", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_role("hr")),
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
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


@router.delete("/user/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(require_role("hr")),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.get("/compliance", response_model=List[CompliancePolicyResponse])
def list_compliance_policies(
    current_user: User = Depends(require_role("hr")),
    db: Session = Depends(get_db)
):
    policies = db.query(CompliancePolicy).order_by(CompliancePolicy.due_date).all()
    return policies


@router.post("/compliance", response_model=CompliancePolicyResponse)
def create_compliance_policy(
    policy_data: CompliancePolicyCreate,
    current_user: User = Depends(require_role("hr")),
    db: Session = Depends(get_db)
):
    new_policy = CompliancePolicy(
        title=policy_data.title,
        department=policy_data.department,
        due_date=policy_data.due_date,
        description=policy_data.description
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return new_policy


@router.delete("/compliance/{policy_id}")
def delete_compliance_policy(
    policy_id: int,
    current_user: User = Depends(require_role("hr")),
    db: Session = Depends(get_db)
):
    policy = db.query(CompliancePolicy).filter(CompliancePolicy.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    db.delete(policy)
    db.commit()
    return {"message": "Policy deleted successfully"}


@router.post("/learning", response_model=LearningContentResponse)
def create_learning_content(
    content_data: LearningContentCreate,
    current_user: User = Depends(require_role("hr")),
    db: Session = Depends(get_db)
):
    tags_json = json.dumps(content_data.tags)
    new_content = LearningContent(
        title=content_data.title,
        tags=tags_json,
        level=content_data.level,
        description=content_data.description
    )
    db.add(new_content)
    db.commit()
    db.refresh(new_content)
    new_content.tags = content_data.tags
    return new_content
