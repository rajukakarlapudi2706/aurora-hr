from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import math, io
from app.db.session import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.payroll import PayrollDetail, PayrollRun
from app.models.employee import Employee
from app.schemas.payroll import SalaryStructureCreate, SalaryStructureResponse, PayrollRunCreate, PayrollRunResponse, PayrollDetailResponse
from app.schemas.common import PaginatedResponse
from app.services import payroll_service
from app.utils.pdf_generator import generate_payslip_pdf
from app.utils.excel_export import export_payroll

router = APIRouter(prefix="/payroll", tags=["payroll"])


@router.post("/salary-structure", response_model=SalaryStructureResponse)
def upsert_salary_structure(data: SalaryStructureCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return payroll_service.upsert_salary_structure(db, data)


@router.get("/salary-structure/{employee_id}", response_model=SalaryStructureResponse)
def get_salary_structure(employee_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    from app.models.payroll import SalaryStructure
    from fastapi import HTTPException
    struct = db.query(SalaryStructure).filter(SalaryStructure.employee_id == employee_id).first()
    if not struct:
        raise HTTPException(status_code=404, detail="Salary structure not found")
    return struct


@router.post("/process", response_model=PayrollRunResponse)
def process_payroll(data: PayrollRunCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return payroll_service.process_payroll(db, data.month_year)


@router.get("/runs", response_model=PaginatedResponse[PayrollRunResponse])
def list_runs(page: int = Query(1, ge=1), limit: int = Query(12), db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    items, total = payroll_service.list_payroll_runs(db, page, limit)
    return PaginatedResponse(items=items, total=total, page=page, limit=limit, pages=math.ceil(total / limit))


@router.get("/runs/{run_id}", response_model=PayrollRunResponse)
def get_run(run_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return payroll_service.get_payroll_run(db, run_id)


@router.get("/runs/{run_id}/details", response_model=PaginatedResponse[PayrollDetailResponse])
def get_run_details(run_id: str, page: int = Query(1, ge=1), limit: int = Query(50),
                    db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    q = db.query(PayrollDetail).filter(PayrollDetail.payroll_run_id == run_id)
    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()
    return PaginatedResponse(items=items, total=total, page=page, limit=limit, pages=math.ceil(total / limit))


@router.get("/payslip/{detail_id}/pdf")
def download_payslip(detail_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    detail = db.query(PayrollDetail).filter(PayrollDetail.id == detail_id).first()
    if not detail:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Payslip not found")
    emp = db.query(Employee).filter(Employee.id == detail.employee_id).first()
    run = db.query(PayrollRun).filter(PayrollRun.id == detail.payroll_run_id).first()
    emp_data = {
        "employee_id": emp.employee_id, "first_name": emp.first_name, "last_name": emp.last_name,
        "designation": emp.designation, "department": "", "pan_number": emp.pan_number,
    }
    payroll_data = {k: getattr(detail, k) for k in [
        "working_days", "basic_salary", "allowances", "gross_salary",
        "pf_deduction", "esic_deduction", "tds_deduction", "net_salary",
    ]}
    pdf_bytes = generate_payslip_pdf(emp_data, payroll_data, run.month_year)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=payslip-{emp.employee_id}-{run.month_year}.pdf"},
    )


@router.get("/runs/{run_id}/neft")
def download_neft(run_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    details = db.query(PayrollDetail).filter(PayrollDetail.payroll_run_id == run_id).all()
    lines = ["Account No,IFSC,Amount,Narration"]
    for d in details:
        emp = db.query(Employee).filter(Employee.id == d.employee_id).first()
        lines.append(f"{emp.bank_account_number or ''},{emp.bank_ifsc_code or ''},{d.net_salary},SALARY")
    content = "\n".join(lines).encode()
    run = payroll_service.get_payroll_run(db, run_id)
    return StreamingResponse(
        io.BytesIO(content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=neft-{run.month_year}.csv"},
    )
