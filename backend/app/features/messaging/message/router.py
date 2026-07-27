from uuid import UUID
from fastapi import APIRouter, Depends, Query, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.common.schemas.base import SuccessResponse
from app.features.messaging.message.service import message_service
from app.features.messaging.message.schemas import (
    MessageCreate,
    MessageEdit,
    MessageForward,
    MessageResponse,
    ReactionCreate,
    ReactionResponse,
    TypingPayload,
    PresenceResponse,
    MessageSearchResponse,
)

router = APIRouter()

# ── Nested Conversation Message Endpoints (/{conversation_id}/...) ─────────────

@router.post("", response_model=SuccessResponse[MessageResponse], status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: UUID,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user_claims: dict = Depends(get_current_user),
):
    current_user_id = UUID(current_user_claims["sub"])
    message = message_service.send_message(
        db,
        conversation_id,
        current_user_id,
        payload.content,
        payload.reply_to_message_id,
    )
    return SuccessResponse(data=MessageResponse.model_validate(message))

@router.post("/attachment", response_model=SuccessResponse[MessageResponse], status_code=status.HTTP_201_CREATED)
async def send_attachment_message(
    conversation_id: UUID,
    file: UploadFile = File(...),
    content: str = Form(""),
    reply_to_message_id: UUID | None = Form(None),
    db: Session = Depends(get_db),
    current_user_claims: dict = Depends(get_current_user),
):
    current_user_id = UUID(current_user_claims["sub"])
    message = await message_service.send_attachment_message(
        db,
        conversation_id,
        current_user_id,
        file,
        content,
        reply_to_message_id,
    )
    return SuccessResponse(data=MessageResponse.model_validate(message))

@router.get("", response_model=SuccessResponse[list[MessageResponse]])
def get_message_history(
    conversation_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user_claims: dict = Depends(get_current_user),
):
    current_user_id = UUID(current_user_claims["sub"])
    messages = message_service.get_message_history(db, conversation_id, current_user_id, page, limit)
    data = [MessageResponse.model_validate(m) for m in messages]
    return SuccessResponse(data=data)

@router.post("/read", response_model=SuccessResponse[list[MessageResponse]])
def mark_conversation_as_read(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user_claims: dict = Depends(get_current_user),
):
    current_user_id = UUID(current_user_claims["sub"])
    marked_msgs = message_service.mark_as_read(db, conversation_id, current_user_id)
    data = [MessageResponse.model_validate(m) for m in marked_msgs]
    return SuccessResponse(data=data)

@router.post("/typing", response_model=SuccessResponse[bool])
def set_typing_status(
    conversation_id: UUID,
    payload: TypingPayload,
    db: Session = Depends(get_db),
    current_user_claims: dict = Depends(get_current_user),
):
    current_user_id = UUID(current_user_claims["sub"])
    res = message_service.set_typing_status(db, conversation_id, current_user_id, payload.is_typing)
    return SuccessResponse(data=res)

@router.get("/search", response_model=SuccessResponse[MessageSearchResponse])
def search_messages(
    conversation_id: UUID,
    query: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user_claims: dict = Depends(get_current_user),
):
    current_user_id = UUID(current_user_claims["sub"])
    total, msgs = message_service.search_messages(db, conversation_id, current_user_id, query, page, limit)
    messages_data = [MessageResponse.model_validate(m) for m in msgs]
    return SuccessResponse(data=MessageSearchResponse(total=total, page=page, limit=limit, messages=messages_data))

@router.delete("/pin", response_model=SuccessResponse[bool])
def unpin_message(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user_claims: dict = Depends(get_current_user),
):
    current_user_id = UUID(current_user_claims["sub"])
    message_service.unpin_message(db, conversation_id, current_user_id)
    return SuccessResponse(data=True)


