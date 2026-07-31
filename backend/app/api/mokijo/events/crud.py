from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import Event, EventRegistration, Group


def to_dict(obj):
    if not obj:
        return None
    d = dict(obj.__dict__)
    d.pop('_sa_instance_state', None)
    return d

def to_dict_list(objs):
    return [to_dict(obj) for obj in objs if obj]


def create_event(db: Session, insert_data: dict) -> int:
    event = Event(**insert_data)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event.id

def get_event(db: Session, event_id: int):
    return to_dict(db.query(Event).filter(Event.id == event_id).first())

def get_events_by_owner(db: Session, owner_id: int):
    # Events belong to a group, which belongs to an owner.
    # We join with Group to filter by owner_id. Wait, does Event have owner_id? Let's assume yes based on previous SQL.
    # The SQL was: SELECT * FROM events WHERE owner_id = %s
    return to_dict_list(db.query(Event).filter(Event.owner_id == owner_id).all())

def get_events_by_group(db: Session, group_id: int):
    return to_dict_list(db.query(Event).filter(Event.group_id == group_id).all())

def delete_event(db: Session, event_id: int):
    event = db.query(Event).filter(Event.id == event_id).first()
    if event:
        db.delete(event)
        db.commit()

# EVENT REGISTRATIONS
def create_registration(db: Session, insert_data: dict) -> int:
    reg = EventRegistration(**insert_data)
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg.id

def get_registrations_by_event(db: Session, event_id: int):
    return to_dict_list(db.query(EventRegistration).filter(EventRegistration.event_id == event_id).all())

def get_registration_by_event_and_member(db: Session, event_id: int, member_email: str):
    return db.query(EventRegistration).filter(
        EventRegistration.event_id == event_id,
        func.lower(EventRegistration.participant_email) == member_email.lower()
    ).first()

def update_registration_status(db: Session, registration_id: int, status: str):
    reg = db.query(EventRegistration).filter(EventRegistration.id == registration_id).first()
    if reg:
        reg.status = status
        db.commit()

def update_registration_attendance(db: Session, registration_id: int, attendance: str):
    reg = db.query(EventRegistration).filter(EventRegistration.id == registration_id).first()
    if reg:
        reg.attendance = attendance
        db.commit()

from app.models.models import User, Member

def get_group_by_id_and_owner(db: Session, group_id: int, owner_id: int):
    return to_dict(db.query(Group).filter(Group.id == group_id, Group.owner_id == owner_id).first())

def get_group_by_name_and_owner(db: Session, group_name: str, owner_id: int):
    return to_dict(db.query(Group).filter(Group.group_name == group_name, Group.owner_id == owner_id).first())

def get_member_by_email(db: Session, email: str):
    return to_dict(db.query(Member).filter(func.lower(Member.email) == email.lower()).first())

def get_member_by_id(db: Session, member_id: int):
    return to_dict(db.query(Member).filter(Member.id == member_id).first())

def get_registration_by_event_and_member_id(db: Session, event_id: int, member_id: int):
    return to_dict(db.query(EventRegistration).filter(EventRegistration.event_id == event_id, EventRegistration.member_id == member_id).first())

def get_registrations_by_member_and_status(db: Session, member_id: int, status: str):
    return to_dict_list(db.query(EventRegistration).filter(EventRegistration.member_id == member_id, EventRegistration.status == status).all())

def get_events_by_ids(db: Session, event_ids: List[int]):
    return to_dict_list(db.query(Event).filter(Event.id.in_(event_ids)).all())

def get_groups_by_owner(db: Session, owner_id: int):
    return to_dict_list(db.query(Group).filter(Group.owner_id == owner_id).all())

def get_events_by_group_ids(db: Session, group_ids: List[int]):
    return to_dict_list(db.query(Event).filter(Event.group_id.in_(group_ids)).all())

def get_members_by_group_ids(db: Session, group_ids: List[int]):
    return to_dict_list(db.query(Member).filter(Member.group_id.in_(group_ids)).all())

def get_members_by_group_ids_and_role_parent(db: Session, group_ids: List[int]):
    return to_dict_list(db.query(Member).filter(
        Member.group_id.in_(group_ids),
        (func.lower(Member.role).like('%parent%') | func.lower(Member.role).like('%guardian%'))
    ).all())

def get_members_by_group_ids_and_role_coach(db: Session, group_ids: List[int]):
    return to_dict_list(db.query(Member).filter(
        Member.group_id.in_(group_ids),
        func.lower(Member.role).like('%coach%')
    ).all())

def get_members_by_ids(db: Session, member_ids: List[int]):
    return to_dict_list(db.query(Member).filter(Member.id.in_(member_ids)).all())

def update_event(db: Session, event_id: int, update_data: dict):
    db.query(Event).filter(Event.id == event_id).update(update_data, synchronize_session=False)
    db.commit()

def get_accepted_registrations_count(db: Session, event_id: int) -> int:
    return db.query(EventRegistration).filter(EventRegistration.event_id == event_id, EventRegistration.status == 'accepted').count()

def update_registration_status_with_time(db: Session, reg_id: int, status: str, responded_at: str):
    db.query(EventRegistration).filter(EventRegistration.id == reg_id).update({"status": status, "responded_at": responded_at}, synchronize_session=False)
    db.commit()

def get_registration_by_id(db: Session, reg_id: int, event_id: int = None):
    query = db.query(EventRegistration).filter(EventRegistration.id == reg_id)
    if event_id:
        query = query.filter(EventRegistration.event_id == event_id)
    return to_dict(query.first())

def get_accepted_and_pending_emails(db: Session, event_id: int):
    regs = db.query(EventRegistration.participant_email).filter(EventRegistration.event_id == event_id, EventRegistration.status.in_(['accepted', 'pending'])).all()
    return [r[0] for r in regs if r[0]]

def get_user_by_id(db: Session, user_id: int):
    return to_dict(db.query(User).filter(User.id == user_id).first())

def get_registrations_by_member(db: Session, member_id: int):
    return to_dict_list(db.query(EventRegistration).filter(EventRegistration.member_id == member_id).all())

def get_registration_by_email_and_status(db: Session, email: str, status: str):
    return to_dict_list(db.query(EventRegistration).filter(func.lower(EventRegistration.participant_email) == email.lower(), EventRegistration.status == status).all())

def get_registrations_by_email(db, email: str):
    return to_dict_list(db.query(EventRegistration).filter(func.lower(EventRegistration.participant_email) == email.lower()).all())
