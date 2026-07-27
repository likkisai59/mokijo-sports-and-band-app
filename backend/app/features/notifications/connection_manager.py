"""
ConnectionManager — WebSocket Connection Registry

Manages all active WebSocket connections for authenticated users.
One user can have multiple connections (multiple browser tabs).

Rules:
  - NEVER creates notifications
  - NEVER modifies database
  - Only manages WebSocket connections and delivers pre-built payloads
  - Thread-safe via asyncio primitives
"""

import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Singleton registry of active WebSocket connections.

    Layout:
      active_connections: { user_id (str) -> set of WebSocket instances }

    Supports multiple tabs per user — all tabs for a user receive the
    same notification simultaneously.
    """

    def __init__(self) -> None:
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        """
        Accept and register an authenticated WebSocket connection.
        Duplicate connections from the same user (multiple tabs) are allowed.
        """
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        tab_count = len(self.active_connections[user_id])
        logger.info(
            f"[WS] User {user_id} connected — {tab_count} active tab(s). "
            f"Total connected users: {len(self.active_connections)}"
        )

    async def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        """
        Remove a single WebSocket connection for a user.
        Cleans up the user entry entirely if no connections remain.
        """
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(
            f"[WS] User {user_id} disconnected. "
            f"Total connected users: {len(self.active_connections)}"
        )

    async def send_to_user(self, user_id: str, payload: dict) -> None:
        """
        Deliver a JSON payload to all active connections for a specific user.

        If any connection is stale (browser closed without clean WS close),
        the dead socket is removed silently.
        """
        if user_id not in self.active_connections:
            return  # User has no active WebSocket — notification is already in DB

        dead_sockets: Set[WebSocket] = set()

        for ws in list(self.active_connections[user_id]):
            try:
                await ws.send_json(payload)
            except Exception as e:
                logger.warning(
                    f"[WS] Failed to deliver to {user_id} — marking socket dead: {e}"
                )
                dead_sockets.add(ws)

        # Prune dead connections detected during this send
        if dead_sockets:
            self.active_connections[user_id] -= dead_sockets
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                logger.info(f"[WS] All connections pruned for user {user_id}")

    def is_connected(self, user_id: str) -> bool:
        """Returns True if the user has at least one active connection."""
        return user_id in self.active_connections and bool(
            self.active_connections[user_id]
        )

    @property
    def connected_user_count(self) -> int:
        """Number of distinct users with active connections."""
        return len(self.active_connections)


# Module-level singleton — imported by publisher.py and websocket_router.py
connection_manager = ConnectionManager()
