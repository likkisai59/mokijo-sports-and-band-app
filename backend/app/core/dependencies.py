"""
FastAPI dependency injection utilities.
Includes database session dependency, current user resolution, and role guards.
"""

from typing import Dict, Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db as database_get_db
from app.core.security import decode_token
from app.features.auth.crud import UserCRUD

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=True
)

def get_db() -> Generator[Session, None, None]:
    """Expose database session dependency."""
    yield from database_get_db()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Dict:
    """
    Dependency to validate the JWT token in Authorization header,
    verifies user existence in DB, and returns the parsed claims payload.
    """
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is invalid."
        )
    
    # Verify user exists in database
    user_crud = UserCRUD()
    user = user_crud.get(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or deleted."
        )
        
    return payload

def get_current_client(user: Dict = Depends(get_current_user)) -> Dict:
    """Role guard for Client role."""
    if user.get("role") != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client access required"
        )
    return user

def get_current_artist(user: Dict = Depends(get_current_user)) -> Dict:
    """Role guard for Artist/Band role."""
    if user.get("role") != "artist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Artist access required"
        )
    return user

def get_current_venue_owner(user: Dict = Depends(get_current_user)) -> Dict:
    """Role guard for Venue Owner role."""
    if user.get("role") != "venue_owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Venue Owner access required"
        )
    return user

def get_current_admin(user: Dict = Depends(get_current_user)) -> Dict:
    """Role guard for Admin role."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

def require_role(allowed_roles: list[str]):
    """Dynamic role guard generator."""
    def role_checker(user: Dict = Depends(get_current_user)) -> Dict:
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return user
    return role_checker

def require_permission(permission: str):
    """
    Dynamic permission guard generator dependency.
    Verifies that the JWT payload permissions claim includes the requested string.
    """
    def permission_checker(user: Dict = Depends(get_current_user)) -> Dict:
        permissions = user.get("permissions", [])
        if permission not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required permission: '{permission}'"
            )
        return user
    return permission_checker

def permission_required(permission: str):
    """
    Python function decorator wrapper to enforce permission checks on standard service methods.
    Accepts an input parameter with active user claims object containing a 'permissions' list.
    """
    import functools
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Inspect args or kwargs for user dictionary payload
            user = kwargs.get("user") or (args[0] if args and isinstance(args[0], dict) else None)
            if not user or permission not in user.get("permissions", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required permission: '{permission}'"
                )
            return func(*args, **kwargs)
        return wrapper
    return decorator
