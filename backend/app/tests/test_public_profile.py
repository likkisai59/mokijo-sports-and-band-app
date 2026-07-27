import uuid
import pytest
from app.features.auth.models import User
from app.features.locations.models import Country, State, City
from app.features.venues.models import Venue
from app.features.reviews.models import Review

@pytest.fixture
def mock_venue(db_session):
    owner = User(
        id=uuid.uuid4(),
        email="venue_owner@example.com",
        password_hash="test",
        name="Venue Owner",
        is_active=True,
        is_verified=True
    )
    db_session.add(owner)
    db_session.commit()
    
    country = Country(id=uuid.uuid4(), name="Test Country", code="TC")
    db_session.add(country)
    state = State(id=uuid.uuid4(), name="Test State", country_id=country.id)
    db_session.add(state)
    city = City(id=uuid.uuid4(), name="Test City", state_id=state.id)
    db_session.add(city)
    db_session.commit()

    venue = Venue(
        id=uuid.uuid4(),
        user_id=owner.id,
        name="Plaza Hall",
        description="A beautiful event hall.",
        address="789 Avenue Road",
        city_id=city.id,
        base_price=1200.0,
        capacity=300,
        facilities=["av_system", "parking", "green_room"],
        pricing_details={"hourly_price": 150.0},
        availability_rules={"weekly_schedule": {}},
        verification_status="approved"
    )
    db_session.add(venue)
    db_session.commit()

    # Add a mock review
    client_user = User(
        id=uuid.uuid4(),
        email="client@example.com",
        password_hash="test",
        name="Client User",
        is_active=True,
        is_verified=True
    )
    db_session.add(client_user)
    db_session.commit()

    review = Review(
        id=uuid.uuid4(),
        venue_id=venue.id,
        client_id=client_user.id,
        rating=5,
        comment="Absolutely fantastic space, highly recommended!"
    )
    db_session.add(review)
    db_session.commit()

    return {
        "venue": venue,
        "review": review
    }

def test_get_public_venue_detail(client, mock_venue):
    response = client.get(f"/api/v1/venues/{mock_venue['venue'].id}")
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["name"] == "Plaza Hall"
    assert res_data["address"] == "789 Avenue Road"
    assert "av_system" in res_data["facilities"]

def test_get_public_venue_reviews(client, mock_venue):
    response = client.get(f"/api/v1/reviews/public/venue/{mock_venue['venue'].id}")
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["average_rating"] == 5.0
    assert res_data["total_reviews"] == 1
    assert len(res_data["reviews"]) == 1
    assert res_data["reviews"][0]["comment"] == "Absolutely fantastic space, highly recommended!"

def test_artist_public_marketplace_search_and_security(client, db_session):
    from app.features.artists.models import ArtistProfile
    from app.core.dependencies import get_current_user
    from main import app

    # Create mock artist user
    artist_user = User(
        id=uuid.uuid4(),
        email="artist_marketplace@example.com",
        password_hash="test",
        name="Rhythm Collective",
        is_active=True,
        is_verified=True
    )
    db_session.add(artist_user)
    db_session.commit()

    # Create approved artist profile with sensitive documents
    artist = ArtistProfile(
        id=uuid.uuid4(),
        user_id=artist_user.id,
        bio="Energetic rock band in Bangalore",
        base_rate=20000.0,
        rating=4.9,
        verification_status="approved",
        display_name="rhythmcollective",
        mobile_number="+919876543210",
        city="Bangalore",
        state="Karnataka",
        band_type="5+ Members",
        total_members=5,
        years_of_experience=5,
        currency="INR",
        travel_radius=100.0,
        travel_charges=2000.0,
        min_booking_hours=2.0,
        max_booking_hours=6.0,
        documents={"aadhaar_number": "1234-5678-9012", "doc_govt_id": "https://example.com/aadhaar.pdf"},
        gallery=["https://example.com/photo1.jpg"],
        videos=["https://example.com/video1.mp4"]
    )
    db_session.add(artist)
    db_session.commit()

    # Create pending/unapproved artist profile to verify filter excludes it
    pending_user = User(
        id=uuid.uuid4(),
        email="pending_artist@example.com",
        password_hash="test",
        name="Pending Performer",
        is_active=True,
        is_verified=True
    )
    db_session.add(pending_user)
    db_session.commit()

    pending_artist = ArtistProfile(
        id=uuid.uuid4(),
        user_id=pending_user.id,
        bio="Acoustic singer",
        base_rate=5000.0,
        rating=5.0,
        verification_status="pending",
        display_name="pendingperformer",
        city="Bangalore",
        total_members=1,
        years_of_experience=2,
        currency="INR",
        travel_radius=50.0,
        travel_charges=500.0,
        min_booking_hours=1.0,
        max_booking_hours=4.0,
        documents={"aadhaar_number": "9999-8888-7777"}
    )
    db_session.add(pending_artist)
    db_session.commit()

    # 1. Search approved artist
    response = client.get("/api/v1/artists?search=Rhythm")
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["total"] == 1
    assert res_data["items"][0]["display_name"] == "rhythmcollective"
    # Ensure sensitive documents and mobile number are hidden in public search results!
    assert res_data["items"][0]["documents"] is None
    assert res_data["items"][0]["mobile_number"] is None

    # 2. Filter by performer type
    response = client.get("/api/v1/artists?performer_type=5%2B%20Members")
    assert response.status_code == 200
    assert response.json()["data"]["total"] == 1

    response = client.get("/api/v1/artists?performer_type=Solo")
    assert response.status_code == 200
    assert response.json()["data"]["total"] == 0

    # 3. Filter by city
    response = client.get("/api/v1/artists?city=Bangalore")
    assert response.status_code == 200
    assert response.json()["data"]["total"] == 1

    # 4. Filter by rate range
    response = client.get("/api/v1/artists?min_rate=15000&max_rate=25000")
    assert response.status_code == 200
    assert response.json()["data"]["total"] == 1

    # 5. Detail endpoint
    response = client.get(f"/api/v1/artists/{artist.id}")
    assert response.status_code == 200
    detail = response.json()["data"]
    assert detail["display_name"] == "rhythmcollective"
    # Ensure sensitive documents and mobile number are hidden in public detail endpoint!
    assert detail["documents"] is None
    assert detail["mobile_number"] is None

    # 6. Query me (authenticated owner) -> Should show private documents & mobile number!
    app.dependency_overrides[get_current_user] = lambda: {"sub": str(artist_user.id), "role": "artist"}
    response = client.get("/api/v1/artists/me")
    assert response.status_code == 200
    me_detail = response.json()["data"]
    assert me_detail["documents"]["aadhaar_number"] == "1234-5678-9012"
    assert me_detail["mobile_number"] == "+919876543210"
    app.dependency_overrides.clear()

def test_venue_public_marketplace_search_and_security(client, db_session, mock_venue):
    # The mock_venue has verification_status='approved'. Let's set up documents
    venue = mock_venue["venue"]
    venue.documents = {"registration_proof": "https://example.com/reg.pdf"}
    db_session.add(venue)
    db_session.commit()

    # 1. Search approved venue
    response = client.get("/api/v1/venues?search=Plaza")
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["total"] == 1
    assert res_data["items"][0]["name"] == "Plaza Hall"
    # Ensure sensitive documents are hidden in public search results!
    assert res_data["items"][0]["documents"] == {}

    # 2. Detail endpoint
    response = client.get(f"/api/v1/venues/{venue.id}")
    assert response.status_code == 200
    detail = response.json()["data"]
    assert detail["name"] == "Plaza Hall"
    # Ensure sensitive documents are hidden in public detail endpoint!
    assert detail["documents"] == {}

    # 3. Test capacity filtering
    response = client.get("/api/v1/venues?capacity=200")
    assert response.status_code == 200
    assert response.json()["data"]["total"] == 1

    response = client.get("/api/v1/venues?capacity=400")
    assert response.status_code == 200
    assert response.json()["data"]["total"] == 0
