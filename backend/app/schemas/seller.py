from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SellerCreate(BaseModel):
    business_name: str
    description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class SellerResponse(BaseModel):
    id: int
    user_id: int
    business_name: str
    description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    verification_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SellerUpdate(BaseModel):
    business_name: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class AddressCreate(BaseModel):
    full_name: str
    phone: Optional[str] = None
    address_line: str
    city: str
    state: str
    country: str = "Nigeria"
    postal_code: Optional[str] = None
    is_default: bool = False


class AddressResponse(BaseModel):
    id: int
    full_name: str
    phone: Optional[str] = None
    address_line: str
    city: str
    state: str
    country: str
    postal_code: Optional[str] = None
    is_default: bool

    class Config:
        from_attributes = True
