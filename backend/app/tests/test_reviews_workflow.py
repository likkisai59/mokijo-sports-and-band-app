import uuid
import pytest
from datetime import date, time
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.features.auth.models import User
from app.features.artists.models import ArtistProfile
from app.features.bookings.models import Booking
from app.features.reviews.service import review_service
from app.features.reviews.schemas import CreateReviewRequest
from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    ConflictException,
)
from app.core.dependencies import get_current_user
from main import app


@pytest.fixture
def workflow_setup(db_session: Session):
    client_user = User(
        id=uuid.uuid4(),
        email="client_wf@example.com",
        password_hash="hashed",
        name="Client Workflow User",
        is_active=True,
        is_verified=True,
    )
    artist_user = User(
        id=uuid.uuid4(),
        email="artist_wf@example.com",
        password_hash="hashed",
        name="Artist Workflow User",
        is_active=True,
        is_verified=True,
    )
    outsider_user = User(
        id=uuid.uuid4(),
        email="outsider_wf@example.com",
        password_hash="hashed",
        name="Outsider User",
        is_active=True,
        is_verified=True,
    )
    db_session.add_all([client_user, artist_user, outsider_user])
    db_session.commit()

    artist_profile = ArtistProfile(
        id=uuid.uuid4(),
        user_id=artist_user.id,
        display_name="Workflow Artist",
        verification_status="approved",
    )
    db_session.add(artist_profile)
    db_session.commit()

    # Completed booking
    completed_booking = Booking(
        id=uuid.uuid4(),
        artist_profile_id=artist_profile.id,
        client_id=client_user.id,
        event_name="Completed Concert",
        event_date=date.today(),
        start_time=time(18, 0),
        end_time=time(21, 0),
        location="Main Stage",
        proposed_price=1000.0,
        status="completed",
    )

    # Pending booking (Non-completed)
    pending_booking = Booking(
        id=uuid.uuid4(),
        artist_profile_id=artist_profile.id,
        client_id=client_user.id,
        event_name="Pending Gig",
        event_date=date.today(),
        start_time=time(18, 0),
        end_time=time(21, 0),
        location="Side Stage",
        proposed_price=500.0,
        status="pending",
    )
    db_session.add_all([completed_booking, pending_booking])
    db_session.commit()

    return {
        "client": client_user,
        "artist_user": artist_user,
        "outsider": outsider_user,
        "artist_profile": artist_profile,
        "completed_booking": completed_booking,
        "pending_booking": pending_booking,
    }


def test_completed_booking_review_workflow(db_session: Session, workflow_setup: dict):
    client_user = workflow_setup["client"]
    artist_user = workflow_setup["artist_user"]
    completed_booking = workflow_setup["completed_booking"]

    # 1. Eligibility Check
    eligibility = review_service.check_eligibility(
        db_session, client_user.id, completed_booking.id
    )
    assert eligibility.eligible is True
    assert eligibility.already_reviewed is False

    # 2. Client submits review for Completed Booking
    req = CreateReviewRequest(
        booking_id=completed_booking.id,
        reviewee_id=artist_user.id,
        reviewee_role="artist",
        rating=5,
        review_title="Superb Performance",
        review_text="Punctual, energetic, and highly professional!",
    )
    review = review_service.create_review(db_session, client_user.id, "client", req)
    assert review.id is not None
    assert review.rating == 5

    # 3. Duplicate Review Prevention (Must raise ConflictException 409)
    with pytest.raises(ConflictException):
        review_service.create_review(db_session, client_user.id, "client", req)


def test_non_completed_booking_review_rejected(
    db_session: Session, workflow_setup: dict
):
    client_user = workflow_setup["client"]
    artist_user = workflow_setup["artist_user"]
    pending_booking = workflow_setup["pending_booking"]

    # Attempting to review a PENDING booking must raise BadRequestException
    req = CreateReviewRequest(
        booking_id=pending_booking.id,
        reviewee_id=artist_user.id,
        rating=4,
        review_text="Premature review",
    )
    with pytest.raises(BadRequestException):
        review_service.create_review(db_session, client_user.id, "client", req)


def test_non_participant_review_rejected(db_session: Session, workflow_setup: dict):
    outsider = workflow_setup["outsider"]
    artist_user = workflow_setup["artist_user"]
    completed_booking = workflow_setup["completed_booking"]

    # Outsider user attempting to review a booking they didn't participate in raises ForbiddenException
    req = CreateReviewRequest(
        booking_id=completed_booking.id,
        reviewee_id=artist_user.id,
        rating=5,
        review_text="Fake review",
    )
    with pytest.raises(ForbiddenException):
        review_service.create_review(db_session, outsider.id, "client", req)


def test_workflow_router_endpoints(
    client: TestClient, db_session: Session, workflow_setup: dict
):
    client_user = workflow_setup["client"]
    completed_booking = workflow_setup["completed_booking"]
    artist_user = workflow_setup["artist_user"]

    app.dependency_overrides[get_current_user] = lambda: {
        "sub": str(client_user.id),
        "role": "client",
    }

    try:
        # GET /api/v1/reviews/eligibility/{booking_id}
        el_resp = client.get(f"/api/v1/reviews/eligibility/{completed_booking.id}")
        assert el_resp.status_code == 200
        assert el_resp.json()["data"]["eligible"] is True

        # POST /api/v1/reviews
        post_resp = client.post(
            "/api/v1/reviews",
            json={
                "booking_id": str(completed_booking.id),
                "reviewee_id": str(artist_user.id),
                "rating": 5,
                "review_title": "Top Notch Gig",
                "review_text": "Loved the live music set!",
            },
        )
        assert post_resp.status_code == 201

        # Duplicate POST /api/v1/reviews -> HTTP 409 Conflict
        dup_resp = client.post(
            "/api/v1/reviews",
            json={
                "booking_id": str(completed_booking.id),
                "reviewee_id": str(artist_user.id),
                "rating": 5,
                "review_text": "Duplicate attempt",
            },
        )
        assert dup_resp.status_code == 409

        # GET /api/v1/reviews/me
        me_resp = client.get("/api/v1/reviews/me")
        assert me_resp.status_code == 200
        assert len(me_resp.json()["data"]["items"]) >= 1

    finally:
        app.dependency_overrides.clear()
