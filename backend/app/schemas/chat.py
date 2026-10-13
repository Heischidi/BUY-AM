from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DealAccepted(BaseModel):
    product_id: int
    product_name: str
    agreed_price: float
    original_price: float
    unit: Optional[str] = "quantity"
    image: Optional[str] = None


class ChatMessageRequest(BaseModel):
    message: str
    session_token: Optional[str] = None
    product_id: Optional[int] = None


class ChatMessageItem(BaseModel):
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    reply: str
    session_token: str
    products: Optional[List[dict]] = None
    deal: Optional[DealAccepted] = None
