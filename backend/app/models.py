from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # employee, manager, hr
    department = Column(String, nullable=False)
    skills = Column(Text, default="[]")  # JSON string
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    interests = Column(Text, default="[]")  # JSON string
    certifications = Column(Text, default="[]")  # JSON list of {title, issuer, date, expiry?}
    career_preferences = Column(Text, default="{}")  # JSON e.g. {goals, preferred_roles, work_prefs}
    
    leave_requests = relationship("LeaveRequest", back_populates="employee")
    dashboard_config = relationship("DashboardConfig", back_populates="user", uselist=False)
    manager = relationship("User", remote_side=[id], backref="reportees")
    documents = relationship("UserDocument", back_populates="user", cascade="all, delete-orphan")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    department = Column(String, nullable=False)
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, default="Pending")  # Pending, Approved, Rejected
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    
    employee = relationship("User", back_populates="leave_requests")


class CompliancePolicy(Base):
    __tablename__ = "compliance_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    department = Column(String, nullable=False)
    due_date = Column(Date, nullable=False)
    description = Column(Text)


class ComplianceCategoryRule(Base):
    """HR-added rules under Policy rules by category (hr, ai, it, finance)."""
    __tablename__ = "compliance_category_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)  # hr, ai, it, finance
    rule_text = Column(Text, nullable=False)
    display_order = Column(Integer, default=0)


class LearningContent(Base):
    __tablename__ = "learning_content"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    tags = Column(Text, default="[]")  # JSON string
    level = Column(String, nullable=False)
    description = Column(Text)


class UserLearningProgress(Base):
    __tablename__ = "user_learning_progress"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    learning_content_id = Column(Integer, ForeignKey("learning_content.id"), primary_key=True)
    status = Column(String, default="not_started")  # not_started, in_progress, completed
    completed_at = Column(DateTime, nullable=True)
    
    user = relationship("User", backref="learning_progress")
    learning_content = relationship("LearningContent", backref="user_progress")


class UserLearningAssignment(Base):
    __tablename__ = "user_learning_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    learning_content_id = Column(Integer, ForeignKey("learning_content.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(Date, nullable=True)
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    user = relationship("User", foreign_keys=[user_id], backref="learning_assignments")
    learning_content = relationship("LearningContent", backref="assignments")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])


class DashboardConfig(Base):
    __tablename__ = "dashboard_configs"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    show_leaves = Column(Boolean, default=True)
    show_learning = Column(Boolean, default=True)
    show_compliance = Column(Boolean, default=True)
    show_profile = Column(Boolean, default=True)
    show_attendance = Column(Boolean, default=True)
    show_payroll = Column(Boolean, default=True)
    show_career = Column(Boolean, default=True)
    show_wellness = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="dashboard_config")


class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_leaves = Column(Integer, default=20)
    used_leaves = Column(Integer, default=0)
    remaining_leaves = Column(Integer, default=20)
    year = Column(Integer, nullable=False)


class UserDocument(Base):
    __tablename__ = "user_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # "id", "certificate"
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="documents")


class PolicyAcknowledgement(Base):
    __tablename__ = "policy_acknowledgements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    policy_slug = Column(String, nullable=False)  # hr, ai, it, finance
    acknowledged_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", backref="policy_acknowledgements")
