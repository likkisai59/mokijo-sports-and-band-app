"""Band settings router — admin-only key/value config + audit logs."""

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount
from app.api.band.common.deps import require_band_admin, client_ip, user_agent
from app.api.band.settings import service

router = APIRouter()

@router.get("/band/admin/settings/audit-logs", response_model=schemas.BandPaginatedAuditLogList, tags=["Band Settings"])
def audit_logs(action: str | None = None, limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0),
               db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    return service.audit_logs(db, action, limit, offset)


@router.get("/band/admin/settings/{key}", response_model=schemas.BandSystemSettingResponse, tags=["Band Settings"])
def get_setting(key: str, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    return service.get_setting(db, key)


@router.put("/band/admin/settings/{key}", response_model=schemas.BandSystemSettingResponse, tags=["Band Settings"])
def update_setting(key: str, payload: schemas.BandSystemSettingUpdate, request: Request,
                   db: Session = Depends(get_db), admin: BandAccount = Depends(require_band_admin)):
    return service.update_setting(db, key, payload, admin.id, client_ip(request), user_agent(request))
