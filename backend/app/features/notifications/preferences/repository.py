from typing import Optional, Union, Any
from uuid import UUID
from sqlalchemy.orm import Session
from app.features.notifications.preferences.models import NotificationPreference
from app.features.notifications.preferences.schemas import NotificationPreferenceUpdate

class NotificationPreferenceRepository:
    def get_by_user_id(self, db: Session, user_id: UUID) -> Optional[NotificationPreference]:
        return db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id,
            NotificationPreference.deleted_at.is_(None)
        ).first()

    def get_or_create(self, db: Session, user_id: UUID) -> NotificationPreference:
        pref = self.get_by_user_id(db, user_id)
        if not pref:
            import uuid
            pref = NotificationPreference(
                id=uuid.uuid4(),
                user_id=user_id,
                booking_enabled=True,
                payment_enabled=True,
                review_enabled=True,
                message_enabled=True,
                system_enabled=True,
                realtime_enabled=True
            )
            db.add(pref)
            db.commit()
            db.refresh(pref)
        return pref

    def update(self, db: Session, user_id: UUID, obj_in: Union[NotificationPreferenceUpdate, dict, Any]) -> NotificationPreference:
        pref = self.get_or_create(db, user_id)
        
        if isinstance(obj_in, dict):
            update_data = obj_in
        elif hasattr(obj_in, "model_dump"):
            update_data = obj_in.model_dump(exclude_unset=True)
        elif hasattr(obj_in, "dict"):
            update_data = obj_in.dict(exclude_unset=True)
        else:
            # Extract fields from SQLAlchemy model or generic object
            fields = [
                "booking_enabled", "payment_enabled", "review_enabled", 
                "message_enabled", "system_enabled", "realtime_enabled"
            ]
            update_data = {}
            for field in fields:
                val = getattr(obj_in, field, None)
                if val is not None:
                    update_data[field] = val

        for key, value in update_data.items():
            setattr(pref, key, value)
        db.commit()
        db.refresh(pref)
        return pref

notification_preference_repository = NotificationPreferenceRepository()
