from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    get_current_admin,
    get_current_artist,
    get_current_venue_owner,
)
from app.core.exceptions import NotFoundException
from app.utils.response import success_response
from app.features.reviews.schemas import (
    CreateReviewRequest,
    UpdateReviewRequest,
    ReviewFilters,
    ReviewSummaryResponse,
    ReviewReplyRequest,
    ReportReviewRequest,
    ModerationActionRequest,
)
from app.features.reviews.service import review_service
from app.features.artists.models import ArtistProfile
from app.features.venues.models import Venue

router = APIRouter(tags=["Reviews & Ratings"])


# ─── STATIC ENDPOINTS (MUST BE BEFORE /{review_id}) ───────────────────────────


@router.get("/eligibility", status_code=status.HTTP_200_OK)
def check_eligibility(
    booking_id: UUID = Query(
        ..., description="Booking ID to check review eligibility for"
    ),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = UUID(current_user["sub"])
    res = review_service.check_eligibility(
        db, booking_id=booking_id, reviewer_id=user_id
    )
    return success_response(
        data=res.model_dump(mode="json"), message="Eligibility check complete"
    )


@router.get("/eligibility/{booking_id}", status_code=status.HTTP_200_OK)
def check_eligibility_path(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = UUID(current_user["sub"])
    res = review_service.check_eligibility(
        db, booking_id=booking_id, reviewer_id=user_id
    )
    return success_response(
        data=res.model_dump(mode="json"), message="Eligibility check complete"
    )


@router.get("/me", status_code=status.HTTP_200_OK)
def get_my_reviews(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = UUID(current_user["sub"])
    reviews, total = review_service.repository.get_by_reviewer(
        db, reviewer_id=user_id, offset=(page - 1) * limit, limit=limit
    )
    pages = (total + limit - 1) // limit if limit > 0 else 0
    items_data = [
        review_service._map_review_to_response(r).model_dump(mode="json")
        for r in reviews
    ]
    return success_response(
        data={
            "items": items_data,
            "pagination": {
                "total": total,
                "page": page,
                "limit": limit,
                "pages": pages,
            },
        },
        message="Your written reviews retrieved successfully",
    )


@router.get("/summary", status_code=status.HTTP_200_OK)
def get_reviews_summary(
    artist_id: Optional[UUID] = Query(None),
    venue_id: Optional[UUID] = Query(None),
    rating: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    if artist_id:
        res = review_service.get_artist_reviews_summary(
            db, artist_id=artist_id, rating_filter=rating, search_query=search
        )
    elif venue_id:
        res = review_service.get_venue_reviews_summary(
            db, venue_id=venue_id, rating_filter=rating, search_query=search
        )
    else:
        res = ReviewSummaryResponse(
            average_rating=0.0,
            total_reviews=0,
            rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            reviews=[],
        )
    return success_response(
        data=res.model_dump(mode="json"),
        message="Review summary retrieved successfully",
    )


@router.get("/artist", status_code=status.HTTP_200_OK)
def get_artist_reviews(
    rating: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_artist: dict = Depends(get_current_artist),
):
    user_id = UUID(current_artist["sub"])
    art = (
        db.query(ArtistProfile)
        .filter(ArtistProfile.user_id == user_id, ArtistProfile.deleted_at.is_(None))
        .first()
    )
    if not art:
        raise NotFoundException("Artist profile not found.")
    res = review_service.get_artist_reviews_summary(
        db, artist_id=art.id, rating_filter=rating, search_query=search
    )
    return success_response(
        data=res.model_dump(mode="json"),
        message="Artist reviews retrieved successfully",
    )


@router.get("/venue", status_code=status.HTTP_200_OK)
def get_venue_reviews(
    rating: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_venue_owner: dict = Depends(get_current_venue_owner),
):
    user_id = UUID(current_venue_owner["sub"])
    ven = (
        db.query(Venue)
        .filter(Venue.user_id == user_id, Venue.deleted_at.is_(None))
        .first()
    )
    if not ven:
        raise NotFoundException("Venue profile not found.")
    res = review_service.get_venue_reviews_summary(
        db, venue_id=ven.id, rating_filter=rating, search_query=search
    )
    return success_response(
        data=res.model_dump(mode="json"), message="Venue reviews retrieved successfully"
    )


@router.get("/public/venue/{venue_id}", status_code=status.HTTP_200_OK)
def get_public_venue_reviews(
    venue_id: UUID,
    rating: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    res = review_service.get_venue_reviews_summary(
        db, venue_id=venue_id, rating_filter=rating, search_query=search
    )
    return success_response(
        data=res.model_dump(mode="json"),
        message="Public venue reviews retrieved successfully",
    )


@router.get("/statistics", status_code=status.HTTP_200_OK)
def get_reviews_statistics(db: Session = Depends(get_db)):
    res = review_service.get_admin_analytics(db)
    return success_response(
        data=res.model_dump(mode="json"),
        message="Review statistics retrieved successfully",
    )


@router.get("/dashboard", status_code=status.HTTP_200_OK)
def get_dashboard_review_analytics(
    db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)
):
    user_id = UUID(current_user["sub"])
    role = current_user.get("role", "client")
    res = review_service.get_dashboard_analytics(db, user_id=user_id, role=role)
    return success_response(
        data=res.model_dump(mode="json"), message="Dashboard review analytics retrieved"
    )


@router.get("/admin", status_code=status.HTTP_200_OK)
def get_admin_review_analytics(
    db: Session = Depends(get_db), current_admin: dict = Depends(get_current_admin)
):
    res = review_service.get_admin_analytics(db)
    return success_response(
        data=res.model_dump(mode="json"), message="Admin review analytics retrieved"
    )


@router.get("/marketplace", status_code=status.HTTP_200_OK)
def get_marketplace_review_analytics(db: Session = Depends(get_db)):
    res = review_service.get_marketplace_analytics(db)
    return success_response(
        data=res.model_dump(mode="json"),
        message="Marketplace review analytics retrieved",
    )


@router.get("/top-rated", status_code=status.HTTP_200_OK)
def get_top_rated_entities(db: Session = Depends(get_db)):
    res = review_service.get_marketplace_analytics(db)
    return success_response(
        data={
            "top_artists": [
                a.model_dump(mode="json") for a in res.highest_rated_artists
            ],
            "top_venues": [v.model_dump(mode="json") for v in res.highest_rated_venues],
        },
        message="Top rated entities retrieved",
    )


@router.get("/most-reviewed", status_code=status.HTTP_200_OK)
def get_most_reviewed_entities(db: Session = Depends(get_db)):
    res = review_service.get_marketplace_analytics(db)
    return success_response(
        data={
            "most_reviewed_artists": [
                a.model_dump(mode="json") for a in res.most_reviewed_artists
            ],
            "most_reviewed_venues": [
                v.model_dump(mode="json") for v in res.most_reviewed_venues
            ],
        },
        message="Most reviewed entities retrieved",
    )


@router.get("/recent", status_code=status.HTTP_200_OK)
def get_recent_reviews(
    target_id: Optional[UUID] = Query(None),
    limit: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db),
):
    recent = review_service.repository.get_recent_reviews(
        db, target_id=target_id, limit=limit
    )
    return success_response(
        data=[
            review_service._map_review_to_response(r).model_dump(mode="json")
            for r in recent
        ],
        message="Recent reviews retrieved",
    )


# ─── MODERATION STATIC ENDPOINTS (PHASE 5) ───────────────────────────────


@router.get("/reports", status_code=status.HTTP_200_OK)
def list_review_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    reason_filter: Optional[str] = Query(None, alias="reason"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    reports, total = review_service.list_reports(
        db,
        status_filter=status_filter,
        reason_filter=reason_filter,
        page=page,
        limit=limit,
    )
    pages = (total + limit - 1) // limit if limit > 0 else 0

    items_data = []
    for rep in reports:
        rep_dict = {
            "id": str(rep.id),
            "review_id": str(rep.review_id),
            "reported_by": str(rep.reported_by),
            "reason": rep.reason,
            "description": rep.description,
            "status": rep.status,
            "assigned_admin_id": str(rep.assigned_admin_id)
            if rep.assigned_admin_id
            else None,
            "resolved_at": rep.resolved_at.isoformat() if rep.resolved_at else None,
            "created_at": rep.created_at.isoformat() if rep.created_at else None,
            "updated_at": rep.updated_at.isoformat() if rep.updated_at else None,
            "review": review_service._map_review_to_response(rep.review).model_dump(
                mode="json"
            )
            if rep.review
            else None,
            "reporter": {
                "id": str(rep.reporter.id),
                "name": rep.reporter.name,
                "email": rep.reporter.email,
            }
            if rep.reporter
            else None,
            "assigned_admin": {
                "id": str(rep.assigned_admin.id),
                "name": rep.assigned_admin.name,
                "email": rep.assigned_admin.email,
            }
            if rep.assigned_admin
            else None,
        }
        items_data.append(rep_dict)

    res = {
        "items": items_data,
        "pagination": {"total": total, "page": page, "limit": limit, "pages": pages},
    }
    return success_response(data=res, message="Review reports retrieved successfully")


@router.get("/reports/{report_id}", status_code=status.HTTP_200_OK)
def get_report_detail(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    rep = review_service.get_report_detail(db, report_id)
    rep_dict = {
        "id": str(rep.id),
        "review_id": str(rep.review_id),
        "reported_by": str(rep.reported_by),
        "reason": rep.reason,
        "description": rep.description,
        "status": rep.status,
        "assigned_admin_id": str(rep.assigned_admin_id)
        if rep.assigned_admin_id
        else None,
        "resolved_at": rep.resolved_at.isoformat() if rep.resolved_at else None,
        "created_at": rep.created_at.isoformat() if rep.created_at else None,
        "updated_at": rep.updated_at.isoformat() if rep.updated_at else None,
        "review": review_service._map_review_to_response(rep.review).model_dump(
            mode="json"
        )
        if rep.review
        else None,
        "reporter": {
            "id": str(rep.reporter.id),
            "name": rep.reporter.name,
            "email": rep.reporter.email,
        }
        if rep.reporter
        else None,
        "assigned_admin": {
            "id": str(rep.assigned_admin.id),
            "name": rep.assigned_admin.name,
            "email": rep.assigned_admin.email,
        }
        if rep.assigned_admin
        else None,
    }
    return success_response(
        data=rep_dict, message="Report details retrieved successfully"
    )


@router.patch("/reports/{report_id}", status_code=status.HTTP_200_OK)
def update_report_status(
    report_id: UUID,
    payload: ModerationActionRequest,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    admin_id = UUID(current_admin["sub"])
    rep = review_service.get_report_detail(db, report_id)
    review, updated_rep = review_service.moderate_review(
        db=db,
        admin_id=admin_id,
        review_id=rep.review_id,
        action=payload.action,
        moderator_notes=payload.moderator_notes,
        report_id=report_id,
        target_admin_id=payload.target_admin_id,
    )
    return success_response(
        data={
            "report_id": str(report_id),
            "action": payload.action,
            "review_status": review.moderation_status,
        },
        message="Report updated successfully",
    )


@router.get("/moderation/history", status_code=status.HTTP_200_OK)
def get_moderation_history(
    review_id: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    items, total = review_service.get_moderation_history(
        db, review_id=review_id, page=page, limit=limit
    )
    history_data = [
        {
            "id": str(h.id),
            "review_id": str(h.review_id),
            "report_id": str(h.report_id) if h.report_id else None,
            "action": h.action,
            "old_status": h.old_status,
            "new_status": h.new_status,
            "moderated_by": str(h.moderated_by),
            "moderator_notes": h.moderator_notes,
            "created_at": h.created_at.isoformat() if h.created_at else None,
            "moderator": {
                "id": str(h.moderator.id),
                "name": h.moderator.name,
                "email": h.moderator.email,
            }
            if h.moderator
            else None,
        }
        for h in items
    ]
    return success_response(
        data={"items": history_data, "total": total},
        message="Moderation audit history retrieved",
    )


@router.get("/moderation/dashboard", status_code=status.HTTP_200_OK)
def get_moderation_dashboard_stats(
    db: Session = Depends(get_db), current_admin: dict = Depends(get_current_admin)
):
    stats = review_service.get_moderation_dashboard_stats(db)
    return success_response(
        data=stats.model_dump(mode="json"),
        message="Moderation dashboard statistics retrieved",
    )


# ─── GENERAL LIST & CREATE ENDPOINTS ──────────────────────────────────────────


@router.get("", status_code=status.HTTP_200_OK)
def list_reviews(
    booking_id: Optional[UUID] = Query(None),
    reviewer_id: Optional[UUID] = Query(None),
    reviewee_id: Optional[UUID] = Query(None),
    artist_profile_id: Optional[UUID] = Query(None),
    venue_id: Optional[UUID] = Query(None),
    rating: Optional[int] = Query(None),
    is_public: Optional[bool] = Query(None),
    moderation_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
):
    filters = ReviewFilters(
        booking_id=booking_id,
        reviewer_id=reviewer_id,
        reviewee_id=reviewee_id,
        artist_profile_id=artist_profile_id,
        venue_id=venue_id,
        rating=rating,
        is_public=is_public,
        moderation_status=moderation_status,
        search=search,
    )
    reviews, total = review_service.list_reviews(
        db,
        filters=filters,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    pages = (total + limit - 1) // limit if limit > 0 else 0

    items_data = [
        review_service._map_review_to_response(r).model_dump(mode="json")
        for r in reviews
    ]

    res = {
        "items": items_data,
        "pagination": {"total": total, "page": page, "limit": limit, "pages": pages},
    }
    return success_response(data=res, message="Reviews listed successfully")


@router.post("", status_code=status.HTTP_201_CREATED)
def create_review(
    payload: CreateReviewRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = UUID(current_user["sub"])
    review = review_service.create_review(db, reviewer_id=user_id, data=payload)
    mapped = review_service._map_review_to_response(review)
    return success_response(
        data=mapped.model_dump(mode="json"),
        message="Review submitted successfully",
        status_code=status.HTTP_201_CREATED,
    )


# ─── REPLIES & SPECIFIC ROLE ALIASES ──────────────────────────────────────────


@router.put("/artist/{review_id}/reply", status_code=status.HTTP_200_OK)
def reply_to_artist_review(
    review_id: UUID,
    payload: ReviewReplyRequest,
    db: Session = Depends(get_db),
    current_artist: dict = Depends(get_current_artist),
):
    user_id = UUID(current_artist["sub"])
    review = review_service.reply_to_review(
        db,
        review_id=review_id,
        user_id=user_id,
        reply_comment=payload.reply_comment,
        is_artist=True,
    )
    mapped = review_service._map_review_to_response(review)
    return success_response(
        data=mapped.model_dump(mode="json"), message="Reply recorded successfully"
    )


@router.put("/venue/{review_id}/reply", status_code=status.HTTP_200_OK)
def reply_to_venue_review(
    review_id: UUID,
    payload: ReviewReplyRequest,
    db: Session = Depends(get_db),
    current_venue_owner: dict = Depends(get_current_venue_owner),
):
    user_id = UUID(current_venue_owner["sub"])
    review = review_service.reply_to_review(
        db,
        review_id=review_id,
        user_id=user_id,
        reply_comment=payload.reply_comment,
        is_venue_owner=True,
    )
    mapped = review_service._map_review_to_response(review)
    return success_response(
        data=mapped.model_dump(mode="json"), message="Reply recorded successfully"
    )


# ─── PARAMETERIZED ENDPOINTS WITH /{review_id} ─────────────────────────────────


@router.get("/{review_id}", status_code=status.HTTP_200_OK)
def get_review_by_id(review_id: UUID, db: Session = Depends(get_db)):
    review = review_service.get_review_by_id(db, review_id)
    mapped = review_service._map_review_to_response(review)
    return success_response(
        data=mapped.model_dump(mode="json"), message="Review retrieved successfully"
    )


@router.put("/{review_id}", status_code=status.HTTP_200_OK)
def update_review(
    review_id: UUID,
    payload: UpdateReviewRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = UUID(current_user["sub"])
    is_admin = current_user.get("role") == "admin"
    review = review_service.update_review(
        db, review_id, user_id, payload, is_admin=is_admin
    )
    mapped = review_service._map_review_to_response(review)
    return success_response(
        data=mapped.model_dump(mode="json"), message="Review updated successfully"
    )


@router.delete("/{review_id}", status_code=status.HTTP_200_OK)
def delete_review(
    review_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = UUID(current_user["sub"])
    is_admin = current_user.get("role") == "admin"
    review_service.delete_review(
        db, review_id=review_id, current_user_id=user_id, is_admin=is_admin
    )
    return success_response(
        data={"id": str(review_id), "deleted": True},
        message="Review deleted successfully",
    )


@router.put("/{review_id}/reply", status_code=status.HTTP_200_OK)
def reply_to_review(
    review_id: UUID,
    payload: ReviewReplyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = UUID(current_user["sub"])
    role = current_user.get("role", "client")
    is_artist = role == "artist"
    is_venue = role == "venue_owner"
    review = review_service.reply_to_review(
        db,
        review_id=review_id,
        user_id=user_id,
        reply_comment=payload.reply_comment,
        is_artist=is_artist,
        is_venue_owner=is_venue,
    )
    mapped = review_service._map_review_to_response(review)
    return success_response(
        data=mapped.model_dump(mode="json"), message="Reply recorded successfully"
    )


# ─── MODERATION PARAMETERIZED ACTION ENDPOINTS ──────────────────────────────


@router.post("/{review_id}/report", status_code=status.HTTP_201_CREATED)
def report_review(
    review_id: UUID,
    payload: ReportReviewRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = UUID(current_user["sub"])
    report = review_service.report_review(
        db, user_id=user_id, review_id=review_id, data=payload
    )
    rep_dict = {
        "id": str(report.id),
        "review_id": str(report.review_id),
        "reported_by": str(report.reported_by),
        "reason": report.reason,
        "description": report.description,
        "status": report.status,
        "created_at": report.created_at.isoformat() if report.created_at else None,
    }
    return success_response(
        data=rep_dict,
        message="Review reported successfully",
        status_code=status.HTTP_201_CREATED,
    )


@router.post("/{review_id}/hide", status_code=status.HTTP_200_OK)
def hide_review(
    review_id: UUID,
    payload: ModerationActionRequest,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    admin_id = UUID(current_admin["sub"])
    review, report = review_service.moderate_review(
        db=db,
        admin_id=admin_id,
        review_id=review_id,
        action="hide",
        moderator_notes=payload.moderator_notes,
    )
    return success_response(
        data={"id": str(review.id), "moderation_status": review.moderation_status},
        message="Review hidden successfully",
    )


@router.post("/{review_id}/restore", status_code=status.HTTP_200_OK)
def restore_review(
    review_id: UUID,
    payload: ModerationActionRequest,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    admin_id = UUID(current_admin["sub"])
    review, report = review_service.moderate_review(
        db=db,
        admin_id=admin_id,
        review_id=review_id,
        action="restore",
        moderator_notes=payload.moderator_notes,
    )
    return success_response(
        data={"id": str(review.id), "moderation_status": review.moderation_status},
        message="Review restored successfully",
    )


@router.post("/{review_id}/remove", status_code=status.HTTP_200_OK)
def remove_review(
    review_id: UUID,
    payload: ModerationActionRequest,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    admin_id = UUID(current_admin["sub"])
    review, report = review_service.moderate_review(
        db=db,
        admin_id=admin_id,
        review_id=review_id,
        action="remove",
        moderator_notes=payload.moderator_notes,
    )
    return success_response(
        data={"id": str(review.id), "moderation_status": review.moderation_status},
        message="Review removed successfully",
    )


@router.post("/{review_id}/archive", status_code=status.HTTP_200_OK)
def archive_review(
    review_id: UUID,
    payload: ModerationActionRequest,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    admin_id = UUID(current_admin["sub"])
    review, report = review_service.moderate_review(
        db=db,
        admin_id=admin_id,
        review_id=review_id,
        action="archive",
        moderator_notes=payload.moderator_notes,
    )
    return success_response(
        data={"id": str(review.id), "moderation_status": review.moderation_status},
        message="Review archived successfully",
    )
