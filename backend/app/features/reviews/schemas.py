from typing import Optional, List, Dict
from uuid import UUID
from datetime import datetime
from pydantic import Field
from app.common.schemas.base import BaseSchema


class ClientBriefResponse(BaseSchema):
    id: UUID
    name: str


class ClientReviewer(BaseSchema):
    id: UUID
    name: str


class UserBriefResponse(BaseSchema):
    id: UUID
    name: str
    email: Optional[str] = None


class CreateReviewRequest(BaseSchema):
    booking_id: Optional[UUID] = None
    reviewee_id: Optional[UUID] = None
    reviewee_role: Optional[str] = None
    artist_profile_id: Optional[UUID] = None
    venue_id: Optional[UUID] = None
    rating: int = Field(..., ge=1, le=5, description="Rating score between 1 and 5")
    review_title: Optional[str] = Field(None, max_length=255)
    review_text: Optional[str] = None
    comment: Optional[str] = None
    is_public: bool = True
    images: List[str] = Field(default_factory=list)
    videos: List[str] = Field(default_factory=list)


class UpdateReviewRequest(BaseSchema):
    rating: Optional[int] = Field(None, ge=1, le=5)
    review_title: Optional[str] = Field(None, max_length=255)
    review_text: Optional[str] = None
    comment: Optional[str] = None
    is_public: Optional[bool] = None
    images: Optional[List[str]] = None
    videos: Optional[List[str]] = None


class ReviewFilters(BaseSchema):
    booking_id: Optional[UUID] = None
    reviewer_id: Optional[UUID] = None
    reviewee_id: Optional[UUID] = None
    artist_profile_id: Optional[UUID] = None
    venue_id: Optional[UUID] = None
    rating: Optional[int] = None
    is_public: Optional[bool] = None
    moderation_status: Optional[str] = None
    search: Optional[str] = None


class ReviewPagination(BaseSchema):
    total: int
    page: int
    limit: int
    pages: int


class ReviewEligibilityResponse(BaseSchema):
    eligible: bool
    booking_id: UUID
    reviewer_id: UUID
    reviewee_id: Optional[UUID] = None
    reviewee_role: Optional[str] = None
    reason: Optional[str] = None
    already_reviewed: bool = False


class ReviewResponse(BaseSchema):
    id: UUID
    booking_id: Optional[UUID] = None
    reviewer_id: Optional[UUID] = None
    reviewer_role: Optional[str] = "client"
    reviewee_id: Optional[UUID] = None
    reviewee_role: Optional[str] = None
    artist_profile_id: Optional[UUID] = None
    venue_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    rating: int
    review_title: Optional[str] = None
    review_text: Optional[str] = None
    comment: Optional[str] = None
    is_public: bool = True
    moderation_status: str = "public"
    reply_comment: Optional[str] = None
    reply_at: Optional[datetime] = None
    images: List[str] = Field(default_factory=list)
    videos: List[str] = Field(default_factory=list)
    reviewer: Optional[UserBriefResponse] = None
    reviewee: Optional[UserBriefResponse] = None
    client: Optional[ClientBriefResponse] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class ReviewListResponse(BaseSchema):
    items: List[ReviewResponse] = Field(default_factory=list)
    pagination: ReviewPagination


class ReviewDetailsResponse(BaseSchema):
    id: UUID
    rating: int
    comment: str
    review_title: Optional[str] = None
    review_text: Optional[str] = None
    moderation_status: str = "public"
    reply_comment: Optional[str] = None
    reply_at: Optional[datetime] = None
    images: List[str] = Field(default_factory=list)
    videos: List[str] = Field(default_factory=list)
    client: ClientReviewer
    created_at: datetime


class ReviewSummaryResponse(BaseSchema):
    average_rating: float
    total_reviews: int
    rating_distribution: Dict[int, int]
    reviews: List[ReviewDetailsResponse] = Field(default_factory=list)


class ReviewReplyRequest(BaseSchema):
    reply_comment: str


# ─── ANALYTICS SCHEMAS (PHASE 4) ──────────────────────────────────────────


class RatingDistributionSchema(BaseSchema):
    star_1: int = 0
    star_2: int = 0
    star_3: int = 0
    star_4: int = 0
    star_5: int = 0
    total: int = 0


class ReviewTrendPointResponse(BaseSchema):
    period: str
    average_rating: float
    count: int


class TopRatedEntityResponse(BaseSchema):
    id: UUID
    name: str
    entity_type: str
    average_rating: float
    total_reviews: int
    image_url: Optional[str] = None


class MostReviewedEntityResponse(BaseSchema):
    id: UUID
    name: str
    entity_type: str
    average_rating: float
    total_reviews: int
    image_url: Optional[str] = None


class ProfileReviewAnalyticsResponse(BaseSchema):
    average_rating: float
    total_reviews: int
    rating_distribution: Dict[int, int]
    five_star_ratio: float
    public_reviews_count: int
    private_reviews_count: int
    recent_reviews: List[ReviewResponse] = Field(default_factory=list)
    trend: List[ReviewTrendPointResponse] = Field(default_factory=list)


class DashboardReviewAnalyticsResponse(BaseSchema):
    average_rating: float
    total_reviews: int
    five_star_count: int
    five_star_ratio: float
    growth_percentage: float
    pending_reviews_count: int = 0
    recent_reviews: List[ReviewResponse] = Field(default_factory=list)
    latest_ratings: List[ReviewResponse] = Field(default_factory=list)


class RoleComparisonResponse(BaseSchema):
    role: str
    average_rating: float
    total_reviews: int


class AdminReviewAnalyticsResponse(BaseSchema):
    platform_average_rating: float
    total_reviews: int
    reviews_today: int
    reviews_this_week: int
    reviews_this_month: int
    growth_percentage: float
    top_rated_artists: List[TopRatedEntityResponse] = Field(default_factory=list)
    top_rated_venues: List[TopRatedEntityResponse] = Field(default_factory=list)
    lowest_rated_accounts: List[TopRatedEntityResponse] = Field(default_factory=list)
    most_active_reviewers: List[UserBriefResponse] = Field(default_factory=list)
    activity_breakdown: List[ReviewTrendPointResponse] = Field(default_factory=list)
    role_comparison: List[RoleComparisonResponse] = Field(default_factory=list)


class MarketplaceReviewAnalyticsResponse(BaseSchema):
    highest_rated_artists: List[TopRatedEntityResponse] = Field(default_factory=list)
    highest_rated_venues: List[TopRatedEntityResponse] = Field(default_factory=list)
    most_reviewed_artists: List[MostReviewedEntityResponse] = Field(
        default_factory=list
    )
    most_reviewed_venues: List[MostReviewedEntityResponse] = Field(default_factory=list)
    trending_artists: List[TopRatedEntityResponse] = Field(default_factory=list)
    trending_venues: List[TopRatedEntityResponse] = Field(default_factory=list)


# ─── MODERATION SCHEMAS (PHASE 5) ──────────────────────────────────────────


class ReportReviewRequest(BaseSchema):
    reason: str = Field(
        ...,
        max_length=100,
        description="Standardized reason (e.g., Spam, Harassment, Hate Speech, Abusive Language, Fake Review, Violence, Other)",
    )
    description: Optional[str] = Field(
        None, max_length=1000, description="Detailed explanation of the report"
    )


class ReviewReportResponse(BaseSchema):
    id: UUID
    review_id: UUID
    reported_by: UUID
    reason: str
    description: Optional[str] = None
    status: str = "pending"  # "pending", "under_review", "resolved_action_taken", "resolved_dismissed"
    assigned_admin_id: Optional[UUID] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    review: Optional[ReviewResponse] = None
    reporter: Optional[UserBriefResponse] = None
    assigned_admin: Optional[UserBriefResponse] = None


class ReportListResponse(BaseSchema):
    items: List[ReviewReportResponse] = Field(default_factory=list)
    pagination: ReviewPagination


class ModerationActionRequest(BaseSchema):
    action: str = Field(
        ...,
        description="Action: approve, dismiss, hide, restore, remove, archive, assign",
    )
    moderator_notes: Optional[str] = Field(
        None, description="Explanation or reasoning for the action"
    )
    target_admin_id: Optional[UUID] = Field(
        None, description="Target admin user ID if assigning"
    )


class ReviewModerationHistoryResponse(BaseSchema):
    id: UUID
    review_id: UUID
    report_id: Optional[UUID] = None
    action: str
    old_status: Optional[str] = None
    new_status: str
    moderated_by: UUID
    moderator_notes: Optional[str] = None
    created_at: datetime
    moderator: Optional[UserBriefResponse] = None


class ModerationDashboardStatsResponse(BaseSchema):
    pending_reports_count: int
    under_review_count: int
    hidden_reviews_count: int
    flagged_reviews_count: int
    total_moderated_count: int
