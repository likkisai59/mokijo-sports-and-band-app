"""
Shared FastAPI dependencies and helpers for the Band module.

Auth reuses Mokijo's existing JWT dependency (`check_user_authorization`),
which returns the decoded user dict containing {id, role, username, ...}.

Band account records live in `band_accounts`; their integer `id` is stored in
the JWT `sub.id` claim at login, so `current_user["id"]` is the Band account id.
"""

from typing import Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.auth.authorization import check_user_authorization
from app.models.band_models import BandAccount

# Re-export for convenience so Band routers import everything from one place.
current_user = check_user_authorization


def get_band_account(
    db: Session = Depends(get_db),
    current_user: dict = Depends(check_user_authorization),
) -> BandAccount:
    """Resolve the authenticated JWT user to a BandAccount row.

    Raises 404 if the account does not exist (e.g. a Sports/Club token is
    used against a Band endpoint) — keeps Band endpoints isolated.
    """
    account_id = current_user.get("id")
    account = db.query(BandAccount).filter(BandAccount.id == account_id).first() if account_id is not None else None
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Band account not found for the authenticated user.",
        )
    if not account.is_active or account.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Band account is inactive.",
        )
    return account


def require_band_role(*allowed_roles: str):
    """Dependency factory: ensure the Band account has one of `allowed_roles`.

    Usage:
        account: BandAccount = Depends(require_band_role("artist", "admin"))
    """

    def _dep(account: BandAccount = Depends(get_band_account)) -> BandAccount:
        if account.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: role '{account.role}' is not permitted.",
            )
        return account

    return _dep


def require_band_admin(account: BandAccount = Depends(get_band_account)) -> BandAccount:
    if account.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return account


def client_ip(request) -> Optional[str]:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else None


def user_agent(request) -> Optional[str]:
    return request.headers.get("user-agent")
