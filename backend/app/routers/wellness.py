from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, LeaveBalance, LeaveRequest, UserLearningProgress
from app.schemas import (
    WellnessLink,
    WellnessResourceResponse,
    MentalHealthTip,
    WorkLifeContent,
    SurveyListItem,
    SurveyDetail,
    SurveyQuestion,
    SurveySubmitRequest,
    WellnessNudge,
)
from app.dependencies import get_current_user
from app.config import settings
from datetime import datetime, timedelta
from typing import List

router = APIRouter(prefix="/wellness", tags=["wellness"])

# Static wellness resources
WELLNESS_RESOURCES: List[dict] = [
    {"title": "Employee Assistance Program", "content": "Confidential support for personal and work issues.", "category": "support", "url": None},
    {"title": "Health & Fitness Guidelines", "content": "Company guidelines for staying active and healthy.", "category": "physical", "url": None},
    {"title": "Sleep & Recovery", "content": "Tips for better sleep and recovery after work.", "category": "physical", "url": None},
]

# Mental health tips
MENTAL_HEALTH_TIPS: List[dict] = [
    {"title": "Take short breaks", "content": "Step away from your desk every 90 minutes. A 5-minute walk or stretch can reset your focus.", "category": "breaks"},
    {"title": "Set boundaries", "content": "Define clear start and end times for work. Avoid checking email after hours when possible.", "category": "work_life"},
    {"title": "Practice breathing", "content": "Try 4-7-8 breathing: inhale 4 counts, hold 7, exhale 8. Repeat a few times when stressed.", "category": "stress"},
    {"title": "Stay connected", "content": "Reach out to a colleague or friend. Social connection supports mental well-being.", "category": "social"},
    {"title": "Acknowledge feelings", "content": "It's okay to feel overwhelmed. Naming the feeling can reduce its intensity.", "category": "mindfulness"},
]

# Work-life balance content
WORK_LIFE_CONTENT: List[dict] = [
    {"title": "Flexible working", "content": "Use flexible hours and remote options where available. Align your schedule with your energy levels.", "url": None},
    {"title": "Time blocking", "content": "Block focus time and break time on your calendar. Protect these blocks like meetings.", "url": None},
    {"title": "Unplug after work", "content": "Create a simple end-of-day ritual (e.g. close laptop, short walk) to signal work is done.", "url": None},
]

# Static engagement surveys (no DB in Phase 1)
SURVEYS: dict = {
    "wellness-check-2025": {
        "id": "wellness-check-2025",
        "title": "Wellness Check-in",
        "description": "Quick check-in to see how you're doing and what support might help.",
        "questions": [
            {"id": "q1", "question": "How would you rate your overall well-being this week? (1 = low, 5 = high)", "type": "scale", "options": ["1", "2", "3", "4", "5"]},
            {"id": "q2", "question": "What would help you most right now?", "type": "single_choice", "options": ["More flexible hours", "Mental health resources", "Fitness options", "Better work-life balance", "Other"]},
            {"id": "q3", "question": "Any comments or suggestions? (optional)", "type": "text", "options": None},
        ],
    },
    "engagement-pulse": {
        "id": "engagement-pulse",
        "title": "Engagement Pulse",
        "description": "Short survey to understand what keeps you engaged at work.",
        "questions": [
            {"id": "e1", "question": "I feel valued at work.", "type": "scale", "options": ["1", "2", "3", "4", "5"]},
            {"id": "e2", "question": "I have opportunities to learn and grow.", "type": "scale", "options": ["1", "2", "3", "4", "5"]},
            {"id": "e3", "question": "Additional feedback (optional)", "type": "text", "options": None},
        ],
    },
}


def _get_links() -> List[WellnessLink]:
    return [
        WellnessLink(
            name="Counselling sessions",
            url=settings.wellness_counselling_url,
            description="Book confidential counselling or EAP sessions.",
        ),
        WellnessLink(
            name="Yoga classes",
            url=settings.wellness_yoga_url,
            description="Guided yoga and mindfulness sessions.",
        ),
        WellnessLink(
            name="Exercises",
            url=settings.wellness_exercises_url,
            description="Quick exercises and stretches for desk workers.",
        ),
    ]


@router.get("/links", response_model=List[WellnessLink])
def get_wellness_links(
    current_user: User = Depends(get_current_user),
):
    return _get_links()


@router.get("/resources", response_model=List[WellnessResourceResponse])
def get_wellness_resources(
    current_user: User = Depends(get_current_user),
):
    return [WellnessResourceResponse(**r) for r in WELLNESS_RESOURCES]


@router.get("/mental-health-tips", response_model=List[MentalHealthTip])
def get_mental_health_tips(
    current_user: User = Depends(get_current_user),
):
    return [MentalHealthTip(**t) for t in MENTAL_HEALTH_TIPS]


@router.get("/work-life", response_model=List[WorkLifeContent])
def get_work_life_content(
    current_user: User = Depends(get_current_user),
):
    return [WorkLifeContent(**c) for c in WORK_LIFE_CONTENT]


@router.get("/surveys", response_model=List[SurveyListItem])
def list_surveys(
    current_user: User = Depends(get_current_user),
):
    return [
        SurveyListItem(id=s["id"], title=s["title"], description=s.get("description"))
        for s in SURVEYS.values()
    ]


@router.get("/surveys/{survey_id}", response_model=SurveyDetail)
def get_survey(
    survey_id: str,
    current_user: User = Depends(get_current_user),
):
    if survey_id not in SURVEYS:
        raise HTTPException(status_code=404, detail="Survey not found")
    s = SURVEYS[survey_id]
    return SurveyDetail(
        id=s["id"],
        title=s["title"],
        description=s.get("description"),
        questions=[SurveyQuestion(**q) for q in s["questions"]],
    )


@router.post("/surveys/{survey_id}/submit")
def submit_survey(
    survey_id: str,
    body: SurveySubmitRequest,
    current_user: User = Depends(get_current_user),
):
    if survey_id not in SURVEYS:
        raise HTTPException(status_code=404, detail="Survey not found")
    # Phase 1: no persistence; just acknowledge. Can add EngagementSurveyResponse later.
    return {"message": "Thank you for your response.", "survey_id": survey_id}


def _get_nudges(current_user: User, db: Session) -> List[WellnessNudge]:
    nudges: List[WellnessNudge] = []
    now = datetime.utcnow()
    current_year = now.year

    # Leave balance and recent leaves
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.user_id == current_user.id,
        LeaveBalance.year == current_year,
    ).first()
    recent_leaves = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.employee_id == current_user.id)
        .order_by(LeaveRequest.from_date.desc())
        .limit(10)
        .all()
    )
    approved_recent = [l for l in recent_leaves if l.status == "Approved"]
    used = balance.used_leaves if balance else 0
    remaining = balance.remaining_leaves if balance else 20

    # Learning progress
    progress_rows = (
        db.query(UserLearningProgress)
        .filter(UserLearningProgress.user_id == current_user.id)
        .all()
    )
    completed = sum(1 for r in progress_rows if r.status == "completed")
    in_progress = sum(1 for r in progress_rows if r.status == "in_progress")

    # Nudge: high leave usage / many recent leaves -> work-life / counselling
    if used >= 15 or len(approved_recent) >= 3:
        nudges.append(WellnessNudge(
            message="You've been using a lot of leave lately. Remember our counselling and work-life resources are here if you need support.",
            type="work_life",
            priority=2,
        ))
    # Nudge: almost no leave taken -> suggest break
    elif remaining >= 18 and used <= 2:
        nudges.append(WellnessNudge(
            message="You have plenty of leave left. Consider planning a short break to recharge.",
            type="break",
            priority=1,
        ))
    # Nudge: no or low learning completion -> gentle nudge
    if completed == 0 and in_progress == 0:
        nudges.append(WellnessNudge(
            message="A short learning or wellness course can help break the routine. Check out Learning & Certifications.",
            type="learning",
            priority=0,
        ))
    elif in_progress >= 1:
        nudges.append(WellnessNudge(
            message="You're making progress on learning. A quick stretch or walk can help you focus when you return.",
            type="general",
            priority=0,
        ))

    # Default nudge if nothing else
    if not nudges:
        nudges.append(WellnessNudge(
            message="Small steps matter. Try a 5-minute stretch or a short walk today.",
            type="general",
            priority=0,
        ))

    nudges.sort(key=lambda n: -n.priority)
    return nudges[:3]


@router.get("/nudges", response_model=List[WellnessNudge])
def get_wellness_nudges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_nudges(current_user, db)
