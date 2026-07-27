import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_client
from app.common.schemas.base import SuccessResponse
from app.features.payment.schemas import OrderCreateRequest, OrderCreateResponse, PaymentVerifyRequest
from app.features.bookings.models import Booking
from app.features.earnings.models import Transaction
from app.features.notifications.crud import notification_crud
from app.core.exceptions import NotFoundException, BadRequestException

router = APIRouter(tags=["Payments"])

@router.post(
    "/create-order",
    response_model=SuccessResponse[OrderCreateResponse],
    status_code=status.HTTP_200_OK,
    summary="Simulate Razorpay order creation for accepted booking"
)
async def create_payment_order(
    data: OrderCreateRequest,
    current_user_claims: dict = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == data.booking_id).first()
    if not booking:
        raise NotFoundException("Booking request not found.")
    
    if booking.client_id != uuid.UUID(current_user_claims["sub"]):
        raise BadRequestException("Access denied: You are not the client for this booking.")
        
    if booking.status not in ["accepted", "counter_offered", "pending"]:
        raise BadRequestException(f"Cannot pay for booking with status: {booking.status}")

    price = float(booking.counter_price if booking.counter_price else booking.proposed_price)
    
    # Generate mock Razorpay Order ID
    mock_order_id = f"order_mock_{uuid.uuid4().hex[:12]}"
    
    return SuccessResponse(
        success=True,
        data=OrderCreateResponse(
            booking_id=booking.id,
            amount=price,
            currency="INR",
            razorpay_order_id=mock_order_id
        ),
        message="Simulated payment order created."
    )

@router.post(
    "/verify",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Verify simulated payment signature and confirm booking"
)
async def verify_payment(
    data: PaymentVerifyRequest,
    current_user_claims: dict = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(Booking.id == data.booking_id).first()
    if not booking:
        raise NotFoundException("Booking request not found.")
    
    if booking.client_id != uuid.UUID(current_user_claims["sub"]):
        raise BadRequestException("Access denied: You are not the client for this booking.")
        
    if booking.status not in ["accepted", "counter_offered", "pending"]:
        raise BadRequestException(f"Booking is already confirmed or cannot be paid: {booking.status}")

    price = float(booking.counter_price if booking.counter_price else booking.proposed_price)
    
    # Transition booking status to 'confirmed' via Workflow Engine
    from app.features.bookings.workflow import BookingWorkflowEngine
    booking = BookingWorkflowEngine.transition(
        db=db,
        booking_id=booking.id,
        actor_id=current_user_claims["sub"],
        actor_role="client",
        action="confirm",
        target_status="confirmed",
        reason="Payment verified.",
    )
    
    # Create escrow Transaction in earnings feature
    escrow_tx = Transaction(
        id=uuid.uuid4(),
        artist_profile_id=booking.artist_profile_id,
        venue_id=booking.venue_id,
        booking_id=booking.id,
        amount=price,
        type="credit",
        status="completed", # Completed credit means held in escrow
        description=f"Escrow payment for booking ref {booking.event_name}"
    )
    db.add(escrow_tx)
    
    # Send notification to client
    notification_crud.create(
        db,
        user_id=booking.client_id,
        title="Payment Confirmed",
        message=f"Your payment of ₹{price:,.2f} for '{booking.event_name}' was confirmed. Escrow is active."
    )
    
    # Send notification to artist/venue owner
    performer_user_id = None
    if booking.artist_profile:
        performer_user_id = booking.artist_profile.user_id
    elif booking.venue:
        performer_user_id = booking.venue.user_id
        
    if performer_user_id:
        notification_crud.create(
            db,
            user_id=performer_user_id,
            title="Booking Confirmed & Paid",
            message=f"Client paid for '{booking.event_name}'. The escrow transaction of ₹{price:,.2f} is active."
        )

    db.commit()
    return SuccessResponse(
        success=True,
        data={},
        message="Simulated payment signature verified. Booking confirmed successfully."
    )
