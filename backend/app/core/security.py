"""
Security utility functions including JWT verification and password hashing.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Union
import bcrypt
import jwt

from app.core.config import settings


def get_password_hash(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def create_access_token(
    subject: Union[str, Any],
    role: str,
    email: str,
    permissions: Union[list[str], None] = None,
    expires_delta: Union[timedelta, None] = None
) -> str:
    """Generate JWT access token with role and permission claims."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "email": email,
        "permissions": permissions or [],
        "iat": datetime.now(timezone.utc)
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.effective_secret_key, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any],
    expires_delta: Union[timedelta, None] = None
) -> str:
    """Generate JWT refresh token with unique JTI to prevent collision."""
    import uuid as _uuid
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.now(timezone.utc),
        "jti": _uuid.uuid4().hex,
        "type": "refresh"
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.effective_secret_key, algorithm=settings.ALGORITHM)
    return encoded_jwt



def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    Raises UnauthorizedException (mapped to 401) if invalid or expired,
    returning the standard AppException shape the frontend expects.
    """
    from app.core.exceptions import UnauthorizedException
    try:
        payload = jwt.decode(
            token,
            settings.effective_secret_key,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise UnauthorizedException("Token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise UnauthorizedException("Invalid or malformed token. Please log in again.")
