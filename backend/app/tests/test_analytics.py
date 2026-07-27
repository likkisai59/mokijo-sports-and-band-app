import uuid
import pytest
from app.features.auth.models import User
from app.features.locations.models import Country, State, City
from app.features.venues.models import Venue
from app.core.dependencies import get_current_user
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
        verification_status="approved"
    )
    db_session.add(venue)
    db_session.commit()

    return {
        "venue_owner": venue_owner_user,
        "venue": venue
    }

def test_get_venue_analytics(client, db_session, mock_auth):
    app.dependency_overrides[get_current_user] = lambda: {"sub": str(mock_auth["venue_owner"].id), "role": "venue_owner"}
    
    response = client.get("/api/v1/venues/me/analytics")
    assert response.status_code == 200
    res_data = response.json()["data"]
    
    assert res_data["total_bookings"] == 24
    assert res_data["occupancy_rate"] == 40.0
    assert len(res_data["revenue_chart"]) == 6
    assert len(res_data["booking_chart"]) == 6
    assert len(res_data["occupancy_chart"]) == 6
    assert len(res_data["popular_event_types"]) > 0
    assert len(res_data["top_clients"]) > 0
    assert len(res_data["top_cities"]) > 0
    assert len(res_data["peak_seasons"]) > 0
    
    app.dependency_overrides.clear()
