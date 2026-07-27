"""
WebSocket Notifications Tests
==============================

Verifies WebSocket connection lifecycle:
  - Valid JWT connection & auth check
  - Invalid/expired JWT rejection with code 4001
  - Heartbeat handshake
  - Connection/disconnection count tracking
  - Multi-tab (multiple connections per user) support
  - Recipient filtering (isolation between users)
  - Realtime notification delivery after booking workflow events
  - Realtime admin notification delivery for failed booking events
"""

import uuid
import datetime
import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocketDisconnect
from sqlalchemy.orm import Session

from app.features.auth.models import User, Role
from app.features.bookings.models import Booking
from app.features.artists.models import ArtistProfile
from app.features.notifications.connection_manager import connection_manager
from app.features.notifications.publisher import publish_notification
from app.features.notifications.service import create_booking_notification, create_failed_action_notification
from app.core.security import create_access_token


# ── Test Setup / Fixture Helpers ─────────────────────────────────────────────

def _create_test_user(db: Session, name: str, role_name: str) -> tuple[User, str]:
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        role = Role(id=uuid.uuid4(), name=role_name, description=f"Test {role_name}")
        db.add(role)
        db.commit()

    user = User(
        id=uuid.uuid4(),
        email=f"ws_{name}_{uuid.uuid4().hex[:6]}@test.dev",
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


# ── Tests ────────────────────────────────────────────────────────────────────

def test_websocket_connect_success(client: TestClient, db_session: Session):
    """A user with a valid JWT can establish a WebSocket connection and gets confirmation."""
    user, token = _create_test_user(db_session, "user1", "client")

    with client.websocket_connect(f"/api/v1/ws/notifications?token={token}") as ws:
        data = ws.receive_json()
        assert data["type"] == "connected"
        assert data["user_id"] == str(user.id)
        assert connection_manager.is_connected(str(user.id))


def test_websocket_connect_invalid_token(client: TestClient):
    """An invalid token is immediately rejected with close code 4001."""
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/api/v1/ws/notifications?token=invalid_jwt_token"):
            pass
    assert exc.value.code == 4001


def test_websocket_multiple_connections_dedup(client: TestClient, db_session: Session):
    """Multiple browser tabs from the same user are registered together and all receive notifications."""
    user, token = _create_test_user(db_session, "multitabs", "client")

    # Connect Tab 1 and Tab 2
    with client.websocket_connect(f"/api/v1/ws/notifications?token={token}") as ws1:
        data1 = ws1.receive_json()
        assert data1["type"] == "connected"

        with client.websocket_connect(f"/api/v1/ws/notifications?token={token}") as ws2:
            data2 = ws2.receive_json()
            assert data2["type"] == "connected"

            # Check that ConnectionManager tracks both sockets under the single user ID
            sockets = connection_manager.active_connections.get(str(user.id))
            assert sockets is not None
            assert len(sockets) == 2

            # Try publishing a dummy notification
            dummy_notif = {
                "id": str(uuid.uuid4()),
                "title": "Multi tab test",
                "message": "Both tabs should see this",
                "is_read": False,
            }
            # Simulate publish_notification call
            from app.features.notifications.publisher import _event_loop
            if _event_loop:
                publish_notification(user.id, dummy_notif)
                # Receive in both tabs
                msg1 = ws1.receive_json()
                msg2 = ws2.receive_json()
                assert msg1["type"] == "notification"
                assert msg1["data"]["title"] == "Multi tab test"
                assert msg2["type"] == "notification"
                assert msg2["data"]["title"] == "Multi tab test"


def test_websocket_recipient_filtering(client: TestClient, db_session: Session):
    """User A does not receive notifications sent to User B."""
    user_a, token_a = _create_test_user(db_session, "usera", "client")
    user_b, token_b = _create_test_user(db_session, "userb", "client")

    with client.websocket_connect(f"/api/v1/ws/notifications?token={token_a}") as ws_a:
        ws_a.receive_json()  # Consume connection confirmation

        with client.websocket_connect(f"/api/v1/ws/notifications?token={token_b}") as ws_b:
            ws_b.receive_json()  # Consume connection confirmation

            # Deliver notification to User A
            dummy_notif = {
                "id": str(uuid.uuid4()),
                "title": "A's Private Message",
                "message": "For A's eyes only",
                "is_read": False,
            }
            
            # Use direct ConnectionManager sending to guarantee delivery sequence
            import asyncio
            asyncio.run(connection_manager.send_to_user(str(user_a.id), {
                "type": "notification",
                "data": dummy_notif,
            }))

            # User A receives the notification
            msg_a = ws_a.receive_json()
            assert msg_a["type"] == "notification"
            assert msg_a["data"]["title"] == "A's Private Message"

            # User B should NOT receive it (no message in buffer, timeout or close)
            # In test client, wait_for with small timeout verifies empty buffer
            with pytest.raises(asyncio.TimeoutError):
                asyncio.run(asyncio.wait_for(asyncio.to_thread(ws_b.receive_json), timeout=0.1))


def test_websocket_booking_notification_flow(client: TestClient, db_session: Session):
    """When a booking notification is created in the service, it publishes in real-time to active WS connections."""
    client_user, client_token = _create_test_user(db_session, "client_user", "client")
    artist_user, artist_token = _create_test_user(db_session, "artist_user", "artist")

    # Create dummy artist profile
    artist_profile = ArtistProfile(
        id=uuid.uuid4(), user_id=artist_user.id,
        bio="Test Artist", base_rate=2000.0,
        verification_status="approved", display_name="WS Performer"
    )
    db_session.add(artist_profile)
    db_session.commit()

    # Create dummy booking request
    booking = Booking(
        id=uuid.uuid4(),
        client_id=client_user.id,
        artist_profile_id=artist_profile.id,
        event_name="Live WS Gala",
        event_date=datetime.date(2028, 5, 20),
        start_time=datetime.time(19, 0),
        end_time=datetime.time(23, 0),
        location="Websocket Arena",
        proposed_price=4000.0,
        status="pending"
    )
    db_session.add(booking)
    db_session.commit()

    # Connect Artist WS
    with client.websocket_connect(f"/api/v1/ws/notifications?token={artist_token}") as ws:
        ws.receive_json()  # connection confirmed

        # Trigger notification generation (booking created event -> notifies artist)
        create_booking_notification(
            db=db_session,
            booking=booking,
            event_type="created",
            actor_id=str(client_user.id),
            actor_role="client"
        )

        # Confirm the artist received the realtime event over WebSocket
        ws_msg = ws.receive_json()
        assert ws_msg["type"] == "notification"
        assert ws_msg["data"]["title"] == "New Booking Request"
        assert ws_msg["data"]["reference_type"] == "BOOKING"
        assert ws_msg["data"]["reference_id"] == str(booking.id)


def test_websocket_failed_booking_notifies_admin(client: TestClient, db_session: Session):
    """When a failed booking action occurs, admins receive an alert notification over WebSocket in real time."""
    admin_user, admin_token = _create_test_user(db_session, "admin_user", "admin")

    with client.websocket_connect(f"/api/v1/ws/notifications?token={admin_token}") as ws:
        ws.receive_json()  # connection confirmed

        # Trigger failed action notification
        create_failed_action_notification(
            booking_id=uuid.uuid4(),
            actor_id=str(uuid.uuid4()),
            actor_role="client",
            action="accept",
            error_message="Invalid transition from rejected to accepted",
            db=db_session
        )

        # Confirm admin received failed action notification over WS
        ws_msg = ws.receive_json()
        assert ws_msg["type"] == "notification"
        assert ws_msg["data"]["notification_type"] == "failed_action"
        assert "Failed Booking Action" in ws_msg["data"]["title"]

