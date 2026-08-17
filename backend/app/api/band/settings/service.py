"""Band Settings Service layer — settings updates and audit trails."""

from typing import List, Optional, Any, Dict
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.band_models import BandAccount
from app.models import band_schemas as schemas
from app.api.band.settings import crud


def list_system_settings(db: Session) -> List[schemas.BandSystemSettingResponse]:
    """List all platform configuration settings."""
    settings = crud.get_all_settings(db)
    return [schemas.BandSystemSettingResponse.model_validate(s) for s in settings]


def update_system_setting(
    db: Session,
    account: BandAccount,
    key: str,
    payload: schemas.BandSystemSettingUpdate,
) -> schemas.BandSystemSettingResponse:
    """Admin updates platform setting."""
    if account.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only platform administrators can modify system settings.",
        )

    updated = crud.upsert_setting(
        db,
        key=key,
        value=payload.value,
        description=payload.description,
    )

    # Log action to audit trail
    crud.create_audit_log(
        db,
        action=f"update_setting:{key}",
        account_id=account.id,
        payload={"key": key, "new_value": payload.value},
    )

    return schemas.BandSystemSettingResponse.model_validate(updated)


def list_audit_trail(
    db: Session,
    account: BandAccount,
    limit: int = 50,
    offset: int = 0,
) -> Dict[str, Any]:
    """Retrieve audit events."""
    if account.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to platform administrators.",
        )

    items, total = crud.get_audit_logs(db, limit=limit, offset=offset)
    return {
        "items": [schemas.BandAuditLogResponse.model_validate(i) for i in items],
        "total": total,
    }
