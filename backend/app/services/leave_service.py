from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date, timedelta
from decimal import Decimal
from app.models.leave import LeaveType, LeaveBalance, LeaveApplication
from app.schemas.leave import LeaveApplicationCreate, LeaveApprovalRequest


def count_working_days(from_date: date, to_date: date) -> Decimal:
    """Count weekdays between two dates inclusive."""
    total = Decimal("0")
    current = from_date
    while current <= to_date:
        if current.weekday() < 5:  # Mon–Fri
            total += 1
        current += timedelta(days=1)
    return total


def get_balance(db: Session, employee_id: str):
    return db.query(LeaveBalance).filter(LeaveBalance.employee_id == employee_id).all()


def apply_leave(db: Session, employee_id: str, data: LeaveApplicationCreate) -> LeaveApplication:
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id,
        LeaveBalance.leave_type_id == data.leave_type_id,
    ).first()
    if not balance:
        raise HTTPException(status_code=400, detail="No leave balance found for this type")

    days = count_working_days(data.from_date, data.to_date)
    if days <= 0:
        raise HTTPException(status_code=400, detail="No working days in selected range")
    if balance.available_balance < days:
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Available: {balance.available_balance}")

    application = LeaveApplication(
        employee_id=employee_id,
        leave_type_id=data.leave_type_id,
        from_date=data.from_date,
        to_date=data.to_date,
        number_of_days=days,
        reason=data.reason,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


def approve_leave(db: Session, application_id: str,
                  approver_id: str, data: LeaveApprovalRequest) -> LeaveApplication:
    app = db.query(LeaveApplication).filter(LeaveApplication.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status != "Applied":
        raise HTTPException(status_code=400, detail="Application already processed")

    if data.action == "approve":
        app.status = "Approved"
        app.approved_by = approver_id
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == app.employee_id,
            LeaveBalance.leave_type_id == app.leave_type_id,
        ).first()
        if balance:
            balance.available_balance -= app.number_of_days
            balance.utilized_balance += app.number_of_days
    elif data.action == "reject":
        app.status = "Rejected"
        app.rejection_reason = data.rejection_reason
        app.approved_by = approver_id
    else:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")

    db.commit()
    db.refresh(app)
    return app


def list_applications(db: Session, employee_id: str = None,
                       status: str = None, page: int = 1, limit: int = 25):
    q = db.query(LeaveApplication)
    if employee_id:
        q = q.filter(LeaveApplication.employee_id == employee_id)
    if status:
        q = q.filter(LeaveApplication.status == status)
    total = q.count()
    items = q.order_by(LeaveApplication.from_date.desc()) \
        .offset((page - 1) * limit).limit(limit).all()
    return items, total


def cancel_leave(db: Session, application_id: str, employee_id: str) -> LeaveApplication:
    app = db.query(LeaveApplication).filter(
        LeaveApplication.id == application_id,
        LeaveApplication.employee_id == employee_id,
        LeaveApplication.status == "Applied",
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found or cannot be cancelled")
    app.status = "Rejected"
    app.rejection_reason = "Cancelled by employee"
    db.commit()
    db.refresh(app)
    return app
