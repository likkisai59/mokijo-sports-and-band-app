import uuid
import datetime
import pytest
from app.features.auth.models import User
from app.features.bookings.models import Booking
from app.features.artists.models import ArtistProfile
from app.core.dependencies import get_current_client, get_current_admin, get_current_user
from main import app

@pytest.fixture
def mock_booking_data(db_session):
    client_user = User(
        id=uuid.uuid4(),
        email="booking_client@example.com",
        password_hash="test",
        name="Booking Client",
        is_active=True,
        is_verified=True
    )
    artist_user = User(
        id=uuid.uuid4(),
        email="booking_artist@example.com",
        password_hash="test",
        name="Booking Artist User",
        is_active=True,
        is_verified=True
    )
    admin_user = User(
        id=uuid.uuid4(),
        email="booking_admin@example.com",
        password_hash="test",
        name="Booking Admin",
        is_active=True,
        is_verified=True
    )
    db_session.add_all([client_user, artist_user, admin_user])
    db_session.commit()

    artist_profile = ArtistProfile(
        id=uuid.uuid4(),
        user_id=artist_user.id,
        bio="Test Bio",
        base_rate=200.0,
        rating=5.0,
        verification_status="approved",
        display_name="Booking Artist Performer"
    )
    db_session.add(artist_profile)
    db_session.commit()

    booking = Booking(
        id=uuid.uuid4(),
        client_id=client_user.id,
        artist_profile_id=artist_profile.id,
        event_name="Anniversary Show",
        event_date=datetime.date(2026, 8, 20),
        start_time=datetime.time(19, 0),
        end_time=datetime.time(22, 0),
        location="Hotel Orchid",
        proposed_price=25000.00,
        status="pending",
        timeline=[{
            "status": "pending",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "by": "client",
            "message": "Initialized"
        }]
    )
    db_session.add(booking)
    db_session.commit()

    return {
        "client": client_user,
        "artist_user": artist_user,
        "artist_profile": artist_profile,
        "admin": admin_user,
        "booking": booking
    }

def test_get_client_bookings_list(client, mock_booking_data):
    # Override clientauth dependency
    app.dependency_overrides[get_current_client] = lambda: {
        "sub": str(mock_booking_data["client"].id),
        "role": "client"
    }

    response = client.get("/api/v1/bookings/client")
    assert response.status_code == 200
    res_data = response.json()["data"]

    assert len(res_data["bookings"]) == 1
    assert res_data["bookings"][0]["id"] == str(mock_booking_data["booking"].id)
    assert res_data["bookings"][0]["event_name"] == "Anniversary Show"
    assert res_data["bookings"][0]["artist_profile_id"] == str(mock_booking_data["artist_profile"].id)

    app.dependency_overrides.clear()

def test_admin_get_all_bookings_list(client, mock_booking_data):
    # Override admin auth dependency
    app.dependency_overrides[get_current_admin] = lambda: {
        "sub": str(mock_booking_data["admin"].id),
        "role": "admin"
    }

    response = client.get("/api/v1/admin/bookings")
    assert response.status_code == 200
    res_data = response.json()["data"]

    assert len(res_data["bookings"]) == 1
    assert res_data["bookings"][0]["id"] == str(mock_booking_data["booking"].id)
    assert res_data["bookings"][0]["event_name"] == "Anniversary Show"

    app.dependency_overrides.clear()

def test_admin_resolve_booking_dispute_override(client, mock_booking_data):
    # Override admin auth dependency
    app.dependency_overrides[get_current_admin] = lambda: {
        "sub": str(mock_booking_data["admin"].id),
        "role": "admin"
    }

    payload = {
        "status": "confirmed",
        "message": "Dispute resolved by override."
    }

    url = f"/api/v1/admin/bookings/{mock_booking_data['booking'].id}/dispute"
    response = client.put(url, json=payload)
    assert response.status_code == 200
    res_data = response.json()["data"]

    assert res_data["status"] == "confirmed"
    assert len(res_data["timeline"]) == 2
    assert res_data["timeline"][1]["status"] == "confirmed"
    assert "override" in res_data["timeline"][1]["message"].lower()

    app.dependency_overrides.clear()

def test_admin_view_booking_details(client, mock_booking_data, db_session):
    from app.features.auth.models import Role
    admin_role = Role(id=uuid.uuid4(), name="admin", description="Admin Role")
    db_session.add(admin_role)
    mock_booking_data["admin"].roles.append(admin_role)
    db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: {
        "sub": str(mock_booking_data["admin"].id),
        "role": "admin"
    }

    url = f"/api/v1/bookings/{mock_booking_data['booking'].id}"
    response = client.get(url)
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["id"] == str(mock_booking_data["booking"].id)

    app.dependency_overrides.clear()

def test_admin_cancel_booking(client, mock_booking_data, db_session):
    from app.features.auth.models import Role
    admin_role = db_session.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(id=uuid.uuid4(), name="admin", description="Admin Role")
        db_session.add(admin_role)
        db_session.commit()
    if admin_role not in mock_booking_data["admin"].roles:
        mock_booking_data["admin"].roles.append(admin_role)
        db_session.commit()

    app.dependency_overrides[get_current_user] = lambda: {
        "sub": str(mock_booking_data["admin"].id),
        "role": "admin"
    }

    payload = {
        "reason": "Cancelled by admin due to request"
    }
    url = f"/api/v1/bookings/{mock_booking_data['booking'].id}/cancel"
    response = client.put(url, json=payload)
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["status"] == "cancelled"

    app.dependency_overrides.clear()

