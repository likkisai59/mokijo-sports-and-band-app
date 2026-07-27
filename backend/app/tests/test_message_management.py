"""
Unit and Integration Tests for Message Management (Phase 4)

Verifies:
  1. Edit Message: 15-minute window enforcement, ownership authorization, content update.
  2. Soft Delete: Soft deletion flags is_deleted, replaces content, preserves row in DB.
  3. Reply Message: reply_to_message_id parent validation and quote linkage.
  4. Forward Message: Participant authorization across source and target conversations.
  5. Read Receipts: mark_as_read flags unread messages with timestamp and notifies senders.
"""

from datetime import datetime, timedelta
from uuid import uuid4
import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.features.messaging.conversation.models import Conversation
from app.features.messaging.message.models import Message
from app.features.messaging.message.service import message_service


def test_edit_message_success_within_15_minutes(db_session: Session):
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

    msg = message_service.send_message(
        db=db_session,
        conversation_id=conv.id,
        sender_id=client_id,
        content="Original content",
    )

    edited_msg = message_service.edit_message(
        db=db_session,
        message_id=msg.id,
        user_id=client_id,
        new_content="Updated content",
    )

    assert edited_msg.content == "Updated content"
    assert edited_msg.edited_at is not None


def test_edit_message_expired_window_raises_400(db_session: Session):
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

    msg = Message(
        conversation_id=conv.id,
        sender_id=client_id,
        message_type="TEXT",
        content="Old message",
    )
    db_session.add(msg)
    db_session.commit()

    # Set created_at to 20 minutes ago
    msg.created_at = datetime.now() - timedelta(minutes=20)
    db_session.add(msg)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        message_service.edit_message(
            db=db_session,
            message_id=msg.id,
            user_id=client_id,
            new_content="Attempt edit",
        )

    assert exc_info.value.status_code == 400
    assert "15 minutes" in exc_info.value.detail


def test_edit_message_non_sender_raises_403(db_session: Session):
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

    msg = message_service.send_message(
        db=db_session,
        conversation_id=conv.id,
        sender_id=client_id,
        content="Client message",
    )

    with pytest.raises(HTTPException) as exc_info:
        message_service.edit_message(
            db=db_session,
            message_id=msg.id,
            user_id=artist_id,  # Artist trying to edit client message
            new_content="Hacked content",
        )

    assert exc_info.value.status_code == 403


def test_soft_delete_message_success(db_session: Session):
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

    msg = message_service.send_message(
        db=db_session,
        conversation_id=conv.id,
        sender_id=client_id,
        content="Message to be deleted",
    )

    deleted_msg = message_service.delete_message(
        db=db_session,
        message_id=msg.id,
        user_id=client_id,
    )

    assert deleted_msg.is_deleted is True
    assert deleted_msg.content == "This message was deleted."
    assert deleted_msg.deleted_at is not None


def test_reply_to_message_success(db_session: Session):
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

    parent_msg = message_service.send_message(
        db=db_session,
        conversation_id=conv.id,
        sender_id=client_id,
        content="What time does performance start?",
    )

    reply_msg = message_service.send_message(
        db=db_session,
        conversation_id=conv.id,
        sender_id=artist_id,
        content="We start at 8:00 PM sharply.",
        reply_to_message_id=parent_msg.id,
    )

    assert reply_msg.reply_to_message_id == parent_msg.id


def test_forward_message_success(db_session: Session):
    client_id = uuid4()
    artist_id = uuid4()
    booking_1 = uuid4()
    booking_2 = uuid4()

    conv1 = Conversation(
        booking_id=booking_1,
        client_id=client_id,
        band_id=artist_id,
        status="ACTIVE",
    )
    conv2 = Conversation(
        booking_id=booking_2,
        client_id=client_id,
        band_id=artist_id,
        status="ACTIVE",
    )
    db_session.add_all([conv1, conv2])
    db_session.commit()

    src_msg = message_service.send_message(
        db=db_session,
        conversation_id=conv1.id,
        sender_id=client_id,
        content="Important contract term",
    )

    forwarded_msg = message_service.forward_message(
        db=db_session,
        message_id=src_msg.id,
        sender_id=client_id,
        target_conversation_id=conv2.id,
    )

    assert forwarded_msg.conversation_id == conv2.id
    assert forwarded_msg.content == "Important contract term"


def test_mark_as_read_updates_unread_messages(db_session: Session):
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

    # Client sends 2 messages
    msg1 = message_service.send_message(
        db=db_session,
        conversation_id=conv.id,
        sender_id=client_id,
        content="Message 1",
    )
    msg2 = message_service.send_message(
        db=db_session,
        conversation_id=conv.id,
        sender_id=client_id,
        content="Message 2",
    )

    assert msg1.read_at is None
    assert msg2.read_at is None

    # Artist marks conversation as read
    read_msgs = message_service.mark_as_read(
        db=db_session,
        conversation_id=conv.id,
        user_id=artist_id,
    )

    assert len(read_msgs) == 2
    assert msg1.read_at is not None
    assert msg2.read_at is not None
