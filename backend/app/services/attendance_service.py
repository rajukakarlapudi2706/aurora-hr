from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate, AttendanceSummary
import uuid


def mark_attendance(db: Session, data: AttendanceCreate, created_by_id: str) -> Attendance:
    existing = db.query(Attendance).filter(
        Attendance.employee_id == data.employee_id,
        Attendance.attendance_date == data.attendance_date,
    ).first()
    if existing:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing

    record = Attendance(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_attendance(db: Session, employee_id: str = None,
                    from_date: date = None, to_date: date = None,
                    page: int = 1, limit: int = 50):
    q = db.query(Attendance)
    if employee_id:
        q = q.filter(Attendance.employee_id == employee_id)
    if from_date:
        q = q.filter(Attendance.attendance_date >= from_date)
    if to_date:
        q = q.filter(Attendance.attendance_date <= to_date)
    total = q.count()
    items = q.order_by(Attendance.attendance_date.desc()).offset((page - 1) * limit).limit(limit).all()
    return items, total


def get_summary(db: Session, employee_id: str, month: int, year: int) -> AttendanceSummary:
    from_d = date(year, month, 1)
    import calendar
    last_day = calendar.monthrange(year, month)[1]
    to_d = date(year, month, last_day)

    records = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        Attendance.attendance_date >= from_d,
        Attendance.attendance_date <= to_d,
    ).all()

    summary = AttendanceSummary()
    for r in records:
        if r.status == "Present":
            summary.present += 1
        elif r.status == "Absent":
            summary.absent += 1
        elif r.status == "Leave":
            summary.leave += 1
        elif r.status == "Half Day":
            summary.half_day += 1
        elif r.status == "Holiday":
            summary.holiday += 1
        elif r.status == "Weekoff":
            summary.weekoff += 1
    summary.total_working_days = summary.present + summary.half_day
    return summary


def approve_attendance(db: Session, record_id: str, approved_by: str, action: str) -> Attendance:
    record = db.query(Attendance).filter(Attendance.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    record.approval_status = "Approved" if action == "approve" else "Rejected"
    record.approved_by = approved_by
    db.commit()
    db.refresh(record)
    return record
