"""Band reviews router — artist/venue summaries, reply, public read, create."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import band_schemas as schemas
from app.models.band_models import BandAccount, BandArtistProfile, BandVenue
from app.api.band_common.deps import get_band_account, require_band_role
from app.api.band_reviews import crud

router = APIRouter()


def _artist_profile_id(db: Session, account_id: int) -> int:
    p = db.query(BandArtistProfile).filter(BandArtistProfile.account_id == account_id).first()
    return p.id if p else 0


def _venue_id(db: Session, account_id: int) -> int:
    v = db.query(BandVenue).filter(BandVenue.account_id == account_id).first()
    return v.id if v else 0


@router.get("/band/reviews/artist", response_model=schemas.BandReviewSummaryResponse, tags=["Band Reviews"])
def artist_reviews(rating: int | None = None, search: str | None = None,
                   page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
                   account: BandAccount = Depends(require_band_role("artist")), db: Session = Depends(get_db)):
    return crud.summary(db, artist_profile_id=_artist_profile_id(db, account.id),
                        rating=rating, search=search, limit=limit, offset=(page - 1) * limit)


@router.put("/band/reviews/{review_id}/reply", response_model=schemas.BandReviewResponse, tags=["Band Reviews"])
def artist_reply(review_id: int, payload: schemas.BandReviewReplyRequest,
                 account: BandAccount = Depends(require_band_role("artist")), db: Session = Depends(get_db)):
    review = crud.reply(db, review_id, payload.reply_comment, account.id, is_venue=False)
    return crud._serialize(review)


@router.get("/band/reviews/venue", response_model=schemas.BandReviewSummaryResponse, tags=["Band Reviews"])
def venue_reviews(rating: int | None = None, search: str | None = None,
                  page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
                  account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    return crud.summary(db, venue_id=_venue_id(db, account.id),
                        rating=rating, search=search, limit=limit, offset=(page - 1) * limit)


@router.put("/band/reviews/venue/{review_id}/reply", response_model=schemas.BandReviewResponse, tags=["Band Reviews"])
def venue_reply(review_id: int, payload: schemas.BandReviewReplyRequest,
                account: BandAccount = Depends(require_band_role("venue_owner")), db: Session = Depends(get_db)):
    review = crud.reply(db, review_id, payload.reply_comment, account.id, is_venue=True)
    return crud._serialize(review)


@router.get("/band/reviews/public/venue/{venue_id}", response_model=schemas.BandReviewSummaryResponse, tags=["Band Reviews"])
def public_venue_reviews(venue_id: int, rating: int | None = None, search: str | None = None,
                         page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
                         db: Session = Depends(get_db)):
    return crud.summary(db, venue_id=venue_id, rating=rating, search=search, limit=limit, offset=(page - 1) * limit)


@router.post("/band/reviews", response_model=schemas.BandReviewResponse, status_code=201, tags=["Band Reviews"])
def create_review(payload: schemas.BandReviewCreateRequest,
                  account: BandAccount = Depends(require_band_role("client", "admin")),
                  db: Session = Depends(get_db)):
    review = crud.create(db, account.id, payload)
    return crud._serialize(review)
