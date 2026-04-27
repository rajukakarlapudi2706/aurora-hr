from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import date
from uuid import UUID


class AttendanceCreate(BaseModel):
    employee_id: UUID
    attendance_date: date
    status: str
    remarks: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        allowed = {"Present", "Absent", "Leave", "Half Day", "Holiday", "Weekoff"}
        if v not in allowed:
            raise ValueError(f"Status must be one of {allowed}")
        return v

    @field_validator("attendance_date")
    @classmethod
    def no_future_date(cls, v):
        if v > date.today():
            raise ValueError("Cannot mark attendance for future dates")
        return v


class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: UUID
    employee_id: UUID
    attendance_date: date
    status: str
    remarks: Optional[str] = None
    approval_status: str

    model_config = {"from_attributes": True}


class AttendanceSummary(BaseModel):
    present: int = 0
    absent: int = 0
    leave: int = 0
    half_day: int = 0
    holiday: int = 0
    weekoff: int = 0
    total_working_days: int = 0
