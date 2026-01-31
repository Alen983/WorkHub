from fastapi import APIRouter, Depends, HTTPException, Query
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
import json

router = APIRouter(prefix="/learning", tags=["learning"])


def _tags_list(c: LearningContent) -> list:
    if c is None or not hasattr(c, "tags"):
        return []
    if isinstance(c.tags, list):
        return c.tags
    try:
        return json.loads(c.tags) if c.tags else []
    except Exception:
        return []


def _content_to_response(c: LearningContent) -> LearningContentResponse:
    return LearningContentResponse(
        id=c.id,
        title=c.title,
        tags=_tags_list(c),
        level=c.level,
        description=c.description,
    )


@router.get("/catalog", response_model=list[LearningContentResponse])
def get_catalog(
    level: str | None = Query(None, description="Filter by level"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(LearningContent)
    if level:
        q = q.filter(LearningContent.level == level)
    items = q.all()
    return [_content_to_response(c) for c in items]


@router.get("/progress", response_model=list[LearningProgressResponse])
def get_progress(
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


@router.get("/assigned", response_model=list[AssignmentResponse])
def get_assigned(
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
        content = (
            db.query(LearningContent)
            .filter(LearningContent.id == r.learning_content_id)
            .first()
        )
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


@router.patch("/progress")
def update_progress(
    body: LearningProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress = (
        db.query(UserLearningProgress)
        .filter(
            UserLearningProgress.user_id == current_user.id,
            UserLearningProgress.learning_content_id == body.learning_content_id,
        )
        .first()
    )
    if progress:
        progress.status = body.status
        if body.status == "completed":
            progress.completed_at = datetime.utcnow()
    else:
        progress = UserLearningProgress(
            user_id=current_user.id,
            learning_content_id=body.learning_content_id,
            status=body.status,
            completed_at=datetime.utcnow() if body.status == "completed" else None,
        )
        db.add(progress)
    db.commit()
    return {"message": "Progress updated"}
