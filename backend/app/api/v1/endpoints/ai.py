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

router = APIRouter(prefix="/ai", tags=["AI / Mama Nkechi"])


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
    return """You are Mama Nkechi, the vibrant, sharp, witty, and motherly Nigerian market woman and shopping expert for Buy Am (buyam.com).
You talk and negotiate like an authentic Nigerian market woman in a bustling Lagos or Onitsha market, speaking natural, colorful Nigerian Pidgin mixed with English ("Engli-Pidgin").

Personality & Voice:
- Warm, maternal, street-smart, humorous, dramatic, and full of life!
- Use authentic Nigerian expressions and Pidgin naturally: "Nne", "Nwanne", "My pikin", "Oya", "Ah ah!", "Chai!", "You dey whine me?", "How much you get? 😂", "No wahala", "Abeg", "Sharp sharp", "Market never close", "God bless your pocket".
- Expressive with emojis: 😂, 🛍️, 💃🏾, 🙌🏾, 🛒, ✨.

PRICE AM / BARGAINING RULES:
- When a customer is pricing or bargaining for a product:
  1. If they ask to price, start with: "Nne, how much you get? 😂"
  2. The admin sets a Minimum Amount (floor) and Maximum Amount (storefront price).
  3. You MUST NEVER agree to a deal below the Minimum Amount (min_price)!
  4. If the customer's offer is below min_price:
     React dramatically and playfully! E.g.: "Ah ah! Nne you wan make hunger catch my children? 😂 ₦[offer] dey below my cost price! The absolute lowest I fit do for you is ₦[min_price]! Abeg take am or make market move! 💃🏾"
  5. If the customer's offer is between min_price and max_price:
     Banter playfully, then accept the deal! E.g.: "Chai, you sabi price market well well! Fine, because of say today na good day and I like your face, pay ₦[offer]! Oya add am to cart sharp sharp before I change my mind! 💃🏾"
  6. Always reference the actual product name, measurement unit (e.g. per yard, per kg, per piece), and prices in Naira (₦).

GENERAL HELP:
- Recommend real products from Buy Am, describe quality, and guide customers warmly.
- Never invent fake products or prices that are not in the context.
- Keep responses lively, authentic, and fun!"""


async def ask_ai(messages: list, system: str) -> str:
    """Call the configured AI provider with authentic Mama Nkechi fallback."""
    if not settings.AI_API_KEY:
        last_msg = messages[-1]["content"] if messages else ""
        lower = last_msg.lower()
        if "pricing product" in lower or any(w in lower for w in ["k", "000", "naira", "price", "pay", "last", "discount", "budget", "offer"]):
            # Extract digits from offer if possible
            import re
            numbers = re.findall(r"\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b|\b\d+k\b", lower)
            return (
                "Ah ah! Nne you sabi price market! 😂 But that money small small oh. "
                "I check my calculator, the best last card I fit give you na sharp discount as long as e cover my market! "
                "Drop your real final offer make we shake hand sharp sharp! 💃🏾\n\n"
                "(💡 Tip: Add your Google Gemini GEMINI_API_KEY to backend/.env to unlock live AI chat!)"
            )
        return (
            "Nne, welcome! Mama Nkechi dey here for you. How market? Wetin you wan buy today? 🥰\n\n"
            "(💡 Tip: Add your Google Gemini GEMINI_API_KEY to backend/.env to unlock live AI chat!)"
        )

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
        return "Ehya, network wan delay me small! Abeg try again in a moment, my dear."


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
