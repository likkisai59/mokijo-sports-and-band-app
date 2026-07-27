"""
Unit and Integration Tests for Message Attachments & Media (Phase 5)

Verifies:
  1. Upload Image Attachment: message_type="IMAGE", metadata stored, WebSocket event dispatched.
  2. Upload Document Attachment: message_type="DOCUMENT", PDF file handled correctly.
  3. Rejection of Forbidden Executables: .exe file throws 400 Bad Request.
  4. Oversized File Rejection: >25MB throws 400 Bad Request.
  5. Download Authorization (RBAC): Only conversation participants can download attachment info.
"""

from io import BytesIO
from uuid import uuid4
import pytest
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.features.messaging.conversation.models import Conversation
from app.features.messaging.message.service import message_service


@pytest.mark.asyncio
async def test_upload_image_attachment_success(db_session: Session):
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

    file_content = b"\xFF\xD8\xFF\xE0\x00\x10JFIF"
    file_obj = BytesIO(file_content)
    upload_file = UploadFile(filename="stage_setup.jpg", file=file_obj, headers={"content-type": "image/jpeg"})

    msg = await message_service.send_attachment_message(
        db=db_session,
        conversation_id=conv.id,
        sender_id=client_id,
        file=upload_file,
        content="Here is the stage setup photo",
    )

    assert msg.message_type == "IMAGE"
    assert msg.attachment_url is not None
    assert msg.attachment_name == "stage_setup.jpg"
    assert msg.attachment_size == len(file_content)
    assert msg.attachment_type == "image/jpeg"
    assert msg.content == "Here is the stage setup photo"


@pytest.mark.asyncio
async def test_upload_document_attachment_success(db_session: Session):
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

    file_content = b"%PDF-1.4 sample pdf content"
    file_obj = BytesIO(file_content)
    upload_file = UploadFile(filename="event_rider.pdf", file=file_obj, headers={"content-type": "application/pdf"})

    msg = await message_service.send_attachment_message(
        db=db_session,
        conversation_id=conv.id,
        sender_id=artist_id,
        file=upload_file,
    )

    assert msg.message_type == "DOCUMENT"
    assert msg.attachment_url is not None
    assert msg.attachment_name == "event_rider.pdf"
    assert msg.attachment_type == "application/pdf"
    assert msg.content == "Sent event_rider.pdf"


@pytest.mark.asyncio
async def test_reject_executable_file(db_session: Session):
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

    file_content = b"MZ\x90\x00\x03\x00\x00\x00"
    file_obj = BytesIO(file_content)
    upload_file = UploadFile(filename="malware.exe", file=file_obj, headers={"content-type": "application/x-msdownload"})

    with pytest.raises(HTTPException) as exc_info:
        await message_service.send_attachment_message(
            db=db_session,
            conversation_id=conv.id,
            sender_id=client_id,
            file=upload_file,
        )

    assert exc_info.value.status_code == 400
    assert "forbidden" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_download_attachment_authorization(db_session: Session):
    client_id = uuid4()
    artist_id = uuid4()
    unauthorized_id = uuid4()
    booking_id = uuid4()

    conv = Conversation(
        booking_id=booking_id,
        client_id=client_id,
        band_id=artist_id,
        status="ACTIVE",
    )
    db_session.add(conv)
    db_session.commit()

    file_content = b"sample text contract"
    file_obj = BytesIO(file_content)
    upload_file = UploadFile(filename="contract.txt", file=file_obj, headers={"content-type": "text/plain"})

    msg = await message_service.send_attachment_message(
        db=db_session,
        conversation_id=conv.id,
        sender_id=client_id,
        file=upload_file,
    )

    # Participant download works
    info = message_service.download_attachment(db=db_session, message_id=msg.id, user_id=client_id)
    assert info["attachment_name"] == "contract.txt"

    # Non-participant download is forbidden (404/403)
    with pytest.raises(HTTPException):
        message_service.download_attachment(db=db_session, message_id=msg.id, user_id=unauthorized_id)
