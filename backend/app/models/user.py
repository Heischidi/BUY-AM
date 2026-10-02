import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    customer = "customer"
    seller = "seller"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.customer, nullable=False)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    seller_profile = relationship("Seller", back_populates="user", uselist=False)
    addresses = relationship("Address", back_populates="user")
    cart = relationship("Cart", back_populates="user", uselist=False)
    wishlist_items = relationship("WishlistItem", back_populates="user")
    orders = relationship("Order", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")
    procurement_requests = relationship("ProcurementRequest", back_populates="user")
