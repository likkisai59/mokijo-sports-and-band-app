from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.common.schemas.base import SuccessResponse
from app.features.notifications.preferences.service import notification_preference_service
from app.features.notifications.preferences.schemas import (
    NotificationPreferenceUpdate,
    NotificationPreferenceResponse,
)

router = APIRouter(prefix="/preferences", tags=["Notification Preferences"])

@router.get(
    "",
    response_model=SuccessResponse[NotificationPreferenceResponse],
    status_code=status.HTTP_200_OK,
    summary="Get notification preferences for the authenticated user"
)
async def get_preferences(
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user_id = UUID(current_user_claims["sub"])
    pref = notification_preference_service.get_preferences(db, current_user_id)
    return SuccessResponse(
        success=True,
        message="Notification preferences retrieved successfully",
        data=NotificationPreferenceResponse.model_validate(pref)
    )

@router.patch(
    "",
    response_model=SuccessResponse[NotificationPreferenceResponse],
    status_code=status.HTTP_200_OK,
    summary="Update notification preferences for the authenticated user"
)
async def update_preferences(
    obj_in: NotificationPreferenceUpdate,
    current_user_claims: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user_id = UUID(current_user_claims["sub"])
    pref = notification_preference_service.update_preferences(db, current_user_id, obj_in)
    return SuccessResponse(
        success=True,
        message="Notification preferences updated successfully",
        data=NotificationPreferenceResponse.model_validate(pref)
    )
