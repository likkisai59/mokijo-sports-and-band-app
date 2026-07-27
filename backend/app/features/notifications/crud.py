from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.features.notifications.models import Notification

class NotificationCRUD:
    def get_by_user(
        self,
        db: Session,
        user_id: UUID,
        page: int = 1,
        limit: int = 10,
        unread_only: bool = False
    ) -> List[Notification]:
        offset = (page - 1) * limit
        query = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.deleted_at.is_(None)
        )
        if unread_only:
            query = query.filter(Notification.is_read.is_(False))
        return (
            query.order_by(Notification.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def count_by_user(self, db: Session, user_id: UUID, unread_only: bool = False) -> int:
        query = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.deleted_at.is_(None)
        )
        if unread_only:
            query = query.filter(Notification.is_read.is_(False))
        return query.count()

    def get(self, db: Session, notification_id: UUID) -> Optional[Notification]:
        return db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.deleted_at.is_(None)
        ).first()

    def create(
        self,
        db: Session,
        user_id: UUID,
        title: str,
        message: str,
        notification_type: Optional[str] = None,
        link: Optional[str] = None
    ) -> Notification:
        import uuid
        notification = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            title=title,
            message=message,
            is_read=False,
            notification_type=notification_type,
            link=link
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    def mark_as_read(self, db: Session, notification: Notification) -> Notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)
        return notification

    def mark_all_as_read(self, db: Session, user_id: UUID):
        db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
            Notification.deleted_at.is_(None)
        ).update({"is_read": True})
        db.commit()

    def delete(self, db: Session, notification: Notification) -> Notification:
        notification.soft_delete()
        db.commit()
        db.refresh(notification)
        return notification

notification_crud = NotificationCRUD()
