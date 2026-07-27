from uuid import UUID
from sqlalchemy.orm import Session
from app.features.notifications.preferences.repository import notification_preference_repository
from app.features.notifications.preferences.schemas import NotificationPreferenceUpdate
from app.features.notifications.preferences.models import NotificationPreference

class NotificationPreferenceService:
    TYPE_TO_FIELD = {
        "booking_request": "booking_enabled",
        "booking_accepted": "booking_enabled",
        "booking_rejected": "booking_enabled",
        "counter_offer": "booking_enabled",
        "counter_accepted": "booking_enabled",
        "counter_rejected": "booking_enabled",
        "booking_confirmed": "booking_enabled",
        "booking_cancelled": "booking_enabled",
        "booking_completed": "booking_enabled",
        "booking_report": "booking_enabled",
        "payment": "payment_enabled",
        "payment_received": "payment_enabled",
        "payment_released": "payment_enabled",
        "review": "review_enabled",
        "review_received": "review_enabled",
        "review_reply": "review_enabled",
        "message": "message_enabled",
        "chat": "message_enabled",
        "system": "system_enabled",
        "failed_action": "system_enabled",
    }

    def get_preferences(self, db: Session, user_id: UUID) -> NotificationPreference:
        return notification_preference_repository.get_or_create(db, user_id)

    def update_preferences(
        self, db: Session, user_id: UUID, obj_in: NotificationPreferenceUpdate
    ) -> NotificationPreference:
        return notification_preference_repository.update(db, user_id, obj_in)

    def is_delivery_allowed(self, db: Session, user_id: UUID, notification_type: str) -> bool:
        """
        Check if the user has enabled notifications for the given type.
        """
        pref = notification_preference_repository.get_by_user_id(db, user_id)
        if not pref:
            return True  # Default to True if no preferences are configured yet

        field = self.TYPE_TO_FIELD.get(notification_type)
        if not field:
            # Fallback for dynamic types (like custom review types)
            lower_type = notification_type.lower()
            if "review" in lower_type:
                field = "review_enabled"
            elif "payment" in lower_type or "transaction" in lower_type:
                field = "payment_enabled"
            elif "message" in lower_type or "chat" in lower_type:
                field = "message_enabled"
            elif "booking" in lower_type:
                field = "booking_enabled"
            else:
                field = "system_enabled"
        
        return getattr(pref, field, True)

    def is_realtime_allowed(self, db: Session, user_id: UUID) -> bool:
        """
        Check if the user has enabled realtime (WebSocket) notifications.
        """
        pref = notification_preference_repository.get_by_user_id(db, user_id)
        if not pref:
            return True  # Default to True if no preferences are configured yet
        return pref.realtime_enabled

notification_preference_service = NotificationPreferenceService()
