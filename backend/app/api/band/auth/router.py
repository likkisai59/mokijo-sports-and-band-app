"""Band Auth Router — direct registration, login, and identity endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount
from app.api.band.common.deps import get_band_account
from app.api.band.auth import service

router = APIRouter()


@router.post(
    "/register",
    response_model=schemas.BandTokenResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Band Auth"],
)
def register(payload: schemas.BandRegisterRequest, db: Session = Depends(get_db)):
    """Register a new Band account (client, artist, venue_owner) and return access token."""
    return service.register(db, payload)


@router.post(
    "/login",
    response_model=schemas.BandTokenResponse,
    tags=["Band Auth"],
)
def login(payload: schemas.BandLoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password directly to receive JWT access token."""
    return service.login(db, payload)


@router.get(
    "/me",
    response_model=schemas.BandAccountResponse,
    tags=["Band Auth"],
)
def get_me(account: BandAccount = Depends(get_band_account)):
    """Retrieve current authenticated Band account profile."""
    return account


@router.post(
    "/change-password",
    tags=["Band Auth"],
)
def change_password(
    payload: schemas.BandChangePasswordRequest,
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Change account password."""
    return service.change_password(db, account, payload)


@router.delete(
    "/me",
    tags=["Band Auth"],
)
def delete_me(
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Soft-delete current account."""
    return service.delete_me(db, account)
