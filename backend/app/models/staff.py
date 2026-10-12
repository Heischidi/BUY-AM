import enum
from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Boolean, Enum, DateTime, Date, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class IdentityType(str, enum.Enum):
    passport = "Passport"
    nin = "NIN"
    drivers_license = "Driver's License"
    voters_card = "Voter's Card"
    national_id = "National ID Card"


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    identity_type = Column(Enum(IdentityType), nullable=True)
    identity_number = Column(String(100), nullable=True)
    # PIN for clock-in (4-digit, stored as hashed)
    pin_hash = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(String(50), default="staff", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    attendance_records = relationship("StaffAttendance", back_populates="staff", cascade="all, delete-orphan")


class ClockStatus(str, enum.Enum):
    clocked_in = "clocked_in"
    clocked_out = "clocked_out"


class StaffAttendance(Base):
    __tablename__ = "staff_attendance"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    clock_in = Column(DateTime, nullable=True)
    clock_out = Column(DateTime, nullable=True)
    date = Column(Date, nullable=False, default=date.today)
    notes = Column(Text, nullable=True)
    status = Column(Enum(ClockStatus), default=ClockStatus.clocked_in, nullable=False)

    # Relationships
    staff = relationship("Staff", back_populates="attendance_records")
