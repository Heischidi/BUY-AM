from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, get_optional_user
from app.models.procurement import ProcurementRequest
from app.schemas.procurement import ProcurementCreate, ProcurementResponse

router = APIRouter(prefix="/procurement", tags=["Procurement"])


@router.post("/requests", response_model=ProcurementResponse, status_code=201)
def create_request(
    body: ProcurementCreate,
    current_user=Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    req = ProcurementRequest(
        user_id=current_user.id if current_user else None,
        **body.model_dump(),
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("/requests/my", response_model=list)
def my_requests(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(ProcurementRequest)
        .filter(ProcurementRequest.user_id == current_user.id)
        .order_by(ProcurementRequest.created_at.desc())
        .all()
    )
