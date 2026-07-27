from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.features.messaging.message.models import Message

class MessageRepository:
    def get_by_id(self, db: Session, message_id: UUID) -> Optional[Message]:
        return db.query(Message).filter(Message.id == message_id).first()

    def list_by_conversation_id(
        self,
        db: Session,
        conversation_id: UUID,
        page: int = 1,
        limit: int = 50
    ) -> List[Message]:
        offset = (page - 1) * limit
        return (
            db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def count_by_conversation_id(self, db: Session, conversation_id: UUID) -> int:
        return (
            db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .count()
        )

    def create(self, db: Session, obj_in: Message) -> Message:
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

    def save(self, db: Session, obj_in: Message) -> Message:
        db.add(obj_in)
        db.commit()
        db.refresh(obj_in)
        return obj_in

message_repository = MessageRepository()
