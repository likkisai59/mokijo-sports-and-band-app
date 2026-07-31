from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Message

def to_dict(obj):
    if not obj:
        return None
    d = dict(obj.__dict__)
    d.pop('_sa_instance_state', None)
    return d

def create_message(db: Session, insert_data: dict) -> int:
    message = Message(**insert_data)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message.id

def get_message_by_id(db: Session, message_id: int):
    return to_dict(db.query(Message).filter(Message.id == message_id).first())

from app.models.models import Group, Message, User, Member
from sqlalchemy import or_, and_, desc

def get_group_by_id(db: Session, group_id: int):
    res = db.query(Group.id).filter(Group.id == group_id).first()
    return {"id": res[0]} if res else None

def get_messages_by_group(db: Session, group_id: int, channel: str = None):
    query = db.query(Message).filter(Message.group_id == group_id)
    if channel:
        query = query.filter(Message.channel == channel)
    return to_dict_list(query.order_by(Message.created_at.asc()).all())

def get_direct_messages_between(db: Session, r_id: int, r_type: str, s_id: int, s_type: str):
    cond1 = and_(Message.sender_id == s_id, Message.sender_type == s_type, Message.recipient_id == r_id, Message.recipient_type == r_type)
    cond2 = and_(Message.sender_id == r_id, Message.sender_type == r_type, Message.recipient_id == s_id, Message.recipient_type == s_type)
    return to_dict_list(db.query(Message).filter(or_(cond1, cond2)).order_by(Message.created_at.asc()).all())

def get_admin_user(db: Session, club_id: int):
    return to_dict_list(db.query(User).filter(User.id == club_id).all())

def get_members_by_group_owner(db: Session, owner_id: int):
    return to_dict_list(db.query(Member).join(Group, Member.group_id == Group.id).filter(Group.owner_id == owner_id).all())
