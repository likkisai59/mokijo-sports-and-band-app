"""Band booking router — client create, artist/venue/client actions."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount
from app.api.band.common.deps import get_band_account, require_band_role
from app.api.band.bookings import service

router = APIRouter()


# ── Named routes MUST come before /{booking_id} wildcard to avoid 422 ─────────

@router.get("/band/bookings/client", tags=["Band Bookings"])
def my_bookings(
    status: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    account: BandAccount = Depends(require_band_role("client")),
    db: Session = Depends(get_db),
):
    return service.client_bookings(db, account.id, status, page, limit)


@router.get("/band/bookings/artist", tags=["Band Bookings"])
def artist_bookings(
    status: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    account: BandAccount = Depends(require_band_role("artist")),
    db: Session = Depends(get_db),
):
    return service.artist_bookings(db, account.id, status, search, page, limit)


@router.get("/band/bookings/venue", tags=["Band Bookings"])
def venue_bookings(
    status: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    account: BandAccount = Depends(require_band_role("venue_owner")),
    db: Session = Depends(get_db),
):
    return service.venue_bookings(db, account.id, status, search, page, limit)


# ── Venue actions ─────────────────────────────────────────────────────────────

@router.put("/band/bookings/venue/{booking_id}/accept", tags=["Band Bookings"])
def venue_accept(booking_id: int, account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return service.venue_action(db, account.id, booking_id, "accept")


@router.put("/band/bookings/venue/{booking_id}/reject", tags=["Band Bookings"])
def venue_reject(booking_id: int, account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return service.venue_action(db, account.id, booking_id, "reject")


@router.put("/band/bookings/venue/{booking_id}/complete", tags=["Band Bookings"])
def venue_complete(booking_id: int, account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return service.venue_action(db, account.id, booking_id, "complete")


@router.put("/band/bookings/venue/{booking_id}/cancel", tags=["Band Bookings"])
def venue_cancel(booking_id: int, account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return service.venue_action(db, account.id, booking_id, "cancel")


# ── Create booking ─────────────────────────────────────────────────────────────

@router.post("/band/bookings", status_code=status.HTTP_201_CREATED, tags=["Band Bookings"])
def create_booking(
    payload: schemas.BandBookingCreateRequest,
    account: BandAccount = Depends(require_band_role("client", "admin")),
    db: Session = Depends(get_db),
):
    return service.create_booking(db, account.id, payload)


# ── Wildcard /{booking_id} routes — MUST be declared LAST ────────────────────

@router.get("/band/bookings/{booking_id}", tags=["Band Bookings"])
def get_booking(booking_id: int, account: BandAccount = Depends(get_band_account), db: Session = Depends(get_db)):
    return service.get_details(db, booking_id, account.id)


@router.put("/band/bookings/{booking_id}/cancel", tags=["Band Bookings"])
def cancel_booking(booking_id: int, account: BandAccount = Depends(get_band_account), db: Session = Depends(get_db)):
    return service.client_cancel(db, account.id, booking_id)


@router.put("/band/bookings/{booking_id}/accept", tags=["Band Bookings"])
def artist_accept(booking_id: int, account: BandAccount = Depends(require_band_role("artist")), db: Session = Depends(get_db)):
    return service.artist_action(db, account.id, booking_id, "accept")


@router.put("/band/bookings/{booking_id}/reject", tags=["Band Bookings"])
def artist_reject(booking_id: int, account: BandAccount = Depends(require_band_role("artist")), db: Session = Depends(get_db)):
    return service.artist_action(db, account.id, booking_id, "reject")


@router.put("/band/bookings/{booking_id}/counter", tags=["Band Bookings"])
def artist_counter(
    booking_id: int,
    payload: schemas.BandCounterOfferRequest,
    account: BandAccount = Depends(require_band_role("artist")),
    db: Session = Depends(get_db),
):
    return service.artist_action(db, account.id, booking_id, "counter", payload.counter_price, payload.message)
