import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, Boolean, ForeignKey, Float, Index, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class MukijoAdmin(Base):
    """Platform-level Mukijo Admin — separate from Club Admin (User)."""
    __tablename__ = "mukijo_admins"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    activity = Column(String, nullable=False)
    age_group = Column(String, nullable=False)
    group_name = Column(String, nullable=False)
    sub_group = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id")) # Link group to a specific user
    privacy_type = Column(String, default="public") # public, private
    avatar = Column(String, nullable=True)

    members = relationship("Member", back_populates="group")

    owner = relationship("User", back_populates="groups")
    events = relationship("Event", back_populates="group")
    payments = relationship("Payment", back_populates="group")
    courses = relationship("Course", back_populates="group")
    messages = relationship("Message", back_populates="group", cascade="all, delete-orphan")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # Event category
    date = Column(String, nullable=False)
    time = Column(String, nullable=True)
    start_time = Column(String, nullable=True)
    end_time = Column(String, nullable=True)
    location = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    
    # Event Details & Cover Image
    cover_image = Column(String, nullable=True)
    registration_deadline = Column(String, nullable=True)
    max_participants = Column(Integer, nullable=True)
    fee = Column(Integer, default=0)
    
    # Event Settings
    auto_reminder = Column(Boolean, default=False)
    attendance_tracking = Column(Boolean, default=False)
    is_public = Column(Boolean, default=True)
    allow_guest = Column(Boolean, default=False)
    allow_waiting_list = Column(Boolean, default=False)
    
    # Attachments
    rules_pdf = Column(String, nullable=True)
    schedule_file = Column(String, nullable=True)
    permission_forms = Column(String, nullable=True)
    match_fixtures = Column(String, nullable=True)
    event_posters = Column(String, nullable=True)

    group = relationship("Group", back_populates="events")
    owner = relationship("User", back_populates="events")
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")

class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    participant_name = Column(String, nullable=False)
    participant_email = Column(String, nullable=True)
    participant_role = Column(String, nullable=True) # Coach, Parent, Player, Guest, etc.
    status = Column(String, default="pending") # pending, accepted, declined, maybe, waitlisted
    attendance = Column(String, default="not_marked") # present, absent, late, not_marked
    invited_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)

    event = relationship("Event", back_populates="registrations")
    member = relationship("Member")

class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    role = Column(String, default="Member")
    password = Column(String, nullable=True)

    group = relationship("Group", back_populates="members")
    payments = relationship("Payment", back_populates="member")
    course_registrations = relationship("CourseRegistration", back_populates="member")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    club_id = Column(String, unique=True, index=True, nullable=True)
    club_name = Column(String)
    country = Column(String)
    state = Column(String)
    member_count = Column(String)
    sport = Column(String)
    club_logo = Column(Text, nullable=True)
    first_name = Column(String)
    last_name = Column(String)
    dob = Column(String, nullable=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    aadhar_number = Column(String, nullable=True)
    password = Column(String, nullable=True) # Added password field
    hear_about = Column(String)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    is_email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String, nullable=True)
    email_verification_token_expires_at = Column(DateTime, nullable=True)
    approval_status = Column(String, default="PENDING_APPROVAL")


    groups = relationship("Group", back_populates="owner")
    events = relationship("Event", back_populates="owner")
    fundraising_campaigns = relationship("FundraisingCampaign", back_populates="owner")
    payments = relationship("Payment", back_populates="owner")
    courses = relationship("Course", back_populates="owner")
    course_registrations = relationship("CourseRegistration", foreign_keys="CourseRegistration.owner_id", back_populates="owner")
    signup_forms = relationship("SignupForm", back_populates="owner", cascade="all, delete-orphan")
    signup_submissions = relationship("SignupSubmission", back_populates="owner", cascade="all, delete-orphan")
    venues = relationship("Venue", back_populates="owner")
    bookings = relationship("Booking", back_populates="user")
    activities = relationship("Activity", back_populates="owner")
    rsvps = relationship("ActivityRSVP", back_populates="user")
    hosted_games = relationship("Game", back_populates="host")
    game_participations = relationship("GamePlayer", back_populates="user")
    waitlist_entries = relationship("GameWaitlist", back_populates="user")
    matches = relationship("Match", back_populates="owner", cascade="all, delete-orphan")

class FundraisingCampaign(Base):
    __tablename__ = "fundraising_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    goal = Column(Integer, nullable=False)
    raised = Column(Integer, default=0)
    status = Column(String, default="active") # active, paused, completed
    deadline = Column(String, nullable=True)
    group_name = Column(String, nullable=True)
    donors_count = Column(Integer, default=0)

    owner = relationship("User", back_populates="fundraising_campaigns")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, default="Membership Fee")
    amount = Column(Integer, nullable=False)
    due_date = Column(String, nullable=True)
    status = Column(String, default="pending") # pending, paid, overdue, cancelled
    payment_method = Column(String, nullable=True)
    paid_at = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="payments")
    group = relationship("Group", back_populates="payments")
    member = relationship("Member", back_populates="payments")
    gateway_orders = relationship("PaymentGatewayOrder", back_populates="payment", cascade="all, delete-orphan")

class PaymentGatewayOrder(Base):
    __tablename__ = "payment_gateway_orders"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    razorpay_order_id = Column(String, unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String, nullable=True)
    razorpay_signature = Column(String, nullable=True)
    amount = Column(Integer, nullable=False)
    currency = Column(String, default="INR")
    receipt = Column(String, nullable=True)
    status = Column(String, default="created")
    raw_order = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)

    payment = relationship("Payment", back_populates="gateway_orders")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"), nullable=True)
    title = Column(String, nullable=False)
    code = Column(String, nullable=True)
    category = Column(String, default="Training")
    level = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    instructor = Column(String, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    schedule = Column(String, nullable=True)
    location = Column(String, nullable=True)
    capacity = Column(Integer, default=20)
    fee = Column(Integer, default=0)
    status = Column(String, default="open") # draft, open, full, closed, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    reschedule_reason = Column(Text, nullable=True)
    rescheduled_at = Column(DateTime, nullable=True)
    cover_image = Column(String, nullable=True)
    start_time = Column(String, nullable=True)
    end_time = Column(String, nullable=True)
    days = Column(Text, nullable=True)

    owner = relationship("User", back_populates="courses")
    group = relationship("Group", back_populates="courses")
    registrations = relationship("CourseRegistration", back_populates="course", cascade="all, delete-orphan")

class CourseRegistration(Base):
    __tablename__ = "course_registrations"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    participant_name = Column(String, nullable=False)
    participant_email = Column(String, nullable=True)
    participant_phone = Column(String, nullable=True)
    status = Column(String, default="unregistered") # unregistered, registered, waitlisted, cancelled, completed
    payment_status = Column(String, default="unpaid") # unpaid, paid, waived
    notes = Column(Text, nullable=True)
    registered_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", foreign_keys=[owner_id], back_populates="course_registrations")
    course = relationship("Course", back_populates="registrations")
    member = relationship("Member", back_populates="course_registrations")

class SignupForm(Base):
    __tablename__ = "signup_forms"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False) # Coach, Parent, Player, Referee
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    fields = Column(Text, nullable=False) # JSON encoded fields array

    owner = relationship("User", back_populates="signup_forms")

class SignupSubmission(Base):
    __tablename__ = "signup_submissions"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False) # Coach, Parent, Player, Referee
    submitted_data = Column(Text, nullable=False) # JSON encoded data dictionary
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="signup_submissions")

class VenueOwner(Base):
    __tablename__ = "venue_owners"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    dob = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)
    aadhar_number = Column(String, nullable=True)
    password = Column(String, nullable=False)
    is_verified = Column(Boolean, default=True)
    approval_status = Column(String, default="PENDING_APPROVAL", nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    venues = relationship("Venue", back_populates="venue_owner", foreign_keys="Venue.venue_owner_id")


from sqlalchemy import Table

# Many-to-many join table for bookings and slots
booking_slots = Table(
    "booking_slots",
    Base.metadata,
    Column("booking_id", Integer, ForeignKey("bookings.id", ondelete="CASCADE"), primary_key=True),
    Column("slot_id", Integer, ForeignKey("slots.id", ondelete="CASCADE"), primary_key=True)
)

class Venue(Base):
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    venue_owner_id = Column(Integer, ForeignKey("venue_owners.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=False)
    landmark = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    sports_supported = Column(Text, nullable=True)  # JSON Array of sports
    amenities = Column(Text, nullable=True)          # JSON Array of amenities
    rating = Column(Float, default=5.0)
    cover_image = Column(Text, nullable=True)
    venue_images = Column(Text, nullable=True)
    opening_time = Column(String, nullable=True)     # e.g. "06:00"
    closing_time = Column(String, nullable=True)     # e.g. "22:00"
    days_open = Column(Text, nullable=True)          # JSON Array e.g. ["Mon","Tue",...]
    slot_duration = Column(Integer, default=60)      # minutes: 30 or 60
    base_price_per_hour = Column(Integer, default=0)
    sport_prices = Column(Text, nullable=True)       # JSON object e.g. {"Cricket": 500, "Football": 800}

    # ── Venue Verification Lifecycle Fields ────────────────────────────
    verification_status = Column(String, default="DRAFT", nullable=False, server_default="DRAFT")
    # Statuses: DRAFT | PENDING_VERIFICATION | UNDER_REVIEW | MORE_INFO_REQUIRED | VERIFIED | REJECTED | SUSPENDED
    verification_submitted_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(Integer, nullable=True)     # MukijoAdmin.id — set by backend only, never from client
    rejection_reason = Column(Text, nullable=True)
    verification_notes = Column(Text, nullable=True) # Admin notes / more-info request text
    admin_checklist = Column(Text, nullable=True)    # JSON — admin decision-support checklist flags
    location_verified = Column(Boolean, default=False)
    gps_latitude = Column(Float, nullable=True)      # GPS-captured lat — separate from address lat
    gps_longitude = Column(Float, nullable=True)     # GPS-captured lon
    gps_captured_at = Column(DateTime, nullable=True)
    documents_submitted = Column(Boolean, default=False)
    # ── Extended Contact & Address Fields ──────────────────────────────
    contact_phone = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state_name = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)

    owner = relationship("User", back_populates="venues")
    venue_owner = relationship("VenueOwner", back_populates="venues", foreign_keys=[venue_owner_id])
    slots = relationship("Slot", back_populates="venue", cascade="all, delete-orphan")
    courts = relationship("Court", back_populates="venue", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="venue", cascade="all, delete-orphan")
    verification_logs = relationship("VenueVerificationLog", back_populates="venue", cascade="all, delete-orphan")
    documents = relationship("VenueDocument", back_populates="venue", cascade="all, delete-orphan")

class Court(Base):
    __tablename__ = "courts"

    id = Column(Integer, primary_key=True, index=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    name = Column(String, nullable=False)
    sport_type = Column(String, nullable=False)
    capacity = Column(Integer, default=4)
    price_per_hour = Column(Integer, nullable=True)

    venue = relationship("Venue", back_populates="courts")
    slots = relationship("Slot", back_populates="court")

class Slot(Base):
    __tablename__ = "slots"

    id = Column(Integer, primary_key=True, index=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    court_id = Column(Integer, ForeignKey("courts.id"), nullable=True)
    sport = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    base_price = Column(Integer, nullable=False)
    current_price = Column(Integer, nullable=False)
    is_blocked = Column(Boolean, default=False)
    status = Column(String, default="AVAILABLE") # AVAILABLE, HELD, BOOKED, BLOCKED
    held_until = Column(DateTime, nullable=True)
    held_by_user_id = Column(Integer, nullable=True)

    venue = relationship("Venue", back_populates="slots")
    court = relationship("Court", back_populates="slots")
    bookings = relationship("Booking", secondary=booking_slots, back_populates="slots")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    court_id = Column(Integer, ForeignKey("courts.id"), nullable=True)
    booking_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="reserved") # reserved, pending_payment, confirmed, cancelled, completed
    amount_paid = Column(Integer, default=0)
    payment_status = Column(String, default="pending") # pending, paid, refunded
    payment_id = Column(String, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    cancellation_reason = Column(String, nullable=True)

    user = relationship("User", back_populates="bookings")
    court = relationship("Court")
    slots = relationship("Slot", secondary=booking_slots, back_populates="bookings")

    @property
    def slot(self):
        return self.slots[0] if self.slots else None


class VenueBookingOrder(Base):
    """Tracks a Razorpay order created for a venue booking payment."""
    __tablename__ = "venue_booking_orders"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True)
    razorpay_order_id = Column(String, unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String, nullable=True)
    razorpay_signature = Column(String, nullable=True)
    amount = Column(Integer, nullable=False)  # in paise
    currency = Column(String, default="INR")
    status = Column(String, default="created")  # created, paid, failed, signature_failed
    created_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)

    booking = relationship("Booking")


class CancellationPolicy(Base):
    """Venue-specific cancellation and refund policy."""
    __tablename__ = "cancellation_policies"

    id = Column(Integer, primary_key=True, index=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=True, unique=True)
    hours_before_free_cancel = Column(Integer, default=24)   # full refund if cancelled >= N hours before
    refund_pct_full = Column(Integer, default=100)            # % refund in full window
    partial_window_hours = Column(Integer, default=6)         # partial refund if cancelled >= N hours before
    refund_pct_partial = Column(Integer, default=50)          # % refund in partial window
    no_refund_window_hours = Column(Integer, default=2)       # < N hours before = 0 refund
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    venue = relationship("Venue")


class RefundRecord(Base):
    """Tracks refund transactions for cancelled venue bookings."""
    __tablename__ = "refund_records"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    razorpay_payment_id = Column(String, nullable=True)   # original payment id
    razorpay_refund_id = Column(String, nullable=True)    # refund id from Razorpay
    amount = Column(Integer, nullable=False)               # refund amount in paise
    refund_pct = Column(Integer, default=100)             # percentage refunded
    status = Column(String, default="initiated")          # initiated, succeeded, failed, skipped
    reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    booking = relationship("Booking")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    rating = Column(Integer, nullable=False) # 1-5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    venue = relationship("Venue", back_populates="reviews")
    user = relationship("User")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=True)
    slot_id = Column(Integer, ForeignKey("slots.id"), nullable=True)
    sport = Column(String, nullable=False)
    date = Column(String, nullable=False)
    time = Column(String, nullable=False)
    location = Column(String, nullable=True)
    max_players = Column(Integer, nullable=False)
    min_players = Column(Integer, default=2)
    skill_level = Column(String, default="All") # Beginner, Intermediate, Advanced, All
    status = Column(String, default="open") # open, confirmed, cancelled, completed
    privacy_type = Column(String, default="public") # public, private
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="activities")
    venue = relationship("Venue")
    slot = relationship("Slot")
    rsvps = relationship("ActivityRSVP", back_populates="activity", cascade="all, delete-orphan")

class ActivityRSVP(Base):
    __tablename__ = "activity_rsvps"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="confirmed") # confirmed, tentative, waitlisted
    joined_at = Column(DateTime, default=datetime.utcnow)

    activity = relationship("Activity", back_populates="rsvps")
    user = relationship("User", back_populates="rsvps")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, nullable=False)
    sender_type = Column(String, nullable=False) # "admin" or "member"
    sender_name = Column(String, nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    channel = Column(String, default="general", server_default="general", nullable=True)
    recipient_id = Column(Integer, nullable=True)
    recipient_type = Column(String, nullable=True) # "admin" or "member"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="messages")


class Game(Base):
    __tablename__ = "games"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    host_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    venue_id = Column(Integer, ForeignKey("venues.id", ondelete="CASCADE"), nullable=True)
    sport = Column(String(50), nullable=False)
    slot_start = Column(DateTime, nullable=False)
    slot_end = Column(DateTime, nullable=False)
    total_spots = Column(Integer, nullable=False)
    current_players = Column(Integer, default=1, nullable=False)
    price_per_player = Column(Float, nullable=False)
    join_policy = Column(String(20), default="instant", nullable=False)  # instant, request_approval
    visibility = Column(String(20), default="public", nullable=False)  # public, private, friends_only
    status = Column(String(20), default="open", nullable=False)  # open, full, cancelled, completed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    host = relationship("User", back_populates="hosted_games")
    venue = relationship("Venue")
    players = relationship("GamePlayer", back_populates="game", cascade="all, delete-orphan")
    waitlist = relationship("GameWaitlist", back_populates="game", cascade="all, delete-orphan")


class GamePlayer(Base):
    __tablename__ = "game_players"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    game_id = Column(String(36), ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="pending_payment", nullable=False)  # pending_payment, pending_approval, confirmed, cancelled, rejected
    payment_id = Column(String, nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    cancelled_at = Column(DateTime, nullable=True)

    game = relationship("Game", back_populates="players")
    user = relationship("User", back_populates="game_participations")

    __table_args__ = (
        UniqueConstraint("game_id", "user_id", name="uq_game_user"),
        Index("idx_game_player_status", "game_id", "status"),
    )


class GameWaitlist(Base):
    __tablename__ = "game_waitlist"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    game_id = Column(String(36), ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False)
    status = Column(String(20), default="waiting", nullable=False)  # waiting, promoted, expired
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    game = relationship("Game", back_populates="waitlist")
    user = relationship("User", back_populates="waitlist_entries")

    __table_args__ = (
        Index("idx_game_waitlist_pos", "game_id", "position"),
    )


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)     # Club admin
    title = Column(String, nullable=False)               # e.g., "Finals 2026"
    sport = Column(String, nullable=False)               # e.g., "Football", "Cricket"
    match_type = Column(String, default="intra_club")         # intra_club | inter_club
    venue = Column(String, nullable=True)
    scheduled_at = Column(DateTime, nullable=True)
    status = Column(String, default="scheduled")          # scheduled | live | completed | cancelled
    winner_team_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="matches")
    teams = relationship("MatchTeam", back_populates="match", cascade="all, delete-orphan")
    events = relationship("MatchEvent", back_populates="match", cascade="all, delete-orphan")


class MatchTeam(Base):
    __tablename__ = "match_teams"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    team_name = Column(String, nullable=False)    # "Team A" or group name
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)  # optional link
    club_name = Column(String, nullable=True)     # for inter-club matches
    color = Column(String, nullable=True)     # team jersey color (e.g. hex #FF0000)
    score = Column(Integer, default=0)

    match = relationship("Match", back_populates="teams")
    group = relationship("Group")


class MatchEvent(Base):
    __tablename__ = "match_events"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(Integer, ForeignKey("match_teams.id", ondelete="CASCADE"), nullable=True) # can be null for general events
    event_type = Column(String, nullable=False)    # "goal", "point", "wicket", "timeout", "halftime", "start", "end", etc.
    description = Column(String, nullable=True)
    minute = Column(Integer, nullable=True)
    score_at_event = Column(String, nullable=True)  # snapshot "2-1"
    created_at = Column(DateTime, default=datetime.utcnow)

    match = relationship("Match", back_populates="events")
    team = relationship("MatchTeam")


class VenueVerificationLog(Base):
    """Audit trail for every verification status change on a venue."""
    __tablename__ = "venue_verification_logs"

    id = Column(Integer, primary_key=True, index=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    action = Column(String, nullable=False)      # SUBMITTED | REVIEW_STARTED | APPROVED | REJECTED | MORE_INFO_REQUESTED | RESUBMITTED | SUSPENDED
    actor_id = Column(Integer, nullable=True)    # ID of person who took the action
    actor_role = Column(String, nullable=True)   # venue_owner | mukijo_admin
    actor_name = Column(String, nullable=True)   # Display name for log
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    venue = relationship("Venue", back_populates="verification_logs")


class VenueDocument(Base):
    """Tracks verification documents uploaded by venue owners."""
    __tablename__ = "venue_documents"

    id = Column(Integer, primary_key=True, index=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    document_type = Column(String, nullable=False)   # ownership_proof | lease_agreement | business_registration | other
    document_label = Column(String, nullable=True)   # Human-readable label
    file_path = Column(Text, nullable=True)          # Storage path or base64 (follows existing arch)

    venue = relationship("Venue", back_populates="documents")


class TrainingEnrollmentOrder(Base):
    __tablename__ = "training_enrollment_orders"
    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("course_registrations.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    razorpay_order_id = Column(String, unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String, nullable=True)
    razorpay_signature = Column(String, nullable=True)
    amount = Column(Integer, nullable=False)
    currency = Column(String, default="INR")
    status = Column(String, default="created")
    created_at = Column(DateTime, default=datetime.utcnow)
class Trainer(Base):
    __tablename__ = 'trainers'

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone = Column(String(20))
    experience_years = Column(Integer)
    specialization = Column(String(100))
    sports = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
