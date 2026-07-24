"""Band earnings router — artist & venue wallet summaries."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.band_models import BandAccount
from app.api.band_common.deps import require_band_role
from app.api.band_earnings import crud

router = APIRouter()


@router.get("/band/earnings/artist", tags=["Band Earnings"])
def artist_earnings(account: BandAccount = Depends(require_band_role("artist")), db: Session = Depends(get_db)):
    return crud.artist_summary(db, account.id)


@router.get("/band/earnings/venue", tags=["Band Earnings"])
def venue_earnings(account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return crud.venue_summary(db, account.id)
