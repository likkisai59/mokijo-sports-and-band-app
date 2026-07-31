import json
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.core.security import create_access_token
from app.logger import logger
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount
from app.api.band.auth import crud

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

def register(db: Session, payload: schemas.BandRegisterRequest):
    try:
        account = crud.create_account(db, payload.email, payload.password, payload.name, payload.role, payload.phone)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    logger.log_message_sync(message=f"Band account registered: id={account.id} role={account.role}")
    return _issue_token(account)

def login(db: Session, payload: schemas.BandLoginRequest):
    account = crud.authenticate(db, payload.email, payload.password)
    if not account:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _issue_token(account)

def forgot_password(db: Session, payload: schemas.BandForgotPasswordRequest):
    # Anti-enumeration: identical response whether or not the email exists.
    account = crud.get_account_by_email(db, payload.email)
    if account:
        token = crud.make_reset_token(account)
        logger.log_message_sync(message=f"Band password reset requested for id={account.id}; token={token}")
    return {"message": "If that email exists, a reset link has been generated."}

def reset_password(db: Session, payload: schemas.BandResetPasswordRequest):
    ok = crud.consume_reset_token(db, payload.token, payload.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    return {"message": "Password updated successfully"}

# ── Self (requires Band account) ──────────────────────────────────────────────

def change_password(db: Session, account: BandAccount, payload: schemas.BandChangePasswordRequest):
    ok = crud.change_password(db, account, payload.current_password, payload.new_password)
    if not ok:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    return {"message": "Password updated successfully"}

def delete_me(db: Session, account: BandAccount):
    crud.soft_delete_account(db, account)
    return {"message": "Account closed"}

# ── Admin ─────────────────────────────────────────────────────────────────────

def admin_list_users(db: Session, search: str | None, role: str | None, is_active: bool | None, limit: int, offset: int):
    items, _ = crud.list_accounts(db, search, role, is_active, limit, offset)
    return items

def admin_get_user(db: Session, user_id: int):
    account = crud.get_account_by_id(db, user_id)
    if not account:
        raise HTTPException(status_code=404, detail="User not found")
    return account

def admin_update_status(db: Session, user_id: int, payload: schemas.BandUserStatusUpdate):
    account = crud.get_account_by_id(db, user_id)
    if not account:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.set_active(db, account, payload.is_active)

def admin_delete_user(db: Session, user_id: int):
    account = crud.get_account_by_id(db, user_id)
    if not account:
        raise HTTPException(status_code=404, detail="User not found")
    crud.soft_delete_account(db, account)
    return {"message": "User deleted"}

def admin_bulk_status(db: Session, payload: schemas.BandBulkStatusUpdate):
    updated = 0
    for uid in payload.user_ids:
        acc = crud.get_account_by_id(db, uid)
        if acc:
            crud.set_active(db, acc, payload.is_active)
            updated += 1
    return {"message": f"Updated {updated} users", "updated": updated}
