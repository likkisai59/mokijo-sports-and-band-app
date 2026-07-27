from sqlalchemy import Column, String, ForeignKey, Numeric, Date, Time, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.common.models.base import BaseModel

class Booking(BaseModel):
    __tablename__ = "bookings"

    artist_profile_id = Column(UUID(as_uuid=True), ForeignKey("artist_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("venues.id", ondelete="CASCADE"), nullable=True, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    event_name = Column(String(100), nullable=False)
    event_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    location = Column(String(255), nullable=False)
    
    proposed_price = Column(Numeric(12, 2), nullable=False, default=0.0)
    counter_price = Column(Numeric(12, 2), nullable=True)
    status = Column(String(30), nullable=False, default="pending", index=True)  # pending, counter_offered, accepted, rejected, cancelled
    
    notes = Column(Text, nullable=True)
    timeline = Column(JSON, nullable=False, default=list)  # [{ "status": "...", "timestamp": "...", "by": "...", "message": "..." }]

    # Relationships
    artist_profile = relationship("ArtistProfile", backref="bookings")
    venue = relationship("Venue", backref="bookings")
    client = relationship("User", backref="client_bookings")


class BookingAuditLog(BaseModel):
    __tablename__ = "booking_audit_logs"

    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    previous_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    reason = Column(Text, nullable=True)

    # Relationships
    booking = relationship("Booking", backref="audit_logs")


