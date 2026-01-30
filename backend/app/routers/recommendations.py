from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, LearningContent, CompliancePolicy
from app.schemas import RecommendationResponse, LearningContentResponse, CompliancePolicyResponse
from app.dependencies import get_current_user
from datetime import date
import json

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("", response_model=RecommendationResponse)
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_skills = json.loads(current_user.skills) if current_user.skills else []
    
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
        
        if match_score > 0:
            recommended_learning.append((match_score, content))
    
    recommended_learning.sort(key=lambda x: x[0], reverse=True)
    top_learning = [content for _, content in recommended_learning[:5]]
    
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
        explanations=explanations[:5]
    )
