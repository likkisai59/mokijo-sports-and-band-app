from pydantic import BaseModel, computed_field
from typing import Optional, List
from datetime import datetime

class MemberCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    role: Optional[str] = "Member"

class MemberResponse(BaseModel):
    id: int
    group_id: int
    first_name: str
    last_name: str
    email: str
    phone: str
    role: str

    class Config:
        from_attributes = True

class MemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None


class EventCreate(BaseModel):
    name: str
    type: str
    date: str
    time: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    owner_id: Optional[int] = None
    group_id: Optional[int] = None
    
    cover_image: Optional[str] = None
    registration_deadline: Optional[str] = None
    max_participants: Optional[int] = None
    fee: Optional[int] = 0
    
    auto_reminder: Optional[bool] = False
    attendance_tracking: Optional[bool] = False
    is_public: Optional[bool] = True
    allow_guest: Optional[bool] = False
    allow_waiting_list: Optional[bool] = False
    
    rules_pdf: Optional[str] = None
    schedule_file: Optional[str] = None
    permission_forms: Optional[str] = None
    match_fixtures: Optional[str] = None
    event_posters: Optional[str] = None

class EventUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    group_id: Optional[int] = None
    
    cover_image: Optional[str] = None
    registration_deadline: Optional[str] = None
    max_participants: Optional[int] = None
    fee: Optional[int] = None
    
    auto_reminder: Optional[bool] = None
    attendance_tracking: Optional[bool] = None
    is_public: Optional[bool] = None
    allow_guest: Optional[bool] = None
    allow_waiting_list: Optional[bool] = None
    
    rules_pdf: Optional[str] = None
    schedule_file: Optional[str] = None
    permission_forms: Optional[str] = None
    match_fixtures: Optional[str] = None
    event_posters: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    group_id: Optional[int] = None
    owner_id: Optional[int] = None
    name: str
    type: str
    date: str
    time: Optional[str]
    start_time: Optional[str]
    end_time: Optional[str]
    location: Optional[str]
    description: Optional[str]
    
    cover_image: Optional[str] = None
    registration_deadline: Optional[str] = None
    max_participants: Optional[int] = None
    fee: Optional[int] = 0
    
    auto_reminder: bool
    attendance_tracking: bool
    is_public: bool
    allow_guest: bool
    allow_waiting_list: bool
    
    rules_pdf: Optional[str] = None
    schedule_file: Optional[str] = None
    permission_forms: Optional[str] = None
    match_fixtures: Optional[str] = None
    event_posters: Optional[str] = None
    group_name: Optional[str] = None

    class Config:
        from_attributes = True

class EventRegistrationCreate(BaseModel):
    event_id: int
    member_id: Optional[int] = None
    participant_name: str
    participant_email: Optional[str] = None
    participant_role: Optional[str] = "Member"
    status: Optional[str] = "pending"

class EventRegistrationUpdate(BaseModel):
    status: Optional[str] = None
    attendance: Optional[str] = None

class EventRegistrationResponse(BaseModel):
    id: int
    event_id: int
    member_id: Optional[int] = None
    participant_name: str
    participant_email: Optional[str] = None
    participant_role: Optional[str] = None
    status: str
    attendance: str
    invited_at: datetime
    responded_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class GroupCreate(BaseModel):
    activity: str
    age_group: str
    group_name: str
    sub_group: Optional[str] = None
    description: Optional[str] = None
    owner_id: int # ID of the user who owns this group

class GroupResponse(BaseModel):
    id: int
    activity: str
    age_group: str
    group_name: str
    sub_group: Optional[str]
    description: Optional[str]
    members: List[MemberResponse] = []
    events: List[EventResponse] = []

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    clubName: str
    country: str
    state: Optional[str] = None
    memberCount: Optional[str] = None
    sport: Optional[str] = None
    firstName: str
    lastName: str
    email: str
    password: str
    phone: Optional[str] = None
    aadharNumber: Optional[str] = None
    hearAbout: Optional[str] = None

class StandardUserRegister(BaseModel):
    firstName: str
    lastName: str
    dob: str
    email: str
    password: str
    phone: str
    aadharNumber: str

class UserResponse(BaseModel):
    id: int
    club_name: Optional[str]
    first_name: str
    email: str
    is_verified: bool

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str
    password: str

class FundraisingCampaignCreate(BaseModel):
    title: str
    goal: int
    description: Optional[str] = None
    deadline: Optional[str] = None
    group_name: Optional[str] = None
    owner_id: int

class FundraisingCampaignResponse(BaseModel):
    id: int
    owner_id: int
    title: str
    description: Optional[str]
    goal: int
    raised: int
    status: str
    deadline: Optional[str]
    group_name: Optional[str]
    donors_count: int

    class Config:
        from_attributes = True

class DonationCreate(BaseModel):
    amount: int
    donor_name: Optional[str] = "Anonymous"
    donor_email: Optional[str] = None
    group_id: Optional[int] = None

class PaymentCreate(BaseModel):
    title: str
    amount: int
    owner_id: int
    description: Optional[str] = None
    category: Optional[str] = "Membership Fee"
    due_date: Optional[str] = None
    group_id: Optional[int] = None
    member_id: Optional[int] = None
    status: Optional[str] = "pending"
    payment_method: Optional[str] = None
    paid_at: Optional[str] = None

class PaymentUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[int] = None
    description: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[str] = None
    group_id: Optional[int] = None
    member_id: Optional[int] = None
    status: Optional[str] = None
    payment_method: Optional[str] = None
    paid_at: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    owner_id: int
    group_id: Optional[int]
    member_id: Optional[int]
    title: str
    description: Optional[str]
    category: str
    amount: int
    due_date: Optional[str]
    status: str
    payment_method: Optional[str]
    paid_at: Optional[str]
    created_at: Optional[str] = None
    group_name: Optional[str] = None
    member_name: Optional[str] = None

    class Config:
        from_attributes = True

class RazorpayOrderCreate(BaseModel):
    payment_id: int
    owner_id: int

class RazorpayOrderResponse(BaseModel):
    key_id: str
    razorpay_order_id: str
    local_order_id: int
    payment_id: int
    amount: int
    currency: str
    name: str
    description: Optional[str] = None
    prefill_name: Optional[str] = None
    prefill_email: Optional[str] = None
    prefill_contact: Optional[str] = None

class RazorpayVerifyRequest(BaseModel):
    payment_id: int
    owner_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class CourseCreate(BaseModel):
    title: str
    owner_id: int
    code: Optional[str] = None
    category: Optional[str] = "Training"
    level: Optional[str] = None
    description: Optional[str] = None
    instructor: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    schedule: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = 20
    fee: Optional[int] = 0
    status: Optional[str] = "open"
    group_id: Optional[int] = None

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    code: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    description: Optional[str] = None
    instructor: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    schedule: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    fee: Optional[int] = None
    status: Optional[str] = None
    group_id: Optional[int] = None

class CourseResponse(BaseModel):
    id: int
    owner_id: int
    group_id: Optional[int]
    title: str
    code: Optional[str]
    category: str
    level: Optional[str]
    description: Optional[str]
    instructor: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    schedule: Optional[str]
    location: Optional[str]
    capacity: int
    fee: int
    status: str
    created_at: Optional[str] = None
    group_name: Optional[str] = None
    registration_count: int = 0
    available_seats: int = 0
    paid_count: int = 0

    class Config:
        from_attributes = True

class CourseRegistrationCreate(BaseModel):
    owner_id: int
    member_id: Optional[int] = None
    participant_name: Optional[str] = None
    participant_email: Optional[str] = None
    participant_phone: Optional[str] = None
    status: Optional[str] = "registered"
    payment_status: Optional[str] = "unpaid"
    notes: Optional[str] = None

class CourseRegistrationUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None

class CourseRegistrationResponse(BaseModel):
    id: int
    owner_id: int
    course_id: int
    member_id: Optional[int]
    participant_name: str
    participant_email: Optional[str]
    participant_phone: Optional[str]
    status: str
    payment_status: str
    notes: Optional[str]
    registered_at: Optional[str] = None
    course_title: Optional[str] = None
    group_name: Optional[str] = None

    class Config:
        from_attributes = True

class SignupFormCreate(BaseModel):
    owner_id: int
    role: str
    title: str
    description: Optional[str] = None
    fields: str

class SignupFormResponse(BaseModel):
    id: int
    owner_id: int
    role: str
    title: str
    description: Optional[str]
    fields: str

    class Config:
        from_attributes = True

class SignupSubmissionCreate(BaseModel):
    owner_id: int
    role: str
    submitted_data: str

class SignupSubmissionResponse(BaseModel):
    id: int
    owner_id: int
    role: str
    submitted_data: str
    created_at: datetime

    class Config:
        from_attributes = True

class CourtCreate(BaseModel):
    venue_id: int
    name: str
    sport_type: str
    capacity: Optional[int] = 4
    price_per_hour: Optional[int] = None

class CourtResponse(BaseModel):
    id: int
    venue_id: int
    name: str
    sport_type: str
    capacity: int
    price_per_hour: Optional[int]

    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    user_id: int
    rating: int
    comment: Optional[str] = None
    booking_id: Optional[int] = None

class ReviewResponse(BaseModel):
    id: int
    venue_id: int
    user_id: int
    booking_id: Optional[int] = None
    rating: int
    comment: Optional[str]
    created_at: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

class SlotHoldRequest(BaseModel):
    slot_ids: List[int]
    user_id: int

class VenueCreate(BaseModel):
    owner_id: Optional[int] = None
    venue_owner_id: Optional[int] = None
    name: str
    location: str
    landmark: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    sports_supported: Optional[str] = None
    amenities: Optional[str] = None
    rating: Optional[float] = 5.0
    cover_image: Optional[str] = None
    venue_images: Optional[str] = None
    description: Optional[str] = None
    base_price_per_hour: Optional[int] = 0

class VenueResponse(BaseModel):
    id: int
    owner_id: Optional[int] = None
    venue_owner_id: Optional[int] = None
    name: str
    location: str
    landmark: Optional[str] = None
    latitude: Optional[float]
    longitude: Optional[float]
    sports_supported: Optional[str]
    amenities: Optional[str]
    rating: float
    cover_image: Optional[str] = None
    venue_images: Optional[str] = None
    description: Optional[str] = None
    base_price_per_hour: Optional[int] = 0
    distance: Optional[float] = None
    courts: List[CourtResponse] = []
    reviews: List[ReviewResponse] = []

    class Config:
        from_attributes = True

class SlotCreate(BaseModel):
    venue_id: int
    court_id: Optional[int] = None
    sport: str
    start_time: datetime
    end_time: datetime
    base_price: int
    current_price: int
    is_blocked: Optional[bool] = False

class SlotResponse(BaseModel):
    id: int
    venue_id: int
    court_id: Optional[int] = None
    sport: str
    start_time: datetime
    end_time: datetime
    base_price: int
    current_price: int
    is_blocked: bool
    status: str
    held_until: Optional[datetime] = None
    held_by_user_id: Optional[int] = None

    class Config:
        from_attributes = True

class BookingCreate(BaseModel):
    user_id: int
    court_id: Optional[int] = None
    slot_ids: List[int]
    amount_paid: Optional[int] = 0
    payment_status: Optional[str] = "pending"

class BookingResponse(BaseModel):
    id: int
    user_id: int
    court_id: Optional[int] = None
    booking_date: datetime
    status: str
    amount_paid: int
    payment_status: str
    payment_id: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    slots: List[SlotResponse] = []

    class Config:
        from_attributes = True

class ActivityRSVPResponse(BaseModel):
    id: int
    activity_id: int
    user_id: int
    status: str
    joined_at: datetime

    class Config:
        from_attributes = True

class ActivityRSVPCreate(BaseModel):
    user_id: int
    status: Optional[str] = "confirmed"

class ActivityCreate(BaseModel):
    owner_id: int
    venue_id: Optional[int] = None
    slot_id: Optional[int] = None
    sport: str
    date: str
    time: str
    location: Optional[str] = None
    max_players: int
    min_players: Optional[int] = 2
    skill_level: Optional[str] = "All"
    privacy_type: Optional[str] = "public"
    description: Optional[str] = None

class ActivityUpdate(BaseModel):
    sport: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    venue_id: Optional[int] = None
    slot_id: Optional[int] = None
    max_players: Optional[int] = None
    min_players: Optional[int] = None
    skill_level: Optional[str] = None
    privacy_type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class ActivityResponse(BaseModel):
    id: int
    owner_id: int
    venue_id: Optional[int]
    slot_id: Optional[int]
    sport: str
    date: str
    time: str
    location: Optional[str]
    max_players: int
    min_players: int
    skill_level: str
    status: str
    privacy_type: str
    description: Optional[str]
    created_at: datetime
    rsvps: List[ActivityRSVPResponse] = []

    class Config:
        from_attributes = True

class BlockSlotsRequest(BaseModel):
    start_date: str
    end_date: str
    sport: Optional[str] = None

class UnblockSlotsRequest(BaseModel):
    start_date: str
    end_date: str
    sport: Optional[str] = None

class PayoutHistoryResponse(BaseModel):
    id: str
    date: str
    amount: float
    status: str
    utr: str

    class Config:
        from_attributes = True

class PayoutsResponse(BaseModel):
    total_revenue: float
    platform_fee: float
    final_payout: float
    payout_history: List[PayoutHistoryResponse]

class PeakHourInfo(BaseModel):
    time: str
    bookings_count: int
    percentage: float

class RevenueTrendInfo(BaseModel):
    month: str
    revenue: float

class CustomerRetentionInfo(BaseModel):
    user_id: int
    user_name: str
    user_email: str
    bookings_count: int
    is_repeat: bool

class SaaSAnalyticsResponse(BaseModel):
    occupancy_rate: float
    total_revenue: float
    total_bookings: int
    peak_hours: List[PeakHourInfo]
    revenue_trends: List[RevenueTrendInfo]
    customer_retention: List[CustomerRetentionInfo]

class MessageCreate(BaseModel):
    sender_id: int
    sender_type: str
    sender_name: str
    group_id: Optional[int] = None
    channel: Optional[str] = "general"
    recipient_id: Optional[int] = None
    recipient_type: Optional[str] = None
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_type: str
    sender_name: str
    group_id: Optional[int] = None
    channel: Optional[str] = None
    recipient_id: Optional[int] = None
    recipient_type: Optional[str] = None
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class VenueOwnerCreate(BaseModel):
    full_name: str
    dob: Optional[str] = None
    email: str
    phone: str
    aadhar_number: Optional[str] = None
    password: str

class VenueOwnerLogin(BaseModel):
    email: str
    password: str

class VenueOwnerResponse(BaseModel):
    id: int
    full_name: str
    dob: Optional[str] = None
    email: str
    phone: str
    aadhar_number: Optional[str] = None
    is_verified: bool

    class Config:
        from_attributes = True

class VenueInput(BaseModel):
    name: str
    location: str
    landmark: Optional[str] = None
    sports_supported: Optional[str] = None
    amenities: Optional[str] = None
    cover_image: Optional[str] = None
    venue_images: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    days_open: Optional[str] = None
    slot_duration: Optional[int] = 60

class VenueOwnerRegister(BaseModel):
    owner: VenueOwnerCreate
    venues: List[VenueInput]

class VenueBookingOrderCreate(BaseModel):
    booking_id: int
    user_id: int

class VenueBookingOrderResponse(BaseModel):
    key_id: str
    razorpay_order_id: str
    local_order_id: int
    booking_id: int
    amount: int
    currency: str
    name: str
    description: Optional[str] = None
    prefill_name: Optional[str] = None
    prefill_email: Optional[str] = None
    prefill_contact: Optional[str] = None

class VenueBookingVerifyRequest(BaseModel):
    booking_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class BookingConfirmRequest(BaseModel):
    booking_id: int
    payment_id: str
    razorpay_order_id: Optional[str] = None
    razorpay_signature: Optional[str] = None

class CancellationPolicyCreate(BaseModel):
    hours_before_free_cancel: Optional[int] = 24
    refund_pct_full: Optional[int] = 100
    partial_window_hours: Optional[int] = 6
    refund_pct_partial: Optional[int] = 50
    no_refund_window_hours: Optional[int] = 2

class CancellationPolicyResponse(BaseModel):
    id: int
    venue_id: Optional[int] = None
    hours_before_free_cancel: int
    refund_pct_full: int
    partial_window_hours: int
    refund_pct_partial: int
    no_refund_window_hours: int

    class Config:
        from_attributes = True

class RefundRecordResponse(BaseModel):
    id: int
    booking_id: int
    razorpay_payment_id: Optional[str] = None
    razorpay_refund_id: Optional[str] = None
    amount: int
    refund_pct: int
    status: str
    reason: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CancelBookingRequest(BaseModel):
    reason: Optional[str] = "User cancelled"
    user_id: Optional[int] = None

class GameCreate(BaseModel):
    host_id: int
    venue_id: Optional[int] = None
    sport: str
    slot_start: datetime
    slot_end: datetime
    total_spots: int
    price_per_player: float
    join_policy: Optional[str] = "instant"
    visibility: Optional[str] = "public"

class GameResponse(BaseModel):
    id: str
    host_id: int
    venue_id: Optional[int] = None
    sport: str
    slot_start: datetime
    slot_end: datetime
    total_spots: int
    current_players: int
    price_per_player: float
    join_policy: str
    visibility: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class GameJoinRequest(BaseModel):
    note: Optional[str] = None

class GameJoinResponse(BaseModel):
    status: str
    payment_required: bool
    payment_intent_id: Optional[str] = None
    hold_expires_at: Optional[datetime] = None
    message: Optional[str] = None

class JoinRequestRespondBody(BaseModel):
    action: str

class WaitlistEntryOut(BaseModel):
    id: str
    game_id: str
    user_id: int
    position: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserMinOut(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True

class GamePlayerOut(BaseModel):
    id: str
    user_id: int
    user: UserMinOut
    status: str
    joined_at: datetime

    class Config:
        from_attributes = True

class GameDetailOut(BaseModel):
    id: str
    host_id: int
    host: UserMinOut
    venue_id: Optional[int] = None
    sport: str
    slot_start: datetime
    slot_end: datetime
    total_spots: int
    current_players: int
    price_per_player: float
    join_policy: str
    visibility: str
    status: str
    players: List[GamePlayerOut]
    waitlist_count: int

    @computed_field
    @property
    def spots_left(self) -> int:
        return max(0, self.total_spots - self.current_players)

    class Config:
        from_attributes = True


class MatchTeamCreate(BaseModel):
    team_name: str
    group_id: Optional[int] = None
    club_name: Optional[str] = None
    color: Optional[str] = None


class MatchTeamResponse(BaseModel):
    id: int
    match_id: int
    team_name: str
    group_id: Optional[int] = None
    club_name: Optional[str] = None
    color: Optional[str] = None
    score: int

    class Config:
        from_attributes = True


class MatchCreate(BaseModel):
    owner_id: int
    title: str
    sport: str
    match_type: Optional[str] = "intra_club"
    venue: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    teams: List[MatchTeamCreate]


class MatchUpdate(BaseModel):
    title: Optional[str] = None
    sport: Optional[str] = None
    match_type: Optional[str] = None
    venue: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None
    winner_team_id: Optional[int] = None


class MatchEventCreate(BaseModel):
    team_id: Optional[int] = None
    event_type: str
    description: Optional[str] = None
    minute: Optional[int] = None
    score_at_event: Optional[str] = None


class MatchEventResponse(BaseModel):
    id: int
    match_id: int
    team_id: Optional[int] = None
    event_type: str
    description: Optional[str] = None
    minute: Optional[int] = None
    score_at_event: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MatchResponse(BaseModel):
    id: int
    owner_id: int
    title: str
    sport: str
    match_type: str
    venue: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    status: str
    winner_team_id: Optional[int] = None
    created_at: datetime
    teams: List[MatchTeamResponse]
    events: List[MatchEventResponse] = []

    class Config:
        from_attributes = True


class MatchScoreUpdate(BaseModel):
    team_id: int
    new_score: int
    event_type: Optional[str] = "point"
    description: Optional[str] = None
    minute: Optional[int] = None
