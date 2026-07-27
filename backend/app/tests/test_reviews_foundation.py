import uuid
import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.features.auth.models import User
from app.features.reviews.models import Review
from app.features.reviews.repository import review_repository
from app.features.reviews.service import review_service
from app.features.reviews.schemas import (
    CreateReviewRequest,
    UpdateReviewRequest,
    ReviewFilters,
)
from app.core.exceptions import BadRequestException
from app.core.dependencies import get_current_user
from main import app


@pytest.fixture
def test_users(db_session: Session):
    user1 = User(
        id=uuid.uuid4(),
        email="reviewer@example.com",
        password_hash="hashed_pw",
        name="Reviewer User",
        is_active=True,
        is_verified=True,
    )
    user2 = User(
        id=uuid.uuid4(),
        email="reviewee@example.com",
        password_hash="hashed_pw",
        name="Reviewee User",
        is_active=True,
        is_verified=True,
    )
    admin = User(
        id=uuid.uuid4(),
        email="admin_review@example.com",
        password_hash="hashed_pw",
        name="Admin Review User",
        is_active=True,
        is_verified=True,
    )
    db_session.add_all([user1, user2, admin])
    db_session.commit()
    return {"reviewer": user1, "reviewee": user2, "admin": admin}


def test_review_repository_crud(db_session: Session, test_users: dict):
    reviewer = test_users["reviewer"]
    reviewee = test_users["reviewee"]

    # 1. Create review entity
    review = Review(
        reviewer_id=reviewer.id,
        reviewer_role="client",
        reviewee_id=reviewee.id,
        reviewee_role="artist",
        rating=5,
        review_title="Fantastic Performance",
        review_text="The live band performance was amazing!",
        is_public=True,
    )
    db_session.add(review)
    db_session.commit()
    db_session.refresh(review)

    assert review.id is not None
    assert review.rating == 5

    # 2. Get by ID
    fetched = review_repository.get_by_id(db_session, review.id)
    assert fetched is not None
    assert fetched.review_title == "Fantastic Performance"

    # 3. Filter reviews
    filters = ReviewFilters(reviewer_id=reviewer.id, rating=5)
    items, total = review_repository.filter_reviews(db_session, filters=filters)
    assert total >= 1
    assert items[0].id == review.id

    # 4. Soft delete
    deleted = review_repository.soft_delete(db_session, review.id)
    assert deleted.deleted_at is not None
    assert review_repository.get_by_id(db_session, review.id) is None


def test_review_service_validation(db_session: Session, test_users: dict):
    reviewer = test_users["reviewer"]
    reviewee = test_users["reviewee"]

    # Rating boundary check (<1 or >5) triggers Pydantic schema validation or service exception
    with pytest.raises((BadRequestException, ValidationError)):
        CreateReviewRequest(
            reviewee_id=reviewee.id,
            rating=6,
            review_title="Invalid Rating",
            review_text="Too high rating score",
        )

    # Valid creation via service
    valid_request = CreateReviewRequest(
        reviewee_id=reviewee.id,
        rating=4,
        review_title="Great Gig",
        review_text="Great music and crowd engagement.",
    )
    created = review_service.create_review(
        db_session, reviewer.id, "client", valid_request
    )
    assert created.rating == 4
    assert created.review_title == "Great Gig"

    # Update review
    update_req = UpdateReviewRequest(rating=5, review_title="Updated Excellent Gig")
    updated = review_service.update_review(
        db_session, reviewer.id, created.id, update_req
    )
    assert updated.rating == 5
    assert updated.review_title == "Updated Excellent Gig"


def test_review_router_endpoints(
    client: TestClient, db_session: Session, test_users: dict
):
    reviewer = test_users["reviewer"]
    reviewee = test_users["reviewee"]

    app.dependency_overrides[get_current_user] = lambda: {
        "sub": str(reviewer.id),
        "role": "client",
    }

    try:
        # 1. POST /api/v1/reviews
        payload = {
            "reviewee_id": str(reviewee.id),
            "reviewee_role": "artist",
            "rating": 5,
            "review_title": "Outstanding Performance",
            "review_text": "Exceeded all our expectations!",
            "is_public": True,
        }
        resp = client.post("/api/v1/reviews", json=payload)
        assert resp.status_code == 201
        res_data = resp.json()["data"]
        review_id = res_data["id"]
        assert res_data["rating"] == 5
        assert res_data["review_title"] == "Outstanding Performance"

        # 2. GET /api/v1/reviews
        get_resp = client.get("/api/v1/reviews?rating=5")
        assert get_resp.status_code == 200
        items = get_resp.json()["data"]["items"]
        assert len(items) >= 1

        # 3. GET /api/v1/reviews/{id}
        detail_resp = client.get(f"/api/v1/reviews/{review_id}")
        assert detail_resp.status_code == 200
        assert detail_resp.json()["data"]["id"] == review_id

        # 4. PUT /api/v1/reviews/{id}
        put_resp = client.put(
            f"/api/v1/reviews/{review_id}",
            json={"rating": 4, "review_title": "Revised Rating"},
        )
        assert put_resp.status_code == 200
        assert put_resp.json()["data"]["rating"] == 4

        # 5. DELETE /api/v1/reviews/{id}
        del_resp = client.delete(f"/api/v1/reviews/{review_id}")
        assert del_resp.status_code == 200

    finally:
        app.dependency_overrides.clear()
