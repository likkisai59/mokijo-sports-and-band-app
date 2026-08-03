"""CRUD operations for Band Notifications."""

from sqlalchemy.orm import Session
from app.models.band_models import BandNotification


def create(db: Session, account_id: int, title: str, message: str, notification_type: str = None, reference_type: str = None, reference_id: int = None) -> BandNotification:
    notif = BandNotification(
        account_id=account_id,
        title=title,
        message=message,
        notification_type=notification_type,
        reference_type=reference_type,
        reference_id=reference_id,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def list_for_account(db: Session, account_id: int, unread_only: bool = False, limit: int = 50, offset: int = 0):
    q = db.query(BandNotification).filter(BandNotification.account_id == account_id)
    if unread_only:
        q = q.filter(BandNotification.is_read == False)
    
    total = q.count()
    items = q.order_by(BandNotification.created_at.desc()).offset(offset).limit(limit).all()
    return items, total


def mark_read(db: Session, account_id: int, notification_id: int) -> bool:
    notif = db.query(BandNotification).filter(
        BandNotification.account_id == account_id,
        BandNotification.id == notification_id
    ).first()
    if notif and not notif.is_read:
        notif.is_read = True
        db.commit()
        return True
    return False


def mark_all_read(db: Session, account_id: int):
    db.query(BandNotification).filter(
        BandNotification.account_id == account_id,
        BandNotification.is_read == False
    ).update({"is_read": True})
    db.commit()
