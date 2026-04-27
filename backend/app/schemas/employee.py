from pydantic import BaseModel, EmailStr, field_validator
import re
from typing import Optional
from datetime import date
from uuid import UUID


class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentResponse(DepartmentBase):
    id: UUID

    model_config = {"from_attributes": True}


class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    department_id: Optional[UUID] = None
    designation: Optional[str] = None
    joining_date: Optional[date] = None
    bank_account_number: Optional[str] = None
    bank_ifsc_code: Optional[str] = None
    pan_number: Optional[str] = None
    aadhaar_number: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    @field_validator("pan_number")
    @classmethod
    def validate_pan(cls, v):
        if v and not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", v):
            raise ValueError("Invalid PAN number format")
        return v

    @field_validator("bank_ifsc_code")
    @classmethod
    def validate_ifsc(cls, v):
        if v and not re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", v):
            raise ValueError("Invalid IFSC code format")
        return v


class EmployeeUpdate(EmployeeBase):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    status: Optional[str] = None


class EmployeeResponse(BaseModel):
    id: UUID
    employee_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    designation: Optional[str] = None
    status: str
    joining_date: Optional[date] = None
    department: Optional[DepartmentResponse] = None

    model_config = {"from_attributes": True}


class EmployeeDetailResponse(EmployeeResponse):
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    pan_number: Optional[str] = None
    aadhaar_number: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc_code: Optional[str] = None

    model_config = {"from_attributes": True}


class BulkImportResult(BaseModel):
    total: int
    success: int
    failed: int
    errors: list[str] = []
