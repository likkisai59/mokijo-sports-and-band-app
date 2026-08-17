"""Band Payments Service layer — escrow release settlements and tax invoice breakdown."""

from typing import Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.band_models import BandAccount, BandBooking, BandArtistProfile, BandVenue
from app.models import band_schemas as schemas
from app.api.band.payments import crud


def release_escrow(
    db: Session,
    account: BandAccount,
    booking_id: int,
) -> schemas.BandBookingResponse:
    """Release escrow balance upon show completion."""
    booking = db.query(BandBooking).filter_by(id=booking_id, deleted_at=None).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    if booking.client_id != account.id and account.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the client or platform admin can release escrow funds.",
        )

    updated = crud.release_escrow_settlement(db, booking_id=booking_id, released_by_account_id=account.id)
    return schemas.BandBookingResponse.model_validate(updated)


def get_booking_invoice(
    db: Session,
    account: BandAccount,
    booking_id: int,
) -> Dict[str, Any]:
    """Calculate transparent tax breakdown and GST invoice."""
    booking = db.query(BandBooking).filter_by(id=booking_id, deleted_at=None).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    base_fee = round(booking.proposed_price / 1.18, 2)
    gst_18 = round(booking.proposed_price - base_fee, 2)
    advance_20 = round(booking.proposed_price * 0.2, 2)
    remaining_80 = round(booking.proposed_price - advance_20, 2)

    return {
        "invoice_number": f"INV-2026-BCB{booking.id:04d}",
        "booking_id": booking.id,
        "event_name": booking.event_name,
        "event_date": booking.event_date.strftime("%Y-%m-%d"),
        "base_performance_fee": base_fee,
        "gst_18_percent": gst_18,
        "total_amount": booking.proposed_price,
        "advance_20_percent": advance_20,
        "remaining_80_percent": remaining_80,
        "status": booking.status,
        "escrow_guarantee": "100% Protected by BandConnect Escrow",
    }
