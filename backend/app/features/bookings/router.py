from typing import Optional
from uuid import UUID

from app.common.schemas.base import SuccessResponse
from app.core.database import get_db
from app.core.dependencies import (
    get_current_artist,
    get_current_client,
    get_current_user,
    get_current_venue_owner,
)
from app.features.bookings.schemas import (
    BookingCreateRequest,
    BookingResponse,
    CounterOfferRequest,
    BookingCancelRequest,
)
from app.features.bookings.service import booking_service
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["Bookings"])


@router.post(
    "",
    response_model=SuccessResponse[BookingResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new booking request (initiated by client)",
)
async def create_booking_request(
    data: BookingCreateRequest,
    current_user_claims: dict = Depends(get_current_client),
    db: Session = Depends(get_db),
):
    """
    Submits a new booking request to the artist. Validates availability slot conflicts first.
    """
    booking = booking_service.create_booking(db, UUID(current_user_claims["sub"]), data)
    return SuccessResponse(
        success=True,
        data=_format_booking(booking),
        message="Booking request created successfully.",
    )


@router.get(
    "/artist",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Get bookings and requests list for the authenticated artist",
)
async def get_artist_bookings_list(
    status: Optional[str] = Query(
        None,
        description="Filter by pending, accepted, rejected, counter_offered, cancelled",
    ),
    search: Optional[str] = Query(
        None, description="Search by client name, event name, or location"
    ),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user_claims: dict = Depends(get_current_artist),
    db: Session = Depends(get_db),
):
    """
    Retrieves a paginated list of incoming booking requests and confirmed bookings for the performer.
    """
    results, total = booking_service.get_artist_bookings(
        db, current_user_claims["sub"], status, search, page, limit
    )
    return SuccessResponse(
        success=True,
        data={
            "bookings": [_format_booking_brief(b) for b in results],
            "total": total,
            "page": page,
            "limit": limit,
        },
        message="Artist bookings list retrieved.",
    )


@router.get(
    "/client",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Get bookings list for the authenticated client",
)
async def get_client_bookings_list(
    status: Optional[str] = Query(
        None,
        description="Filter by pending, accepted, rejected, counter_offered, cancelled, completed",
    ),
    search: Optional[str] = Query(
        None, description="Search by event name or location"
    ),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user_claims: dict = Depends(get_current_client),
    db: Session = Depends(get_db),
):
    """
    Retrieves a paginated list of bookings and requests initiated by the client.
    """
    results, total = booking_service.get_client_bookings(
        db, current_user_claims["sub"], status, search, page, limit
    )
    return SuccessResponse(
        success=True,
        data={
            "bookings": [_format_booking_brief(b) for b in results],
            "total": total,
            "page": page,
            "limit": limit,
        },
        message="Client bookings list retrieved.",
    )


@router.get(
    "/{booking_id}",
    response_model=SuccessResponse[BookingResponse],
    status_code=status.HTTP_200_OK,
    summary="Get booking details including timeline and client details",
)
async def get_booking_details(
    booking_id: UUID,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves full details of a specific booking request. Accessible by client or target artist.
    """
    booking = booking_service.get_booking_details(
        db, current_user_claims["sub"], booking_id
    )
    return SuccessResponse(
        success=True,
        data=_format_booking(booking),
        message="Booking details retrieved.",
    )


@router.put(
    "/{booking_id}/accept",
    response_model=SuccessResponse[BookingResponse],
    status_code=status.HTTP_200_OK,
    summary="Accept an incoming booking request",
)
async def accept_booking_request(
    booking_id: UUID,
    current_user_claims: dict = Depends(get_current_artist),
    db: Session = Depends(get_db),
):
    booking = booking_service.accept_booking(db, current_user_claims["sub"], booking_id)
    return SuccessResponse(
        success=True,
        data=_format_booking(booking),
        message="Booking request accepted successfully.",
    )


@router.put(
    "/{booking_id}/reject",
    response_model=SuccessResponse[BookingResponse],
    status_code=status.HTTP_200_OK,
    summary="Reject an incoming booking request",
)
async def reject_booking_request(
    booking_id: UUID,
    current_user_claims: dict = Depends(get_current_artist),
    db: Session = Depends(get_db),
):
    booking = booking_service.reject_booking(db, current_user_claims["sub"], booking_id)
    return SuccessResponse(
        success=True,
        data=_format_booking(booking),
        message="Booking request rejected successfully.",
    )


@router.put(
    "/{booking_id}/counter",
    response_model=SuccessResponse[BookingResponse],
    status_code=status.HTTP_200_OK,
    summary="Make a price counter offer on the booking request",
)
async def counter_offer_booking_request(
    booking_id: UUID,
    data: CounterOfferRequest,
    current_user_claims: dict = Depends(get_current_artist),
    db: Session = Depends(get_db),
):
    booking = booking_service.counter_offer(
        db, current_user_claims["sub"], booking_id, data.counter_price, data.message
    )
    return SuccessResponse(
        success=True,
        data=_format_booking(booking),
        message="Counter offer placed successfully.",
    )


@router.put(
    "/{booking_id}/cancel",
    response_model=SuccessResponse[BookingResponse],
    status_code=status.HTTP_200_OK,
    summary="Cancel a booking request",
)
async def cancel_booking_request(
    booking_id: UUID,
    data: Optional[BookingCancelRequest] = None,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reason = data.reason if data else None
    booking = booking_service.cancel_booking(db, current_user_claims["sub"], booking_id, reason)
    return SuccessResponse(
        success=True,
        data=_format_booking(booking),
        message="Booking request cancelled.",
    )


@router.get(
    "/venue",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Get bookings and requests list for the authenticated venue owner",
)
async def get_venue_bookings_list(
    status: Optional[str] = Query(
        None, description="Filter by pending, accepted, rejected, cancelled, completed"
    ),
    search: Optional[str] = Query(
        None, description="Search by client name, event name, or location"
    ),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user_claims: dict = Depends(get_current_venue_owner),
    db: Session = Depends(get_db),
):
    """
    Retrieves a paginated list of incoming booking requests and confirmed event reservations for the venue.
    """
    results, total = booking_service.get_venue_bookings(
        db, current_user_claims["sub"], status, search, page, limit
    )
    return SuccessResponse(
        success=True,
        data={
            "bookings": [_format_booking_brief(b) for b in results],
            "total": total,
            "page": page,
            "limit": limit,
        },
        message="Venue bookings list retrieved.",
    )




def _format_booking_brief(b) -> dict:
    def _as_iso(val):
        try:
            return val.isoformat()
        except Exception:
            return str(val)

    def _time_short(val):
        try:
            return val.isoformat()[:5]
        except Exception:
            return str(val)[:5]

    artist_profile = getattr(b, "artist_profile", None)
    artist_name = getattr(artist_profile, "display_name", None) if artist_profile else None
    venue = getattr(b, "venue", None)
    venue_name = getattr(venue, "name", None) if venue else None

    return {
        "id": str(b.id),
        "event_name": b.event_name,
        "event_date": _as_iso(b.event_date),
        "start_time": _time_short(b.start_time),
        "end_time": _time_short(b.end_time),
        "proposed_price": float(b.proposed_price),
        "counter_price": float(b.counter_price) if b.counter_price else None,
        "status": b.status,
        "created_at": _as_iso(b.created_at),
        "artist_profile_id": str(b.artist_profile_id) if b.artist_profile_id else None,
        "venue_id": str(b.venue_id) if b.venue_id else None,
        "artist_name": artist_name,
        "venue_name": venue_name,
    }


def _timeline_entry_to_dict(entry) -> dict:
    """Convert a timeline entry (dict, ORM object, or SimpleNamespace) to a plain dict."""
    if isinstance(entry, dict):
        status_val = entry.get("status")
        message_val = entry.get("message")
        by_val = entry.get("created_by_role") or entry.get("by")
        timestamp_val = entry.get("created_at") or entry.get("timestamp")
        return {
            "id": entry.get("id"),
            "status": status_val,
            "message": message_val,
            "event_type": entry.get("event_type") or status_val,
            "created_by_role": by_val,
            "created_at": timestamp_val,
            "timestamp": timestamp_val,
            "by": by_val,
        }
    # Handle ORM models and SimpleNamespace objects via getattr
    status_val = getattr(entry, "status", None)
    timestamp_val = getattr(entry, "created_at", None) or getattr(entry, "timestamp", "")
    by_val = getattr(entry, "created_by_role", None) or getattr(entry, "by", "")
    return {
        "id": getattr(entry, "id", None),
        "status": status_val,
        "message": getattr(entry, "message", None),
        "event_type": getattr(entry, "event_type", None) or status_val,
        "created_by_role": by_val,
        "created_at": str(timestamp_val),
        "timestamp": str(timestamp_val),
        "by": str(by_val),
    }


def _format_booking(b) -> dict:
    # Resolve timeline: prefer the `timeline` JSON column (list of dicts from accept/reject methods),
    # then fall back to `timeline_events` (ORM relationship rows).
    raw_timeline = getattr(b, "timeline", None) or getattr(b, "timeline_events", None) or []
    timeline = [_timeline_entry_to_dict(e) for e in raw_timeline]

    artist_profile = getattr(b, "artist_profile", None)
    artist_data = None
    if artist_profile:
        artist_data = {
            "id": str(artist_profile.id),
            "display_name": artist_profile.display_name,
            "bio": getattr(artist_profile, "bio", None),
            "base_rate": float(artist_profile.base_rate),
            "rating": float(artist_profile.rating) if getattr(artist_profile, "rating", None) else 0.0,
        }

    venue = getattr(b, "venue", None)
    venue_data = None
    if venue:
        venue_data = {
            "id": str(venue.id),
            "name": venue.name,
            "address": venue.address,
            "capacity": venue.capacity,
            "base_price": float(venue.base_price),
        }

    return {
        **_format_booking_brief(b),
        "location": getattr(b, "location", None),
        "notes": getattr(b, "notes", None),
        "client": {
            "id": str(b.client.id),
            "name": b.client.name,
            "email": b.client.email,
        },
        "artist": artist_data,
        "venue": venue_data,
        "timeline": timeline,
        "updated_at": (
            b.updated_at.isoformat()
            if hasattr(b, "updated_at") and hasattr(b.updated_at, "isoformat")
            else str(getattr(b, "updated_at", ""))
        ),
    }
