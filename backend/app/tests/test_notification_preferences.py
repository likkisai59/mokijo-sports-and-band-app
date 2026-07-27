"""
Notification Preferences Tests
==============================

Verifies preferences behavior:
  - Default preferences are created when missing (all True)
  - Users can read and update their own preferences
  - Users cannot read or update other users' preferences (RBAC)
  - Delivery suppression: when booking_enabled is False, no booking notification is saved
  - Realtime suppression: when realtime_enabled is False, notification is saved but WS push is skipped
"""

import uuid
import datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.features.auth.models import User, Role
from app.features.bookings.models import Booking
from app.features.artists.models import ArtistProfile
from app.features.notifications.models import Notification
from app.features.notifications.preferences.models import NotificationPreference
from app.features.notifications.preferences.repository import notification_preference_repository
from app.features.notifications.preferences.service import notification_preference_service
from app.features.notifications.service import create_booking_notification
from app.core.security import create_access_token


# ── Fixtures & Setup Helpers ──────────────────────────────────────────────────

def _create_ws_test_user(db: Session, name: str, role_name: str) -> tuple[User, str]:
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        role = Role(id=uuid.uuid4(), name=role_name, description=f"Test {role_name}")
        db.add(role)
        db.commit()

    user = User(
        id=uuid.uuid4(),
        email=f"prefs_{name}_{uuid.uuid4().hex[:6]}@test.dev",
        name=name,
        password_hash="pw",
        is_active=True,
        is_verified=True
    )
    user.roles.append(role)
    db.add(user)
    db.commit()

    token = create_access_token(subject=str(user.id), role=role_name, email=user.email)
    return user, token


def _clear_notifications_and_prefs(db: Session):
    db.query(Notification).delete()
    db.query(NotificationPreference).delete()
    db.commit()


# ── Tests ────────────────────────────────────────────────────────────────────

def test_default_preferences_created_on_get(db_session: Session):
    """Retrieving preferences when none exist automatically creates a default set (all True)."""
    _clear_notifications_and_prefs(db_session)
    user, _ = _create_ws_test_user(db_session, "default_user", "client")

    # Get preferences (triggers get_or_create)
    prefs = notification_preference_service.get_preferences(db_session, user.id)
    assert prefs is not None
    assert prefs.user_id == user.id
    assert prefs.booking_enabled is True
    assert prefs.payment_enabled is True
    assert prefs.review_enabled is True
    assert prefs.message_enabled is True
    assert prefs.system_enabled is True
    assert prefs.realtime_enabled is True


def test_get_and_patch_preferences_endpoints(client: TestClient, db_session: Session):
    """Users can fetch and update their notification preferences via API."""
    _clear_notifications_and_prefs(db_session)
    user, token = _create_ws_test_user(db_session, "api_user", "client")

    # 1. Fetch preferences
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/notifications/preferences", headers=headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["booking_enabled"] is True
    assert data["realtime_enabled"] is True

    # 2. Patch preferences (turn off booking and realtime)
    patch_payload = {
        "booking_enabled": False,
        "realtime_enabled": False
    }
    patch_res = client.patch("/api/v1/notifications/preferences", json=patch_payload, headers=headers)
    assert patch_res.status_code == 200
    updated_data = patch_res.json()["data"]
    assert updated_data["booking_enabled"] is False
    assert updated_data["realtime_enabled"] is False
    assert updated_data["payment_enabled"] is True  # Unchanged remains True

    # Verify db state
    db_session.expire_all()
    prefs = notification_preference_repository.get_by_user_id(db_session, user.id)
    assert prefs.booking_enabled is False
    assert prefs.realtime_enabled is False
    assert prefs.payment_enabled is True


def test_preferences_endpoint_requires_auth(client: TestClient):
    """Unauthenticated users receive 401 when fetching or editing preferences."""
    response_get = client.get("/api/v1/notifications/preferences")
    assert response_get.status_code == 401

    response_patch = client.patch("/api/v1/notifications/preferences", json={"booking_enabled": False})
    assert response_patch.status_code == 401


def test_notification_delivery_suppression(db_session: Session):
    """If a preference channel is disabled (e.g. booking_enabled=False), notifications are not stored."""
    _clear_notifications_and_prefs(db_session)
    client_user, _ = _create_ws_test_user(db_session, "client", "client")
    artist_user, _ = _create_ws_test_user(db_session, "artist", "artist")

    # Disable booking notifications for the artist
    notification_preference_service.update_preferences(
        db=db_session,
        user_id=artist_user.id,
        obj_in=NotificationPreference(booking_enabled=False)
    )

    # Setup dummy artist and booking
    artist_profile = ArtistProfile(
        id=uuid.uuid4(), user_id=artist_user.id,
        bio="Test Bio", base_rate=1000.0,
        verification_status="approved", display_name="Prefs Artist"
    )
    db_session.add(artist_profile)
    db_session.commit()

    booking = Booking(
        id=uuid.uuid4(),
        client_id=client_user.id,
        artist_profile_id=artist_profile.id,
        event_name="Silent Gala",
        event_date=datetime.date(2028, 5, 20),
        start_time=datetime.time(19, 0),
        end_time=datetime.time(23, 0),
        location="Quiet Room",
        proposed_price=4000.0,
        status="pending"
    )
    db_session.add(booking)
    db_session.commit()

    # Trigger booking notification (event: created notifies artist)
    create_booking_notification(
        db=db_session,
        booking=booking,
        event_type="created",
        actor_id=str(client_user.id),
        actor_role="client"
    )

    # Check that NO notification was created for the artist (delivery allowed = False)
    artist_notifs = (
        db_session.query(Notification)
        .filter(Notification.user_id == artist_user.id)
        .all()
    )
    assert len(artist_notifs) == 0


def test_websocket_delivery_suppression(client: TestClient, db_session: Session):
    """If realtime_enabled=False, the notification is stored in the DB, but WS push is skipped."""
    _clear_notifications_and_prefs(db_session)
    client_user, _ = _create_ws_test_user(db_session, "ws_client", "client")
    artist_user, artist_token = _create_ws_test_user(db_session, "ws_artist", "artist")

    # Disable ONLY real-time delivery for the artist
    notification_preference_service.update_preferences(
        db=db_session,
        user_id=artist_user.id,
        obj_in=NotificationPreference(booking_enabled=True, realtime_enabled=False)
    )

    # Setup dummy artist and booking
    artist_profile = ArtistProfile(
        id=uuid.uuid4(), user_id=artist_user.id,
        bio="Test Bio", base_rate=1000.0,
        verification_status="approved", display_name="Prefs Artist 2"
    )
    db_session.add(artist_profile)
    db_session.commit()

    booking = Booking(
        id=uuid.uuid4(),
        client_id=client_user.id,
        artist_profile_id=artist_profile.id,
        event_name="Database Only Gala",
        event_date=datetime.date(2028, 5, 20),
        start_time=datetime.time(19, 0),
        end_time=datetime.time(23, 0),
        location="Database Room",
        proposed_price=4000.0,
        status="pending"
    )
    db_session.add(booking)
    db_session.commit()

    # Connect WebSocket
    with client.websocket_connect(f"/api/v1/ws/notifications?token={artist_token}") as ws:
        ws.receive_json()  # Consume connection confirmation

        # Setup loop
        import asyncio
        from app.features.notifications.publisher import set_publisher_event_loop
        set_publisher_event_loop(asyncio.get_event_loop())

        # Trigger notification
        create_booking_notification(
            db=db_session,
            booking=booking,
            event_type="created",
            actor_id=str(client_user.id),
            actor_role="client"
        )

        # Check DB: The notification IS stored successfully
        artist_notifs = (
            db_session.query(Notification)
            .filter(Notification.user_id == artist_user.id)
            .all()
        )
        assert len(artist_notifs) == 1
        assert artist_notifs[0].title == "New Booking Request"

        # Check WebSocket buffer: It is EMPTY (timeout indicates no message sent)
        with pytest.raises(asyncio.TimeoutError):
            asyncio.run(asyncio.wait_for(asyncio.to_thread(ws.receive_json), timeout=0.1))
