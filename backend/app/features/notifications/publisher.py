"""
NotificationPublisher — Realtime Delivery Bridge

Bridges synchronous notification creation (Service layer) with async
WebSocket delivery (ConnectionManager).

Rules:
  - NEVER creates notifications
  - NEVER writes to the database
  - Only delivers already-persisted notification payloads
  - Fire-and-forget: delivery failures NEVER affect the DB transaction
  - No-op if no WebSocket connection exists for the user

Usage:
  Called from create_booking_notification() after notification_repository.create()
  has successfully committed the notification to the database.
"""

import asyncio
import logging
from typing import Any, Dict
from uuid import UUID

logger = logging.getLogger(__name__)

# ── Event Loop Reference ──────────────────────────────────────────────────────
#
# FastAPI runs on a single event loop. We store a reference to it at application
# startup (via set_publisher_event_loop in main.py lifespan) so that synchronous
# service code can schedule async WS delivery onto it.
#
# This is the standard pattern for bridging sync→async in a single-process
# Python ASGI application.

_event_loop: asyncio.AbstractEventLoop | None = None


def set_publisher_event_loop(loop: asyncio.AbstractEventLoop) -> None:
    """
    Store the main event loop reference.
    Called once at app startup from main.py lifespan.
    """
    global _event_loop
    _event_loop = loop
    logger.info("[WS Publisher] Event loop registered.")


def publish_notification(user_id: UUID | str, notification_data: Dict[str, Any]) -> None:
    """
    Fire-and-forget delivery of a notification payload to an authenticated user
    via their active WebSocket connection.

    This function is safe to call from synchronous service code.
    If the user has no active WebSocket connection the call is a no-op.
    If the event loop reference has not been set (e.g. during unit tests)
    the call is also a no-op.

    Args:
        user_id:           The UUID of the notification recipient.
        notification_data: Serialised notification dict (already in DB).
    """
    global _event_loop

    if _event_loop is None or not _event_loop.is_running():
        # Not set up yet (startup) or tests — skip silently
        return

    uid = str(user_id)

    async def _deliver() -> None:
        from app.features.notifications.connection_manager import connection_manager
        try:
            await connection_manager.send_to_user(uid, {
                "type": "notification",
                "data": notification_data,
            })
        except Exception as e:
            logger.error(f"[WS Publisher] Delivery failed for user {uid}: {e}")

    try:
        # Schedule the coroutine on the main event loop.
        # run_coroutine_threadsafe is safe whether this call originates from:
        #   - A thread-pool worker (sync FastAPI endpoint)
        #   - The event loop thread itself (async FastAPI endpoint)
        asyncio.run_coroutine_threadsafe(_deliver(), _event_loop)
    except Exception as e:
        # Publish failure is never fatal — notification is already in DB
        logger.debug(f"[WS Publisher] Failed to schedule delivery for {uid}: {e}")


def serialize_notification(notification: Any) -> Dict[str, Any]:
    """
    Convert a Notification ORM object into a JSON-serialisable dict.
    Mirrors the _format_notification helper in the HTTP router so the
    frontend receives identical shapes from both REST and WebSocket.
    """
    return {
        "id": str(notification.id),
        "user_id": str(notification.user_id),
        "recipient_user_id": (
            str(notification.recipient_user_id)
            if notification.recipient_user_id
            else None
        ),
        "recipient_role": notification.recipient_role,
        "title": notification.title,
        "message": notification.message,
        "is_read": notification.is_read,
        "read_at": notification.read_at.isoformat() if notification.read_at else None,
        "notification_type": notification.notification_type,
        "link": notification.link,
        "reference_type": notification.reference_type,
        "reference_id": (
            str(notification.reference_id) if notification.reference_id else None
        ),
        "metadata": notification.notification_metadata,
        "created_at": notification.created_at.isoformat(),
        "updated_at": (
            notification.updated_at.isoformat() if notification.updated_at else None
        ),
    }
