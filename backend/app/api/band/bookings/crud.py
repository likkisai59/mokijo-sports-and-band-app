"""Band Bookings CRUD layer — database queries for booking lifecycle, conflict checks, and history."""

from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy import or_, and_, desc
from sqlalchemy.orm import Session, joinedload

from app.models.band_models import BandBooking, BandArtistProfile, BandVenue, BandAccount
from app.models import band_schemas as schemas


def get_booking_by_id(db: Session, booking_id: int) -> Optional[BandBooking]:
    """Retrieve single booking with related artist, venue, and client entities."""
    return (
        db.query(BandBooking)
        .filter(BandBooking.id == booking_id, BandBooking.deleted_at.is_(None))
        .first()
    )


def check_conflicts(
    db: Session,
    artist_profile_id: Optional[int],
    venue_id: Optional[int],
    event_date: datetime,
    start_time: str,
    end_time: str,
    exclude_booking_id: Optional[int] = None,
) -> bool:
    """Check if artist or venue already has a confirmed or pending booking on that date/time."""
    date_start = datetime(event_date.year, event_date.month, event_date.day, 0, 0, 0)
    date_end = datetime(event_date.year, event_date.month, event_date.day, 23, 59, 59)

    query = db.query(BandBooking).filter(
        BandBooking.event_date >= date_start,
        BandBooking.event_date <= date_end,
        BandBooking.status.in_(["pending", "accepted", "confirmed"]),
        BandBooking.deleted_at.is_(None),
    )

    if exclude_booking_id:
        query = query.filter(BandBooking.id != exclude_booking_id)

    target_conditions = []
    if artist_profile_id:
        target_conditions.append(BandBooking.artist_profile_id == artist_profile_id)
    if venue_id:
        target_conditions.append(BandBooking.venue_id == venue_id)

    if not target_conditions:
        return False

    query = query.filter(or_(*target_conditions))

    existing_bookings = query.all()
    for b in existing_bookings:
        # Time range overlap check: (start_time < b.end_time) and (end_time > b.start_time)
        if start_time < b.end_time and end_time > b.start_time:
            return True

    return False


def create_booking(
    db: Session,
    client_id: int,
    payload: schemas.BandBookingCreateRequest,
    event_date_dt: datetime,
) -> BandBooking:
    """Create a new booking inquiry in pending status with initial timeline action."""
    timeline_entry = {
        "action": "inquiry_created",
        "timestamp": datetime.utcnow().isoformat(),
        "by_account_id": client_id,
        "notes": payload.notes or "Initial booking inquiry submitted",
    }

    booking = BandBooking(
        client_id=client_id,
        artist_profile_id=payload.artist_profile_id,
        venue_id=payload.venue_id,
        event_name=payload.event_name,
        event_date=event_date_dt,
        start_time=payload.start_time,
        end_time=payload.end_time,
        location=payload.location,
        proposed_price=payload.proposed_price,
        status="pending",
        notes=payload.notes,
        timeline=[timeline_entry],
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def get_client_bookings(
    db: Session,
    client_id: int,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[BandBooking], int]:
    """List bookings created by a client."""
    query = db.query(BandBooking).filter(
        BandBooking.client_id == client_id,
        BandBooking.deleted_at.is_(None),
    )
    if status and status != "all":
        query = query.filter(BandBooking.status == status)

    total = query.count()
    items = (
        query.order_by(desc(BandBooking.event_date))
        .offset(offset)
        .limit(limit)
        .all()
    )
    return items, total


def get_artist_bookings(
    db: Session,
    artist_profile_id: int,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[BandBooking], int]:
    """List bookings requested for an artist."""
    query = db.query(BandBooking).filter(
        BandBooking.artist_profile_id == artist_profile_id,
        BandBooking.deleted_at.is_(None),
    )
    if status and status != "all":
        query = query.filter(BandBooking.status == status)

    total = query.count()
    items = (
        query.order_by(desc(BandBooking.event_date))
        .offset(offset)
        .limit(limit)
        .all()
    )
    return items, total


def get_venue_bookings(
    db: Session,
    venue_id: int,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[BandBooking], int]:
    """List bookings requested for a venue."""
    query = db.query(BandBooking).filter(
        BandBooking.venue_id == venue_id,
        BandBooking.deleted_at.is_(None),
    )
    if status and status != "all":
        query = query.filter(BandBooking.status == status)

    total = query.count()
    items = (
        query.order_by(desc(BandBooking.event_date))
        .offset(offset)
        .limit(limit)
        .all()
    )
    return items, total


def update_booking_status(
    db: Session,
    booking: BandBooking,
    new_status: str,
    action_name: str,
    by_account_id: int,
    notes: Optional[str] = None,
    counter_price: Optional[float] = None,
) -> BandBooking:
    """Update booking status and append an immutable event to the timeline."""
    timeline = list(booking.timeline or [])
    timeline_entry = {
        "action": action_name,
        "status": new_status,
        "timestamp": datetime.utcnow().isoformat(),
        "by_account_id": by_account_id,
        "notes": notes,
    }
    if counter_price is not None:
        timeline_entry["counter_price"] = counter_price
        booking.counter_price = counter_price

    timeline.append(timeline_entry)
    booking.timeline = timeline
    booking.status = new_status
    booking.updated_at = datetime.utcnow()

    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking
