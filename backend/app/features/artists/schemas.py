"""
Pydantic validation schemas for Artist profiles.
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import Field, EmailStr
from app.common.schemas.base import BaseSchema
from app.features.categories.schemas import CategoryResponse


class UserBriefResponse(BaseSchema):
    id: UUID
    name: str
    email: str
    is_active: bool


class ArtistRegisterRequest(BaseSchema):
    email: EmailStr
    mobile_number: str = Field(..., min_length=10, max_length=20)
    password: str = Field(..., min_length=8, description="Password must be at least 8 char long")
    name: str = Field(..., min_length=2, max_length=150, description="Band or artist legal name")
    
    # Step 2
    display_name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = Field(None, max_length=2000)
    years_of_experience: int = Field(0, ge=0)
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    
    # Step 3
    band_type: str = Field("Solo", description="Solo, Duo, Trio, 4 Members, 5+ Members")
    total_members: int = Field(1, ge=1)
    languages: List[str] = Field(..., description="List of language names, e.g. ['Tamil', 'English']")
    genres: List[str] = Field(..., description="List of genre names, e.g. ['Melody', 'Rock']")
    
    # Step 4
    base_rate: float = Field(0.0, ge=0.0)
    currency: str = Field("INR", max_length=10)
    travel_radius: float = Field(0.0, ge=0.0)
    travel_charges: float = Field(0.0, ge=0.0)
    min_booking_hours: float = Field(0.0, ge=0.0)
    max_booking_hours: float = Field(0.0, ge=0.0)
    
    # Step 5
    equipment: Dict[str, bool] = Field(default_factory=dict)
    
    # Step 6
    gallery: List[str] = Field(default_factory=list)
    videos: List[str] = Field(default_factory=list)
    youtube_links: List[str] = Field(default_factory=list)
    
    # Step 7
    availability: Dict[str, Any] = Field(default_factory=dict)


class ArtistProfileCreateRequest(BaseSchema):
    """
    Used by an already-authenticated artist user (registered via /auth/register)
    to create their initial Artist/Band profile. No email/password needed — 
    the user account already exists. user_id is taken from JWT claims.
    """
    # Identity
    display_name: str = Field(..., min_length=2, max_length=150)
    mobile_number: str = Field(..., min_length=10, max_length=20)
    bio: Optional[str] = Field(None, max_length=2000)
    years_of_experience: int = Field(0, ge=0)
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

    # Band composition
    band_type: str = Field("Solo", description="Solo, Duo, Trio, 4 Members, 5+ Members")
    total_members: int = Field(1, ge=1)

    # Performance categories (names resolved to categories on backend)
    languages: List[str] = Field(default_factory=list)
    genres: List[str] = Field(default_factory=list)

    # Pricing
    base_rate: float = Field(0.0, ge=0.0)
    currency: str = Field("INR", max_length=10)
    travel_radius: float = Field(0.0, ge=0.0)
    travel_charges: float = Field(0.0, ge=0.0)
    min_booking_hours: float = Field(0.0, ge=0.0)
    max_booking_hours: float = Field(0.0, ge=0.0)

    # Equipment
    equipment: Dict[str, bool] = Field(default_factory=dict)

    # Media
    gallery: List[str] = Field(default_factory=list)
    videos: List[str] = Field(default_factory=list)
    youtube_links: List[str] = Field(default_factory=list)

    # Availability
    availability: Dict[str, Any] = Field(default_factory=dict)
    documents: Optional[Dict[str, Any]] = None


class ArtistProfileResponse(BaseSchema):
    id: UUID
    user_id: UUID
    user: UserBriefResponse
    bio: Optional[str] = None
    base_rate: float
    rating: float
    verification_status: str
    verification_notes: Optional[str] = None
    
    display_name: Optional[str] = None
    mobile_number: Optional[str] = None
    years_of_experience: int
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    band_type: str
    total_members: int
    currency: str
    travel_radius: float
    travel_charges: float
    min_booking_hours: float
    max_booking_hours: float
    equipment: Dict[str, bool] = {}
    availability: Dict[str, Any] = {}
    social_links: Dict[str, str] = {}
    achievements: List[str] = []
    
    documents: Optional[Dict[str, Any]] = None
    gallery: List[Any] = []
    videos: List[Any] = []
    youtube_links: List[str] = []
    instagram_reels: List[str] = []
    pricing_details: Dict[str, Any] = {}
    genres: List[CategoryResponse] = []
    languages: List[CategoryResponse] = []
    created_at: str


class GalleryItem(BaseSchema):
    url: str
    is_cover: bool = False
    album: str = "General"


class VideoItem(BaseSchema):
    url: str
    type: str = "file"  # file, youtube, instagram
    category: str = "Performance"  # Performance, Studio, Promo
    thumbnail: Optional[str] = None


class MediaGalleryUpdate(BaseSchema):
    gallery: List[GalleryItem] = []
    videos: List[VideoItem] = []
    youtube_links: List[str] = []
    instagram_reels: List[str] = []


class PackageItem(BaseSchema):
    name: str
    price: float
    description: Optional[str] = None


class SpecialOfferItem(BaseSchema):
    title: str
    discount: float
    description: Optional[str] = None


class PricingUpdate(BaseSchema):
    base_rate: float
    currency: str = "INR"
    travel_radius: Optional[float] = 0.0
    travel_charges: float = 0.0
    min_booking_hours: float = 0.0
    max_booking_hours: float = 0.0
    weekend_surcharge: float = 0.0
    holiday_surcharge: float = 0.0
    packages: List[PackageItem] = []
    special_offers: List[SpecialOfferItem] = []


class ArtistProfileUpdate(BaseSchema):
    name: Optional[str] = None  # Maps to User.name
    display_name: Optional[str] = None
    mobile_number: Optional[str] = None
    bio: Optional[str] = None
    years_of_experience: Optional[int] = None
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    band_type: Optional[str] = None
    total_members: Optional[int] = None
    base_rate: Optional[float] = None
    currency: Optional[str] = None
    travel_radius: Optional[float] = None
    travel_charges: Optional[float] = None
    min_booking_hours: Optional[float] = None
    max_booking_hours: Optional[float] = None
    equipment: Optional[Dict[str, bool]] = None
    languages: Optional[List[str]] = None
    genres: Optional[List[str]] = None
    social_links: Optional[Dict[str, str]] = None
    achievements: Optional[List[str]] = None
    instagram_reels: Optional[List[str]] = None
    documents: Optional[Dict[str, Any]] = None


class ArtistVerificationUpdate(BaseSchema):
    verification_status: str = Field(..., description="Statuses: approved, rejected, pending")
    verification_notes: Optional[str] = Field(None, max_length=255)


class PaginatedArtistList(BaseSchema):
    items: List[ArtistProfileResponse]
    total: int


class UpcomingEvent(BaseSchema):
    id: UUID
    client_name: str
    event_name: str
    date: str
    time: str
    location: str
    status: str
    amount: float


class BookingRequest(BaseSchema):
    id: UUID
    client_name: str
    event_name: str
    date: str
    amount: float
    status: str


class ReviewSummary(BaseSchema):
    id: UUID
    client_name: str
    rating: float
    comment: str
    date: str


class NotificationSummary(BaseSchema):
    id: UUID
    title: str
    message: str
    created_at: str
    is_read: bool


class ChartDataPoint(BaseSchema):
    month: str
    revenue: float
    bookings: int


class ArtistDashboardResponse(BaseSchema):
    total_bookings: int
    upcoming_events_count: int
    pending_requests_count: int
    monthly_revenue: float
    total_earnings: float
    average_rating: float
    profile_completion: int
    profile_views: int
    upcoming_events: List[UpcomingEvent] = []
    recent_booking_requests: List[BookingRequest] = []
    recent_reviews: List[ReviewSummary] = []
    notifications: List[NotificationSummary] = []
    revenue_chart: List[ChartDataPoint] = []


class WeeklyTimeSlot(BaseSchema):
    available: bool = False
    start: str = "09:00"
    end: str = "22:00"


class BreakTime(BaseSchema):
    start: str = "13:00"
    end: str = "14:00"


class AvailabilityUpdate(BaseSchema):
    weekly_schedule: Dict[str, WeeklyTimeSlot] = {}
    break_time: BreakTime = BreakTime()
    blocked_dates: List[str] = []
    holidays: List[str] = []


class ConflictCheckRequest(BaseSchema):
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM


class ConflictCheckResponse(BaseSchema):
    has_conflict: bool
    reason: Optional[str] = None


class KeyValuePair(BaseSchema):
    name: str
    value: float


class PeakTimePoint(BaseSchema):
    time_slot: str
    count: int


class RatingPoint(BaseSchema):
    date: str
    rating: float


class AnalyticsResponse(BaseSchema):
    booking_growth: float
    revenue_growth: float
    profile_views: int
    booking_conversion: float
    popular_event_types: List[KeyValuePair] = []
    top_cities: List[KeyValuePair] = []
    monthly_performance: List[ChartDataPoint] = []
    peak_booking_times: List[PeakTimePoint] = []
    rating_trends: List[RatingPoint] = []
