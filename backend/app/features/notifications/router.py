from uuid import UUID
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.common.schemas.base import SuccessResponse
from app.features.notifications.service import notification_service
from app.features.notifications.schemas import SystemNotificationCreateRequest
from app.features.notifications.preferences.router import router as preferences_router

router = APIRouter(tags=["Notifications"])
router.include_router(preferences_router)


def _format_notification(n) -> dict:
    return {
        "id": str(n.id),
        "user_id": str(n.user_id),
        "recipient_user_id": str(n.recipient_user_id) if n.recipient_user_id else None,
        "recipient_role": n.recipient_role,
        "title": n.title,
        "message": n.message,
        "is_read": n.is_read,
        "read_at": n.read_at.isoformat() if n.read_at else None,
        "notification_type": n.notification_type,
        "link": n.link,
        "reference_type": n.reference_type,
        "reference_id": str(n.reference_id) if n.reference_id else None,
        "metadata": n.notification_metadata,
        "created_at": n.created_at.isoformat(),
        "updated_at": n.updated_at.isoformat() if n.updated_at else None
    }

@router.get(
    "",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Get paginated notifications for the authenticated user (or all if admin)"
)
async def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    unread_only: bool = Query(False),
    recipient_role: Optional[str] = Query(None),
    notification_type: Optional[str] = Query(None),
    reference_type: Optional[str] = Query(None),
    target_user_id: Optional[UUID] = Query(None),
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user_id = UUID(current_user_claims["sub"])
    is_admin = current_user_claims.get("role") == "admin"

    results, total = notification_service.list_notifications(
        db=db,
        current_user_id=current_user_id,
        is_admin=is_admin,
        target_user_id=target_user_id,
        recipient_role=recipient_role,
        unread_only=unread_only,
        notification_type=notification_type,
        reference_type=reference_type,
        page=page,
        limit=limit
    )

    unread_count = notification_service.get_unread_count(
        db=db,
        current_user_id=current_user_id,
        is_admin=is_admin,
        target_user_id=target_user_id or current_user_id
    )

    return SuccessResponse(
        success=True,
        data={
            "notifications": [_format_notification(n) for n in results],
            "total": total,
            "unread_count": unread_count,
            "page": page,
            "limit": limit
        },
        message="Notifications list retrieved."
    )

@router.get(
    "/unread-count",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Get count of unread notifications"
)
async def get_unread_count(
    target_user_id: Optional[UUID] = Query(None),
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user_id = UUID(current_user_claims["sub"])
    is_admin = current_user_claims.get("role") == "admin"

    count = notification_service.get_unread_count(
        db=db,
        current_user_id=current_user_id,
        is_admin=is_admin,
        target_user_id=target_user_id
    )
    return SuccessResponse(
        success=True,
        data={"unread_count": count},
        message="Unread notifications count retrieved."
    )

@router.get(
    "/{notification_id}",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Get single notification details"
)
async def get_notification_details(
    notification_id: UUID,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user_id = UUID(current_user_claims["sub"])
    is_admin = current_user_claims.get("role") == "admin"

    notification = notification_service.get_notification(
        db=db,
        notification_id=notification_id,
        current_user_id=current_user_id,
        is_admin=is_admin
    )
    return SuccessResponse(
        success=True,
        data=_format_notification(notification),
        message="Notification details retrieved."
    )

# Standard PUT mapping for backward compatibility with booking features, plus PATCH mapping as requested
@router.patch("/{notification_id}/read", response_model=SuccessResponse[dict], status_code=status.HTTP_200_OK)
@router.put("/{notification_id}/read", response_model=SuccessResponse[dict], status_code=status.HTTP_200_OK)
async def mark_notification_read(
    notification_id: UUID,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user_id = UUID(current_user_claims["sub"])
    is_admin = current_user_claims.get("role") == "admin"

    notification = notification_service.mark_read(
        db=db,
        notification_id=notification_id,
        current_user_id=current_user_id,
        is_admin=is_admin
    )
    return SuccessResponse(
        success=True,
        data=_format_notification(notification),
        message="Notification marked as read."
    )

# Standard PUT mapping for backward compatibility with booking features, plus PATCH mapping as requested
@router.patch("/read-all", response_model=SuccessResponse[dict], status_code=status.HTTP_200_OK)
@router.put("/read-all", response_model=SuccessResponse[dict], status_code=status.HTTP_200_OK)
async def mark_all_notifications_read(
    target_user_id: Optional[UUID] = Query(None),
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user_id = UUID(current_user_claims["sub"])
    is_admin = current_user_claims.get("role") == "admin"

    notification_service.mark_all_read(
        db=db,
        current_user_id=current_user_id,
        is_admin=is_admin,
        target_user_id=target_user_id
    )
    return SuccessResponse(
        success=True,
        data={},
        message="All notifications marked as read."
    )

@router.delete(
    "/{notification_id}",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Delete a single notification (soft delete)"
)
async def delete_notification(
    notification_id: UUID,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user_id = UUID(current_user_claims["sub"])
    is_admin = current_user_claims.get("role") == "admin"

    notification_service.delete_notification(
        db=db,
        notification_id=notification_id,
        current_user_id=current_user_id,
        is_admin=is_admin
    )
    return SuccessResponse(
        success=True,
        data={},
        message="Notification deleted successfully."
    )

@router.delete(
    "",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Bulk delete notifications for a user"
)
async def bulk_delete_notifications(
    target_user_id: Optional[UUID] = Query(None),
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user_id = UUID(current_user_claims["sub"])
    is_admin = current_user_claims.get("role") == "admin"

    notification_service.bulk_delete_notifications(
        db=db,
        current_user_id=current_user_id,
        is_admin=is_admin,
        target_user_id=target_user_id
    )
    return SuccessResponse(
        success=True,
        data={},
        message="Notifications bulk deleted successfully."
    )

@router.post(
    "",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_201_CREATED,
    summary="Create a system/admin notification (Admin only)"
)
async def create_system_notification(
    payload: SystemNotificationCreateRequest,
    current_admin_claims: dict = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    notification = notification_service.create_notification(
        db=db,
        recipient_user_id=payload.recipient_user_id,
        recipient_role=payload.recipient_role,
        notification_type=payload.notification_type,
        title=payload.title,
        message=payload.message,
        reference_type=payload.reference_type,
        reference_id=payload.reference_id,
        metadata=payload.metadata
    )
    return SuccessResponse(
        success=True,
        data=_format_notification(notification) if notification else {},
        message="System notification created successfully."
    )
