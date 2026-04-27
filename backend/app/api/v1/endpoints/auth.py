from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import jwt
from passlib.context import CryptContext
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import TokenResponse
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(data: dict) -> str:
    from datetime import datetime
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({**data, "exp": expire}, settings.secret_key, algorithm=settings.algorithm)


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username, User.is_active == True).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        email=user.email,
        role=user.role,
        full_name=user.full_name,
    )


@router.post("/seed-admin")
def seed_admin(db: Session = Depends(get_db)):
    """Creates default admin user — run once during setup."""
    existing = db.query(User).filter(User.email == "admin@hrms.com").first()
    if existing:
        return {"message": "Admin already exists"}
    admin = User(
        email="admin@hrms.com",
        hashed_password=pwd_context.hash("Admin@123"),
        full_name="System Admin",
        role="admin",
    )
    db.add(admin)
    db.commit()
    return {"message": "Admin created", "email": "admin@hrms.com", "password": "Admin@123"}
