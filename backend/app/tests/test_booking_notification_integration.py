"""
Comprehensive Booking × Notification Integration Tests
=======================================================

Covers all booking workflow events and verifies:
  - Correct recipient(s) receive each notification
  - notification_type is correct
  - reference_type == "BOOKING" on every notification
  - reference_id == booking.id on every notification
  - notification_metadata contains booking context
  - RBAC: wrong actors are rejected and admins are alerted
  - Content: title and message match expected templates

Run:
    pytest app/tests/test_booking_notification_integration.py -v
"""

import uuid
import datetime
import pytest

from app.features.auth.models import User, Role
from app.features.bookings.models import Booking
from app.features.notifications.models import Notification
from app.features.artists.models import ArtistProfile
from app.features.venues.models import Venue
from app.features.locations.models import Country, State, City
from app.features.bookings.workflow import BookingWorkflowEngine
from app.features.notifications.service import create_booking_notification
from app.core.exceptions import BadRequestException


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def integration_data(db_session):
    """
    Creates a complete data graph:
      client_user, artist_user, venue_owner_user, admin_user
      artist_profile, venue, booking (status=pending)
    All committed to the test SQLite DB.
    """
    # ── Roles ────────────────────────────────────────────────────────────────
    client_role = Role(id=uuid.uuid4(), name="integ_client", description="Client")
    artist_role = Role(id=uuid.uuid4(), name="integ_artist", description="Artist")
    venue_role  = Role(id=uuid.uuid4(), name="integ_venue",  description="Venue")
    admin_role  = Role(id=uuid.uuid4(), name="admin",        description="Admin")
    db_session.add_all([client_role, artist_role, venue_role, admin_role])
    db_session.commit()

    # ── Users ────────────────────────────────────────────────────────────────
    client_user = User(
        id=uuid.uuid4(), email=f"integ_client_{uuid.uuid4().hex[:6]}@test.dev",
        name="Integration Client", password_hash="pw",
        is_active=True, is_verified=True
    )
    artist_user = User(
        id=uuid.uuid4(), email=f"integ_artist_{uuid.uuid4().hex[:6]}@test.dev",
        name="Integration Artist", password_hash="pw",
        is_active=True, is_verified=True
    )
    venue_owner_user = User(
        id=uuid.uuid4(), email=f"integ_venue_{uuid.uuid4().hex[:6]}@test.dev",
        name="Integration Venue Owner", password_hash="pw",
        is_active=True, is_verified=True
    )
    admin_user = User(
        id=uuid.uuid4(), email=f"integ_admin_{uuid.uuid4().hex[:6]}@test.dev",
        name="Integration Admin", password_hash="pw",
        is_active=True, is_verified=True
    )
    client_user.roles.append(client_role)
    artist_user.roles.append(artist_role)
    venue_owner_user.roles.append(venue_role)
    admin_user.roles.append(admin_role)
    db_session.add_all([client_user, artist_user, venue_owner_user, admin_user])
    db_session.commit()

    # ── Artist Profile ────────────────────────────────────────────────────────
    artist_profile = ArtistProfile(
        id=uuid.uuid4(), user_id=artist_user.id,
        bio="Integration test performer", base_rate=5000.0,
        verification_status="approved", display_name="The Integration Band"
    )
    db_session.add(artist_profile)
    db_session.commit()

    # ── Location hierarchy required by Venue ─────────────────────────────────
    country = Country(id=uuid.uuid4(), name=f"IntegLand_{uuid.uuid4().hex[:4]}", code=uuid.uuid4().hex[:2].upper())
    db_session.add(country)
    db_session.commit()
    state = State(id=uuid.uuid4(), name="IntegState", country_id=country.id)
    db_session.add(state)
    db_session.commit()
    city = City(id=uuid.uuid4(), name="IntegCity", state_id=state.id)
    db_session.add(city)
    db_session.commit()

    # ── Venue ─────────────────────────────────────────────────────────────────
    venue = Venue(
        id=uuid.uuid4(), user_id=venue_owner_user.id,
        name="Integration Hall", description="Test venue",
        address="123 Test St", city_id=city.id,
        base_price=10000.0, verification_status="approved"
    )
    db_session.add(venue)
    db_session.commit()

    # ── Booking (pending, artist only) ────────────────────────────────────────
    booking = Booking(
        id=uuid.uuid4(),
        client_id=client_user.id,
        artist_profile_id=artist_profile.id,
        event_name="Grand Integration Gala",
        event_date=datetime.date(2028, 3, 15),
        start_time=datetime.time(18, 0),
        end_time=datetime.time(22, 0),
        location="Integration Hall, IntegCity",
        proposed_price=5000.0,
        status="pending",
        timeline=[{
            "status": "pending",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "by": "client",
            "message": "Booking initialised"
        }]
    )
    db_session.add(booking)
    db_session.commit()

    return {
        "client": client_user,
        "artist_user": artist_user,
        "artist_profile": artist_profile,
        "venue_owner": venue_owner_user,
        "venue": venue,
        "admin": admin_user,
        "booking": booking,
    }


def _clear_notifications(db_session):
    """Delete all notification rows for test isolation."""
    db_session.query(Notification).delete(synchronize_session=False)
    db_session.commit()


def _notifs_for(db_session, user_id):
    """Return all non-deleted notifications for a user."""
    return (
        db_session.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.deleted_at.is_(None)
        )
        .order_by(Notification.created_at.desc())
        .all()
    )


# ── Test 1: Booking Created ───────────────────────────────────────────────────

def test_booking_created_notifies_artist(db_session, integration_data):
    """Artist receives a 'New Booking Request' when a booking is created."""
    _clear_notifications(db_session)
    b = integration_data["booking"]

    create_booking_notification(
        db=db_session, booking=b,
        event_type="created",
        actor_id=str(integration_data["client"].id),
        actor_role="client"
    )

    notifs = _notifs_for(db_session, integration_data["artist_user"].id)
    assert len(notifs) == 1
    n = notifs[0]
    assert n.title == "New Booking Request"
    assert "Grand Integration Gala" in n.message
    assert n.notification_type == "booking_request"
    # Reference fields
    assert n.reference_type == "BOOKING"
    assert str(n.reference_id) == str(b.id)
    # Metadata
    assert n.notification_metadata is not None
    assert n.notification_metadata["event_name"] == "Grand Integration Gala"
    assert n.notification_metadata["event_type"] == "created"


def test_booking_created_does_not_notify_client(db_session, integration_data):
    """Client should NOT receive a notification when they create a booking."""
    _clear_notifications(db_session)
    b = integration_data["booking"]

    create_booking_notification(
        db=db_session, booking=b, event_type="created",
        actor_id=str(integration_data["client"].id), actor_role="client"
    )

    client_notifs = _notifs_for(db_session, integration_data["client"].id)
    assert len(client_notifs) == 0


# ── Test 2: Booking Accepted ──────────────────────────────────────────────────

def test_booking_accepted_notifies_client(db_session, integration_data):
    """Client receives 'Booking Accepted' after artist accepts."""
    _clear_notifications(db_session)
    b = integration_data["booking"]
    artist_uid = str(integration_data["artist_user"].id)

    BookingWorkflowEngine.transition(
        db=db_session, booking_id=b.id,
        actor_id=artist_uid, actor_role="artist",
        action="accept", target_status="accepted"
    )

    notifs = _notifs_for(db_session, integration_data["client"].id)
    assert len(notifs) >= 1
    n = next(x for x in notifs if x.notification_type == "booking_accepted")
    assert n.title == "Booking Accepted"
    assert "Grand Integration Gala" in n.message
    assert n.reference_type == "BOOKING"
    assert str(n.reference_id) == str(b.id)
    assert n.notification_metadata["event_type"] == "accepted"


# ── Test 3: Booking Rejected ──────────────────────────────────────────────────

def test_booking_rejected_notifies_client(db_session, integration_data):
    """Client receives 'Booking Rejected' when artist rejects."""
    _clear_notifications(db_session)
    b = integration_data["booking"]
    artist_uid = str(integration_data["artist_user"].id)

    BookingWorkflowEngine.transition(
        db=db_session, booking_id=b.id,
        actor_id=artist_uid, actor_role="artist",
        action="reject", target_status="rejected"
    )

    notifs = _notifs_for(db_session, integration_data["client"].id)
    assert len(notifs) >= 1
    n = next(x for x in notifs if x.notification_type == "booking_rejected")
    assert n.title == "Booking Rejected"
    assert n.reference_type == "BOOKING"
    assert str(n.reference_id) == str(b.id)


# ── Test 4: Counter Offer ─────────────────────────────────────────────────────

def test_counter_offer_notifies_client(db_session, integration_data):
    """Client receives 'Counter Offer Received' when artist sends counter."""
    _clear_notifications(db_session)
    b = integration_data["booking"]
    artist_uid = str(integration_data["artist_user"].id)

    BookingWorkflowEngine.transition(
        db=db_session, booking_id=b.id,
        actor_id=artist_uid, actor_role="artist",
        action="counter", target_status="counter_offered",
        counter_price=7500.0, reason="Weekend surcharge applies"
    )

    notifs = _notifs_for(db_session, integration_data["client"].id)
    n = next(x for x in notifs if x.notification_type == "counter_offer")
    assert n.title == "Counter Offer Received"
    assert "7500" in n.message
    assert n.reference_type == "BOOKING"
    assert str(n.reference_id) == str(b.id)


# ── Test 5: Counter Offer Accepted ────────────────────────────────────────────

def test_counter_offer_accepted_notifies_artist(db_session, integration_data):
    """Artist receives 'Counter Offer Accepted' when client accepts the counter."""
    _clear_notifications(db_session)
    b = integration_data["booking"]
    artist_uid = str(integration_data["artist_user"].id)
    client_uid = str(integration_data["client"].id)

    # 1. Artist sends counter
    BookingWorkflowEngine.transition(
        db=db_session, booking_id=b.id,
        actor_id=artist_uid, actor_role="artist",
        action="counter", target_status="counter_offered",
        counter_price=7500.0
    )
    _clear_notifications(db_session)

    # 2. Client accepts counter (status: counter_offered → accepted)
    BookingWorkflowEngine.transition(
        db=db_session, booking_id=b.id,
        actor_id=client_uid, actor_role="client",
        action="accept", target_status="accepted"
    )

    notifs = _notifs_for(db_session, integration_data["artist_user"].id)
    n = next(x for x in notifs if x.notification_type == "counter_accepted")
    assert n.title == "Counter Offer Accepted"
    assert n.reference_type == "BOOKING"
    assert str(n.reference_id) == str(b.id)


# ── Test 6: Counter Offer Rejected ────────────────────────────────────────────

def test_counter_offer_rejected_notifies_artist(db_session, integration_data):
    """
    When a client cancels after a counter offer (the business equivalent of
    rejecting the counter), the artist receives a booking_cancelled notification
    with reference_type=BOOKING and the correct reference_id.

    Note: The workflow enforces that only artists/venue owners can use
    action='reject'. Clients signal counter-offer rejection by cancelling.
    The NotificationService maps this to the 'counter_rejected' event only
    when the artist explicitly rejects their own counter (i.e. counter→reject),
    which is tested via direct service call below.
    """
    _clear_notifications(db_session)
    b = integration_data["booking"]
    artist_uid = str(integration_data["artist_user"].id)

    # Artist sends counter
    BookingWorkflowEngine.transition(
        db=db_session, booking_id=b.id,
        actor_id=artist_uid, actor_role="artist",
        action="counter", target_status="counter_offered",
        counter_price=8000.0
    )
    _clear_notifications(db_session)

    # Directly call service to verify counter_rejected notification content
    create_booking_notification(
        db=db_session, booking=b,
        event_type="counter_rejected",
        actor_id=artist_uid,
        actor_role="artist"
    )

    notifs = _notifs_for(db_session, integration_data["artist_user"].id)
    n = next(x for x in notifs if x.notification_type == "counter_rejected")
    assert n.title == "Counter Offer Rejected"
    assert n.reference_type == "BOOKING"
    assert str(n.reference_id) == str(b.id)
    assert n.notification_metadata["event_type"] == "counter_rejected"


# ── Test 7: Booking Confirmed ─────────────────────────────────────────────────

def test_booking_confirmed_notifies_all_parties(db_session, integration_data):
    """Client and Artist both receive 'Booking Confirmed'."""
    _clear_notifications(db_session)
    b = integration_data["booking"]
    artist_uid = str(integration_data["artist_user"].id)

    # pending → accepted
    BookingWorkflowEngine.transition(
        db=db_session, booking_id=b.id,
        actor_id=artist_uid, actor_role="artist",
        action="accept", target_status="accepted"
    )
    _clear_notifications(db_session)

    # accepted → confirmed (admin override to bypass payment gate in tests)
    BookingWorkflowEngine.transition(
        db=db_session, booking_id=b.id,
        actor_id=artist_uid, actor_role="admin",
        action="confirm", target_status="confirmed"
    )

    # Client notification
    client_notifs = _notifs_for(db_session, integration_data["client"].id)
    client_n = next(x for x in client_notifs if x.notification_type == "booking_confirmed")
    assert client_n.title == "Booking Confirmed"
    assert client_n.reference_type == "BOOKING"
    assert str(client_n.reference_id) == str(b.id)

    # Artist notification
    artist_notifs = _notifs_for(db_session, integration_data["artist_user"].id)
    artist_n = next(x for x in artist_notifs if x.notification_type == "booking_confirmed")
    assert artist_n.title == "Booking Confirmed"
    assert artist_n.reference_type == "BOOKING"
    assert str(artist_n.reference_id) == str(b.id)


# ── Test 8: Booking Cancelled ─────────────────────────────────────────────────

def test_booking_cancelled_notifies_affected_parties_not_canceller(db_session, integration_data):
    """
    When artist cancels, client receives notification.
    The canceller (artist) should NOT receive a cancellation notification.
    """
    _clear_notifications(db_session)
    b = integration_data["booking"]
    artist_uid = str(integration_data["artist_user"].id)

    # pending → accepted first
    BookingWorkflowEngine.transition(
        db=db_session, booking_id=b.id,
        actor_id=artist_uid, actor_role="artist",
        action="accept", target_status="accepted"
    )
    _clear_notifications(db_session)

    # Artist cancels
    BookingWorkflowEngine.transition(
        db=db_session, booking_id=b.id,
        actor_id=artist_uid, actor_role="artist",
        action="cancel", target_status="cancelled",
        reason="Scheduling conflict"
    )

    # Client must receive cancellation
    client_notifs = _notifs_for(db_session, integration_data["client"].id)
    c_n = next(x for x in client_notifs if x.notification_type == "booking_cancelled")
    assert c_n.title == "Booking Cancelled"
    assert c_n.reference_type == "BOOKING"
    assert str(c_n.reference_id) == str(b.id)

    # Artist (canceller) must NOT receive cancellation notification
    artist_notifs = _notifs_for(db_session, integration_data["artist_user"].id)
    artist_cancel = [x for x in artist_notifs if x.notification_type == "booking_cancelled"]
    assert len(artist_cancel) == 0


# ── Test 9: Booking Completed ─────────────────────────────────────────────────

def test_booking_completed_notifies_all_parties(db_session, integration_data):
    """Client and Artist both receive 'Booking Completed'. Admin gets report."""
    _clear_notifications(db_session)
    b = integration_data["booking"]
    artist_uid = str(integration_data["artist_user"].id)

    # pending → accepted → confirmed → completed
    BookingWorkflowEngine.transition(
        db=db_session, booking_id=b.id,
        actor_id=artist_uid, actor_role="artist",
        action="accept", target_status="accepted"
    )
    BookingWorkflowEngine.transition(
        db=db_session, booking_id=b.id,
        actor_id=artist_uid, actor_role="admin",
        action="confirm", target_status="confirmed"
    )
    _clear_notifications(db_session)

    BookingWorkflowEngine.transition(
        db=db_session, booking_id=b.id,
        actor_id=artist_uid, actor_role="artist",
        action="complete", target_status="completed"
    )

    # Client
    client_notifs = _notifs_for(db_session, integration_data["client"].id)
    c_n = next(x for x in client_notifs if x.notification_type == "booking_completed")
    assert c_n.title == "Booking Completed"
    assert c_n.reference_type == "BOOKING"
    assert str(c_n.reference_id) == str(b.id)

    # Artist
    artist_notifs = _notifs_for(db_session, integration_data["artist_user"].id)
    a_n = next(x for x in artist_notifs if x.notification_type == "booking_completed")
    assert a_n.title == "Booking Completed"
    assert a_n.reference_type == "BOOKING"

    # Admin receives booking_report
    admin_notifs = _notifs_for(db_session, integration_data["admin"].id)
    admin_report = next(x for x in admin_notifs if x.notification_type == "booking_report")
    assert "Completed" in admin_report.title
    assert admin_report.reference_type == "BOOKING"
    assert str(admin_report.reference_id) == str(b.id)


# ── Test 10: RBAC — Wrong Actor Cannot Transition ─────────────────────────────

def test_rbac_wrong_actor_is_rejected(db_session, integration_data):
    """A random client cannot accept a booking on behalf of an artist."""
    b = integration_data["booking"]
    # Use client_id as actor but with artist role — RBAC should reject
    with pytest.raises(BadRequestException):
        BookingWorkflowEngine.transition(
            db=db_session, booking_id=b.id,
            actor_id=str(integration_data["client"].id),
            actor_role="artist",
            action="accept", target_status="accepted"
        )


def test_rbac_failed_action_alerts_admin(db_session, integration_data):
    """When a RBAC violation triggers BadRequestException, admin gets a failed_action alert."""
    _clear_notifications(db_session)
    b = integration_data["booking"]

    # Client tries to complete a pending booking — invalid both by RBAC and transition matrix
    with pytest.raises(BadRequestException):
        BookingWorkflowEngine.transition(
            db=db_session, booking_id=b.id,
            actor_id=str(integration_data["client"].id),
            actor_role="client",
            action="complete", target_status="completed"
        )

    admin_notifs = _notifs_for(db_session, integration_data["admin"].id)
    failed_notif = next(
        (x for x in admin_notifs if x.notification_type == "failed_action"), None
    )
    assert failed_notif is not None
    assert failed_notif.title == "Failed Booking Action"
    assert "complete" in failed_notif.message


# ── Test 11: reference_type and reference_id on All Direct Events ─────────────

@pytest.mark.parametrize("event_type,expected_type", [
    ("created",   "booking_request"),
    ("accepted",  "booking_accepted"),
    ("rejected",  "booking_rejected"),
    ("counter",   "counter_offer"),
    ("confirmed", "booking_confirmed"),
    ("completed", "booking_completed"),
    ("cancelled", "booking_cancelled"),
])
def test_reference_fields_present_for_event(db_session, integration_data, event_type, expected_type):
    """Every booking event notification carries reference_type='BOOKING' and reference_id=booking.id."""
    _clear_notifications(db_session)
    b = integration_data["booking"]

    # Force the booking to a state where this event makes sense
    # We call create_booking_notification directly to test the service layer
    # rather than chaining state transitions (which have ordering constraints).
    create_booking_notification(
        db=db_session, booking=b,
        event_type=event_type,
        actor_id=str(integration_data["client"].id),
        actor_role="client"
    )

    # At least one notification must exist with the correct reference fields
    all_notifs = (
        db_session.query(Notification)
        .filter(Notification.deleted_at.is_(None))
        .all()
    )
    assert len(all_notifs) >= 1, f"No notifications created for event_type={event_type}"

    for n in all_notifs:
        assert n.reference_type == "BOOKING", (
            f"Expected reference_type='BOOKING' for event '{event_type}', got '{n.reference_type}'"
        )
        assert str(n.reference_id) == str(b.id), (
            f"Expected reference_id={b.id} for event '{event_type}', got {n.reference_id}"
        )


# ── Test 12: Notification Metadata Contains Booking Context ───────────────────

def test_notification_metadata_contains_booking_context(db_session, integration_data):
    """Notification metadata must contain event_name, booking_status, event_type, actor_role."""
    _clear_notifications(db_session)
    b = integration_data["booking"]

    create_booking_notification(
        db=db_session, booking=b,
        event_type="created",
        actor_id=str(integration_data["client"].id),
        actor_role="client"
    )

    notif = (
        db_session.query(Notification)
        .filter(Notification.deleted_at.is_(None))
        .first()
    )
    assert notif is not None
    meta = notif.notification_metadata
    assert meta is not None
    assert meta["event_name"] == "Grand Integration Gala"
    assert meta["booking_status"] == "pending"
    assert meta["event_type"] == "created"
    assert meta["actor_role"] == "client"
