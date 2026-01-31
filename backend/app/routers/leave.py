from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import LeaveRequest, User, LeaveBalance
from app.schemas import (
    LeaveRequestCreate, LeaveRequestResponse, LeaveApprovalRequest,
    LeaveBalanceResponse, TeamCalendarResponse, CalendarEvent,
    BulkLeaveApprovalRequest
)
from app.dependencies import get_current_user, require_role
from datetime import date, datetime, timedelta
from typing import Optional, List
import json

router = APIRouter(prefix="/leave", tags=["leave"])

AUTO_APPROVE_MINUTES = 5


def _parse_created_at(created):
    if created is None:
        return None
    if isinstance(created, datetime):
        return created.replace(tzinfo=None) if created.tzinfo else created
    if isinstance(created, str):
        try:
            dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            return dt.replace(tzinfo=None) if dt.tzinfo else dt
        except Exception:
            return None
    return None


def apply_auto_approvals(db: Session):
    """Auto-approve Pending leaves older than AUTO_APPROVE_MINUTES."""
    now = datetime.utcnow()
    threshold = now - timedelta(minutes=AUTO_APPROVE_MINUTES)
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.status == "Pending",
        LeaveRequest.created_at.isnot(None),
    ).all()
    current_year = now.year
    for leave in leaves:
        created = _parse_created_at(leave.created_at)
        if created is None or created > threshold:
            continue
        leave.status = "Approved"
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.user_id == leave.employee_id,
            LeaveBalance.year == current_year,
        ).first()
        if balance:
            days_diff = (leave.to_date - leave.from_date).days + 1
            balance.used_leaves += days_diff
            balance.remaining_leaves = balance.total_leaves - balance.used_leaves
        else:
            days_diff = (leave.to_date - leave.from_date).days + 1
            new_balance = LeaveBalance(
                user_id=leave.employee_id,
                total_leaves=20,
                used_leaves=days_diff,
                remaining_leaves=20 - days_diff,
                year=current_year,
            )
            db.add(new_balance)
    db.commit()


def leave_to_response(l) -> LeaveRequestResponse:
    return LeaveRequestResponse(
        id=l.id,
        employee_id=l.employee_id,
        department=l.department,
        from_date=l.from_date,
        to_date=l.to_date,
        reason=l.reason,
        status=l.status,
        employee_name=getattr(l.employee, "name", None) if hasattr(l, "employee") and l.employee else None,
        created_at=getattr(l, "created_at", None),
    )


@router.post("/apply", response_model=LeaveRequestResponse)
def apply_for_leave(
    leave_data: LeaveRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["employee", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees and managers can apply for leave"
        )
    
    if leave_data.from_date > leave_data.to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="From date must be before or equal to to date"
        )
    
    new_leave = LeaveRequest(
        employee_id=current_user.id,
        department=current_user.department,
        from_date=leave_data.from_date,
        to_date=leave_data.to_date,
        reason=leave_data.reason,
        status="Pending",
        created_at=datetime.utcnow(),
    )
    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)
    return leave_to_response(new_leave)


@router.delete("/my/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_leave(
    leave_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.employee_id == current_user.id,
    ).first()
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found",
        )
    if leave.status != "Pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending leave requests can be deleted",
        )
    db.delete(leave)
    db.commit()
    return None


@router.get("/my", response_model=list[LeaveRequestResponse])
def get_my_leaves(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apply_auto_approvals(db)
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == current_user.id
    ).order_by(LeaveRequest.from_date.desc()).all()
    return [leave_to_response(l) for l in leaves]


@router.get("/my/balance", response_model=LeaveBalanceResponse)
def get_my_leave_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's leave balance for the current year."""
    current_year = datetime.now().year
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.user_id == current_user.id,
        LeaveBalance.year == current_year
    ).first()
    
    if balance:
        return LeaveBalanceResponse(
            user_id=current_user.id,
            user_name=current_user.name,
            total_leaves=balance.total_leaves,
            used_leaves=balance.used_leaves,
            remaining_leaves=balance.remaining_leaves,
            year=balance.year
        )
    else:
        # Default to 20 days if no balance record exists
        return LeaveBalanceResponse(
            user_id=current_user.id,
            user_name=current_user.name,
            total_leaves=20,
            used_leaves=0,
            remaining_leaves=20,
            year=current_year
        )


@router.get("/pending", response_model=list[LeaveRequestResponse])
def get_pending_leaves(
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db)
):
    apply_auto_approvals(db)
    pending_leaves = db.query(LeaveRequest).filter(
        LeaveRequest.department == current_user.department,
        LeaveRequest.status == "Pending"
    ).join(User).order_by(LeaveRequest.from_date).all()
    return [leave_to_response(l) for l in pending_leaves]


@router.post("/approve", response_model=LeaveRequestResponse)
def approve_leave(
    approval: LeaveApprovalRequest,
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db)
):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == approval.leave_id).first()
    if not leave:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leave request not found"
        )
    
    if leave.department != current_user.department:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only approve leaves from your department"
        )
    
    if leave.status != "Pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leave request is not pending"
        )
    
    if approval.status not in ["Approved", "Rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'Approved' or 'Rejected'"
        )
    
    leave.status = approval.status
    db.commit()
    db.refresh(leave)

    if approval.status == "Approved":
        current_year = datetime.now().year
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.user_id == leave.employee_id,
            LeaveBalance.year == current_year
        ).first()
        
        if balance:
            days_diff = (leave.to_date - leave.from_date).days + 1
            balance.used_leaves += days_diff
            balance.remaining_leaves = balance.total_leaves - balance.used_leaves
            db.commit()
        else:
            days_diff = (leave.to_date - leave.from_date).days + 1
            new_balance = LeaveBalance(
                user_id=leave.employee_id,
                total_leaves=20,
                used_leaves=days_diff,
                remaining_leaves=20 - days_diff,
                year=current_year
            )
            db.add(new_balance)
            db.commit()

    return leave_to_response(leave)


@router.get("/team-calendar", response_model=TeamCalendarResponse)
def get_team_calendar(
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
):
    if not start_date:
        start_date = date.today()
    if not end_date:
        end_date = start_date + timedelta(days=90)
    
    team_leaves = db.query(LeaveRequest).filter(
        LeaveRequest.department == current_user.department,
        LeaveRequest.from_date <= end_date,
        LeaveRequest.to_date >= start_date
    ).join(User).all()
    
    events = []
    date_employee_map = {}
    conflicts = []
    
    for leave in team_leaves:
        event = CalendarEvent(
            leave_id=leave.id,
            employee_id=leave.employee_id,
            employee_name=leave.employee.name,
            from_date=leave.from_date,
            to_date=leave.to_date,
            reason=leave.reason,
            status=leave.status
        )
        
        current_date = leave.from_date
        while current_date <= leave.to_date:
            if current_date not in date_employee_map:
                date_employee_map[current_date] = []
            date_employee_map[current_date].append(leave.employee_id)
            current_date += timedelta(days=1)
        
        events.append(event)
    
    for event in events:
        current_date = event.from_date
        while current_date <= event.to_date:
            if len(date_employee_map.get(current_date, [])) > 1:
                event.has_conflict = True
                conflict_date = current_date.isoformat()
                if conflict_date not in [c.get("date") for c in conflicts]:
                    conflicts.append({
                        "date": conflict_date,
                        "employee_count": len(date_employee_map[current_date])
                    })
            current_date += timedelta(days=1)
    
    return TeamCalendarResponse(events=events, conflicts=conflicts)


@router.get("/balances", response_model=List[LeaveBalanceResponse])
def get_team_leave_balances(
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db)
):
    current_year = datetime.now().year
    team_members = db.query(User).filter(
        User.department == current_user.department,
        User.role == "employee"
    ).all()
    
    balances = []
    for member in team_members:
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.user_id == member.id,
            LeaveBalance.year == current_year
        ).first()
        
        if balance:
            balances.append(LeaveBalanceResponse(
                user_id=member.id,
                user_name=member.name,
                total_leaves=balance.total_leaves,
                used_leaves=balance.used_leaves,
                remaining_leaves=balance.remaining_leaves,
                year=balance.year
            ))
        else:
            balances.append(LeaveBalanceResponse(
                user_id=member.id,
                user_name=member.name,
                total_leaves=20,
                used_leaves=0,
                remaining_leaves=20,
                year=current_year
            ))
    
    return balances


@router.get("/history", response_model=List[LeaveRequestResponse])
def get_leave_history(
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    employee_id: Optional[int] = Query(None)
):
    apply_auto_approvals(db)
    query = db.query(LeaveRequest).filter(
        LeaveRequest.department == current_user.department
    ).join(User)
    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)
    if start_date:
        query = query.filter(LeaveRequest.from_date >= start_date)
    if end_date:
        query = query.filter(LeaveRequest.to_date <= end_date)
    if employee_id:
        query = query.filter(LeaveRequest.employee_id == employee_id)
    leaves = query.order_by(LeaveRequest.from_date.desc()).all()
    return [leave_to_response(l) for l in leaves]


@router.post("/bulk-approve")
def bulk_approve_leaves(
    bulk_request: BulkLeaveApprovalRequest,
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db)
):
    if bulk_request.status not in ["Approved", "Rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'Approved' or 'Rejected'"
        )
    
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.id.in_(bulk_request.leave_ids),
        LeaveRequest.department == current_user.department,
        LeaveRequest.status == "Pending"
    ).all()
    
    if len(leaves) != len(bulk_request.leave_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Some leave requests not found or already processed"
        )
    
    current_year = datetime.now().year
    updated_count = 0
    
    for leave in leaves:
        leave.status = bulk_request.status
        if bulk_request.status == "Approved":
            balance = db.query(LeaveBalance).filter(
                LeaveBalance.user_id == leave.employee_id,
                LeaveBalance.year == current_year
            ).first()
            
            if balance:
                days_diff = (leave.to_date - leave.from_date).days + 1
                balance.used_leaves += days_diff
                balance.remaining_leaves = balance.total_leaves - balance.used_leaves
            else:
                days_diff = (leave.to_date - leave.from_date).days + 1
                new_balance = LeaveBalance(
                    user_id=leave.employee_id,
                    total_leaves=20,
                    used_leaves=days_diff,
                    remaining_leaves=20 - days_diff,
                    year=current_year
                )
                db.add(new_balance)
        updated_count += 1
    
    db.commit()
    return {"message": f"Successfully updated {updated_count} leave requests", "updated_count": updated_count}
