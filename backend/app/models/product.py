import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, Boolean, Enum, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class ProductStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    inactive = "inactive"
    out_of_stock = "out_of_stock"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("sellers.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(300), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Numeric(12, 2), nullable=False)
    compare_at_price = Column(Numeric(12, 2), nullable=True)
    stock_quantity = Column(Integer, default=0)
    sku = Column(String(100), nullable=True, unique=True)
    status = Column(Enum(ProductStatus), default=ProductStatus.active, nullable=False)
    featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    seller = relationship("Seller", back_populates="products")
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="product")
    wishlist_items = relationship("WishlistItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    url = Column(String(500), nullable=False)
    alt_text = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="images")
