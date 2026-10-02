import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class ProcurementStatus(str, enum.Enum):
    submitted = "submitted"
    reviewing = "reviewing"
    quoted = "quoted"
    approved = "approved"
    fulfilled = "fulfilled"
    cancelled = "cancelled"


class ProcurementRequest(Base):
    __tablename__ = "procurement_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # guests allowed
    item_description = Column(Text, nullable=False)
    quantity = Column(Integer, default=1)
    budget = Column(Numeric(12, 2), nullable=True)
    delivery_location = Column(String(500), nullable=False)
    required_date = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    attachment_url = Column(String(500), nullable=True)
    status = Column(
        Enum(ProcurementStatus), default=ProcurementStatus.submitted, nullable=False
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="procurement_requests")
