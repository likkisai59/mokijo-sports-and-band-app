"""
WebSocket Router — /api/v1/ws/notifications

Handles WebSocket lifecycle for authenticated users:
  1. JWT authentication via ?token= query param
  2. Connection registration with ConnectionManager
  3. Realtime presence status broadcast (online/offline/last_seen)
  4. Heartbeat ping/pong and incoming message frame routing (typing, etc.)
  5. Graceful disconnection and cleanup
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.security import decode_token
from app.features.notifications.connection_manager import connection_manager
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])

HEARTBEAT_INTERVAL_SECONDS = 25
WS_CLOSE_UNAUTHORIZED = 4001
WS_CLOSE_INTERNAL_ERROR = 4500


@router.websocket("/notifications")
async def ws_notifications(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token (from localStorage)")
) -> None:
    # ── Step 1: Authenticate ─────────────────────────────────────────────────
    user_id: str
    try:
        payload = decode_token(token)
        user_id = payload["sub"]
    except Exception as exc:
        logger.warning(f"[WS] Rejected unauthenticated connection: {exc}")
        await websocket.close(code=WS_CLOSE_UNAUTHORIZED, reason="Unauthorized: invalid or expired token")
        return

    was_already_online = connection_manager.is_connected(user_id)

    # ── Step 2: Register Connection ───────────────────────────────────────────
    await connection_manager.connect(user_id, websocket)

    if not was_already_online:
        _broadcast_user_presence(user_id, is_online=True)

    try:
        # ── Step 3: Send Connection Confirmation ──────────────────────────────
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
        })

        # ── Step 4: Message Loop ──────────────────────────────────────────────
        while True:
            try:
                raw = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=float(HEARTBEAT_INTERVAL_SECONDS)
                )
                msg = json.loads(raw)
                msg_type = msg.get("type")

                if msg_type == "pong":
                    logger.debug(f"[WS] Pong received from user {user_id}")

                elif msg_type in ("typing.started", "typing.stopped"):
                    conv_id_str = msg.get("conversation_id")
                    if conv_id_str:
                        _handle_typing_event(user_id, conv_id_str, is_typing=(msg_type == "typing.started"))

            except asyncio.TimeoutError:
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    logger.info(f"[WS] Ping failed — closing connection for {user_id}")
                    break

            except WebSocketDisconnect:
                logger.info(f"[WS] User {user_id} disconnected cleanly.")
                break

            except json.JSONDecodeError:
                logger.debug(f"[WS] Malformed message from {user_id} — ignored.")

            except Exception as exc:
                logger.error(f"[WS] Unexpected error for {user_id}: {exc}")
                break

    finally:
        # ── Step 5: Cleanup & Offline Presence Broadcast ──────────────────────
        await connection_manager.disconnect(user_id, websocket)
        if not connection_manager.is_connected(user_id):
            last_seen_dt = datetime.now(timezone.utc)
            _persist_last_seen(user_id, last_seen_dt)
            _broadcast_user_presence(user_id, is_online=False, last_seen=last_seen_dt)


def _broadcast_user_presence(user_id: str, is_online: bool, last_seen: datetime | None = None) -> None:
    db = SessionLocal()
    try:
        from app.features.messaging.conversation.models import Conversation
        from app.features.messaging.publisher import publish_messaging_event
        from sqlalchemy import or_

        uid = UUID(user_id)
        conversations = db.query(Conversation).filter(
            or_(
                Conversation.client_id == uid,
                Conversation.band_id == uid,
                Conversation.venue_owner_id == uid,
            )
        ).all()

        partner_ids = set()
        for c in conversations:
            if c.client_id and c.client_id != uid:
                partner_ids.add(c.client_id)
            if c.band_id and c.band_id != uid:
                partner_ids.add(c.band_id)
            if c.venue_owner_id and c.venue_owner_id != uid:
                partner_ids.add(c.venue_owner_id)

        payload = {
            "user_id": user_id,
            "is_online": is_online,
            "last_seen": last_seen.isoformat() if last_seen else None,
        }
        event_type = "presence.online" if is_online else "presence.offline"

        for partner_id in partner_ids:
            if connection_manager.is_connected(str(partner_id)):
                publish_messaging_event(partner_id, event_type, payload)
                if not is_online and last_seen:
                    publish_messaging_event(partner_id, "presence.last_seen", payload)
    except Exception as e:
        logger.warning(f"[WS] Failed to broadcast presence for {user_id}: {e}")
    finally:
        db.close()


def _persist_last_seen(user_id: str, last_seen_dt: datetime) -> None:
    db = SessionLocal()
    try:
        from app.features.auth.models import User
        user = db.query(User).filter(User.id == UUID(user_id)).first()
        if user:
            user.last_seen = last_seen_dt
            db.commit()
    except Exception as e:
        logger.warning(f"[WS] Failed to persist last_seen for {user_id}: {e}")
        db.rollback()
    finally:
        db.close()


def _handle_typing_event(user_id: str, conversation_id_str: str, is_typing: bool) -> None:
    db = SessionLocal()
    try:
        from app.features.messaging.message.service import message_service
        message_service.set_typing_status(db, UUID(conversation_id_str), UUID(user_id), is_typing)
    except Exception as e:
        logger.warning(f"[WS] Failed typing event for {user_id}: {e}")
    finally:
        db.close()
