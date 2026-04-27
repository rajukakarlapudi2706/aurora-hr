from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException
from app.models.employee import Employee, Department
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
import uuid


def generate_employee_id(db: Session) -> str:
    count = db.query(Employee).count()
    return f"EMP-{count + 1:04d}"


def create_employee(db: Session, data: EmployeeCreate) -> Employee:
    existing = db.query(Employee).filter(Employee.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    emp = Employee(
        employee_id=generate_employee_id(db),
        **data.model_dump()
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


def get_employee(db: Session, employee_id: str) -> Employee:
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


def list_employees(db: Session, page: int = 1, limit: int = 25,
                   search: str = "", status: str = "") -> tuple:
    q = db.query(Employee)
    if search:
        q = q.filter(or_(
            Employee.first_name.ilike(f"%{search}%"),
            Employee.last_name.ilike(f"%{search}%"),
            Employee.email.ilike(f"%{search}%"),
            Employee.employee_id.ilike(f"%{search}%"),
        ))
    if status:
        q = q.filter(Employee.status == status)
    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()
    return items, total


def update_employee(db: Session, employee_id: str, data: EmployeeUpdate) -> Employee:
    emp = get_employee(db, employee_id)
    update_data = data.model_dump(exclude_unset=True)
    if "email" in update_data:
        conflict = db.query(Employee).filter(
            Employee.email == update_data["email"],
            Employee.id != employee_id
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Email already in use")
    for key, value in update_data.items():
        setattr(emp, key, value)
    db.commit()
    db.refresh(emp)
    return emp


def delete_employee(db: Session, employee_id: str):
    emp = get_employee(db, employee_id)
    db.delete(emp)
    db.commit()


def bulk_import_employees(db: Session, rows: list) -> dict:
    success, failed, errors = 0, 0, []
    for i, row in enumerate(rows):
        try:
            data = EmployeeCreate(**row)
            create_employee(db, data)
            success += 1
        except Exception as e:
            failed += 1
            errors.append(f"Row {i + 2}: {str(e)}")
    return {"total": len(rows), "success": success, "failed": failed, "errors": errors}
