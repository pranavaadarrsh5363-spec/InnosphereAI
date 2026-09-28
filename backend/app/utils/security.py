import hashlib
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, List, Callable
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

def get_password_hash(password: str) -> str:
    """Generate secure salted PBKDF2 hash (SHA-256 with 100,000 iterations)."""
    if not password:
        raise ValueError("Password cannot be empty.")
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Timing-safe password verification against stored hash."""
    try:
        if not plain_password or not hashed_password or "$" not in hashed_password:
            return False
        salt, key_hex = hashed_password.split("$", 1)
        new_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return secrets.compare_digest(new_key.hex(), key_hex)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # If no token provided: in development mode allow demo student fallback for ease of demonstration;
    # in production mode enforce strict auth.
    if not token:
        if settings.ENVIRONMENT != "production":
            demo_user = db.query(User).filter(User.email == "innovator@student.edu").first()
            if demo_user and demo_user.is_active:
                return demo_user
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_val = payload.get("sub")
        if user_id_val is None:
            raise credentials_exception
        user_id = int(user_id_val)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def get_optional_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    """Resolves authenticated user if valid token exists; returns None or demo student in dev mode."""
    if not token:
        if settings.ENVIRONMENT != "production":
            return db.query(User).filter(User.email == "innovator@student.edu").first()
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_val = payload.get("sub")
        if user_id_val is None:
            return None
        return db.query(User).filter(User.id == int(user_id_val), User.is_active == True).first()
    except Exception:
        return None

def require_role(allowed_roles: List[str]) -> Callable:
    """Dependency that enforces role-based access control (RBAC)."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of roles {allowed_roles}, but user has role '{current_user.role}'."
            )
        return current_user
    return role_checker

require_mentor_or_admin = require_role(["mentor", "admin"])
require_admin = require_role(["admin"])

# Backward-compatibility aliases
get_current_active_user = get_current_user
get_current_user_optional = get_optional_current_user

