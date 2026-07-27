from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

class ReactionCreate(BaseModel):
    emoji: str = Field(..., min_length=1, max_length=20)

class ReactionResponse(BaseModel):
    id: UUID
    message_id: UUID
    user_id: UUID
    emoji: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)

class MessageCreate(MessageBase):
    reply_to_message_id: UUID | None = None

class MessageEdit(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)

class MessageForward(BaseModel):
    target_conversation_id: UUID

class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    message_type: str
    content: str
    reply_to_message_id: UUID | None = None
    edited_at: datetime | None = None
    read_at: datetime | None = None
    is_deleted: bool = False
    attachment_url: str | None = None
    attachment_name: str | None = None
    attachment_size: int | None = None
    attachment_type: str | None = None
    thumbnail_url: str | None = None
    reactions: list[ReactionResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TypingPayload(BaseModel):
    is_typing: bool = True

class PresenceResponse(BaseModel):
    user_id: UUID
    is_online: bool
    last_seen: datetime | None = None

class MessageSearchResponse(BaseModel):
    total: int
    page: int
    limit: int
    messages: list[MessageResponse]
