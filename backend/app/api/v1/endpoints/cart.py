from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from decimal import Decimal
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.cart import Cart, CartItem, WishlistItem
from app.models.product import Product, ProductStatus
from app.schemas.cart import (
    CartResponse, CartItemResponse, CartItemAdd, CartItemUpdate,
    WishlistResponse, WishlistItemResponse,
)
from app.schemas.product import ProductListItem

router = APIRouter(tags=["Cart & Wishlist"])


def get_or_create_cart(user_id: int, db: Session) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def build_cart_response(cart: Cart) -> CartResponse:
    subtotal = Decimal("0")
    items = []
    for item in cart.items:
        total = item.unit_price * item.quantity
        subtotal += total
        items.append(CartItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            product=ProductListItem.model_validate(item.product) if item.product else None,
        ))
    return CartResponse(
        id=cart.id,
        items=items,
        subtotal=subtotal,
        item_count=sum(i.quantity for i in cart.items),
    )


# ─── CART ─────────────────────────────────────────────────

cart_router = APIRouter(prefix="/cart")


@cart_router.get("", response_model=CartResponse)
def get_cart(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(Cart).options(
        joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.images),
        joinedload(Cart.items).joinedload(CartItem.product).joinedload(Product.category),
    ).filter(Cart.user_id == current_user.id).first()

    if not cart:
        cart = get_or_create_cart(current_user.id, db)

    return build_cart_response(cart)


@cart_router.post("/items", response_model=CartResponse, status_code=201)
def add_to_cart(body: CartItemAdd, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(
        Product.id == body.product_id,
        Product.status == ProductStatus.active,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or unavailable")
    if product.stock_quantity < body.quantity:
        raise HTTPException(status_code=400, detail=f"Only {product.stock_quantity} items in stock")

    cart = get_or_create_cart(current_user.id, db)
    existing = db.query(CartItem).filter(
        CartItem.cart_id == cart.id, CartItem.product_id == body.product_id
    ).first()

    if existing:
        new_qty = existing.quantity + body.quantity
        if product.stock_quantity < new_qty:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        existing.quantity = new_qty
    else:
        item = CartItem(
            cart_id=cart.id,
            product_id=body.product_id,
            quantity=body.quantity,
            unit_price=product.price,
        )
        db.add(item)

    db.commit()
    return get_cart(current_user=current_user, db=db)


@cart_router.patch("/items/{item_id}", response_model=CartResponse)
def update_cart_item(
    item_id: int,
    body: CartItemUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart = get_or_create_cart(current_user.id, db)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if body.quantity <= 0:
        db.delete(item)
    else:
        if item.product.stock_quantity < body.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        item.quantity = body.quantity

    db.commit()
    return get_cart(current_user=current_user, db=db)


@cart_router.delete("/items/{item_id}", response_model=CartResponse)
def remove_cart_item(
    item_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart = get_or_create_cart(current_user.id, db)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(item)
    db.commit()
    return get_cart(current_user=current_user, db=db)


@cart_router.delete("", status_code=204)
def clear_cart(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if cart:
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        db.commit()


# ─── WISHLIST ─────────────────────────────────────────────

wishlist_router = APIRouter(prefix="/wishlist")


@wishlist_router.get("", response_model=WishlistResponse)
def get_wishlist(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(WishlistItem).options(
        joinedload(WishlistItem.product).joinedload(Product.images),
        joinedload(WishlistItem.product).joinedload(Product.category),
    ).filter(WishlistItem.user_id == current_user.id).all()

    return WishlistResponse(
        items=[
            WishlistItemResponse(
                id=i.id,
                product_id=i.product_id,
                product=ProductListItem.model_validate(i.product) if i.product else None,
                created_at=i.created_at,
            )
            for i in items
        ],
        total=len(items),
    )


@wishlist_router.post("/{product_id}", status_code=201)
def add_to_wishlist(product_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.query(WishlistItem).filter(
        WishlistItem.user_id == current_user.id,
        WishlistItem.product_id == product_id,
    ).first()
    if existing:
        return {"message": "Already in wishlist"}

    item = WishlistItem(user_id=current_user.id, product_id=product_id)
    db.add(item)
    db.commit()
    return {"message": "Added to wishlist"}


@wishlist_router.delete("/{product_id}", status_code=204)
def remove_from_wishlist(product_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(WishlistItem).filter(
        WishlistItem.user_id == current_user.id,
        WishlistItem.product_id == product_id,
    ).first()
    if item:
        db.delete(item)
        db.commit()
