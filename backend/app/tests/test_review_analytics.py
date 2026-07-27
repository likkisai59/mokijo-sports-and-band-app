import uuid
from fastapi import status
from app.features.reviews.models import Review
from app.features.reviews.repository import review_repository
from app.features.reviews.service import review_service
from app.core.dependencies import get_current_admin, get_current_user
from main import app


def test_repository_sql_aggregation(db_session):
    """Test SQL aggregation functions in ReviewRepository."""
    user_id = uuid.uuid4()
    rev1 = Review(
        reviewer_id=user_id,
        reviewee_id=user_id,
        rating=5,
        review_title="Amazing show!",
        review_text="Fantastic acoustic performance",
        is_public=True,
    )
    rev2 = Review(
        reviewer_id=user_id,
        reviewee_id=user_id,
        rating=4,
        review_title="Great experience",
        review_text="Very professional timing",
        is_public=True,
    )
    db_session.add_all([rev1, rev2])
    db_session.commit()

    avg_score = review_repository.get_average_rating(db_session, target_id=user_id)
    assert avg_score == 4.5

    dist = review_repository.get_rating_distribution(db_session, target_id=user_id)
    assert dist[5] == 1
    assert dist[4] == 1
    assert dist[3] == 0

    recent = review_repository.get_recent_reviews(
        db_session, target_id=user_id, limit=5
    )
    assert len(recent) == 2


def test_service_profile_analytics(db_session):
    """Test ReviewService profile analytics formatting."""
    user_id = uuid.uuid4()
    profile_analytics = review_service.get_profile_analytics(db_session, user_id)
    assert hasattr(profile_analytics, "average_rating")
    assert hasattr(profile_analytics, "rating_distribution")
    assert hasattr(profile_analytics, "five_star_ratio")


def test_analytics_router_endpoints_unauthenticated(client):
    """Test public analytics REST endpoints."""
    res_summary = client.get("/api/v1/reviews/summary")
    assert res_summary.status_code == status.HTTP_200_OK
    assert res_summary.json()["success"] is True

    res_stats = client.get("/api/v1/reviews/statistics")
    assert res_stats.status_code == status.HTTP_200_OK
    assert res_stats.json()["success"] is True

    res_top = client.get("/api/v1/reviews/top-rated")
    assert res_top.status_code == status.HTTP_200_OK
    assert res_top.json()["success"] is True

    res_most = client.get("/api/v1/reviews/most-reviewed")
    assert res_most.status_code == status.HTTP_200_OK
    assert res_most.json()["success"] is True

    res_market = client.get("/api/v1/reviews/marketplace")
    assert res_market.status_code == status.HTTP_200_OK
    assert res_market.json()["success"] is True


def test_admin_analytics_rbac_security(client):
    """Test RBAC security on Admin Review Analytics endpoint for non-admin user."""
    app.dependency_overrides[get_current_user] = lambda: {
        "sub": str(uuid.uuid4()),
        "role": "client",
    }
    res_client = client.get("/api/v1/reviews/admin")
    assert res_client.status_code in (
        status.HTTP_401_UNAUTHORIZED,
        status.HTTP_403_FORBIDDEN,
    )
    app.dependency_overrides.clear()


def test_admin_analytics_access(client):
    """Test Admin token access to Admin Review Analytics endpoint."""
    app.dependency_overrides[get_current_admin] = lambda: {
        "sub": str(uuid.uuid4()),
        "role": "admin",
    }
    res_admin = client.get("/api/v1/reviews/admin")
    assert res_admin.status_code == status.HTTP_200_OK
    data = res_admin.json()["data"]
    assert "platform_average_rating" in data
    assert "total_reviews" in data
    assert "top_rated_artists" in data
    app.dependency_overrides.clear()
