from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class NotificationPreferenceBase(BaseModel):
    booking_enabled: bool = True
    payment_enabled: bool = True
    review_enabled: bool = True
    message_enabled: bool = True
    system_enabled: bool = True
    realtime_enabled: bool = True

class NotificationPreferenceCreate(NotificationPreferenceBase):
    user_id: UUID

class NotificationPreferenceUpdate(BaseModel):
    booking_enabled: Optional[bool] = None
    payment_enabled: Optional[bool] = None
    review_enabled: Optional[bool] = None
    message_enabled: Optional[bool] = None
    system_enabled: Optional[bool] = None
    realtime_enabled: Optional[bool] = None

class NotificationPreferenceResponse(NotificationPreferenceBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
