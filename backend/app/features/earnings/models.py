from sqlalchemy import Column, String, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.common.models.base import BaseModel

class Transaction(BaseModel):
    __tablename__ = "transactions"

    artist_profile_id = Column(UUID(as_uuid=True), ForeignKey("artist_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("venues.id", ondelete="CASCADE"), nullable=True, index=True)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    
    amount = Column(Numeric(12, 2), nullable=False, default=0.0)
    type = Column(String(20), nullable=False, default="credit")  # credit, debit
    status = Column(String(30), nullable=False, default="pending")  # pending, completed, failed
    description = Column(String(255), nullable=True)

    # Relationships
    artist_profile = relationship("ArtistProfile", backref="transactions")
    venue = relationship("Venue", backref="transactions")
    booking = relationship("Booking", backref="transactions")
