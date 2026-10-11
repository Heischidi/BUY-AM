from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressResponse
from typing import List

# Keep seller_router as an empty placeholder so router.py import doesn't break,
# but all meaningful seller routes are removed.
seller_router = APIRouter(prefix="/sellers")
address_router = APIRouter(prefix="/users/addresses")


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
