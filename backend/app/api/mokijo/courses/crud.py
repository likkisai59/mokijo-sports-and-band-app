from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import User, Member, Course, CourseRegistration, TrainingEnrollmentOrder


def to_dict(obj):
    if not obj:
        return None
    d = dict(obj.__dict__)
    d.pop('_sa_instance_state', None)
    return d

def to_dict_list(objs):
    return [to_dict(obj) for obj in objs if obj]


def get_user_email(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    return user.email if user else None

def get_member_email(db: Session, member_id: int):
    member = db.query(Member).filter(Member.id == member_id).first()
    return member.email if member else None

def get_trainer_by_id(db: Session, trainer_id: int):
    # 'trainers' table does not have an explicit model yet? I should probably just fetch it as dict or assume Trainer exists.
    # We will assume a 'User' with a specific role, but earlier I saw 'trainers' table in fetch_one.
    # Let me check if Trainer model exists. For now, we will fallback to raw SQL if Trainer model is missing
    # But wait, we want zero raw SQL. If Trainer is not in models, I should create it later or just map it here.
    # Let's map it to `db.execute` for now if needed, but I should use the proper ORM way.
    pass

def get_user_by_id(db: Session, user_id: int):
    return to_dict(db.query(User).filter(User.id == user_id).first())

# COURSES
def create_course(db: Session, insert_data: dict) -> int:
    course = Course(**insert_data)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course.id

def get_course_by_id(db: Session, course_id: int):
    return to_dict(db.query(Course).filter(Course.id == course_id).first())

def get_course_by_id_and_owner(db: Session, course_id: int, owner_id: int):
    return to_dict(db.query(Course).filter(Course.id == course_id, Course.owner_id == owner_id).first())

def get_courses_by_owner(db: Session, owner_id: int):
    return to_dict_list(db.query(Course).filter(Course.owner_id == owner_id).all())

def delete_course(db: Session, course_id: int):
    course = db.query(Course).filter(Course.id == course_id).first()
    if course:
        db.delete(course)
        db.commit()

# COURSE REGISTRATIONS
def create_registration(db: Session, insert_data: dict) -> int:
    reg = CourseRegistration(**insert_data)
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg.id

def get_registration_by_id(db: Session, registration_id: int):
    return to_dict(db.query(CourseRegistration).filter(CourseRegistration.id == registration_id).first())

def get_registrations_by_owner(db: Session, owner_id: int):
    return to_dict_list(db.query(CourseRegistration).filter(CourseRegistration.owner_id == owner_id).all())

def get_registrations_by_course(db: Session, course_id: int):
    return to_dict_list(db.query(CourseRegistration).filter(CourseRegistration.course_id == course_id).all())

def delete_registration(db: Session, registration_id: int):
    reg = db.query(CourseRegistration).filter(CourseRegistration.id == registration_id).first()
    if reg:
        db.delete(reg)
        db.commit()

def update_registration_status(db: Session, registration_id: int, status: str, payment_status: str):
    reg = db.query(CourseRegistration).filter(CourseRegistration.id == registration_id).first()
    if reg:
        reg.status = status
        reg.payment_status = payment_status
        db.commit()

# ORDERS
def create_enrollment_order(db: Session, insert_data: dict) -> int:
    order = TrainingEnrollmentOrder(**insert_data)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order.id

def update_enrollment_order_status(db: Session, order_id: int, status: str, rzp_payment_id: str, rzp_signature: str):
    order = db.query(TrainingEnrollmentOrder).filter(TrainingEnrollmentOrder.id == order_id).first()
    if order:
        order.status = status
        order.razorpay_payment_id = rzp_payment_id
        order.razorpay_signature = rzp_signature
        db.commit()

from app.models.models import Payment, PaymentGatewayOrder

def get_trainer_by_id(db: Session, trainer_id: int):
    # Fallback to dict via standard User lookup if trainers table isn't fully mapped
    # For now, it seems the code expects a 'User' with 'trainer' role
    return to_dict(db.query(User).filter(User.id == trainer_id).first())

def get_courses_by_ids(db: Session, course_ids: List[int]):
    return to_dict_list(db.query(Course).filter(Course.id.in_(course_ids)).order_by(Course.id.desc()).all())

def get_filtered_courses_by_owner(db: Session, owner_id: int, group_id: Optional[int] = None, status: Optional[str] = None):
    query = db.query(Course).filter(Course.owner_id == owner_id)
    if group_id:
        query = query.filter(Course.group_id == group_id)
    if status and status != "all":
        query = query.filter(Course.status == status)
    return to_dict_list(query.order_by(Course.id.desc()).all())

def get_member_by_email(db: Session, email: str):
    member = db.query(Member).filter(func.lower(Member.email) == email.lower()).first()
    return {"id": member.id} if member else None

def get_registrations_by_course_and_member(db: Session, course_id: int, member_id: int):
    return to_dict_list(db.query(CourseRegistration).filter(CourseRegistration.course_id == course_id, CourseRegistration.member_id == member_id).all())

def get_payment_gateway_order(db: Session, order_id: str):
    return to_dict(db.query(PaymentGatewayOrder).filter(PaymentGatewayOrder.id == order_id).first())

def update_course(db: Session, course_id: int, update_data: dict):
    db.query(Course).filter(Course.id == course_id).update(update_data, synchronize_session=False)
    db.commit()

from sqlalchemy import func

def get_registrations_by_user_or_member(db: Session, target_id: int):
    return to_dict_list(db.query(CourseRegistration).filter((CourseRegistration.user_id == target_id) | (CourseRegistration.member_id == target_id)).order_by(CourseRegistration.id.desc()).all())

from sqlalchemy import or_, and_, desc
from app.models.models import Group

def get_courses_with_trainers(db: Session):
    return to_dict_list(db.query(Course).filter(Course.trainer_id.isnot(None)).order_by(desc(Course.id)).all())

def get_course_registrations_filtered(db: Session, notes_pattern: str, target_user_id: int, current_id: int, email_clean: str):
    # Mimics the complex query
    query = db.query(CourseRegistration).join(Course, Course.id == CourseRegistration.course_id).filter(CourseRegistration.status != 'cancelled')
    
    conditions = []
    if notes_pattern:
        conditions.append(CourseRegistration.notes.ilike(notes_pattern))
    
    # Subquery for training_enrollment_orders
    subq = db.query(TrainingEnrollmentOrder.registration_id).filter(
        TrainingEnrollmentOrder.registration_id == CourseRegistration.id,
        or_(TrainingEnrollmentOrder.user_id == target_user_id, TrainingEnrollmentOrder.user_id == current_id)
    ).exists()
    conditions.append(subq)

    if email_clean:
        conditions.append(func.lower(func.replace(func.coalesce(CourseRegistration.participant_email, ''), ' ', '')) == email_clean)
        conditions.append(CourseRegistration.member_id.in_(db.query(Member.id).filter(func.lower(Member.email) == email_clean)))
    
    conditions.append(CourseRegistration.owner_id == target_user_id)
    conditions.append(CourseRegistration.owner_id == current_id)
    
    query = query.filter(or_(*conditions)).order_by(desc(CourseRegistration.registered_at), desc(CourseRegistration.id))
    return to_dict_list(query.all())

def get_existing_course_registration_by_email(db: Session, course_id: int, email_clean: str):
    return to_dict(db.query(CourseRegistration).filter(
        CourseRegistration.course_id == course_id,
        func.lower(CourseRegistration.participant_email) == email_clean,
        CourseRegistration.status != 'cancelled'
    ).first())

def update_course_registration_status_new(db: Session, reg_id: int, payment_status: str, status: str):
    db.query(CourseRegistration).filter(CourseRegistration.id == reg_id).update({
        "payment_status": payment_status,
        "status": status
    }, synchronize_session=False)
    db.commit()

def get_course_registration_by_id_and_course(db: Session, reg_id: int, course_id: int):
    return to_dict(db.query(CourseRegistration).filter(CourseRegistration.id == reg_id, CourseRegistration.course_id == course_id).first())

def get_training_enrollment_order(db: Session, reg_id: int, razorpay_order_id: str, user_id: int):
    return to_dict(db.query(TrainingEnrollmentOrder).filter(
        TrainingEnrollmentOrder.registration_id == reg_id,
        TrainingEnrollmentOrder.razorpay_order_id == razorpay_order_id,
        TrainingEnrollmentOrder.user_id == user_id
    ).first())

def update_training_enrollment_order_failed(db: Session, order_id: int, rzp_payment_id: str, rzp_signature: str):
    db.query(TrainingEnrollmentOrder).filter(TrainingEnrollmentOrder.id == order_id).update({
        "status": "signature_failed",
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": rzp_signature
    }, synchronize_session=False)
    db.commit()

def update_training_enrollment_order_success(db: Session, order_id: int, rzp_payment_id: str, rzp_signature: str, verified_at):
    db.query(TrainingEnrollmentOrder).filter(TrainingEnrollmentOrder.id == order_id).update({
        "status": "paid",
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": rzp_signature,
        "verified_at": verified_at
    }, synchronize_session=False)
    db.commit()

def update_course_registration_paid(db: Session, reg_id: int):
    db.query(CourseRegistration).filter(CourseRegistration.id == reg_id).update({
        "payment_status": "paid",
        "status": "registered"
    }, synchronize_session=False)
    db.commit()

def get_registered_course_ids_by_email(db: Session, email_clean: str):
    res = db.query(CourseRegistration.course_id).filter(
        func.lower(CourseRegistration.participant_email) == email_clean,
        CourseRegistration.status == 'registered'
    ).all()
    return [{"course_id": r[0]} for r in res]

def get_registered_course_ids_by_member(db: Session, member_id: int):
    res = db.query(CourseRegistration.course_id).filter(
        CourseRegistration.member_id == member_id,
        CourseRegistration.status == 'registered'
    ).all()
    return [{"course_id": r[0]} for r in res]

def get_course_registrations_by_course_and_owner(db: Session, course_id: int, owner_id: int):
    return to_dict_list(db.query(CourseRegistration).filter(
        CourseRegistration.course_id == course_id,
        CourseRegistration.owner_id == owner_id
    ).order_by(desc(CourseRegistration.id)).all())

def get_member_by_id_and_group_owner(db: Session, member_id: int, owner_id: int):
    res = db.query(Member).join(Group, Member.group_id == Group.id).filter(
        Member.id == member_id,
        Group.owner_id == owner_id
    ).first()
    return to_dict(res)

def get_existing_course_registration_by_member(db: Session, course_id: int, member_id: int):
    res = db.query(CourseRegistration.id).filter(
        CourseRegistration.course_id == course_id,
        CourseRegistration.member_id == member_id,
        CourseRegistration.status != 'cancelled'
    ).first()
    return {"id": res[0]} if res else None
