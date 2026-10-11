from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User
from app.models.product import Product, ProductStatus
from app.models.order import Order
from app.models.procurement import ProcurementRequest
from app.schemas.procurement import ProcurementStatusUpdate

from pydantic import BaseModel
from sqlalchemy.orm import joinedload
from typing import Optional

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
def list_users(skip: int = 0, limit: int = 50, _=Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return [{"id": u.id, "email": u.email, "name": f"{u.first_name} {u.last_name}",
             "role": u.role, "is_active": u.is_active, "created_at": u.created_at} for u in users]


class ProductNegotiableUpdate(BaseModel):
    is_negotiable: bool


@router.get("/products")
def list_admin_products(
    skip: int = 0,
    limit: int = 100,
    _=Depends(require_admin),
    db: Session = Depends(get_db),
):
    products = (
        db.query(Product)
        .options(joinedload(Product.images), joinedload(Product.category))
        .order_by(Product.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "price": float(p.price),
            "stock_quantity": p.stock_quantity,
            "status": p.status.value if hasattr(p.status, "value") else str(p.status),
            "featured": p.featured,
            "is_negotiable": bool(p.is_negotiable),
            "category": {"id": p.category.id, "name": p.category.name} if p.category else None,
            "image": p.images[0].url if p.images else None,
            "created_at": p.created_at,
        }
        for p in products
    ]


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
    db.commit()
    db.refresh(product)
    return {
        "message": f"Price Am set to {body.is_negotiable}",
        "product_id": product.id,
        "is_negotiable": product.is_negotiable,
    }


@router.patch("/products/{product_id}/disable")
def disable_product(product_id: int, _=Depends(require_admin), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.status = ProductStatus.inactive
    db.commit()
    return {"message": "Product disabled"}


@router.get("/orders")
def list_all_orders(skip: int = 0, limit: int = 50, _=Depends(require_admin), db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    return [{"id": o.id, "order_number": o.order_number, "total": str(o.total),
             "status": o.status, "payment_status": o.payment_status, "created_at": o.created_at} for o in orders]


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
