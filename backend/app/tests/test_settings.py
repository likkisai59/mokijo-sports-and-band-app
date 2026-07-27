import uuid
import pytest
from app.features.auth.models import User
from app.features.locations.models import Country, State, City
from app.features.venues.models import Venue
from app.core.dependencies import get_current_user
from app.core.security import get_password_hash
from main import app

@pytest.fixture
def mock_auth(db_session):
    venue_owner_user = User(
        id=uuid.uuid4(),
        email="venue_owner@example.com",
        password_hash=get_password_hash("Oldpassword123!"),
        name="Venue Owner User",
        is_active=True,
        is_verified=True
    )
    db_session.add(venue_owner_user)
    db_session.commit()
    
    # Location
    country = Country(id=uuid.uuid4(), name="Test Country", code="TC")
    db_session.add(country)
    db_session.commit()
    
    state = State(id=uuid.uuid4(), name="Test State", country_id=country.id)
    db_session.add(state)
    db_session.commit()
    
    city = City(id=uuid.uuid4(), name="Test City", state_id=state.id)
    db_session.add(city)
    db_session.commit()
    
    venue = Venue(
        id=uuid.uuid4(),
        user_id=venue_owner_user.id,
        name="Test Venue",
        description="Test Desc",
        address="123 Street",
        city_id=city.id,
        base_price=500.0,
        capacity=100,
        verification_status="pending",
        metadata_fields={}
    )
    db_session.add(venue)
    db_session.commit()

    return {
        "venue_owner": venue_owner_user,
        "venue": venue
    }

def test_change_user_password(client, db_session, mock_auth):
    app.dependency_overrides[get_current_user] = lambda: {"sub": str(mock_auth["venue_owner"].id), "role": "venue_owner"}
    
    payload = {
        "old_password": "Oldpassword123!",
        "new_password": "Newpassword123!"
    }
    response = client.post("/api/v1/auth/change-password", json=payload)
    assert response.status_code == 200
    
    # Verify login with new password
    login_payload = {
        "email": "venue_owner@example.com",
        "password": "Newpassword123!"
    }
    login_response = client.post("/api/v1/auth/login", json=login_payload)
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()["data"]
    
    app.dependency_overrides.clear()

def test_update_venue_settings(client, db_session, mock_auth):
    app.dependency_overrides[get_current_user] = lambda: {"sub": str(mock_auth["venue_owner"].id), "role": "venue_owner"}
    
    payload = {
        "is_deactivated": True,
        "email_alerts": False,
        "sms_alerts": True,
        "profile_visible": False
    }
    response = client.put("/api/v1/venues/me/settings", json=payload)
    assert response.status_code == 200
    
    # Verify metadata fields updated
    db_session.refresh(mock_auth["venue"])
    settings = mock_auth["venue"].metadata_fields.get("settings", {})
    assert settings["is_deactivated"] is True
    assert settings["email_alerts"] is False
    assert settings["sms_alerts"] is True
    assert settings["profile_visible"] is False
    
    app.dependency_overrides.clear()

def test_delete_own_user(client, db_session, mock_auth):
    app.dependency_overrides[get_current_user] = lambda: {"sub": str(mock_auth["venue_owner"].id), "role": "venue_owner"}
    
    response = client.delete("/api/v1/auth/me")
    assert response.status_code == 200
    
    # Verify user marked deleted
    db_session.refresh(mock_auth["venue_owner"])
    assert mock_auth["venue_owner"].deleted_at is not None
    
    app.dependency_overrides.clear()
