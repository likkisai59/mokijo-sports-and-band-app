from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.api.band.payments import crud as payment_crud
from app.api.band.bookings import crud as booking_crud
from app.api.band.notifications import crud as notif_crud
from app.services.razorpay import call_razorpay_api, build_razorpay_signature
import hmac

def create_payment_order(db: Session, account_id: int, booking_id: int):
    booking = booking_crud.get_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.client_id != account_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if booking.status != "accepted":
        raise HTTPException(status_code=400, detail="Booking is not in accepted state")

    existing_order = payment_crud.get_order_by_booking(db, booking.id)
    if existing_order:
        if existing_order.status == "paid":
            raise HTTPException(status_code=400, detail="Payment already completed")
        return existing_order # return the existing unpaid order

    amount_to_pay = booking.counter_price if booking.counter_price else booking.proposed_price
    amount_in_paise = int(amount_to_pay * 100)

    # Call Razorpay to create order
    rz_payload = {
        "amount": amount_in_paise,
        "currency": "INR",
        "receipt": f"band_rcpt_{booking.id}",
        "notes": {
            "booking_id": str(booking.id),
            "client_id": str(account_id)
        }
    }

    rz_response = call_razorpay_api("POST", "/orders", rz_payload)
    rz_order_id = rz_response["id"]

    order = payment_crud.create_payment_order(
        db=db,
        booking_id=booking.id,
        client_id=account_id,
        razorpay_order_id=rz_order_id,
        amount=amount_to_pay
    )

    # Update timeline
    evt = {
        "by": "client",
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Payment Initiated"
    }
    booking_timeline = list(booking.timeline)
    booking_timeline.append(evt)
    booking.timeline = booking_timeline
    db.commit()

    # Create Notifications
    notif_crud.create(
        db, account_id=booking.client_id, title="Payment Initiated",
        message=f"You have initiated the payment for '{booking.event_name}'.",
        notification_type="payment_initiated", reference_type="booking", reference_id=booking.id
    )
    if booking.artist_profile_id:
        artist_account_id = booking.artist.account_id if booking.artist else None
        if artist_account_id:
            notif_crud.create(
                db, account_id=artist_account_id, title="Client Initiated Payment",
                message=f"The client has initiated the payment for '{booking.event_name}'.",
                notification_type="payment_initiated", reference_type="booking", reference_id=booking.id
            )

    return order

def verify_payment(db: Session, account_id: int, booking_id: int, rz_order_id: str, rz_payment_id: str, signature: str):
    order = payment_crud.get_order_by_razorpay_id(db, rz_order_id)
    if not order or order.booking_id != booking_id:
        raise HTTPException(status_code=404, detail="Payment order not found")
    if order.client_id != account_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if order.status == "paid":
        return order

    # Verify signature
    expected_signature = build_razorpay_signature(rz_order_id, rz_payment_id)
    if not hmac.compare_digest(expected_signature, signature):
        
        # Add failed timeline event
        booking = booking_crud.get_by_id(db, booking_id)
        evt = {
            "by": "system",
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Payment Failed Verification"
        }
        booking_timeline = list(booking.timeline)
        booking_timeline.append(evt)
        booking.timeline = booking_timeline
        db.commit()
        
        notif_crud.create(
            db, account_id=order.client_id, title="Payment Failed",
            message=f"Payment verification failed for booking.",
            notification_type="payment_failed", reference_type="booking", reference_id=booking.id
        )

        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Mark Paid
    payment_crud.update_order_status(db, order, rz_payment_id, signature)

    # Update Booking
    booking = booking_crud.get_by_id(db, booking_id)
    booking.status = "confirmed"
    
    evt = {
        "by": "system",
        "timestamp": datetime.utcnow().isoformat(),
        "message": "Payment Successful. Booking Confirmed."
    }
    booking_timeline = list(booking.timeline)
    booking_timeline.append(evt)
    booking.timeline = booking_timeline
    db.commit()

    # Notifications
    notif_crud.create(
        db, account_id=booking.client_id, title="Payment Successful",
        message=f"Your payment for '{booking.event_name}' was successful. Booking is now confirmed.",
        notification_type="payment_successful", reference_type="booking", reference_id=booking.id
    )
    if booking.artist_profile_id:
        artist_account_id = booking.artist.account_id if booking.artist else None
        if artist_account_id:
            notif_crud.create(
                db, account_id=artist_account_id, title="Booking Confirmed",
                message=f"The client completed the payment for '{booking.event_name}'. Booking is confirmed.",
                notification_type="payment_successful", reference_type="booking", reference_id=booking.id
            )

    return order
