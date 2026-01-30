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


class RecommendationResponse(BaseModel):
    learning_content: List[LearningContentResponse] = []
    compliance_policies: List[CompliancePolicyResponse] = []
    explanations: List[str] = []


class ChatbotRequest(BaseModel):
    message: str


class ChatbotResponse(BaseModel):
    response: str
