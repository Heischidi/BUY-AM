"""
Staff Management & Attendance Endpoints
- Admin: register staff, list staff, view attendance logs
- Staff: clock in / clock out using their email + PIN
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.security import require_admin
from app.models.staff import Staff, StaffAttendance, IdentityType, ClockStatus
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
import bcrypt

router = APIRouter(prefix="/staff", tags=["Staff"])


# ─── Helpers ──────────────────────────────────────────────────

def hash_pin(pin: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pin.encode("utf-8"), salt).decode("utf-8")


def verify_pin(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def staff_to_dict(s: Staff) -> dict:
    return {
        "id": s.id,
        "first_name": s.first_name,
        "last_name": s.last_name,
        "name": f"{s.first_name} {s.last_name}".strip(),
        "email": s.email,
        "phone": s.phone or "",
        "address": s.address or "",
        "date_of_birth": s.date_of_birth.isoformat() if s.date_of_birth else None,
        "identity_type": s.identity_type.value if s.identity_type else None,
        "identity_number": s.identity_number or "",
        "role": s.role,
        "is_active": s.is_active,
        "has_pin": bool(s.pin_hash),
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


def attendance_to_dict(a: StaffAttendance, include_staff_name: bool = False) -> dict:
    result = {
        "id": a.id,
        "staff_id": a.staff_id,
        "date": a.date.isoformat() if a.date else None,
        "clock_in": a.clock_in.isoformat() if a.clock_in else None,
        "clock_out": a.clock_out.isoformat() if a.clock_out else None,
        "status": a.status.value if a.status else None,
        "notes": a.notes,
        "hours_worked": None,
    }
    if a.clock_in and a.clock_out:
        delta = a.clock_out - a.clock_in
        result["hours_worked"] = round(delta.total_seconds() / 3600, 2)
    if include_staff_name and a.staff:
        result["staff_name"] = f"{a.staff.first_name} {a.staff.last_name}".strip()
        result["staff_email"] = a.staff.email
    return result


# ─── Schemas ──────────────────────────────────────────────────

class StaffCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None  # ISO date string YYYY-MM-DD
    identity_type: Optional[str] = None
    identity_number: Optional[str] = None
    pin: Optional[str] = None  # 4-digit PIN for clock-in


class StaffUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    identity_type: Optional[str] = None
    identity_number: Optional[str] = None
    pin: Optional[str] = None
    is_active: Optional[bool] = None


class ClockInRequest(BaseModel):
    email: str
    pin: str


class ClockOutRequest(BaseModel):
    email: str
    pin: str


# ─── Admin: Staff CRUD ─────────────────────────────────────────

@router.get("", tags=["Staff"])
@router.get("/", tags=["Staff"])
def list_staff(_=Depends(require_admin), db: Session = Depends(get_db)):
    """List all registered staff members (admin only)."""
    try:
        staff_list = db.query(Staff).order_by(Staff.created_at.desc()).all()
        return [staff_to_dict(s) for s in staff_list]
    except Exception as e:
        # Self-heal if staff table is not yet created in database
        try:
            from app.core.init_db import init_db
            init_db()
            staff_list = db.query(Staff).order_by(Staff.created_at.desc()).all()
            return [staff_to_dict(s) for s in staff_list]
        except Exception:
            return []


@router.post("", status_code=201, tags=["Staff"])
@router.post("/", status_code=201, tags=["Staff"])
def create_staff(body: StaffCreate, _=Depends(require_admin), db: Session = Depends(get_db)):
    """Register a new staff member (admin only)."""
    existing = db.query(Staff).filter(func.lower(Staff.email) == body.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="A staff member with this email already exists")

    dob = None
    if body.date_of_birth:
        try:
            dob = date.fromisoformat(body.date_of_birth)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format for date_of_birth, use YYYY-MM-DD")

    id_type = None
    if body.identity_type:
        try:
            id_type = IdentityType(body.identity_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid identity_type. Allowed: {[e.value for e in IdentityType]}"
            )

    staff = Staff(
        first_name=body.first_name.strip(),
        last_name=body.last_name.strip(),
        email=body.email.strip().lower(),
        phone=body.phone,
        address=body.address,
        date_of_birth=dob,
        identity_type=id_type,
        identity_number=body.identity_number,
        pin_hash=hash_pin(body.pin) if body.pin else None,
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return {"message": "Staff member registered successfully", "staff": staff_to_dict(staff)}


@router.get("/{staff_id}", tags=["Staff"])
def get_staff(staff_id: int, _=Depends(require_admin), db: Session = Depends(get_db)):
    """Get a specific staff member (admin only)."""
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff_to_dict(staff)


@router.patch("/{staff_id}", tags=["Staff"])
def update_staff(staff_id: int, body: StaffUpdate, _=Depends(require_admin), db: Session = Depends(get_db)):
    """Update a staff member's details (admin only)."""
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    update_data = body.model_dump(exclude_unset=True)

    if "first_name" in update_data and update_data["first_name"]:
        staff.first_name = update_data["first_name"].strip()
    if "last_name" in update_data and update_data["last_name"]:
        staff.last_name = update_data["last_name"].strip()
    if "phone" in update_data:
        staff.phone = update_data["phone"]
    if "address" in update_data:
        staff.address = update_data["address"]
    if "identity_number" in update_data:
        staff.identity_number = update_data["identity_number"]
    if "is_active" in update_data:
        staff.is_active = update_data["is_active"]
    if "date_of_birth" in update_data and update_data["date_of_birth"]:
        try:
            staff.date_of_birth = date.fromisoformat(update_data["date_of_birth"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_of_birth format")
    if "identity_type" in update_data and update_data["identity_type"]:
        try:
            staff.identity_type = IdentityType(update_data["identity_type"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid identity_type")
    if "pin" in update_data and update_data["pin"]:
        staff.pin_hash = hash_pin(update_data["pin"])

    db.commit()
    db.refresh(staff)
    return {"message": "Staff updated successfully", "staff": staff_to_dict(staff)}


@router.delete("/{staff_id}", tags=["Staff"])
def delete_staff(staff_id: int, _=Depends(require_admin), db: Session = Depends(get_db)):
    """Remove a staff member (admin only)."""
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    db.delete(staff)
    db.commit()
    return {"message": "Staff member removed"}


# ─── Admin: Attendance Logs ─────────────────────────────────────

@router.get("/attendance/all", tags=["Staff"])
def list_all_attendance(
    staff_id: Optional[int] = None,
    date_filter: Optional[str] = None,
    _=Depends(require_admin),
    db: Session = Depends(get_db),
):
    """View all attendance records (admin only)."""
    from sqlalchemy.orm import joinedload
    q = db.query(StaffAttendance).options(joinedload(StaffAttendance.staff))
    if staff_id:
        q = q.filter(StaffAttendance.staff_id == staff_id)
    if date_filter:
        try:
            d = date.fromisoformat(date_filter)
            q = q.filter(StaffAttendance.date == d)
        except ValueError:
            pass
    records = q.order_by(StaffAttendance.date.desc(), StaffAttendance.clock_in.desc()).all()
    return [attendance_to_dict(r, include_staff_name=True) for r in records]


@router.get("/{staff_id}/attendance", tags=["Staff"])
def get_staff_attendance(staff_id: int, _=Depends(require_admin), db: Session = Depends(get_db)):
    """Get attendance records for a specific staff member (admin only)."""
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    records = (
        db.query(StaffAttendance)
        .filter(StaffAttendance.staff_id == staff_id)
        .order_by(StaffAttendance.date.desc(), StaffAttendance.clock_in.desc())
        .all()
    )
    return {
        "staff": staff_to_dict(staff),
        "attendance": [attendance_to_dict(r) for r in records],
    }


# ─── Staff: Clock In / Clock Out (Public - No Admin Token Required) ────

class StaffLookup(BaseModel):
    email: str
    pin: str


@router.post("/clock-in", tags=["Staff Attendance"])
def clock_in(body: ClockInRequest, db: Session = Depends(get_db)):
    """Staff clock-in. Uses email + PIN (no admin auth required)."""
    staff = db.query(Staff).filter(func.lower(Staff.email) == body.email.lower().strip()).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    if not staff.is_active:
        raise HTTPException(status_code=403, detail="Staff account is deactivated")
    if not staff.pin_hash or not verify_pin(body.pin, staff.pin_hash):
        raise HTTPException(status_code=401, detail="Invalid PIN")

    today = date.today()
    # Check if already clocked in today without clocking out
    existing = (
        db.query(StaffAttendance)
        .filter(
            StaffAttendance.staff_id == staff.id,
            StaffAttendance.date == today,
            StaffAttendance.status == ClockStatus.clocked_in,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"You are already clocked in since {existing.clock_in.strftime('%I:%M %p') if existing.clock_in else 'earlier today'}. Please clock out first."
        )

    record = StaffAttendance(
        staff_id=staff.id,
        date=today,
        clock_in=datetime.utcnow(),
        status=ClockStatus.clocked_in,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "message": f"✅ Clock-in successful! Welcome, {staff.first_name}.",
        "staff_name": f"{staff.first_name} {staff.last_name}".strip(),
        "clock_in": record.clock_in.isoformat(),
        "attendance_id": record.id,
    }


@router.post("/clock-out", tags=["Staff Attendance"])
def clock_out(body: ClockOutRequest, db: Session = Depends(get_db)):
    """Staff clock-out. Uses email + PIN (no admin auth required)."""
    staff = db.query(Staff).filter(func.lower(Staff.email) == body.email.lower().strip()).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    if not staff.is_active:
        raise HTTPException(status_code=403, detail="Staff account is deactivated")
    if not staff.pin_hash or not verify_pin(body.pin, staff.pin_hash):
        raise HTTPException(status_code=401, detail="Invalid PIN")

    today = date.today()
    record = (
        db.query(StaffAttendance)
        .filter(
            StaffAttendance.staff_id == staff.id,
            StaffAttendance.date == today,
            StaffAttendance.status == ClockStatus.clocked_in,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=400, detail="You are not currently clocked in today.")

    now = datetime.utcnow()
    record.clock_out = now
    record.status = ClockStatus.clocked_out
    db.commit()
    db.refresh(record)

    delta = now - record.clock_in
    hours = round(delta.total_seconds() / 3600, 2)
    hours_display = f"{int(hours)}h {int((hours % 1) * 60)}m"

    return {
        "message": f"👋 Clock-out successful! See you tomorrow, {staff.first_name}.",
        "staff_name": f"{staff.first_name} {staff.last_name}".strip(),
        "clock_in": record.clock_in.isoformat(),
        "clock_out": record.clock_out.isoformat(),
        "hours_worked": hours,
        "hours_display": hours_display,
    }


@router.get("/status/{email}", tags=["Staff Attendance"])
def check_clock_status(email: str, db: Session = Depends(get_db)):
    """Check if a staff member is currently clocked in today (public)."""
    staff = db.query(Staff).filter(func.lower(Staff.email) == email.lower().strip()).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    if not staff.is_active:
        raise HTTPException(status_code=403, detail="Staff account is deactivated")

    today = date.today()
    record = (
        db.query(StaffAttendance)
        .filter(
            StaffAttendance.staff_id == staff.id,
            StaffAttendance.date == today,
        )
        .order_by(StaffAttendance.clock_in.desc())
        .first()
    )

    return {
        "staff_id": staff.id,
        "staff_name": f"{staff.first_name} {staff.last_name}".strip(),
        "is_clocked_in": record is not None and record.status == ClockStatus.clocked_in,
        "clock_in": record.clock_in.isoformat() if record and record.clock_in else None,
        "clock_out": record.clock_out.isoformat() if record and record.clock_out else None,
        "today": today.isoformat(),
    }


@router.get("/list/public", tags=["Staff Attendance"])
def list_staff_public(db: Session = Depends(get_db)):
    """Get list of active staff for clock-in page dropdown (name + email only)."""
    staff_list = db.query(Staff).filter(Staff.is_active == True).order_by(Staff.first_name).all()
    return [
        {
            "id": s.id,
            "name": f"{s.first_name} {s.last_name}".strip(),
            "email": s.email,
        }
        for s in staff_list
    ]
