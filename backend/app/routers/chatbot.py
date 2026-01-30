from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import User, CompliancePolicy
from app.schemas import ChatbotRequest, ChatbotResponse
from app.dependencies import get_current_user
from app.config import settings
from datetime import date
import re

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


def _get_user_policies(db: Session, current_user: User):
    """Policies for user's department or department='All'."""
    return db.query(CompliancePolicy).filter(
        or_(
            CompliancePolicy.department == current_user.department,
            CompliancePolicy.department.ilike("all"),
        )
    ).order_by(CompliancePolicy.due_date).all()


def _rule_based_response(
    request: ChatbotRequest,
    current_user: User,
    compliance_policies: list | None = None,
) -> ChatbotResponse:
    """Fallback when API key is missing or LLM call fails."""
    message = request.message.lower()

    if re.search(r"how.*apply.*leave|apply.*leave|leave.*application", message):
        return ChatbotResponse(
            response="To apply for leave, go to your dashboard and click on 'Apply for Leave'. "
                    "Fill in the from date, to date, and reason. Your manager will review and approve it."
        )
    
    if re.search(r"compliance|policy|policies", message):
        if compliance_policies:
            parts = [
                "Here are your assigned compliance policies:",
                *[f"• {p.title} (due {p.due_date})" for p in compliance_policies[:10]],
                "Go to **Compliance & Policies** from your dashboard (or the Compliance card) to view full details and descriptions.",
            ]
            return ChatbotResponse(response="\n".join(parts))
        return ChatbotResponse(
            response=f"Based on your role as {current_user.role} in {current_user.department}, "
                    f"go to **Compliance & Policies** from your dashboard to view your assigned policies. "
                    f"You can open it from the Compliance card or the Compliance & Policies link."
        )
    
    if re.search(r"course|learning|recommend|training|skill", message):
        return ChatbotResponse(
            response=f"Based on your skills and department ({current_user.department}), "
                    f"check the 'Learning Recommendations' section on your dashboard. "
                    f"The AI system recommends courses tailored to your role and expertise."
        )
    
    if re.search(r"hello|hi|hey|greet", message):
        return ChatbotResponse(
            response=f"Hello {current_user.name}! I'm Echo, your assistant. "
                    f"How can I help you today? I can assist with leave applications, "
                    f"compliance policies, and learning recommendations."
        )
    
    if re.search(r"dashboard|personalize|customize", message):
        return ChatbotResponse(
            response="You can personalize your dashboard by toggling the cards on or off. "
                    "Go to the personalization panel on your dashboard to show or hide "
                    "Leave Status, Learning Recommendations, and Compliance Reminders."
        )
    
    return ChatbotResponse(
        response="I'm Echo, your assistant. I can help you with leave applications, "
                "compliance policies, learning recommendations, and dashboard personalization. "
                "What would you like to know?"
    )


@router.post("/echo", response_model=ChatbotResponse)
def echo_chatbot(
    request: ChatbotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    compliance_policies = _get_user_policies(db, current_user)

    if settings.api_key and settings.api_key.strip():
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.api_key.strip())
            policy_blurb = ""
            if compliance_policies:
                policy_lines = [f"- {p.title} (due {p.due_date})" for p in compliance_policies[:10]]
                policy_blurb = (
                    " The user's assigned compliance policies (direct them to Compliance & Policies on the dashboard to view details): "
                    + "; ".join(policy_lines) + "."
                )
            system_prompt = (
                f"You are Echo, the WorkHub employee portal assistant. "
                f"The user is {current_user.name}, role: {current_user.role}, department: {current_user.department}. "
                f"You can help with: leave applications (how to apply, where to go), "
                f"compliance policies and where to find them, learning/courses and recommendations, "
                f"and dashboard personalization. Keep answers brief and on-topic for WorkHub."
                f"{policy_blurb}"
                " When the user asks about policies or compliance, tell them to go to Compliance & Policies from their dashboard and mention their assigned policies if listed above."
            )
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.message},
                ],
                max_tokens=256,
            )
            if completion.choices and len(completion.choices) > 0:
                content = (completion.choices[0].message.content or "").strip()
                if content:
                    return ChatbotResponse(response=content)
        except Exception:
            pass
    return _rule_based_response(request, current_user, compliance_policies=compliance_policies)
