from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.common.schemas.base import SuccessResponse
from app.features.messaging.conversation.service import conversation_service
from app.features.messaging.conversation.schemas import (
    ConversationCreate,
    ConversationResponse,
)
from app.features.messaging.message.router import router as message_router

router = APIRouter()

@router.post("", response_model=SuccessResponse[ConversationResponse], status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user_claims: dict = Depends(get_current_user),
):
    current_user_id = UUID(current_user_claims["sub"])
    conversation = conversation_service.create_conversation(db, payload.booking_id, current_user_id)
    
    resp = ConversationResponse.model_validate(conversation)
    if conversation.booking:
        resp.event_name = conversation.booking.event_name
        
    return SuccessResponse(data=resp)

@router.get("", response_model=SuccessResponse[list[ConversationResponse]])
def list_conversations(
    db: Session = Depends(get_db),
    current_user_claims: dict = Depends(get_current_user),
):
    current_user_id = UUID(current_user_claims["sub"])
    conversations = conversation_service.list_user_conversations(db, current_user_id)
    data = []
    for c in conversations:
        item = ConversationResponse.model_validate(c)
        if c.booking:
            item.event_name = c.booking.event_name
        data.append(item)
    return SuccessResponse(data=data)

@router.get("/{conversation_id}", response_model=SuccessResponse[ConversationResponse])
def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user_claims: dict = Depends(get_current_user),
):
    current_user_id = UUID(current_user_claims["sub"])
    conversation = conversation_service.get_conversation(db, conversation_id, current_user_id)
    resp = ConversationResponse.model_validate(conversation)
    if conversation.booking:
        resp.event_name = conversation.booking.event_name
    return SuccessResponse(data=resp)

# Include nested message sub-router under /{conversation_id}/messages
router.include_router(message_router, prefix="/{conversation_id}/messages", tags=["Messages"])
