from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from uuid import UUID
from typing import List, Tuple, Optional, Dict
from app.features.reviews.models import Review
from app.features.auth.models import User
from app.common.repositories.base import BaseRepository


class ReviewCRUD(BaseRepository[Review]):
    def __init__(self):
        super().__init__(Review)

    def get(self, db: Session, id: UUID) -> Optional[Review]:
        return (
            db.query(Review)
            .options(joinedload(Review.client))
            .filter(Review.id == id, Review.deleted_at.is_(None))
            .first()
        )

    def get_reviews_paginated(
        self,
        db: Session,
        artist_id: Optional[UUID] = None,
        venue_id: Optional[UUID] = None,
        rating: Optional[int] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 10,
    ) -> Tuple[List[Review], int]:
        query = (
            db.query(Review)
            .options(joinedload(Review.client))
            .filter(Review.deleted_at.is_(None))
        )

        if artist_id:
            query = query.filter(Review.artist_profile_id == artist_id)
        elif venue_id:
            query = query.filter(Review.venue_id == venue_id)

        if rating:
            query = query.filter(Review.rating == rating)

        if search:
            query = query.join(Review.client).filter(
                or_(Review.comment.ilike(f"%{search}%"), User.name.ilike(f"%{search}%"))
            )

        total = query.count()
        results = (
            query.order_by(Review.created_at.desc()).offset(offset).limit(limit).all()
        )
        return results, total

    def get_summary_stats(
        self,
        db: Session,
        artist_id: Optional[UUID] = None,
        venue_id: Optional[UUID] = None,
    ) -> Tuple[float, int, Dict[int, int]]:
        query = db.query(func.avg(Review.rating), func.count(Review.id)).filter(
            Review.deleted_at.is_(None)
        )

        if artist_id:
            query = query.filter(Review.artist_profile_id == artist_id)
        elif venue_id:
            query = query.filter(Review.venue_id == venue_id)

        stats = query.first()
        avg_rating = float(stats[0]) if stats[0] else 0.0
        total_reviews = int(stats[1]) if stats[1] else 0

        freq_query = db.query(Review.rating, func.count(Review.id)).filter(
            Review.deleted_at.is_(None)
        )

        if artist_id:
            freq_query = freq_query.filter(Review.artist_profile_id == artist_id)
        elif venue_id:
            freq_query = freq_query.filter(Review.venue_id == venue_id)

        freqs = freq_query.group_by(Review.rating).all()

        distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        for rating, count in freqs:
            distribution[rating] = count

        return avg_rating, total_reviews, distribution

    def get_by_artist(
        self,
        db: Session,
        artist_id: UUID,
        rating: Optional[int] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 10,
    ) -> Tuple[List[Review], int]:
        return self.get_reviews_paginated(
            db,
            artist_id=artist_id,
            rating=rating,
            search=search,
            offset=offset,
            limit=limit,
        )

    def get_summary(
        self, db: Session, artist_id: UUID
    ) -> Tuple[float, int, Dict[int, int]]:
        return self.get_summary_stats(db, artist_id=artist_id)

    def get_by_venue(
        self,
        db: Session,
        venue_id: UUID,
        rating: Optional[int] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 10,
    ) -> Tuple[List[Review], int]:
        return self.get_reviews_paginated(
            db,
            venue_id=venue_id,
            rating=rating,
            search=search,
            offset=offset,
            limit=limit,
        )

    def get_venue_summary(
        self, db: Session, venue_id: UUID
    ) -> Tuple[float, int, Dict[int, int]]:
        return self.get_summary_stats(db, venue_id=venue_id)


review_crud = ReviewCRUD()
