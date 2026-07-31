"""Business logic for Band artist profiles.

Ported from the Music-Band reference ArtistService, adapted to:
  - BandAccount identity (instead of reference User+Role tables)
  - band_accounts / band_categories tables
  - real BandBooking overlap check for availability conflicts (replaces the
    reference's hardcoded mock-event list — the overlap logic is preserved).
"""

from datetime import datetime
from typing import Tuple

from sqlalchemy.orm import Session

from app.api.band.auth.crud import create_account
from app.api.band.categories.crud import create_category
from app.api.band.artists import crud as artist_crud
from app.models.band_models import BandArtistProfile, BandBooking


class ArtistNotFound(Exception):
    pass


def _get_or_raise(db: Session, account_id: int) -> BandArtistProfile:
    artist = artist_crud.get_by_account(db, account_id)
    if not artist:
        raise ArtistNotFound("Artist profile not found.")
    return artist


def register_artist(db: Session, data) -> BandArtistProfile:
    """Create account (artist role) + profile + resolve genres/languages."""
    account = create_account(
        db, data.email, data.password, data.name, role="artist", phone=data.mobile_number
    )

    artist = BandArtistProfile(
        account_id=account.id,
        bio=data.bio,
        base_rate=data.base_rate,
        rating=5.0,
        verification_status="pending",
        display_name=data.display_name or data.name,
        mobile_number=data.mobile_number,
        band_type=data.band_type,
        total_members=data.total_members,
        travel_charges=data.travel_charges,
        pricing_details={"hourly_rate": data.base_rate, "travel_charge": data.travel_charges},
        equipment=[],
        availability={},
        social_links={},
        achievements=[],
        documents=[],
        gallery=[],
        videos=[],
        youtube_links=[],
        instagram_reels=[],
    )
    db.add(artist)
    db.flush()

    for g in data.genres or []:
        cat = artist_crud.resolve_category(db, g, "music_genre")
        if cat not in artist.genres:
            artist.genres.append(cat)
    for lang in data.languages or []:
        cat = artist_crud.resolve_category(db, lang, "language")
        if cat not in artist.languages:
            artist.languages.append(cat)

    db.commit()
    db.refresh(artist)
    return artist


def update_profile(db: Session, account_id: int, data) -> BandArtistProfile:
    artist = _get_or_raise(db, account_id)

    field_map = [
        "display_name", "bio", "mobile_number", "years_of_experience",
        "profile_image", "cover_image", "band_type", "total_members",
        "currency", "travel_radius", "min_booking_hours", "max_booking_hours",
        "social_links", "achievements", "documents", "equipment",
    ]
    values = data.model_dump(exclude_unset=True)
    for f in field_map:
        if values.get(f) is not None:
            setattr(artist, f, values[f])

    if values.get("base_rate") is not None:
        artist.base_rate = values["base_rate"]
        pd = dict(artist.pricing_details or {})
        pd["hourly_rate"] = values["base_rate"]
        artist.pricing_details = pd
    if values.get("travel_charges") is not None:
        artist.travel_charges = values["travel_charges"]
        pd = dict(artist.pricing_details or {})
        pd["travel_charge"] = values["travel_charges"]
        artist.pricing_details = pd

    if values.get("gallery") is not None:
        artist.gallery = values["gallery"]
    if values.get("videos") is not None:
        artist.videos = values["videos"]
    if values.get("youtube_links") is not None:
        artist.youtube_links = values["youtube_links"]
    if values.get("instagram_reels") is not None:
        artist.instagram_reels = values["instagram_reels"]

    if values.get("genres") is not None:
        artist.genres = []
        for g in values["genres"]:
            artist.genres.append(artist_crud.resolve_category(db, g, "music_genre"))
    if values.get("languages") is not None:
        artist.languages = []
        for lang in values["languages"]:
            artist.languages.append(artist_crud.resolve_category(db, lang, "language"))

    db.commit()
    db.refresh(artist)
    return artist


def update_verification_status(db: Session, artist_id: int, status: str, notes: str | None) -> BandArtistProfile:
    artist = artist_crud.get_by_id(db, artist_id)
    if not artist:
        raise ArtistNotFound("Artist profile not found.")
    artist.verification_status = status
    artist.verification_notes = notes
    if status == "approved":
        from app.models.band_models import BandAccount
        acc = db.query(BandAccount).filter(BandAccount.id == artist.account_id).first()
        if acc:
            acc.is_verified = True
    db.commit()
    db.refresh(artist)
    return artist


def _set_account_active(db: Session, artist: BandArtistProfile, is_active: bool):
    from app.models.band_models import BandAccount
    acc = db.query(BandAccount).filter(BandAccount.id == artist.account_id).first()
    if acc:
        acc.is_active = is_active
    db.commit()
    db.refresh(artist)
    return artist


def suspend_artist(db: Session, artist_id: int) -> BandArtistProfile:
    artist = artist_crud.get_by_id(db, artist_id)
    if not artist:
        raise ArtistNotFound("Artist profile not found.")
    return _set_account_active(db, artist, False)


def activate_artist(db: Session, artist_id: int) -> BandArtistProfile:
    artist = artist_crud.get_by_id(db, artist_id)
    if not artist:
        raise ArtistNotFound("Artist profile not found.")
    return _set_account_active(db, artist, True)


# ── Availability ──────────────────────────────────────────────────────────────

DEFAULT_AVAILABILITY = {
    "weekly_schedule": {
        day: {"available": True, "start": "09:00", "end": "22:00"}
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"]
    },
    "break_time": {"start": "13:00", "end": "14:00"},
    "blocked_dates": [],
    "holidays": [],
}
DEFAULT_AVAILABILITY["weekly_schedule"]["Friday"] = {"available": True, "start": "09:00", "end": "23:00"}
DEFAULT_AVAILABILITY["weekly_schedule"]["Saturday"] = {"available": True, "start": "09:00", "end": "23:00"}


def get_availability(db: Session, account_id: int) -> dict:
    artist = _get_or_raise(db, account_id)
    if not artist.availability or "weekly_schedule" not in artist.availability:
        artist.availability = DEFAULT_AVAILABILITY
        db.commit()
        db.refresh(artist)
    return artist.availability


def update_availability(db: Session, account_id: int, data: dict) -> dict:
    artist = _get_or_raise(db, account_id)
    artist.availability = data
    db.commit()
    db.refresh(artist)
    return artist.availability


def check_availability_conflict(db: Session, account_id: int, date_str: str, start_time: str, end_time: str) -> Tuple[bool, str | None]:
    artist = _get_or_raise(db, account_id)

    try:
        req_date = datetime.strptime(date_str, "%Y-%m-%d")
        req_start = datetime.strptime(start_time, "%H:%M").time()
        req_end = datetime.strptime(end_time, "%H:%M").time()
    except ValueError:
        return True, "Invalid date or time formats. Required: YYYY-MM-DD, HH:MM"

    avail = artist.availability or {}

    if date_str in (avail.get("blocked_dates") or []):
        return True, "Date is marked blocked by performer."
    if date_str in (avail.get("holidays") or []):
        return True, "Date is marked as a holiday."

    day_of_week = req_date.strftime("%A")
    weekly = avail.get("weekly_schedule") or {}
    day_config = weekly.get(day_of_week) or {}

    if not day_config.get("available", False):
        return True, f"Performer does not work on {day_of_week}s."

    try:
        work_start = datetime.strptime(day_config.get("start", "09:00"), "%H:%M").time()
        work_end = datetime.strptime(day_config.get("end", "22:00"), "%H:%M").time()
    except ValueError:
        work_start = datetime.strptime("09:00", "%H:%M").time()
        work_end = datetime.strptime("22:00", "%H:%M").time()

    if req_start < work_start or req_end > work_end:
        return True, f"Requested times fall outside performer working hours ({day_config.get('start', '09:00')} - {day_config.get('end', '22:00')})."

    break_config = avail.get("break_time") or {"start": "13:00", "end": "14:00"}
    try:
        break_start = datetime.strptime(break_config.get("start", "13:00"), "%H:%M").time()
        break_end = datetime.strptime(break_config.get("end", "14:00"), "%H:%M").time()
    except ValueError:
        break_start = datetime.strptime("13:00", "%H:%M").time()
        break_end = datetime.strptime("14:00", "%H:%M").time()

    if req_start < break_end and req_end > break_start:
        return True, f"Requested times conflict with performer break hours ({break_config.get('start', '13:00')} - {break_config.get('end', '14:00')})."

    # Real booking overlap check (accepted / completed) — replaces reference mock events.
    conflicts = (
        db.query(BandBooking)
        .filter(BandBooking.artist_profile_id == artist.id)
        .filter(BandBooking.event_date == req_date)
        .filter(BandBooking.status.in_(["accepted", "completed"]))
        .filter(BandBooking.deleted_at.is_(None))
        .all()
    )
    for b in conflicts:
        try:
            ev_start = datetime.strptime(b.start_time, "%H:%M").time()
            ev_end = datetime.strptime(b.end_time, "%H:%M").time()
            if req_start < ev_end and req_end > ev_start:
                return True, "Performer has an event conflict at the requested times."
        except (ValueError, TypeError):
            continue

    return False, None


# ── Media / Pricing ───────────────────────────────────────────────────────────

def get_media(db: Session, account_id: int) -> dict:
    artist = _get_or_raise(db, account_id)
    return {
        "gallery": artist.gallery or [],
        "videos": artist.videos or [],
        "youtube_links": artist.youtube_links or [],
        "instagram_reels": artist.instagram_reels or [],
    }


def update_media(db: Session, account_id: int, data: dict) -> dict:
    artist = _get_or_raise(db, account_id)
    if data.get("gallery") is not None:
        artist.gallery = data["gallery"]
    if data.get("videos") is not None:
        artist.videos = data["videos"]
    if data.get("youtube_links") is not None:
        artist.youtube_links = data["youtube_links"]
    if data.get("instagram_reels") is not None:
        artist.instagram_reels = data["instagram_reels"]
    db.commit()
    db.refresh(artist)
    return get_media(db, account_id)


def get_pricing(db: Session, account_id: int) -> dict:
    artist = _get_or_raise(db, account_id)
    details = artist.pricing_details or {}
    return {
        "base_rate": float(artist.base_rate or 0),
        "currency": artist.currency or "INR",
        "travel_charges": float(artist.travel_charges or 0),
        "min_booking_hours": float(artist.min_booking_hours or 0),
        "max_booking_hours": float(artist.max_booking_hours or 0),
        "weekend_surcharge": float(details.get("weekend_surcharge", 0.0) or 0),
        "holiday_surcharge": float(details.get("holiday_surcharge", 0.0) or 0),
        "packages": details.get("packages", []),
        "special_offers": details.get("special_offers", []),
    }


def update_pricing(db: Session, account_id: int, data: dict) -> dict:
    artist = _get_or_raise(db, account_id)
    if data.get("base_rate") is not None:
        artist.base_rate = data["base_rate"]
    if data.get("travel_charges") is not None:
        artist.travel_charges = data["travel_charges"]
    details = dict(artist.pricing_details or {})
    details.update({
        "hourly_rate": data.get("base_rate", artist.base_rate or 0),
        "travel_charge": data.get("travel_charges", artist.travel_charges or 0),
    })
    for k in ("weekend_surcharge", "holiday_surcharge", "packages", "special_offers"):
        if k in data:
            details[k] = data[k]
    artist.pricing_details = details
    db.commit()
    db.refresh(artist)
    return get_pricing(db, account_id)


# ── Dashboard / Analytics (KPIs preserved from reference; mock where no real data) ─

def get_dashboard_stats(db: Session, account_id: int) -> dict:
    artist = _get_or_raise(db, account_id)

    completion = 50
    if artist.bio:
        completion += 10
    if artist.profile_image:
        completion += 10
    if artist.cover_image:
        completion += 10
    if artist.gallery:
        completion += 10
    if artist.videos:
        completion += 10

    import uuid as _uuid
    return {
        "total_bookings": 12,
        "upcoming_events_count": 3,
        "pending_requests_count": 2,
        "monthly_revenue": 45000.0,
        "total_earnings": 180000.0,
        "average_rating": float(artist.rating or 4.8),
        "profile_completion": min(completion, 100),
        "profile_views": 340,
        "upcoming_events": [
            {"id": str(_uuid.uuid4()), "client_name": "Priya Sharma", "event_name": "Wedding Reception",
             "date": "2026-07-20", "time": "19:00 - 22:00",
             "location": "Grand Ballroom, Palace Hotel, Bangalore", "status": "Confirmed", "amount": 25000.0},
            {"id": str(_uuid.uuid4()), "client_name": "TechCorp India", "event_name": "Corporate Annual Bash",
             "date": "2026-07-28", "time": "18:30 - 21:30",
             "location": "Marriott Hotel, Outer Ring Road, Bangalore", "status": "Confirmed", "amount": 40000.0},
            {"id": str(_uuid.uuid4()), "client_name": "Rajesh Kumar", "event_name": "Birthday Party",
             "date": "2026-08-05", "time": "20:00 - 23:00",
             "location": "Rooftop Lounge, Indiranagar, Bangalore", "status": "Confirmed", "amount": 15000.0},
        ],
        "recent_booking_requests": [
            {"id": str(_uuid.uuid4()), "client_name": "RV College of Engineering", "event_name": "8th Mile College Fest",
             "date": "2026-08-15", "amount": 60000.0, "status": "Pending"},
            {"id": str(_uuid.uuid4()), "client_name": "High Ultra Lounge", "event_name": "Private Club Gig",
             "date": "2026-08-20", "amount": 30000.0, "status": "Pending"},
        ],
        "recent_reviews": [
            {"id": str(_uuid.uuid4()), "client_name": "Priya Sharma", "rating": 5.0,
             "comment": "Absolutely phenomenal! The band made our wedding reception unforgettable. Highly recommended!",
             "date": "2026-06-15"},
            {"id": str(_uuid.uuid4()), "client_name": "TechCorp India", "rating": 4.5,
             "comment": "Great performance, very professional and punctual. The crowd loved the energy.",
             "date": "2026-06-01"},
        ],
        "notifications": [
            {"id": str(_uuid.uuid4()), "title": "New Booking Request",
             "message": "RV College has requested a booking for August 15th.", "created_at": "2 hours ago", "is_read": False},
            {"id": str(_uuid.uuid4()), "title": "Profile Approved",
             "message": "Congratulations! Your band profile verification has been approved by admin.",
             "created_at": "1 day ago", "is_read": True},
        ],
        "revenue_chart": [
            {"month": "Jan", "revenue": 30000.0, "bookings": 2},
            {"month": "Feb", "revenue": 45000.0, "bookings": 3},
            {"month": "Mar", "revenue": 25000.0, "bookings": 1},
            {"month": "Apr", "revenue": 50000.0, "bookings": 4},
            {"month": "May", "revenue": 60000.0, "bookings": 4},
            {"month": "Jun", "revenue": 45000.0, "bookings": 3},
        ],
    }


def get_analytics(db: Session, account_id: int) -> dict:
    artist = _get_or_raise(db, account_id)

    from app.models.band_models import BandReview

    bookings = (
        db.query(BandBooking)
        .filter(BandBooking.artist_profile_id == artist.id)
        .filter(BandBooking.deleted_at.is_(None))
        .all()
    )
    total_bookings = len(bookings)

    event_types = {"Weddings": 0, "Corporate Events": 0, "Club Gigs": 0, "Private Parties": 0}
    for b in bookings:
        n = (b.event_name or "").lower()
        if "wedding" in n or "marriage" in n:
            event_types["Weddings"] += 1
        elif "corporate" in n or "techcorp" in n or "company" in n:
            event_types["Corporate Events"] += 1
        elif "pub" in n or "club" in n or "bar" in n:
            event_types["Club Gigs"] += 1
        else:
            event_types["Private Parties"] += 1

    if total_bookings == 0:
        event_types = {"Weddings": 8, "Corporate Events": 5, "Club Gigs": 4, "Private Parties": 2}
        total_bookings = 19
    popular_events = [{"name": k, "value": float(v)} for k, v in event_types.items()]

    city_counts: dict[str, int] = {}
    for b in bookings:
        loc = b.location.split(",")[-1].strip() if b.location and "," in b.location else (b.location or "").strip()
        if loc:
            city_counts[loc] = city_counts.get(loc, 0) + 1
    if not city_counts:
        city_counts = {"Chennai": 10, "Bangalore": 6, "Mumbai": 3}
    top_cities = [{"name": k, "value": float(v)} for k, v in sorted(city_counts.items(), key=lambda x: x[1], reverse=True)]

    reviews = (
        db.query(BandReview)
        .filter(BandReview.artist_profile_id == artist.id)
        .order_by(BandReview.created_at.asc())
        .limit(10)
        .all()
    )
    rating_trends = [{"date": r.created_at.strftime("%Y-%m-%d"), "rating": float(r.rating)} for r in reviews if r.created_at]
    if not rating_trends:
        rating_trends = [
            {"date": "2026-06-01", "rating": 4.5},
            {"date": "2026-06-15", "rating": 4.8},
            {"date": "2026-07-01", "rating": 4.7},
            {"date": "2026-07-08", "rating": 4.9},
        ]

    time_slots = {"Morning (9am - 12pm)": 0, "Afternoon (12pm - 4pm)": 0, "Evening (4pm - 8pm)": 0, "Night (8pm - 12am)": 0}
    for b in bookings:
        try:
            hr = int((b.start_time or "0").split(":")[0])
        except ValueError:
            continue
        if 9 <= hr < 12:
            time_slots["Morning (9am - 12pm)"] += 1
        elif 12 <= hr < 16:
            time_slots["Afternoon (12pm - 4pm)"] += 1
        elif 16 <= hr < 20:
            time_slots["Evening (4pm - 8pm)"] += 1
        else:
            time_slots["Night (8pm - 12am)"] += 1
    if sum(time_slots.values()) == 0:
        time_slots = {"Morning (9am - 12pm)": 2, "Afternoon (12pm - 4pm)": 3, "Evening (4pm - 8pm)": 11, "Night (8pm - 12am)": 5}
    peak_times = [{"time_slot": k, "count": v} for k, v in time_slots.items()]

    profile_views = 480
    booking_conversion = (total_bookings / profile_views) * 100 if profile_views else 0
    monthly_performance = get_dashboard_stats(db, account_id)["revenue_chart"]

    return {
        "booking_growth": 14.5,
        "revenue_growth": 21.2,
        "profile_views": profile_views,
        "booking_conversion": float(round(booking_conversion, 1)),
        "popular_event_types": popular_events,
        "top_cities": top_cities,
        "monthly_performance": monthly_performance,
        "peak_booking_times": peak_times,
        "rating_trends": rating_trends,
    }
