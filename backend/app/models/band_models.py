"""
Band module ORM models.

Integrated into Mokijo from the standalone Music-Band reference project.
Follows Mokijo conventions:
  - Integer primary keys (matches Mokijo's dominant convention).
  - All tables prefixed with `band_` to avoid collisions with existing
    Mokijo tables (users, venues, bookings, reviews, ...).
  - Uses the single shared Base from app.core.database so the existing
    `Base.metadata.create_all(...)` in app/main.py provisions these tables.
  - Identity is stored in `band_accounts` (no duplicate auth system);
    Band profile/booking/review/transaction tables reference band_accounts.id.

These models are used by the Band feature routers via SQLAlchemy sessions
(reusing Mokijo's existing SessionLocal/engine infrastructure).
"""

from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
    Text,
    Boolean,
    Float,
    ForeignKey,
    JSON,
    Table,
    Index,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


# ──────────────────────────────────────────────────────────────────────────────
# Identity
# ──────────────────────────────────────────────────────────────────────────────

class BandAccount(Base):
    """Unified Band identity (client / artist / venue_owner / admin).

    Authentication is performed via Mokijo's existing JWT flow
    (app.core.security.create_access_token + app.auth.authorization.
    check_user_authorization). This table only stores Band account data.
    """
    __tablename__ = "band_accounts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=True)
    role = Column(String(30), nullable=False, index=True)  # client|artist|venue_owner|admin
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # soft-delete sentinel


class BandRefreshToken(Base):
    """Optional refresh-token ledger for Band sessions (hashed)."""
    __tablename__ = "band_refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("band_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ──────────────────────────────────────────────────────────────────────────────
# Taxonomy
# ──────────────────────────────────────────────────────────────────────────────

class BandCategory(Base):
    """Unified taxonomy: music_genre, language, event_type, band_type,
    equipment_category, venue_category."""
    __tablename__ = "band_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_band_categories_name_type", "name", "type"),
    )


# ──────────────────────────────────────────────────────────────────────────────
# Geography
# ──────────────────────────────────────────────────────────────────────────────

class BandCountry(Base):
    __tablename__ = "band_countries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    code = Column(String(10), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class BandState(Base):
    __tablename__ = "band_states"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    country_id = Column(Integer, ForeignKey("band_countries.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class BandCity(Base):
    __tablename__ = "band_cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    state_id = Column(Integer, ForeignKey("band_states.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class BandArea(Base):
    __tablename__ = "band_areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    pincode = Column(String(20), nullable=False, index=True)
    city_id = Column(Integer, ForeignKey("band_cities.id", ondelete="CASCADE"), nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    service_radius = Column(Float, default=50.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ──────────────────────────────────────────────────────────────────────────────
# Artist profiles
# ──────────────────────────────────────────────────────────────────────────────

band_artist_genres = Table(
    "band_artist_genres",
    Base.metadata,
    Column("artist_profile_id", Integer, ForeignKey("band_artist_profiles.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", Integer, ForeignKey("band_categories.id", ondelete="CASCADE"), primary_key=True),
)

band_artist_languages = Table(
    "band_artist_languages",
    Base.metadata,
    Column("artist_profile_id", Integer, ForeignKey("band_artist_profiles.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", Integer, ForeignKey("band_categories.id", ondelete="CASCADE"), primary_key=True),
)


class BandArtistProfile(Base):
    """Performer / Band profile."""
    __tablename__ = "band_artist_profiles"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("band_accounts.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    bio = Column(Text, nullable=True)
    base_rate = Column(Float, default=0.0, nullable=False)
    rating = Column(Float, default=5.0, nullable=False)

    verification_status = Column(String(30), default="pending", nullable=False, index=True)  # pending|approved|rejected
    verification_notes = Column(String(255), nullable=True)

    display_name = Column(String(150), nullable=True)
    username = Column(String(50), unique=True, index=True, nullable=True)
    mobile_number = Column(String(30), nullable=True)
    years_of_experience = Column(Integer, default=0, nullable=False)
    profile_image = Column(String(255), nullable=True)
    cover_image = Column(String(255), nullable=True)

    band_type = Column(String(50), default="Solo", nullable=False)
    total_members = Column(Integer, default=1, nullable=False)

    currency = Column(String(10), default="INR", nullable=False)
    travel_radius = Column(Float, default=0.0, nullable=False)
    travel_charges = Column(Float, default=0.0, nullable=False)
    min_booking_hours = Column(Float, default=0.0, nullable=False)
    max_booking_hours = Column(Float, default=0.0, nullable=False)

    equipment = Column(JSON, default=list, nullable=False)
    availability = Column(JSON, default=dict, nullable=False)
    social_links = Column(JSON, default=dict, nullable=False)
    achievements = Column(JSON, default=list, nullable=False)
    documents = Column(JSON, default=list, nullable=False)
    gallery = Column(JSON, default=list, nullable=False)
    videos = Column(JSON, default=list, nullable=False)
    youtube_links = Column(JSON, default=list, nullable=False)
    instagram_reels = Column(JSON, default=list, nullable=False)
    pricing_details = Column(JSON, default=dict, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    account = relationship("BandAccount")
    genres = relationship("BandCategory", secondary=band_artist_genres, lazy="selectin")
    languages = relationship("BandCategory", secondary=band_artist_languages, lazy="selectin")


# ──────────────────────────────────────────────────────────────────────────────
# Venue profiles
# ──────────────────────────────────────────────────────────────────────────────

band_venue_categories = Table(
    "band_venue_categories",
    Base.metadata,
    Column("venue_id", Integer, ForeignKey("band_venues.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", Integer, ForeignKey("band_categories.id", ondelete="CASCADE"), primary_key=True),
)


class BandVenue(Base):
    """Event-space listing owned by a Band venue_owner account."""
    __tablename__ = "band_venues"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("band_accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(150), nullable=False, index=True)
    description = Column(Text, nullable=True)
    address = Column(String(255), nullable=False)
    city_id = Column(Integer, ForeignKey("band_cities.id", ondelete="RESTRICT"), nullable=True, index=True)

    base_price = Column(Float, default=0.0, nullable=False)
    capacity = Column(Integer, default=0, nullable=False)
    min_capacity = Column(Integer, default=0, nullable=False)

    venue_type = Column(String(50), nullable=True)
    business_name = Column(String(150), nullable=True)
    contact_details = Column(String(255), nullable=True)
    pincode = Column(String(20), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    google_map_location = Column(String(255), nullable=True)

    verification_status = Column(String(30), default="pending", nullable=False, index=True)
    verification_notes = Column(String(255), nullable=True)

    facilities = Column(JSON, default=list, nullable=False)
    gallery = Column(JSON, default=list, nullable=False)
    pricing_details = Column(JSON, default=dict, nullable=False)
    availability_rules = Column(JSON, default=dict, nullable=False)
    documents = Column(JSON, default=dict, nullable=False)
    metadata_fields = Column(JSON, default=dict, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    account = relationship("BandAccount")
    city = relationship("BandCity")
    categories = relationship("BandCategory", secondary=band_venue_categories, lazy="selectin")


# ──────────────────────────────────────────────────────────────────────────────
# Bookings
# ──────────────────────────────────────────────────────────────────────────────

class BandBooking(Base):
    """Booking request between a client and an artist and/or venue.

    Status flow: pending -> counter_offered / accepted / rejected / cancelled
                 accepted -> completed
    """
    __tablename__ = "band_bookings"

    id = Column(Integer, primary_key=True, index=True)
    artist_profile_id = Column(Integer, ForeignKey("band_artist_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    venue_id = Column(Integer, ForeignKey("band_venues.id", ondelete="CASCADE"), nullable=True, index=True)
    client_id = Column(Integer, ForeignKey("band_accounts.id", ondelete="CASCADE"), nullable=False, index=True)

    event_name = Column(String(100), nullable=False)
    event_date = Column(DateTime, nullable=False, index=True)
    start_time = Column(String(10), nullable=False)  # HH:MM
    end_time = Column(String(10), nullable=False)    # HH:MM
    location = Column(String(255), nullable=False)

    proposed_price = Column(Float, nullable=False, default=0.0)
    counter_price = Column(Float, nullable=True)
    status = Column(String(30), nullable=False, default="pending", index=True)

    notes = Column(Text, nullable=True)
    timeline = Column(JSON, nullable=False, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

    client = relationship("BandAccount", foreign_keys=[client_id], lazy="joined")
    artist = relationship("BandArtistProfile", foreign_keys=[artist_profile_id], lazy="joined")
    venue = relationship("BandVenue", foreign_keys=[venue_id], lazy="joined")


# ──────────────────────────────────────────────────────────────────────────────
# Reviews
# ──────────────────────────────────────────────────────────────────────────────

class BandReview(Base):
    __tablename__ = "band_reviews"

    id = Column(Integer, primary_key=True, index=True)
    artist_profile_id = Column(Integer, ForeignKey("band_artist_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    venue_id = Column(Integer, ForeignKey("band_venues.id", ondelete="CASCADE"), nullable=True, index=True)
    client_id = Column(Integer, ForeignKey("band_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("band_bookings.id", ondelete="SET NULL"), nullable=True, index=True)

    rating = Column(Integer, nullable=False, default=5)  # 1-5
    comment = Column(Text, nullable=False)

    reply_comment = Column(Text, nullable=True)
    reply_at = Column(DateTime, nullable=True)

    images = Column(JSON, default=list, nullable=False)
    videos = Column(JSON, default=list, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)


# ──────────────────────────────────────────────────────────────────────────────
# Earnings / wallet ledger
# ──────────────────────────────────────────────────────────────────────────────

class BandTransaction(Base):
    """Wallet ledger row. Balance = sum(credits) - sum(debits)."""
    __tablename__ = "band_transactions"

    id = Column(Integer, primary_key=True, index=True)
    artist_profile_id = Column(Integer, ForeignKey("band_artist_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    venue_id = Column(Integer, ForeignKey("band_venues.id", ondelete="CASCADE"), nullable=True, index=True)
    booking_id = Column(Integer, ForeignKey("band_bookings.id", ondelete="SET NULL"), nullable=True, index=True)
    account_id = Column(Integer, ForeignKey("band_accounts.id", ondelete="CASCADE"), nullable=True, index=True)

    amount = Column(Float, nullable=False, default=0.0)
    type = Column(String(20), nullable=False, default="credit")  # credit|debit
    status = Column(String(30), nullable=False, default="pending")  # pending|completed|failed
    description = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ──────────────────────────────────────────────────────────────────────────────
# Admin settings + audit
# ──────────────────────────────────────────────────────────────────────────────

class BandSystemSetting(Base):
    """Dynamic key/value configuration store (admin-managed)."""
    __tablename__ = "band_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(JSON, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BandAuditLog(Base):
    """Audit trail for administrative actions."""
    __tablename__ = "band_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("band_accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    payload = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ──────────────────────────────────────────────────────────────────────────────
# Notifications (Isolated from Mokijo)
# ──────────────────────────────────────────────────────────────────────────────

class BandNotification(Base):
    """Isolated notification ledger for Band accounts."""
    __tablename__ = "band_notifications"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("band_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=True, index=True)
    reference_type = Column(String(50), nullable=True)
    reference_id = Column(Integer, nullable=True)
    
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    account = relationship("BandAccount")


# ──────────────────────────────────────────────────────────────────────────────
# Messaging (isolated)
# ──────────────────────────────────────────────────────────────────────────────

class BandConversation(Base):
    """Isolated Conversation tracking for BandConnect."""
    __tablename__ = "band_conversations"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("band_bookings.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    client_id = Column(Integer, ForeignKey("band_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    artist_profile_id = Column(Integer, ForeignKey("band_artist_profiles.id", ondelete="CASCADE"), nullable=True, index=True)
    venue_id = Column(Integer, ForeignKey("band_venues.id", ondelete="CASCADE"), nullable=True, index=True)

    status = Column(String(20), nullable=False, default="ACTIVE", index=True)
    last_message_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    booking = relationship("BandBooking")


class BandMessage(Base):
    """Isolated messages linked to a BandConversation."""
    __tablename__ = "band_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("band_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("band_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    
    content = Column(Text, nullable=False)
    attachment_url = Column(String(255), nullable=True)
    offer_amount = Column(Float, nullable=True)
    offer_status = Column(String(20), nullable=True)  # pending | accepted | declined

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    conversation = relationship("BandConversation")


# ──────────────────────────────────────────────────────────────────────────────
# Payments (isolated)
# ──────────────────────────────────────────────────────────────────────────────

class BandPaymentOrder(Base):
    """Isolated Payment tracking for BandConnect."""
    __tablename__ = "band_payment_orders"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("band_bookings.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    client_id = Column(Integer, ForeignKey("band_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    
    razorpay_order_id = Column(String, unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String, nullable=True)
    razorpay_signature = Column(String, nullable=True)
    
    amount = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="created", index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)

    booking = relationship("BandBooking")


# ──────────────────────────────────────────────────────────────────────────────
# Promo Codes & Coupons (isolated)
# ──────────────────────────────────────────────────────────────────────────────

class BandPromoCode(Base):
    """Promotional coupon discount engine for BandConnect."""
    __tablename__ = "band_promos"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    discount_type = Column(String(20), default="percentage", nullable=False)  # percentage | flat
    discount_value = Column(Float, nullable=False)  # e.g., 20 for 20% or 5000 for ₹5000
    min_order_amount = Column(Float, default=0.0, nullable=False)
    max_discount_cap = Column(Float, nullable=True)
    max_uses = Column(Integer, default=100, nullable=False)
    used_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

