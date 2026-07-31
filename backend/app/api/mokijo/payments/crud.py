from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Payment, PaymentGatewayOrder, User, Member, Group, EventRegistration
from sqlalchemy import desc
from app.models.models import CourseRegistration

def to_dict(obj):
    if not obj:
        return None
    d = dict(obj.__dict__)
    d.pop('_sa_instance_state', None)
    return d

def to_dict_list(obj_list):
    return [to_dict(obj) for obj in obj_list]

def get_user_club_name(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    return user.club_name if user else None

def get_member_by_id(db: Session, member_id: int):
    return to_dict(db.query(Member).filter(Member.id == member_id).first())

def create_payment(db: Session, insert_data: dict) -> int:
    payment = Payment(**insert_data)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment.id

def get_payment_by_id(db: Session, payment_id: int):
    return to_dict(db.query(Payment).filter(Payment.id == payment_id).first())

def get_payment_by_id_and_owner(db: Session, payment_id: int, owner_id: int):
    return to_dict(db.query(Payment).filter(Payment.id == payment_id, Payment.owner_id == owner_id).first())

def get_payments_by_owner(db: Session, owner_id: int):
    return to_dict_list(db.query(Payment).filter(Payment.owner_id == owner_id).all())

def delete_payment(db: Session, payment_id: int):
    db.query(Payment).filter(Payment.id == payment_id).delete()
    db.commit()

def create_gateway_order(db: Session, insert_data: dict) -> int:
    order = PaymentGatewayOrder(**insert_data)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order.id


def get_gateway_order_by_payment_and_gateway(db: Session, payment_id: int, gateway_order_id: str):
    return to_dict(db.query(PaymentGatewayOrder).filter(PaymentGatewayOrder.payment_id == payment_id, PaymentGatewayOrder.gateway_order_id == gateway_order_id).first())

def update_gateway_order_status(db: Session, payment_id: int, gateway_order_id: str, status: str):
    db.query(PaymentGatewayOrder).filter(PaymentGatewayOrder.payment_id == payment_id, PaymentGatewayOrder.gateway_order_id == gateway_order_id).update({"status": status}, synchronize_session=False)
    db.commit()

def update_payment_status(db: Session, payment_id: int, status: str):
    db.query(Payment).filter(Payment.id == payment_id).update({"status": status}, synchronize_session=False)
    db.commit()

def update_event_registration_status(db: Session, registration_id: int, status: str):
    db.query(EventRegistration).filter(EventRegistration.id == registration_id).update({"status": status}, synchronize_session=False)
    db.commit()

def get_filtered_payments(db: Session, owner_id: int, group_id = None, status: str = None):
    query = db.query(Payment).filter(Payment.owner_id == owner_id)
    if group_id and group_id != "all":
        query = query.filter(Payment.group_id == int(group_id))
    if status and status != "all":
        query = query.filter(Payment.status == status)
    query = query.order_by(desc(Payment.id))
    return to_dict_list(query.all())

def get_groups_by_owner(db: Session, owner_id: int):
    return to_dict_list(db.query(Group).filter(Group.owner_id == owner_id).all())

def get_members_by_group_ids(db: Session, group_ids: list):
    return to_dict_list(db.query(Member).filter(Member.group_id.in_(group_ids)).order_by(Member.first_name.asc(), Member.last_name.asc()).all())

def get_payments_by_owner_desc(db: Session, owner_id: int):
    return to_dict_list(db.query(Payment).filter(Payment.owner_id == owner_id).order_by(desc(Payment.id)).all())

def update_payment_details(db: Session, payment_id: int, amount: float, description: str, due_date):
    db.query(Payment).filter(Payment.id == payment_id).update({
        "amount": amount,
        "description": description,
        "due_date": due_date
    }, synchronize_session=False)
    db.commit()



def get_gateway_order_for_verification(db: Session, payment_id: int, owner_id: int, razorpay_order_id: str):
    return to_dict(db.query(PaymentGatewayOrder).filter(
        PaymentGatewayOrder.payment_id == payment_id,
        PaymentGatewayOrder.owner_id == owner_id,
        PaymentGatewayOrder.razorpay_order_id == razorpay_order_id
    ).first())

def update_gateway_order_verification_failed(db: Session, gateway_order_id: int, rzp_payment_id: str, rzp_signature: str):
    db.query(PaymentGatewayOrder).filter(PaymentGatewayOrder.id == gateway_order_id).update({
        "status": "signature_failed",
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": rzp_signature
    }, synchronize_session=False)
    db.commit()

def update_gateway_order_verification_success(db: Session, gateway_order_id: int, rzp_payment_id: str, rzp_signature: str, verified_at):
    db.query(PaymentGatewayOrder).filter(PaymentGatewayOrder.id == gateway_order_id).update({
        "status": "paid",
        "razorpay_payment_id": rzp_payment_id,
        "razorpay_signature": rzp_signature,
        "verified_at": verified_at
    }, synchronize_session=False)
    db.commit()

def update_payment_as_paid(db: Session, payment_id: int, payment_method: str, paid_at: str):
    db.query(Payment).filter(Payment.id == payment_id).update({
        "status": "paid",
        "payment_method": payment_method,
        "paid_at": paid_at
    }, synchronize_session=False)
    db.commit()

def update_course_registration_payment_status(db: Session, registration_id: int, owner_id: int, payment_status: str):
    db.query(CourseRegistration).filter(
        CourseRegistration.id == registration_id,
        CourseRegistration.owner_id == owner_id
    ).update({"payment_status": payment_status}, synchronize_session=False)
    db.commit()

def update_payment(db: Session, payment_id: int, update_data: dict):
    db.query(Payment).filter(Payment.id == payment_id).update(update_data, synchronize_session=False)
    db.commit()

