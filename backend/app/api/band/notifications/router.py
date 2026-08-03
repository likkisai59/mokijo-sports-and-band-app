from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.band.common.deps import get_band_account
from app.models.band_models import BandAccount

from . import crud, schema

router = APIRouter()


@router.get("", response_model=schema.BandNotificationList)
def get_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Get notifications for the current authenticated Band account."""
    items, total = crud.list_for_account(
        db, account_id=account.id, unread_only=unread_only, limit=limit, offset=offset
    )
    return {"total": total, "notifications": items}


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Mark a specific notification as read."""
    success = crud.mark_read(db, account_id=account.id, notification_id=notification_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found or already read")
    return {"success": True}


@router.post("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    account: BandAccount = Depends(get_band_account),
):
    """Mark all notifications as read."""
    crud.mark_all_read(db, account_id=account.id)
    return {"success": True}
