from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.api.band.notifications import crud


class NotificationService:
    @staticmethod
    def get_inbox(db: Session, account_id: int) -> Dict[str, Any]:
        notifs = crud.get_user_notifications(db, account_id)
        unread_count = crud.count_unread_notifications(db, account_id)
        return {
            "unread_count": unread_count,
            "items": [
                {
                    "id": n.id,
                    "title": n.title,
                    "message": n.message,
                    "notification_type": n.notification_type,
                    "reference_type": n.reference_type,
                    "reference_id": n.reference_id,
                    "is_read": n.is_read,
                    "created_at": n.created_at.isoformat() if n.created_at else None,
                }
                for n in notifs
            ],
        }

    @staticmethod
    def mark_single_read(db: Session, notification_id: int, account_id: int) -> bool:
        return crud.mark_notification_read(db, notification_id, account_id)

    @staticmethod
    def mark_all_read(db: Session, account_id: int) -> int:
        return crud.mark_all_notifications_read(db, account_id)
