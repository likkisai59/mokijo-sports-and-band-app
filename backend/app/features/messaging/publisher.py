"""
MessagingPublisher — Real-time Messaging Delivery Bridge

Bridges synchronous message creation and conversation updates with async WebSocket delivery
by reusing the centralized ConnectionManager from the Notification module.

Rules:
  - Reuses existing ConnectionManager singleton
  - NEVER writes to the database
  - Only delivers already-persisted message and conversation payloads
  - Fire-and-forget: delivery failures NEVER roll back or affect DB transactions
"""

import asyncio
import logging
from typing import Any, Dict
from uuid import UUID

logger = logging.getLogger(__name__)


def publish_messaging_event(
    user_id: UUID | str,
    event_type: str,
    payload: Dict[str, Any],
) -> None:
    """
    Fire-and-forget delivery of a messaging event payload to an authenticated user
    via their active WebSocket connection using the centralized ConnectionManager.

    Args:
        user_id:    Recipient user UUID.
        event_type: Messaging event name (e.g., 'message.created', 'conversation.updated').
        payload:    Serialised dictionary of the message or conversation entity.
    """
    from app.features.notifications.publisher import _event_loop

    if _event_loop is None or not _event_loop.is_running():
        # Event loop not initialized or running in synchronous unit tests — skip gracefully
        return

    uid = str(user_id)

    async def _deliver() -> None:
        from app.features.notifications.connection_manager import connection_manager
        try:
            await connection_manager.send_to_user(
                uid,
                {
                    "type": "messaging",
                    "event": event_type,
                    "data": payload,
                },
            )
        except Exception as e:
            logger.error(
                f"[WS Messaging Publisher] Failed to deliver event '{event_type}' to user {uid}: {e}"
            )

    try:
        asyncio.run_coroutine_threadsafe(_deliver(), _event_loop)
    except Exception as e:
        logger.debug(
            f"[WS Messaging Publisher] Failed to schedule delivery for {uid}: {e}"
        )
