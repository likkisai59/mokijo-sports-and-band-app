"""Band Payments CRUD layer — escrow balance releases and invoice generation."""

from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.band_models import BandBooking, BandTransaction, BandAccount, BandArtistProfile, BandVenue


def release_escrow_settlement(
    db: Session,
    booking_id: int,
    released_by_account_id: int,
) -> BandBooking:
    """Release 80% remaining escrow to performer/venue wallet and mark booking as completed."""
    booking = db.query(BandBooking).filter_by(id=booking_id, deleted_at=None).first()
    if not booking:
        return None

    # Update booking status
    booking.status = "completed"
    booking.updated_at = datetime.utcnow()

    # Append to timeline
    timeline = list(booking.timeline or [])
    timeline.append({
        "action": "escrow_settled_and_released",
        "status": "completed",
        "timestamp": datetime.utcnow().isoformat(),
        "by_account_id": released_by_account_id,
        "notes": f"Full escrow settlement of ₹{booking.proposed_price:,.2f} released to provider wallet.",
    })
    booking.timeline = timeline

    # Credit provider wallet
    tx = BandTransaction(
        artist_profile_id=booking.artist_profile_id,
        venue_id=booking.venue_id,
        booking_id=booking.id,
        amount=booking.proposed_price,
        type="credit",
        status="completed",
        description=f"Gig Performance Settlement — {booking.event_name}",
    )
    db.add(tx)
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking
