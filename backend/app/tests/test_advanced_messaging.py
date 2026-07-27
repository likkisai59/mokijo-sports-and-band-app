from uuid import uuid4
import pytest
from sqlalchemy.orm import Session

from app.features.messaging.conversation.models import Conversation
from app.features.messaging.message.service import message_service
from app.features.auth.models import User
from app.core.security import get_password_hash
from fastapi import HTTPException, status


@pytest.mark.asyncio
async def test_add_and_remove_reaction(db_session: Session):
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
        content="Great performance schedule!",
    )

    # 1. Add valid reaction
    rxn = message_service.add_reaction(db_session, msg.id, artist_id, "❤️")
    assert rxn is not None
    assert rxn.emoji == "❤️"
    assert rxn.user_id == artist_id

    # 2. Add duplicate reaction (idempotent return)
    rxn_dup = message_service.add_reaction(db_session, msg.id, artist_id, "❤️")
    assert rxn_dup.id == rxn.id

    # 3. Reject unsupported emoji
    with pytest.raises(HTTPException) as exc_info:
        message_service.add_reaction(db_session, msg.id, artist_id, "🚀")
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST

    # 4. Remove reaction
    removed = message_service.remove_reaction(db_session, msg.id, artist_id, "❤️")
    assert removed is True


@pytest.mark.asyncio
async def test_set_typing_status(db_session: Session):
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

    res_started = message_service.set_typing_status(db_session, conv.id, client_id, True)
    assert res_started is True

    res_stopped = message_service.set_typing_status(db_session, conv.id, client_id, False)
    assert res_stopped is True


@pytest.mark.asyncio
async def test_search_messages(db_session: Session):
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

    msg1 = message_service.send_message(db_session, conv.id, client_id, "Need sound check timing for Saturday")
    msg2 = message_service.send_message(db_session, conv.id, artist_id, "We will arrive at 4 PM for setup")
    msg3 = message_service.send_message(db_session, conv.id, client_id, "Perfect, venue sound system is ready")

    # Search for "sound"
    total, results = message_service.search_messages(db_session, conv.id, client_id, "sound")
    assert total == 2
    res_ids = [m.id for m in results]
    assert msg1.id in res_ids
    assert msg3.id in res_ids
    assert msg2.id not in res_ids


@pytest.mark.asyncio
async def test_pin_and_unpin_message(db_session: Session):
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

    msg = message_service.send_message(db_session, conv.id, client_id, "Important contract agreement details")

    # Pin message
    conv_pinned = message_service.pin_message(db_session, msg.id, client_id)
    assert conv_pinned.pinned_message_id == msg.id

    # Unpin message
    conv_unpinned = message_service.unpin_message(db_session, conv.id, client_id)
    assert conv_unpinned.pinned_message_id is None


@pytest.mark.asyncio
async def test_get_user_presence(db_session: Session):
    user_id = uuid4()
    test_user = User(
        id=user_id,
        email=f"presence_{user_id.hex[:6]}@example.com",
        password_hash=get_password_hash("Secret#123"),
        name="Presence User",
        is_active=True,
    )
    db_session.add(test_user)
    db_session.commit()

    presence = message_service.get_user_presence(db_session, user_id)
    assert presence["user_id"] == user_id
    assert presence["is_online"] is False
    assert presence["last_seen"] is None


@pytest.mark.asyncio
async def test_closed_conversation_read_only_rules(db_session: Session):
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

    msg = message_service.send_message(db_session, conv.id, client_id, "Before close message")

    # Close conversation
    conv.status = "CLOSED"
    db_session.commit()

    # Verify sending message fails
    with pytest.raises(HTTPException) as exc_info:
        message_service.send_message(db_session, conv.id, client_id, "New message")
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST

    # Verify adding reaction fails
    with pytest.raises(HTTPException) as exc_info:
        message_service.add_reaction(db_session, msg.id, client_id, "👍")
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST

    # Verify pinning fails
    with pytest.raises(HTTPException) as exc_info:
        message_service.pin_message(db_session, msg.id, client_id)
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
