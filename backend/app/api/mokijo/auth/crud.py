from typing import Optional, List, Dict, Any
import json
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.models import User, Member, Group, SignupSubmission

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(func.lower(User.email) == email.lower()).first()

def get_user_id_by_email(db: Session, email: str):
    user = db.query(User.id).filter(func.lower(User.email) == email.lower()).first()
    return user._mapping if user else None

def get_max_user_id(db: Session):
    max_id = db.query(func.max(User.id)).scalar()
    return {"max_id": max_id} if max_id is not None else {"max_id": 0}

def create_user(db: Session, insert_data: dict) -> int:
    user = User(**insert_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user.id

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_verification_token(db: Session, token: str):
    return db.query(User).filter(
        or_(
            User.email_verification_token == token,
            User.verification_token == token
        )
    ).first()

def update_user_verification_status(db: Session, user_id: int):
    user = get_user_by_id(db, user_id)
    if user:
        user.is_verified = True
        user.verification_token = None
        user.is_email_verified = True
        user.email_verification_token = None
        user.email_verification_token_expires_at = None
        db.commit()

def update_user_password(db: Session, user_id: int, hashed_password: str):
    user = get_user_by_id(db, user_id)
    if user:
        user.password = hashed_password
        db.commit()

def update_user_verification_tokens(db: Session, user_id: int, token: str, expires_at):
    user = get_user_by_id(db, user_id)
    if user:
        user.verification_token = token
        user.email_verification_token = token
        user.email_verification_token_expires_at = expires_at
        db.commit()

def get_clubs(db: Session):
    return db.query(User).filter(User.club_name.isnot(None)).all()

def update_member_password(db: Session, member_id: int, hashed_password: str):
    member = get_member_by_id(db, member_id)
    if member:
        member.password = hashed_password
        db.commit()

def get_group_by_id(db: Session, group_id: int):
    return db.query(Group).filter(Group.id == group_id).first()

def get_member_by_id(db: Session, member_id: int):
    return db.query(Member).filter(Member.id == member_id).first()

def get_member_id_by_email_exclude_current(db: Session, email: str, current_member_id: int):
    member = db.query(Member.id).filter(
        func.lower(Member.email) == email.lower(),
        Member.id != current_member_id
    ).first()
    return member._mapping if member else None

def update_member(db: Session, member_id: int, update_data: dict):
    if not update_data:
        return
    member = get_member_by_id(db, member_id)
    if member:
        for k, v in update_data.items():
            setattr(member, k, v)
        db.commit()

def update_group_name(db: Session, group_id: int, group_name: str):
    group = get_group_by_id(db, group_id)
    if group:
        group.group_name = group_name
        db.commit()

def update_club_name(db: Session, owner_id: int, club_name: str):
    user = get_user_by_id(db, owner_id)
    if user:
        user.club_name = club_name
        db.commit()

def get_group_owner_id(db: Session, group_id: int):
    group = db.query(Group.owner_id).filter(Group.id == group_id).first()
    return group._mapping if group else None

def find_approved_member_by_email(db: Session, email_clean: str, owner_id: int | None = None):
    email_clean = email_clean.replace(' ', '').lower()
    query = db.query(Member)
    if owner_id is not None:
        query = query.join(Group, Member.group_id == Group.id).filter(Group.owner_id == owner_id)
    return query.filter(func.lower(func.replace(Member.email, ' ', '')) == email_clean).first()

def has_pending_submission_for_email(db: Session, email_clean: str, owner_id: int | None = None, exclude_submission_id: int | None = None):
    query = db.query(SignupSubmission)
    if owner_id is not None:
        query = query.filter(SignupSubmission.owner_id == owner_id)
    if exclude_submission_id is not None:
        query = query.filter(SignupSubmission.id != exclude_submission_id)
    
    submissions = query.all()
    for submission in submissions:
        try:
            data = json.loads(submission.submitted_data)
            if isinstance(data, dict):
                # get_case_insensitive_value equivalent
                submission_email = next((v for k, v in data.items() if str(k).lower() == "email"), None)
                if submission_email:
                    submission_email = "".join(str(submission_email).split()).lower()
                    if submission_email == email_clean:
                        return True
        except Exception:
            continue
    return False

def update_user_profile(db: Session, user_id: int, update_data: dict):
    if not update_data:
        return
    user = get_user_by_id(db, user_id)
    if user:
        for k, v in update_data.items():
            setattr(user, k, v)
        db.commit()

