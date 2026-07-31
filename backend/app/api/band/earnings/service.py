from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.api.band.earnings import crud
from app.models.band_models import BandArtistProfile, BandVenue

def artist_earnings(db: Session, account_id: int):
    profile = db.query(BandArtistProfile).filter(BandArtistProfile.account_id == account_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Artist profile not found")
    
    count = crud.get_transaction_count_for_artist(db, profile.id)
    if count == 0:
        crud.seed_mock_transactions(db, artist_profile_id=profile.id)
    
    stats = crud.get_summary_core(db, artist_profile_id=profile.id)
    txns = crud.get_recent_transactions_for_artist(db, profile.id, limit=20)
    stats["recent_transactions"] = txns
    return stats

def venue_earnings(db: Session, account_id: int):
    venue = db.query(BandVenue).filter(BandVenue.account_id == account_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    
    count = crud.get_transaction_count_for_venue(db, venue.id)
    if count == 0:
        crud.seed_mock_transactions(db, venue_id=venue.id)
    
    stats = crud.get_summary_core(db, venue_id=venue.id)
    txns = crud.get_recent_transactions_for_venue(db, venue.id, limit=20)
    stats["recent_transactions"] = txns
    return stats
