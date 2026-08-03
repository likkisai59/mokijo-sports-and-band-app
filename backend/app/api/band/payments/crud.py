from datetime import datetime
from sqlalchemy.orm import Session
from app.models.band_models import BandPaymentOrder

def create_payment_order(db: Session, booking_id: int, client_id: int, razorpay_order_id: str, amount: float) -> BandPaymentOrder:
    order = BandPaymentOrder(
        booking_id=booking_id,
        client_id=client_id,
        razorpay_order_id=razorpay_order_id,
        amount=amount,
        status="created"
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

def get_order_by_razorpay_id(db: Session, razorpay_order_id: str) -> BandPaymentOrder | None:
    return db.query(BandPaymentOrder).filter(BandPaymentOrder.razorpay_order_id == razorpay_order_id).first()

def get_order_by_booking(db: Session, booking_id: int) -> BandPaymentOrder | None:
    return db.query(BandPaymentOrder).filter(BandPaymentOrder.booking_id == booking_id).first()

def update_order_status(db: Session, order: BandPaymentOrder, payment_id: str, signature: str) -> BandPaymentOrder:
    order.status = "paid"
    order.razorpay_payment_id = payment_id
    order.razorpay_signature = signature
    order.verified_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return order
