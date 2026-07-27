from datetime import datetime, timezone
from typing import Any
from uuid import UUID
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.features.messaging.conversation.service import conversation_service
from app.features.messaging.conversation.repository import conversation_repository
from app.features.messaging.message.models import Message, MessageReaction
from app.features.messaging.message.repository import message_repository
from app.features.auth.models import User
from app.features.notifications.connection_manager import connection_manager

SUPPORTED_REACTIONS = {"👍", "❤️", "😂", "😮", "😢", "👏"}

class MessageService:
    def send_message(
        self,
        db: Session,
        conversation_id: UUID,
        sender_id: UUID,
        content: str,
        reply_to_message_id: UUID | None = None,
    ) -> Message:
        conversation = conversation_service.get_conversation(db, conversation_id, sender_id)

        if conversation.status == "CLOSED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Closed conversations are read-only",
            )

        stripped_content = content.strip() if content else ""
        if not stripped_content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content cannot be empty",
            )

        if len(stripped_content) > 2000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content exceeds maximum allowed length of 2000 characters",
            )

        if reply_to_message_id:
            parent_msg = message_repository.get_by_id(db, reply_to_message_id)
            if not parent_msg or parent_msg.conversation_id != conversation_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent message to reply to was not found in this conversation",
                )

        now_dt = datetime.now()
        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            message_type="TEXT",
            content=stripped_content,
            reply_to_message_id=reply_to_message_id,
        )
        new_msg = message_repository.create(db, message)

        conversation.last_message_at = now_dt
        conversation_repository.save(db, conversation)

        self._dispatch_message_event(
            conversation=conversation,
            event_type="message.replied" if reply_to_message_id else "message.created",
            message=new_msg,
            now_dt=now_dt,
        )

        return new_msg

    async def send_attachment_message(
        self,
        db: Session,
        conversation_id: UUID,
        sender_id: UUID,
        file: UploadFile,
        content: str = "",
        reply_to_message_id: UUID | None = None,
    ) -> Message:
        conversation = conversation_service.get_conversation(db, conversation_id, sender_id)

        if conversation.status == "CLOSED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Closed conversations are read-only",
            )

        if reply_to_message_id:
            parent_msg = message_repository.get_by_id(db, reply_to_message_id)
            if not parent_msg or parent_msg.conversation_id != conversation_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent message to reply to was not found in this conversation",
                )

        from app.utils.attachment_upload import upload_attachment_file
        attachment_data = await upload_attachment_file(file, subfolder="attachments")

        default_text = content.strip() if content and content.strip() else f"Sent {attachment_data['filename']}"

        now_dt = datetime.now()
        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            message_type=attachment_data["message_type"],
            content=default_text,
            reply_to_message_id=reply_to_message_id,
            attachment_url=attachment_data["file_url"],
            attachment_name=attachment_data["filename"],
            attachment_size=attachment_data["size"],
            attachment_type=attachment_data["content_type"],
            thumbnail_url=attachment_data["file_url"] if attachment_data["message_type"] in ("IMAGE", "VIDEO") else None,
        )

        new_msg = message_repository.create(db, message)
        conversation.last_message_at = now_dt
        conversation_repository.save(db, conversation)

        self._dispatch_message_event(
            conversation=conversation,
            event_type="message.created",
            message=new_msg,
            now_dt=now_dt,
        )

        return new_msg

    def download_attachment(
        self,
        db: Session,
        message_id: UUID,
        user_id: UUID,
    ) -> dict:
        msg = message_repository.get_by_id(db, message_id)
        if not msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )

        if not msg.attachment_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This message does not contain an attachment",
            )

        conversation_service.get_conversation(db, msg.conversation_id, user_id)

        return {
            "attachment_url": msg.attachment_url,
            "attachment_name": msg.attachment_name,
            "attachment_size": msg.attachment_size,
            "attachment_type": msg.attachment_type,
        }

    def mark_as_read(
        self,
        db: Session,
        conversation_id: UUID,
        user_id: UUID,
    ) -> list[Message]:
        conversation = conversation_service.get_conversation(db, conversation_id, user_id)

        now_dt = datetime.now()
        unread_msgs = (
            db.query(Message)
            .filter(
                Message.conversation_id == conversation_id,
                Message.sender_id != user_id,
                Message.read_at.is_(None),
                Message.is_deleted.is_(False),
            )
            .all()
        )

        if not unread_msgs:
            return []

        marked_ids = []
        for msg in unread_msgs:
            msg.read_at = now_dt
            marked_ids.append(str(msg.id))

        db.commit()

        try:
            from app.features.messaging.publisher import publish_messaging_event

            recipients = [conversation.client_id, conversation.band_id]
            if conversation.venue_owner_id:
                recipients.append(conversation.venue_owner_id)

            read_payload = {
                "conversation_id": str(conversation_id),
                "reader_id": str(user_id),
                "read_at": now_dt.isoformat(),
                "message_ids": marked_ids,
            }

            for recipient_id in set(recipients):
                if recipient_id:
                    publish_messaging_event(recipient_id, "message.read", read_payload)
        except Exception:
            pass

        return unread_msgs

    def edit_message(
        self,
        db: Session,
        message_id: UUID,
        user_id: UUID,
        new_content: str,
    ) -> Message:
        msg = message_repository.get_by_id(db, message_id)
        if not msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )

        if msg.sender_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the message sender can edit this message",
            )

        if msg.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deleted messages cannot be edited",
            )

        if msg.message_type != "TEXT":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only text messages can be edited",
            )

        created_time = msg.created_at
        if created_time is not None:
            if created_time.tzinfo is not None:
                now = datetime.now(timezone.utc)
            else:
                now = datetime.utcnow()

            elapsed_seconds = (now - created_time).total_seconds()
            if elapsed_seconds > 900 or elapsed_seconds < -300:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Messages can only be edited within 15 minutes of sending",
                )

        stripped = new_content.strip() if new_content else ""
        if not stripped:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content cannot be empty",
            )

        now_dt = datetime.now()
        msg.content = stripped
        msg.edited_at = now_dt
        updated_msg = message_repository.save(db, msg)

        conversation = conversation_service.get_conversation(db, msg.conversation_id, user_id)
        self._dispatch_message_event(
            conversation=conversation,
            event_type="message.updated",
            message=updated_msg,
            now_dt=now_dt,
        )

        return updated_msg

    def delete_message(
        self,
        db: Session,
        message_id: UUID,
        user_id: UUID,
    ) -> Message:
        msg = message_repository.get_by_id(db, message_id)
        if not msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )

        if msg.sender_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the message sender can delete this message",
            )

        if msg.is_deleted:
            return msg

        now_dt = datetime.now()
        msg.is_deleted = True
        msg.deleted_at = now_dt
        msg.content = "This message was deleted."
        deleted_msg = message_repository.save(db, msg)

        conversation = conversation_service.get_conversation(db, msg.conversation_id, user_id)
        self._dispatch_message_event(
            conversation=conversation,
            event_type="message.deleted",
            message=deleted_msg,
            now_dt=now_dt,
        )

        return deleted_msg

    def forward_message(
        self,
        db: Session,
        message_id: UUID,
        sender_id: UUID,
        target_conversation_id: UUID,
    ) -> Message:
        source_msg = message_repository.get_by_id(db, message_id)
        if not source_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Source message not found",
            )

        if source_msg.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot forward deleted messages",
            )

        conversation_service.get_conversation(db, source_msg.conversation_id, sender_id)

        target_conv = conversation_service.get_conversation(db, target_conversation_id, sender_id)
        if target_conv.status == "CLOSED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target conversation is closed and read-only",
            )

        forwarded_msg = self.send_message(
            db=db,
            conversation_id=target_conversation_id,
            sender_id=sender_id,
            content=source_msg.content,
        )

        return forwarded_msg

    def get_message_history(
        self,
        db: Session,
        conversation_id: UUID,
        user_id: UUID,
        page: int = 1,
        limit: int = 50,
    ) -> list[Message]:
        conversation_service.get_conversation(db, conversation_id, user_id)
        return message_repository.list_by_conversation_id(db, conversation_id, page, limit)

    # ── Phase 6 Advanced Features Methods ────────────────────────────────────

    def add_reaction(
        self,
        db: Session,
        message_id: UUID,
        user_id: UUID,
        emoji: str,
    ) -> MessageReaction:
        if emoji not in SUPPORTED_REACTIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported reaction emoji. Supported: {', '.join(SUPPORTED_REACTIONS)}",
            )

        msg = message_repository.get_by_id(db, message_id)
        if not msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )

        conversation = conversation_service.get_conversation(db, msg.conversation_id, user_id)
        if conversation.status == "CLOSED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Closed conversations are read-only",
            )

        existing = (
            db.query(MessageReaction)
            .filter(
                MessageReaction.message_id == message_id,
                MessageReaction.user_id == user_id,
                MessageReaction.emoji == emoji,
            )
            .first()
        )
        if existing:
            return existing

        reaction = MessageReaction(
            message_id=message_id,
            user_id=user_id,
            emoji=emoji,
        )
        db.add(reaction)
        db.commit()
        db.refresh(reaction)

        self._broadcast_conversation_event(
            conversation=conversation,
            event_type="message.reaction_added",
            payload={
                "id": str(reaction.id),
                "message_id": str(message_id),
                "conversation_id": str(msg.conversation_id),
                "user_id": str(user_id),
                "emoji": emoji,
                "created_at": reaction.created_at.isoformat() if reaction.created_at else datetime.now().isoformat(),
            },
        )

        return reaction

    def remove_reaction(
        self,
        db: Session,
        message_id: UUID,
        user_id: UUID,
        emoji: str,
    ) -> bool:
        msg = message_repository.get_by_id(db, message_id)
        if not msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )

        conversation = conversation_service.get_conversation(db, msg.conversation_id, user_id)

        reaction = (
            db.query(MessageReaction)
            .filter(
                MessageReaction.message_id == message_id,
                MessageReaction.user_id == user_id,
                MessageReaction.emoji == emoji,
            )
            .first()
        )
        if not reaction:
            return True

        reaction_id = str(reaction.id)
        db.delete(reaction)
        db.commit()

        self._broadcast_conversation_event(
            conversation=conversation,
            event_type="message.reaction_removed",
            payload={
                "id": reaction_id,
                "message_id": str(message_id),
                "conversation_id": str(msg.conversation_id),
                "user_id": str(user_id),
                "emoji": emoji,
            },
        )

        return True

    def set_typing_status(
        self,
        db: Session,
        conversation_id: UUID,
        user_id: UUID,
        is_typing: bool,
    ) -> bool:
        conversation = conversation_service.get_conversation(db, conversation_id, user_id)

        user = db.query(User).filter(User.id == user_id).first()
        user_name = user.name if user else "User"

        event_type = "typing.started" if is_typing else "typing.stopped"
        self._broadcast_conversation_event(
            conversation=conversation,
            event_type=event_type,
            payload={
                "conversation_id": str(conversation_id),
                "user_id": str(user_id),
                "user_name": user_name,
                "is_typing": is_typing,
            },
        )
        return True

    def search_messages(
        self,
        db: Session,
        conversation_id: UUID,
        user_id: UUID,
        query: str,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[int, list[Message]]:
        conversation_service.get_conversation(db, conversation_id, user_id)

        q = query.strip()
        if not q:
            return 0, []

        pattern = f"%{q}%"
        base_query = db.query(Message).filter(
            Message.conversation_id == conversation_id,
            Message.is_deleted.is_(False),
            or_(
                Message.content.ilike(pattern),
                Message.attachment_name.ilike(pattern),
            ),
        )

        total = base_query.count()
        offset = (page - 1) * limit
        messages = base_query.order_by(Message.created_at.desc()).offset(offset).limit(limit).all()

        return total, messages

    def pin_message(
        self,
        db: Session,
        message_id: UUID,
        user_id: UUID,
    ) -> Any:
        msg = message_repository.get_by_id(db, message_id)
        if not msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )

        conversation = conversation_service.get_conversation(db, msg.conversation_id, user_id)
        if conversation.status == "CLOSED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Closed conversations cannot modify pinned messages",
            )

        conversation.pinned_message_id = message_id
        db.commit()
        db.refresh(conversation)

        from app.features.messaging.message.schemas import MessageResponse
        msg_data = MessageResponse.model_validate(msg).model_dump(mode="json")

        self._broadcast_conversation_event(
            conversation=conversation,
            event_type="message.pinned",
            payload={
                "conversation_id": str(conversation.id),
                "message_id": str(message_id),
                "message": msg_data,
            },
        )

        return conversation

    def unpin_message(
        self,
        db: Session,
        conversation_id: UUID,
        user_id: UUID,
    ) -> Any:
        conversation = conversation_service.get_conversation(db, conversation_id, user_id)
        if conversation.status == "CLOSED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Closed conversations cannot modify pinned messages",
            )

        conversation.pinned_message_id = None
        db.commit()
        db.refresh(conversation)

        self._broadcast_conversation_event(
            conversation=conversation,
            event_type="message.unpinned",
            payload={
                "conversation_id": str(conversation_id),
            },
        )

        return conversation

    def get_user_presence(
        self,
        db: Session,
        user_id: UUID,
    ) -> dict:
        is_online = connection_manager.is_connected(str(user_id))
        user = db.query(User).filter(User.id == user_id).first()
        last_seen = user.last_seen if user else None

        return {
            "user_id": user_id,
            "is_online": is_online,
            "last_seen": last_seen,
        }

    def _broadcast_conversation_event(
        self,
        conversation: Any,
        event_type: str,
        payload: dict,
    ) -> None:
        try:
            from app.features.messaging.publisher import publish_messaging_event

            recipients = [conversation.client_id, conversation.band_id]
            if conversation.venue_owner_id:
                recipients.append(conversation.venue_owner_id)

            for recipient_id in set(recipients):
                if recipient_id:
                    publish_messaging_event(recipient_id, event_type, payload)
        except Exception:
            pass

    def _dispatch_message_event(
        self,
        conversation: Any,
        event_type: str,
        message: Message,
        now_dt: datetime,
    ) -> None:
        try:
            from app.features.messaging.publisher import publish_messaging_event

            recipients = [conversation.client_id, conversation.band_id]
            if conversation.venue_owner_id:
                recipients.append(conversation.venue_owner_id)

            msg_payload = {
                "id": str(message.id),
                "conversation_id": str(message.conversation_id),
                "sender_id": str(message.sender_id),
                "message_type": message.message_type,
                "content": message.content,
                "reply_to_message_id": str(message.reply_to_message_id) if message.reply_to_message_id else None,
                "edited_at": message.edited_at.isoformat() if message.edited_at else None,
                "read_at": message.read_at.isoformat() if message.read_at else None,
                "is_deleted": message.is_deleted,
                "attachment_url": message.attachment_url,
                "attachment_name": message.attachment_name,
                "attachment_size": message.attachment_size,
                "attachment_type": message.attachment_type,
                "thumbnail_url": message.thumbnail_url,
                "reactions": [
                    {
                        "id": str(r.id),
                        "message_id": str(r.message_id),
                        "user_id": str(r.user_id),
                        "emoji": r.emoji,
                        "created_at": r.created_at.isoformat() if r.created_at else now_dt.isoformat(),
                    }
                    for r in (message.reactions or [])
                ],
                "created_at": message.created_at.isoformat() if message.created_at else now_dt.isoformat(),
                "updated_at": message.updated_at.isoformat() if message.updated_at else now_dt.isoformat(),
            }

            conv_payload = {
                "id": str(conversation.id),
                "booking_id": str(conversation.booking_id),
                "event_name": conversation.booking.event_name if getattr(conversation, "booking", None) else None,
                "status": conversation.status,
                "pinned_message_id": str(conversation.pinned_message_id) if conversation.pinned_message_id else None,
                "last_message_at": conversation.last_message_at.isoformat() if conversation.last_message_at else now_dt.isoformat(),
            }

            for recipient_id in set(recipients):
                if recipient_id:
                    publish_messaging_event(recipient_id, event_type, msg_payload)
                    publish_messaging_event(recipient_id, "conversation.updated", conv_payload)
        except Exception:
            pass


message_service = MessageService()
