from sqlalchemy import Column, String, ForeignKey, Text, DateTime, Boolean, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.common.models.base import BaseModel

class Message(BaseModel):
    __tablename__ = "messages"

    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message_type = Column(String(20), nullable=False, default="TEXT", index=True)  # TEXT, IMAGE, DOCUMENT, VIDEO, AUDIO, FILE
    content = Column(Text, nullable=False)

    reply_to_message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True, index=True)
    edited_at = Column(DateTime(timezone=True), nullable=True, default=None)
    read_at = Column(DateTime(timezone=True), nullable=True, default=None)
    is_deleted = Column(Boolean, nullable=False, default=False)

    # Attachment Metadata Columns
    attachment_url = Column(String(500), nullable=True, default=None)
    attachment_name = Column(String(255), nullable=True, default=None)
    attachment_size = Column(Integer, nullable=True, default=None)
    attachment_type = Column(String(100), nullable=True, default=None)
    thumbnail_url = Column(String(500), nullable=True, default=None)

    # Relationships
    conversation = relationship("Conversation", backref="messages", foreign_keys=[conversation_id])
    sender = relationship("User", backref="sent_messages", foreign_keys=[sender_id])
    reply_to = relationship("Message", remote_side="Message.id", foreign_keys=[reply_to_message_id])
    reactions = relationship("MessageReaction", backref="message", cascade="all, delete-orphan", lazy="joined")


class MessageReaction(BaseModel):
    __tablename__ = "message_reactions"

    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    emoji = Column(String(20), nullable=False)

    user = relationship("User", backref="reactions")

    __table_args__ = (
        UniqueConstraint("message_id", "user_id", "emoji", name="uq_message_user_emoji"),
    )
