from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class BandNotificationBase(BaseModel):
    title: str
    message: str
    notification_type: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    is_read: bool = False


class BandNotificationRead(BandNotificationBase):
    id: int
    account_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BandNotificationList(BaseModel):
    total: int
    notifications: List[BandNotificationRead]
