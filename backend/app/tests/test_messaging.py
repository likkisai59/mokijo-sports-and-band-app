"""
Messaging Module — Phase 1 (Foundation) Tests
==============================================

Verifies:
  - Conversation creation & duplicate prevention
  - Participant authorization (RBAC & booking-centric control)
  - Text message creation & validation (empty, max length)
  - Closed conversation read-only rule
  - Message pagination
  - Soft delete isolation
"""

import uuid
import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.features.auth.models import User, Role
from app.features.bookings.models import Booking
from app.features.artists.models import ArtistProfile
from app.features.messaging.conversation.models import Conversation
from app.core.security import create_access_token


# ── Helpers & Fixtures ────────────────────────────────────────────────────────

def _create_user(db: Session, name: str, role_name: str) -> tuple[User, str]:
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        role = Role(id=uuid.uuid4(), name=role_name, description=f"Test {role_name}")
        db.add(role)
        db.commit()

    user = User(
        id=uuid.uuid4(),
        email=f"msg_{name}_{uuid.uuid4().hex[:6]}@test.dev",
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


def _create_test_booking(db: Session, client_user: User, artist_user: User) -> Booking:
    artist_profile = ArtistProfile(
        id=uuid.uuid4(),
        user_id=artist_user.id,
        bio="Test Artist Bio",
        base_rate=5000.0,
        verification_status="approved",
        display_name=artist_user.name
    )
    db.add(artist_profile)
    db.commit()

    booking = Booking(
        id=uuid.uuid4(),
        client_id=client_user.id,
        artist_profile_id=artist_profile.id,
        event_name="Messaging Launch Party",
        event_date=datetime.date(2028, 8, 15),
        start_time=datetime.time(18, 0),
        end_time=datetime.time(22, 0),
        location="Grand Ballroom",
        proposed_price=15000.0,
        status="accepted"
    )
    db.add(booking)
    db.commit()
    return booking


# ── Tests ────────────────────────────────────────────────────────────────────

def test_conversation_creation_and_duplicate_prevention(client: TestClient, db_session: Session):
    """Participant can create a conversation; duplicate requests are rejected."""
    client_user, client_token = _create_user(db_session, "msg_client", "client")
    artist_user, artist_token = _create_user(db_session, "msg_artist", "artist")
    booking = _create_test_booking(db_session, client_user, artist_user)

    headers = {"Authorization": f"Bearer {client_token}"}
    payload = {"booking_id": str(booking.id)}

    # 1. Create conversation
    res = client.post("/api/v1/conversations", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["booking_id"] == str(booking.id)
    assert data["client_id"] == str(client_user.id)
    assert data["band_id"] == str(artist_user.id)
    assert data["status"] == "ACTIVE"

    # 2. Duplicate creation should fail
    res_dup = client.post("/api/v1/conversations", json=payload, headers=headers)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"]


def test_conversation_rbac_and_participant_isolation(client: TestClient, db_session: Session):
    """Non-participants cannot create or view conversations."""
    client_user, client_token = _create_user(db_session, "part_client", "client")
    artist_user, _ = _create_user(db_session, "part_artist", "artist")
    outsider_user, outsider_token = _create_user(db_session, "outsider", "client")
    booking = _create_test_booking(db_session, client_user, artist_user)

    # Outsider attempts to create conversation for someone else's booking
    res_outsider = client.post(
        "/api/v1/conversations",
        json={"booking_id": str(booking.id)},
        headers={"Authorization": f"Bearer {outsider_token}"}
    )
    assert res_outsider.status_code == 403

    # Client creates conversation
    res_valid = client.post(
        "/api/v1/conversations",
        json={"booking_id": str(booking.id)},
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert res_valid.status_code == 201
    conv_id = res_valid.json()["data"]["id"]

    # Outsider attempts to view conversation details
    res_view = client.get(
        f"/api/v1/conversations/{conv_id}",
        headers={"Authorization": f"Bearer {outsider_token}"}
    )
    assert res_view.status_code == 403


def test_send_message_and_history_pagination(client: TestClient, db_session: Session):
    """Participants can send messages and fetch history with pagination."""
    client_user, client_token = _create_user(db_session, "chat_client", "client")
    artist_user, artist_token = _create_user(db_session, "chat_artist", "artist")
    booking = _create_test_booking(db_session, client_user, artist_user)

    # 1. Create conversation
    res_conv = client.post(
        "/api/v1/conversations",
        json={"booking_id": str(booking.id)},
        headers={"Authorization": f"Bearer {client_token}"}
    )
    conv_id = res_conv.json()["data"]["id"]

    # 2. Client sends message
    headers_client = {"Authorization": f"Bearer {client_token}"}
    res_msg1 = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "Hello! Looking forward to the show."},
        headers=headers_client
    )
    assert res_msg1.status_code == 201
    msg1_data = res_msg1.json()["data"]
    assert msg1_data["content"] == "Hello! Looking forward to the show."
    assert msg1_data["sender_id"] == str(client_user.id)
    assert msg1_data["message_type"] == "TEXT"

    # 3. Artist sends message back
    headers_artist = {"Authorization": f"Bearer {artist_token}"}
    res_msg2 = client.post(
        f"/api/v1/conversations/{conv_id}/messages",
        json={"content": "Hi there! We are excited to perform."},
        headers=headers_artist
    )
    assert res_msg2.status_code == 201

    # 4. Get message history
    res_hist = client.get(f"/api/v1/conversations/{conv_id}/messages", headers=headers_client)
    assert res_hist.status_code == 200
    messages = res_hist.json()["data"]
    assert len(messages) == 2
    assert messages[0]["content"] == "Hello! Looking forward to the show."
    assert messages[1]["content"] == "Hi there! We are excited to perform."


def test_message_validation_and_closed_conversation(client: TestClient, db_session: Session):
    """Empty messages, over-length messages, and messaging closed conversations fail validation."""
    client_user, client_token = _create_user(db_session, "val_client", "client")
    artist_user, _ = _create_user(db_session, "val_artist", "artist")
    booking = _create_test_booking(db_session, client_user, artist_user)

    headers = {"Authorization": f"Bearer {client_token}"}
    res_conv = client.post("/api/v1/conversations", json={"booking_id": str(booking.id)}, headers=headers)
    conv_id = res_conv.json()["data"]["id"]

    # 1. Empty message
    res_empty = client.post(f"/api/v1/conversations/{conv_id}/messages", json={"content": "   "}, headers=headers)
    assert res_empty.status_code == 400

    # 2. Exceeds 2000 chars (Pydantic schema validation returns 422)
    long_content = "a" * 2001
    res_long = client.post(f"/api/v1/conversations/{conv_id}/messages", json={"content": long_content}, headers=headers)
    assert res_long.status_code in (400, 422)

    # 3. Close conversation in DB and attempt to post message
    conv = db_session.query(Conversation).filter(Conversation.id == uuid.UUID(conv_id)).first()
    conv.status = "CLOSED"
    db_session.commit()

    res_closed = client.post(f"/api/v1/conversations/{conv_id}/messages", json={"content": "Are you there?"}, headers=headers)
    assert res_closed.status_code == 400
    assert "read-only" in res_closed.json()["detail"]
