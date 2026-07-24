"""CRUD + serialization for Band bookings."""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.band_models import BandBooking


def get_by_id(db: Session, booking_id: int) -> Optional[BandBooking]:
    return db.query(BandBooking).filter(BandBooking.id == booking_id).filter(BandBooking.deleted_at.is_(None)).first()


def _serialize(b: BandBooking) -> dict:
    return {
        "id": b.id,
        "artist_profile_id": b.artist_profile_id,
        "venue_id": b.venue_id,
        "client_id": b.client_id,
        "event_name": b.event_name,
        "event_date": b.event_date,
        "start_time": b.start_time,
        "end_time": b.end_time,
        "location": b.location,
        "proposed_price": float(b.proposed_price or 0),
        "counter_price": float(b.counter_price) if b.counter_price is not None else None,
        "status": b.status,
        "notes": b.notes,
        "timeline": b.timeline or [],
        "created_at": b.created_at,
    }


def list_for_artist(db: Session, artist_profile_id: int, status: str | None = None,
                    search: str | None = None, limit: int = 20, offset: int = 0):
    q = db.query(BandBooking).filter(
        BandBooking.artist_profile_id == artist_profile_id,
        BandBooking.deleted_at.is_(None),
    )
    if status:
        q = q.filter(BandBooking.status == status)
    if search:
        like = f"%{search.lower()}%"
        q = q.filter(BandBooking.event_name.ilike(like) | BandBooking.location.ilike(like))
    total = q.count()
    items = q.order_by(BandBooking.created_at.desc()).offset(offset).limit(limit).all()
    return items, total


def list_for_venue(db: Session, venue_id: int, status: str | None = None,
                   search: str | None = None, limit: int = 20, offset: int = 0):
    q = db.query(BandBooking).filter(
        BandBooking.venue_id == venue_id,
        BandBooking.deleted_at.is_(None),
    )
    if status:
        q = q.filter(BandBooking.status == status)
    if search:
        like = f"%{search.lower()}%"
        q = q.filter(BandBooking.event_name.ilike(like) | BandBooking.location.ilike(like))
    total = q.count()
    items = q.order_by(BandBooking.created_at.desc()).offset(offset).limit(limit).all()
    return items, total


def list_for_client(db: Session, client_id: int, status: str | None = None,
                    limit: int = 20, offset: int = 0):
    q = db.query(BandBooking).filter(
        BandBooking.client_id == client_id,
        BandBooking.deleted_at.is_(None),
    )
    if status:
        q = q.filter(BandBooking.status == status)
    total = q.count()
    items = q.order_by(BandBooking.created_at.desc()).offset(offset).limit(limit).all()
    return items, total


def create(db: Session, client_id: int, data, artist_profile_id=None, venue_id=None) -> BandBooking:
    event_date = datetime.strptime(data.event_date, "%Y-%m-%d")
    booking = BandBooking(
        artist_profile_id=artist_profile_id,
        venue_id=venue_id,
        client_id=client_id,
        event_name=data.event_name,
        event_date=event_date,
        start_time=data.start_time,
        end_time=data.end_time,
        location=data.location,
        proposed_price=data.proposed_price,
        status="pending",
        notes=data.notes,
        timeline=[
            {
                "status": "pending",
                "timestamp": datetime.utcnow().isoformat(),
                "by": "client",
                "message": "Booking request created",
            }
        ],
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def append_timeline(b: BandBooking, status: str, by: str, message: str):
    timeline = list(b.timeline or [])
    timeline.append({"status": status, "timestamp": datetime.utcnow().isoformat(), "by": by, "message": message})
    b.timeline = timeline
