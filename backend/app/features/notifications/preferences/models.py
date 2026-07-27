from sqlalchemy import Column, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.common.models.base import BaseModel

class NotificationPreference(BaseModel):
    __tablename__ = "notification_preferences"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    booking_enabled = Column(Boolean, default=True, nullable=False)
    payment_enabled = Column(Boolean, default=True, nullable=False)
    review_enabled = Column(Boolean, default=True, nullable=False)
    message_enabled = Column(Boolean, default=True, nullable=False)
    system_enabled = Column(Boolean, default=True, nullable=False)
    realtime_enabled = Column(Boolean, default=True, nullable=False)

    user = relationship("User", backref="notification_preferences", uselist=False)
