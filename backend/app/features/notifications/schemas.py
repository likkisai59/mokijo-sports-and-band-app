from uuid import UUID
from datetime import datetime
from typing import Optional, Any
from app.common.schemas.base import BaseSchema
from pydantic import Field

class NotificationResponse(BaseSchema):
    id: UUID
    user_id: UUID
    recipient_user_id: Optional[UUID] = None
    recipient_role: Optional[str] = None
    notification_type: Optional[str] = None
    title: str
    message: str
    is_read: bool
    read_at: Optional[datetime] = None
    link: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[UUID] = None
    metadata: Optional[Any] = Field(None, serialization_alias="metadata", validation_alias="notification_metadata")
    created_at: datetime
    updated_at: Optional[datetime] = None

class NotificationMarkReadRequest(BaseSchema):
    is_read: bool = True

class SystemNotificationCreateRequest(BaseSchema):
    recipient_user_id: UUID
    recipient_role: Optional[str] = None
    notification_type: str
    title: str
    message: str
    reference_type: Optional[str] = None
    reference_id: Optional[UUID] = None
    metadata: Optional[dict] = None
