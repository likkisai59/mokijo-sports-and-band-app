"""Band Settings Router — manage dynamic fees, escrow rules, and audit logs."""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount
from app.api.band.common.deps import get_band_account
from app.api.band.settings import service

router = APIRouter(prefix="/band/settings", tags=["Band Settings & Admin"])


@router.get(
    "",
    response_model=List[schemas.BandSystemSettingResponse],
)
def list_settings(db: Session = Depends(get_db)):
    """List all public and system platform settings."""
    return service.list_system_settings(db)


@router.put(
    "/{key}",
    response_model=schemas.BandSystemSettingResponse,
)
def update_setting(
    key: str,
    payload: schemas.BandSystemSettingUpdate,
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Admin updates platform configuration setting."""
    return service.update_system_setting(db, account, key, payload)


@router.get(
    "/audit/logs",
    response_model=Dict[str, Any],
)
def get_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Retrieve administrator audit trail."""
    return service.list_audit_trail(db, account, limit=limit, offset=offset)
