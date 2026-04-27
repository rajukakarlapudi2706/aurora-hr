from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.employee import Employee
from app.models.leave import LeaveBalance, LeaveType
from app.models.payroll import PayrollDetail, PayrollRun
from app.utils.excel_export import export_employees, export_leave_balance, export_payroll

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/employees")
def employees_report(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    employees = db.query(Employee).all()
    rows = [
        {
            "employee_id": e.employee_id, "first_name": e.first_name, "last_name": e.last_name,
            "email": e.email, "phone": e.phone, "designation": e.designation,
            "department": e.department.name if e.department else "",
            "joining_date": e.joining_date, "status": e.status,
        }
        for e in employees
    ]
    content = export_employees(rows)
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=employees.xlsx"},
    )


@router.get("/leave-balance")
def leave_balance_report(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    balances = db.query(LeaveBalance).all()
    rows = [
        {
            "employee_id": b.employee.employee_id if b.employee else "",
            "employee_name": f"{b.employee.first_name} {b.employee.last_name}" if b.employee else "",
            "leave_type": b.leave_type.name if b.leave_type else "",
            "available_balance": b.available_balance,
            "utilized_balance": b.utilized_balance,
        }
        for b in balances
    ]
    content = export_leave_balance(rows)
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=leave-balances.xlsx"},
    )


@router.get("/payroll/{month_year}")
def payroll_report(month_year: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    run = db.query(PayrollRun).filter(PayrollRun.month_year == month_year).first()
    if not run:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Payroll run not found")
    details = db.query(PayrollDetail).filter(PayrollDetail.payroll_run_id == run.id).all()
    rows = [
        {
            "employee_id": d.employee.employee_id if d.employee else "",
            "employee_name": f"{d.employee.first_name} {d.employee.last_name}" if d.employee else "",
            "working_days": d.working_days, "basic_salary": d.basic_salary,
            "allowances": d.allowances, "gross_salary": d.gross_salary,
            "pf_deduction": d.pf_deduction, "esic_deduction": d.esic_deduction,
            "tds_deduction": d.tds_deduction, "net_salary": d.net_salary,
        }
        for d in details
    ]
    content = export_payroll(rows, month_year)
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=payroll-{month_year}.xlsx"},
    )
