import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class SellerStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Seller(Base):
    __tablename__ = "sellers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    business_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    bank_name = Column(String(100), nullable=True)
    account_number = Column(String(20), nullable=True)
    account_name = Column(String(255), nullable=True)
    verification_status = Column(
        Enum(SellerStatus), default=SellerStatus.pending, nullable=False
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="seller_profile")
    products = relationship("Product", back_populates="seller")
