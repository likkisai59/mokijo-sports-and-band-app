from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import band_schemas as schemas
from app.api.band.settings import crud

def audit_logs(db: Session, action: str | None, limit: int, offset: int):
    items, total = crud.list_logs(db, action, limit, offset)
    return {"items": [crud._serialize_log(l) for l in items], "total": total}

def get_setting(db: Session, key: str):
    s = crud.get_setting(db, key)
    if not s:
        raise HTTPException(status_code=404, detail="Setting not found")
    return crud._serialize_setting(s)

def update_setting(db: Session, key: str, payload: schemas.BandSystemSettingUpdate, admin_id: int, ip_address: str, user_agent: str):
    s = crud.update_setting(db, key, payload.value, payload.description, admin_id, ip_address, user_agent)
    return crud._serialize_setting(s)
