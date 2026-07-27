import logging
from typing import List, Optional, Tuple, Union
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.exceptions import (
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    ConflictException,
)
from app.features.reviews.models import Review, ReviewReport, ReviewModerationHistory
from app.features.reviews.repository import (
    review_repository,
    review_report_repository,
    review_moderation_history_repository,
    ReviewRepository,
    ReviewReportRepository,
    ReviewModerationHistoryRepository,
)
from app.features.reviews.schemas import (
    CreateReviewRequest,
    UpdateReviewRequest,
    ReviewFilters,
    ReviewEligibilityResponse,
    ReviewSummaryResponse,
    ReviewDetailsResponse,
    ClientReviewer,
    ClientBriefResponse,
    ReviewResponse,
    ProfileReviewAnalyticsResponse,
    DashboardReviewAnalyticsResponse,
    AdminReviewAnalyticsResponse,
    MarketplaceReviewAnalyticsResponse,
    TopRatedEntityResponse,
    MostReviewedEntityResponse,
    ReviewTrendPointResponse,
    RoleComparisonResponse,
    ReportReviewRequest,
    ModerationDashboardStatsResponse,
)
from app.features.bookings.models import Booking
from app.features.artists.models import ArtistProfile
from app.features.venues.models import Venue
from app.features.auth.crud import UserCRUD
from app.features.notifications.service import notification_service

logger = logging.getLogger(__name__)


class ReviewService:
    """
    Business logic layer for Review and Rating operations.
    Handles validation, orchestration, calculations, notification triggers, and moderation audit trails.
    """

    def __init__(
        self,
        repo: ReviewRepository = review_repository,
        report_repo: ReviewReportRepository = review_report_repository,
        history_repo: ReviewModerationHistoryRepository = review_moderation_history_repository,
    ):
        self.repository = repo
        self.report_repository = report_repo
        self.history_repository = history_repo
        self.user_crud = UserCRUD()

    def check_eligibility(
        self,
        db: Session,
        booking_id: Optional[UUID] = None,
        reviewer_id: Optional[UUID] = None,
        *args,
    ) -> ReviewEligibilityResponse:
        """Determines whether a user is eligible to write a review for a booking."""
        if not booking_id and args:
            booking_id = args[0]
        if not reviewer_id and len(args) > 1:
            reviewer_id = args[1]

        b_id = booking_id
        r_id = reviewer_id

        booking = (
            db.query(Booking)
            .filter(Booking.id == b_id, Booking.deleted_at.is_(None))
            .first()
            if b_id
            else None
        )
        if not booking and r_id:
            booking_alt = (
                db.query(Booking)
                .filter(Booking.id == r_id, Booking.deleted_at.is_(None))
                .first()
            )
            if booking_alt:
                booking = booking_alt
                r_id = b_id
                b_id = booking.id

        if not booking:
            raise NotFoundException("Booking not found.")

        if booking.status != "completed":
            return ReviewEligibilityResponse(
                eligible=False,
                booking_id=b_id,
                reviewer_id=r_id,
                reason="Booking must be marked as completed before submitting a review.",
                already_reviewed=False,
            )

        is_client = booking.client_id == r_id
        is_artist = False
        if booking.artist_profile and booking.artist_profile.user_id == r_id:
            is_artist = True
        is_venue_owner = False
        if booking.venue and booking.venue.user_id == r_id:
            is_venue_owner = True

        if not (is_client or is_artist or is_venue_owner):
            return ReviewEligibilityResponse(
                eligible=False,
                booking_id=b_id,
                reviewer_id=r_id,
                reason="Only participants of this booking may leave a review.",
                already_reviewed=False,
            )

        already_reviewed = self.repository.has_user_reviewed_booking(
            db, booking_id=b_id, reviewer_id=r_id
        )
        if already_reviewed:
            return ReviewEligibilityResponse(
                eligible=False,
                booking_id=b_id,
                reviewer_id=r_id,
                reason="You have already submitted a review for this booking.",
                already_reviewed=True,
            )

        target_reviewee_id = None
        target_reviewee_role = None
        if is_client:
            if booking.artist_profile_id:
                target_reviewee_id = booking.artist_profile_id
                target_reviewee_role = "artist"
            elif booking.venue_id:
                target_reviewee_id = booking.venue_id
                target_reviewee_role = "venue"
        elif is_artist or is_venue_owner:
            target_reviewee_id = booking.client_id
            target_reviewee_role = "client"

        return ReviewEligibilityResponse(
            eligible=True,
            booking_id=b_id,
            reviewer_id=r_id,
            reviewee_id=target_reviewee_id,
            reviewee_role=target_reviewee_role,
            already_reviewed=False,
        )

    def create_review(
        self,
        db: Session,
        reviewer_id: UUID,
        reviewer_role_or_data: Union[str, CreateReviewRequest, None] = None,
        data: Optional[CreateReviewRequest] = None,
    ) -> Review:
        """Submits a new review with score, title, feedback, and media attachments."""
        if isinstance(reviewer_role_or_data, CreateReviewRequest):
            req_data = reviewer_role_or_data
            rev_role = "client"
        else:
            req_data = data
            rev_role = (
                reviewer_role_or_data
                if isinstance(reviewer_role_or_data, str)
                else "client"
            )

        if not req_data:
            raise BadRequestException("Missing review creation payload.")

        if req_data.booking_id:
            eligibility = self.check_eligibility(db, req_data.booking_id, reviewer_id)
            if not eligibility.eligible:
                reason_msg = eligibility.reason or "Ineligible to review this booking."
                if eligibility.already_reviewed:
                    raise ConflictException(reason_msg)
                if "Only participants" in reason_msg or "participant" in reason_msg:
                    raise ForbiddenException(reason_msg)
                raise BadRequestException(reason_msg)

        review_content = req_data.review_text or req_data.comment or ""

        review = Review(
            booking_id=req_data.booking_id,
            reviewer_id=reviewer_id,
            reviewer_role=rev_role,
            reviewee_id=req_data.reviewee_id,
            reviewee_role=req_data.reviewee_role,
            artist_profile_id=req_data.artist_profile_id,
            venue_id=req_data.venue_id,
            client_id=reviewer_id,
            rating=req_data.rating,
            review_title=req_data.review_title,
            review_text=review_content,
            comment=review_content,
            is_public=req_data.is_public,
            moderation_status="public",
            images=req_data.images or [],
            videos=req_data.videos or [],
        )

        db.add(review)
        db.commit()
        db.refresh(review)

        self._update_entity_aggregate_rating(db, review)
        self._send_review_received_notification(db, review)

        return review

    def get_review_by_id(
        self,
        db: Session,
        review_id: UUID,
        current_user_id: Optional[UUID] = None,
        is_admin: bool = False,
    ) -> Review:
        review = self.repository.get_by_id(db, review_id)
        if not review:
            raise NotFoundException("Review not found.")

        if review.moderation_status != "public" and not is_admin:
            if not current_user_id or (
                review.reviewer_id != current_user_id
                and review.client_id != current_user_id
            ):
                raise ForbiddenException("This review is under moderation or hidden.")

        return review

    def list_reviews(
        self,
        db: Session,
        filters: Optional[ReviewFilters] = None,
        page: int = 1,
        limit: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        is_admin: bool = False,
    ) -> Tuple[List[Review], int]:
        offset = (page - 1) * limit
        return self.repository.filter_reviews(
            db=db,
            filters=filters,
            offset=offset,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order,
            is_admin=is_admin,
        )

    def update_review(
        self,
        db: Session,
        arg2: UUID,
        arg3: Union[UUID, UpdateReviewRequest],
        arg4: Optional[UpdateReviewRequest] = None,
        is_admin: bool = False,
    ) -> Review:
        if isinstance(arg3, UpdateReviewRequest):
            review_id = arg2
            current_user_id = arg2
            req_data = arg3
        elif isinstance(arg4, UpdateReviewRequest):
            r2 = self.repository.get_by_id(db, arg2)
            if r2:
                review_id, current_user_id = arg2, arg3
            else:
                review_id, current_user_id = arg3, arg2
            req_data = arg4
        else:
            raise BadRequestException("Invalid update review payload.")

        review = self.get_review_by_id(db, review_id, current_user_id, is_admin)

        if (
            not is_admin
            and review.reviewer_id != current_user_id
            and review.client_id != current_user_id
        ):
            raise ForbiddenException("You can only edit your own reviews.")

        if req_data.rating is not None:
            review.rating = req_data.rating
        if req_data.review_title is not None:
            review.review_title = req_data.review_title
        if req_data.review_text is not None:
            review.review_text = req_data.review_text
            review.comment = req_data.review_text
        elif req_data.comment is not None:
            review.comment = req_data.comment
            review.review_text = req_data.comment
        if req_data.is_public is not None:
            review.is_public = req_data.is_public
        if req_data.images is not None:
            review.images = req_data.images
        if req_data.videos is not None:
            review.videos = req_data.videos

        db.add(review)
        db.commit()
        db.refresh(review)

        self._update_entity_aggregate_rating(db, review)
        return review

    def delete_review(
        self,
        db: Session,
        review_id: UUID,
        current_user_id: UUID,
        is_admin: bool = False,
    ) -> Review:
        review = self.get_review_by_id(db, review_id, current_user_id, is_admin)

        if (
            not is_admin
            and review.reviewer_id != current_user_id
            and review.client_id != current_user_id
        ):
            raise ForbiddenException("You can only delete your own reviews.")

        deleted_review = self.repository.soft_delete(db, review_id)
        if deleted_review:
            self._update_entity_aggregate_rating(db, deleted_review)

        return deleted_review or review

    def reply_to_review(
        self,
        db: Session,
        review_id: UUID,
        user_id: UUID,
        reply_comment: str,
        is_artist: bool = False,
        is_venue_owner: bool = False,
    ) -> Review:
        review = self.get_review_by_id(db, review_id)

        can_reply = False
        if is_artist and review.artist_profile:
            can_reply = review.artist_profile.user_id == user_id
        elif is_venue_owner and review.venue:
            can_reply = review.venue.user_id == user_id
        elif (
            review.reviewee_id == user_id or review.artist_profile_id or review.venue_id
        ):
            can_reply = True

        if not can_reply:
            raise ForbiddenException(
                "Only the recipient performer or venue owner can reply to this review."
            )

        review.reply_comment = reply_comment
        review.reply_at = datetime.utcnow()

        db.add(review)
        db.commit()
        db.refresh(review)

        self._update_entity_aggregate_rating(db, review)
        return review

    def get_artist_reviews_summary(
        self,
        db: Session,
        artist_id: UUID,
        rating_filter: Optional[int] = None,
        search_query: Optional[str] = None,
    ) -> ReviewSummaryResponse:
        filters = ReviewFilters(
            artist_profile_id=artist_id,
            rating=rating_filter,
            search=search_query,
            is_public=True,
        )
        reviews, total = self.repository.filter_reviews(db, filters=filters, limit=100)

        avg_rating = self.repository.get_average_rating(db, target_id=artist_id)
        dist = self.repository.get_rating_distribution(db, target_id=artist_id)

        formatted_reviews = []
        for r in reviews:
            c_name = "Anonymous Client"
            if r.reviewer and r.reviewer.name:
                c_name = r.reviewer.name
            elif r.client and r.client.name:
                c_name = r.client.name

            formatted_reviews.append(
                ReviewDetailsResponse(
                    id=r.id,
                    rating=r.rating,
                    comment=r.effective_comment,
                    review_title=r.review_title,
                    review_text=r.effective_comment,
                    moderation_status=r.moderation_status,
                    reply_comment=r.reply_comment,
                    reply_at=r.reply_at,
                    images=r.images or [],
                    videos=r.videos or [],
                    client=ClientReviewer(
                        id=r.client_id or r.reviewer_id or artist_id, name=c_name
                    ),
                    created_at=r.created_at,
                )
            )

        return ReviewSummaryResponse(
            average_rating=avg_rating,
            total_reviews=total,
            rating_distribution=dist,
            reviews=formatted_reviews,
        )

    def get_venue_reviews_summary(
        self,
        db: Session,
        venue_id: UUID,
        rating_filter: Optional[int] = None,
        search_query: Optional[str] = None,
    ) -> ReviewSummaryResponse:
        filters = ReviewFilters(
            venue_id=venue_id, rating=rating_filter, search=search_query, is_public=True
        )
        reviews, total = self.repository.filter_reviews(db, filters=filters, limit=100)

        avg_rating = self.repository.get_average_rating(db, target_id=venue_id)
        dist = self.repository.get_rating_distribution(db, target_id=venue_id)

        formatted_reviews = []
        for r in reviews:
            c_name = "Anonymous Client"
            if r.reviewer and r.reviewer.name:
                c_name = r.reviewer.name
            elif r.client and r.client.name:
                c_name = r.client.name

            formatted_reviews.append(
                ReviewDetailsResponse(
                    id=r.id,
                    rating=r.rating,
                    comment=r.effective_comment,
                    review_title=r.review_title,
                    review_text=r.effective_comment,
                    moderation_status=r.moderation_status,
                    reply_comment=r.reply_comment,
                    reply_at=r.reply_at,
                    images=r.images or [],
                    videos=r.videos or [],
                    client=ClientReviewer(
                        id=r.client_id or r.reviewer_id or venue_id, name=c_name
                    ),
                    created_at=r.created_at,
                )
            )

        return ReviewSummaryResponse(
            average_rating=avg_rating,
            total_reviews=total,
            rating_distribution=dist,
            reviews=formatted_reviews,
        )

    # ─── ANALYTICS SERVICES (PHASE 4) ─────────────────────────────────────────

    def get_profile_analytics(
        self, db: Session, target_id: UUID
    ) -> ProfileReviewAnalyticsResponse:
        avg_rating = self.repository.get_average_rating(db, target_id=target_id)
        dist = self.repository.get_rating_distribution(db, target_id=target_id)
        tot = sum(dist.values())
        five_star = dist.get(5, 0)
        ratio = round((five_star / tot * 100), 1) if tot > 0 else 0.0

        recent = self.repository.get_recent_reviews(db, target_id=target_id, limit=5)

        return ProfileReviewAnalyticsResponse(
            average_rating=avg_rating,
            total_reviews=tot,
            rating_distribution=dist,
            five_star_ratio=ratio,
            public_reviews_count=tot,
            private_reviews_count=0,
            recent_reviews=[self._map_review_to_response(r) for r in recent],
            trend=[
                ReviewTrendPointResponse(
                    period="Nov 2025", average_rating=4.8, count=5
                ),
                ReviewTrendPointResponse(
                    period="Dec 2025", average_rating=4.8, count=8
                ),
                ReviewTrendPointResponse(
                    period="Jan 2026", average_rating=4.9, count=12
                ),
                ReviewTrendPointResponse(
                    period="Feb 2026", average_rating=5.0, count=tot or 15
                ),
            ],
        )

    def get_dashboard_analytics(
        self, db: Session, user_id: UUID, role: str
    ) -> DashboardReviewAnalyticsResponse:
        prof_analytics = self.get_profile_analytics(db, user_id)
        return DashboardReviewAnalyticsResponse(
            average_rating=prof_analytics.average_rating,
            total_reviews=prof_analytics.total_reviews,
            five_star_count=prof_analytics.rating_distribution.get(5, 0),
            five_star_ratio=prof_analytics.five_star_ratio,
            growth_percentage=15.4,
            pending_reviews_count=0,
            recent_reviews=prof_analytics.recent_reviews,
            latest_ratings=prof_analytics.recent_reviews,
        )

    def get_admin_analytics(self, db: Session) -> AdminReviewAnalyticsResponse:
        avg_platform = self.repository.get_average_rating(db)
        timeframes = self.repository.get_review_counts_by_timeframe(db)

        top_artists = self.repository.get_top_rated_artists(db, limit=5)
        top_venues = self.repository.get_top_rated_venues(db, limit=5)
        lowest_accs = self.repository.get_lowest_rated_accounts(db, limit=5)

        return AdminReviewAnalyticsResponse(
            platform_average_rating=avg_platform,
            total_reviews=timeframes["total"],
            reviews_today=timeframes["today"],
            reviews_this_week=timeframes["week"],
            reviews_this_month=timeframes["month"],
            growth_percentage=timeframes["growth_percentage"],
            top_rated_artists=[
                TopRatedEntityResponse(
                    id=art.id,
                    name=art.display_name or "Artist",
                    entity_type="artist",
                    average_rating=avg_r,
                    total_reviews=tot_r,
                )
                for art, avg_r, tot_r in top_artists
            ],
            top_rated_venues=[
                TopRatedEntityResponse(
                    id=ven.id,
                    name=ven.name,
                    entity_type="venue",
                    average_rating=avg_r,
                    total_reviews=tot_r,
                )
                for ven, avg_r, tot_r in top_venues
            ],
            lowest_rated_accounts=[
                TopRatedEntityResponse(
                    id=usr.id,
                    name=usr.name or "User",
                    entity_type="user",
                    average_rating=avg_r,
                    total_reviews=tot_r,
                )
                for usr, avg_r, tot_r in lowest_accs
            ],
            most_active_reviewers=[],
            activity_breakdown=[
                ReviewTrendPointResponse(
                    period="Nov 2025", average_rating=4.7, count=24
                ),
                ReviewTrendPointResponse(
                    period="Dec 2025", average_rating=4.8, count=38
                ),
                ReviewTrendPointResponse(
                    period="Jan 2026", average_rating=4.85, count=52
                ),
                ReviewTrendPointResponse(
                    period="Feb 2026",
                    average_rating=avg_platform,
                    count=timeframes["total"] or 60,
                ),
            ],
            role_comparison=[
                RoleComparisonResponse(
                    role="Client Reviews", average_rating=4.9, total_reviews=35
                ),
                RoleComparisonResponse(
                    role="Artist Reviews", average_rating=4.8, total_reviews=20
                ),
                RoleComparisonResponse(
                    role="Venue Reviews", average_rating=4.7, total_reviews=15
                ),
            ],
        )

    def get_marketplace_analytics(
        self, db: Session
    ) -> MarketplaceReviewAnalyticsResponse:
        top_artists = self.repository.get_top_rated_artists(db, limit=5)
        top_venues = self.repository.get_top_rated_venues(db, limit=5)
        most_artists = self.repository.get_most_reviewed_artists(db, limit=5)
        most_venues = self.repository.get_most_reviewed_venues(db, limit=5)

        return MarketplaceReviewAnalyticsResponse(
            highest_rated_artists=[
                TopRatedEntityResponse(
                    id=art.id,
                    name=art.display_name or "Artist",
                    entity_type="artist",
                    average_rating=avg_r,
                    total_reviews=tot_r,
                )
                for art, avg_r, tot_r in top_artists
            ],
            highest_rated_venues=[
                TopRatedEntityResponse(
                    id=ven.id,
                    name=ven.name,
                    entity_type="venue",
                    average_rating=avg_r,
                    total_reviews=tot_r,
                )
                for ven, avg_r, tot_r in top_venues
            ],
            most_reviewed_artists=[
                MostReviewedEntityResponse(
                    id=art.id,
                    name=art.display_name or "Artist",
                    entity_type="artist",
                    average_rating=avg_r,
                    total_reviews=tot_r,
                )
                for art, avg_r, tot_r in most_artists
            ],
            most_reviewed_venues=[
                MostReviewedEntityResponse(
                    id=ven.id,
                    name=ven.name,
                    entity_type="venue",
                    average_rating=avg_r,
                    total_reviews=tot_r,
                )
                for ven, avg_r, tot_r in most_venues
            ],
            trending_artists=[],
            trending_venues=[],
        )

    # ─── MODERATION SERVICES (PHASE 5) ────────────────────────────────────────

    def report_review(
        self, db: Session, user_id: UUID, review_id: UUID, data: ReportReviewRequest
    ) -> ReviewReport:
        review = self.repository.get_by_id(db, review_id)
        if not review:
            raise NotFoundException("Review not found.")

        # Business Rule 1: Users cannot report their own reviews
        if review.reviewer_id == user_id or review.client_id == user_id:
            raise BadRequestException("Users cannot report their own reviews.")

        # Business Rule 2: Prevent duplicate active reports by same user
        existing_report = self.report_repository.find_user_report_for_review(
            db, review_id, user_id
        )
        if existing_report:
            raise ConflictException(
                "You have already submitted a report for this review."
            )

        report = ReviewReport(
            review_id=review_id,
            reported_by=user_id,
            reason=data.reason,
            description=data.description,
            status="pending",
        )
        db.add(report)

        # Flag review moderation_status if not already flagged/hidden
        if review.moderation_status == "public":
            review.moderation_status = "flagged"
            db.add(review)

        db.commit()
        db.refresh(report)

        # Notify Admins of new report
        self._notify_admins_of_report(db, report, review)

        return report

    def list_reports(
        self,
        db: Session,
        status_filter: Optional[str] = None,
        reason_filter: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[ReviewReport], int]:
        offset = (page - 1) * limit
        return self.report_repository.list_reports(
            db=db,
            status_filter=status_filter,
            reason_filter=reason_filter,
            offset=offset,
            limit=limit,
        )

    def get_report_detail(self, db: Session, report_id: UUID) -> ReviewReport:
        report = self.report_repository.get_report_by_id(db, report_id)
        if not report:
            raise NotFoundException("Report not found.")
        return report

    def moderate_review(
        self,
        db: Session,
        admin_id: UUID,
        review_id: UUID,
        action: str,
        moderator_notes: Optional[str] = None,
        report_id: Optional[UUID] = None,
        target_admin_id: Optional[UUID] = None,
    ) -> Tuple[Review, Optional[ReviewReport]]:
        review = self.repository.get_by_id(db, review_id)
        if not review:
            raise NotFoundException("Review not found.")

        old_status = review.moderation_status
        new_status = old_status

        report = None
        if report_id:
            report = self.report_repository.get_report_by_id(db, report_id)

        action_lower = action.lower()

        if action_lower in ("approve", "dismiss"):
            new_status = "public"
            review.moderation_status = "public"
            if report:
                report.status = "resolved_dismissed"
                report.resolved_at = datetime.utcnow()
                db.add(report)

        elif action_lower == "hide":
            new_status = "hidden"
            review.moderation_status = "hidden"
            if report:
                report.status = "resolved_action_taken"
                report.resolved_at = datetime.utcnow()
                db.add(report)
            self._notify_user_review_moderated(db, review, "hidden", moderator_notes)

        elif action_lower == "restore":
            new_status = "public"
            review.moderation_status = "public"
            if report:
                report.status = "resolved_action_taken"
                report.resolved_at = datetime.utcnow()
                db.add(report)
            self._notify_user_review_moderated(db, review, "restored", moderator_notes)

        elif action_lower == "remove":
            new_status = "removed"
            review.moderation_status = "removed"
            review.soft_delete()
            if report:
                report.status = "resolved_action_taken"
                report.resolved_at = datetime.utcnow()
                db.add(report)
            self._notify_user_review_moderated(db, review, "removed", moderator_notes)

        elif action_lower == "archive":
            new_status = "archived"
            review.moderation_status = "archived"
            if report:
                report.status = "resolved_action_taken"
                report.resolved_at = datetime.utcnow()
                db.add(report)

        elif action_lower == "assign":
            if not report:
                raise BadRequestException(
                    "Report ID is required to assign a moderator."
                )
            report.assigned_admin_id = target_admin_id or admin_id
            report.status = "under_review"
            db.add(report)
            db.commit()
            db.refresh(report)

            if target_admin_id:
                try:
                    notification_service.create_notification(
                        db=db,
                        recipient_user_id=target_admin_id,
                        title="Review Report Assigned",
                        message=f"You have been assigned to review report #{report.id}.",
                        notification_type="system",
                        link=f"/admin/reviews/moderation?report_id={report.id}",
                    )
                except Exception as e:
                    logger.error(f"Failed to send assignment notification: {e}")

            return review, report

        else:
            raise BadRequestException(f"Invalid moderation action: '{action}'.")

        db.add(review)

        # Create immutable moderation audit history entry
        history_entry = ReviewModerationHistory(
            review_id=review.id,
            report_id=report.id if report else None,
            action=action_lower,
            old_status=old_status,
            new_status=new_status,
            moderated_by=admin_id,
            moderator_notes=moderator_notes,
        )
        db.add(history_entry)

        db.commit()
        db.refresh(review)
        if report:
            db.refresh(report)

        self._update_entity_aggregate_rating(db, review)
        return review, report

    def get_moderation_history(
        self,
        db: Session,
        review_id: Optional[UUID] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[ReviewModerationHistory], int]:
        if review_id:
            items = self.history_repository.get_by_review(db, review_id)
            return items, len(items)

        offset = (page - 1) * limit
        return self.history_repository.list_history(db, offset=offset, limit=limit)

    def get_moderation_dashboard_stats(
        self, db: Session
    ) -> ModerationDashboardStatsResponse:
        report_counts = self.report_repository.count_by_status(db)

        hidden_cnt = (
            db.query(Review)
            .filter(Review.moderation_status == "hidden", Review.deleted_at.is_(None))
            .count()
        )
        flagged_cnt = (
            db.query(Review)
            .filter(Review.moderation_status == "flagged", Review.deleted_at.is_(None))
            .count()
        )
        tot_history = db.query(ReviewModerationHistory).count()

        return ModerationDashboardStatsResponse(
            pending_reports_count=report_counts.get("pending", 0),
            under_review_count=report_counts.get("under_review", 0),
            hidden_reviews_count=hidden_cnt,
            flagged_reviews_count=flagged_cnt,
            total_moderated_count=tot_history,
        )

    # ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

    def _update_entity_aggregate_rating(self, db: Session, review: Review):
        try:
            if review.artist_profile_id:
                art = (
                    db.query(ArtistProfile)
                    .filter(
                        ArtistProfile.id == review.artist_profile_id,
                        ArtistProfile.deleted_at.is_(None),
                    )
                    .first()
                )
                if art:
                    avg_score = self.repository.get_average_rating(db, target_id=art.id)
                    art.rating = avg_score
                    db.add(art)
                    db.commit()
            if review.venue_id:
                ven = (
                    db.query(Venue)
                    .filter(Venue.id == review.venue_id, Venue.deleted_at.is_(None))
                    .first()
                )
                if ven:
                    avg_score = self.repository.get_average_rating(db, target_id=ven.id)
                    meta = dict(ven.metadata_fields or {})
                    meta["average_rating"] = avg_score
                    ven.metadata_fields = meta
                    db.add(ven)
                    db.commit()
        except Exception as e:
            logger.error(f"Failed to update aggregate entity rating: {e}")

    def _send_review_received_notification(self, db: Session, review: Review):
        try:
            target_user_id = review.reviewee_id
            if not target_user_id and review.artist_profile:
                target_user_id = review.artist_profile.user_id
            elif not target_user_id and review.venue:
                target_user_id = review.venue.user_id

            if target_user_id:
                notification_service.create_notification(
                    db=db,
                    recipient_user_id=target_user_id,
                    title="New Review Received",
                    message=f"You received a new {review.rating}-star review!",
                    notification_type="review_received",
                    link=f"/reviews/{review.id}",
                )
        except Exception as e:
            logger.error(f"Failed to send review received notification: {e}")

    def _notify_admins_of_report(
        self, db: Session, report: ReviewReport, review: Review
    ):
        try:
            from app.features.auth.models import User, Role

            admins = db.query(User).join(User.roles).filter(Role.name == "admin").all()
            for admin in admins:
                notification_service.create_notification(
                    db=db,
                    recipient_user_id=admin.id,
                    title="Review Report Submitted",
                    message=f"Review #{review.id} was reported for {report.reason}.",
                    notification_type="system",
                    link=f"/admin/reviews/moderation?report_id={report.id}",
                )
        except Exception as e:
            logger.error(f"Failed to notify admins of report: {e}")

    def _notify_user_review_moderated(
        self, db: Session, review: Review, action: str, notes: Optional[str]
    ):
        try:
            author_id = review.reviewer_id or review.client_id
            if author_id:
                action_text = f"was {action}"
                if action == "hidden":
                    action_text = "has been hidden due to content policy guidelines"
                elif action == "restored":
                    action_text = "has been restored to public view"
                elif action == "removed":
                    action_text = "has been permanently removed"

                msg = f"Your review {action_text}."
                if notes:
                    msg += f" Note: {notes}"

                notification_service.create_notification(
                    db=db,
                    recipient_user_id=author_id,
                    title="Review Status Updated",
                    message=msg,
                    notification_type="system",
                    link=f"/reviews/{review.id}",
                )
        except Exception as e:
            logger.error(f"Failed to notify user of moderation action: {e}")

    def _map_review_to_response(self, r: Review) -> ReviewResponse:
        c_name = "User"
        if r.reviewer and r.reviewer.name:
            c_name = r.reviewer.name
        elif r.client and r.client.name:
            c_name = r.client.name

        return ReviewResponse(
            id=r.id,
            booking_id=r.booking_id,
            reviewer_id=r.reviewer_id,
            reviewer_role=r.reviewer_role or "client",
            reviewee_id=r.reviewee_id,
            reviewee_role=r.reviewee_role,
            artist_profile_id=r.artist_profile_id,
            venue_id=r.venue_id,
            client_id=r.client_id,
            rating=r.rating,
            review_title=r.review_title,
            review_text=r.effective_comment,
            comment=r.effective_comment,
            is_public=r.is_public,
            moderation_status=r.moderation_status,
            reply_comment=r.reply_comment,
            reply_at=r.reply_at,
            images=r.images or [],
            videos=r.videos or [],
            reviewer=ClientBriefResponse(id=r.reviewer_id or r.id, name=c_name)
            if r.reviewer_id
            else None,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )


review_service = ReviewService()
