from fastapi import APIRouter, Depends
from app.database import get_db
from app.models import User
from app.schemas import CareerRoadmapResponse, CareerRoleInfo, CareerPath, CareerPathNextRole
from app.dependencies import get_current_user
import json

router = APIRouter(prefix="/career", tags=["career"])

# Role graph: current_role_title -> list of (path_type, path_label, [(next_title, department), ...])
# Path types: most_common, similar, pivot
ROLE_GRAPH = {
    "data scientist": [
        ("most_common", "Most common", [("Senior Data Scientist", "Engineering")]),
        ("similar", "Similar", [("Machine Learning Engineer", "Engineering")]),
        ("pivot", "Pivot", [
            ("Software Engineer", "Engineering"),
            ("Data Engineer", "Information Technology"),
            ("Data Analyst", "Information Technology"),
        ]),
    ],
    "senior data scientist": [
        ("most_common", "Most common", [("Staff Data Scientist", "Engineering"), ("Principal Data Scientist", "Engineering")]),
        ("similar", "Similar", [("ML Engineering Lead", "Engineering")]),
        ("pivot", "Pivot", [("Engineering Manager", "Engineering"), ("Data Science Manager", "Engineering")]),
    ],
    "software engineer": [
        ("most_common", "Most common", [("Senior Software Engineer", "Engineering")]),
        ("similar", "Similar", [("Full Stack Developer", "Engineering"), ("Backend Engineer", "Engineering")]),
        ("pivot", "Pivot", [
            ("Data Engineer", "Information Technology"),
            ("DevOps Engineer", "Engineering"),
            ("Product Manager", "Product"),
        ]),
    ],
    "senior software engineer": [
        ("most_common", "Most common", [("Staff Engineer", "Engineering"), ("Principal Engineer", "Engineering")]),
        ("similar", "Similar", [("Tech Lead", "Engineering")]),
        ("pivot", "Pivot", [("Engineering Manager", "Engineering"), ("Architect", "Engineering")]),
    ],
    "senior developer": [
        ("most_common", "Most common", [("Tech Lead", "Engineering"), ("Staff Engineer", "Engineering")]),
        ("similar", "Similar", [("Principal Developer", "Engineering")]),
        ("pivot", "Pivot", [("Engineering Manager", "Engineering"), ("Architect", "Engineering"), ("Product Manager", "Product")]),
    ],
    "developer": [
        ("most_common", "Most common", [("Senior Developer", "Engineering"), ("Senior Software Engineer", "Engineering")]),
        ("similar", "Similar", [("Full Stack Developer", "Engineering"), ("Backend Developer", "Engineering")]),
        ("pivot", "Pivot", [("Data Analyst", "Information Technology"), ("QA Engineer", "Engineering")]),
    ],
    "engineer": [
        ("most_common", "Most common", [("Senior Engineer", "Engineering")]),
        ("similar", "Similar", [("Software Engineer", "Engineering"), ("Systems Engineer", "Engineering")]),
        ("pivot", "Pivot", [("Project Manager", "Engineering"), ("Technical Lead", "Engineering")]),
    ],
    "engineering": [
        ("most_common", "Most common", [("Senior Engineer", "Engineering"), ("Tech Lead", "Engineering")]),
        ("similar", "Similar", [("Software Engineer", "Engineering")]),
        ("pivot", "Pivot", [("Engineering Manager", "Engineering"), ("Product Manager", "Product")]),
    ],
    "sales": [
        ("most_common", "Most common", [("Senior Sales Representative", "Sales"), ("Sales Lead", "Sales")]),
        ("similar", "Similar", [("Account Executive", "Sales"), ("Business Development", "Sales")]),
        ("pivot", "Pivot", [("Sales Manager", "Sales"), ("Customer Success Manager", "Sales")]),
    ],
    "hr": [
        ("most_common", "Most common", [("Senior HR Specialist", "HR"), ("HR Lead", "HR")]),
        ("similar", "Similar", [("Talent Acquisition", "HR"), ("HR Business Partner", "HR")]),
        ("pivot", "Pivot", [("HR Manager", "HR"), ("People Operations", "HR")]),
    ],
}

DEFAULT_ROADMAP = [
    ("most_common", "Most common", [("Senior role in your track", "Your department")]),
    ("similar", "Similar", [("Related specialist role", "Your department")]),
    ("pivot", "Pivot", [("Cross-functional role", "Other department")]),
]


def _json_load(s, default):
    if s is None or s == "":
        return default
    try:
        return json.loads(s)
    except Exception:
        return default


def _resolve_current_role(user: User) -> tuple:
    """Return (title, department) for the user's current role."""
    prefs = _json_load(getattr(user, "career_preferences", None), {})
    current = prefs.get("current_role") if isinstance(prefs.get("current_role"), str) else None
    if current and current.strip():
        return (current.strip(), user.department or "Your department")
    preferred = prefs.get("preferred_roles")
    if isinstance(preferred, list) and preferred:
        first = preferred[0]
        if first and isinstance(first, str) and first.strip():
            return (first.strip(), user.department or "Your department")
    if isinstance(preferred, str) and preferred.strip():
        return (preferred.strip(), user.department or "Your department")
    return (user.department or "Your role", user.department or "Your department")


def _match_role_graph(title: str) -> list:
    """Return list of (path_type, path_label, [(next_title, department), ...]) for the given title."""
    key = (title or "").strip().lower()
    if not key:
        return DEFAULT_ROADMAP
    if key in ROLE_GRAPH:
        return ROLE_GRAPH[key]
    for graph_key, paths in ROLE_GRAPH.items():
        if graph_key in key or key in graph_key:
            return paths
    return DEFAULT_ROADMAP


@router.get("/roadmap", response_model=CareerRoadmapResponse)
def get_career_roadmap(
    current_user: User = Depends(get_current_user),
):
    title, department = _resolve_current_role(current_user)
    raw_paths = _match_role_graph(title)
    paths = [
        CareerPath(
            type=ptype,
            label=plabel,
            next_roles=[CareerPathNextRole(title=t, department=d) for t, d in next_roles],
        )
        for ptype, plabel, next_roles in raw_paths
    ]
    return CareerRoadmapResponse(
        current_role=CareerRoleInfo(title=title, department=department),
        paths=paths,
    )
