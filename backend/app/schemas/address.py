from pydantic import BaseModel
from typing import Optional


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
