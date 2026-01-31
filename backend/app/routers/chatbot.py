from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import (
    User,
    CompliancePolicy,
    ComplianceCategoryRule,
    LearningContent,
    LeaveBalance,
    LeaveRequest,
)
from app.schemas import ChatbotRequest, ChatbotResponse
from app.dependencies import get_current_user
from datetime import date
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

# Document entry: (text_for_tfidf, response_to_return, source_type)
DocEntry = tuple[str, str, str]

# Static wellness content for corpus (aligned with wellness router)
_WELLNESS_RESOURCES = [
    ("Stress management guide", "Techniques for managing workload and stress."),
    ("Sleep hygiene", "Tips for better sleep and rest."),
    ("Ergonomics at work", "Set up your workspace for comfort and health."),
]
_MENTAL_HEALTH_TIPS = [
    ("Take short breaks", "Step away from the screen every 90 minutes for a few minutes."),
    ("Stay connected", "Check in with colleagues and maintain social connections."),
    ("Set boundaries", "Define clear work hours and protect personal time."),
]
_WORK_LIFE_CONTENT = [
    ("Flexible working", "Options for hybrid and remote work."),
    ("Time off", "Use your leave balance and take regular time off."),
]

# FAQ-style (question_phrase, answer) for TF-IDF targets
_FAQ_ENTRIES = [
    (
        "how to apply leave request leave apply for leave",
        "You can apply for leave from the Leave section on your dashboard. Select dates, add a reason, and submit for approval.",
    ),
    (
        "leave balance leaves left remaining days",
        "Check your leave balance in the Leave section on your dashboard.",
    ),
    (
        "compliance policy policies due",
        "Your compliance policies and due dates are in the Compliance section.",
    ),
    (
        "course learn learning certification",
        "Recommended courses and learning content are in the Learning section.",
    ),
    (
        "wellness stress mental health break",
        "Wellness resources and tips are in the Wellness section.",
    ),
    (
        "career roadmap promotion next role",
        "Your career roadmap and next roles are in the Career section.",
    ),
]

# Keyword -> source_type for boosting
# source_type -> (path, label) for "Go to" link; faq has no single page
SOURCE_TYPE_TO_PATH_LABEL: dict[str, tuple[str, str]] = {
    "leave": ("/leave", "Leave"),
    "learning": ("/learning", "Learning & Certifications"),
    "compliance": ("/compliance", "Compliance & Policies"),
    "wellness": ("/wellness", "Wellness & Engagement"),
    "career": ("/career", "Career Growth"),
}

_KEYWORD_TO_SOURCE: dict[str, str] = {
    "leave": "leave",
    "balance": "leave",
    "leaves": "leave",
    "apply": "leave",
    "policy": "compliance",
    "policies": "compliance",
    "compliance": "compliance",
    "course": "learning",
    "courses": "learning",
    "learn": "learning",
    "learning": "learning",
    "certification": "learning",
    "wellness": "wellness",
    "stress": "wellness",
    "mental": "wellness",
    "health": "wellness",
    "career": "career",
    "promotion": "career",
    "roadmap": "career",
}

TFIDF_THRESHOLD = 0.25
KEYWORD_BOOST = 0.2


def _get_user_policies(db: Session, current_user: User):
    """Policies for user's department or department='All'."""
    return db.query(CompliancePolicy).filter(
        or_(
            CompliancePolicy.department == current_user.department,
            CompliancePolicy.department.ilike("all"),
        )
    ).order_by(CompliancePolicy.due_date).all()


def _get_learning_content(db: Session, current_user: User):
    """Get learning content relevant to user."""
    all_learning = db.query(LearningContent).all()
    relevant = []
    dept_lower = current_user.department.lower()
    for content in all_learning:
        title_lower = content.title.lower()
        tags = json.loads(content.tags) if content.tags else []
        tags_lower = [str(t).lower() for t in tags]
        if dept_lower in title_lower or any(dept_lower in tag for tag in tags_lower):
            relevant.append(content)
    return relevant[:5] if relevant else all_learning[:5]


def _get_leave_balance(db: Session, current_user: User) -> int:
    """User's remaining leave balance for current year."""
    current_year = date.today().year
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.user_id == current_user.id,
        LeaveBalance.year == current_year,
    ).first()
    if balance:
        return balance.remaining_leaves
    return 20


def _get_user_leave_requests(db: Session, current_user: User):
    """User's leave requests for summary."""
    return db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == current_user.id
    ).order_by(LeaveRequest.from_date.desc()).limit(10).all()


def _format_policies_response(policies) -> str:
    if not policies:
        return "No compliance policies are currently assigned to you."
    parts = ["Your compliance policies:"]
    for policy in policies[:10]:
        category = getattr(policy, "category", None) or "Uncategorized"
        parts.append(f"• {policy.title} ({category}) - Due: {policy.due_date.strftime('%Y-%m-%d')}")
    return "\n".join(parts)


def _format_learning_response(learning_content) -> str:
    if not learning_content:
        return "No learning courses are currently available."
    parts = ["Recommended courses:"]
    for content in learning_content[:5]:
        parts.append(f"• {content.title} ({content.level})")
        if content.description:
            parts.append(f"  {content.description}")
    return "\n".join(parts)


def _build_corpus(db: Session, current_user: User) -> list[DocEntry]:
    """Build list of (text, response, source_type) from dashboard data and static content."""
    entries: list[DocEntry] = []

    # Policies
    policies = _get_user_policies(db, current_user)
    if policies:
        response = _format_policies_response(policies)
        for p in policies[:10]:
            text = f"{p.title} {(p.description or '')} {p.department} due {p.due_date}"
            entries.append((text.strip(), response, "compliance"))
    else:
        entries.append(
            ("compliance policy no policies", "No compliance policies are currently assigned to you.", "compliance")
        )

    # Learning
    learning = _get_learning_content(db, current_user)
    if learning:
        response = _format_learning_response(learning)
        for c in learning[:5]:
            tags = json.loads(c.tags) if c.tags else []
            text = f"{c.title} {(c.description or '')} {c.level} {' '.join(str(t) for t in tags)}"
            entries.append((text.strip(), response, "learning"))
    else:
        entries.append(
            ("learning course no courses", "No learning courses are currently available.", "learning")
        )

    # Leave balance
    remaining = _get_leave_balance(db, current_user)
    leave_balance_response = f"You have {remaining} days of leave remaining this year."
    entries.append(
        ("leave balance remaining days leaves left", leave_balance_response, "leave")
    )

    # Leave requests summary
    requests = _get_user_leave_requests(db, current_user)
    if requests:
        parts = ["Your recent leave requests:"]
        for r in requests[:5]:
            parts.append(f"• {r.from_date} to {r.to_date}: {r.reason} ({r.status})")
        leave_requests_response = "\n".join(parts)
        text = " ".join(f"{r.from_date} {r.to_date} {r.reason} {r.status}" for r in requests[:5])
        entries.append((text, leave_requests_response, "leave"))
    else:
        entries.append(
            ("leave requests my leaves", "You have no leave requests on file. Apply from the Leave section.", "leave")
        )

    # Wellness (static)
    for title, content in _WELLNESS_RESOURCES + _MENTAL_HEALTH_TIPS + _WORK_LIFE_CONTENT:
        text = f"{title} {content}"
        entries.append((text, f"{title}: {content}", "wellness"))

    # Career (one doc from user prefs + static paths)
    prefs = {}
    raw = getattr(current_user, "career_preferences", None) or "{}"
    try:
        prefs = json.loads(raw) if isinstance(raw, str) else (raw or {})
    except Exception:
        pass
    current_role_data = prefs.get("current_role")
    if isinstance(current_role_data, dict) and current_role_data.get("title"):
        role_title = str(current_role_data.get("title", "Your role"))
        role_dept = str(current_role_data.get("department", current_user.department))
    else:
        role_title = (current_user.role or "Employee").replace("_", " ").title()
        role_dept = current_user.department
    career_text = (
        f"career roadmap current role {role_title} department {role_dept} "
        "next roles Senior Developer Tech Lead Staff Engineer Principal Engineer Engineering Manager Product Manager"
    )
    career_response = (
        f"Your current role is {role_title} in {role_dept}. "
        "Next steps: Senior Developer, Tech Lead, or similar. See the Career section for your full roadmap."
    )
    entries.append((career_text, career_response, "career"))

    # Compliance category rules
    rules = db.query(ComplianceCategoryRule).order_by(
        ComplianceCategoryRule.category, ComplianceCategoryRule.display_order, ComplianceCategoryRule.id
    ).all()
    for r in rules:
        entries.append((r.rule_text or "", r.rule_text or "", "compliance"))

    # FAQ
    for question_phrase, answer in _FAQ_ENTRIES:
        entries.append((question_phrase, answer, "faq"))

    return entries


def _get_keyword_boost_source(message_lower: str) -> str | None:
    """Return source_type to boost if message contains a keyword."""
    for keyword, source_type in _KEYWORD_TO_SOURCE.items():
        if keyword in message_lower:
            return source_type
    return None


def _tfidf_best_match(message: str, corpus: list[DocEntry]) -> tuple[str | None, float, str | None]:
    """
    Return (response, best_score, source_type) for the best matching document,
    or (None, 0.0, None). Uses TF-IDF + optional keyword boost.
    """
    if not corpus:
        return None, 0.0, None

    texts = [e[0] for e in corpus]
    if not any(t.strip() for t in texts):
        return None, 0.0, None

    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2), stop_words="english")
    try:
        doc_matrix = vectorizer.fit_transform(texts)
    except Exception:
        return None, 0.0, None
    query_vec = vectorizer.transform([message])
    sims = cosine_similarity(query_vec, doc_matrix).flatten()

    message_lower = message.lower()
    boost_source = _get_keyword_boost_source(message_lower)
    if boost_source:
        for i, entry in enumerate(corpus):
            if entry[2] == boost_source and i < len(sims):
                sims[i] = sims[i] + KEYWORD_BOOST

    best_idx = int(sims.argmax())
    best_score = float(sims[best_idx])
    entry = corpus[best_idx]
    return entry[1], best_score, entry[2]


@router.post("/echo", response_model=ChatbotResponse)
def echo_chatbot(
    request: ChatbotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """TF-IDF + keyword-based chatbot using dashboard text; no external API."""
    message = (request.message or "").strip()
    message_lower = message.lower()

    # Exact fallbacks first (numeric/specific answers)
    if "leave balance" in message_lower or "leaves left" in message_lower:
        remaining = _get_leave_balance(db, current_user)
        return ChatbotResponse(
            response=f"You have {remaining} days of leave remaining this year.",
            go_to_path="/leave",
            go_to_label="Leave",
        )
    if "apply leave" in message_lower or "request leave" in message_lower:
        return ChatbotResponse(
            response="You can apply for leave from the Leave section on your dashboard. "
                    "Select dates, add a reason, and submit for approval.",
            go_to_path="/leave",
            go_to_label="Leave",
        )

    # Build corpus and run TF-IDF
    corpus = _build_corpus(db, current_user)
    response_text, score, source_type = _tfidf_best_match(message, corpus)

    if response_text is not None and score >= TFIDF_THRESHOLD:
        path_label = SOURCE_TYPE_TO_PATH_LABEL.get(source_type) if source_type and source_type != "faq" else None
        if path_label:
            return ChatbotResponse(
                response=response_text,
                go_to_path=path_label[0],
                go_to_label=path_label[1],
            )
        return ChatbotResponse(response=response_text)

    # Generic fallback
    return ChatbotResponse(
        response="I can help with leave, learning, compliance, wellness, and career. "
                "Ask about your leave balance, policies, or courses."
    )
