from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Boolean,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.common.models.base import BaseModel


class Review(BaseModel):
    """
    Review and Rating entity model.
    Establishes complete foundation for rating scores, feedback, titles, roles, and moderation status.
    """

    __tablename__ = "reviews"

    booking_id = Column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    reviewer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    reviewer_role = Column(String(50), nullable=True, default="client", index=True)
    reviewee_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    reviewee_role = Column(String(50), nullable=True, index=True)

    artist_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("artist_profiles.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    venue_id = Column(
        UUID(as_uuid=True),
        ForeignKey("venues.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    client_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    rating = Column(Integer, nullable=False, default=5, index=True)
    review_title = Column(String(255), nullable=True)
    review_text = Column(Text, nullable=True)
    comment = Column(Text, nullable=True)  # Backward compatibility alias
    is_public = Column(Boolean, default=True, nullable=False, index=True)

    # Moderation Status: "public" | "flagged" | "hidden" | "removed" | "archived"
    moderation_status = Column(String(50), default="public", nullable=False, index=True)

    # Performer Reply
    reply_comment = Column(Text, nullable=True)
    reply_at = Column(DateTime, nullable=True)

    # Customer Media Uploads
    images = Column(JSON, default=list, nullable=False)  # ["url1", "url2"]
    videos = Column(JSON, default=list, nullable=False)  # ["url1", "url2"]

    # Relationships
    reviewer = relationship("User", foreign_keys=[reviewer_id], backref="reviews_given")
    reviewee = relationship(
        "User", foreign_keys=[reviewee_id], backref="reviews_received"
    )
    artist_profile = relationship("ArtistProfile", backref="artist_reviews")
    venue = relationship("Venue", backref="venue_reviews")
    client = relationship("User", foreign_keys=[client_id], backref="client_reviews")
    booking = relationship("Booking", backref="booking_reviews")

    @property
    def effective_comment(self) -> str:
        return self.review_text or self.comment or ""


class ReviewReport(BaseModel):
    """
    User report entity for flagging inappropriate reviews.
    """

    __tablename__ = "review_reports"

    review_id = Column(
        UUID(as_uuid=True),
        ForeignKey("reviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reported_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reason = Column(
        String(100), nullable=False, index=True
    )  # "Spam", "Harassment", "Hate Speech", etc.
    description = Column(Text, nullable=True)
    status = Column(
        String(50), default="pending", nullable=False, index=True
    )  # "pending", "under_review", "resolved_action_taken", "resolved_dismissed"
    assigned_admin_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    review = relationship("Review", backref="reports")
    reporter = relationship(
        "User", foreign_keys=[reported_by], backref="submitted_review_reports"
    )
    assigned_admin = relationship(
        "User", foreign_keys=[assigned_admin_id], backref="assigned_review_reports"
    )


class ReviewModerationHistory(BaseModel):
    """
    Immutable audit history log of all moderation actions performed by administrators.
    """

    __tablename__ = "review_moderation_histories"

    review_id = Column(
        UUID(as_uuid=True),
        ForeignKey("reviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    report_id = Column(
        UUID(as_uuid=True),
        ForeignKey("review_reports.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action = Column(
        String(50), nullable=False, index=True
    )  # "approve", "dismiss", "hide", "restore", "remove", "archive"
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    moderated_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    moderator_notes = Column(Text, nullable=True)

    # Relationships
    review = relationship("Review", backref="moderation_history")
    report = relationship("ReviewReport", backref="moderation_history")
    moderator = relationship(
        "User", foreign_keys=[moderated_by], backref="moderation_actions"
    )
