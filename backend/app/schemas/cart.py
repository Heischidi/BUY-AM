from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from app.schemas.product import ProductListItem


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product: Optional[ProductListItem] = None

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: int
    items: List[CartItemResponse] = []
    subtotal: Decimal = Decimal("0")
    item_count: int = 0

    class Config:
        from_attributes = True


class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class WishlistItemResponse(BaseModel):
    id: int
    product_id: int
    product: Optional[ProductListItem] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WishlistResponse(BaseModel):
    items: List[WishlistItemResponse] = []
    total: int = 0
