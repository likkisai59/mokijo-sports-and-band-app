import uuid
import pytest
from fastapi import status
from app.features.reviews.models import Review
from app.features.reviews.repository import review_moderation_history_repository
from app.features.reviews.service import review_service
from app.features.auth.models import User
from app.core.dependencies import get_current_admin, get_current_user
from main import app


def test_create_review_report_success(db_session):
    """Test user creating a report for an inappropriate review."""
    reviewer_id = uuid.uuid4()
    reporter_id = uuid.uuid4()

    rev = Review(
        reviewer_id=reviewer_id,
        reviewee_id=reviewer_id,
        rating=1,
        review_title="Terrible service",
        review_text="Contains abusive words",
        is_public=True,
        moderation_status="public",
    )
    db_session.add(rev)
    db_session.commit()

    report = review_service.report_review(
        db_session,
        user_id=reporter_id,
        review_id=rev.id,
        data=type(
            "ReportData",
            (),
            {"reason": "Abusive Language", "description": "Abusive content"},
        )(),
    )

    assert report is not None
    assert report.reason == "Abusive Language"
    assert report.status == "pending"
    assert rev.moderation_status == "flagged"


def test_self_report_prevention(db_session):
    """Test business rule: users cannot report their own reviews."""
    author_id = uuid.uuid4()

    rev = Review(
        reviewer_id=author_id,
        client_id=author_id,
        rating=5,
        review_title="Self review",
        review_text="My own post",
        is_public=True,
    )
    db_session.add(rev)
    db_session.commit()

    with pytest.raises(Exception) as exc_info:
        review_service.report_review(
            db_session,
            user_id=author_id,
            review_id=rev.id,
            data=type(
                "ReportData", (), {"reason": "Spam", "description": "Self report test"}
            )(),
        )
    assert "cannot report their own reviews" in str(exc_info.value)


def test_duplicate_report_prevention(db_session):
    """Test business rule: prevent duplicate active reports by the same user for a review."""
    reviewer_id = uuid.uuid4()
    reporter_id = uuid.uuid4()

    rev = Review(
        reviewer_id=reviewer_id,
        rating=1,
        review_title="Spam post",
        review_text="Buy fake tokens",
        is_public=True,
    )
    db_session.add(rev)
    db_session.commit()

    # First report succeeds
    review_service.report_review(
        db_session,
        user_id=reporter_id,
        review_id=rev.id,
        data=type("ReportData", (), {"reason": "Spam", "description": "Spam advert"})(),
    )

    # Second report raises ConflictException
    with pytest.raises(Exception) as exc_info:
        review_service.report_review(
            db_session,
            user_id=reporter_id,
            review_id=rev.id,
            data=type(
                "ReportData",
                (),
                {"reason": "Spam", "description": "Spam advert duplicate"},
            )(),
        )
    assert "already submitted a report" in str(exc_info.value)


def test_admin_hide_and_restore_moderation_flow(db_session):
    """Test Admin hide review, restore review, and history audit trail creation."""
    admin_user = User(
        id=uuid.uuid4(),
        email="admin@example.com",
        password_hash="test",
        name="Admin User",
        is_active=True,
        is_verified=True,
    )
    rev_user = User(
        id=uuid.uuid4(),
        email="rev@example.com",
        password_hash="test",
        name="Review Author",
        is_active=True,
        is_verified=True,
    )
    db_session.add_all([admin_user, rev_user])
    db_session.commit()

    rev = Review(
        reviewer_id=rev_user.id,
        rating=1,
        review_title="Flagged review",
        review_text="Potentially policy violating review text",
        is_public=True,
        moderation_status="public",
    )
    db_session.add(rev)
    db_session.commit()

    # Hide review action
    mod_review, report = review_service.moderate_review(
        db=db_session,
        admin_id=admin_user.id,
        review_id=rev.id,
        action="hide",
        moderator_notes="Violates anti-harassment policy",
    )
    assert mod_review.moderation_status == "hidden"

    # Restore review action
    restored_review, report2 = review_service.moderate_review(
        db=db_session,
        admin_id=admin_user.id,
        review_id=rev.id,
        action="restore",
        moderator_notes="Appeal accepted by senior admin",
    )
    assert restored_review.moderation_status == "public"

    histories = review_moderation_history_repository.get_by_review(db_session, rev.id)
    assert len(histories) == 2
    actions = [h.action for h in histories]
    assert "hide" in actions
    assert "restore" in actions


def test_moderation_rbac_protection(client):
    """Test non-admin user getting 403 Forbidden when calling moderation APIs."""
    non_admin_id = str(uuid.uuid4())
    app.dependency_overrides[get_current_user] = lambda: {
        "sub": non_admin_id,
        "role": "client",
    }

    # Non-admin trying to fetch report queue
    res = client.get("/api/v1/reviews/reports")
    assert res.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    app.dependency_overrides.clear()


def test_admin_report_queue_api(client, db_session):
    """Test Admin fetching report queue and moderation dashboard stats."""
    admin_id = str(uuid.uuid4())
    app.dependency_overrides[get_current_admin] = lambda: {
        "sub": admin_id,
        "role": "admin",
    }

    res_reports = client.get("/api/v1/reviews/reports")
    assert res_reports.status_code == status.HTTP_200_OK
    assert res_reports.json()["success"] is True

    res_stats = client.get("/api/v1/reviews/moderation/dashboard")
    assert res_stats.status_code == status.HTTP_200_OK
    assert "pending_reports_count" in res_stats.json()["data"]

    app.dependency_overrides.clear()
