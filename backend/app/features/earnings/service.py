from sqlalchemy.orm import Session
from app.features.earnings.crud import transaction_crud
from app.features.artists.crud import ArtistProfileCRUD
from app.core.exceptions import NotFoundException

class EarningsService:
    def __init__(self):
        self.artist_crud = ArtistProfileCRUD()

    def get_artist_profile(self, db: Session, user_id: str):
        artist = self.artist_crud.get_by_user_id(db, user_id)
        if not artist:
            raise NotFoundException("Artist profile not found.")
        return artist

    def get_artist_earnings_summary(self, db: Session, user_id: str) -> dict:
        artist = self.get_artist_profile(db, user_id)
        transaction_crud.seed_mock_transactions_if_empty(db, artist.id)
        stats = transaction_crud.get_summary_stats(db, artist.id)
        tx_history = transaction_crud.get_by_artist(db, artist.id, offset=0, limit=20)
        
        return {
            **stats,
            "transactions": tx_history
        }

    def get_venue_profile(self, db: Session, user_id: str):
        from app.features.venues.crud import VenueCRUD
        venues = VenueCRUD().get_by_user_id(db, user_id)
        if not venues:
            raise NotFoundException("Venue profile not found.")
        return venues[0]

    def get_venue_earnings_summary(self, db: Session, user_id: str) -> dict:
        venue = self.get_venue_profile(db, user_id)
        transaction_crud.seed_venue_mock_transactions_if_empty(db, venue.id)
        stats = transaction_crud.get_venue_summary_stats(db, venue.id)
        tx_history = transaction_crud.get_by_venue(db, venue.id, offset=0, limit=20)
        
        return {
            **stats,
            "transactions": tx_history
        }

earnings_service = EarningsService()

