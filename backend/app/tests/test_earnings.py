import uuid
import pytest
from app.features.auth.models import User
from app.features.locations.models import Country, State, City
from app.features.artists.models import ArtistProfile
from app.features.venues.models import Venue
from app.core.dependencies import get_current_artist, get_current_venue_owner
from main import app

@pytest.fixture
def mock_auth(db_session):
    client_user = User(
        id=uuid.uuid4(),
        email="client@example.com",
        password_hash="test",
        name="Client User",
        is_active=True,
        is_verified=True
    )
    artist_user = User(
        id=uuid.uuid4(),
        email="artist@example.com",
        password_hash="test",
        name="Artist User",
        is_active=True,
        is_verified=True
    )
    venue_owner_user = User(
        id=uuid.uuid4(),
        email="venue_owner@example.com",
        password_hash="test",
        name="Venue Owner User",
        is_active=True,
        is_verified=True
    )
    db_session.add_all([client_user, artist_user, venue_owner_user])
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
    
    artist_profile = ArtistProfile(
        id=uuid.uuid4(),
        user_id=artist_user.id,
        bio="Test Bio",
        base_rate=100.0,
        rating=5.0,
        verification_status="approved",
        display_name="Test Artist"
    )
    db_session.add(artist_profile)
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
        "client": client_user,
        "artist_user": artist_user,
        "artist_profile": artist_profile,
        "venue_owner": venue_owner_user,
        "venue": venue
    }

def test_get_artist_earnings(client, db_session, mock_auth):
    app.dependency_overrides[get_current_artist] = lambda: {"sub": str(mock_auth["artist_user"].id), "role": "artist"}
    
    response = client.get("/api/v1/earnings/artist")
    assert response.status_code == 200
    res_data = response.json()["data"]
    
    # Check that summary stats automatically seeded mock transactions
    assert res_data["total_earnings"] > 0.0
    assert len(res_data["transactions"]) > 0
    assert res_data["wallet_balance"] == 35000.0  # (15000 + 25000 credit) - 5000 debit
    assert res_data["pending_payments"] == 12000.0
    
    app.dependency_overrides.clear()

def test_get_venue_earnings(client, db_session, mock_auth):
    app.dependency_overrides[get_current_venue_owner] = lambda: {"sub": str(mock_auth["venue_owner"].id), "role": "venue_owner"}
    
    response = client.get("/api/v1/earnings/venue")
    assert response.status_code == 200
    res_data = response.json()["data"]
    
    assert res_data["total_earnings"] > 0.0
    assert len(res_data["transactions"]) > 0
    assert res_data["wallet_balance"] == 67000.0  # (45000 + 32000 credit) - 10000 debit
    assert res_data["pending_payments"] == 18000.0
    
    app.dependency_overrides.clear()
