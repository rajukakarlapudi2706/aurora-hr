import uuid
from sqlalchemy import Column, String, Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    employees = relationship("Employee", back_populates="department")


class Employee(Base, TimestampMixin):
    __tablename__ = "employees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(String(20), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone = Column(String(20))
    date_of_birth = Column(Date)
    gender = Column(String(20))

    aadhaar_number = Column(String(12))
    pan_number = Column(String(10))

    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    designation = Column(String(100))
    joining_date = Column(Date)
    status = Column(String(20), default="Active")  # Active, Inactive, Separated

    bank_account_number = Column(String(20))
    bank_ifsc_code = Column(String(11))

    department = relationship("Department", back_populates="employees")
    attendances = relationship("Attendance", back_populates="employee")
    leave_balances = relationship("LeaveBalance", back_populates="employee")
    leave_applications = relationship("LeaveApplication", back_populates="employee")
    salary_structure = relationship("SalaryStructure", back_populates="employee", uselist=False)
    payroll_details = relationship("PayrollDetail", back_populates="employee")
