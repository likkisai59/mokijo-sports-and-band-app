"""
Database CRUD repository operations for Venue listings.
"""

from typing import Optional, Tuple, List, Any
from sqlalchemy.orm import Session, joinedload
from app.common.repositories.base import BaseRepository
from app.features.venues.models import Venue
from app.features.locations.models import City
from app.features.auth.models import User


class VenueCRUD(BaseRepository[Venue]):
    def __init__(self):
        super().__init__(Venue)

    def get_by_user_id(self, db: Session, user_id: Any) -> List[Venue]:
        """Fetch all active venues registered under the given user UUID."""
        if isinstance(user_id, str):
            from uuid import UUID as PyUUID
            try:
                user_id = PyUUID(user_id)
            except ValueError:
                pass
        return (
            db.query(Venue)
            .filter(
                Venue.user_id == user_id,
                Venue.deleted_at.is_(None)
            )
            .all()
        )

    def get_filtered_venues(
        self,
        db: Session,
        search: Optional[str] = None,
        verification_status: Optional[str] = None,
        limit: int = 10,
        offset: int = 0
    ) -> Tuple[List[Venue], int]:
        """Fetch venues joining user and city tables with eager loading categories."""
        query = (
            db.query(Venue)
            .join(Venue.user)
            .join(Venue.city)
            .options(
                joinedload(Venue.user),
                joinedload(Venue.city),
                joinedload(Venue.categories)
            )
            .filter(Venue.deleted_at.is_(None))
        )

        if search:
            query = query.filter(
                (Venue.name.ilike(f"%{search}%")) |
                (City.name.ilike(f"%{search}%")) |
                (User.name.ilike(f"%{search}%"))
            )

        if verification_status and verification_status != "all":
            query = query.filter(Venue.verification_status == verification_status)

        total_count = query.count()
        results = query.offset(offset).limit(limit).all()
        return results, total_count
