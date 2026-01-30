from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, LeaveRequest, DashboardConfig, CompliancePolicy, LearningContent
from app.schemas import DashboardData, DashboardConfigUpdate, DashboardConfigResponse, LeaveRequestResponse, UserResponse
from app.dependencies import get_current_user
from datetime import date
import json

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardData)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    config = db.query(DashboardConfig).filter(DashboardConfig.user_id == current_user.id).first()
    if not config:
        config = DashboardConfig(
            user_id=current_user.id,
            show_leaves=True,
            show_learning=True,
            show_compliance=True,
            show_profile=True,
            show_attendance=True,
            show_payroll=True,
            show_career=True,
            show_wellness=True,
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    
    def get_show(config, key, default=True):
        return getattr(config, key, default) if config else default
    
    dashboard_data = DashboardData(config=DashboardConfigResponse(
        show_leaves=get_show(config, "show_leaves"),
        show_learning=get_show(config, "show_learning"),
        show_compliance=get_show(config, "show_compliance"),
        show_profile=get_show(config, "show_profile"),
        show_attendance=get_show(config, "show_attendance"),
        show_payroll=get_show(config, "show_payroll"),
        show_career=get_show(config, "show_career"),
        show_wellness=get_show(config, "show_wellness"),
    ))
    
    if current_user.role == "employee":
        leaves = db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == current_user.id
        ).all()
        dashboard_data.leave_requests = [
            LeaveRequestResponse(
                id=l.id,
                employee_id=l.employee_id,
                department=l.department,
                from_date=l.from_date,
                to_date=l.to_date,
                reason=l.reason,
                status=l.status
            ) for l in leaves
        ]
    
    elif current_user.role == "manager":
        team_members = db.query(User).filter(
            User.department == current_user.department,
            User.role == "employee"
        ).all()
        dashboard_data.team_members = [
            UserResponse(
                id=u.id,
                name=u.name,
                email=u.email,
                role=u.role,
                department=u.department,
                skills=json.loads(u.skills) if u.skills else []
            ) for u in team_members
        ]
        
        pending_leaves = db.query(LeaveRequest).filter(
            LeaveRequest.department == current_user.department,
            LeaveRequest.status == "Pending"
        ).join(User).all()
        dashboard_data.pending_leaves = [
            LeaveRequestResponse(
                id=l.id,
                employee_id=l.employee_id,
                department=l.department,
                from_date=l.from_date,
                to_date=l.to_date,
                reason=l.reason,
                status=l.status,
                employee_name=l.employee.name
            ) for l in pending_leaves
        ]
    
    return dashboard_data


@router.post("/config", response_model=DashboardConfigResponse)
def update_dashboard_config(
    config_update: DashboardConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    config = db.query(DashboardConfig).filter(DashboardConfig.user_id == current_user.id).first()
    if not config:
        config = DashboardConfig(user_id=current_user.id)
        db.add(config)
    
    def set_if(name):
        val = getattr(config_update, name, None)
        if val is not None and hasattr(config, name):
            setattr(config, name, val)
    set_if("show_leaves")
    set_if("show_learning")
    set_if("show_compliance")
    set_if("show_profile")
    set_if("show_attendance")
    set_if("show_payroll")
    set_if("show_career")
    set_if("show_wellness")
    
    db.commit()
    db.refresh(config)
    def get_show(c, key, default=True):
        return getattr(c, key, default) if c else default
    return DashboardConfigResponse(
        show_leaves=get_show(config, "show_leaves"),
        show_learning=get_show(config, "show_learning"),
        show_compliance=get_show(config, "show_compliance"),
        show_profile=get_show(config, "show_profile"),
        show_attendance=get_show(config, "show_attendance"),
        show_payroll=get_show(config, "show_payroll"),
        show_career=get_show(config, "show_career"),
        show_wellness=get_show(config, "show_wellness"),
    )
