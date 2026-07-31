"""Business logic for Band bookings — status state-machine + timeline.

Preserves the reference booking flow:
  pending -> accepted / rejected / counter_offered / cancelled
  accepted -> completed
Terminal states reject further transitions.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.api.band.bookings import crud
from app.models.band_models import BandArtistProfile, BandVenue, BandBooking

TERMINAL = {"rejected", "cancelled", "completed"}


def _artist_profile_for(db: Session, account_id: int) -> BandArtistProfile:
    p = db.query(BandArtistProfile).filter(BandArtistProfile.account_id == account_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Artist profile not found")
    return p


def _venue_for(db: Session, account_id: int) -> BandVenue:
    v = db.query(BandVenue).filter(BandVenue.account_id == account_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    return v


def _transition(db: Session, booking: BandBooking, new_status: str, by: str, message: str):
    if booking.status in TERMINAL:
        raise HTTPException(status_code=400, detail=f"Cannot modify a booking in terminal state '{booking.status}'.")
    booking.status = new_status
    crud.append_timeline(booking, new_status, by, message)
    db.commit()
    db.refresh(booking)


# ── Creation (client) ─────────────────────────────────────────────────────────

def create_booking(db: Session, client_id: int, data):
    if not data.artist_profile_id and not data.venue_id:
        raise HTTPException(status_code=400, detail="Either artist_profile_id or venue_id is required.")

    artist_profile_id = None
    venue_id = None

    if data.venue_id:
        venue = db.query(BandVenue).filter(BandVenue.id == data.venue_id).first()
        if not venue:
            raise HTTPException(status_code=404, detail="Venue not found")
        venue_id = venue.id
        # Conflict check (buffer time)
        from app.api.band.venues.service import check_booking_conflict
        conflict, reason = check_booking_conflict(db, venue.account_id, data.event_date, data.start_time, data.end_time)
        if conflict:
            raise HTTPException(status_code=400, detail=reason or "Booking conflicts with existing schedule.")

    if data.artist_profile_id:
        artist = db.query(BandArtistProfile).filter(BandArtistProfile.id == data.artist_profile_id).first()
        if not artist:
            raise HTTPException(status_code=404, detail="Artist not found")
        artist_profile_id = artist.id
        from app.api.band.artists.service import check_availability_conflict
        conflict, reason = check_availability_conflict(db, artist.account_id, data.event_date, data.start_time, data.end_time)
        if conflict:
            raise HTTPException(status_code=400, detail=reason or "Artist is unavailable at the requested time.")

    booking = crud.create(db, client_id, data, artist_profile_id=artist_profile_id, venue_id=venue_id)
    return crud._serialize(booking)


# ── Artist-side ───────────────────────────────────────────────────────────────

def artist_bookings(db: Session, account_id: int, st: str | None, search: str | None, page: int, limit: int):
    profile = _artist_profile_for(db, account_id)
    items, total = crud.list_for_artist(db, profile.id, st, search, limit, (page - 1) * limit)
    return {"items": [crud._serialize(b) for b in items], "total": total}


def artist_action(db: Session, account_id: int, booking_id: int, action: str, counter_price=None, message=None):
    profile = _artist_profile_for(db, account_id)
    booking = crud.get_by_id(db, booking_id)
    if not booking or booking.artist_profile_id != profile.id:
        raise HTTPException(status_code=404, detail="Booking not found")

    if action == "accept":
        _transition(db, booking, "accepted", "artist", message or "Booking accepted by artist")
    elif action == "reject":
        _transition(db, booking, "rejected", "artist", message or "Booking rejected by artist")
    elif action == "counter":
        if counter_price is None:
            raise HTTPException(status_code=400, detail="counter_price is required")
        if booking.status in TERMINAL:
            raise HTTPException(status_code=400, detail="Cannot counter a terminal booking")
        booking.counter_price = counter_price
        _transition(db, booking, "counter_offered", "artist", message or f"Counter offer: {counter_price}")
    elif action == "cancel":
        _transition(db, booking, "cancelled", "artist", message or "Booking cancelled by artist")
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    return crud._serialize(booking)


# ── Venue-side ────────────────────────────────────────────────────────────────

def venue_bookings(db: Session, account_id: int, st: str | None, search: str | None, page: int, limit: int):
    venue = _venue_for(db, account_id)
    items, total = crud.list_for_venue(db, venue.id, st, search, limit, (page - 1) * limit)
    return {"items": [crud._serialize(b) for b in items], "total": total}


def venue_action(db: Session, account_id: int, booking_id: int, action: str, message=None):
    venue = _venue_for(db, account_id)
    booking = crud.get_by_id(db, booking_id)
    if not booking or booking.venue_id != venue.id:
        raise HTTPException(status_code=404, detail="Booking not found")

    if action == "accept":
        _transition(db, booking, "accepted", "venue", message or "Booking accepted by venue")
    elif action == "reject":
        _transition(db, booking, "rejected", "venue", message or "Booking rejected by venue")
    elif action == "complete":
        if booking.status != "accepted":
            raise HTTPException(status_code=400, detail="Only accepted bookings can be completed.")
        _transition(db, booking, "completed", "venue", message or "Booking marked completed")
    elif action == "cancel":
        _transition(db, booking, "cancelled", "venue", message or "Booking cancelled by venue")
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    return crud._serialize(booking)


# ── Client-side ───────────────────────────────────────────────────────────────

def client_bookings(db: Session, client_id: int, st: str | None, page: int, limit: int):
    items, total = crud.list_for_client(db, client_id, st, limit, (page - 1) * limit)
    return {"items": [crud._serialize(b) for b in items], "total": total}


def client_cancel(db: Session, client_id: int, booking_id: int):
    booking = crud.get_by_id(db, booking_id)
    if not booking or booking.client_id != client_id:
        raise HTTPException(status_code=404, detail="Booking not found")
    _transition(db, booking, "cancelled", "client", "Booking cancelled by client")
    return crud._serialize(booking)


def get_details(db: Session, booking_id: int, account_id: int):
    booking = crud.get_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    # Access: client, or owning artist/venue
    allowed = booking.client_id == account_id
    if not allowed and booking.artist_profile_id:
        ap = db.query(BandArtistProfile).filter(BandArtistProfile.id == booking.artist_profile_id).first()
        if ap and ap.account_id == account_id:
            allowed = True
    if not allowed and booking.venue_id:
        v = db.query(BandVenue).filter(BandVenue.id == booking.venue_id).first()
        if v and v.account_id == account_id:
            allowed = True
    if not allowed:
        raise HTTPException(status_code=403, detail="Access denied to this booking")
    return crud._serialize(booking)
