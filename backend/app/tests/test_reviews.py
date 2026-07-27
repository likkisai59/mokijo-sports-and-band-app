import uuid
import pytest
from app.features.auth.models import User
from app.features.locations.models import Country, State, City
from app.features.artists.models import ArtistProfile
from app.features.venues.models import Venue
from app.features.reviews.models import Review
from app.core.dependencies import get_current_artist, get_current_venue_owner
from main import app


@pytest.fixture
def mock_auth(db_session):
    # Create test users
    client_user = User(
        id=uuid.uuid4(),
        email="client@example.com",
        password_hash="test",
        name="Client User",
        is_active=True,
        is_verified=True,
    )
    artist_user = User(
        id=uuid.uuid4(),
        email="artist@example.com",
        password_hash="test",
        name="Artist User",
        is_active=True,
        is_verified=True,
    )
    venue_owner_user = User(
        id=uuid.uuid4(),
        email="venue_owner@example.com",
        password_hash="test",
        name="Venue Owner User",
        is_active=True,
        is_verified=True,
    )

    db_session.add_all([client_user, artist_user, venue_owner_user])
    db_session.commit()

    # Create location
    country = Country(id=uuid.uuid4(), name="Test Country", code="TC")
    db_session.add(country)
    db_session.commit()

    state = State(id=uuid.uuid4(), name="Test State", country_id=country.id)
    db_session.add(state)
    db_session.commit()

    city = City(id=uuid.uuid4(), name="Test City", state_id=state.id)
    db_session.add(city)
    db_session.commit()

    # Create artist profile
    artist_profile = ArtistProfile(
        id=uuid.uuid4(),
        user_id=artist_user.id,
        bio="Test Bio",
        base_rate=100.0,
        rating=5.0,
        verification_status="approved",
        display_name="Test Artist",
    )
    db_session.add(artist_profile)
    db_session.commit()

    # Create venue
    venue = Venue(
        id=uuid.uuid4(),
        user_id=venue_owner_user.id,
        name="Test Venue",
        description="Test Desc",
        address="123 Street",
        city_id=city.id,
        base_price=500.0,
        capacity=100,
        verification_status="approved",
    )
    db_session.add(venue)
    db_session.commit()

    return {
        "client": client_user,
        "artist_user": artist_user,
        "artist_profile": artist_profile,
        "venue_owner": venue_owner_user,
        "venue": venue,
    }


def test_get_artist_reviews(client, db_session, mock_auth):
    # Setup dependency overrides for auth
    app.dependency_overrides[get_current_artist] = lambda: {
        "sub": str(mock_auth["artist_user"].id),
        "role": "artist",
    }

    # Add dummy reviews
    r1 = Review(
        id=uuid.uuid4(),
        artist_profile_id=mock_auth["artist_profile"].id,
        client_id=mock_auth["client"].id,
        rating=5,
        comment="Amazing performance!",
        images=[],
        videos=[],
    )
    r2 = Review(
        id=uuid.uuid4(),
        artist_profile_id=mock_auth["artist_profile"].id,
        client_id=mock_auth["client"].id,
        rating=4,
        comment="Great music, but started a bit late.",
        images=[],
        videos=[],
    )
    db_session.add_all([r1, r2])
    db_session.commit()

    response = client.get("/api/v1/reviews/artist")
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["total_reviews"] == 2
    assert len(res_data["reviews"]) == 2
    assert res_data["average_rating"] == 4.5
    assert res_data["rating_distribution"]["5"] == 1
    assert res_data["rating_distribution"]["4"] == 1

    # Cleanup dependency overrides
    app.dependency_overrides.clear()


def test_get_venue_reviews(client, db_session, mock_auth):
    # Setup dependency overrides for auth
    app.dependency_overrides[get_current_venue_owner] = lambda: {
        "sub": str(mock_auth["venue_owner"].id),
        "role": "venue_owner",
    }

    # Add dummy reviews
    r1 = Review(
        id=uuid.uuid4(),
        venue_id=mock_auth["venue"].id,
        client_id=mock_auth["client"].id,
        rating=5,
        comment="Beautiful venue!",
        images=["img1.png"],
        videos=[],
    )
    r2 = Review(
        id=uuid.uuid4(),
        venue_id=mock_auth["venue"].id,
        client_id=mock_auth["client"].id,
        rating=3,
        comment="A bit dusty.",
        images=[],
        videos=[],
    )
    db_session.add_all([r1, r2])
    db_session.commit()

    # 1. Unfiltered request
    response = client.get("/api/v1/reviews/venue")
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["total_reviews"] == 2
    assert len(res_data["reviews"]) == 2
    assert res_data["average_rating"] == 4.0
    assert res_data["reviews"][0]["images"] == ["img1.png"]

    # 2. Filtered request - rating
    response = client.get("/api/v1/reviews/venue?rating=5")
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["total_reviews"] == 1
    assert len(res_data["reviews"]) == 1
    assert res_data["reviews"][0]["rating"] == 5

    # 3. Filtered request - search
    response = client.get("/api/v1/reviews/venue?search=dusty")
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["total_reviews"] == 1
    assert len(res_data["reviews"]) == 1
    assert "dusty" in res_data["reviews"][0]["comment"]

    # Cleanup dependency overrides
    app.dependency_overrides.clear()


def test_reply_to_venue_review(client, db_session, mock_auth):
    # Setup dependency overrides for auth
    app.dependency_overrides[get_current_venue_owner] = lambda: {
        "sub": str(mock_auth["venue_owner"].id),
        "role": "venue_owner",
    }

    # Add dummy review
    r1 = Review(
        id=uuid.uuid4(),
        venue_id=mock_auth["venue"].id,
        client_id=mock_auth["client"].id,
        rating=5,
        comment="Perfect location",
        images=[],
        videos=[],
    )
    db_session.add(r1)
    db_session.commit()

    # Reply to review
    response = client.put(
        f"/api/v1/reviews/venue/{r1.id}/reply",
        json={"reply_comment": "Thank you so much!"},
    )
    assert response.status_code == 200
    res_data = response.json()["data"]
    assert res_data["reply_comment"] == "Thank you so much!"
    assert res_data["reply_at"] is not None

    # Verify venue metadata updated with avg_rating
    db_session.refresh(mock_auth["venue"])
    assert mock_auth["venue"].metadata_fields.get("average_rating") == 5.0

    # Cleanup dependency overrides
    app.dependency_overrides.clear()
