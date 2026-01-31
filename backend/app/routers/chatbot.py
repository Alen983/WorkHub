from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import User, CompliancePolicy, LearningContent, LeaveBalance
from app.schemas import ChatbotRequest, ChatbotResponse
from app.dependencies import get_current_user
from datetime import date
import json

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


def _get_user_policies(db: Session, current_user: User):
    """Policies for user's department or department='All'."""
    policies = db.query(CompliancePolicy).filter(
        or_(
            CompliancePolicy.department == current_user.department,
            CompliancePolicy.department.ilike("all"),
        )
    ).order_by(CompliancePolicy.due_date).all()
    return policies


def _get_learning_content(db: Session, current_user: User):
    """Get learning content relevant to user."""
    # Get all learning content - can be filtered by department/tags if needed
    all_learning = db.query(LearningContent).all()
    
    # Simple relevance: match department or return all
    relevant = []
    dept_lower = current_user.department.lower()
    
    for content in all_learning:
        # Check if department matches title or tags
        title_lower = content.title.lower()
        tags = json.loads(content.tags) if content.tags else []
        tags_lower = [str(t).lower() for t in tags]
        
        if dept_lower in title_lower or any(dept_lower in tag for tag in tags_lower):
            relevant.append(content)
    
    # If no department matches, return all (limit to 5)
    return relevant[:5] if relevant else all_learning[:5]


def _get_leave_balance(db: Session, current_user: User) -> int:
    """Get user's remaining leave balance for current year."""
    current_year = date.today().year
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.user_id == current_user.id,
        LeaveBalance.year == current_year
    ).first()
    
    if balance:
        return balance.remaining_leaves
    # Default to 20 if no balance record exists
    return 20


def _format_policies_response(policies) -> str:
    """Format compliance policies as a response string."""
    if not policies:
        return "No compliance policies are currently assigned to you."
    
    parts = ["Your compliance policies:"]
    for policy in policies[:10]:  # Limit to 10
        category = getattr(policy, 'category', None) or 'Uncategorized'
        parts.append(f"• {policy.title} ({category}) - Due: {policy.due_date.strftime('%Y-%m-%d')}")
    
    return "\n".join(parts)


def _format_learning_response(learning_content) -> str:
    """Format learning content as a response string."""
    if not learning_content:
        return "No learning courses are currently available."
    
    parts = ["Recommended courses:"]
    for content in learning_content[:5]:  # Limit to 5
        parts.append(f"• {content.title} ({content.level})")
        if content.description:
            parts.append(f"  {content.description}")
    
    return "\n".join(parts)


@router.post("/echo", response_model=ChatbotResponse)
def echo_chatbot(
    request: ChatbotRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Simple keyword-based chatbot responses."""
    message_lower = request.message.lower()
    
    # 1. Leave application
    if "apply leave" in message_lower or "request leave" in message_lower:
        return ChatbotResponse(
            response="You can apply for leave from the Leave section on your dashboard. "
                    "Select dates, add a reason, and submit for approval."
        )
    
    # 2. Compliance policies
    if "compliance" in message_lower or "policy" in message_lower:
        policies = _get_user_policies(db, current_user)
        response_text = _format_policies_response(policies)
        return ChatbotResponse(response=response_text)
    
    # 3. Learning recommendations
    if "course" in message_lower or "learn" in message_lower:
        learning_content = _get_learning_content(db, current_user)
        response_text = _format_learning_response(learning_content)
        return ChatbotResponse(response=response_text)
    
    # 4. Leave balance
    if "leave balance" in message_lower or "leaves left" in message_lower:
        remaining = _get_leave_balance(db, current_user)
        return ChatbotResponse(
            response=f"You have {remaining} days of leave remaining this year."
        )
    
    # Fallback
    return ChatbotResponse(
        response="I can help with leave, learning, compliance, and leave balance. "
                "Please check your dashboard for more details."
    )
