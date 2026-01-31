from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import date, datetime


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str
    department: str
    skills: List[str] = []


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    phone: Optional[str] = None
    address: Optional[str] = None
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    interests: List[str] = []
    certifications: List[Any] = []  # [{title, issuer, date, expiry?}]
    career_preferences: Optional[dict] = None  # {goals, preferred_roles, work_prefs}
    
    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    manager_id: Optional[int] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    certifications: Optional[List[Any]] = None
    career_preferences: Optional[dict] = None


class UserDocumentResponse(BaseModel):
    id: int
    user_id: int
    type: str
    filename: str
    uploaded_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class LeaveRequestCreate(BaseModel):
    from_date: date
    to_date: date
    reason: str


class LeaveRequestResponse(BaseModel):
    id: int
    employee_id: int
    department: str
    from_date: date
    to_date: date
    reason: str
    status: str
    employee_name: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class LeaveApprovalRequest(BaseModel):
    leave_id: int
    status: str  # Approved or Rejected


class CompliancePolicyCreate(BaseModel):
    title: str
    department: str
    due_date: date
    description: Optional[str] = None


class CompliancePolicyResponse(BaseModel):
    id: int
    title: str
    department: str
    due_date: date
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


class ComplianceCategoryRuleCreate(BaseModel):
    category: str  # hr, ai, it, finance
    rule_text: str


class ComplianceCategoryRuleResponse(BaseModel):
    id: int
    category: str
    rule_text: str
    display_order: int = 0
    
    class Config:
        from_attributes = True


class ComplianceCategoryRulesByCategory(BaseModel):
    """Response: { hr: [{ id, rule_text }], ai: [...], it: [...], finance: [...] }"""
    hr: List[ComplianceCategoryRuleResponse] = []
    ai: List[ComplianceCategoryRuleResponse] = []
    it: List[ComplianceCategoryRuleResponse] = []
    finance: List[ComplianceCategoryRuleResponse] = []


class LearningContentCreate(BaseModel):
    title: str
    tags: List[str] = []
    level: str
    description: Optional[str] = None


class LearningContentResponse(BaseModel):
    id: int
    title: str
    tags: List[str]
    level: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


class LearningProgressResponse(BaseModel):
    learning_content_id: int
    status: str  # not_started, in_progress, completed
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class LearningProgressUpdate(BaseModel):
    learning_content_id: int
    status: str  # not_started, in_progress, completed
    completed_at: Optional[datetime] = None


class LearningContentWithProgress(LearningContentResponse):
    progress_status: Optional[str] = None
    completed_at: Optional[datetime] = None


class AssignmentResponse(BaseModel):
    id: int
    learning_content_id: int
    assigned_at: datetime
    due_date: Optional[date] = None
    content: Optional[LearningContentResponse] = None
    
    class Config:
        from_attributes = True


class DashboardConfigUpdate(BaseModel):
    show_leaves: Optional[bool] = None
    show_learning: Optional[bool] = None
    show_compliance: Optional[bool] = None
    show_profile: Optional[bool] = None
    show_attendance: Optional[bool] = None
    show_payroll: Optional[bool] = None
    show_career: Optional[bool] = None
    show_wellness: Optional[bool] = None


class DashboardConfigResponse(BaseModel):
    show_leaves: bool
    show_learning: bool
    show_compliance: bool
    show_profile: bool
    show_attendance: bool
    show_payroll: bool
    show_career: bool
    show_wellness: bool
    
    class Config:
        from_attributes = True


class DashboardData(BaseModel):
    leave_requests: List[LeaveRequestResponse] = []
    recommendations: dict = {}
    team_members: List[UserResponse] = []
    pending_leaves: List[LeaveRequestResponse] = []
    config: Optional[DashboardConfigResponse] = None


class LearningPathStep(BaseModel):
    order: int
    content: LearningContentResponse


class LearningPath(BaseModel):
    name: str
    steps: List[LearningPathStep] = []


class RecommendationResponse(BaseModel):
    learning_content: List[LearningContentResponse] = []
    compliance_policies: List[CompliancePolicyResponse] = []
    explanations: List[str] = []
    skill_gaps: List[str] = []
    role_based_certifications: List[str] = []
    learning_paths: List[LearningPath] = []


class ChatbotRequest(BaseModel):
    message: str


class ChatbotResponse(BaseModel):
    response: str


class LeaveBalanceResponse(BaseModel):
    user_id: int
    user_name: str
    total_leaves: int
    used_leaves: int
    remaining_leaves: int
    year: int
    
    class Config:
        from_attributes = True


class CalendarEvent(BaseModel):
    leave_id: int
    employee_id: int
    employee_name: str
    from_date: date
    to_date: date
    reason: str
    status: str
    has_conflict: bool = False


class TeamCalendarResponse(BaseModel):
    events: List[CalendarEvent] = []
    conflicts: List[dict] = []


class BulkLeaveApprovalRequest(BaseModel):
    leave_ids: List[int]
    status: str


class CareerRoleInfo(BaseModel):
    title: str
    department: str


class CareerPathNextRole(BaseModel):
    title: str
    department: str


class CareerPath(BaseModel):
    type: str  # most_common, similar, pivot
    label: str
    next_roles: List[CareerPathNextRole] = []


class CareerRoadmapResponse(BaseModel):
    current_role: CareerRoleInfo
    paths: List[CareerPath] = []


# Wellness & Engagement
class WellnessLink(BaseModel):
    name: str
    url: str
    description: Optional[str] = None


class WellnessResourceResponse(BaseModel):
    title: str
    content: Optional[str] = None
    category: Optional[str] = None
    url: Optional[str] = None


class MentalHealthTip(BaseModel):
    title: str
    content: str
    category: Optional[str] = None


class WorkLifeContent(BaseModel):
    title: str
    content: str
    url: Optional[str] = None


class SurveyQuestion(BaseModel):
    id: str
    question: str
    type: str  # single_choice, multiple_choice, scale, text
    options: Optional[List[str]] = None


class SurveyListItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None


class SurveyDetail(SurveyListItem):
    questions: List[SurveyQuestion] = []


class SurveySubmitRequest(BaseModel):
    responses: dict  # question_id -> value (string or number or list)


class WellnessNudge(BaseModel):
    message: str
    type: str  # break, work_life, learning, mental_health, general
    priority: int = 0  # higher = show first


# Compliance & Policies
class ComplianceRule(BaseModel):
    id: str
    text: str


class ComplianceCategory(BaseModel):
    slug: str
    name: str
    rule_count: int
    explanation: Optional[str] = None
    rules: List[ComplianceRule] = []


class PolicyAcknowledgementResponse(BaseModel):
    policy_slug: str
    acknowledged_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CertificationAlert(BaseModel):
    title: str
    expiry_date: str
    days_until_expiry: int


class ComplianceReminder(BaseModel):
    message: str
    type: str  # acknowledgement, certification, due_task
