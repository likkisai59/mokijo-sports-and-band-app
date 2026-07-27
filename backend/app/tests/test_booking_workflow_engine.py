import uuid
import datetime
import pytest
from app.features.auth.models import User
from app.features.bookings.models import Booking, BookingAuditLog
from app.features.artists.models import ArtistProfile
from app.features.venues.models import Venue
from app.features.locations.models import Country, State, City
from app.features.bookings.workflow import BookingWorkflowEngine
from app.core.exceptions import BadRequestException

@pytest.fixture
def workflow_setup_data(db_session):
    # Create location hierarchy first
    country = Country(
        id=uuid.uuid4(),
        name="Test Country",
        code="TC"
    )
    db_session.add(country)
    db_session.commit()

    state = State(
        id=uuid.uuid4(),
        name="Test State",
        country_id=country.id
    )
    db_session.add(state)
    db_session.commit()

    city = City(
        id=uuid.uuid4(),
        name="Test City",
        state_id=state.id
    )
    db_session.add(city)
    db_session.commit()

    # Create test users
    client_user = User(
        id=uuid.uuid4(),
        email="wf_client@example.com",
        password_hash="test",
        name="WF Client",
        is_active=True,
        is_verified=True
    )
    artist_user = User(
        id=uuid.uuid4(),
        email="wf_artist@example.com",
        password_hash="test",
        name="WF Artist User",
        is_active=True,
        is_verified=True
    )
    venue_user = User(
        id=uuid.uuid4(),
        email="wf_venue@example.com",
        password_hash="test",
        name="WF Venue User",
        is_active=True,
        is_verified=True
    )
    admin_user = User(
        id=uuid.uuid4(),
        email="wf_admin@example.com",
        password_hash="test",
        name="WF Admin",
        is_active=True,
        is_verified=True
    )
    db_session.add_all([client_user, artist_user, venue_user, admin_user])
    db_session.commit()

    # Create artist profile
    artist_profile = ArtistProfile(
        id=uuid.uuid4(),
        user_id=artist_user.id,
        bio="Test Bio",
        base_rate=200.0,
        rating=5.0,
        verification_status="approved",
        display_name="WF Artist Performer"
    )
    # Create venue profile
    venue_profile = Venue(
        id=uuid.uuid4(),
        user_id=venue_user.id,
        name="WF Club",
        address="123 Music Ave",
        city_id=city.id,
        capacity=500,
        base_price=1000.0
    )

    db_session.add_all([artist_profile, venue_profile])
    db_session.commit()

    # Create standard artist booking request
    artist_booking = Booking(
        id=uuid.uuid4(),
        client_id=client_user.id,
        artist_profile_id=artist_profile.id,
        event_name="WF Showcase",
        event_date=datetime.date(2026, 12, 1),
        start_time=datetime.time(19, 0),
        end_time=datetime.time(22, 0),
        location="Grand Hall",
        proposed_price=500.0,
        status="pending",
        timeline=[{
            "status": "pending",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "by": "client",
            "message": "Booking request initialized"
        }]
    )
    
    # Create standard venue booking request
    venue_booking = Booking(
        id=uuid.uuid4(),
        client_id=client_user.id,
        venue_id=venue_profile.id,
        event_name="WF Club Night",
        event_date=datetime.date(2026, 12, 5),
        start_time=datetime.time(21, 0),
        end_time=datetime.time(23, 59),
        location="WF Club",
        proposed_price=800.0,
        status="pending",
        timeline=[{
            "status": "pending",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "by": "client",
            "message": "Venue Booking request initialized"
        }]
    )
    db_session.add_all([artist_booking, venue_booking])
    db_session.commit()

    return {
        "client": client_user,
        "artist_user": artist_user,
        "artist_profile": artist_profile,
        "venue_user": venue_user,
        "venue_profile": venue_profile,
        "admin": admin_user,
        "artist_booking": artist_booking,
        "venue_booking": venue_booking
    }

def test_valid_status_transitions(db_session, workflow_setup_data):
    b = workflow_setup_data["artist_booking"]
    artist_uid = str(workflow_setup_data["artist_user"].id)
    client_uid = str(workflow_setup_data["client"].id)

    # 1. pending -> accepted (Artist accepts)
    BookingWorkflowEngine.transition(
        db=db_session,
        booking_id=b.id,
        actor_id=artist_uid,
        actor_role="artist",
        action="accept",
        target_status="accepted"
    )
    assert b.status == "accepted"

    # 2. accepted -> confirmed (Client pays/confirms)
    BookingWorkflowEngine.transition(
        db=db_session,
        booking_id=b.id,
        actor_id=client_uid,
        actor_role="client",
        action="confirm",
        target_status="confirmed"
    )
    assert b.status == "confirmed"

    # 3. confirmed -> completed (Artist completes or admin completes)
    # Complete is allowed from confirmed/accepted.
    # Note: we pass artist user to complete or admin user. Let's pass admin.
    BookingWorkflowEngine.transition(
        db=db_session,
        booking_id=b.id,
        actor_id=str(workflow_setup_data["admin"].id),
        actor_role="admin",
        action="complete",
        target_status="completed"
    )
    assert b.status == "completed"

def test_invalid_status_transitions(db_session, workflow_setup_data):
    b = workflow_setup_data["artist_booking"]
    artist_uid = str(workflow_setup_data["artist_user"].id)

    # Transition to accepted first
    BookingWorkflowEngine.transition(
        db=db_session,
        booking_id=b.id,
        actor_id=artist_uid,
        actor_role="artist",
        action="accept",
        target_status="accepted"
    )

    # Try to transition back from accepted to pending (Forbidden)
    with pytest.raises(BadRequestException) as exc_info:
        BookingWorkflowEngine.transition(
            db=db_session,
            booking_id=b.id,
            actor_id=artist_uid,
            actor_role="artist",
            action="override",
            target_status="pending"
        )
    assert "pending" in str(exc_info.value).lower()

def test_business_rule_validation(db_session, workflow_setup_data):
    b = workflow_setup_data["artist_booking"]
    artist_uid = str(workflow_setup_data["artist_user"].id)
    client_uid = str(workflow_setup_data["client"].id)

    # 1. Accept booking
    BookingWorkflowEngine.transition(
        db=db_session,
        booking_id=b.id,
        actor_id=artist_uid,
        actor_role="artist",
        action="accept",
        target_status="accepted"
    )

    # Prevent duplicate accept
    with pytest.raises(BadRequestException) as exc_info:
        BookingWorkflowEngine.transition(
            db=db_session,
            booking_id=b.id,
            actor_id=artist_uid,
            actor_role="artist",
            action="accept",
            target_status="accepted"
        )
    assert "already in accepted status" in str(exc_info.value)

    # 2. Confirm booking
    BookingWorkflowEngine.transition(
        db=db_session,
        booking_id=b.id,
        actor_id=client_uid,
        actor_role="client",
        action="confirm",
        target_status="confirmed"
    )

    # 3. Cancel booking
    BookingWorkflowEngine.transition(
        db=db_session,
        booking_id=b.id,
        actor_id=client_uid,
        actor_role="client",
        action="cancel",
        target_status="cancelled",
        reason="Sick"
    )
    assert b.status == "cancelled"

    # Cancelled bookings cannot be modified
    with pytest.raises(BadRequestException) as exc_info:
        BookingWorkflowEngine.transition(
            db=db_session,
            booking_id=b.id,
            actor_id=artist_uid,
            actor_role="artist",
            action="accept",
            target_status="accepted"
        )
    assert "Cancelled bookings cannot be modified" in str(exc_info.value)

def test_event_date_validation_on_confirmation(db_session, workflow_setup_data):
    b = workflow_setup_data["artist_booking"]
    artist_uid = str(workflow_setup_data["artist_user"].id)
    client_uid = str(workflow_setup_data["client"].id)

    # Change event date to yesterday
    b.event_date = datetime.date.today() - datetime.timedelta(days=1)
    db_session.add(b)
    db_session.commit()

    # Transition to accepted
    BookingWorkflowEngine.transition(
        db=db_session,
        booking_id=b.id,
        actor_id=artist_uid,
        actor_role="artist",
        action="accept",
        target_status="accepted"
    )

    # Try to confirm booking with past event date -> should raise BadRequestException
    with pytest.raises(BadRequestException) as exc_info:
        BookingWorkflowEngine.transition(
            db=db_session,
            booking_id=b.id,
            actor_id=client_uid,
            actor_role="client",
            action="confirm",
            target_status="confirmed"
        )
    assert "past event date" in str(exc_info.value).lower()

def test_rbac_validation(db_session, workflow_setup_data):
    b = workflow_setup_data["artist_booking"]
    unrelated_user_id = str(workflow_setup_data["venue_user"].id)

    # Unrelated user role trying to accept artist booking -> should raise BadRequestException
    with pytest.raises(BadRequestException) as exc_info:
        BookingWorkflowEngine.transition(
            db=db_session,
            booking_id=b.id,
            actor_id=unrelated_user_id,
            actor_role="artist",
            action="accept",
            target_status="accepted"
        )
    assert "Access denied" in str(exc_info.value)

def test_timeline_and_audit_generation(db_session, workflow_setup_data):
    b = workflow_setup_data["artist_booking"]
    artist_uid = str(workflow_setup_data["artist_user"].id)

    # Perform transition
    BookingWorkflowEngine.transition(
        db=db_session,
        booking_id=b.id,
        actor_id=artist_uid,
        actor_role="artist",
        action="accept",
        target_status="accepted",
        reason="Good schedule"
    )

    # Assert timeline updated automatically
    assert len(b.timeline) == 2
    assert b.timeline[1]["status"] == "accepted"
    assert b.timeline[1]["by"] == "artist"
    assert "approved" in b.timeline[1]["message"].lower()

    # Assert audit log created automatically
    audit = db_session.query(BookingAuditLog).filter(BookingAuditLog.booking_id == b.id).first()
    assert audit is not None
    assert audit.action == "accept"
    assert audit.previous_status == "pending"
    assert audit.new_status == "accepted"
    assert audit.role == "artist"
    assert audit.reason == "Good schedule"

def test_transaction_rollback_on_database_error(db_session, workflow_setup_data):
    b = workflow_setup_data["artist_booking"]
    artist_uid = str(workflow_setup_data["artist_user"].id)

    # Let's mock the session add method to raise an error when the audit log is added
    original_add = db_session.add
    def mock_add(instance):
        if isinstance(instance, BookingAuditLog):
            raise Exception("Mock database write error")
        return original_add(instance)

    db_session.add = mock_add

    with pytest.raises(Exception) as exc_info:
        BookingWorkflowEngine.transition(
            db=db_session,
            booking_id=b.id,
            actor_id=artist_uid,
            actor_role="artist",
            action="accept",
            target_status="accepted"
        )
    assert "Mock database write error" in str(exc_info.value)

    # Restore the original add method
    db_session.add = original_add

    # Verify that the booking status was rolled back and is still "pending"
    db_session.refresh(b)
    assert b.status == "pending"

def test_concurrency_protection(db_session, workflow_setup_data):
    b = workflow_setup_data["artist_booking"]
    artist_uid = str(workflow_setup_data["artist_user"].id)

    # Acquire lock and transition to accepted (A wins)
    BookingWorkflowEngine.transition(
        db=db_session,
        booking_id=b.id,
        actor_id=artist_uid,
        actor_role="artist",
        action="accept",
        target_status="accepted"
    )
    assert b.status == "accepted"

    # Conflicting transition (B rejects) should be rejected immediately because
    # the booking status has already updated to "accepted" (which cannot transition to "rejected")
    with pytest.raises(BadRequestException) as exc_info:
        BookingWorkflowEngine.transition(
            db=db_session,
            booking_id=b.id,
            actor_id=artist_uid,
            actor_role="artist",
            action="reject",
            target_status="rejected"
        )
    assert "Invalid booking transition" in str(exc_info.value)

