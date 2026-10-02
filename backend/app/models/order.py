import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, Enum, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.pending, nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)
    delivery_fee = Column(Numeric(12, 2), default=0)
    total = Column(Numeric(12, 2), nullable=False)
    payment_status = Column(
        Enum(PaymentStatus), default=PaymentStatus.pending, nullable=False
    )
    payment_reference = Column(String(200), nullable=True, index=True)
    shipping_address = Column(JSON, nullable=True)  # snapshot at time of order
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)  # nullable in case product deleted
    seller_id = Column(Integer, ForeignKey("sellers.id"), nullable=True)
    # Snapshot of product data at time of purchase
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
