from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, require_seller
from app.models.seller import Seller, SellerStatus
from app.models.address import Address
from app.schemas.seller import SellerCreate, SellerResponse, SellerUpdate, AddressCreate, AddressResponse
from typing import List

router = APIRouter(tags=["Sellers & Addresses"])

seller_router = APIRouter(prefix="/sellers")
address_router = APIRouter(prefix="/users/addresses")


# ─── SELLER ──────────────────────────────────────────────────────────────────

@seller_router.post("", response_model=SellerResponse, status_code=201)
def register_as_seller(
    body: SellerCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Seller profile already exists")

    seller = Seller(user_id=current_user.id, **body.model_dump())
    db.add(seller)

    # Upgrade role to seller
    current_user.role = "seller"
    db.commit()
    db.refresh(seller)
    return seller


@seller_router.get("/me", response_model=SellerResponse)
def get_my_seller_profile(current_user=Depends(require_seller), db: Session = Depends(get_db)):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="No seller profile found")
    return seller


@seller_router.patch("/me", response_model=SellerResponse)
def update_seller_profile(
    body: SellerUpdate,
    current_user=Depends(require_seller),
    db: Session = Depends(get_db),
):
    seller = db.query(Seller).filter(Seller.user_id == current_user.id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="No seller profile found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(seller, field, value)
    db.commit()
    db.refresh(seller)
    return seller


# ─── ADDRESSES ───────────────────────────────────────────────────────────────

@address_router.get("", response_model=List[AddressResponse])
def list_addresses(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Address).filter(Address.user_id == current_user.id).all()


@address_router.post("", response_model=AddressResponse, status_code=201)
def add_address(
    body: AddressCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.is_default:
        # Unset any existing default
        db.query(Address).filter(
            Address.user_id == current_user.id, Address.is_default == True
        ).update({"is_default": False})

    address = Address(user_id=current_user.id, **body.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@address_router.delete("/{address_id}", status_code=204)
def delete_address(
    address_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = db.query(Address).filter(
        Address.id == address_id, Address.user_id == current_user.id
    ).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(address)
    db.commit()
