from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.schemas import UserResponse
from app.models.band_schemas import BandPaymentOrderCreate, BandPaymentOrderVerify, BandPaymentOrderResponse
from app.api.band.payments import service
from app.api.band.common.deps import get_band_account

router = APIRouter()

@router.post("/order", response_model=BandPaymentOrderResponse)
def create_payment_order(
    request: BandPaymentOrderCreate,
    db: Session = Depends(get_db),
    current_account: UserResponse = Depends(get_band_account)
):
    """Create a new Razorpay payment order for a booking."""
    return service.create_payment_order(db, current_account.id, request.booking_id)

@router.post("/verify", response_model=BandPaymentOrderResponse)
def verify_payment(
    request: BandPaymentOrderVerify,
    db: Session = Depends(get_db),
    current_account: UserResponse = Depends(get_band_account)
):
    """Verify the Razorpay payment signature."""
    return service.verify_payment(
        db, 
        current_account.id, 
        request.booking_id,
        request.razorpay_order_id,
        request.razorpay_payment_id,
        request.razorpay_signature
    )
