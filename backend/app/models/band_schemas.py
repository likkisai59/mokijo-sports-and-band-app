"""
Pydantic schemas for the Band module (centralized, Mokijo-style).

Organized by feature section. Uses Pydantic v2 with `from_attributes = True`
to match the existing `app/models/schemas.py` convention.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, EmailStr

from typing_extensions import Annotated
from pydantic import StringConstraints, field_validator, AfterValidator

def validate_password(v: str) -> str:
    if len(v) < 8 or len(v) > 50:
        raise ValueError("Password must be between 8 and 50 characters")
    if not any(c.islower() for c in v):
        raise ValueError("Password must contain at least one lowercase letter")
    if not any(c.isupper() for c in v):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(c.isdigit() for c in v):
        raise ValueError("Password must contain at least one number")
    if not any(c in "@$!%*?&" for c in v):
        raise ValueError("Password must contain at least one special character (@$!%*?&)")
    return v

# Reusable strict types for validation
StrippedStr = Annotated[str, StringConstraints(strip_whitespace=True)]
NameStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=50, pattern=r"^[A-Za-z]+(?: [A-Za-z]+)*$")]
PhoneStr = Annotated[str, StringConstraints(strip_whitespace=True, pattern=r"^\+?[1-9]\d{9,14}$")]
PasswordStr = Annotated[str, StringConstraints(strip_whitespace=True), AfterValidator(validate_password)]
DescStr = Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)]
PositiveFloat = Annotated[float, Field(ge=0.0)]
PositiveInt = Annotated[int, Field(ge=0)]



class BandORMSchema(BaseModel):
    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────────────────────────
# Auth / Accounts
# ──────────────────────────────────────────────────────────────────────────────

class BandRegisterRequest(BaseModel):
    email: EmailStr
    password: PasswordStr
    name: NameStr
    phone: Optional[PhoneStr] = None
    role: str = Field(default="client", description="client | artist | venue_owner | admin")


class BandLoginRequest(BaseModel):
    email: EmailStr
    password: str


class BandAccountResponse(BandORMSchema):
    id: int
    email: str
    name: NameStr
    phone: Optional[PhoneStr] = None
    role: str
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime] = None


class BandTokenResponse(BaseModel):
    access_token: StrippedStr
    token_type: StrippedStr = "bearer"
    user: "BandAccountResponse"


class BandChangePasswordRequest(BaseModel):
    current_password: StrippedStr
    new_password: PasswordStr


class BandForgotPasswordRequest(BaseModel):
    email: EmailStr


class BandResetPasswordRequest(BaseModel):
    token: StrippedStr
    new_password: PasswordStr


class BandUserStatusUpdate(BaseModel):
    is_active: bool


class BandBulkStatusUpdate(BaseModel):
    user_ids: List[int]
    is_active: bool


# ──────────────────────────────────────────────────────────────────────────────
# Categories
# ──────────────────────────────────────────────────────────────────────────────

class BandCategoryCreate(BaseModel):
    name: NameStr
    type: StrippedStr
    description: Optional[DescStr] = None
    is_active: bool = True


class BandCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[DescStr] = None
    is_active: Optional[bool] = None


class BandCategoryResponse(BandORMSchema):
    id: int
    name: NameStr
    type: StrippedStr
    description: Optional[DescStr] = None
    is_active: bool
    created_at: Optional[datetime] = None


class BandPaginatedCategoryList(BaseModel):
    items: List[BandCategoryResponse]
    total: int


# ──────────────────────────────────────────────────────────────────────────────
# Locations
# ──────────────────────────────────────────────────────────────────────────────

class BandCountryCreate(BaseModel):
    name: NameStr
    code: str


class BandCountryResponse(BandORMSchema):
    id: int
    name: NameStr
    code: str


class BandStateCreate(BaseModel):
    name: NameStr
    country_id: int


class BandStateResponse(BandORMSchema):
    id: int
    name: NameStr
    country_id: int


class BandCityCreate(BaseModel):
    name: NameStr
    state_id: int


class BandCityResponse(BandORMSchema):
    id: int
    name: NameStr
    state_id: int


class BandAreaCreate(BaseModel):
    name: NameStr
    pincode: StrippedStr
    city_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius: float = 50.0


class BandAreaUpdate(BaseModel):
    name: Optional[str] = None
    pincode: Optional[StrippedStr] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius: Optional[float] = None


class BandAreaResponse(BandORMSchema):
    id: int
    name: NameStr
    pincode: StrippedStr
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

class BandArtistRegisterRequest(BaseModel):
    """Self-service artist registration (creates account + profile)."""
    email: EmailStr
    password: PasswordStr
    name: NameStr
    mobile_number: Optional[PhoneStr] = None
    display_name: Optional[NameStr] = None
    band_type: StrippedStr = "Solo"
    total_members: PositiveInt = 1
    genres: List[str] = Field(default_factory=list)   # category names
    languages: List[str] = Field(default_factory=list)
    base_rate: PositiveFloat = 0.0
    travel_charges: PositiveFloat = 0.0
    bio: Optional[DescStr] = None


class BandArtistProfileUpdate(BaseModel):
    display_name: Optional[NameStr] = None
    bio: Optional[DescStr] = None
    base_rate: Optional[PositiveFloat] = None
    band_type: Optional[str] = None
    total_members: Optional[PositiveInt] = None
    mobile_number: Optional[PhoneStr] = None
    years_of_experience: Optional[PositiveInt] = None
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    travel_radius: Optional[PositiveFloat] = None
    travel_charges: Optional[PositiveFloat] = None
    min_booking_hours: Optional[PositiveFloat] = None
    max_booking_hours: Optional[PositiveFloat] = None
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
    verification_notes: Optional[DescStr] = None


class BandArtistProfileResponse(BandORMSchema):
    id: int
    account_id: int
    display_name: Optional[NameStr] = None
    bio: Optional[DescStr] = None
    base_rate: float
    rating: float
    verification_status: str
    verification_notes: Optional[DescStr] = None
    mobile_number: Optional[PhoneStr] = None
    years_of_experience: int
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    band_type: StrippedStr
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
    base_rate: Optional[PositiveFloat] = None
    travel_charges: Optional[PositiveFloat] = None
    pricing_details: Optional[Dict[str, Any]] = None


# ──────────────────────────────────────────────────────────────────────────────
# Venues
# ──────────────────────────────────────────────────────────────────────────────

class BandVenueRegisterRequest(BaseModel):
    """Self-service venue-owner registration (creates account + venue)."""
    email: EmailStr
    password: PasswordStr
    name: NameStr  # owner name
    venue_name: NameStr
    description: Optional[DescStr] = None
    address: StrippedStr
    city_id: Optional[int] = None
    pincode: Optional[StrippedStr] = None
    state: Optional[StrippedStr] = None
    country: Optional[StrippedStr] = None
    base_price: PositiveFloat = 0.0
    capacity: PositiveInt = 0
    min_capacity: PositiveInt = 0
    venue_type: Optional[StrippedStr] = None
    business_name: Optional[StrippedStr] = None
    contact_details: Optional[DescStr] = None
    google_map_location: Optional[str] = None
    facilities: List[Any] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)


class BandVenueProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[DescStr] = None
    address: Optional[StrippedStr] = None
    city_id: Optional[int] = None
    pincode: Optional[StrippedStr] = None
    state: Optional[StrippedStr] = None
    country: Optional[StrippedStr] = None
    base_price: Optional[PositiveFloat] = None
    capacity: Optional[PositiveInt] = None
    min_capacity: Optional[PositiveInt] = None
    venue_type: Optional[StrippedStr] = None
    business_name: Optional[StrippedStr] = None
    contact_details: Optional[DescStr] = None
    google_map_location: Optional[str] = None
    categories: Optional[List[str]] = None


class BandVenueVerificationUpdate(BaseModel):
    verification_status: str
    verification_notes: Optional[DescStr] = None


class BandVenueResponse(BandORMSchema):
    id: int
    account_id: int
    name: NameStr
    description: Optional[DescStr] = None
    address: StrippedStr
    city_id: Optional[int] = None
    base_price: float
    capacity: int
    min_capacity: int
    venue_type: Optional[StrippedStr] = None
    business_name: Optional[StrippedStr] = None
    contact_details: Optional[DescStr] = None
    pincode: Optional[StrippedStr] = None
    state: Optional[StrippedStr] = None
    country: Optional[StrippedStr] = None
    google_map_location: Optional[str] = None
    verification_status: str
    verification_notes: Optional[DescStr] = None
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
    base_price: Optional[PositiveFloat] = None
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
    event_name: NameStr
    event_date: str   # YYYY-MM-DD
    start_time: str    # HH:MM
    end_time: str      # HH:MM
    location: StrippedStr
    proposed_price: PositiveFloat = 0.0
    notes: Optional[DescStr] = None

    @field_validator("event_date")
    @classmethod
    def validate_date(cls, v):
        from datetime import datetime
        try:
            d = datetime.strptime(v, "%Y-%m-%d").date()
            if d < datetime.now().date():
                raise ValueError("Booking date cannot be in the past")
        except ValueError as e:
            if "does not match format" in str(e):
                raise ValueError("Invalid date format, use YYYY-MM-DD")
            raise e
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, v):
        from datetime import datetime
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            raise ValueError("Invalid time format, use HH:MM")
        return v


class BandCounterOfferRequest(BaseModel):
    counter_price: PositiveFloat
    message: Optional[DescStr] = None


class BandBookingResponse(BandORMSchema):
    id: int
    artist_profile_id: Optional[int] = None
    venue_id: Optional[int] = None
    client_id: int
    event_name: NameStr
    event_date: datetime
    start_time: str
    end_time: str
    location: StrippedStr
    proposed_price: float
    counter_price: Optional[float] = None
    status: str
    notes: Optional[DescStr] = None

    @field_validator("event_date")
    @classmethod
    def validate_date(cls, v):
        from datetime import datetime
        try:
            d = datetime.strptime(v, "%Y-%m-%d").date()
            if d < datetime.now().date():
                raise ValueError("Booking date cannot be in the past")
        except ValueError as e:
            if "does not match format" in str(e):
                raise ValueError("Invalid date format, use YYYY-MM-DD")
            raise e
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, v):
        from datetime import datetime
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            raise ValueError("Invalid time format, use HH:MM")
        return v
    timeline: List[Any] = Field(default_factory=list)
    created_at: Optional[datetime] = None


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
    comment: DescStr
    images: List[Any] = Field(default_factory=list)
    videos: List[Any] = Field(default_factory=list)


class BandReviewReplyRequest(BaseModel):
    reply_comment: DescStr


class BandReviewResponse(BandORMSchema):
    id: int
    artist_profile_id: Optional[int] = None
    venue_id: Optional[int] = None
    client_id: int
    booking_id: Optional[int] = None
    rating: int
    comment: DescStr
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
    type: StrippedStr
    status: str
    description: Optional[DescStr] = None
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
    description: Optional[DescStr] = None
    updated_at: Optional[datetime] = None


class BandSystemSettingUpdate(BaseModel):
    value: Any
    description: Optional[DescStr] = None


class BandAuditLogResponse(BandORMSchema):
    id: int
    account_id: Optional[int] = None
    action: str
    ip_address: Optional[StrippedStr] = None
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
