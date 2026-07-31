from sqlalchemy.orm import Session
from app.models import band_schemas as schemas
from app.models.band_models import BandArtistProfile, BandVenue
from app.api.band.reviews import crud

def _artist_profile_id(db: Session, account_id: int) -> int:
    p = db.query(BandArtistProfile).filter(BandArtistProfile.account_id == account_id).first()
    return p.id if p else 0

def _venue_id(db: Session, account_id: int) -> int:
    v = db.query(BandVenue).filter(BandVenue.account_id == account_id).first()
    return v.id if v else 0

def artist_reviews(db: Session, account_id: int, rating: int | None, search: str | None, page: int, limit: int):
    return crud.summary(db, artist_profile_id=_artist_profile_id(db, account_id),
                        rating=rating, search=search, limit=limit, offset=(page - 1) * limit)

def artist_reply(db: Session, account_id: int, review_id: int, payload: schemas.BandReviewReplyRequest):
    review = crud.reply(db, review_id, payload.reply_comment, account_id, is_venue=False)
    return crud._serialize(review)

def venue_reviews(db: Session, account_id: int, rating: int | None, search: str | None, page: int, limit: int):
    return crud.summary(db, venue_id=_venue_id(db, account_id),
                        rating=rating, search=search, limit=limit, offset=(page - 1) * limit)

def venue_reply(db: Session, account_id: int, review_id: int, payload: schemas.BandReviewReplyRequest):
    review = crud.reply(db, review_id, payload.reply_comment, account_id, is_venue=True)
    return crud._serialize(review)

def public_venue_reviews(db: Session, venue_id: int, rating: int | None, search: str | None, page: int, limit: int):
    return crud.summary(db, venue_id=venue_id, rating=rating, search=search, limit=limit, offset=(page - 1) * limit)

def create_review(db: Session, account_id: int, payload: schemas.BandReviewCreateRequest):
    review = crud.create(db, account_id, payload)
    return crud._serialize(review)
