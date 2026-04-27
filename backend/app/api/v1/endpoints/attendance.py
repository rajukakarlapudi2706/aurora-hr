from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
import math, io
from app.db.session import get_db
from app.dependencies import get_current_user, require_manager
from app.models.user import User
from app.schemas.attendance import AttendanceCreate, AttendanceResponse, AttendanceSummary
from app.schemas.common import PaginatedResponse
from app.services import attendance_service
from app.utils.excel_export import export_attendance

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("", response_model=AttendanceResponse, status_code=201)
def mark_attendance(data: AttendanceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return attendance_service.mark_attendance(db, data, str(current_user.id))


@router.get("", response_model=PaginatedResponse[AttendanceResponse])
def list_attendance(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    employee_id: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    items, total = attendance_service.list_attendance(db, employee_id, from_date, to_date, page, limit)
    return PaginatedResponse(items=items, total=total, page=page, limit=limit, pages=math.ceil(total / limit))


@router.get("/summary")
def get_summary(
    employee_id: str,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return attendance_service.get_summary(db, employee_id, month, year)


@router.post("/{record_id}/approve")
def approve_attendance(
    record_id: str,
    action: str = Query(..., pattern="^(approve|reject)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    return attendance_service.approve_attendance(db, record_id, str(current_user.id), action)


@router.get("/report/export")
def export_report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from_date = date(year, month, 1)
    import calendar
    to_date = date(year, month, calendar.monthrange(year, month)[1])
    items, _ = attendance_service.list_attendance(db, from_date=from_date, to_date=to_date, limit=10000)
    rows = [
        {
            "employee_id": str(r.employee_id),
            "employee_name": "",
            "attendance_date": r.attendance_date,
            "status": r.status,
            "remarks": r.remarks,
            "approval_status": r.approval_status,
        }
        for r in items
    ]
    content = export_attendance(rows, f"{year}-{month:02d}")
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=attendance-{year}-{month:02d}.xlsx"},
    )
