import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin


class SalaryStructure(Base, TimestampMixin):
    __tablename__ = "salary_structures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), unique=True, nullable=False)
    basic_salary = Column(Numeric(12, 2), nullable=False)
    da = Column(Numeric(12, 2), default=0)
    hra = Column(Numeric(12, 2), default=0)
    other_allowances = Column(Numeric(12, 2), default=0)
    pf_percentage = Column(Numeric(5, 2), default=12.0)

    employee = relationship("Employee", back_populates="salary_structure")


class PayrollRun(Base, TimestampMixin):
    __tablename__ = "payroll_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    month_year = Column(String(7), nullable=False, index=True)  # 2025-04
    status = Column(String(20), default="Draft")  # Draft, Processing, Processed, Approved
    total_employees = Column(Integer, default=0)
    total_amount = Column(Numeric(15, 2), default=0)

    details = relationship("PayrollDetail", back_populates="payroll_run")


class PayrollDetail(Base, TimestampMixin):
    __tablename__ = "payroll_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payroll_run_id = Column(UUID(as_uuid=True), ForeignKey("payroll_runs.id"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    working_days = Column(Integer, default=0)
    basic_salary = Column(Numeric(12, 2), default=0)
    allowances = Column(Numeric(12, 2), default=0)
    gross_salary = Column(Numeric(12, 2), default=0)
    pf_deduction = Column(Numeric(12, 2), default=0)
    esic_deduction = Column(Numeric(12, 2), default=0)
    tds_deduction = Column(Numeric(12, 2), default=0)
    net_salary = Column(Numeric(12, 2), default=0)

    payroll_run = relationship("PayrollRun", back_populates="details")
    employee = relationship("Employee", back_populates="payroll_details")
