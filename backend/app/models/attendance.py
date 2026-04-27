import uuid
from sqlalchemy import Column, String, Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin


class Attendance(Base, TimestampMixin):
    __tablename__ = "attendance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    attendance_date = Column(Date, nullable=False, index=True)
    status = Column(String(20), nullable=False)  # Present, Absent, Leave, Half Day, Holiday, Weekoff
    remarks = Column(Text)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approval_status = Column(String(20), default="Pending")  # Pending, Approved, Rejected

    employee = relationship("Employee", back_populates="attendances")
