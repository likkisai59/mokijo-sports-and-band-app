from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.features.messaging.conversation.models import Conversation

class ConversationRepository:
    def get_by_id(self, db: Session, conversation_id: UUID) -> Optional[Conversation]:
        return db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.deleted_at.is_(None)
        ).first()

    def get_by_booking_id(self, db: Session, booking_id: UUID) -> Optional[Conversation]:
        return db.query(Conversation).filter(
            Conversation.booking_id == booking_id,
            Conversation.deleted_at.is_(None)
        ).first()

    def list_by_user_id(self, db: Session, user_id: UUID) -> List[Conversation]:
        return (
            db.query(Conversation)
            .filter(
                ((Conversation.client_id == user_id) |
                 (Conversation.band_id == user_id) |
                 (Conversation.venue_owner_id == user_id)),
                Conversation.deleted_at.is_(None)
            )
            .order_by(Conversation.last_message_at.desc().nulls_last(), Conversation.created_at.desc())
            .all()
        )

    def create(self, db: Session, obj_in: Conversation) -> Conversation:
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

    def save(self, db: Session, conversation: Conversation) -> Conversation:
        db.commit()
        db.refresh(conversation)
        return conversation

conversation_repository = ConversationRepository()
