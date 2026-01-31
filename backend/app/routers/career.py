from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import (
    CareerRoadmapResponse,
    CareerRoleInfo,
    CareerPath,
    CareerPathNextRole,
)
from app.dependencies import get_current_user
import json

router = APIRouter(prefix="/career", tags=["career"])


def _parse_prefs(user: User) -> dict:
    raw = getattr(user, "career_preferences", None) or "{}"
    try:
        return json.loads(raw) if isinstance(raw, str) else (raw or {})
    except Exception:
        return {}


@router.get("/roadmap", response_model=CareerRoadmapResponse)
def get_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prefs = _parse_prefs(current_user)
    current_role_data = prefs.get("current_role")
    if isinstance(current_role_data, dict) and current_role_data.get("title"):
        current_role = CareerRoleInfo(
            title=str(current_role_data.get("title", "Your role")),
            department=str(current_role_data.get("department", current_user.department)),
        )
    else:
        role_label = current_user.role.replace("_", " ").title()
        current_role = CareerRoleInfo(
            title=role_label,
            department=current_user.department,
        )

    dept = current_user.department
    paths = [
        CareerPath(
            type="most_common",
            label="Most common path",
            next_roles=[
                CareerPathNextRole(title="Senior Developer", department=dept),
                CareerPathNextRole(title="Tech Lead", department=dept),
            ],
        ),
        CareerPath(
            type="similar",
            label="Similar roles",
            next_roles=[
                CareerPathNextRole(title="Staff Engineer", department=dept),
                CareerPathNextRole(title="Principal Engineer", department=dept),
            ],
        ),
        CareerPath(
            type="pivot",
            label="Pivot options",
            next_roles=[
                CareerPathNextRole(title="Engineering Manager", department=dept),
                CareerPathNextRole(title="Product Manager", department="Product"),
            ],
        ),
    ]
    return CareerRoadmapResponse(current_role=current_role, paths=paths)
