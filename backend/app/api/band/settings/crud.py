"""Band Settings and Audit Log CRUD layer."""

from typing import List, Optional, Tuple, Any
from datetime import datetime
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.band_models import BandSystemSetting, BandAuditLog


def get_all_settings(db: Session) -> List[BandSystemSetting]:
    """Retrieve all dynamic platform settings."""
    settings = db.query(BandSystemSetting).all()
    if not settings:
        # Seed initial default settings if empty
        defaults = [
            BandSystemSetting(key="platform_commission_percent", value=10.0, description="Platform commission percentage deducted from bookings."),
            BandSystemSetting(key="advance_deposit_percent", value=20.0, description="Escrow advance lock percentage."),
            BandSystemSetting(key="escrow_auto_release_hours", value=24, description="Hours after event completion before escrow auto-releases."),
            BandSystemSetting(key="gst_rate_percent", value=18.0, description="Goods and Services Tax rate applied to platform fees."),
            BandSystemSetting(key="payout_minimum_threshold", value=500.0, description="Minimum wallet balance required for withdrawal."),
        ]
        for d in defaults:
            db.add(d)
        db.commit()
        settings = db.query(BandSystemSetting).all()
    return settings


def get_setting_by_key(db: Session, key: str) -> Optional[BandSystemSetting]:
    """Retrieve specific setting by key."""
    return db.query(BandSystemSetting).filter_by(key=key).first()


def upsert_setting(
    db: Session,
    key: str,
    value: Any,
    description: Optional[str] = None,
) -> BandSystemSetting:
    """Create or update a system setting."""
    setting = db.query(BandSystemSetting).filter_by(key=key).first()
    if setting:
        setting.value = value
        if description:
            setting.description = description
        setting.updated_at = datetime.utcnow()
    else:
        setting = BandSystemSetting(key=key, value=value, description=description)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def create_audit_log(
    db: Session,
    action: str,
    account_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    payload: Optional[dict] = None,
) -> BandAuditLog:
    """Record an immutable admin audit log."""
    log = BandAuditLog(
        account_id=account_id,
        action=action,
        ip_address=ip_address,
        user_agent=user_agent,
        payload=payload or {},
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_audit_logs(
    db: Session,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[BandAuditLog], int]:
    """List administrative audit events."""
    query = db.query(BandAuditLog)
    total = query.count()
    items = query.order_by(desc(BandAuditLog.created_at)).offset(offset).limit(limit).all()
    return items, total
