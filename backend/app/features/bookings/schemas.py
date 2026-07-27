from typing import Optional, List
from uuid import UUID
from datetime import date, time, datetime
from app.common.schemas.base import BaseSchema

class ClientBriefResponse(BaseSchema):
    id: UUID
    name: str
    email: str


class TimelineItem(BaseSchema):
    status: str
    timestamp: str
    by: str
    message: str


class BookingBriefResponse(BaseSchema):
    id: UUID
    event_name: str
    event_date: date
    start_time: time
    end_time: time
    proposed_price: float
    counter_price: Optional[float] = None
    status: str
    created_at: datetime
    artist_profile_id: Optional[UUID] = None
    venue_id: Optional[UUID] = None
    artist_name: Optional[str] = None
    venue_name: Optional[str] = None


class ArtistBriefResponse(BaseSchema):
    id: UUID
    display_name: str
    bio: Optional[str] = None
    base_rate: float
    rating: float


class VenueBriefResponse(BaseSchema):
    id: UUID
    name: str
    address: str
    capacity: int
    base_price: float


class BookingResponse(BookingBriefResponse):
    location: str
    notes: Optional[str] = None
    client: ClientBriefResponse
    timeline: List[TimelineItem] = []
    updated_at: datetime
    artist: Optional[ArtistBriefResponse] = None
    venue: Optional[VenueBriefResponse] = None


class BookingCreateRequest(BaseSchema):
    artist_profile_id: Optional[UUID] = None
    venue_id: Optional[UUID] = None
    event_name: str
    event_date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    location: str
    proposed_price: float
    notes: Optional[str] = None


class CounterOfferRequest(BaseSchema):
    counter_price: float
    message: Optional[str] = None


class DisputeResolveRequest(BaseSchema):
    status: str
    message: Optional[str] = None


class BookingCancelRequest(BaseSchema):
    reason: Optional[str] = None
