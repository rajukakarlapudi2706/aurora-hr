from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date
from uuid import UUID
from decimal import Decimal


class LeaveTypeResponse(BaseModel):
    id: UUID
    name: str
    max_days_per_year: int

    model_config = {"from_attributes": True}


class LeaveBalanceResponse(BaseModel):
    id: UUID
    leave_type: LeaveTypeResponse
    available_balance: Decimal
    utilized_balance: Decimal

    model_config = {"from_attributes": True}


class LeaveApplicationCreate(BaseModel):
    leave_type_id: UUID
    from_date: date
    to_date: date
    reason: Optional[str] = None

    @field_validator("to_date")
    @classmethod
    def to_date_after_from_date(cls, v, info):
        if "from_date" in info.data and v < info.data["from_date"]:
            raise ValueError("to_date must be after from_date")
        return v


class LeaveApplicationResponse(BaseModel):
    id: UUID
    employee_id: UUID
    leave_type: LeaveTypeResponse
    from_date: date
    to_date: date
    number_of_days: Decimal
    reason: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None

    model_config = {"from_attributes": True}


class LeaveApprovalRequest(BaseModel):
    action: str  # approve or reject
    rejection_reason: Optional[str] = None
