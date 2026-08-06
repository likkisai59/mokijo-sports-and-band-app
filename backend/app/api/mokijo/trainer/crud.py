from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Trainer, Course

def to_dict(obj):
    if not obj:
        return None
    d = dict(obj.__dict__)
    d.pop('_sa_instance_state', None)
    return d

def to_dict_list(obj_list):
    return [to_dict(obj) for obj in obj_list]

def create_trainer(db: Session, insert_data: dict) -> int:
    trainer = Trainer(**insert_data)
    db.add(trainer)
    db.commit()
    db.refresh(trainer)
    return trainer.id

def get_trainer_by_id(db: Session, trainer_id: int):
    return to_dict(db.query(Trainer).filter(Trainer.id == trainer_id).first())

def create_course(db: Session, insert_data: dict) -> int:
    course = Course(**insert_data)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course.id

def get_course_by_id(db: Session, course_id: int):
    return to_dict(db.query(Course).filter(Course.id == course_id).first())

def get_course_by_id_and_trainer(db: Session, course_id: int, trainer_id: int):
    return to_dict(db.query(Course).filter(Course.id == course_id, Course.trainer_id == trainer_id).first())

from sqlalchemy import text
from app.models.models import User, Member

def get_user_by_id(db: Session, user_id: int):
    return to_dict(db.query(User).filter(User.id == user_id).first())

def get_user_by_id_and_role(db: Session, user_id: int, role: str):
    return get_user_by_id(db, user_id)

def get_club_member_by_id(db: Session, member_id: int):
    return to_dict(db.query(Member).filter(Member.id == member_id).first())

def get_trainer_by_email(db: Session, email: str):
    return to_dict(db.query(Trainer).filter(Trainer.email.ilike(email)).first())

def update_trainer_password(db: Session, trainer_id: int, new_password: str):
    db.query(Trainer).filter(Trainer.id == trainer_id).update({"password": new_password})
    db.commit()

def get_courses_by_trainer(db: Session, trainer_id: int):
    return to_dict_list(db.query(Course).filter(Course.trainer_id == trainer_id).order_by(Course.created_at.desc()).all())

def update_course(db: Session, course_id: int, update_data: dict):
    db.query(Course).filter(Course.id == course_id).update(update_data)
    db.commit()

def delete_course(db: Session, course_id: int):
    db.query(Course).filter(Course.id == course_id).delete()
    db.commit()

def update_course_status(db: Session, course_id: int, is_active: bool):
    db.query(Course).filter(Course.id == course_id).update({"is_active": is_active})
    db.commit()

def get_course_trainees_users(db: Session, course_id: int):
    query = '''
        SELECT u.id, u.first_name, u.last_name, u.email, u.phone, cr.status, cr.payment_status, cr.created_at
        FROM course_registrations cr
        JOIN users u ON cr.user_id = u.id
        WHERE cr.course_id = :course_id
    '''
    result = db.execute(text(query), {"course_id": course_id}).mappings().all()
    return [dict(row) for row in result]

def get_course_trainees_members(db: Session, course_id: int):
    query = '''
        SELECT m.id, m.first_name, m.last_name, m.email, m.phone, cr.status, cr.payment_status, cr.created_at
        FROM course_registrations cr
        JOIN club_members m ON cr.club_member_id = m.id
        WHERE cr.course_id = :course_id
    '''
    result = db.execute(text(query), {"course_id": course_id}).mappings().all()
    return [dict(row) for row in result]

def get_club_member_by_email(db: Session, email: str):
    return to_dict(db.query(Member).filter(Member.email.ilike(email)).first())

from app.models.models import CourseRegistration

def get_course_registrations_by_course(db: Session, course_id: int):
    return to_dict_list(db.query(CourseRegistration).filter(CourseRegistration.course_id == course_id).order_by(CourseRegistration.id.desc()).all())

def get_course_registrations_by_trainer(db: Session, trainer_id: int):
    return to_dict_list(db.query(CourseRegistration).join(Course, Course.id == CourseRegistration.course_id).filter(Course.trainer_id == trainer_id).order_by(CourseRegistration.id.desc()).all())
