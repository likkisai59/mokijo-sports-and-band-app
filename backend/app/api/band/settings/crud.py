"""Band admin settings (key/value store) + audit logs.

Auto-seeds default configuration keys on first read (reference behavior)
and records every update in band_audit_logs with before/after payload.
"""

from sqlalchemy.orm import Session

from app.models.band_models import BandSystemSetting, BandAuditLog

DEFAULT_SETTINGS = {
    "application_settings": {"maintenance_mode": False, "registration_open": True},
    "notification_settings": {"email_alerts": True, "sms_alerts": False},
    "storage_settings": {"provider": "local", "max_file_size_mb": 5},
    "email_templates": {"booking_confirmation": "Default template"},
    "sms_templates": {"booking_confirmation": "Default SMS"},
    "theme_settings": {"primary_color": "#bffe00"},
    "system_preferences": {"commission_rate": 10.0, "dispute_hold_days": 7},
}


def _serialize_setting(s: BandSystemSetting) -> dict:
    return {"key": s.key, "value": s.value, "description": s.description, "updated_at": s.updated_at}


def _serialize_log(l: BandAuditLog) -> dict:
    return {
        "id": l.id, "account_id": l.account_id, "action": l.action,
        "ip_address": l.ip_address, "user_agent": l.user_agent,
        "payload": l.payload, "created_at": l.created_at,
    }


def get_setting(db: Session, key: str) -> BandSystemSetting:
    s = db.query(BandSystemSetting).filter(BandSystemSetting.key == key).first()
    if not s and key in DEFAULT_SETTINGS:
        s = BandSystemSetting(key=key, value=DEFAULT_SETTINGS[key], description=None)
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


def update_setting(db: Session, key: str, value, description, account_id, ip, ua) -> BandSystemSetting:
    s = db.query(BandSystemSetting).filter(BandSystemSetting.key == key).first()
    before = None
    if s:
        before = s.value
        s.value = value
        if description is not None:
            s.description = description
    else:
        s = BandSystemSetting(key=key, value=value, description=description)
        db.add(s)
    db.flush()

    log = BandAuditLog(
        account_id=account_id, action=f"setting.update:{key}",
        ip_address=ip, user_agent=ua,
        payload={"before": before, "after": value},
    )
    db.add(log)
    db.commit()
    db.refresh(s)
    return s


def list_logs(db: Session, action=None, limit=50, offset=0):
    q = db.query(BandAuditLog)
    if action:
        like = f"%{action.lower()}%"
        q = q.filter(BandAuditLog.action.ilike(like))
    total = q.count()
    items = q.order_by(BandAuditLog.created_at.desc()).offset(offset).limit(limit).all()
    return items, total
