"""Band artist router — self-service artist endpoints + admin moderation."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount
from app.api.band_common.deps import get_band_account, require_band_admin, require_band_role
from app.api.band_artists import service, crud
from app.api.band_auth.crud import get_account_by_email

router = APIRouter()


def _serialize_or_404(artist):
    if not artist:
        raise HTTPException(status_code=404, detail="Artist profile not found")
    return crud.serialize(artist)


# ── Self-service (artist) ─────────────────────────────────────────────────────

@router.post("/band/artists/register", status_code=status.HTTP_201_CREATED, tags=["Band Artists"])
def register(payload: schemas.BandArtistRegisterRequest, db: Session = Depends(get_db)):
    if get_account_by_email(db, payload.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    artist = service.register_artist(db, payload)
    return _serialize_or_404(artist)


@router.get("/band/artists/me", tags=["Band Artists"])
def get_me(account: BandAccount = Depends(require_band_role("artist")), db: Session = Depends(get_db)):
    return _serialize_or_404(crud.get_by_account(db, account.id))


@router.put("/band/artists/me", tags=["Band Artists"])
def update_me(payload: schemas.BandArtistProfileUpdate,
              account: BandAccount = Depends(require_band_role("artist")),
              db: Session = Depends(get_db)):
    artist = service.update_profile(db, account.id, payload)
    return crud.serialize(artist)


@router.get("/band/artists/me/dashboard", tags=["Band Artists"])
def dashboard(account: BandAccount = Depends(require_band_role("artist")), db: Session = Depends(get_db)):
    return service.get_dashboard_stats(db, account.id)


@router.get("/band/artists/me/availability", tags=["Band Artists"])
def get_availability(account: BandAccount = Depends(require_band_role("artist")), db: Session = Depends(get_db)):
    return service.get_availability(db, account.id)


@router.put("/band/artists/me/availability", tags=["Band Artists"])
def update_availability(payload: schemas.BandAvailabilityUpdate,
                        account: BandAccount = Depends(require_band_role("artist")),
                        db: Session = Depends(get_db)):
    return service.update_availability(db, account.id, payload.model_dump(exclude_unset=True, exclude_none=True))


@router.post("/band/artists/me/availability/check-conflict", response_model=schemas.BandConflictCheckResponse, tags=["Band Artists"])
def check_conflict(payload: schemas.BandConflictCheckRequest,
                   account: BandAccount = Depends(require_band_role("artist")),
                   db: Session = Depends(get_db)):
    conflict, reason = service.check_availability_conflict(db, account.id, payload.date, payload.start_time, payload.end_time)
    return {"conflict": conflict, "reason": reason}


@router.get("/band/artists/me/media", tags=["Band Artists"])
def get_media(account: BandAccount = Depends(require_band_role("artist")), db: Session = Depends(get_db)):
    return service.get_media(db, account.id)


@router.put("/band/artists/me/media", tags=["Band Artists"])
def update_media(payload: schemas.BandMediaUpdate,
                 account: BandAccount = Depends(require_band_role("artist")),
                 db: Session = Depends(get_db)):
    return service.update_media(db, account.id, payload.model_dump(exclude_unset=True, exclude_none=True))


@router.get("/band/artists/me/pricing", tags=["Band Artists"])
def get_pricing(account: BandAccount = Depends(require_band_role("artist")), db: Session = Depends(get_db)):
    return service.get_pricing(db, account.id)


@router.put("/band/artists/me/pricing", tags=["Band Artists"])
def update_pricing(payload: schemas.BandPricingUpdate,
                   account: BandAccount = Depends(require_band_role("artist")),
                   db: Session = Depends(get_db)):
    return service.update_pricing(db, account.id, payload.model_dump(exclude_unset=True))


@router.get("/band/artists/me/analytics", tags=["Band Artists"])
def analytics(account: BandAccount = Depends(require_band_role("artist")), db: Session = Depends(get_db)):
    return service.get_analytics(db, account.id)


# ── Admin moderation ──────────────────────────────────────────────────────────

@router.get("/band/admin/artists", tags=["Band Artists Admin"])
def admin_list(search: str | None = None, verification_status: str | None = None,
               limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0),
               db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    items, total = crud.list_filtered(db, search, verification_status, limit, offset)
    return {"items": [crud.serialize(a) for a in items], "total": total}


@router.get("/band/admin/artists/{artist_id}", tags=["Band Artists Admin"])
def admin_get(artist_id: int, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    return _serialize_or_404(crud.get_by_id(db, artist_id))


@router.put("/band/admin/artists/{artist_id}/verify", tags=["Band Artists Admin"])
def admin_verify(artist_id: int, payload: schemas.BandArtistVerificationUpdate,
                 db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    artist = service.update_verification_status(db, artist_id, payload.verification_status, payload.verification_notes)
    return crud.serialize(artist)


@router.put("/band/admin/artists/{artist_id}/suspend", tags=["Band Artists Admin"])
def admin_suspend(artist_id: int, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    artist = service.suspend_artist(db, artist_id)
    return crud.serialize(artist)


@router.put("/band/admin/artists/{artist_id}/activate", tags=["Band Artists Admin"])
def admin_activate(artist_id: int, db: Session = Depends(get_db), _admin=Depends(require_band_admin)):
    artist = service.activate_artist(db, artist_id)
    return crud.serialize(artist)
