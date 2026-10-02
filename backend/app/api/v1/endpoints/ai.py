import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_optional_user
from app.core.config import settings
from app.models.chat import ChatSession, ChatMessage, MessageRole
from app.models.product import Product, ProductStatus
from app.schemas.chat import ChatMessageRequest, ChatResponse
from app.schemas.product import ProductListItem
from sqlalchemy import or_
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/ai", tags=["AI / Amara"])


def get_or_create_session(token: Optional[str], user_id: Optional[int], db: Session) -> ChatSession:
    if token:
        session = db.query(ChatSession).filter(ChatSession.session_token == token).first()
        if session:
            return session

    new_token = str(uuid.uuid4())
    session = ChatSession(session_token=new_token, user_id=user_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def search_products_tool(query: str, db: Session, limit: int = 5):
    """Tool: search real product catalog for AI responses."""
    search = f"%{query}%"
    products = (
        db.query(Product)
        .options(joinedload(Product.images), joinedload(Product.category))
        .filter(
            Product.status == ProductStatus.active,
            or_(
                Product.name.ilike(search),
                Product.description.ilike(search),
            ),
        )
        .limit(limit)
        .all()
    )
    return products


def build_system_prompt() -> str:
    return """You are Amara, the friendly and helpful shopping assistant for Buy Am — Nigeria's lively marketplace.

Your personality:
- Warm, helpful, and knowledgeable about Nigerian shopping
- You speak naturally and conversationally
- You are honest: never invent products, prices, or availability
- When you find real products, mention their actual names and prices
- You help customers find products, understand categories, and navigate the marketplace
- You can assist with procurement questions (bulk orders, sourcing)
- You keep responses concise but friendly

Categories on Buy Am: Household, Furniture, Decor, Procurement, Printing, Signage, Electronics, Fashion, Beauty, Groceries, Office Supplies, Building Materials

If you search the catalog and find matching products, mention them specifically with prices.
If no products match, be honest and suggest browsing relevant categories.
Always respond in English."""


async def ask_ai(messages: list, system: str) -> str:
    """Call the configured AI provider."""
    if not settings.AI_API_KEY:
        return "I'm currently being set up. Please check back soon!"

    try:
        if settings.AI_PROVIDER == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=settings.AI_API_KEY)
            model = genai.GenerativeModel(
                model_name=settings.AI_MODEL,
                system_instruction=system,
            )
            history = []
            for msg in messages[:-1]:
                history.append({
                    "role": "user" if msg["role"] == "user" else "model",
                    "parts": [msg["content"]],
                })
            chat = model.start_chat(history=history)
            response = chat.send_message(messages[-1]["content"])
            return response.text
    except Exception as e:
        return f"I'm having a little trouble right now. Please try again in a moment."


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatMessageRequest,
    current_user=Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    session = get_or_create_session(
        body.session_token,
        current_user.id if current_user else None,
        db,
    )

    # Save user message
    user_msg = ChatMessage(
        session_id=session.id,
        role=MessageRole.user,
        content=body.message,
    )
    db.add(user_msg)
    db.commit()

    # Search catalog if message looks like a product query
    catalog_context = ""
    found_products = []
    query_lower = body.message.lower()
    is_product_query = any(kw in query_lower for kw in [
        "do you have", "find", "show", "search", "need", "looking for",
        "chair", "basket", "phone", "speaker", "shirt", "groceries",
        "₦", "naira", "price", "cost", "how much",
    ])

    if is_product_query:
        # Extract search term — use the whole message as fallback
        products = search_products_tool(body.message, db, limit=5)
        if products:
            found_products = [ProductListItem.model_validate(p).model_dump() for p in products]
            lines = [f"- {p.name} ({p.category.name if p.category else ''}): ₦{p.price:,.0f}" for p in products]
            catalog_context = "\n\nI found these real products on Buy Am:\n" + "\n".join(lines)

    # Load session history
    past = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at).limit(20).all()

    messages_for_ai = [
        {"role": m.role.value if hasattr(m.role, "value") else m.role, "content": m.content}
        for m in past
    ]

    if catalog_context:
        messages_for_ai[-1]["content"] += catalog_context

    system = build_system_prompt()
    reply = await ask_ai(messages_for_ai, system)

    # Save assistant response
    bot_msg = ChatMessage(
        session_id=session.id,
        role=MessageRole.assistant,
        content=reply,
    )
    db.add(bot_msg)
    db.commit()

    # Serialize found_products safely
    safe_products = []
    for p in found_products:
        # Convert Decimal to float for JSON
        p_safe = {k: float(v) if hasattr(v, '__float__') and not isinstance(v, (str, int, bool)) else v
                  for k, v in p.items()}
        safe_products.append(p_safe)

    return ChatResponse(
        reply=reply,
        session_token=session.session_token,
        products=safe_products if safe_products else None,
    )
