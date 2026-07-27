from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from app.features.notifications.models import Notification

class NotificationRepository:
    def create(
        self,
        db: Session,
        user_id: UUID,
        title: str,
        message: str,
        recipient_user_id: Optional[UUID] = None,
        recipient_role: Optional[str] = None,
        notification_type: Optional[str] = None,
        link: Optional[str] = None,
        reference_type: Optional[str] = None,
        reference_id: Optional[UUID] = None,
        notification_metadata: Optional[dict] = None
    ) -> Notification:
        import uuid
        notification = Notification(
            id=uuid.uuid4(),
            user_id=user_id,
            recipient_user_id=recipient_user_id or user_id,
            recipient_role=recipient_role,
            notification_type=notification_type,
            title=title,
            message=message,
            is_read=False,
            read_at=None,
            link=link,
            reference_type=reference_type,
            reference_id=reference_id,
            notification_metadata=notification_metadata
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    def get_by_id(self, db: Session, notification_id: UUID) -> Optional[Notification]:
        return db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.deleted_at.is_(None)
        ).first()

    def list_user_notifications(
        self,
        db: Session,
        user_id: UUID,
        recipient_role: Optional[str] = None,
        unread_only: bool = False,
        notification_type: Optional[str] = None,
        reference_type: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> List[Notification]:
        offset = (page - 1) * limit
        query = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.deleted_at.is_(None)
        )
        if recipient_role:
            query = query.filter(Notification.recipient_role == recipient_role)
        if unread_only:
            query = query.filter(Notification.is_read.is_(False))
        if notification_type:
            query = query.filter(Notification.notification_type == notification_type)
        if reference_type:
            query = query.filter(Notification.reference_type == reference_type)

        return (
            query.order_by(Notification.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def count_user_notifications(
        self,
        db: Session,
        user_id: UUID,
        recipient_role: Optional[str] = None,
        unread_only: bool = False,
        notification_type: Optional[str] = None,
        reference_type: Optional[str] = None
    ) -> int:
        query = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.deleted_at.is_(None)
        )
        if recipient_role:
            query = query.filter(Notification.recipient_role == recipient_role)
        if unread_only:
            query = query.filter(Notification.is_read.is_(False))
        if notification_type:
            query = query.filter(Notification.notification_type == notification_type)
        if reference_type:
            query = query.filter(Notification.reference_type == reference_type)

        return query.count()

    def get_unread_count(self, db: Session, user_id: UUID) -> int:
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
            Notification.deleted_at.is_(None)
        ).count()

    def mark_as_read(self, db: Session, notification: Notification) -> Notification:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.commit()
        db.refresh(notification)
        return notification

    def mark_all_as_read(self, db: Session, user_id: UUID):
        db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
            Notification.deleted_at.is_(None)
        ).update({
            "is_read": True,
            "read_at": datetime.utcnow()
        }, synchronize_session=False)
        db.commit()

    def delete(self, db: Session, notification: Notification) -> Notification:
        notification.soft_delete()
        db.commit()
        db.refresh(notification)
        return notification

    def bulk_delete(self, db: Session, user_id: UUID):
        # Soft delete all notifications for a specific user using a single bulk update
        db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.deleted_at.is_(None)
        ).update({
            "deleted_at": datetime.now()
        }, synchronize_session=False)
        db.commit()

notification_repository = NotificationRepository()
