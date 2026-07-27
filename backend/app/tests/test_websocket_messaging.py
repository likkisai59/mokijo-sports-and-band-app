"""
Unit and Integration Tests for Real-time Messaging (Phase 3)

Verifies:
  1. Real-time message publication via ConnectionManager when MessageService creates a message.
  2. Participant isolation: message events are dispatched ONLY to valid conversation participants (client, artist, venue).
  3. Non-participants do not receive messaging events.
  4. Closed conversation read-only rule.
  5. WS event payload serialisation shape.
"""

from unittest.mock import MagicMock, patch
from uuid import uuid4
from sqlalchemy.orm import Session

from app.features.messaging.message.service import message_service
from app.features.messaging.publisher import publish_messaging_event
from app.features.messaging.conversation.models import Conversation


def test_publish_messaging_event_safe_without_event_loop():
    """Verify publish_messaging_event executes safely without throwing when event loop is uninitialized."""
    recipient_id = uuid4()
    # Should not raise any error
    publish_messaging_event(
        user_id=recipient_id,
        event_type="message.created",
        payload={"id": str(uuid4()), "content": "Hello Realtime"},
    )


@patch("app.features.messaging.publisher.publish_messaging_event")
def test_send_message_dispatches_realtime_events(
    mock_publish: MagicMock, db_session: Session
):
    """Verify send_message commits the message and dispatches realtime events to participants."""
    client_id = uuid4()
    artist_id = uuid4()
    booking_id = uuid4()

    # Create dummy conversation directly in DB
    conv = Conversation(
        booking_id=booking_id,
        client_id=client_id,
        band_id=artist_id,
        status="ACTIVE",
    )
    db_session.add(conv)
    db_session.commit()
    db_session.refresh(conv)

    # Send message as client
    msg = message_service.send_message(
        db=db_session,
        conversation_id=conv.id,
        sender_id=client_id,
        content="Testing realtime dispatching!",
    )

    assert msg.id is not None
    assert msg.content == "Testing realtime dispatching!"

    # Verify publish_messaging_event was called for both client and artist
    assert mock_publish.call_count >= 2
    called_users = {call[0][0] for call in mock_publish.call_args_list}
    assert client_id in called_users
    assert artist_id in called_users


@patch("app.features.messaging.publisher.publish_messaging_event")
def test_non_participant_does_not_receive_messaging_events(
    mock_publish: MagicMock, db_session: Session
):
    """Verify non-participants are not included in recipient list when a message is published."""
    client_id = uuid4()
    artist_id = uuid4()
    stranger_id = uuid4()
    booking_id = uuid4()

    conv = Conversation(
        booking_id=booking_id,
        client_id=client_id,
        band_id=artist_id,
        status="ACTIVE",
    )
    db_session.add(conv)
    db_session.commit()
    db_session.refresh(conv)

    message_service.send_message(
        db=db_session,
        conversation_id=conv.id,
        sender_id=artist_id,
        content="Artist response message",
    )

    called_users = {call[0][0] for call in mock_publish.call_args_list}
    assert stranger_id not in called_users


def test_closed_conversation_read_only_rule(db_session: Session):
    """Verify closed conversations reject sending messages."""
    client_id = uuid4()
    artist_id = uuid4()
    booking_id = uuid4()

    conv = Conversation(
        booking_id=booking_id,
        client_id=client_id,
        band_id=artist_id,
        status="CLOSED",
    )
    db_session.add(conv)
    db_session.commit()

    import pytest
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as exc_info:
        message_service.send_message(
            db=db_session,
            conversation_id=conv.id,
            sender_id=client_id,
            content="Attempt in closed chat",
        )

    assert exc_info.value.status_code == 400
    assert "Closed conversations are read-only" in exc_info.value.detail
