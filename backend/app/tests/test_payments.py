import uuid
import datetime
from app.features.auth.models import User
from app.features.bookings.models import Booking
from app.features.earnings.models import Transaction
from app.features.notifications.models import Notification
from app.core.dependencies import get_current_user
from main import app

def test_payment_flow(client, db_session):
    # 1. Create client and artist user
    client_user = User(
        id=uuid.uuid4(),
        email="payment_client@example.com",
        password_hash="test",
        name="Payment Client",
        is_active=True,
        is_verified=True
    )
    artist_user = User(
        id=uuid.uuid4(),
        email="payment_artist@example.com",
        password_hash="test",
        name="Payment Artist",
        is_active=True,
        is_verified=True
    )
    db_session.add(client_user)
    db_session.add(artist_user)
    db_session.commit()

    # 2. Create booking request
    booking = Booking(
        id=uuid.uuid4(),
        client_id=client_user.id,
        event_name="Payment Test Gig",
        event_date=datetime.date(2026, 8, 15),
        start_time=datetime.time(18, 0),
        end_time=datetime.time(22, 0),
        location="Gachibowli Stadium, Hyderabad",
        proposed_price=15000.0,
        status="accepted" # Client can pay for accepted/counter_offered
    )
    db_session.add(booking)
    db_session.commit()

    # 3. Authenticate client
    async def override_get_current_user():
        return {"sub": str(client_user.id), "role": "client"}

    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        # Create order
        response = client.post("/api/v1/payments/create-order", json={"booking_id": str(booking.id)})
        assert response.status_code == 200
        order_data = response.json()["data"]
        assert order_data["booking_id"] == str(booking.id)
        assert order_data["amount"] == 15000.0
        assert order_data["razorpay_order_id"].startswith("order_mock_")

        # Verify payment
        verify_payload = {
            "booking_id": str(booking.id),
            "razorpay_order_id": order_data["razorpay_order_id"],
            "razorpay_payment_id": "pay_mock_112233",
            "razorpay_signature": "sig_mock_445566"
        }
        verify_response = client.post("/api/v1/payments/verify", json=verify_payload)
        assert verify_response.status_code == 200

        # Verify db updates
        db_session.refresh(booking)
        assert booking.status == "confirmed"

        # Check transaction created
        tx = db_session.query(Transaction).filter(Transaction.booking_id == booking.id).first()
        assert tx is not None
        assert tx.amount == 15000.0
        assert tx.status == "completed"

        # Check notifications created
        notif = db_session.query(Notification).filter(Notification.user_id == client_user.id).first()
        assert notif is not None
        assert "Booking Confirmed" in notif.title  # notification_type=booking_confirmed emits this title

    finally:
        app.dependency_overrides.pop(get_current_user, None)
