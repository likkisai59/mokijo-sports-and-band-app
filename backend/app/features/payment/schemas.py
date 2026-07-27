from uuid import UUID
from app.common.schemas.base import BaseSchema

class OrderCreateRequest(BaseSchema):
    booking_id: UUID

class OrderCreateResponse(BaseSchema):
    booking_id: UUID
    amount: float
    currency: str
    razorpay_order_id: str

class PaymentVerifyRequest(BaseSchema):
    booking_id: UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
