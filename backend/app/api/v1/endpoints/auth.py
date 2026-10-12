from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_refresh_token, get_current_user,
)
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, TokenResponse, RefreshTokenRequest, UserResponse, UserUpdate

router = APIRouter(prefix="/auth", tags=["Authentication"])


from sqlalchemy import or_, func


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        username=user_data.username,
        email=user_data.email,
        phone=user_data.phone,
        gender=user_data.gender,
        password_hash=hash_password(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    identifier = (credentials.username or credentials.email or "").strip()
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is required",
        )

    norm_id = identifier.lower()

    def find_user():
        # 1. Try finding by email
        u = db.query(User).filter(func.lower(User.email) == norm_id).first()
        if u:
            return u

        # 2. Try finding by username
        try:
            u = db.query(User).filter(func.lower(User.username) == norm_id).first()
            if u:
                return u
        except Exception:
            db.rollback()

        # 3. Check for Mama Nkechi alias
        if norm_id in ["mama nkechi", "mamankechi", "mamanckechi"]:
            try:
                u = db.query(User).filter(User.role == "admin").first()
                if not u:
                    from app.models.user import UserRole
                    u = db.query(User).filter(User.role == UserRole.admin).first()
                if u:
                    return u
            except Exception:
                db.rollback()

        # 4. Try matching full name
        try:
            u = db.query(User).filter(
                func.lower(func.concat(User.first_name, " ", User.last_name)) == norm_id
            ).first()
            if u:
                return u
        except Exception:
            db.rollback()

        return None

    try:
        user = find_user()
    except Exception as query_err:
        # Self-heal schema if missing column caused failure
        db.rollback()
        try:
            from app.core.init_db import init_db
            init_db()
            user = find_user()
        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query error during login: {str(query_err)}",
            )

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(body: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_refresh_token(body.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(body: UserUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if body.first_name:
        current_user.first_name = body.first_name
    if body.last_name:
        current_user.last_name = body.last_name
    if body.phone is not None:
        current_user.phone = body.phone
    db.commit()
    db.refresh(current_user)
    return current_user
