from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.band.common.deps import get_band_db, get_current_band_account
from app.api.band.notifications.service import NotificationService
from app.models.band_models import BandAccount

router = APIRouter(prefix="/band/notifications", tags=["Band Notifications"])


@router.get("/me")
def get_my_notifications(
    db: Session = Depends(get_band_db),
    current_user: BandAccount = Depends(get_current_band_account),
):
    """Fetch recent notifications and unread badge count for authenticated user."""
    data = NotificationService.get_inbox(db=db, account_id=current_user.id)
    return {"success": True, "data": data}


@router.post("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_band_db),
    current_user: BandAccount = Depends(get_current_band_account),
):
    """Mark a single notification as read."""
    success = NotificationService.mark_single_read(
        db=db, notification_id=notification_id, account_id=current_user.id
    )
    return {"success": success, "message": "Notification marked as read."}


@router.post("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_band_db),
    current_user: BandAccount = Depends(get_current_band_account),
):
    """Mark all active notifications as read."""
    count = NotificationService.mark_all_read(db=db, account_id=current_user.id)
    return {"success": True, "data": {"updated_count": count}}
