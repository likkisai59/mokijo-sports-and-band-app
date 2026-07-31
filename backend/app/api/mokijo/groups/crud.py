from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Group, Member, Event

def to_dict(obj):
    if not obj:
        return None
    d = dict(obj.__dict__)
    d.pop('_sa_instance_state', None)
    return d

def to_dict_list(objs):
    return [to_dict(obj) for obj in objs if obj]

# GROUPS
def create_group(db: Session, insert_data: dict) -> int:
    group = Group(**insert_data)
    db.add(group)
    db.commit()
    db.refresh(group)
    return group.id

def get_group_by_id_and_owner(db: Session, group_id: int, owner_id: int):
    return to_dict(db.query(Group).filter(Group.id == group_id, Group.owner_id == owner_id).first())

def get_group_by_name_and_owner(db: Session, group_name: str, owner_id: int):
    return to_dict(db.query(Group).filter(Group.group_name == group_name, Group.owner_id == owner_id).first())

def get_group_by_id(db: Session, group_id: int):
    return to_dict(db.query(Group).filter(Group.id == group_id).first())

def get_groups_by_owner(db: Session, owner_id: int):
    return to_dict_list(db.query(Group).filter(Group.owner_id == owner_id).all())

def delete_group(db: Session, group_id: int):
    group = db.query(Group).filter(Group.id == group_id).first()
    if group:
        db.delete(group)
        db.commit()

# MEMBERS
def create_member(db: Session, insert_data: dict) -> int:
    member = Member(**insert_data)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member.id

def get_member_by_id(db: Session, member_id: int):
    return to_dict(db.query(Member).filter(Member.id == member_id).first())

def get_members_by_group(db: Session, group_id: int):
    return to_dict_list(db.query(Member).filter(Member.group_id == group_id).all())

def get_member_by_email_and_group(db: Session, email: str, group_id: int):
    member = db.query(Member.id).filter(func.lower(Member.email) == email.lower(), Member.group_id == group_id).first()
    return {"id": member.id} if member else None

def get_members_by_owner(db: Session, owner_id: int):
    # Need to return member with group_name
    members = db.query(Member, Group.group_name).join(Group, Member.group_id == Group.id).filter(Group.owner_id == owner_id).all()
    results = []
    for m, g_name in members:
        d = to_dict(m)
        d['group_name'] = g_name
        results.append(d)
    return results

def get_member_by_id_and_owner(db: Session, member_id: int, owner_id: int):
    result = db.query(Member, Group.group_name).join(Group, Member.group_id == Group.id).filter(Member.id == member_id, Group.owner_id == owner_id).first()
    if result:
        m, g_name = result
        d = to_dict(m)
        d['group_name'] = g_name
        return d
    return None

def update_member(db: Session, member_id: int, update_data: dict):
    if not update_data:
        return
    member = db.query(Member).filter(Member.id == member_id).first()
    if member:
        for k, v in update_data.items():
            setattr(member, k, v)
        db.commit()

def delete_member(db: Session, member_id: int):
    member = db.query(Member).filter(Member.id == member_id).first()
    if member:
        db.delete(member)
        db.commit()

# EVENTS (Read-only from Groups)
def get_events_by_group(db: Session, group_id: int):
    return to_dict_list(db.query(Event).filter(Event.group_id == group_id).all())

from sqlalchemy import text
from app.models.models import EventRegistration, Payment, CourseRegistration, Event, Course, Message, MatchTeam

# Cascading operations for Group Deletion
def clean_group_references(db: Session, group_id: int):
    # Member references
    subquery = db.query(Member.id).filter(Member.group_id == group_id).subquery()
    db.query(EventRegistration).filter(EventRegistration.member_id.in_(subquery)).update({"member_id": None}, synchronize_session=False)
    db.query(Payment).filter(Payment.member_id.in_(subquery)).update({"member_id": None}, synchronize_session=False)
    db.query(CourseRegistration).filter(CourseRegistration.member_id.in_(subquery)).update({"member_id": None}, synchronize_session=False)
    
    # Group references
    db.query(Event).filter(Event.group_id == group_id).update({"group_id": None}, synchronize_session=False)
    db.query(Payment).filter(Payment.group_id == group_id).update({"group_id": None}, synchronize_session=False)
    db.query(Course).filter(Course.group_id == group_id).update({"group_id": None}, synchronize_session=False)
    db.query(Message).filter(Message.group_id == group_id).update({"group_id": None}, synchronize_session=False)
    db.query(MatchTeam).filter(MatchTeam.group_id == group_id).update({"group_id": None}, synchronize_session=False)
    
    # Delete members
    db.query(Member).filter(Member.group_id == group_id).delete(synchronize_session=False)
    
    db.commit()

# Cascading operations for Single Member Deletion
def clean_member_references(db: Session, member_id: int):
    db.query(EventRegistration).filter(EventRegistration.member_id == member_id).update({"member_id": None}, synchronize_session=False)
    db.query(Payment).filter(Payment.member_id == member_id).update({"member_id": None}, synchronize_session=False)
    db.query(CourseRegistration).filter(CourseRegistration.member_id == member_id).update({"member_id": None}, synchronize_session=False)
    db.commit()
