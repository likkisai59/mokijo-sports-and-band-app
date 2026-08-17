"""Band Bookings Router — booking inquiry lifecycle, provider acceptance, and availability checks."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount
from app.api.band.common.deps import get_band_account
from app.api.band.bookings import service

router = APIRouter(prefix="/band/bookings", tags=["Band Bookings"])


@router.post(
    "/check-availability",
    response_model=schemas.BandConflictCheckResponse,
)
def check_availability(
    payload: schemas.BandConflictCheckRequest,
    artist_profile_id: Optional[int] = Query(None),
    venue_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """Check whether a performer or venue is free during a specific date and time window."""
    return service.check_availability(
        db=db,
        artist_profile_id=artist_profile_id,
        venue_id=venue_id,
        event_date_str=payload.date,
        start_time=payload.start_time,
        end_time=payload.end_time,
    )


@router.post(
    "",
    response_model=schemas.BandBookingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_booking(
    payload: schemas.BandBookingCreateRequest,
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Initiate a new booking inquiry with an artist or venue."""
    return service.create_booking_inquiry(db, account, payload)


@router.get(
    "/my",
    response_model=schemas.BandPaginatedBookingList,
)
def get_my_bookings(
    status: Optional[str] = Query(None, description="pending|accepted|counter_offered|confirmed|completed|cancelled|rejected"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Retrieve bookings for the currently authenticated user based on role."""
    return service.get_user_bookings(db, account, status_filter=status, limit=limit, offset=offset)


@router.get(
    "/{booking_id}",
    response_model=schemas.BandBookingResponse,
)
def get_booking_detail(
    booking_id: int,
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Retrieve complete booking detail including status timeline."""
    return service.get_booking_detail(db, account, booking_id)


@router.post(
    "/{booking_id}/accept",
    response_model=schemas.BandBookingResponse,
)
def accept_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Provider accepts the booking inquiry."""
    return service.accept_booking(db, account, booking_id)


@router.post(
    "/{booking_id}/counter",
    response_model=schemas.BandBookingResponse,
)
def counter_offer(
    booking_id: int,
    payload: schemas.BandCounterOfferRequest,
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Provider proposes a counter-offer price with note."""
    return service.counter_offer(db, account, booking_id, payload)


@router.post(
    "/{booking_id}/decline",
    response_model=schemas.BandBookingResponse,
)
def decline_booking(
    booking_id: int,
    reason: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Provider declines the booking inquiry."""
    return service.decline_booking(db, account, booking_id, reason)


@router.post(
    "/{booking_id}/cancel",
    response_model=schemas.BandBookingResponse,
)
def cancel_booking(
    booking_id: int,
    reason: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Client cancels the booking inquiry."""
    return service.cancel_booking(db, account, booking_id, reason)
