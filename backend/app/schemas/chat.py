from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ChatMessageRequest(BaseModel):
    message: str
    session_token: Optional[str] = None


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
