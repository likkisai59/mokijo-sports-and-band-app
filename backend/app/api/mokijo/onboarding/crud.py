from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import SignupForm, SignupSubmission

def to_dict(obj):
    if not obj:
        return None
    d = dict(obj.__dict__)
    d.pop('_sa_instance_state', None)
    return d

def to_dict_list(obj_list):
    return [to_dict(obj) for obj in obj_list]

# FORMS
def create_signup_form(db: Session, insert_data: dict) -> int:
    form = SignupForm(**insert_data)
    db.add(form)
    db.commit()
    db.refresh(form)
    return form.id

def get_signup_form_by_id(db: Session, form_id: int):
    return to_dict(db.query(SignupForm).filter(SignupForm.id == form_id).first())

def get_signup_forms_by_owner(db: Session, owner_id: int):
    return to_dict_list(db.query(SignupForm).filter(SignupForm.owner_id == owner_id).all())

def update_signup_form(db: Session, form_id: int, fields: str):
    db.query(SignupForm).filter(SignupForm.id == form_id).update({"fields": fields})
    db.commit()

# SUBMISSIONS
def create_submission(db: Session, insert_data: dict) -> int:
    submission = SignupSubmission(**insert_data)
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission.id

def get_submission_by_id(db: Session, submission_id: int):
    return to_dict(db.query(SignupSubmission).filter(SignupSubmission.id == submission_id).first())

def get_submissions_by_owner(db: Session, owner_id: int):
    return to_dict_list(db.query(SignupSubmission).filter(SignupSubmission.owner_id == owner_id).all())

def delete_submission(db: Session, submission_id: int):
    db.query(SignupSubmission).filter(SignupSubmission.id == submission_id).delete()
    db.commit()

from sqlalchemy import func
from app.models.models import User, Group

def get_user_by_id(db: Session, user_id: int):
    return to_dict(db.query(User).filter(User.id == user_id).first())

def get_signup_form_by_role_and_owner(db: Session, role: str, owner_id: int):
    return to_dict(db.query(SignupForm).filter(SignupForm.owner_id == owner_id, func.lower(SignupForm.role) == func.lower(role)).first())

def update_signup_form_full(db: Session, form_id: int, title: str, description: str, fields: str):
    db.query(SignupForm).filter(SignupForm.id == form_id).update({
        "title": title,
        "description": description,
        "fields": fields
    }, synchronize_session=False)
    db.commit()

def get_all_submissions(db: Session):
    return to_dict_list(db.query(SignupSubmission).all())

def get_submissions_by_owner_ordered(db: Session, owner_id: int):
    return to_dict_list(db.query(SignupSubmission).filter(SignupSubmission.owner_id == owner_id).order_by(SignupSubmission.created_at.desc()).all())

def get_submission_by_id_and_owner(db: Session, submission_id: int, owner_id: int):
    return to_dict(db.query(SignupSubmission).filter(SignupSubmission.id == submission_id, SignupSubmission.owner_id == owner_id).first())

def update_submission_data(db: Session, submission_id: int, submitted_data: str):
    db.query(SignupSubmission).filter(SignupSubmission.id == submission_id).update({"submitted_data": submitted_data}, synchronize_session=False)
    db.commit()

def get_group_by_id_and_owner(db: Session, group_id: int, owner_id: int):
    return to_dict(db.query(Group).filter(Group.id == group_id, Group.owner_id == owner_id).first())

def get_group_by_name_and_owner(db: Session, group_name: str, owner_id: int):
    return to_dict(db.query(Group).filter(Group.group_name == group_name, Group.owner_id == owner_id).first())

from app.models.models import Member

def create_group(db: Session, insert_data: dict) -> int:
    group = Group(**insert_data)
    db.add(group)
    db.commit()
    db.refresh(group)
    return group.id

def create_member(db: Session, insert_data: dict) -> int:
    member = Member(**insert_data)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member.id
