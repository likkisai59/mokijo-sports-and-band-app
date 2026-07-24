"""Band settings router — admin-only key/value config + audit logs."""

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount
from app.api.band_common.deps import require_band_admin, client_ip, user_agent
from app.api.band_settings import crud

router = APIRouter()


@router.get("/band/admin/settings/audit-logs", response_model=schemas.BandPaginatedAuditLogList, tags=["Band Settings"])
def audit_logs(action: str | None = None, limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0),
               db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    items, total = crud.list_logs(db, action, limit, offset)
    return {"items": [crud._serialize_log(l) for l in items], "total": total}


@router.get("/band/admin/settings/{key}", response_model=schemas.BandSystemSettingResponse, tags=["Band Settings"])
def get_setting(key: str, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    s = crud.get_setting(db, key)
    if not s:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Setting not found")
    return crud._serialize_setting(s)


@router.put("/band/admin/settings/{key}", response_model=schemas.BandSystemSettingResponse, tags=["Band Settings"])
def update_setting(key: str, payload: schemas.BandSystemSettingUpdate, request: Request,
                   db: Session = Depends(get_db), admin: BandAccount = Depends(require_band_admin)):
    s = crud.update_setting(db, key, payload.value, payload.description,
                            admin.id, client_ip(request), user_agent(request))
    return crud._serialize_setting(s)
