from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class ConversationBase(BaseModel):
    booking_id: UUID

class ConversationCreate(ConversationBase):
    pass

class ParticipantSummary(BaseModel):
    id: UUID
    name: str
    email: str

class ConversationResponse(BaseModel):
    id: UUID
    booking_id: UUID
    client_id: UUID
    band_id: UUID
    venue_owner_id: Optional[UUID] = None
    status: str
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Optional nested details for UI rendering
    event_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
