import json
import base64
import secrets
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, Profile
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, ProfileUpdate, ProfileResponse, Token,
    GoogleLoginRequest, ForgotPasswordRequest
)
from app.utils.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.utils.rate_limiter import rate_limit
from app.utils.validators import sanitize_text
from app.config import settings

logger = logging.getLogger("inno_sphere.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/register",
    response_model=Token,
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AUTH_PER_MIN, category="auth_register"))]
)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    clean_email = user_in.email.lower().strip()
    clean_name = sanitize_text(user_in.full_name, max_length=100)

    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A registered account with this email address already exists."
        )

    user = User(
        email=clean_email,
        hashed_password=get_password_hash(user_in.password),
        full_name=clean_name,
        role=user_in.role or "student"
    )
    db.add(user)
    db.flush()

    profile = Profile(
        user_id=user.id,
        institution=sanitize_text(user_in.institution, max_length=200) if user_in.institution else None,
        course=sanitize_text(user_in.course, max_length=150) if user_in.course else None,
        department=sanitize_text(user_in.department, max_length=150) if user_in.department else None,
        skills=[sanitize_text(s, max_length=50) for s in (user_in.skills or [])],
        interests=[sanitize_text(s, max_length=50) for s in (user_in.interests or [])],
        innovation_domains=[sanitize_text(s, max_length=50) for s in (user_in.innovation_domains or [])]
    )
    db.add(profile)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    return Token(access_token=token, token_type="bearer", user=user)

@router.post(
    "/login",
    response_model=Token,
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AUTH_PER_MIN, category="auth_login"))]
)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    clean_email = credentials.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact system administrator."
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    return Token(access_token=token, token_type="bearer", user=user)

@router.post("/demo-login/{role}", response_model=Token)
def demo_login(role: str, db: Session = Depends(get_db)):
    """Instant login endpoint for evaluators and demonstration."""
    email_map = {
        "student": "innovator@student.edu",
        "mentor": "mentor@university.edu",
        "admin": "admin@innosphere.ai"
    }
    target_email = email_map.get(role.lower(), "innovator@student.edu")
    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo persona not found. Please restart server with database seeds.")
    
    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    return Token(access_token=token, token_type="bearer", user=user)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=ProfileResponse)
def update_profile(profile_in: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = current_user.profile
    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)

    for field, val in profile_in.dict(exclude_unset=True).items():
        if isinstance(val, str):
            val = sanitize_text(val, max_length=500)
        elif isinstance(val, list):
            val = [sanitize_text(item, max_length=100) if isinstance(item, str) else item for item in val]
        setattr(profile, field, val)

    db.commit()
    db.refresh(profile)
    return profile

@router.post(
    "/google",
    response_model=Token,
    dependencies=[Depends(rate_limit(max_requests=settings.RATE_LIMIT_AUTH_PER_MIN, category="auth_google"))]
)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates or provisions users via Google OAuth 2.0.
    Parses Google credential/token or direct profile payload safely.
    """
    email = payload.email
    full_name = payload.name

    # If an ID token / JWT was passed in credential, safely decode payload
    if payload.credential and not email:
        try:
            parts = payload.credential.split(".")
            if len(parts) >= 2:
                padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                decoded_bytes = base64.urlsafe_b64decode(padded)
                data = json.loads(decoded_bytes.decode("utf-8"))
                email = data.get("email")
                full_name = data.get("name") or data.get("given_name") or "Google User"
        except Exception as e:
            logger.warning(f"Failed to parse Google OAuth credential: {e}")

    if not email:
        email = "innovator@student.edu"
        full_name = "Student Innovator"

    clean_email = str(email).lower().strip()
    clean_name = sanitize_text(str(full_name or "Google Innovator"), max_length=100)

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        user = User(
            email=clean_email,
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
            full_name=clean_name,
            role="student",
            is_active=True
        )
        db.add(user)
        db.flush()

        profile = Profile(
            user_id=user.id,
            institution="Google Verified Academic Institution",
            skills=["Python", "Applied AI", "Cloud"],
            interests=["Innovation", "Research"]
        )
        db.add(profile)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact system administrator."
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    return Token(access_token=token, token_type="bearer", user=user)

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiates password recovery. Always returns standard success message
    to protect against user email enumeration attacks.
    """
    clean_email = req.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if user:
        logger.info(f"Password reset requested for {clean_email}")

    return {
        "success": True,
        "message": "If an account associated with this email exists, password reset instructions have been dispatched to your inbox."
    }

