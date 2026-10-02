import random
import string
import httpx
import hashlib
import hmac
import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from decimal import Decimal
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.cart import Cart, CartItem
from app.models.address import Address
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderResponse, OrderListItem, PaymentInitResponse

router = APIRouter(prefix="/orders", tags=["Orders"])
payment_router = APIRouter(prefix="/payments", tags=["Payments"])


def generate_order_number() -> str:
    prefix = "BAM"
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"{prefix}-{suffix}"


# ─── ORDERS ──────────────────────────────────────────────────────────────────

@router.get("", response_model=list)
def list_orders(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [
        OrderListItem(
            id=o.id,
            order_number=o.order_number,
            status=o.status,
            total=o.total,
            payment_status=o.payment_status,
            item_count=len(o.items),
            created_at=o.created_at,
        )
        for o in orders
    ]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse.model_validate(order)


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(body: OrderCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    # Get cart
    cart = (
        db.query(Cart)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
        .filter(Cart.user_id == current_user.id)
        .first()
    )
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Build shipping address snapshot
    if body.address_id:
        address = db.query(Address).filter(
            Address.id == body.address_id, Address.user_id == current_user.id
        ).first()
        if not address:
            raise HTTPException(status_code=404, detail="Address not found")
        shipping = {
            "full_name": address.full_name, "phone": address.phone,
            "address_line": address.address_line, "city": address.city,
            "state": address.state, "country": address.country,
            "postal_code": address.postal_code,
        }
    elif body.shipping_address:
        shipping = body.shipping_address.model_dump()
    else:
        raise HTTPException(status_code=400, detail="Shipping address required")

    # Calculate totals
    subtotal = Decimal("0")
    order_items = []
    for item in cart.items:
        if item.product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {item.product.name}",
            )
        item_subtotal = item.unit_price * item.quantity
        subtotal += item_subtotal
        order_items.append({
            "product_id": item.product_id,
            "seller_id": item.product.seller_id,
            "product_name": item.product.name,  # snapshot
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "subtotal": item_subtotal,
        })

    delivery_fee = Decimal("2500")  # flat rate
    total = subtotal + delivery_fee

    order = Order(
        user_id=current_user.id,
        order_number=generate_order_number(),
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
        shipping_address=shipping,
    )
    db.add(order)
    db.flush()

    for item_data in order_items:
        db.add(OrderItem(order_id=order.id, **item_data))
        # Reduce stock
        product = db.query(Product).filter(
            Product.id == item_data["product_id"]
        ).first()
        if product:
            product.stock_quantity -= item_data["quantity"]

    # Clear cart
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()

    db.commit()
    db.refresh(order)
    return OrderResponse.model_validate(
        db.query(Order).options(joinedload(Order.items)).filter(Order.id == order.id).first()
    )


# ─── PAYMENTS ────────────────────────────────────────────────────────────────

@payment_router.post("/initialize", response_model=PaymentInitResponse)
async def initialize_payment(
    order_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(
        Order.id == order_id, Order.user_id == current_user.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.payment_status == PaymentStatus.paid:
        raise HTTPException(status_code=400, detail="Order already paid")

    amount_kobo = int(order.total * 100)  # Paystack uses kobo

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.paystack.co/transaction/initialize",
            headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"},
            json={
                "email": current_user.email,
                "amount": amount_kobo,
                "reference": order.order_number,
                "metadata": {
                    "order_id": order.id,
                    "order_number": order.order_number,
                    "user_id": current_user.id,
                },
                "callback_url": f"{settings.FRONTEND_URL}/checkout/verify",
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Payment initialization failed")

    data = response.json()["data"]
    order.payment_reference = data["reference"]
    db.commit()

    return PaymentInitResponse(
        authorization_url=data["authorization_url"],
        access_code=data["access_code"],
        reference=data["reference"],
        order_id=order.id,
        order_number=order.order_number,
    )


@payment_router.get("/verify/{reference}")
async def verify_payment(
    reference: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(
        Order.payment_reference == reference,
        Order.user_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Could not verify payment")

    data = response.json()["data"]
    if data["status"] == "success":
        order.payment_status = PaymentStatus.paid
        order.status = OrderStatus.confirmed
        db.commit()
        return {"status": "paid", "order_number": order.order_number}

    return {"status": data["status"]}


@payment_router.post("/webhook")
async def paystack_webhook(request: Request, db: Session = Depends(get_db)):
    """Paystack sends a webhook on payment completion — NEVER trust frontend for this."""
    body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")

    # Verify webhook signature
    expected = hmac.new(
        settings.PAYSTACK_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha512,
    ).hexdigest()

    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    import json
    event = json.loads(body)

    if event.get("event") == "charge.success":
        data = event["data"]
        reference = data.get("reference")
        order = db.query(Order).filter(Order.payment_reference == reference).first()
        if order and order.payment_status != PaymentStatus.paid:
            order.payment_status = PaymentStatus.paid
            order.status = OrderStatus.confirmed
            db.commit()

    return {"status": "ok"}
