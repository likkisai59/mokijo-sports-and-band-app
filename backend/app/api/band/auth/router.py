"""Band auth router — registration, login, profile, password management."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount
from app.api.band.common.deps import get_band_account, require_band_admin
from app.api.band.auth import service

router = APIRouter()

# ── Public ────────────────────────────────────────────────────────────────────

@router.post("/band/auth/register", response_model=schemas.BandTokenResponse, status_code=status.HTTP_201_CREATED, tags=["Band Auth"])
def register(payload: schemas.BandRegisterRequest, db: Session = Depends(get_db)):
    return service.register(db, payload)


@router.post("/band/auth/login", response_model=schemas.BandTokenResponse, tags=["Band Auth"])
def login(payload: schemas.BandLoginRequest, db: Session = Depends(get_db)):
    return service.login(db, payload)


@router.post("/band/auth/forgot-password", tags=["Band Auth"])
def forgot_password(payload: schemas.BandForgotPasswordRequest, db: Session = Depends(get_db)):
    return service.forgot_password(db, payload)


@router.post("/band/auth/reset-password", tags=["Band Auth"])
def reset_password(payload: schemas.BandResetPasswordRequest, db: Session = Depends(get_db)):
    return service.reset_password(db, payload)


# ── Self (requires Band account) ──────────────────────────────────────────────

@router.get("/band/auth/me", response_model=schemas.BandAccountResponse, tags=["Band Auth"])
def me(account: BandAccount = Depends(get_band_account)):
    return account


@router.post("/band/auth/change-password", tags=["Band Auth"])
def change_password(payload: schemas.BandChangePasswordRequest,
                    db: Session = Depends(get_db),
                    account: BandAccount = Depends(get_band_account)):
    return service.change_password(db, account, payload)


@router.delete("/band/auth/me", tags=["Band Auth"])
def delete_me(db: Session = Depends(get_db), account: BandAccount = Depends(get_band_account)):
    return service.delete_me(db, account)


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
    return service.admin_list_users(db, search, role, is_active, limit, offset)


@router.get("/band/auth/admin/users/{user_id}", response_model=schemas.BandAccountResponse, tags=["Band Auth Admin"])
def admin_get_user(user_id: int, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    return service.admin_get_user(db, user_id)


@router.put("/band/auth/admin/users/{user_id}/status", response_model=schemas.BandAccountResponse, tags=["Band Auth Admin"])
def admin_update_status(user_id: int, payload: schemas.BandUserStatusUpdate,
                        db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    return service.admin_update_status(db, user_id, payload)


@router.delete("/band/auth/admin/users/{user_id}", tags=["Band Auth Admin"])
def admin_delete_user(user_id: int, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    return service.admin_delete_user(db, user_id)


@router.post("/band/auth/admin/users/bulk-status", tags=["Band Auth Admin"])
def admin_bulk_status(payload: schemas.BandBulkStatusUpdate, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    return service.admin_bulk_status(db, payload)
