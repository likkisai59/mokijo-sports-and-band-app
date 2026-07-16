import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional

from app.core.config import get_settings

settings = get_settings()
SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password (supporting plain text migration)."""
    if not hashed_password:
        return False
    # If it is not a bcrypt hash, verify as plain text for backward compatibility/migration
    if not (hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$")):
        return plain_password == hashed_password
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=1440)  # 24 hours
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
