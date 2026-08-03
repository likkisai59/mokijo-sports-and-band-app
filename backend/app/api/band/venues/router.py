"""Band venue router — self-service venue endpoints, upload, admin moderation."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount, BandVenue
from app.api.band.common.deps import get_band_account, require_band_admin, require_band_role
from app.api.band.common.storage import save_upload
from app.api.band.venues import service, crud
from app.api.band.auth.crud import get_account_by_email

router = APIRouter()


def _serialize_or_404(venue):
    if not venue:
        raise HTTPException(status_code=404, detail="Venue profile not found")
    return crud.serialize(venue)


# ── Public (venues) ───────────────────────────────────────────────────────────

@router.get("/band/venues", tags=["Band Venues"])
def public_list(search: str | None = None, city: str | None = None,
                min_capacity: int | None = None, max_price: float | None = None,
                limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0), 
                db: Session = Depends(get_db)):
    """Public venue list (no auth)."""
    items, total = crud.list_public_filtered(
        db, search, city, min_capacity, max_price, limit, offset
    )
    return {"venues": [crud.serialize(v) for v in items], "total": total}


# ── Self-service (venue owner) ────────────────────────────────────────────────

@router.post("/band/venues/register", status_code=status.HTTP_201_CREATED, tags=["Band Venues"])
def register(payload: schemas.BandVenueRegisterRequest, db: Session = Depends(get_db)):
    if get_account_by_email(db, payload.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    venue = service.register_venue(db, payload)
    return _serialize_or_404(venue)


@router.post("/band/venues/upload", tags=["Band Venues"])
def upload_image(file: UploadFile = File(...)):
    return {"url": save_upload(file, subfolder="venues")}


@router.get("/band/venues/me", tags=["Band Venues"])
def get_me(account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return _serialize_or_404(crud.get_by_account(db, account.id))


@router.put("/band/venues/me", tags=["Band Venues"])
def update_me(payload: schemas.BandVenueProfileUpdate,
              account: BandAccount = Depends(require_band_role("venue_owner")),
              db: Session = Depends(get_db)):
    return crud.serialize(service.update_profile(db, account.id, payload))


@router.get("/band/venues/me/dashboard", tags=["Band Venues"])
def dashboard(account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return service.get_dashboard_stats(db, account.id)


@router.get("/band/venues/me/media", tags=["Band Venues"])
def get_media(account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return service.get_media(db, account.id)


@router.put("/band/venues/me/media", tags=["Band Venues"])
def update_media(payload: schemas.BandVenueMediaUpdate,
                 account: BandAccount = Depends(require_band_role("venue_owner")),
                 db: Session = Depends(get_db)):
    return service.update_media(db, account.id, payload.model_dump(exclude_unset=True, exclude_none=True))


@router.get("/band/venues/me/facilities", tags=["Band Venues"])
def get_facilities(account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return service.get_facilities(db, account.id)


@router.put("/band/venues/me/facilities", tags=["Band Venues"])
def update_facilities(payload: schemas.BandVenueFacilitiesUpdate,
                      account: BandAccount = Depends(require_band_role("venue_owner")),
                      db: Session = Depends(get_db)):
    return service.update_facilities(db, account.id, payload.facilities)


@router.get("/band/venues/me/pricing", tags=["Band Venues"])
def get_pricing(account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return service.get_pricing(db, account.id)


@router.put("/band/venues/me/pricing", tags=["Band Venues"])
def update_pricing(payload: schemas.BandVenuePricingUpdate,
                   account: BandAccount = Depends(require_band_role("venue_owner")),
                   db: Session = Depends(get_db)):
    return service.update_pricing(db, account.id, payload.model_dump(exclude_unset=True))


@router.get("/band/venues/me/availability", tags=["Band Venues"])
def get_availability(account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return service.get_availability(db, account.id)


@router.put("/band/venues/me/availability", tags=["Band Venues"])
def update_availability(payload: schemas.BandVenueAvailabilityUpdate,
                        account: BandAccount = Depends(require_band_role("venue_owner")),
                        db: Session = Depends(get_db)):
    return service.update_availability(db, account.id, payload.model_dump(exclude_unset=True, exclude_none=True))


@router.post("/band/venues/me/availability/check-conflict", response_model=schemas.BandConflictCheckResponse, tags=["Band Venues"])
def check_conflict(payload: schemas.BandConflictCheckRequest,
                   account: BandAccount = Depends(require_band_role("venue_owner")),
                   db: Session = Depends(get_db)):
    conflict, reason = service.check_booking_conflict(db, account.id, payload.date, payload.start_time, payload.end_time)
    return {"conflict": conflict, "reason": reason}


@router.get("/band/venues/me/analytics", tags=["Band Venues"])
def analytics(account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return service.get_analytics(db, account.id)


@router.put("/band/venues/me/verification/resubmit", tags=["Band Venues"])
def resubmit_verification(payload: schemas.BandVenueMediaUpdate,
                           account: BandAccount = Depends(require_band_role("venue_owner")),
                           db: Session = Depends(get_db)):
    # Accept arbitrary documents dict via gallery field fallback
    documents = {"items": payload.gallery or []}
    return crud.serialize(service.resubmit_verification_documents(db, account.id, documents))


@router.put("/band/venues/me/settings", tags=["Band Venues"])
def update_settings(payload: schemas.BandVenueSettingsUpdate,
                    account: BandAccount = Depends(require_band_role("venue_owner")),
                    db: Session = Depends(get_db)):
    return service.update_settings(db, account.id, payload.model_dump(exclude_unset=True, exclude_none=True))


@router.get("/band/venues/{venue_id}", tags=["Band Venues"])
def public_get(venue_id: int, db: Session = Depends(get_db)):
    """Public venue detail (no auth)."""
    return _serialize_or_404(crud.get_by_id(db, venue_id))


# ── Admin ─────────────────────────────────────────────────────────────────────

@router.get("/band/admin/venues", tags=["Band Venues Admin"])
def admin_list(search: str | None = None, verification_status: str | None = None,
               limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0),
               db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    items, total = crud.list_filtered(db, search, verification_status, limit, offset)
    return {"items": [crud.serialize(v) for v in items], "total": total}


@router.get("/band/admin/venues/{venue_id}", tags=["Band Venues Admin"])
def admin_get(venue_id: int, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    return _serialize_or_404(crud.get_by_id(db, venue_id))


@router.put("/band/admin/venues/{venue_id}/verify", tags=["Band Venues Admin"])
def admin_verify(venue_id: int, payload: schemas.BandVenueVerificationUpdate,
                 db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    venue = service.update_verification_status(db, venue_id, payload.verification_status, payload.verification_notes)
    return crud.serialize(venue)


@router.put("/band/admin/venues/{venue_id}/suspend", tags=["Band Venues Admin"])
def admin_suspend(venue_id: int, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    venue = crud.get_by_id(db, venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return crud.serialize(service._set_account_active(db, venue, False))


@router.put("/band/admin/venues/{venue_id}/activate", tags=["Band Venues Admin"])
def admin_activate(venue_id: int, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    venue = crud.get_by_id(db, venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return crud.serialize(service._set_account_active(db, venue, True))
