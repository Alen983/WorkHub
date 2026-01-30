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
    
    employee = relationship("User", back_populates="leave_requests")


class CompliancePolicy(Base):
    __tablename__ = "compliance_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    department = Column(String, nullable=False)
    due_date = Column(Date, nullable=False)
    description = Column(Text)


class LearningContent(Base):
    __tablename__ = "learning_content"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    tags = Column(Text, default="[]")  # JSON string
    level = Column(String, nullable=False)
    description = Column(Text)


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


class UserDocument(Base):
    __tablename__ = "user_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # "id", "certificate"
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="documents")
