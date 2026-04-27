import uuid
from sqlalchemy import Column, String, Date, Integer, ForeignKey, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base, TimestampMixin


class LeaveType(Base):
    __tablename__ = "leave_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)  # Casual, Earned, Sick
    max_days_per_year = Column(Integer, nullable=False)

    balances = relationship("LeaveBalance", back_populates="leave_type")
    applications = relationship("LeaveApplication", back_populates="leave_type")


class LeaveBalance(Base, TimestampMixin):
    __tablename__ = "leave_balances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    leave_type_id = Column(UUID(as_uuid=True), ForeignKey("leave_types.id"), nullable=False)
    available_balance = Column(Numeric(5, 1), default=0)
    utilized_balance = Column(Numeric(5, 1), default=0)

    employee = relationship("Employee", back_populates="leave_balances")
    leave_type = relationship("LeaveType", back_populates="balances")


class LeaveApplication(Base, TimestampMixin):
    __tablename__ = "leave_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    leave_type_id = Column(UUID(as_uuid=True), ForeignKey("leave_types.id"), nullable=False)
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    number_of_days = Column(Numeric(5, 1), nullable=False)
    reason = Column(Text)
    status = Column(String(20), default="Applied")  # Applied, Approved, Rejected
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    rejection_reason = Column(Text)

    employee = relationship("Employee", back_populates="leave_applications")
    leave_type = relationship("LeaveType", back_populates="applications")
