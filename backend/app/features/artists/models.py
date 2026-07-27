"""
Database models for Artist / Band profiles.
Maps bio details, pricing, verification status, media gallery, videos, documents, genres, and languages.
"""

from sqlalchemy import Column, String, ForeignKey, Numeric, Table, JSON, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.common.models.base import BaseModel
from app.core.database import Base

# Junction table for Artist many-to-many Genres (categories type='music_genre')
artist_genres = Table(
    "artist_genres",
    Base.metadata,
    Column("artist_profile_id", UUID(as_uuid=True), ForeignKey("artist_profiles.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)

# Junction table for Artist many-to-many Languages (categories type='language')
artist_languages = Table(
    "artist_languages",
    Base.metadata,
    Column("artist_profile_id", UUID(as_uuid=True), ForeignKey("artist_profiles.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)


class ArtistProfile(BaseModel):
    """Main performer profile entity."""
    __tablename__ = "artist_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    bio = Column(String(2000), nullable=True)
    base_rate = Column(Numeric(10, 2), default=0.0, nullable=False)
    rating = Column(Numeric(2, 1), default=5.0, nullable=False)
    
    # Verification pipeline statuses: 'pending', 'approved', 'rejected'
    verification_status = Column(String(30), default="pending", nullable=False, index=True)
    verification_notes = Column(String(255), nullable=True)

    # Unique public-facing handle (e.g. "the_groove_band"). Stored WITHOUT @.
    # Displayed as @username in the UI. Lowercase, 3-30 chars, alphanumeric + underscores.
    username = Column(String(30), unique=True, nullable=True, index=True)

    display_name = Column(String(150), nullable=True)
    mobile_number = Column(String(30), nullable=True)
    years_of_experience = Column(Integer, default=0, nullable=False)
    profile_image = Column(String(255), nullable=True)
    cover_image = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True, index=True)
    state = Column(String(100), nullable=True)
    
    # Band Details
    band_type = Column(String(50), default="Solo", nullable=False)  # Solo, Duo, Trio, 4 Members, 5+ Members
    total_members = Column(Integer, default=1, nullable=False)
    
    # Pricing & Travel
    currency = Column(String(10), default="INR", nullable=False)
    travel_radius = Column(Numeric(10, 2), default=0.0, nullable=False)
    travel_charges = Column(Numeric(10, 2), default=0.0, nullable=False)
    min_booking_hours = Column(Numeric(10, 2), default=0.0, nullable=False)
    max_booking_hours = Column(Numeric(10, 2), default=0.0, nullable=False)
    
    # Equipment configuration
    equipment = Column(JSON, default=dict, nullable=False)  # E.g. {"own_speaker": true, "mic": true, etc.}
    
    # Availability schedules
    availability = Column(JSON, default=dict, nullable=False)  # E.g. {"weekly_schedule": ..., "holidays": ..., "blocked_dates": ...}

    # Social and Achievements
    social_links = Column(JSON, default=dict, nullable=False)  # {"instagram": "", "facebook": "", "twitter": "", "website": ""}
    achievements = Column(JSON, default=list, nullable=False)  # ["Award 1", "Award 2"]

    # JSON lists fields for media assets
    documents = Column(JSON, default=list, nullable=False)  # [{ "title": "ID Proof", "url": "..." }]
    gallery = Column(JSON, default=list, nullable=False)    # ["url1", "url2"]
    videos = Column(JSON, default=list, nullable=False)     # ["youtube_url1", "vimeo_url2"]
    youtube_links = Column(JSON, default=list, nullable=False) # Direct links entered in Step 6
    instagram_reels = Column(JSON, default=list, nullable=False) # Instagram reel links
    pricing_details = Column(JSON, default=dict, nullable=False)  # { "hourly_rate": 5000, "travel_charge": 2000 }

    # Relationships
    user = relationship("User", backref="artist_profile")
    genres = relationship("Category", secondary=artist_genres, backref="artists_in_genre")
    languages = relationship("Category", secondary=artist_languages, backref="artists_in_language")
ZOOM_NOTE = """
Note on soft deletion: BaseModel provides deleted_at out of the box.
"""
