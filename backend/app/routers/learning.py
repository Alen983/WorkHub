from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, LearningContent, UserLearningProgress, UserLearningAssignment
from app.schemas import (
    LearningContentResponse,
    LearningProgressResponse,
    LearningProgressUpdate,
    AssignmentResponse,
)
from app.dependencies import get_current_user
from datetime import datetime
from typing import Optional, List
import json

router = APIRouter(prefix="/learning", tags=["learning"])


def _tags_list(c):
    if c.tags is None:
        return []
    try:
        return json.loads(c.tags) if isinstance(c.tags, str) else c.tags
    except Exception:
        return []


def _content_to_response(c) -> LearningContentResponse:
    return LearningContentResponse(
        id=c.id,
        title=c.title,
        tags=_tags_list(c),
        level=c.level,
        description=c.description,
    )


@router.get("/catalog", response_model=List[LearningContentResponse])
def get_learning_catalog(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    level: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
):
    query = db.query(LearningContent)
    if level:
        query = query.filter(LearningContent.level == level)
    if tag:
        query = query.filter(LearningContent.tags.contains(f'"{tag}"'))
    items = query.order_by(LearningContent.title).all()
    return [_content_to_response(c) for c in items]


@router.get("/progress", response_model=List[LearningProgressResponse])
def get_my_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(UserLearningProgress)
        .filter(UserLearningProgress.user_id == current_user.id)
        .all()
    )
    return [
        LearningProgressResponse(
            learning_content_id=r.learning_content_id,
            status=r.status,
            completed_at=r.completed_at,
        )
        for r in rows
    ]


@router.patch("/progress", response_model=LearningProgressResponse)
def update_my_progress(
    update: LearningProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if update.status not in ("not_started", "in_progress", "completed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="status must be not_started, in_progress, or completed",
        )
    content = db.query(LearningContent).filter(LearningContent.id == update.learning_content_id).first()
    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning content not found")
    row = (
        db.query(UserLearningProgress)
        .filter(
            UserLearningProgress.user_id == current_user.id,
            UserLearningProgress.learning_content_id == update.learning_content_id,
        )
        .first()
    )
    completed_at = datetime.utcnow() if update.status == "completed" else (update.completed_at or (row.completed_at if row else None))
    if row:
        row.status = update.status
        row.completed_at = completed_at
    else:
        row = UserLearningProgress(
            user_id=current_user.id,
            learning_content_id=update.learning_content_id,
            status=update.status,
            completed_at=completed_at,
        )
        db.add(row)
    db.commit()
    db.refresh(row)
    return LearningProgressResponse(
        learning_content_id=row.learning_content_id,
        status=row.status,
        completed_at=row.completed_at,
    )


@router.get("/assigned", response_model=List[AssignmentResponse])
def get_my_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(UserLearningAssignment)
        .filter(UserLearningAssignment.user_id == current_user.id)
        .all()
    )
    out = []
    for r in rows:
        content = db.query(LearningContent).filter(LearningContent.id == r.learning_content_id).first()
        out.append(
            AssignmentResponse(
                id=r.id,
                learning_content_id=r.learning_content_id,
                assigned_at=r.assigned_at,
                due_date=r.due_date,
                content=_content_to_response(content) if content else None,
            )
        )
    return out
