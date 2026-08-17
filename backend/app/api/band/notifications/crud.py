from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.band_models import BandNotification


def get_user_notifications(
    db: Session, account_id: int, limit: int = 30
) -> List[BandNotification]:
    return (
        db.query(BandNotification)
        .filter(BandNotification.account_id == account_id)
        .order_by(BandNotification.created_at.desc())
        .limit(limit)
        .all()
    )


def count_unread_notifications(db: Session, account_id: int) -> int:
    return (
        db.query(BandNotification)
        .filter(
            BandNotification.account_id == account_id,
            BandNotification.is_read == False,
        )
        .count()
    )


def create_notification(
    db: Session,
    account_id: int,
    title: str,
    message: str,
    notification_type: Optional[str] = "SYSTEM",
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
) -> BandNotification:
    notif = BandNotification(
        account_id=account_id,
        title=title,
        message=message,
        notification_type=notification_type,
        reference_type=reference_type,
        reference_id=reference_id,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def mark_notification_read(db: Session, notification_id: int, account_id: int) -> bool:
    notif = (
        db.query(BandNotification)
        .filter(
            BandNotification.id == notification_id,
            BandNotification.account_id == account_id,
        )
        .first()
    )
    if notif:
        notif.is_read = True
        db.commit()
        return True
    return False


def mark_all_notifications_read(db: Session, account_id: int) -> int:
    unread = (
        db.query(BandNotification)
        .filter(
            BandNotification.account_id == account_id,
            BandNotification.is_read == False,
        )
        .all()
    )
    for n in unread:
        n.is_read = True
    db.commit()
    return len(unread)
