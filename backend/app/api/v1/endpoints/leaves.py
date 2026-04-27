from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import math
from app.db.session import get_db
from app.dependencies import get_current_user, require_manager
from app.models.user import User
from app.models.leave import LeaveType, LeaveBalance
from app.schemas.leave import LeaveApplicationCreate, LeaveApplicationResponse, LeaveBalanceResponse, LeaveApprovalRequest, LeaveTypeResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services import leave_service

router = APIRouter(prefix="/leaves", tags=["leaves"])


@router.get("/types", response_model=list[LeaveTypeResponse])
def list_leave_types(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(LeaveType).all()


@router.get("/balance", response_model=list[LeaveBalanceResponse])
def get_balance(employee_id: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    eid = employee_id or str(current_user.id)
    return leave_service.get_balance(db, eid)


@router.post("/apply", response_model=LeaveApplicationResponse, status_code=201)
def apply_leave(data: LeaveApplicationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return leave_service.apply_leave(db, str(current_user.id), data)


@router.get("/applications", response_model=PaginatedResponse[LeaveApplicationResponse])
def list_applications(
    page: int = Query(1, ge=1),
    limit: int = Query(25),
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    eid = employee_id if current_user.role in ("admin", "manager") else str(current_user.id)
    items, total = leave_service.list_applications(db, eid, status, page, limit)
    return PaginatedResponse(items=items, total=total, page=page, limit=limit, pages=math.ceil(total / limit))


@router.post("/applications/{application_id}/action", response_model=LeaveApplicationResponse)
def process_application(
    application_id: str,
    data: LeaveApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    return leave_service.approve_leave(db, application_id, str(current_user.id), data)


@router.post("/applications/{application_id}/cancel", response_model=LeaveApplicationResponse)
def cancel_application(application_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return leave_service.cancel_leave(db, application_id, str(current_user.id))


@router.post("/seed-types", response_model=MessageResponse)
def seed_leave_types(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    defaults = [("Casual Leave", 12), ("Earned Leave", 15), ("Sick Leave", 10)]
    for name, days in defaults:
        if not db.query(LeaveType).filter(LeaveType.name == name).first():
            db.add(LeaveType(name=name, max_days_per_year=days))
    db.commit()
    return MessageResponse(message="Leave types seeded")
