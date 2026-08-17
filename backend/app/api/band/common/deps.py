"""Band common dependencies — authentication and role claims extraction."""

from typing import Callable, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
import jwt

from app.core.database import get_db
from app.core.config import settings
from app.models.band_models import BandAccount

security = HTTPBearer(auto_error=False)


def get_band_account(
    cred: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> BandAccount:
    """Extract and validate BandAccount from Bearer JWT token."""
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            cred.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id = payload.get("sub") or payload.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims",
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    account = (
        db.query(BandAccount)
        .filter(BandAccount.id == int(user_id))
        .filter(BandAccount.deleted_at.is_(None))
        .first()
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Band account not found",
        )
    if not account.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    return account


def require_band_role(*roles: str) -> Callable:
    """Dependency factory checking that the authenticated account has one of the allowed roles."""
    def _role_checker(account: BandAccount = Depends(get_band_account)) -> BandAccount:
        if account.role not in roles and account.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden for role '{account.role}'. Required: {list(roles)}",
            )
        return account
    return _role_checker


def require_band_admin(account: BandAccount = Depends(get_band_account)) -> BandAccount:
    """Require admin role for Band platform governance."""
    if account.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return account


# Aliases for consistent naming across modules
get_band_db = get_db
get_current_band_account = get_band_account
get_current_admin_band_account = require_band_admin

