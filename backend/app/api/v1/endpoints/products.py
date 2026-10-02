from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import Optional, List
from decimal import Decimal
from app.core.database import get_db
from app.core.security import get_current_user, require_seller, require_admin
from app.models.product import Product, ProductImage, ProductStatus
from app.models.category import Category
from app.models.seller import Seller, SellerStatus
from app.schemas.product import (
    ProductListItem, ProductDetail, ProductCreate, ProductUpdate
)
import re

router = APIRouter(prefix="/products", tags=["Products"])


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


def product_query(db: Session):
    return db.query(Product).options(
        joinedload(Product.images),
        joinedload(Product.category),
        joinedload(Product.seller),
    )


@router.get("", response_model=dict)
def list_products(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    min_price: Optional[Decimal] = Query(None),
    max_price: Optional[Decimal] = Query(None),
    featured: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = product_query(db).filter(Product.status == ProductStatus.active)

    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                Product.name.ilike(search),
                Product.description.ilike(search),
            )
        )
    if category:
        query = query.join(Category).filter(
            or_(Category.slug.ilike(category), Category.name.ilike(category))
        )
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if featured is not None:
        query = query.filter(Product.featured == featured)

    total = query.count()
    products = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "items": [ProductListItem.model_validate(p) for p in products],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/search", response_model=dict)
def search_products(
    q: str = Query(..., min_length=1),
    category: Optional[str] = Query(None),
    min_price: Optional[Decimal] = Query(None),
    max_price: Optional[Decimal] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return list_products(q=q, category=category, min_price=min_price,
                         max_price=max_price, featured=None, page=page, limit=limit, db=db)


@router.get("/featured", response_model=List[ProductListItem])
def get_featured(limit: int = Query(12, ge=1, le=50), db: Session = Depends(get_db)):
    products = (
        product_query(db)
        .filter(Product.status == ProductStatus.active, Product.featured == True)
        .limit(limit)
        .all()
    )
    return [ProductListItem.model_validate(p) for p in products]


@router.get("/{slug}", response_model=ProductDetail)
def get_product(slug: str, db: Session = Depends(get_db)):
    product = product_query(db).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductDetail.model_validate(product)


@router.post("", response_model=ProductDetail, status_code=201)
def create_product(
    body: ProductCreate,
    current_user=Depends(require_seller),
    db: Session = Depends(get_db),
):
    seller = db.query(Seller).filter(
        Seller.user_id == current_user.id,
        Seller.verification_status == SellerStatus.approved,
    ).first()
    if not seller and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Seller profile not approved")

    image_url = body.image_url
    body_dict = body.model_dump(exclude={"image_url"})

    slug = make_unique_slug(db, body.name)
    product = Product(
        seller_id=seller.id if seller else 1,
        slug=slug,
        **body_dict,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    if image_url:
        img = ProductImage(product_id=product.id, url=image_url)
        db.add(img)
        db.commit()
    return ProductDetail.model_validate(product_query(db).filter(Product.id == product.id).first())


@router.patch("/{product_id}", response_model=ProductDetail)
def update_product(
    product_id: int,
    body: ProductUpdate,
    current_user=Depends(require_seller),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Ensure seller owns the product (unless admin)
    if current_user.role != "admin":
        seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
        if not seller or product.seller_id != seller.id:
            raise HTTPException(status_code=403, detail="Not your product")

    update_data = body.model_dump(exclude_unset=True)
    if "name" in update_data:
        update_data["slug"] = make_unique_slug(db, update_data["name"], exclude_id=product_id)

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return ProductDetail.model_validate(product_query(db).filter(Product.id == product_id).first())


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    current_user=Depends(require_seller),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if current_user.role != "admin":
        seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
        if not seller or product.seller_id != seller.id:
            raise HTTPException(status_code=403, detail="Not your product")

    db.delete(product)
    db.commit()
