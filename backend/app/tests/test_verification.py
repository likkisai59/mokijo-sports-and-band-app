import uuid
import pytest
from app.features.auth.models import User
from app.features.locations.models import Country, State, City
from app.features.venues.models import Venue
from app.core.dependencies import get_current_user, get_current_admin
from main import app

@pytest.fixture
def mock_auth(db_session):
    venue_owner_user = User(
        id=uuid.uuid4(),
        email="venue_owner@example.com",
        password_hash="test",
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
        verification_status="pending"
    )
    db_session.add(venue)
    db_session.commit()

    return {
        "venue_owner": venue_owner_user,
        "venue": venue
    }

def test_admin_update_verification_status(client, db_session, mock_auth):
    app.dependency_overrides[get_current_admin] = lambda: {"sub": str(mock_auth["venue_owner"].id), "role": "admin"}
    
    payload = {
        "verification_status": "rejected",
        "verification_notes": "Incorrect business license file uploaded."
    }
    response = client.put(f"/api/v1/admin/venues/{mock_auth['venue'].id}/verify", json=payload)
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["verification_status"] == "rejected"
    assert res_data["verification_notes"] == "Incorrect business license file uploaded."
    
    # Verify history is logged
    db_session.refresh(mock_auth["venue"])
    history = mock_auth["venue"].metadata_fields.get("verification_history", [])
    assert len(history) > 0
    assert history[-1]["status"] == "rejected"
    assert history[-1]["notes"] == "Incorrect business license file uploaded."
    
    app.dependency_overrides.clear()

def test_venue_owner_resubmit_documents(client, db_session, mock_auth):
    app.dependency_overrides[get_current_user] = lambda: {"sub": str(mock_auth["venue_owner"].id), "role": "venue_owner"}
    
    payload = {
        "doc_pan": "http://example.com/pan.pdf",
        "doc_gst": "http://example.com/gst.pdf",
        "doc_ownership_proof": "http://example.com/ownership.pdf",
        "doc_government_id": "http://example.com/id.pdf",
        "doc_business_license": "http://example.com/license.pdf"
    }
    response = client.put("/api/v1/venues/me/verification/resubmit", json=payload)
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["verification_status"] == "pending"
    assert res_data["documents"]["doc_pan"] == "http://example.com/pan.pdf"
    assert res_data["documents"]["doc_business_license"] == "http://example.com/license.pdf"
    
    # Verify timeline history is logged
    db_session.refresh(mock_auth["venue"])
    history = mock_auth["venue"].metadata_fields.get("verification_history", [])
    assert len(history) > 0
    assert history[-1]["status"] == "pending"
    assert "resubmitted" in history[-1]["notes"].lower()
    
    app.dependency_overrides.clear()
