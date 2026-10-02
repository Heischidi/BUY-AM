from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from decimal import Decimal
from datetime import datetime


class ShippingAddressSnapshot(BaseModel):
    full_name: str
    phone: Optional[str] = None
    address_line: str
    city: str
    state: str
    country: str = "Nigeria"
    postal_code: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    address_id: Optional[int] = None
    shipping_address: Optional[ShippingAddressSnapshot] = None


class OrderResponse(BaseModel):
    id: int
    order_number: str
    status: str
    subtotal: Decimal
    delivery_fee: Decimal
    total: Decimal
    payment_status: str
    payment_reference: Optional[str] = None
    shipping_address: Optional[Dict[str, Any]] = None
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderListItem(BaseModel):
    id: int
    order_number: str
    status: str
    total: Decimal
    payment_status: str
    item_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentInitResponse(BaseModel):
    authorization_url: str
    access_code: str
    reference: str
    order_id: int
    order_number: str
