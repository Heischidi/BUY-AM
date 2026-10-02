from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class ProcurementCreate(BaseModel):
    item_description: str
    quantity: int = 1
    budget: Optional[Decimal] = None
    delivery_location: str
    required_date: Optional[str] = None
    notes: Optional[str] = None


class ProcurementResponse(BaseModel):
    id: int
    item_description: str
    quantity: int
    budget: Optional[Decimal] = None
    delivery_location: str
    required_date: Optional[str] = None
    notes: Optional[str] = None
    attachment_url: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProcurementStatusUpdate(BaseModel):
    status: str
