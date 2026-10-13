from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User
from app.models.product import Product, ProductImage, ProductStatus
from app.models.category import Category
from app.models.order import Order, OrderItem
from app.models.procurement import ProcurementRequest
from app.schemas.procurement import ProcurementStatusUpdate

import re
import logging
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text


def make_unique_slug(db: Session, name: str, exclude_id: int = None) -> str:
    base = slugify(name)
    slug = base
    counter = 1
    while True:
        query = db.query(Product).filter(Product.slug == slug)
        if exclude_id:
            query = query.filter(Product.id != exclude_id)
        if not query.first():
            return slug
        slug = f"{base}-{counter}"
        counter += 1


# ─── Schemas ──────────────────────────────────────────────────

class ProductNegotiableUpdate(BaseModel):
    is_negotiable: bool
    min_price: Optional[float] = None
    max_price: Optional[float] = None


class ProductDiscountUpdate(BaseModel):
    discount_percentage: Optional[float] = None  # None or 0 removes discount; e.g. 10.0 = 10% off


class AdminProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: float
    stock_quantity: int = 0
    unit: str = "quantity"
    is_negotiable: bool = False
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    image_url: Optional[str] = None
    featured: bool = False
    discount_percentage: Optional[float] = None


class AdminProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    unit: Optional[str] = None
    is_negotiable: Optional[bool] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    image_url: Optional[str] = None
    status: Optional[str] = None
    featured: Optional[bool] = None
    discount_percentage: Optional[float] = None


# ─── Products Endpoints ────────────────────────────────────────

@router.get("/products")
def list_admin_products(
    skip: int = 0,
    limit: int = 150,
    _=Depends(require_admin),
    db: Session = Depends(get_db),
):
    def fetch_and_serialize():
        products = (
            db.query(Product)
            .options(joinedload(Product.images), joinedload(Product.category))
            .order_by(Product.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        serialized = []
        for p in products:
            price_val = float(p.price) if p.price is not None else 0.0
            disc_pct = float(p.discount_percentage) if p.discount_percentage is not None else None
            disc_price = round(price_val * (1.0 - (disc_pct / 100.0)), 2) if (disc_pct is not None and price_val > 0) else None
            created_at_str = p.created_at.isoformat() if hasattr(p.created_at, "isoformat") else str(p.created_at) if p.created_at else None

            serialized.append({
                "id": p.id,
                "name": p.name or "",
                "slug": p.slug or "",
                "price": price_val,
                "stock_quantity": p.stock_quantity or 0,
                "unit": p.unit or "quantity",
                "status": p.status.value if hasattr(p.status, "value") else str(p.status or "active"),
                "featured": bool(p.featured),
                "is_negotiable": bool(p.is_negotiable),
                "min_price": float(p.min_price) if p.min_price is not None else None,
                "max_price": float(p.max_price) if p.max_price is not None else None,
                "discount_percentage": disc_pct,
                "discounted_price": disc_price,
                "category": {"id": p.category.id, "name": p.category.name} if p.category else None,
                "image": p.images[0].url if (p.images and len(p.images) > 0) else None,
                "description": p.description or "",
                "created_at": created_at_str,
            })
        return serialized

    try:
        return fetch_and_serialize()
    except Exception as e:
        logger.warning(f"[Admin Products Warning]: Query failed with error: {e}. Attempting self-healing init_db()...")
        try:
            from app.core.init_db import init_db
            init_db()
            db.rollback()
            return fetch_and_serialize()
        except Exception as retry_err:
            logger.error(f"[Admin Products Error]: Retry failed: {retry_err}", exc_info=True)
            return []


@router.post("/products", status_code=201)
def create_admin_product(
    body: AdminProductCreate,
    _=Depends(require_admin),
    db: Session = Depends(get_db),
):
    # Whatever is set as maximum is what should be displayed as price on the main page
    effective_price = body.price
    if body.is_negotiable and body.max_price:
        effective_price = body.max_price

    slug = make_unique_slug(db, body.name)
    discount = body.discount_percentage if body.discount_percentage and body.discount_percentage > 0 else None
    product = Product(
        name=body.name,
        slug=slug,
        description=body.description,
        category_id=body.category_id,
        price=effective_price,
        stock_quantity=body.stock_quantity,
        unit=body.unit or "quantity",
        is_negotiable=body.is_negotiable,
        min_price=body.min_price if body.is_negotiable else None,
        max_price=body.max_price if body.is_negotiable else None,
        featured=body.featured,
        status=ProductStatus.active,
        discount_percentage=discount,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    if body.image_url:
        img = ProductImage(product_id=product.id, url=body.image_url, alt_text=body.name, sort_order=0)
        db.add(img)
        db.commit()

    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "price": float(product.price),
        "stock_quantity": product.stock_quantity,
        "unit": product.unit,
        "is_negotiable": product.is_negotiable,
        "min_price": float(product.min_price) if product.min_price else None,
        "max_price": float(product.max_price) if product.max_price else None,
        "discount_percentage": float(product.discount_percentage) if product.discount_percentage else None,
        "message": "Product created successfully",
    }


@router.patch("/products/{product_id}")
def update_admin_product(
    product_id: int,
    body: AdminProductUpdate,
    _=Depends(require_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_dict = body.model_dump(exclude_unset=True)

    if "name" in update_dict and update_dict["name"]:
        product.name = update_dict["name"]
        product.slug = make_unique_slug(db, update_dict["name"], exclude_id=product_id)

    if "description" in update_dict:
        product.description = update_dict["description"]
    if "category_id" in update_dict:
        product.category_id = update_dict["category_id"]
    if "stock_quantity" in update_dict:
        product.stock_quantity = update_dict["stock_quantity"]
    if "unit" in update_dict and update_dict["unit"]:
        product.unit = update_dict["unit"]
    if "featured" in update_dict:
        product.featured = update_dict["featured"]
    if "status" in update_dict:
        product.status = update_dict["status"]

    if "is_negotiable" in update_dict:
        product.is_negotiable = update_dict["is_negotiable"]
    if "min_price" in update_dict:
        product.min_price = update_dict["min_price"]
    if "max_price" in update_dict:
        product.max_price = update_dict["max_price"]

    # If Price Am is enabled and max_price is given, set displayed price = max_price
    if product.is_negotiable and product.max_price:
        product.price = product.max_price
    elif "price" in update_dict and update_dict["price"] is not None:
        product.price = update_dict["price"]

    if "image_url" in update_dict and update_dict["image_url"]:
        img = db.query(ProductImage).filter(ProductImage.product_id == product.id).first()
        if img:
            img.url = update_dict["image_url"]
        else:
            db.add(ProductImage(product_id=product.id, url=update_dict["image_url"], alt_text=product.name))

    if "discount_percentage" in update_dict:
        disc = update_dict["discount_percentage"]
        product.discount_percentage = disc if disc and disc > 0 else None

    db.commit()
    db.refresh(product)
    return {
        "id": product.id,
        "name": product.name,
        "price": float(product.price),
        "stock_quantity": product.stock_quantity,
        "unit": product.unit,
        "is_negotiable": product.is_negotiable,
        "min_price": float(product.min_price) if product.min_price else None,
        "max_price": float(product.max_price) if product.max_price else None,
        "discount_percentage": float(product.discount_percentage) if product.discount_percentage else None,
        "message": "Product updated successfully",
    }


@router.delete("/products/{product_id}")
def delete_admin_product(
    product_id: int,
    _=Depends(require_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}


@router.patch("/products/{product_id}/negotiable")
def toggle_product_negotiable(
    product_id: int,
    body: ProductNegotiableUpdate,
    _=Depends(require_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_negotiable = body.is_negotiable
    if body.min_price is not None:
        product.min_price = body.min_price
    if body.max_price is not None:
        product.max_price = body.max_price

    # Ensure price reflects max_price when negotiable
    if product.is_negotiable and product.max_price:
        product.price = product.max_price

    db.commit()
    db.refresh(product)
    return {
        "message": f"Price Am set to {body.is_negotiable}",
        "product_id": product.id,
        "price": float(product.price),
        "is_negotiable": product.is_negotiable,
        "min_price": float(product.min_price) if product.min_price else None,
        "max_price": float(product.max_price) if product.max_price else None,
    }


@router.patch("/products/{product_id}/discount")
def set_product_discount(
    product_id: int,
    body: ProductDiscountUpdate,
    _=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Set or clear a discount percentage on a product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    disc = body.discount_percentage
    if disc is not None and disc < 0:
        raise HTTPException(status_code=400, detail="Discount percentage cannot be negative")
    if disc is not None and disc > 100:
        raise HTTPException(status_code=400, detail="Discount percentage cannot exceed 100%")

    product.discount_percentage = disc if disc and disc > 0 else None
    db.commit()
    db.refresh(product)

    base_price = float(product.price)
    discounted = round(base_price * (1 - float(disc) / 100), 2) if disc else None

    return {
        "message": f"Discount {'set to ' + str(disc) + '%' if disc else 'removed'} for '{product.name}'",
        "product_id": product.id,
        "price": base_price,
        "discount_percentage": float(product.discount_percentage) if product.discount_percentage else None,
        "discounted_price": discounted,
    }


# ─── Customers Endpoints ──────────────────────────────────────

@router.get("/customers")
def list_customers(
    skip: int = 0,
    limit: int = 100,
    _=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    Returns registered customers with their detail:
    name, email, phone number, gender, and goods bought.
    """
    users = (
        db.query(User)
        .filter(User.role == "customer")
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for u in users:
        # Load customer's orders and goods bought
        orders = (
            db.query(Order)
            .options(joinedload(Order.items).joinedload(OrderItem.product))
            .filter(Order.user_id == u.id)
            .order_by(Order.created_at.desc())
            .all()
        )

        total_spent = sum(float(o.total) for o in orders if o.payment_status == "paid")
        goods_bought = []
        for o in orders:
            for item in o.items:
                unit = item.product.unit if item.product and item.product.unit else "quantity"
                goods_bought.append({
                    "order_id": o.id,
                    "order_number": o.order_number,
                    "order_status": o.status.value if hasattr(o.status, "value") else str(o.status),
                    "product_id": item.product_id,
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "unit": unit,
                    "unit_price": float(item.unit_price),
                    "subtotal": float(item.subtotal),
                    "date": o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else None,
                })

        result.append({
            "id": u.id,
            "name": f"{u.first_name} {u.last_name}".strip(),
            "first_name": u.first_name,
            "last_name": u.last_name,
            "email": u.email,
            "phone": u.phone or "Not provided",
            "gender": u.gender or "Not specified",
            "is_active": u.is_active,
            "created_at": u.created_at.strftime("%Y-%m-%d") if u.created_at else None,
            "orders_count": len(orders),
            "total_spent": total_spent,
            "goods_bought": goods_bought,
        })

    return result


@router.get("/users")
def list_users(skip: int = 0, limit: int = 50, _=Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return [{
        "id": u.id,
        "email": u.email,
        "name": f"{u.first_name} {u.last_name}",
        "phone": u.phone,
        "gender": u.gender,
        "role": u.role,
        "is_active": u.is_active,
        "created_at": u.created_at,
    } for u in users]


# ─── Analysis & Statistics Endpoints ──────────────────────────

@router.get("/analytics")
def get_analytics(
    timeframe: str = Query("month", regex="^(week|month|year|all)$"),
    _=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """
    System-wide statistics:
    - food/goods sold this month, this year, weekly
    - bar chart & pie chart data
    - most sold goods
    """
    now = datetime.utcnow()

    # Time boundaries
    one_week_ago = now - timedelta(days=7)
    one_month_ago = now - timedelta(days=30)
    one_year_ago = now - timedelta(days=365)

    all_orders = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.category)
    ).filter(Order.payment_status == "paid").all()

    total_revenue = sum(float(o.total) for o in all_orders)
    total_orders = len(all_orders)
    total_customers = db.query(User).filter(User.role == "customer").count()

    # Total goods sold and food sold metrics
    total_goods_sold = 0
    food_stats = {
        "week": {"units": 0, "revenue": 0.0, "orders": 0, "label": "This Week"},
        "month": {"units": 0, "revenue": 0.0, "orders": 0, "label": "This Month"},
        "year": {"units": 0, "revenue": 0.0, "orders": 0, "label": "This Year"},
        "all": {"units": 0, "revenue": 0.0, "orders": 0, "label": "All Time"},
    }

    category_sales = {}
    unit_sales = {}
    product_sales = {}

    for o in all_orders:
        o_date = o.created_at or now
        is_week = o_date >= one_week_ago
        is_month = o_date >= one_month_ago
        is_year = o_date >= one_year_ago

        for item in o.items:
            qty = item.quantity
            sub = float(item.subtotal)
            total_goods_sold += qty

            prod = item.product
            cat_name = prod.category.name if prod and prod.category else "Other"
            p_unit = prod.unit if prod and prod.unit else "quantity"

            # Check if this item is food/groceries
            is_food = (
                cat_name.lower() in ["groceries", "food"]
                or any(w in item.product_name.lower() for w in ["fish", "catfish", "beef", "meat", "pantry", "starter box", "rice", "food"])
            )

            if is_food:
                food_stats["all"]["units"] += qty
                food_stats["all"]["revenue"] += sub
                if is_year:
                    food_stats["year"]["units"] += qty
                    food_stats["year"]["revenue"] += sub
                if is_month:
                    food_stats["month"]["units"] += qty
                    food_stats["month"]["revenue"] += sub
                if is_week:
                    food_stats["week"]["units"] += qty
                    food_stats["week"]["revenue"] += sub

            # Category aggregation
            if cat_name not in category_sales:
                category_sales[cat_name] = {"units": 0, "revenue": 0.0}
            category_sales[cat_name]["units"] += qty
            category_sales[cat_name]["revenue"] += sub

            # Measurement Unit aggregation (yards vs kg vs quantity)
            u_key = p_unit.lower()
            if u_key not in unit_sales:
                unit_sales[u_key] = {"units": 0, "revenue": 0.0}
            unit_sales[u_key]["units"] += qty
            unit_sales[u_key]["revenue"] += sub

            # Product aggregation for "Most Sold Goods"
            pid = item.product_id or item.product_name
            if pid not in product_sales:
                img_url = prod.images[0].url if prod and prod.images else None
                stock = prod.stock_quantity if prod else 0
                product_sales[pid] = {
                    "id": item.product_id,
                    "name": item.product_name,
                    "category": cat_name,
                    "unit": p_unit,
                    "units_sold": 0,
                    "revenue": 0.0,
                    "image": img_url,
                    "stock_remaining": stock,
                }
            product_sales[pid]["units_sold"] += qty
            product_sales[pid]["revenue"] += sub

    # Most sold goods ranking
    most_sold = sorted(product_sales.values(), key=lambda x: x["units_sold"], reverse=True)[:8]

    # Category distribution for Pie Chart
    cat_total_units = sum(c["units"] for c in category_sales.values()) or 1
    category_chart_data = [
        {
            "name": cat,
            "units": data["units"],
            "revenue": data["revenue"],
            "percentage": round((data["units"] / cat_total_units) * 100, 1),
        }
        for cat, data in sorted(category_sales.items(), key=lambda x: x[1]["units"], reverse=True)
    ]

    # Unit distribution (e.g. yard, kg, quantity)
    unit_total_items = sum(u["units"] for u in unit_sales.values()) or 1
    unit_chart_data = [
        {
            "unit": u,
            "units": data["units"],
            "revenue": data["revenue"],
            "percentage": round((data["units"] / unit_total_items) * 100, 1),
        }
        for u, data in sorted(unit_sales.items(), key=lambda x: x[1]["units"], reverse=True)
    ]

    # Bar Chart data points based on selected timeframe
    sales_over_time = []
    if timeframe == "week":
        # 7 days breakdown
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        day_buckets = {i: {"revenue": 0.0, "units": 0, "orders": 0} for i in range(7)}
        for o in all_orders:
            o_date = o.created_at or now
            if o_date >= one_week_ago:
                d_idx = o_date.weekday()
                day_buckets[d_idx]["revenue"] += float(o.total)
                day_buckets[d_idx]["orders"] += 1
                for itm in o.items:
                    day_buckets[d_idx]["units"] += itm.quantity
        for idx in range(7):
            sales_over_time.append({
                "label": day_names[idx],
                "revenue": round(day_buckets[idx]["revenue"], 2),
                "units": day_buckets[idx]["units"],
                "orders": day_buckets[idx]["orders"],
            })

    elif timeframe == "year":
        # 12 months breakdown
        month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        m_buckets = {i: {"revenue": 0.0, "units": 0, "orders": 0} for i in range(1, 13)}
        for o in all_orders:
            o_date = o.created_at or now
            if o_date >= one_year_ago:
                m_buckets[o_date.month]["revenue"] += float(o.total)
                m_buckets[o_date.month]["orders"] += 1
                for itm in o.items:
                    m_buckets[o_date.month]["units"] += itm.quantity
        for m in range(1, 13):
            sales_over_time.append({
                "label": month_names[m - 1],
                "revenue": round(m_buckets[m]["revenue"], 2),
                "units": m_buckets[m]["units"],
                "orders": m_buckets[m]["orders"],
            })

    else:
        # Default / Month: 4 weeks breakdown
        week_buckets = {1: {"revenue": 0.0, "units": 0, "orders": 0},
                        2: {"revenue": 0.0, "units": 0, "orders": 0},
                        3: {"revenue": 0.0, "units": 0, "orders": 0},
                        4: {"revenue": 0.0, "units": 0, "orders": 0}}
        for o in all_orders:
            o_date = o.created_at or now
            if o_date >= one_month_ago:
                days_diff = (now - o_date).days
                w_idx = min(4, max(1, 4 - (days_diff // 7)))
                week_buckets[w_idx]["revenue"] += float(o.total)
                week_buckets[w_idx]["orders"] += 1
                for itm in o.items:
                    week_buckets[w_idx]["units"] += itm.quantity
        for w in range(1, 5):
            sales_over_time.append({
                "label": f"Week {w}",
                "revenue": round(week_buckets[w]["revenue"], 2),
                "units": week_buckets[w]["units"],
                "orders": week_buckets[w]["orders"],
            })

    return {
        "summary": {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "total_goods_sold": total_goods_sold,
            "total_customers": total_customers,
        },
        "food_sold": food_stats,
        "sales_over_time": sales_over_time,
        "category_distribution": category_chart_data,
        "unit_distribution": unit_chart_data,
        "most_sold_goods": most_sold,
        "timeframe": timeframe,
    }


# ─── Orders Endpoints ─────────────────────────────────────────

@router.get("/orders")
def list_all_orders(skip: int = 0, limit: int = 50, _=Depends(require_admin), db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": o.id,
            "order_number": o.order_number,
            "total": str(o.total),
            "status": o.status.value if hasattr(o.status, "value") else str(o.status),
            "payment_status": o.payment_status.value if hasattr(o.payment_status, "value") else str(o.payment_status),
            "created_at": o.created_at,
        }
        for o in orders
    ]


@router.get("/procurement")
def list_procurement(status: str = None, _=Depends(require_admin), db: Session = Depends(get_db)):
    q = db.query(ProcurementRequest)
    if status:
        q = q.filter(ProcurementRequest.status == status)
    return q.order_by(ProcurementRequest.created_at.desc()).all()


@router.patch("/procurement/{request_id}/status")
def update_procurement_status(
    request_id: int,
    body: ProcurementStatusUpdate,
    _=Depends(require_admin),
    db: Session = Depends(get_db),
):
    req = db.query(ProcurementRequest).filter(ProcurementRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = body.status
    db.commit()
    return {"message": f"Status updated to {body.status}"}
