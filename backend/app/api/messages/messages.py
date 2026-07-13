from fastapi import APIRouter, Depends, Request, HTTPException, status
from typing import List, Optional
from datetime import datetime

from app.models import schemas
from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization
from app.logger import logger


def serialize_message(msg):
    if not msg:
        return None
    created = msg.get("created_at")
    return {
        "id": msg.get("id"),
        "sender_id": msg.get("sender_id"),
        "sender_type": msg.get("sender_type"),
        "sender_name": msg.get("sender_name"),
        "group_id": msg.get("group_id"),
        "channel": msg.get("channel"),
        "recipient_id": msg.get("recipient_id"),
        "recipient_type": msg.get("recipient_type"),
        "content": msg.get("content"),
        "created_at": created.isoformat() if isinstance(created, datetime) else created
    }


class MessagesRouting(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        
        self.router.add_api_route(
            path="/messages",
            endpoint=self.send_message,
            methods=["POST"],
            response_model=schemas.MessageResponse,
            summary="Send a new message to a group/team chat or as a direct message (DM).",
            tags=["Messages"]
        )
        self.router.add_api_route(
            path="/messages/group/{group_id}",
            endpoint=self.get_group_messages,
            methods=["GET"],
            response_model=List[schemas.MessageResponse],
            summary="Retrieve chat history transcripts for a group/team chat channel.",
            tags=["Messages"]
        )
        self.router.add_api_route(
            path="/messages/dm/{recipient_id}",
            endpoint=self.get_direct_messages,
            methods=["GET"],
            response_model=List[schemas.MessageResponse],
            summary="Retrieve 1-on-1 chat history between two participants.",
            tags=["Messages"]
        )
        self.router.add_api_route(
            path="/messages/partners",
            endpoint=self.get_chat_partners,
            methods=["GET"],
            summary="Retrieve potential chat partners (admins and members) for a club.",
            tags=["Messages"]
        )

    async def send_message(self, request: Request, message: schemas.MessageCreate, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Send message router start", step="ROUTER_START", user_info=current_user)
        logic = MessagesLogic()
        return await logic.send_message(request, message, current_user)

    async def get_group_messages(
        self,
        request: Request,
        group_id: int,
        channel: Optional[str] = "general",
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get group messages router start", step="ROUTER_START", user_info=current_user)
        logic = MessagesLogic()
        return await logic.get_group_messages(request, group_id, channel, current_user)

    async def get_direct_messages(
        self,
        request: Request,
        recipient_id: int,
        recipient_type: str,
        sender_id: int,
        sender_type: str,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get direct messages router start", step="ROUTER_START", user_info=current_user)
        logic = MessagesLogic()
        return await logic.get_direct_messages(request, recipient_id, recipient_type, sender_id, sender_type, current_user)

    async def get_chat_partners(self, request: Request, club_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Get chat partners router start", step="ROUTER_START", user_info=current_user)
        logic = MessagesLogic()
        return await logic.get_chat_partners(request, club_id, current_user)


class MessagesLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        logger.log_message_sync(message="MessagesLogic instance created")

    async def send_message(self, request: Request, message: schemas.MessageCreate, current_user: dict):
        try:
            with logger.time_operation("SEND_MESSAGE", request=request):
                db = self.db_driver
                if message.group_id:
                    group = db.fetch_one("SELECT id FROM groups WHERE id = %s LIMIT 1", (message.group_id,))
                    if not group:
                        raise HTTPException(status_code=404, detail="Group not found.")

                insert_data = {
                    "sender_id": message.sender_id,
                    "sender_type": message.sender_type,
                    "sender_name": message.sender_name.strip(),
                    "group_id": message.group_id,
                    "channel": message.channel,
                    "recipient_id": message.recipient_id,
                    "recipient_type": message.recipient_type,
                    "content": message.content.strip()
                }
                msg_id = db.insert("messages", insert_data)
                new_msg = db.fetch_one("SELECT * FROM messages WHERE id = %s", (msg_id,))
                return serialize_message(new_msg)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to send message: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_group_messages(self, request: Request, group_id: int, channel: Optional[str], current_user: dict):
        try:
            with logger.time_operation("GET_GROUP_MESSAGES", request=request):
                db = self.db_driver
                group = db.fetch_one("SELECT id FROM groups WHERE id = %s LIMIT 1", (group_id,))
                if not group:
                    raise HTTPException(status_code=404, detail="Group not found.")

                query = "SELECT * FROM messages WHERE group_id = %s"
                params = [group_id]
                if channel:
                    query += " AND channel = %s"
                    params.append(channel)
                query += " ORDER BY created_at ASC"
                messages = db.fetch_all(query, tuple(params))
                return [serialize_message(m) for m in messages]
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get group messages: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_direct_messages(
        self,
        request: Request,
        recipient_id: int,
        recipient_type: str,
        sender_id: int,
        sender_type: str,
        current_user: dict
    ):
        try:
            with logger.time_operation("GET_DIRECT_MESSAGES", request=request):
                db = self.db_driver
                query = (
                    "SELECT * FROM messages WHERE "
                    "((sender_id = %s AND sender_type = %s AND recipient_id = %s AND recipient_type = %s) OR "
                    "(sender_id = %s AND sender_type = %s AND recipient_id = %s AND recipient_type = %s)) "
                    "ORDER BY created_at ASC"
                )
                params = [
                    sender_id, sender_type, recipient_id, recipient_type,
                    recipient_id, recipient_type, sender_id, sender_type
                ]
                messages = db.fetch_all(query, tuple(params))
                return [serialize_message(m) for m in messages]
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get direct messages: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_chat_partners(self, request: Request, club_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_CHAT_PARTNERS", request=request):
                db = self.db_driver
                partners = []
                
                admins = db.fetch_all("SELECT * FROM users WHERE id = %s", (club_id,))
                for admin in admins:
                    name = f"{admin.get('first_name')} {admin.get('last_name')}".strip()
                    if admin.get("club_name"):
                        name += f" ({admin.get('club_name')})"
                    partners.append({
                        "id": admin.get("id"),
                        "name": name or admin.get("email"),
                        "email": admin.get("email"),
                        "type": "admin"
                    })
                    
                members = db.fetch_all(
                    "SELECT m.* FROM members m JOIN groups g ON m.group_id = g.id WHERE g.owner_id = %s",
                    (club_id,)
                )
                for member in members:
                    partners.append({
                        "id": member.get("id"),
                        "name": f"{member.get('first_name')} {member.get('last_name')}".strip(),
                        "email": member.get("email"),
                        "type": "member"
                    })
                    
                return partners
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get chat partners: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
