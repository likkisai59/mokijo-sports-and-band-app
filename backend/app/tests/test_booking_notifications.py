import uuid
import datetime
import pytest
from app.features.auth.models import User, Role
from app.features.bookings.models import Booking
from app.features.notifications.models import Notification
from app.features.artists.models import ArtistProfile
from app.features.locations.models import Country, State, City
from app.features.bookings.workflow import BookingWorkflowEngine
from app.features.notifications.service import create_booking_notification
from app.core.exceptions import BadRequestException

@pytest.fixture
def notification_setup_data(db_session):
    # Location Setup
    country = Country(id=uuid.uuid4(), name="Notif Country", code="NC")
    db_session.add(country)
    db_session.commit()

    state = State(id=uuid.uuid4(), name="Notif State", country_id=country.id)
    db_session.add(state)
    db_session.commit()

    city = City(id=uuid.uuid4(), name="Notif City", state_id=state.id)
    db_session.add(city)
    db_session.commit()

    # User Setup
    client_user = User(
        id=uuid.uuid4(), email="notif_client@example.com", name="Client User",
        password_hash="pw", is_active=True, is_verified=True
    )
    artist_user = User(
        id=uuid.uuid4(), email="notif_artist@example.com", name="Artist User",
        password_hash="pw", is_active=True, is_verified=True
    )
    admin_user = User(
        id=uuid.uuid4(), email="notif_admin@example.com", name="Admin User",
        password_hash="pw", is_active=True, is_verified=True
    )
    
    # Instantiate and commit roles first
    client_role = Role(id=uuid.uuid4(), name="client", description="Client role")
    artist_role = Role(id=uuid.uuid4(), name="artist", description="Artist role")
    admin_role = Role(id=uuid.uuid4(), name="admin", description="Admin role")
    db_session.add_all([client_role, artist_role, admin_role])
    db_session.commit()
    
    client_user.roles.append(client_role)
    artist_user.roles.append(artist_role)
    admin_user.roles.append(admin_role)

    db_session.add_all([client_user, artist_user, admin_user])
    db_session.commit()

    # Performer setup
    artist_profile = ArtistProfile(
        id=uuid.uuid4(), user_id=artist_user.id, bio="WF Bio", base_rate=300.0,
        verification_status="approved", display_name="WF Performer"
    )
    db_session.add(artist_profile)
    db_session.commit()

    # Booking setup
    booking = Booking(
        id=uuid.uuid4(),
        client_id=client_user.id,
        artist_profile_id=artist_profile.id,
        event_name="Anniversary Show",
        event_date=datetime.date(2027, 5, 20),
        start_time=datetime.time(18, 0),
        end_time=datetime.time(21, 0),
        location="Studio B",
        proposed_price=600.0,
        status="pending",
        timeline=[{
            "status": "pending",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "by": "client",
            "message": "Initialized"
        }]
    )
    db_session.add(booking)
    db_session.commit()

    return {
        "client": client_user,
        "artist_user": artist_user,
        "artist_profile": artist_profile,
        "admin": admin_user,
        "booking": booking
    }

def test_booking_created_triggers_notification(db_session, notification_setup_data):
    # Retrieve the booking and execute dispatcher for created event
    b = notification_setup_data["booking"]
    create_booking_notification(
        db=db_session,
        booking=b,
        event_type="created",
        actor_id=str(notification_setup_data["client"].id),
        actor_role="client"
    )

    # Check notification sent to Artist
    notif = db_session.query(Notification).filter(
        Notification.user_id == notification_setup_data["artist_user"].id,
        Notification.deleted_at.is_(None)
    ).first()
    assert notif is not None
    assert notif.title == "New Booking Request"
    assert "Anniversary Show" in notif.message
    assert notif.notification_type == "booking_request"
    assert f"/artist/bookings?id={b.id}" == notif.link

def test_workflow_transitions_trigger_notifications(db_session, notification_setup_data):
    b = notification_setup_data["booking"]
    artist_uid = str(notification_setup_data["artist_user"].id)

    # Clean old notifications
    db_session.query(Notification).delete()
    db_session.commit()

    # Transition: accept
    BookingWorkflowEngine.transition(
        db=db_session,
        booking_id=b.id,
        actor_id=artist_uid,
        actor_role="artist",
        action="accept",
        target_status="accepted"
    )

    # Verify Client received notification
    notif = db_session.query(Notification).filter(
        Notification.user_id == notification_setup_data["client"].id
    ).first()
    assert notif is not None
    assert notif.title == "Booking Accepted"
    assert notif.notification_type == "booking_accepted"

def test_failed_actions_alert_admins(db_session, notification_setup_data):
    b = notification_setup_data["booking"]
    client_uid = str(notification_setup_data["client"].id)

    # Clear old notifications
    db_session.query(Notification).delete()
    db_session.commit()

    # Trigger a failing action (e.g. client tries to complete pending booking)
    with pytest.raises(BadRequestException):
        BookingWorkflowEngine.transition(
            db=db_session,
            booking_id=b.id,
            actor_id=client_uid,
            actor_role="client",
            action="complete",
            target_status="completed"
        )

    # Check Admin received alert
    notif = db_session.query(Notification).filter(
        Notification.user_id == notification_setup_data["admin"].id
    ).first()
    assert notif is not None
    assert notif.title == "Failed Booking Action"
    assert "complete" in notif.message
    assert notif.notification_type == "failed_action"

def test_notifications_endpoints_with_new_fields(client, db_session, notification_setup_data):
    # Add a mock notification with new fields
    n = Notification(
        id=uuid.uuid4(),
        user_id=notification_setup_data["client"].id,
        title="Custom Notification",
        message="Alert details",
        notification_type="alert",
        link="/some-url"
    )
    db_session.add(n)
    db_session.commit()

    # Authenticate as client
    async def override_get_current_user():
        return {"sub": str(notification_setup_data["client"].id), "role": "client"}

    from app.core.dependencies import get_current_user
    from main import app
    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        # 1. Fetch notification list & verify properties
        response = client.get("/api/v1/notifications")
        assert response.status_code == 200
        data = response.json()["data"]
        notif_item = data["notifications"][0]
        assert notif_item["notification_type"] == "alert"
        assert notif_item["link"] == "/some-url"
        assert data["unread_count"] == 1

        # 2. Test soft deletion
        del_response = client.delete(f"/api/v1/notifications/{n.id}")
        assert del_response.status_code == 200

        # Check soft deleted not visible anymore
        db_session.refresh(n)
        assert n.deleted_at is not None

        response2 = client.get("/api/v1/notifications")
        assert response2.status_code == 200
        assert len(response2.json()["data"]["notifications"]) == 0

    finally:
        app.dependency_overrides.pop(get_current_user, None)
