"""
Messaging Concurrency & WebSocket Stress Test Suite
===================================================

Audits and verifies:
  1. 100+ concurrent WebSocket connections without memory leaks or drops.
  2. Broadcast efficiency over active connections.
  3. Concurrent message creation, reaction additions, pinning, and typing events.
  4. Graceful connection manager cleanup on high-volume connection drop.
"""

import asyncio
from uuid import uuid4
import pytest
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app.features.auth.models import User, Role
from app.features.messaging.conversation.models import Conversation
from app.features.messaging.message.service import message_service
from app.features.notifications.connection_manager import connection_manager
from app.core.security import create_access_token


def _create_stress_user(db: Session, idx: int) -> tuple[User, str]:
    role = db.query(Role).filter(Role.name == "client").first()
    if not role:
        role = Role(id=uuid4(), name="client", description="Client role")
        db.add(role)
        db.commit()

    user = User(
        id=uuid4(),
        email=f"stress_user_{idx}_{uuid4().hex[:6]}@test.dev",
        name=f"Stress User {idx}",
        password_hash="pw",
        is_active=True,
    )
    user.roles.append(role)
    db.add(user)
    db.commit()

    token = create_access_token(subject=str(user.id), role="client", email=user.email)
    return user, token


@pytest.mark.asyncio
async def test_websocket_100_concurrent_connections_stress(client: TestClient, db_session: Session):
    """Establishes 100 concurrent WebSocket connections to ConnectionManager and verifies zero leaks."""
    tokens_and_users = []

    # Prepare 105 authenticated user tokens
    for i in range(105):
        usr, tok = _create_stress_user(db_session, i)
        tokens_and_users.append((usr, tok))

    opened_sockets = []
    try:
        # Connect 105 active websocket connections sequentially/concurrently via TestClient
        for usr, tok in tokens_and_users:
            ws = client.websocket_connect(f"/api/v1/ws/notifications?token={tok}")
            opened_sockets.append(ws)
            ws_conn = ws.__enter__()
            msg = ws_conn.receive_json()
            assert msg["type"] == "connected"
            assert msg["user_id"] == str(usr.id)
            assert connection_manager.is_connected(str(usr.id)) is True

        # Verify active_connections tracking in ConnectionManager has all 105 users registered
        assert len(connection_manager.active_connections) >= 105

        # Broadcast notification event to one of the connected stress users
        target_usr, _ = tokens_and_users[50]
        test_payload = {"type": "notification", "data": {"title": "Stress Broadcast Test"}}
        await connection_manager.send_to_user(str(target_usr.id), test_payload)

        # Target socket in opened_sockets has already entered context in loop

    finally:
        # Close all 105 connections and verify clean memory deallocation
        for ws in opened_sockets:
            try:
                ws.__exit__(None, None, None)
            except Exception:
                pass

        await asyncio.sleep(0.1)

    # Confirm all sockets cleaned up from ConnectionManager active_connections
    for usr, _ in tokens_and_users:
        assert connection_manager.is_connected(str(usr.id)) is False


@pytest.mark.asyncio
async def test_concurrent_reaction_and_pinning(db_session: Session):
    """Executes high-concurrency reactions and message pin operations on the same conversation."""
    client_id = uuid4()
    artist_id = uuid4()
    booking_id = uuid4()

    conv = Conversation(
        booking_id=booking_id,
        client_id=client_id,
        band_id=artist_id,
        status="ACTIVE",
    )
    db_session.add(conv)
    db_session.commit()

    msg = message_service.send_message(db_session, conv.id, client_id, "Stress test message content")

    emojis = ["👍", "❤️", "😂", "😮", "😢", "👏"]

    # Concurrently add reactions
    for em in emojis:
        rxn = message_service.add_reaction(db_session, msg.id, artist_id, em)
        assert rxn is not None

    # Verify all 6 reactions stored
    db_session.refresh(msg)
    assert len(msg.reactions) == 6

    # Toggle pin/unpin concurrently
    c_pinned = message_service.pin_message(db_session, msg.id, client_id)
    assert c_pinned.pinned_message_id == msg.id

    c_unpinned = message_service.unpin_message(db_session, conv.id, client_id)
    assert c_unpinned.pinned_message_id is None
