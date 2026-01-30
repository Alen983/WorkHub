from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, LearningContent, CompliancePolicy
from app.schemas import (
    RecommendationResponse,
    LearningContentResponse,
    CompliancePolicyResponse,
    LearningPath,
    LearningPathStep,
)
from app.dependencies import get_current_user
from datetime import date
import json

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

# Role/department -> suggested certifications for AI recommendations
ROLE_BASED_CERTS = {
    ("employee", "engineering"): ["AWS Certified Developer", "Google Cloud Professional", "Kubernetes (CKA)"],
    ("employee", "sales"): ["Salesforce Certified", "HubSpot Sales", "Negotiation Certification"],
    ("employee", "hr"): ["SHRM-CP", "HR Analytics", "Diversity & Inclusion"],
    ("manager", "engineering"): ["AWS Solutions Architect", "PMP", "Agile Certified"],
    ("manager", "sales"): ["Sales Leadership", "Executive Presence"],
    ("hr", "hr"): ["SHRM-SCP", "Compensation & Benefits", "Talent Acquisition"],
}


def _tags_list(c):
    if c is None or not hasattr(c, "tags"):
        return []
    if isinstance(c.tags, list):
        return c.tags
    try:
        return json.loads(c.tags) if c.tags else []
    except Exception:
        return []


@router.get("", response_model=RecommendationResponse)
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_skills = json.loads(current_user.skills) if current_user.skills else []
    user_interests = json.loads(getattr(current_user, "interests", None) or "[]")
    user_certs = json.loads(getattr(current_user, "certifications", None) or "[]")
    user_prefs = json.loads(getattr(current_user, "career_preferences", None) or "{}")
    career_goals = (user_prefs.get("goals") or []) if isinstance(user_prefs.get("goals"), list) else ([user_prefs.get("goals")] if user_prefs.get("goals") else [])
    preferred_roles = (user_prefs.get("preferred_roles") or []) if isinstance(user_prefs.get("preferred_roles"), list) else ([user_prefs.get("preferred_roles")] if user_prefs.get("preferred_roles") else [])
    
    all_learning = db.query(LearningContent).all()
    all_compliance = db.query(CompliancePolicy).filter(
        CompliancePolicy.department == current_user.department
    ).all()
    
    recommended_learning = []
    explanations = []
    
    for content in all_learning:
        content_tags = json.loads(content.tags) if content.tags else []
        match_score = 0
        
        if current_user.department.lower() in content.title.lower():
            match_score += 2
        
        for skill in user_skills:
            if skill.lower() in content.title.lower():
                match_score += 2
            for tag in content_tags:
                if skill.lower() in tag.lower():
                    match_score += 3
        for interest in user_interests:
            if isinstance(interest, str) and (interest.lower() in content.title.lower() or any(interest.lower() in str(t).lower() for t in content_tags)):
                match_score += 2
        for cert in user_certs:
            if isinstance(cert, dict) and cert.get("title"):
                if cert["title"].lower() in content.title.lower():
                    match_score += 1
        for goal in career_goals:
            if goal and isinstance(goal, str) and goal.lower() in content.title.lower():
                match_score += 2
        
        if match_score > 0:
            recommended_learning.append((match_score, content))
    
    recommended_learning.sort(key=lambda x: x[0], reverse=True)
    top_learning = [content for _, content in recommended_learning[:5]]

    # Skill gaps: skills from recommended learning / role minus user skills
    suggested_skills = set()
    for content in top_learning:
        for t in _tags_list(content):
            if isinstance(t, str) and t.strip():
                suggested_skills.add(t.strip())
    suggested_skills.add(current_user.department)
    user_skills_set = {s.strip().lower() for s in user_skills if isinstance(s, str)}
    skill_gaps = [s for s in suggested_skills if s.lower() not in user_skills_set][:15]

    # Role-based certifications
    key = (current_user.role.lower(), current_user.department.lower())
    role_based_certifications = ROLE_BASED_CERTS.get(key, [])
    for k, v in ROLE_BASED_CERTS.items():
        if k[1] == current_user.department.lower() and not role_based_certifications:
            role_based_certifications = v
            break

    # Learning path: one path "Recommended for you" with top courses as steps
    learning_paths = []
    if top_learning:
        learning_paths = [
            LearningPath(
                name="Recommended for you",
                steps=[
                    LearningPathStep(
                        order=i + 1,
                        content=LearningContentResponse(
                            id=c.id,
                            title=c.title,
                            tags=_tags_list(c),
                            level=c.level,
                            description=c.description,
                        ),
                    )
                    for i, c in enumerate(top_learning)
                ],
            )
        ]
    
    for content in top_learning:
        content.tags = json.loads(content.tags) if content.tags else []
        if current_user.role == "employee":
            explanations.append(
                f"As a {current_user.department} employee, we recommend '{content.title}' "
                f"to enhance your skills."
            )
        else:
            explanations.append(
                f"As a {current_user.role} in {current_user.department}, "
                f"'{content.title}' is relevant for your role."
            )
    
    compliance_list = []
    today = date.today()
    for policy in all_compliance:
        if policy.due_date >= today:
            compliance_list.append(policy)
            explanations.append(
                f"Compliance policy '{policy.title}' is due on {policy.due_date.strftime('%Y-%m-%d')}. "
                f"Please ensure completion."
            )
    
    compliance_list.sort(key=lambda x: x.due_date)
    
    def tags_list(c):
        if isinstance(c.tags, list):
            return c.tags
        return json.loads(c.tags) if c.tags else []

    return RecommendationResponse(
        learning_content=[
            LearningContentResponse(
                id=c.id,
                title=c.title,
                tags=tags_list(c),
                level=c.level,
                description=c.description
            ) for c in top_learning
        ],
        compliance_policies=[
            CompliancePolicyResponse(
                id=p.id,
                title=p.title,
                department=p.department,
                due_date=p.due_date,
                description=p.description
            ) for p in compliance_list[:5]
        ],
        explanations=explanations[:5],
        skill_gaps=skill_gaps,
        role_based_certifications=role_based_certifications,
        learning_paths=learning_paths,
    )


@router.get("/team-compliance", response_model=RecommendationResponse)
def get_team_compliance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can access team compliance"
        )
    
    all_compliance = db.query(CompliancePolicy).filter(
        CompliancePolicy.department == current_user.department
    ).all()
    
    compliance_list = []
    today = date.today()
    for policy in all_compliance:
        compliance_list.append(policy)
    
    compliance_list.sort(key=lambda x: x.due_date)
    
    return RecommendationResponse(
        learning_content=[],
        compliance_policies=[
            CompliancePolicyResponse(
                id=p.id,
                title=p.title,
                department=p.department,
                due_date=p.due_date,
                description=p.description
            ) for p in compliance_list
        ],
        explanations=[],
        skill_gaps=[],
        role_based_certifications=[],
        learning_paths=[],
    )
