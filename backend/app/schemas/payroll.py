from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from decimal import Decimal


class SalaryStructureCreate(BaseModel):
    employee_id: UUID
    basic_salary: Decimal
    da: Decimal = Decimal("0")
    hra: Decimal = Decimal("0")
    other_allowances: Decimal = Decimal("0")
    pf_percentage: Decimal = Decimal("12.0")


class SalaryStructureResponse(SalaryStructureCreate):
    id: UUID

    model_config = {"from_attributes": True}


class PayrollRunCreate(BaseModel):
    month_year: str  # format: YYYY-MM


class PayrollRunResponse(BaseModel):
    id: UUID
    month_year: str
    status: str
    total_employees: int
    total_amount: Decimal

    model_config = {"from_attributes": True}


class PayrollDetailResponse(BaseModel):
    id: UUID
    employee_id: UUID
    working_days: int
    basic_salary: Decimal
    allowances: Decimal
    gross_salary: Decimal
    pf_deduction: Decimal
    esic_deduction: Decimal
    tds_deduction: Decimal
    net_salary: Decimal

    model_config = {"from_attributes": True}


class PayrollSummary(BaseModel):
    total_employees: int
    total_gross: Decimal
    total_deductions: Decimal
    total_net: Decimal
