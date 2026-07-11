import asyncio
import json
from fastapi import WebSocket
from typing import Dict, Set

class WebSocketManager:
    def __init__(self):
        # Maps game_id -> Set of active WebSockets viewing match details
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Maps user_id -> Set of host-specific WebSockets for private notifications
        self.host_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, game_id: str, is_host: bool = False, user_id: str = None):
        await websocket.accept()
        if is_host and user_id:
            self.host_connections.setdefault(str(user_id), set()).add(websocket)
        else:
            self.active_connections.setdefault(str(game_id), set()).add(websocket)

    def disconnect(self, websocket: WebSocket, game_id: str, is_host: bool = False, user_id: str = None):
        if is_host and user_id:
            self.host_connections.get(str(user_id), set()).discard(websocket)
        else:
            self.active_connections.get(str(game_id), set()).discard(websocket)

    def broadcast_game_update(self, game_id: str, event_data: dict):
        """Broadcasts match changes (e.g. slots left, player confirmed) to all clients viewing the game details."""
        gid = str(game_id)
        loop = asyncio.get_event_loop()
        message = json.dumps(event_data)

        # 1. Broadcast to game-specific room
        if gid in self.active_connections:
            for ws in list(self.active_connections[gid]):
                try:
                    loop.create_task(ws.send_text(message))
                except Exception:
                    pass

        # 2. Broadcast to global 'all' channel
        if "all" in self.active_connections:
            for ws in list(self.active_connections["all"]):
                try:
                    loop.create_task(ws.send_text(message))
                except Exception:
                    pass

    def send_host_notification(self, host_id: int, event_data: dict):
        """Sends join request alerts exclusively to the host's private socket connection."""
        hid = str(host_id)
        if hid not in self.host_connections:
            return
            
        loop = asyncio.get_event_loop()
        message = json.dumps(event_data)
        for ws in list(self.host_connections[hid]):
            try:
                loop.create_task(ws.send_text(message))
            except Exception:
                pass

ws_manager = WebSocketManager()
