"""Band reviews router — artist/venue summaries, reply, public read, create."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount
from app.api.band.common.deps import require_band_role
from app.api.band.reviews import service

router = APIRouter()

@router.get("/band/reviews/artist", response_model=schemas.BandReviewSummaryResponse, tags=["Band Reviews"])
def artist_reviews(rating: int | None = None, search: str | None = None,
                   page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
                   account: BandAccount = Depends(require_band_role("artist")), db: Session = Depends(get_db)):
    return service.artist_reviews(db, account.id, rating, search, page, limit)

@router.put("/band/reviews/{review_id}/reply", response_model=schemas.BandReviewResponse, tags=["Band Reviews"])
def artist_reply(review_id: int, payload: schemas.BandReviewReplyRequest,
                 account: BandAccount = Depends(require_band_role("artist")), db: Session = Depends(get_db)):
    return service.artist_reply(db, account.id, review_id, payload)

@router.get("/band/reviews/venue", response_model=schemas.BandReviewSummaryResponse, tags=["Band Reviews"])
def venue_reviews(rating: int | None = None, search: str | None = None,
                  page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
                  account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return service.venue_reviews(db, account.id, rating, search, page, limit)

@router.put("/band/reviews/venue/{review_id}/reply", response_model=schemas.BandReviewResponse, tags=["Band Reviews"])
def venue_reply(review_id: int, payload: schemas.BandReviewReplyRequest,
                account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return service.venue_reply(db, account.id, review_id, payload)

@router.get("/band/reviews/public/venue/{venue_id}", response_model=schemas.BandReviewSummaryResponse, tags=["Band Reviews"])
def public_venue_reviews(venue_id: int, rating: int | None = None, search: str | None = None,
                         page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
                         db: Session = Depends(get_db)):
    return service.public_venue_reviews(db, venue_id, rating, search, page, limit)

@router.post("/band/reviews", response_model=schemas.BandReviewResponse, status_code=201, tags=["Band Reviews"])
def create_review(payload: schemas.BandReviewCreateRequest,
                  account: BandAccount = Depends(require_band_role("client", "admin")),
                  db: Session = Depends(get_db)):
    return service.create_review(db, account.id, payload)
