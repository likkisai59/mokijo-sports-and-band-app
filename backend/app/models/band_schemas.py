"""
Pydantic schemas for the Band module (centralized, Mokijo-style).

Organized by feature section. Uses Pydantic v2 with `from_attributes = True`
to match the existing `app/models/schemas.py` convention.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, EmailStr


class BandORMSchema(BaseModel):
    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────────────────────────
# Auth / Accounts
# ──────────────────────────────────────────────────────────────────────────────

class BandRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str
    phone: Optional[str] = None
    role: str = Field(default="client", description="client | artist | venue_owner | admin")
    username: Optional[str] = None


class BandLoginRequest(BaseModel):
    email: EmailStr
    password: str


class BandAccountResponse(BandORMSchema):
    id: int
    email: str
    name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime] = None


class BandTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "BandAccountResponse"


class BandChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class BandForgotPasswordRequest(BaseModel):
    email: EmailStr


class BandResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class BandUserStatusUpdate(BaseModel):
    is_active: bool


class BandBulkStatusUpdate(BaseModel):
    user_ids: List[int]
    is_active: bool


# ──────────────────────────────────────────────────────────────────────────────
# Categories
# ──────────────────────────────────────────────────────────────────────────────

class BandCategoryCreate(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    is_active: bool = True


class BandCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class BandCategoryResponse(BandORMSchema):
    id: int
    name: str
    type: str
    description: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None


class BandPaginatedCategoryList(BaseModel):
    items: List[BandCategoryResponse]
    total: int


# ──────────────────────────────────────────────────────────────────────────────
# Locations
# ──────────────────────────────────────────────────────────────────────────────

class BandCountryCreate(BaseModel):
    name: str
    code: str


class BandCountryResponse(BandORMSchema):
    id: int
    name: str
    code: str


class BandStateCreate(BaseModel):
    name: str
    country_id: int


class BandStateResponse(BandORMSchema):
    id: int
    name: str
    country_id: int


class BandCityCreate(BaseModel):
    name: str
    state_id: int


class BandCityResponse(BandORMSchema):
    id: int
    name: str
    state_id: int


class BandAreaCreate(BaseModel):
    name: str
    pincode: str
    city_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius: float = 50.0


class BandAreaUpdate(BaseModel):
    name: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius: Optional[float] = None


class BandAreaResponse(BandORMSchema):
    id: int
    name: str
    pincode: str
    city_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius: float


class BandPaginatedAreaList(BaseModel):
    items: List[BandAreaResponse]
    total: int


# ──────────────────────────────────────────────────────────────────────────────
# Artists
# ──────────────────────────────────────────────────────────────────────────────

class BandUsernameCheckRequest(BaseModel):
    username: str = Field(description="Desired username without or with @ prefix")


class BandUsernameCheckResponse(BaseModel):
    username: str
    available: bool
    reason: Optional[str] = None


class BandUsernameSuggestionsResponse(BaseModel):
    suggestions: List[str]


class BandArtistRegisterRequest(BaseModel):
    """Self-service artist registration (creates account + profile)."""
    email: EmailStr
    password: str = Field(min_length=8)
    name: str
    username: Optional[str] = None
    mobile_number: Optional[str] = None
    display_name: Optional[str] = None
    band_type: str = "Solo"
    total_members: int = 1
    genres: List[str] = Field(default_factory=list)   # category names
    languages: List[str] = Field(default_factory=list)
    base_rate: float = 0.0
    travel_charges: float = 0.0
    bio: Optional[str] = None


class BandArtistProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    base_rate: Optional[float] = None
    band_type: Optional[str] = None
    total_members: Optional[int] = None
    mobile_number: Optional[str] = None
    years_of_experience: Optional[int] = None
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    travel_radius: Optional[float] = None
    travel_charges: Optional[float] = None
    min_booking_hours: Optional[float] = None
    max_booking_hours: Optional[float] = None
    currency: Optional[str] = None
    social_links: Optional[Dict[str, Any]] = None
    achievements: Optional[List[Any]] = None
    documents: Optional[List[Any]] = None
    gallery: Optional[List[Any]] = None
    videos: Optional[List[Any]] = None
    youtube_links: Optional[List[Any]] = None
    instagram_reels: Optional[List[Any]] = None
    equipment: Optional[Union[Dict[str, Any], List[Any]]] = None
    genres: Optional[List[str]] = None
    languages: Optional[List[str]] = None


class BandArtistVerificationUpdate(BaseModel):
    verification_status: str = Field(description="approved | rejected | pending")
    verification_notes: Optional[str] = None


class BandArtistProfileResponse(BandORMSchema):
    id: int
    account_id: int
    display_name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    base_rate: float
    rating: float
    verification_status: str
    verification_notes: Optional[str] = None
    mobile_number: Optional[str] = None
    years_of_experience: int
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    band_type: str
    total_members: int
    currency: str
    travel_radius: float
    travel_charges: float
    min_booking_hours: float
    max_booking_hours: float
    equipment: Any = None
    availability: Any = None
    social_links: Any = None
    achievements: Any = None
    documents: Any = None
    gallery: Any = None
    videos: Any = None
    youtube_links: Any = None
    instagram_reels: Any = None
    pricing_details: Any = None
    genres: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None


class BandPaginatedArtistList(BaseModel):
    items: List[BandArtistProfileResponse]
    total: int


class BandAvailabilityUpdate(BaseModel):
    weekly_schedule: Optional[Dict[str, Any]] = None
    break_time: Optional[Dict[str, Any]] = None
    blocked_dates: Optional[List[str]] = None
    holidays: Optional[List[str]] = None


class BandConflictCheckRequest(BaseModel):
    date: str
    start_time: str  # HH:MM
    end_time: str    # HH:MM


class BandConflictCheckResponse(BaseModel):
    conflict: bool
    reason: Optional[str] = None


class BandMediaUpdate(BaseModel):
    gallery: Optional[List[Any]] = None
    videos: Optional[List[Any]] = None
    youtube_links: Optional[List[Any]] = None
    instagram_reels: Optional[List[Any]] = None


class BandPricingUpdate(BaseModel):
    base_rate: Optional[float] = None
    travel_charges: Optional[float] = None
    pricing_details: Optional[Dict[str, Any]] = None


# ──────────────────────────────────────────────────────────────────────────────
# Venues
# ──────────────────────────────────────────────────────────────────────────────

class BandVenueRegisterRequest(BaseModel):
    """Self-service venue-owner registration (creates account + venue)."""
    email: EmailStr
    password: str = Field(min_length=8)
    name: str  # owner name
    venue_name: str
    description: Optional[str] = None
    address: str
    city_id: Optional[int] = None
    pincode: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    base_price: float = 0.0
    capacity: int = 0
    min_capacity: int = 0
    venue_type: Optional[str] = None
    business_name: Optional[str] = None
    contact_details: Optional[str] = None
    google_map_location: Optional[str] = None
    facilities: List[Any] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)


class BandVenueProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city_id: Optional[int] = None
    pincode: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    base_price: Optional[float] = None
    capacity: Optional[int] = None
    min_capacity: Optional[int] = None
    venue_type: Optional[str] = None
    business_name: Optional[str] = None
    contact_details: Optional[str] = None
    google_map_location: Optional[str] = None
    categories: Optional[List[str]] = None


class BandVenueVerificationUpdate(BaseModel):
    verification_status: str
    verification_notes: Optional[str] = None


class BandVenueResponse(BandORMSchema):
    id: int
    account_id: int
    name: str
    description: Optional[str] = None
    address: str
    city_id: Optional[int] = None
    base_price: float
    capacity: int
    min_capacity: int
    venue_type: Optional[str] = None
    business_name: Optional[str] = None
    contact_details: Optional[str] = None
    pincode: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    google_map_location: Optional[str] = None
    verification_status: str
    verification_notes: Optional[str] = None
    facilities: Any = None
    gallery: Any = None
    pricing_details: Any = None
    availability_rules: Any = None
    documents: Any = None
    metadata_fields: Any = None
    categories: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None


class BandPaginatedVenueList(BaseModel):
    items: List[BandVenueResponse]
    total: int


class BandVenueMediaUpdate(BaseModel):
    gallery: Optional[List[Any]] = None


class BandVenueFacilitiesUpdate(BaseModel):
    facilities: List[Any] = Field(default_factory=list)


class BandVenuePricingUpdate(BaseModel):
    base_price: Optional[float] = None
    pricing_details: Optional[Dict[str, Any]] = None


class BandVenueAvailabilityUpdate(BaseModel):
    availability_rules: Optional[Dict[str, Any]] = None


class BandVenueSettingsUpdate(BaseModel):
    is_deactivated: Optional[bool] = None
    email_alerts: Optional[bool] = None
    sms_alerts: Optional[bool] = None
    profile_visible: Optional[bool] = None


# ──────────────────────────────────────────────────────────────────────────────
# Bookings
# ──────────────────────────────────────────────────────────────────────────────

class BandBookingCreateRequest(BaseModel):
    artist_profile_id: Optional[int] = None
    venue_id: Optional[int] = None
    event_name: str
    event_date: str   # YYYY-MM-DD
    start_time: str    # HH:MM
    end_time: str      # HH:MM
    location: str
    proposed_price: float = 0.0
    notes: Optional[str] = None


class BandCounterOfferRequest(BaseModel):
    counter_price: float
    message: Optional[str] = None


class BandBookingResponse(BandORMSchema):
    id: int
    artist_profile_id: Optional[int] = None
    venue_id: Optional[int] = None
    client_id: int
    event_name: str
    event_date: datetime
    start_time: str
    end_time: str
    location: str
    proposed_price: float
    counter_price: Optional[float] = None
    status: str
    notes: Optional[str] = None
    timeline: List[Any] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    client_mobile: Optional[str] = None
    artist_name: Optional[str] = None
    venue_name: Optional[str] = None
    conversation_id: Optional[int] = None


class BandPaginatedBookingList(BaseModel):
    items: List[BandBookingResponse]
    total: int


# ──────────────────────────────────────────────────────────────────────────────
# Reviews
# ──────────────────────────────────────────────────────────────────────────────

class BandReviewCreateRequest(BaseModel):
    artist_profile_id: Optional[int] = None
    venue_id: Optional[int] = None
    booking_id: Optional[int] = None
    rating: int = Field(ge=1, le=5)
    comment: str
    images: List[Any] = Field(default_factory=list)
    videos: List[Any] = Field(default_factory=list)


class BandReviewReplyRequest(BaseModel):
    reply_comment: str


class BandReviewResponse(BandORMSchema):
    id: int
    artist_profile_id: Optional[int] = None
    venue_id: Optional[int] = None
    client_id: int
    booking_id: Optional[int] = None
    rating: int
    comment: str
    reply_comment: Optional[str] = None
    reply_at: Optional[datetime] = None
    images: List[Any] = Field(default_factory=list)
    videos: List[Any] = Field(default_factory=list)
    created_at: Optional[datetime] = None


class BandReviewSummaryResponse(BaseModel):
    average_rating: float
    total_reviews: int
    rating_distribution: Dict[int, int]
    reviews: List[BandReviewResponse]


# ──────────────────────────────────────────────────────────────────────────────
# Earnings
# ──────────────────────────────────────────────────────────────────────────────

class BandTransactionResponse(BandORMSchema):
    id: int
    artist_profile_id: Optional[int] = None
    venue_id: Optional[int] = None
    booking_id: Optional[int] = None
    account_id: Optional[int] = None
    amount: float
    type: str
    status: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None


class BandMonthlyChartPoint(BaseModel):
    month: str
    revenue: float


class BandEarningsSummaryResponse(BaseModel):
    wallet_balance: float
    total_earnings: float
    monthly_earnings: float
    pending_payments: float
    completed_payments: int
    revenue_chart: List[BandMonthlyChartPoint]
    transactions: List[BandTransactionResponse]


# ──────────────────────────────────────────────────────────────────────────────
# Settings / Audit
# ──────────────────────────────────────────────────────────────────────────────

class BandSystemSettingResponse(BandORMSchema):
    key: str
    value: Any
    description: Optional[str] = None
    updated_at: Optional[datetime] = None


class BandSystemSettingUpdate(BaseModel):
    value: Any
    description: Optional[str] = None


class BandAuditLogResponse(BandORMSchema):
    id: int
    account_id: Optional[int] = None
    action: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    payload: Any = None
    created_at: Optional[datetime] = None


class BandPaginatedAuditLogList(BaseModel):
    items: List[BandAuditLogResponse]
    total: int


# Resolve forward refs
BandTokenResponse.model_rebuild()
BandReviewSummaryResponse.model_rebuild()


# ==============================================================================
# Payments (isolated)
# ==============================================================================

class BandPaymentOrderCreate(BaseModel):
    booking_id: int
    amount: float

class BandPaymentOrderVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class BandPaymentOrderResponse(BandORMSchema):
    id: int
    booking_id: int
    client_id: int
    razorpay_order_id: str
    amount: float
    status: str
    created_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
