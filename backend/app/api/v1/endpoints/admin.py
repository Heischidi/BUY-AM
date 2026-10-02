from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_admin
from app.models.user import User
from app.models.seller import Seller, SellerStatus
from app.models.product import Product, ProductStatus
from app.models.order import Order
from app.models.procurement import ProcurementRequest
from app.schemas.procurement import ProcurementStatusUpdate

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
def list_users(skip: int = 0, limit: int = 50, _=Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return [{"id": u.id, "email": u.email, "name": f"{u.first_name} {u.last_name}",
             "role": u.role, "is_active": u.is_active, "created_at": u.created_at} for u in users]


@router.get("/sellers")
def list_sellers(status: str = None, _=Depends(require_admin), db: Session = Depends(get_db)):
    q = db.query(Seller)
    if status:
        q = q.filter(Seller.verification_status == status)
    sellers = q.all()
    return sellers


@router.patch("/sellers/{seller_id}/approve")
def approve_seller(seller_id: int, _=Depends(require_admin), db: Session = Depends(get_db)):
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    seller.verification_status = SellerStatus.approved
    db.commit()
    return {"message": "Seller approved"}


@router.patch("/sellers/{seller_id}/reject")
def reject_seller(seller_id: int, _=Depends(require_admin), db: Session = Depends(get_db)):
    seller = db.query(Seller).filter(Seller.id == seller_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    seller.verification_status = SellerStatus.rejected
    db.commit()
    return {"message": "Seller rejected"}


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
