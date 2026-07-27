from typing import List, Optional, Tuple, Dict
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy import func, desc, asc
from sqlalchemy.orm import Session, joinedload
from app.common.repositories.base import BaseRepository
from app.features.reviews.models import Review, ReviewReport, ReviewModerationHistory
from app.features.reviews.schemas import ReviewFilters
from app.features.artists.models import ArtistProfile
from app.features.venues.models import Venue
from app.features.auth.models import User


class ReviewRepository(BaseRepository[Review]):
    """
    Repository pattern implementation for Review entities.
    Strictly handles database interactions: CRUD, SQL aggregation, filtering, sorting, lookup.
    No business logic.
    """

    def __init__(self):
        super().__init__(Review)

    def get_by_id(self, db: Session, review_id: UUID) -> Optional[Review]:
        """Retrieves a single active review by ID."""
        return (
            db.query(Review)
            .options(
                joinedload(Review.reviewer),
                joinedload(Review.reviewee),
                joinedload(Review.client),
                joinedload(Review.artist_profile),
                joinedload(Review.venue),
            )
            .filter(Review.id == review_id, Review.deleted_at.is_(None))
            .first()
        )

    def get_by_booking(self, db: Session, booking_id: UUID) -> List[Review]:
        """Retrieves all non-deleted public reviews associated with a specific booking."""
        return (
            db.query(Review)
            .options(
                joinedload(Review.reviewer),
                joinedload(Review.reviewee),
                joinedload(Review.client),
            )
            .filter(
                Review.booking_id == booking_id,
                Review.deleted_at.is_(None),
                Review.moderation_status == "public",
            )
            .all()
        )

    def find_existing_review(
        self,
        db: Session,
        booking_id: UUID,
        reviewer_id: UUID,
        reviewee_id: Optional[UUID] = None,
    ) -> Optional[Review]:
        """Looks up an active review for a specific booking and reviewer (and optional reviewee)."""
        query = db.query(Review).filter(
            Review.booking_id == booking_id,
            (Review.reviewer_id == reviewer_id) | (Review.client_id == reviewer_id),
            Review.deleted_at.is_(None),
        )
        if reviewee_id:
            query = query.filter(
                (Review.reviewee_id == reviewee_id)
                | (Review.artist_profile_id == reviewee_id)
                | (Review.venue_id == reviewee_id)
            )
        return query.first()

    def has_user_reviewed_booking(
        self,
        db: Session,
        booking_id: UUID,
        reviewer_id: UUID,
        reviewee_id: Optional[UUID] = None,
    ) -> bool:
        """Returns True if a review has already been submitted for this direction."""
        return (
            self.find_existing_review(db, booking_id, reviewer_id, reviewee_id)
            is not None
        )

    def get_by_reviewer(
        self, db: Session, reviewer_id: UUID, offset: int = 0, limit: int = 20
    ) -> Tuple[List[Review], int]:
        """Retrieves paginated reviews written by a specific reviewer."""
        query = (
            db.query(Review)
            .options(
                joinedload(Review.reviewer),
                joinedload(Review.reviewee),
                joinedload(Review.client),
            )
            .filter(
                (Review.reviewer_id == reviewer_id) | (Review.client_id == reviewer_id),
                Review.deleted_at.is_(None),
            )
        )
        total = query.count()
        items = (
            query.order_by(Review.created_at.desc()).offset(offset).limit(limit).all()
        )
        return items, total

    def get_by_reviewee(
        self,
        db: Session,
        reviewee_id: UUID,
        offset: int = 0,
        limit: int = 20,
        include_non_public: bool = False,
    ) -> Tuple[List[Review], int]:
        """Retrieves paginated reviews received by a specific reviewee user/entity."""
        query = (
            db.query(Review)
            .options(
                joinedload(Review.reviewer),
                joinedload(Review.reviewee),
                joinedload(Review.client),
            )
            .filter(
                (Review.reviewee_id == reviewee_id)
                | (Review.artist_profile_id == reviewee_id)
                | (Review.venue_id == reviewee_id),
                Review.deleted_at.is_(None),
            )
        )
        if not include_non_public:
            query = query.filter(Review.moderation_status == "public")

        total = query.count()
        items = (
            query.order_by(Review.created_at.desc()).offset(offset).limit(limit).all()
        )
        return items, total

    def filter_reviews(
        self,
        db: Session,
        filters: Optional[ReviewFilters] = None,
        offset: int = 0,
        limit: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        is_admin: bool = False,
    ) -> Tuple[List[Review], int]:
        """Applies filters, pagination, and sorting to list reviews."""
        query = (
            db.query(Review)
            .options(
                joinedload(Review.reviewer),
                joinedload(Review.reviewee),
                joinedload(Review.client),
            )
            .filter(Review.deleted_at.is_(None))
        )

        # Filter moderation status: Non-admins only see "public" reviews unless specified
        if filters and filters.moderation_status:
            if filters.moderation_status.lower() != "all":
                query = query.filter(
                    Review.moderation_status == filters.moderation_status
                )
        elif not is_admin:
            query = query.filter(Review.moderation_status == "public")

        if filters:
            if filters.booking_id:
                query = query.filter(Review.booking_id == filters.booking_id)
            if filters.reviewer_id:
                query = query.filter(
                    (Review.reviewer_id == filters.reviewer_id)
                    | (Review.client_id == filters.reviewer_id)
                )
            if filters.reviewee_id:
                query = query.filter(
                    (Review.reviewee_id == filters.reviewee_id)
                    | (Review.artist_profile_id == filters.reviewee_id)
                    | (Review.venue_id == filters.reviewee_id)
                )
            if filters.artist_profile_id:
                query = query.filter(
                    Review.artist_profile_id == filters.artist_profile_id
                )
            if filters.venue_id:
                query = query.filter(Review.venue_id == filters.venue_id)
            if filters.rating is not None:
                query = query.filter(Review.rating == filters.rating)
            if filters.is_public is not None:
                query = query.filter(Review.is_public.is_(filters.is_public))
            if filters.search:
                search_term = f"%{filters.search}%"
                query = query.filter(
                    (Review.review_title.ilike(search_term))
                    | (Review.review_text.ilike(search_term))
                    | (Review.comment.ilike(search_term))
                )

        total = query.count()

        sort_col = getattr(Review, sort_by, Review.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(sort_col.asc())
        else:
            query = query.order_by(sort_col.desc())

        items = query.offset(offset).limit(limit).all()
        return items, total

    # ─── ANALYTICS SQL AGGREGATION METHODS (PHASE 4) ──────────────────────────

    def get_average_rating(
        self, db: Session, target_id: Optional[UUID] = None
    ) -> float:
        """Computes overall average rating score using SQL func.avg."""
        query = db.query(func.avg(Review.rating)).filter(
            Review.deleted_at.is_(None), Review.moderation_status == "public"
        )
        if target_id:
            query = query.filter(
                (Review.reviewee_id == target_id)
                | (Review.artist_profile_id == target_id)
                | (Review.venue_id == target_id)
                | (Review.reviewer_id == target_id)
            )
        result = query.scalar()
        return round(float(result), 2) if result is not None else 0.0

    def get_rating_distribution(
        self, db: Session, target_id: Optional[UUID] = None
    ) -> Dict[int, int]:
        """Computes 1-5 star breakdown distribution in a single GROUP BY query."""
        query = db.query(Review.rating, func.count(Review.id)).filter(
            Review.deleted_at.is_(None), Review.moderation_status == "public"
        )
        if target_id:
            query = query.filter(
                (Review.reviewee_id == target_id)
                | (Review.artist_profile_id == target_id)
                | (Review.venue_id == target_id)
                | (Review.reviewer_id == target_id)
            )
        counts = query.group_by(Review.rating).all()
        dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for rating_val, count_val in counts:
            if rating_val in dist:
                dist[rating_val] = count_val
        return dist

    def get_recent_reviews(
        self, db: Session, target_id: Optional[UUID] = None, limit: int = 5
    ) -> List[Review]:
        """Fetches latest non-deleted public reviews."""
        query = (
            db.query(Review)
            .options(
                joinedload(Review.reviewer),
                joinedload(Review.reviewee),
                joinedload(Review.client),
            )
            .filter(Review.deleted_at.is_(None), Review.moderation_status == "public")
        )

        if target_id:
            query = query.filter(
                (Review.reviewee_id == target_id)
                | (Review.artist_profile_id == target_id)
                | (Review.venue_id == target_id)
                | (Review.reviewer_id == target_id)
            )

        return query.order_by(Review.created_at.desc()).limit(limit).all()

    def get_top_rated_artists(
        self, db: Session, limit: int = 5
    ) -> List[Tuple[ArtistProfile, float, int]]:
        results = (
            db.query(
                ArtistProfile,
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("total_reviews"),
            )
            .join(Review, Review.artist_profile_id == ArtistProfile.id)
            .filter(Review.deleted_at.is_(None), Review.moderation_status == "public")
            .group_by(ArtistProfile.id)
            .order_by(desc("avg_rating"), desc("total_reviews"))
            .limit(limit)
            .all()
        )
        return [
            (artist, round(float(avg_r), 2), int(tot_r))
            for artist, avg_r, tot_r in results
        ]

    def get_top_rated_venues(
        self, db: Session, limit: int = 5
    ) -> List[Tuple[Venue, float, int]]:
        results = (
            db.query(
                Venue,
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("total_reviews"),
            )
            .join(Review, Review.venue_id == Venue.id)
            .filter(Review.deleted_at.is_(None), Review.moderation_status == "public")
            .group_by(Venue.id)
            .order_by(desc("avg_rating"), desc("total_reviews"))
            .limit(limit)
            .all()
        )
        return [
            (venue, round(float(avg_r), 2), int(tot_r))
            for venue, avg_r, tot_r in results
        ]

    def get_most_reviewed_artists(
        self, db: Session, limit: int = 5
    ) -> List[Tuple[ArtistProfile, float, int]]:
        results = (
            db.query(
                ArtistProfile,
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("total_reviews"),
            )
            .join(Review, Review.artist_profile_id == ArtistProfile.id)
            .filter(Review.deleted_at.is_(None), Review.moderation_status == "public")
            .group_by(ArtistProfile.id)
            .order_by(desc("total_reviews"), desc("avg_rating"))
            .limit(limit)
            .all()
        )
        return [
            (artist, round(float(avg_r), 2), int(tot_r))
            for artist, avg_r, tot_r in results
        ]

    def get_most_reviewed_venues(
        self, db: Session, limit: int = 5
    ) -> List[Tuple[Venue, float, int]]:
        results = (
            db.query(
                Venue,
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("total_reviews"),
            )
            .join(Review, Review.venue_id == Venue.id)
            .filter(Review.deleted_at.is_(None), Review.moderation_status == "public")
            .group_by(Venue.id)
            .order_by(desc("total_reviews"), desc("avg_rating"))
            .limit(limit)
            .all()
        )
        return [
            (venue, round(float(avg_r), 2), int(tot_r))
            for venue, avg_r, tot_r in results
        ]

    def get_lowest_rated_accounts(
        self, db: Session, limit: int = 5
    ) -> List[Tuple[User, float, int]]:
        results = (
            db.query(
                User,
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("total_reviews"),
            )
            .join(Review, Review.reviewee_id == User.id)
            .filter(Review.deleted_at.is_(None), Review.moderation_status == "public")
            .group_by(User.id)
            .order_by(asc("avg_rating"))
            .limit(limit)
            .all()
        )
        return [
            (usr, round(float(avg_r), 2), int(tot_r)) for usr, avg_r, tot_r in results
        ]

    def get_review_counts_by_timeframe(self, db: Session) -> Dict[str, int]:
        now = datetime.now()
        today_start = datetime(now.year, now.month, now.day)
        week_start = now - timedelta(days=7)
        month_start = now - timedelta(days=30)
        prev_month_start = now - timedelta(days=60)

        total_all = (
            db.query(func.count(Review.id))
            .filter(Review.deleted_at.is_(None), Review.moderation_status == "public")
            .scalar()
            or 0
        )
        today_cnt = (
            db.query(func.count(Review.id))
            .filter(
                Review.created_at >= today_start,
                Review.deleted_at.is_(None),
                Review.moderation_status == "public",
            )
            .scalar()
            or 0
        )
        week_cnt = (
            db.query(func.count(Review.id))
            .filter(
                Review.created_at >= week_start,
                Review.deleted_at.is_(None),
                Review.moderation_status == "public",
            )
            .scalar()
            or 0
        )
        month_cnt = (
            db.query(func.count(Review.id))
            .filter(
                Review.created_at >= month_start,
                Review.deleted_at.is_(None),
                Review.moderation_status == "public",
            )
            .scalar()
            or 0
        )
        prev_month_cnt = (
            db.query(func.count(Review.id))
            .filter(
                Review.created_at >= prev_month_start,
                Review.created_at < month_start,
                Review.deleted_at.is_(None),
                Review.moderation_status == "public",
            )
            .scalar()
            or 0
        )

        growth = 0.0
        if prev_month_cnt > 0:
            growth = round(((month_cnt - prev_month_cnt) / prev_month_cnt) * 100, 1)
        elif month_cnt > 0:
            growth = 100.0

        return {
            "total": total_all,
            "today": today_cnt,
            "week": week_cnt,
            "month": month_cnt,
            "growth_percentage": growth,
        }

    def soft_delete(self, db: Session, review_id: UUID) -> Optional[Review]:
        review = self.get_by_id(db, review_id)
        if review:
            review.soft_delete()
            db.add(review)
            db.commit()
            db.refresh(review)
        return review


# ─── REVIEW REPORT REPOSITORY (PHASE 5) ───────────────────────────────────


class ReviewReportRepository(BaseRepository[ReviewReport]):
    def __init__(self):
        super().__init__(ReviewReport)

    def get_report_by_id(self, db: Session, report_id: UUID) -> Optional[ReviewReport]:
        return (
            db.query(ReviewReport)
            .options(
                joinedload(ReviewReport.review),
                joinedload(ReviewReport.reporter),
                joinedload(ReviewReport.assigned_admin),
            )
            .filter(ReviewReport.id == report_id, ReviewReport.deleted_at.is_(None))
            .first()
        )

    def find_user_report_for_review(
        self, db: Session, review_id: UUID, user_id: UUID
    ) -> Optional[ReviewReport]:
        return (
            db.query(ReviewReport)
            .filter(
                ReviewReport.review_id == review_id,
                ReviewReport.reported_by == user_id,
                ReviewReport.deleted_at.is_(None),
            )
            .first()
        )

    def list_reports(
        self,
        db: Session,
        status_filter: Optional[str] = None,
        reason_filter: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> Tuple[List[ReviewReport], int]:
        query = (
            db.query(ReviewReport)
            .options(
                joinedload(ReviewReport.review),
                joinedload(ReviewReport.reporter),
                joinedload(ReviewReport.assigned_admin),
            )
            .filter(ReviewReport.deleted_at.is_(None))
        )

        if status_filter:
            query = query.filter(ReviewReport.status == status_filter)
        if reason_filter:
            query = query.filter(ReviewReport.reason == reason_filter)

        total = query.count()
        items = (
            query.order_by(ReviewReport.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return items, total

    def count_by_status(self, db: Session) -> Dict[str, int]:
        results = (
            db.query(ReviewReport.status, func.count(ReviewReport.id))
            .filter(ReviewReport.deleted_at.is_(None))
            .group_by(ReviewReport.status)
            .all()
        )
        counts = {
            "pending": 0,
            "under_review": 0,
            "resolved_action_taken": 0,
            "resolved_dismissed": 0,
        }
        for st, cnt in results:
            if st in counts:
                counts[st] = cnt
        return counts


# ─── REVIEW MODERATION HISTORY REPOSITORY (PHASE 5) ────────────────────────


class ReviewModerationHistoryRepository(BaseRepository[ReviewModerationHistory]):
    def __init__(self):
        super().__init__(ReviewModerationHistory)

    def get_by_review(
        self, db: Session, review_id: UUID
    ) -> List[ReviewModerationHistory]:
        return (
            db.query(ReviewModerationHistory)
            .options(joinedload(ReviewModerationHistory.moderator))
            .filter(ReviewModerationHistory.review_id == review_id)
            .order_by(
                ReviewModerationHistory.created_at.desc(),
                ReviewModerationHistory.id.desc(),
            )
            .all()
        )

    def list_history(
        self, db: Session, offset: int = 0, limit: int = 20
    ) -> Tuple[List[ReviewModerationHistory], int]:
        query = db.query(ReviewModerationHistory).options(
            joinedload(ReviewModerationHistory.moderator),
            joinedload(ReviewModerationHistory.review),
        )
        total = query.count()
        items = (
            query.order_by(
                ReviewModerationHistory.created_at.desc(),
                ReviewModerationHistory.id.desc(),
            )
            .offset(offset)
            .limit(limit)
            .all()
        )
        return items, total


review_repository = ReviewRepository()
review_report_repository = ReviewReportRepository()
review_moderation_history_repository = ReviewModerationHistoryRepository()
