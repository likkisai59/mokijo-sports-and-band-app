"""
Database CRUD repository operations for Artist profiles.
"""

from typing import Optional, Tuple, List, Any
from sqlalchemy.orm import Session, joinedload
from app.common.repositories.base import BaseRepository
from app.features.artists.models import ArtistProfile
from app.features.auth.models import User


class ArtistProfileCRUD(BaseRepository[ArtistProfile]):
    def __init__(self):
        super().__init__(ArtistProfile)

    def get_filtered_artists(
        self,
        db: Session,
        search: Optional[str] = None,
        verification_status: Optional[str] = None,
        limit: int = 10,
        offset: int = 0
    ) -> Tuple[List[ArtistProfile], int]:
        """Fetch artist profiles joining user and eager-loading categories relationships."""
        query = (
            db.query(ArtistProfile)
            .join(ArtistProfile.user)
            .options(
                joinedload(ArtistProfile.user),
                joinedload(ArtistProfile.genres),
                joinedload(ArtistProfile.languages)
            )
            .filter(ArtistProfile.deleted_at.is_(None))
        )

        if search:
            query = query.filter(
                (User.name.ilike(f"%{search}%")) |
                (User.email.ilike(f"%{search}%")) |
                (ArtistProfile.bio.ilike(f"%{search}%"))
            )

        if verification_status and verification_status != "all":
            query = query.filter(ArtistProfile.verification_status == verification_status)

        total_count = query.count()
        results = query.offset(offset).limit(limit).all()
        return results, total_count

    def get_by_user_id(self, db: Session, user_id: Any) -> Optional[ArtistProfile]:
        if isinstance(user_id, str):
            from uuid import UUID as PyUUID
            try:
                user_id = PyUUID(user_id)
            except ValueError:
                pass
        return (
            db.query(ArtistProfile)
            .options(
                joinedload(ArtistProfile.genres),
                joinedload(ArtistProfile.languages)
            )
            .filter(
                ArtistProfile.user_id == user_id,
                ArtistProfile.deleted_at.is_(None)
            )
            .first()
        )
