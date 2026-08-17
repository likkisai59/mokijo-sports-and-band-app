"""Band Bookings Service layer — business logic for reservation lifecycle, price calculation, and conflict resolution."""

from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.band_models import BandAccount, BandBooking, BandArtistProfile, BandVenue
from app.models import band_schemas as schemas
from app.api.band.bookings import crud


def check_availability(
    db: Session,
    artist_profile_id: Optional[int],
    venue_id: Optional[int],
    event_date_str: str,
    start_time: str,
    end_time: str,
) -> schemas.BandConflictCheckResponse:
    """Check whether a requested time window has scheduling conflicts."""
    try:
        event_date = datetime.strptime(event_date_str, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid event date format. Use YYYY-MM-DD.",
        )

    has_conflict = crud.check_conflicts(
        db=db,
        artist_profile_id=artist_profile_id,
        venue_id=venue_id,
        event_date=event_date,
        start_time=start_time,
        end_time=end_time,
    )

    if has_conflict:
        return schemas.BandConflictCheckResponse(
            conflict=True,
            reason="The selected performer or venue already has a confirmed or pending booking during this time slot.",
        )

    return schemas.BandConflictCheckResponse(
        conflict=False,
        reason=None,
    )


def create_booking_inquiry(
    db: Session,
    client_account: BandAccount,
    payload: schemas.BandBookingCreateRequest,
) -> BandBooking:
    """Validate and initiate a new booking inquiry."""
    if not payload.artist_profile_id and not payload.venue_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must specify at least an artist_profile_id or a venue_id to book.",
        )

    try:
        event_date_dt = datetime.strptime(payload.event_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid event date format. Use YYYY-MM-DD.",
        )

    if event_date_dt.date() < datetime.utcnow().date():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event date cannot be in the past.",
        )

    # Validate artist existence if requested
    if payload.artist_profile_id:
        artist = db.query(BandArtistProfile).filter_by(id=payload.artist_profile_id, deleted_at=None).first()
        if not artist:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Artist profile not found.")

    # Validate venue existence if requested
    if payload.venue_id:
        venue = db.query(BandVenue).filter_by(id=payload.venue_id, deleted_at=None).first()
        if not venue:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")

    # Check for scheduling overlap conflicts
    has_conflict = crud.check_conflicts(
        db=db,
        artist_profile_id=payload.artist_profile_id,
        venue_id=payload.venue_id,
        event_date=event_date_dt,
        start_time=payload.start_time,
        end_time=payload.end_time,
    )
    if has_conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The requested date and time slot is already booked or reserved.",
        )

    return crud.create_booking(
        db=db,
        client_id=client_account.id,
        payload=payload,
        event_date_dt=event_date_dt,
    )


def get_user_bookings(
    db: Session,
    account: BandAccount,
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> schemas.BandPaginatedBookingList:
    """Retrieve bookings matching user's account role."""
    if account.role == "artist":
        artist = db.query(BandArtistProfile).filter_by(account_id=account.id).first()
        if not artist:
            return schemas.BandPaginatedBookingList(items=[], total=0)
        items, total = crud.get_artist_bookings(db, artist.id, status=status_filter, limit=limit, offset=offset)
    elif account.role == "venue_owner":
        venue = db.query(BandVenue).filter_by(account_id=account.id).first()
        if not venue:
            return schemas.BandPaginatedBookingList(items=[], total=0)
        items, total = crud.get_venue_bookings(db, venue.id, status=status_filter, limit=limit, offset=offset)
    else:
        # Default client role
        items, total = crud.get_client_bookings(db, account.id, status=status_filter, limit=limit, offset=offset)

    return schemas.BandPaginatedBookingList(
        items=[schemas.BandBookingResponse.model_validate(b) for b in items],
        total=total,
    )


def get_booking_detail(
    db: Session,
    account: BandAccount,
    booking_id: int,
) -> schemas.BandBookingResponse:
    """Retrieve single booking ensuring user is an authorized participant."""
    booking = crud.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    # Authorization verification
    is_client = booking.client_id == account.id
    is_artist = False
    is_venue = False

    if booking.artist_profile_id:
        artist = db.query(BandArtistProfile).filter_by(id=booking.artist_profile_id).first()
        if artist and artist.account_id == account.id:
            is_artist = True

    if booking.venue_id:
        venue = db.query(BandVenue).filter_by(id=booking.venue_id).first()
        if venue and venue.account_id == account.id:
            is_venue = True

    if not (is_client or is_artist or is_venue or account.role == "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this booking.",
        )

    return schemas.BandBookingResponse.model_validate(booking)


def accept_booking(
    db: Session,
    account: BandAccount,
    booking_id: int,
) -> schemas.BandBookingResponse:
    """Provider accepts the booking inquiry."""
    booking = crud.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    # Validate provider authority
    is_authorized = False
    if booking.artist_profile_id:
        artist = db.query(BandArtistProfile).filter_by(id=booking.artist_profile_id).first()
        if artist and artist.account_id == account.id:
            is_authorized = True
    if booking.venue_id:
        venue = db.query(BandVenue).filter_by(id=booking.venue_id).first()
        if venue and venue.account_id == account.id:
            is_authorized = True

    if not is_authorized and account.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the booked artist or venue owner can accept this inquiry.",
        )

    if booking.status not in ["pending", "counter_offered"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot accept booking in '{booking.status}' status.",
        )

    updated = crud.update_booking_status(
        db=db,
        booking=booking,
        new_status="accepted",
        action_name="accepted_by_provider",
        by_account_id=account.id,
        notes="Provider accepted booking inquiry. Awaiting advance payment.",
    )
    return schemas.BandBookingResponse.model_validate(updated)


def counter_offer(
    db: Session,
    account: BandAccount,
    booking_id: int,
    payload: schemas.BandCounterOfferRequest,
) -> schemas.BandBookingResponse:
    """Provider proposes a counter-offer price."""
    booking = crud.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    if booking.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Counter-offer can only be proposed on pending inquiries.",
        )

    updated = crud.update_booking_status(
        db=db,
        booking=booking,
        new_status="counter_offered",
        action_name="counter_offered",
        by_account_id=account.id,
        notes=payload.message or f"Counter-offer proposed: ₹{payload.counter_price}",
        counter_price=payload.counter_price,
    )
    return schemas.BandBookingResponse.model_validate(updated)


def decline_booking(
    db: Session,
    account: BandAccount,
    booking_id: int,
    reason: Optional[str] = None,
) -> schemas.BandBookingResponse:
    """Provider declines booking inquiry."""
    booking = crud.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    updated = crud.update_booking_status(
        db=db,
        booking=booking,
        new_status="rejected",
        action_name="declined_by_provider",
        by_account_id=account.id,
        notes=reason or "Provider is unable to accommodate booking request.",
    )
    return schemas.BandBookingResponse.model_validate(updated)


def cancel_booking(
    db: Session,
    account: BandAccount,
    booking_id: int,
    reason: Optional[str] = None,
) -> schemas.BandBookingResponse:
    """Client cancels booking inquiry."""
    booking = crud.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

    if booking.client_id != account.id and account.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the client who initiated this booking can cancel it.",
        )

    if booking.status in ["completed", "cancelled", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel booking in '{booking.status}' status.",
        )

    updated = crud.update_booking_status(
        db=db,
        booking=booking,
        new_status="cancelled",
        action_name="cancelled_by_client",
        by_account_id=account.id,
        notes=reason or "Cancelled by client.",
    )
    return schemas.BandBookingResponse.model_validate(updated)
