from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal
import calendar as cal
from datetime import date
from app.models.payroll import SalaryStructure, PayrollRun, PayrollDetail
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.schemas.payroll import SalaryStructureCreate
from app.utils.payroll_calc import calculate_payroll


def upsert_salary_structure(db: Session, data: SalaryStructureCreate) -> SalaryStructure:
    existing = db.query(SalaryStructure).filter(
        SalaryStructure.employee_id == data.employee_id
    ).first()
    if existing:
        for k, v in data.model_dump(exclude={"employee_id"}).items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    structure = SalaryStructure(**data.model_dump())
    db.add(structure)
    db.commit()
    db.refresh(structure)
    return structure


def process_payroll(db: Session, month_year: str) -> PayrollRun:
    existing = db.query(PayrollRun).filter(PayrollRun.month_year == month_year).first()
    if existing and existing.status == "Processed":
        raise HTTPException(status_code=400, detail="Payroll already processed for this month")

    year, month = int(month_year.split("-")[0]), int(month_year.split("-")[1])
    days_in_month = cal.monthrange(year, month)[1]
    from_date = date(year, month, 1)
    to_date = date(year, month, days_in_month)

    run = existing or PayrollRun(month_year=month_year)
    run.status = "Processing"
    db.add(run)
    db.flush()

    employees = db.query(Employee).filter(Employee.status == "Active").all()
    total_net = Decimal("0")

    for emp in employees:
        structure = db.query(SalaryStructure).filter(
            SalaryStructure.employee_id == emp.id
        ).first()
        if not structure:
            continue

        att_records = db.query(Attendance).filter(
            Attendance.employee_id == emp.id,
            Attendance.attendance_date >= from_date,
            Attendance.attendance_date <= to_date,
            Attendance.status.in_(["Present", "Half Day"]),
        ).all()
        working_days = sum(1 if r.status == "Present" else 0.5 for r in att_records)
        working_days = max(int(working_days), 1)

        calc = calculate_payroll(
            structure.basic_salary, structure.da, structure.hra,
            structure.other_allowances, working_days, days_in_month,
            structure.pf_percentage,
        )

        existing_detail = db.query(PayrollDetail).filter(
            PayrollDetail.payroll_run_id == run.id,
            PayrollDetail.employee_id == emp.id,
        ).first()

        if existing_detail:
            for k, v in calc.items():
                setattr(existing_detail, k, v)
            existing_detail.working_days = working_days
        else:
            detail = PayrollDetail(
                payroll_run_id=run.id,
                employee_id=emp.id,
                working_days=working_days,
                **calc,
            )
            db.add(detail)

        total_net += calc["net_salary"]

    run.status = "Processed"
    run.total_employees = len(employees)
    run.total_amount = total_net
    db.commit()
    db.refresh(run)
    return run


def get_payroll_run(db: Session, run_id: str) -> PayrollRun:
    run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Payroll run not found")
    return run


def list_payroll_runs(db: Session, page: int = 1, limit: int = 12):
    total = db.query(PayrollRun).count()
    items = db.query(PayrollRun).order_by(PayrollRun.month_year.desc()) \
        .offset((page - 1) * limit).limit(limit).all()
    return items, total
