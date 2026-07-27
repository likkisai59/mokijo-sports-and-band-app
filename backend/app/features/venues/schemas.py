"""
Pydantic validation schemas for Venue profiles.
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import Field, EmailStr
from app.common.schemas.base import BaseSchema
from app.features.categories.schemas import CategoryResponse
from app.features.artists.schemas import UserBriefResponse


class CityBriefResponse(BaseSchema):
    id: UUID
    name: str


class VenueResponse(BaseSchema):
    id: UUID
    user_id: UUID
    user: UserBriefResponse
    name: str
    # System-generated immutable venue identifier (BCV-XXXXXX format)
    venue_number: Optional[str] = None
    description: Optional[str] = None
    address: str
    city_id: UUID
    city: CityBriefResponse
    
    # Newly added fields
    venue_type: Optional[str] = None
    business_name: Optional[str] = None
    contact_details: Optional[str] = None
    min_capacity: int = 0
    pincode: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    google_map_location: Optional[str] = None

    base_price: float
    capacity: int  # max capacity
    verification_status: str
    verification_notes: Optional[str] = None
    facilities: List[str] = []
    gallery: List[str] = []
    pricing_details: Dict[str, Any] = {}
    availability_rules: Dict[str, Any] = {}
    documents: Dict[str, Any] = {}
    metadata_fields: Dict[str, Any] = {}
    categories: List[CategoryResponse] = []
    created_at: str



class VenueVerificationUpdate(BaseSchema):
    verification_status: str = Field(..., description="Statuses: approved, rejected, pending")
    verification_notes: Optional[str] = Field(None, max_length=255)


class PaginatedVenueList(BaseSchema):
    items: List[VenueResponse]
    total: int


class VenueRegisterRequest(BaseSchema):
    # Step 1: Owner Account
    email: EmailStr
    mobile: str
    password: str

    # Step 2: Owner Details
    owner_name: str
    business_name: str
    contact_details: Optional[str] = None
    contact_person: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None

    # Step 3: Venue Details
    venue_name: str
    venue_type: str  # Marriage Hall, Resort, etc.
    description: Optional[str] = None
    established_year: Optional[int] = None
    indoor_outdoor: Optional[str] = "Both"  # Indoor, Outdoor, Both

    # Step 4: Location
    country: str
    state: str
    district: Optional[str] = None
    city_id: UUID
    area: Optional[str] = None
    address: str
    landmark: Optional[str] = None
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_map_location: Optional[str] = None

    # Step 5: Facilities
    facilities: List[str] = []

    # Step 6: Capacity
    min_capacity: int
    max_capacity: int

    # Step 7: Pricing
    base_price: float
    hourly_price: float
    weekend_price: Optional[float] = 0.0
    holiday_price: Optional[float] = 0.0
    security_deposit: Optional[float] = 0.0
    cancellation_charges: Optional[float] = 0.0
    extra_hour_charges: Optional[float] = 0.0

    # Step 8: Gallery
    cover_image: Optional[str] = None
    images: List[str] = []
    videos: List[str] = []
    youtube_links: List[str] = []
    virtual_tour: Optional[str] = None

    # Step 9: Availability
    weekly_schedule: Dict[str, Any] = {}
    blocked_dates: List[str] = []
    maintenance_days: List[str] = []
    public_holidays: List[str] = []
    booking_buffer_time: Optional[int] = 0

    # Step 10: Documents
    doc_pan: Optional[str] = None
    doc_gst: Optional[str] = None
    doc_ownership_proof: Optional[str] = None
    doc_government_id: Optional[str] = None
    doc_business_license: Optional[str] = None


class VenueProfileCreateRequest(BaseSchema):
    # Owner Details
    owner_name: str
    business_name: str
    contact_details: Optional[str] = None
    contact_person: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None

    # Venue Details
    venue_name: str
    venue_type: str  # Marriage Hall, Resort, etc.
    description: Optional[str] = None
    established_year: Optional[int] = None
    indoor_outdoor: Optional[str] = "Both"  # Indoor, Outdoor, Both

    # Location
    country: str
    state: str
    district: Optional[str] = None
    city_id: UUID
    area: Optional[str] = None
    address: str
    landmark: Optional[str] = None
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_map_location: Optional[str] = None

    # Facilities
    facilities: List[str] = []

    # Capacity
    min_capacity: int
    max_capacity: int

    # Pricing
    base_price: float
    hourly_price: float
    weekend_price: Optional[float] = 0.0
    holiday_price: Optional[float] = 0.0
    security_deposit: Optional[float] = 0.0
    cancellation_charges: Optional[float] = 0.0
    extra_hour_charges: Optional[float] = 0.0

    # Gallery
    cover_image: Optional[str] = None
    images: List[str] = []
    videos: List[str] = []
    youtube_links: List[str] = []
    virtual_tour: Optional[str] = None

    # Availability
    weekly_schedule: Dict[str, Any] = {}
    blocked_dates: List[str] = []
    maintenance_days: List[str] = []
    public_holidays: List[str] = []
    booking_buffer_time: Optional[int] = 0

    # Documents
    doc_pan: Optional[str] = None
    doc_gst: Optional[str] = None
    doc_ownership_proof: Optional[str] = None
    doc_government_id: Optional[str] = None
    doc_business_license: Optional[str] = None


class VenueDashboardResponse(BaseSchema):
    total_bookings: int
    upcoming_events_count: int
    active_bookings_count: int
    pending_requests_count: int
    monthly_revenue: float
    total_revenue: float
    average_rating: float
    profile_completion: int
    venue_views: int

    todays_bookings: List[Dict[str, Any]] = []
    upcoming_events: List[Dict[str, Any]] = []
    pending_requests: List[Dict[str, Any]] = []
    latest_reviews: List[Dict[str, Any]] = []
    revenue_summary: Dict[str, Any] = {}
    revenue_chart: List[Dict[str, Any]] = []
    booking_stats: Dict[str, Any] = {}
    occupancy_rate: float
    calendar_overview: Dict[str, Any] = {}
    recent_activity: List[Dict[str, Any]] = []
    notifications: List[Dict[str, Any]] = []
    performance: Dict[str, Any] = {}


class VenueProfileUpdateRequest(BaseSchema):
    owner_name: str
    business_name: str
    contact_details: Optional[str] = None
    contact_person: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None

    venue_name: str
    venue_type: str
    description: Optional[str] = None
    established_year: Optional[int] = None
    indoor_outdoor: Optional[str] = "Both"

    country: str
    state: str
    district: Optional[str] = None
    city_id: UUID
    area: Optional[str] = None
    address: str
    landmark: Optional[str] = None
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_map_location: Optional[str] = None

    facilities: List[str] = []
    min_capacity: int
    max_capacity: int

    weekly_schedule: Dict[str, Any] = {}
    blocked_dates: List[str] = []
    maintenance_days: List[str] = []
    public_holidays: List[str] = []
    booking_buffer_time: Optional[int] = 0

    youtube_links: List[str] = []
    doc_pan: Optional[str] = None
    doc_gst: Optional[str] = None
    doc_ownership_proof: Optional[str] = None
    doc_government_id: Optional[str] = None
    doc_business_license: Optional[str] = None


class GalleryItemSchema(BaseSchema):
    url: str
    is_cover: bool = False
    album: str = "General"


class VideoItemSchema(BaseSchema):
    url: str
    category: str = "General"


class VenueMediaResponse(BaseSchema):
    cover_image: Optional[str] = None
    gallery: List[GalleryItemSchema] = []
    videos: List[VideoItemSchema] = []
    youtube_links: List[str] = []
    virtual_tour: Optional[str] = None


class VenueMediaUpdateRequest(BaseSchema):
    cover_image: Optional[str] = None
    gallery: List[GalleryItemSchema] = []
    videos: List[VideoItemSchema] = []
    youtube_links: List[str] = []
    virtual_tour: Optional[str] = None


class VenueWeeklyScheduleItem(BaseSchema):
    available: bool = True
    start: str = "09:00"
    end: str = "22:00"


class VenueBookingItem(BaseSchema):
    id: str
    client_name: str
    event_name: str
    date: str
    start_time: str
    end_time: str
    status: str = "confirmed"


class VenueAvailabilityResponse(BaseSchema):
    weekly_schedule: Dict[str, VenueWeeklyScheduleItem] = {}
    blocked_dates: List[str] = []
    maintenance_days: List[str] = []
    public_holidays: List[str] = []
    booking_buffer_time: int = 0
    bookings: List[VenueBookingItem] = []


class VenueAvailabilityUpdateRequest(BaseSchema):
    weekly_schedule: Dict[str, VenueWeeklyScheduleItem]
    blocked_dates: List[str]
    maintenance_days: List[str]
    public_holidays: List[str]
    booking_buffer_time: int


class CheckConflictRequest(BaseSchema):
    date: str
    start_time: str
    end_time: str


class CheckConflictResponse(BaseSchema):
    conflict: bool
    reason: Optional[str] = None


class VenueFacilitiesResponse(BaseSchema):
    facilities: List[str] = []
    details: Dict[str, Any] = {}


class VenueFacilitiesUpdateRequest(BaseSchema):
    facilities: List[str]
    details: Dict[str, Any]


class VenueDiscountSchema(BaseSchema):
    name: str
    type: str = "percentage"  # percentage or flat
    value: float


class VenuePricingResponse(BaseSchema):
    base_price: float
    hourly_price: float = 0.0
    half_day_price: float = 0.0
    full_day_price: float = 0.0
    weekend_price: float = 0.0
    holiday_price: float = 0.0
    security_deposit: float = 0.0
    cleaning_charges: float = 0.0
    cancellation_charges: float = 0.0
    discounts: List[VenueDiscountSchema] = []
    tax_percentage: float = 0.0
    currency: str = "INR"


class VenuePricingUpdateRequest(BaseSchema):
    base_price: float
    hourly_price: float
    half_day_price: float
    full_day_price: float
    weekend_price: float
    holiday_price: float
    security_deposit: float
    cleaning_charges: float
    cancellation_charges: float
    discounts: List[VenueDiscountSchema]
    tax_percentage: float
    currency: str


class KeyValuePair(BaseSchema):
    name: str
    value: float


class VenueChartDataPoint(BaseSchema):
    month: str
    value: float


class VenueAnalyticsResponse(BaseSchema):
    total_bookings: int
    upcoming_events_count: int
    active_bookings_count: int
    pending_requests_count: int
    monthly_revenue: float
    total_revenue: float
    average_rating: float
    venue_views: int
    occupancy_rate: float
    monthly_growth_rate: float
    
    revenue_chart: List[VenueChartDataPoint] = []
    booking_chart: List[VenueChartDataPoint] = []
    occupancy_chart: List[VenueChartDataPoint] = []
    
    popular_event_types: List[KeyValuePair] = []
    top_clients: List[KeyValuePair] = []
    top_cities: List[KeyValuePair] = []
    peak_seasons: List[KeyValuePair] = []


class VenueDocumentsResubmitRequest(BaseSchema):
    doc_pan: str
    doc_gst: Optional[str] = None
    doc_ownership_proof: str
    doc_government_id: str
    doc_business_license: str


class VenueSettingsUpdateRequest(BaseSchema):
    is_deactivated: bool
    email_alerts: bool
    sms_alerts: bool
    profile_visible: bool







