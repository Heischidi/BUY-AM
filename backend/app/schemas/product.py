from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    image: Optional[str] = None
    active: bool

    class Config:
        from_attributes = True


class ProductImageResponse(BaseModel):
    id: int
    url: str
    alt_text: Optional[str] = None
    sort_order: int

    class Config:
        from_attributes = True


class ProductListItem(BaseModel):
    id: int
    name: str
    slug: str
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    discount_percentage: Optional[Decimal] = None
    discounted_price: Optional[Decimal] = None
    stock_quantity: int
    status: str
    featured: bool
    is_negotiable: bool = False
    unit: Optional[str] = "quantity"
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    category: Optional[CategoryResponse] = None
    images: List[ProductImageResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ProductDetail(ProductListItem):
    description: Optional[str] = None
    sku: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    discount_percentage: Optional[Decimal] = None
    stock_quantity: int = 0
    sku: Optional[str] = None
    status: str = "active"
    featured: bool = False
    is_negotiable: bool = False
    unit: Optional[str] = "quantity"
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[Decimal] = None
    compare_at_price: Optional[Decimal] = None
    discount_percentage: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    sku: Optional[str] = None
    status: Optional[str] = None
    featured: Optional[bool] = None
    is_negotiable: Optional[bool] = None
    unit: Optional[str] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None


class ProductSearchParams(BaseModel):
    q: Optional[str] = None
    category: Optional[str] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    featured: Optional[bool] = None
    page: int = 1
    limit: int = 20
