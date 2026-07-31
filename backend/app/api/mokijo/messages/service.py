from fastapi import APIRouter, Depends, Request, HTTPException, status
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models import schemas
from app.auth.authorization import check_user_authorization
from app.logger import logger
from app.api.mokijo.messages import crud

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

async def send_message(request: Request, db: Session, message: schemas.MessageCreate, current_user: dict):
    try:
        with logger.time_operation("SEND_MESSAGE", request=request):
            if message.group_id:
                group = crud.get_group_by_id(db, message.group_id)
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
            msg_id = crud.create_message(db, insert_data)
            new_msg = crud.get_message_by_id(db, msg_id)
            return serialize_message(new_msg)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to send message: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_group_messages(request: Request, db: Session, group_id: int, channel: Optional[str], current_user: dict):
    try:
        with logger.time_operation("GET_GROUP_MESSAGES", request=request):
            group = crud.get_group_by_id(db, group_id)
            if not group:
                raise HTTPException(status_code=404, detail="Group not found.")

            messages = crud.get_messages_by_group(db, group_id, channel)
            return [serialize_message(m) for m in messages]
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get group messages: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_direct_messages(
    request: Request,
    db: Session,
    recipient_id: int,
    recipient_type: str,
    sender_id: int,
    sender_type: str,
    current_user: dict
):
    try:
        with logger.time_operation("GET_DIRECT_MESSAGES", request=request):
            messages = crud.get_direct_messages_between(db, recipient_id, recipient_type, sender_id, sender_type)
            return [serialize_message(m) for m in messages]
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get direct messages: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_chat_partners(request: Request, db: Session, club_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_CHAT_PARTNERS", request=request):
            partners = []
            
            admins = crud.get_admin_user(db, club_id)
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
                
            members = crud.get_members_by_group_owner(db, club_id)
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
