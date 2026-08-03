from sqlalchemy.orm import Session
from app.models.band_models import BandConversation, BandBooking

def initialize_conversation(db: Session, booking: BandBooking) -> BandConversation:
    """
    Creates a new BandConversation strictly linked to a BandBooking.
    Ensures only ONE conversation per booking.
    """
    existing = db.query(BandConversation).filter(BandConversation.booking_id == booking.id).first()
    if existing:
        return existing
    
    new_conversation = BandConversation(
        booking_id=booking.id,
        client_id=booking.client_id,
        artist_profile_id=booking.artist_profile_id,
        venue_id=booking.venue_id,
        status="ACTIVE"
    )
    db.add(new_conversation)
    db.commit()
    db.refresh(new_conversation)
    return new_conversation
