from fastapi import APIRouter, Depends, HTTPException
from app.config import settings
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
from app.models import User

router = APIRouter(prefix="/wellness", tags=["wellness"])

# Static wellness links from config
def _get_links() -> list[WellnessLink]:
    return [
        WellnessLink(
            name="Counselling sessions",
            url=settings.wellness_counselling_url,
            description="Professional counselling and mental health support",
        ),
        WellnessLink(
            name="Yoga classes",
            url=settings.wellness_yoga_url,
            description="Guided yoga and mindfulness",
        ),
        WellnessLink(
            name="Exercises",
            url=settings.wellness_exercises_url,
            description="Office stretches and quick exercises",
        ),
    ]

WELLNESS_RESOURCES = [
    WellnessResourceResponse(
        title="Stress management guide",
        content="Techniques for managing workload and stress.",
        category="mental_health",
        url=None,
    ),
    WellnessResourceResponse(
        title="Sleep hygiene",
        content="Tips for better sleep and rest.",
        category="wellness",
        url=None,
    ),
    WellnessResourceResponse(
        title="Ergonomics at work",
        content="Set up your workspace for comfort and health.",
        category="physical",
        url=None,
    ),
]

MENTAL_HEALTH_TIPS = [
    MentalHealthTip(
        title="Take short breaks",
        content="Step away from the screen every 90 minutes for a few minutes.",
        category="breaks",
    ),
    MentalHealthTip(
        title="Stay connected",
        content="Check in with colleagues and maintain social connections.",
        category="work_life",
    ),
    MentalHealthTip(
        title="Set boundaries",
        content="Define clear work hours and protect personal time.",
        category="work_life",
    ),
]

WORK_LIFE_CONTENT = [
    WorkLifeContent(
        title="Flexible working",
        content="Options for hybrid and remote work.",
        url=None,
    ),
    WorkLifeContent(
        title="Time off",
        content="Use your leave balance and take regular time off.",
        url=None,
    ),
]

SURVEYS_LIST = [
    SurveyListItem(id="engagement-2024", title="Engagement survey 2024", description="Quick pulse check"),
    SurveyListItem(id="wellness-check", title="Wellness check-in", description="How are you doing?"),
]

SURVEY_DETAILS: dict[str, SurveyDetail] = {
    "engagement-2024": SurveyDetail(
        id="engagement-2024",
        title="Engagement survey 2024",
        description="Quick pulse check",
        questions=[
            SurveyQuestion(id="q1", question="How satisfied are you with your work?", type="scale", options=None),
            SurveyQuestion(id="q2", question="How would you rate work-life balance?", type="single_choice", options=["Poor", "Fair", "Good", "Excellent"]),
        ],
    ),
    "wellness-check": SurveyDetail(
        id="wellness-check",
        title="Wellness check-in",
        description="How are you doing?",
        questions=[
            SurveyQuestion(id="w1", question="Overall wellness (1-5)", type="scale", options=None),
            SurveyQuestion(id="w2", question="Any comments?", type="text", options=None),
        ],
    ),
}

WELLNESS_NUDGES = [
    WellnessNudge(message="Consider a short break—you've been focused for a while.", type="break", priority=1),
    WellnessNudge(message="Balance work and rest for sustained productivity.", type="work_life", priority=0),
    WellnessNudge(message="A quick stretch can help reduce tension.", type="mental_health", priority=0),
]


@router.get("/links", response_model=list[WellnessLink])
def get_links(current_user: User = Depends(get_current_user)):
    return _get_links()


@router.get("/resources", response_model=list[WellnessResourceResponse])
def get_resources(current_user: User = Depends(get_current_user)):
    return WELLNESS_RESOURCES


@router.get("/mental-health-tips", response_model=list[MentalHealthTip])
def get_mental_health_tips(current_user: User = Depends(get_current_user)):
    return MENTAL_HEALTH_TIPS


@router.get("/work-life", response_model=list[WorkLifeContent])
def get_work_life(current_user: User = Depends(get_current_user)):
    return WORK_LIFE_CONTENT


@router.get("/surveys", response_model=list[SurveyListItem])
def get_surveys(current_user: User = Depends(get_current_user)):
    return SURVEYS_LIST


@router.get("/surveys/{survey_id}", response_model=SurveyDetail)
def get_survey_detail(survey_id: str, current_user: User = Depends(get_current_user)):
    detail = SURVEY_DETAILS.get(survey_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Survey not found")
    return detail


@router.post("/surveys/{survey_id}/submit")
def submit_survey(
    survey_id: str,
    body: SurveySubmitRequest,
    current_user: User = Depends(get_current_user),
):
    if survey_id not in SURVEY_DETAILS:
        raise HTTPException(status_code=404, detail="Survey not found")
    # Accept and return success; optional in-memory store omitted for minimal fix
    return {"message": "Survey submitted successfully"}


@router.get("/nudges", response_model=list[WellnessNudge])
def get_nudges(current_user: User = Depends(get_current_user)):
    return WELLNESS_NUDGES
