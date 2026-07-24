"""Band auth router — registration, login, profile, password management.

Reuses Mokijo's JWT (app.core.security.create_access_token) so the resulting
token is verified by the shared `check_user_authorization` dependency.
"""

import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.logger import logger
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount
from app.api.band_common.deps import get_band_account, require_band_admin
from app.api.band_auth import crud

router = APIRouter()
settings = get_settings()


def _issue_token(account: BandAccount) -> schemas.BandTokenResponse:
    sub = json.dumps({
        "id": account.id,
        "userId": account.id,
        "username": account.name,
        "role": account.role,
    })
    access_token = create_access_token(data={"sub": sub})
    return schemas.BandTokenResponse(
        access_token=access_token,
        user=schemas.BandAccountResponse.model_validate(account),
    )


# ── Public ────────────────────────────────────────────────────────────────────

@router.post("/band/auth/register", response_model=schemas.BandTokenResponse, status_code=status.HTTP_201_CREATED, tags=["Band Auth"])
def register(payload: schemas.BandRegisterRequest, db: Session = Depends(get_db)):
    try:
        account = crud.create_account(db, payload.email, payload.password, payload.name, payload.role, payload.phone)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    logger.log_message_sync(message=f"Band account registered: id={account.id} role={account.role}")
    return _issue_token(account)


@router.post("/band/auth/login", response_model=schemas.BandTokenResponse, tags=["Band Auth"])
def login(payload: schemas.BandLoginRequest, db: Session = Depends(get_db)):
    account = crud.authenticate(db, payload.email, payload.password)
    if not account:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _issue_token(account)


@router.post("/band/auth/forgot-password", tags=["Band Auth"])
def forgot_password(payload: schemas.BandForgotPasswordRequest, db: Session = Depends(get_db)):
    # Anti-enumeration: identical response whether or not the email exists.
    account = crud.get_account_by_email(db, payload.email)
    if account:
        token = crud.make_reset_token(account)
        logger.log_message_sync(message=f"Band password reset requested for id={account.id}; token={token}")
    return {"message": "If that email exists, a reset link has been generated."}


@router.post("/band/auth/reset-password", tags=["Band Auth"])
def reset_password(payload: schemas.BandResetPasswordRequest, db: Session = Depends(get_db)):
    ok = crud.consume_reset_token(db, payload.token, payload.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    return {"message": "Password updated successfully"}


# ── Self (requires Band account) ──────────────────────────────────────────────

@router.get("/band/auth/me", response_model=schemas.BandAccountResponse, tags=["Band Auth"])
def me(account: BandAccount = Depends(get_band_account)):
    return account


@router.post("/band/auth/change-password", tags=["Band Auth"])
def change_password(payload: schemas.BandChangePasswordRequest,
                    db: Session = Depends(get_db),
                    account: BandAccount = Depends(get_band_account)):
    ok = crud.change_password(db, account, payload.current_password, payload.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    return {"message": "Password updated successfully"}


@router.delete("/band/auth/me", tags=["Band Auth"])
def delete_me(db: Session = Depends(get_db), account: BandAccount = Depends(get_band_account)):
    crud.soft_delete_account(db, account)
    return {"message": "Account closed"}


# ── Admin ─────────────────────────────────────────────────────────────────────

@router.get("/band/auth/admin/users", response_model=list[schemas.BandAccountResponse], tags=["Band Auth Admin"])
def admin_list_users(
    search: str | None = None,
    role: str | None = None,
    is_active: bool | None = None,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _admin=Depends(require_band_admin),
):
    items, _ = crud.list_accounts(db, search, role, is_active, limit, offset)
    return items


@router.get("/band/auth/admin/users/{user_id}", response_model=schemas.BandAccountResponse, tags=["Band Auth Admin"])
def admin_get_user(user_id: int, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    account = crud.get_account_by_id(db, user_id)
    if not account:
        raise HTTPException(status_code=404, detail="User not found")
    return account


@router.put("/band/auth/admin/users/{user_id}/status", response_model=schemas.BandAccountResponse, tags=["Band Auth Admin"])
def admin_update_status(user_id: int, payload: schemas.BandUserStatusUpdate,
                        db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    account = crud.get_account_by_id(db, user_id)
    if not account:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.set_active(db, account, payload.is_active)


@router.delete("/band/auth/admin/users/{user_id}", tags=["Band Auth Admin"])
def admin_delete_user(user_id: int, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    account = crud.get_account_by_id(db, user_id)
    if not account:
        raise HTTPException(status_code=404, detail="User not found")
    crud.soft_delete_account(db, account)
    return {"message": "User deleted"}


@router.post("/band/auth/admin/users/bulk-status", tags=["Band Auth Admin"])
def admin_bulk_status(payload: schemas.BandBulkStatusUpdate, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    updated = 0
    for uid in payload.user_ids:
        acc = crud.get_account_by_id(db, uid)
        if acc:
            crud.set_active(db, acc, payload.is_active)
            updated += 1
    return {"message": f"Updated {updated} users", "updated": updated}
