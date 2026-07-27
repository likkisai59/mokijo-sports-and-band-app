from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.common.models.base import BaseModel

class Conversation(BaseModel):
    __tablename__ = "conversations"

    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    band_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    venue_owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    pinned_message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="SET NULL", use_alter=True, name="fk_conversations_pinned_message_id"), nullable=True, default=None, index=True)
    
    status = Column(String(20), nullable=False, default="ACTIVE", index=True)  # ACTIVE, CLOSED
    last_message_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    booking = relationship("Booking", backref="conversation")
    client = relationship("User", foreign_keys=[client_id], backref="client_conversations")
    band = relationship("User", foreign_keys=[band_id], backref="band_conversations")
    venue_owner = relationship("User", foreign_keys=[venue_owner_id], backref="venue_owner_conversations")
    pinned_message = relationship("Message", foreign_keys=[pinned_message_id])
