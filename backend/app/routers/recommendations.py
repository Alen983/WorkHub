from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
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
from app.config import settings
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


def _create_role_based_learning_paths(
    current_user: User,
    all_learning: list,
    top_learning: list,
    user_skills: list,
    user_interests: list,
    career_goals: list
) -> list:
    """Create role-based personalized learning paths."""
    learning_paths = []
    
    # Organize learning content by level
    beginner_content = [c for c in all_learning if c.level and c.level.lower() == "beginner"]
    intermediate_content = [c for c in all_learning if c.level and c.level.lower() == "intermediate"]
    advanced_content = [c for c in all_learning if c.level and c.level.lower() == "advanced"]
    
    # Filter content by department/role relevance
    def is_relevant(content, role, department):
        content_tags = _tags_list(content)
        title_lower = content.title.lower()
        dept_lower = department.lower()
        
        # Department match
        if dept_lower in title_lower:
            return True
        
        # Tag-based relevance
        role_tags = {
            "employee": ["engineering", "sales", "hr", "frontend", "backend", "devops", "communication"],
            "manager": ["leadership", "management", "agile", "pmp", "executive"],
            "hr": ["hr", "analytics", "diversity", "talent", "compensation"]
        }
        
        relevant_tags = role_tags.get(role.lower(), [])
        for tag in content_tags:
            if any(rt in str(tag).lower() for rt in relevant_tags):
                return True
        
        # Department in tags
        for tag in content_tags:
            if dept_lower in str(tag).lower():
                return True
        
        return False
    
    # Role-specific path creation
    role = current_user.role.lower()
    department = current_user.department.lower()
    
    if role == "employee":
        # Path 1: Foundation Skills Path (Beginner -> Intermediate)
        foundation_steps = []
        used_content_ids = set()
        for level_content in [beginner_content, intermediate_content]:
            for content in level_content:
                if content.id not in used_content_ids and is_relevant(content, role, department):
                    used_content_ids.add(content.id)
                    foundation_steps.append(
                        LearningPathStep(
                            order=len(foundation_steps) + 1,
                            content=LearningContentResponse(
                                id=content.id,
                                title=content.title,
                                tags=_tags_list(content),
                                level=content.level,
                                description=content.description,
                            ),
                        )
                    )
                    if len(foundation_steps) >= 4:
                        break
            if len(foundation_steps) >= 4:
                break
        
        if foundation_steps:
            learning_paths.append(
                LearningPath(
                    name=f"Foundation Skills Path for {current_user.department.title()}",
                    steps=foundation_steps[:4]
                )
            )
        
        # Path 2: Advanced Skills Path (Intermediate -> Advanced)
        advanced_steps = []
        for level_content in [intermediate_content, advanced_content]:
            for content in level_content:
                if content.id not in used_content_ids and is_relevant(content, role, department):
                    used_content_ids.add(content.id)
                    advanced_steps.append(
                        LearningPathStep(
                            order=len(advanced_steps) + 1,
                            content=LearningContentResponse(
                                id=content.id,
                                title=content.title,
                                tags=_tags_list(content),
                                level=content.level,
                                description=content.description,
                            ),
                        )
                    )
                    if len(advanced_steps) >= 3:
                        break
            if len(advanced_steps) >= 3:
                break
        
        if advanced_steps:
            learning_paths.append(
                LearningPath(
                    name=f"Advanced Skills Path for {current_user.department.title()}",
                    steps=advanced_steps[:3]
                )
            )
    
    elif role == "manager":
        # Path 1: Leadership Development Path
        leadership_steps = []
        leadership_keywords = ["leadership", "management", "agile", "pmp", "executive", "team"]
        
        used_content_ids = set()
        for content in all_learning:
            content_tags = _tags_list(content)
            title_lower = content.title.lower()
            
            if content.id not in used_content_ids and \
               (any(kw in title_lower for kw in leadership_keywords) or \
                any(kw in str(tag).lower() for tag in content_tags for kw in leadership_keywords)):
                used_content_ids.add(content.id)
                leadership_steps.append(
                    LearningPathStep(
                        order=len(leadership_steps) + 1,
                        content=LearningContentResponse(
                            id=content.id,
                            title=content.title,
                            tags=_tags_list(content),
                            level=content.level,
                            description=content.description,
                        ),
                    )
                )
                if len(leadership_steps) >= 4:
                    break
        
        if not leadership_steps:
            # Fallback to department-relevant content
            for content in intermediate_content + advanced_content:
                if content.id not in used_content_ids and is_relevant(content, role, department):
                    used_content_ids.add(content.id)
                    leadership_steps.append(
                        LearningPathStep(
                            order=len(leadership_steps) + 1,
                            content=LearningContentResponse(
                                id=content.id,
                                title=content.title,
                                tags=_tags_list(content),
                                level=content.level,
                                description=content.description,
                            ),
                        )
                    )
                    if len(leadership_steps) >= 4:
                        break
        
        if leadership_steps:
            learning_paths.append(
                LearningPath(
                    name=f"Leadership Development Path for {current_user.department.title()} Managers",
                    steps=leadership_steps[:4]
                )
            )
        
        # Path 2: Technical Excellence Path (for technical managers)
        if department in ["engineering", "it"]:
            tech_steps = []
            for content in intermediate_content + advanced_content:
                if content.id not in used_content_ids:
                    content_tags = _tags_list(content)
                    if any(tag in ["engineering", "devops", "cloud", "kubernetes", "docker", "react", "javascript"] 
                           for tag in content_tags):
                        used_content_ids.add(content.id)
                        tech_steps.append(
                            LearningPathStep(
                                order=len(tech_steps) + 1,
                                content=LearningContentResponse(
                                    id=content.id,
                                    title=content.title,
                                    tags=_tags_list(content),
                                    level=content.level,
                                    description=content.description,
                                ),
                            )
                        )
                        if len(tech_steps) >= 3:
                            break
            
            if tech_steps:
                learning_paths.append(
                    LearningPath(
                        name="Technical Excellence Path",
                        steps=tech_steps[:3]
                    )
                )
    
    elif role == "hr":
        # HR-specific path
        hr_steps = []
        hr_keywords = ["hr", "analytics", "diversity", "talent", "compensation", "recruitment"]
        
        used_content_ids = set()
        for content in all_learning:
            content_tags = _tags_list(content)
            title_lower = content.title.lower()
            
            if content.id not in used_content_ids and \
               (any(kw in title_lower for kw in hr_keywords) or \
                any(kw in str(tag).lower() for tag in content_tags for kw in hr_keywords)):
                used_content_ids.add(content.id)
                hr_steps.append(
                    LearningPathStep(
                        order=len(hr_steps) + 1,
                        content=LearningContentResponse(
                            id=content.id,
                            title=content.title,
                            tags=_tags_list(content),
                            level=content.level,
                            description=content.description,
                        ),
                    )
                )
                if len(hr_steps) >= 4:
                    break
        
        if hr_steps:
            learning_paths.append(
                LearningPath(
                    name="HR Professional Development Path",
                    steps=hr_steps[:4]
                )
            )
    
    # Fallback: If no role-specific paths created, use top learning
    if not learning_paths and top_learning:
        learning_paths.append(
            LearningPath(
                name="Recommended Learning Path",
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
                    for i, c in enumerate(top_learning[:5])
                ],
            )
        )
    
    return learning_paths


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
    
    # Use career_preferences.current_role if available, otherwise use actual role
    # This allows recommendations to reflect user's career aspirations
    effective_role = user_prefs.get("current_role") or current_user.role
    if effective_role and effective_role.strip():
        effective_role = effective_role.strip().lower()
        # Map common career role names to system roles
        role_mapping = {
            "manager": "manager",
            "lead": "manager",
            "senior": "employee",
            "engineer": "employee",
            "developer": "employee",
            "hr": "hr",
            "human resources": "hr",
        }
        for key, mapped_role in role_mapping.items():
            if key in effective_role:
                effective_role = mapped_role
                break
    else:
        effective_role = current_user.role.lower()
    
    all_learning = db.query(LearningContent).all()
    all_compliance = db.query(CompliancePolicy).filter(
        or_(
            func.lower(CompliancePolicy.department) == current_user.department.lower(),
            CompliancePolicy.department.ilike("all"),
        )
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

    # Role-based certifications using effective role
    key = (effective_role, current_user.department.lower())
    role_based_certifications = ROLE_BASED_CERTS.get(key, [])
    for k, v in ROLE_BASED_CERTS.items():
        if k[1] == current_user.department.lower() and not role_based_certifications:
            role_based_certifications = v
            break

    # Create role-based learning paths using effective role
    # Temporarily update user role for path creation
    original_role = current_user.role
    current_user.role = effective_role.title() if effective_role else original_role
    learning_paths = _create_role_based_learning_paths(
        current_user, 
        all_learning, 
        top_learning, 
        user_skills,
        user_interests,
        career_goals
    )
    # Restore original role
    current_user.role = original_role
    
    for content in top_learning:
        content.tags = json.loads(content.tags) if content.tags else []
        role_display = effective_role.title() if effective_role != current_user.role.lower() else current_user.role
        if effective_role == "employee":
            explanations.append(
                f"As a {current_user.department} employee, we recommend '{content.title}' "
                f"to enhance your skills."
            )
        else:
            explanations.append(
                f"As a {role_display} in {current_user.department}, "
                f"'{content.title}' is relevant for your role."
            )
    
    compliance_list = list(all_compliance)
    compliance_list.sort(key=lambda x: x.due_date)
    today = date.today()
    for policy in all_compliance:
        if policy.due_date >= today:
            explanations.append(
                f"Compliance policy '{policy.title}' is due on {policy.due_date.strftime('%Y-%m-%d')}. "
                f"Please ensure completion."
            )

    if settings.api_key and settings.api_key.strip():
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.api_key.strip())
            learning_titles = [c.title for c in top_learning[:5]]
            compliance_titles = [p.title for p in compliance_list[:2]]
            goals_str = ", ".join(career_goals[:3]) if career_goals else "none specified"
            role_display = effective_role.title() if effective_role != current_user.role.lower() else current_user.role
            prompt = (
                f"The user is a {role_display} in {current_user.department}. "
                f"Their career goals: {goals_str}. "
                f"Recommended learning: {', '.join(learning_titles) or 'none'}. "
                f"Relevant compliance: {', '.join(compliance_titles) or 'none'}. "
                f"Write one or two short sentences explaining why these recommendations fit this user. Be concise."
            )
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=150,
            )
            if completion.choices and completion.choices[0].message.content:
                ai_summary = completion.choices[0].message.content.strip()
                if ai_summary:
                    explanations.insert(0, ai_summary)
        except Exception:
            pass

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
            ) for p in compliance_list
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
        or_(
            func.lower(CompliancePolicy.department) == current_user.department.lower(),
            CompliancePolicy.department.ilike("all"),
        )
    ).all()

    compliance_list = list(all_compliance)
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
