import time
import uuid
import redis
from datetime import datetime, timedelta
from app.core.websocket import ws_manager

# Robust Cache Fallback logic: ensures the app runs even if Redis is not installed
class InMemoryCache:
    def __init__(self):
        self.store = {}

    def setex(self, key: str, seconds: int, value: str):
        self.store[key] = (value, time.time() + seconds)

    def exists(self, key: str) -> bool:
        if key not in self.store:
            return False
        val, expiry = self.store[key]
        if time.time() > expiry:
            del self.store[key]
            return False
        return True

    def delete(self, key: str):
        self.store.pop(key, None)

import socket

def _is_redis_running(host="127.0.0.1", port=6379, timeout=0.2):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except Exception:
        return False

if _is_redis_running():
    try:
        redis_client = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True, socket_connect_timeout=1.0, socket_timeout=1.0)
        redis_client.ping()
        print("[INFO] Redis server connected successfully.")
    except Exception:
        redis_client = InMemoryCache()
        print("[WARNING] Redis connection failed after socket check. Using InMemoryCache fallback for holds.")
else:
    redis_client = InMemoryCache()
    print("[WARNING] Redis is not running. Using InMemoryCache fallback for holds.")


class HoldExpiryService:
    @staticmethod
    def passive_check(game_id: str, db):
        """Checks pending hold states inline during new join attempts and clears expired ones."""
        expired_players = db.fetch_all(
            "SELECT * FROM game_players WHERE game_id = %s AND status = 'pending_payment'",
            (str(game_id),)
        )

        for player in expired_players:
            hold_key = f"game:{game_id}:hold:{player.get('user_id')}"
            if not redis_client.exists(hold_key):
                HoldExpiryService.cancel_and_release(player.get("id"), db)

    @staticmethod
    def cancel_and_release(player_id: str, db):
        """Cancels a pending hold reservation and releases the spot to the waitlist."""
        # Row lock the player record
        player = db.fetch_one(
            "SELECT * FROM game_players WHERE id = %s FOR UPDATE",
            (str(player_id),)
        )

        if not player or player.get("status") != "pending_payment":
            return

        game = db.fetch_one(
            "SELECT * FROM games WHERE id = %s FOR UPDATE",
            (player.get("game_id"),)
        )

        if not game:
            return

        # Transition player registration
        db.execute_query(
            "UPDATE game_players SET status = 'cancelled', cancelled_at = %s WHERE id = %s",
            (datetime.utcnow(), str(player_id))
        )
        
        # Decrement slot counter
        current_players = game.get("current_players") or 0
        if current_players > 1:
            current_players -= 1
        
        status_val = game.get("status")
        # Open up lobby if it was marked full
        if status_val == "full":
            status_val = "open"

        db.execute_query(
            "UPDATE games SET current_players = %s, status = %s WHERE id = %s",
            (current_players, status_val, game.get("id"))
        )

        # Promote the next candidate from the waitlist
        promote_next_waitlisted(game.get("id"), db)

        # Notify websocket listeners
        ws_manager.broadcast_game_update(str(game.get("id")), {
            "event": "player_left",
            "game_id": str(game.get("id")),
            "current_players": current_players,
            "spots_left": (game.get("total_spots") or 0) - current_players,
            "status": status_val
        })

    @staticmethod
    def active_cleanup_job():
        """Scans the DB for all pending_payment entries and clears those whose Redis holds have expired."""
        from app.connectors.postgresql import PostgreSQLConnector
        db = PostgreSQLConnector()
        try:
            pending_players = db.fetch_all(
                "SELECT * FROM game_players WHERE status = 'pending_payment'"
            )

            for p in pending_players:
                hold_key = f"game:{p.get('game_id')}:hold:{p.get('user_id')}"
                if not redis_client.exists(hold_key):
                    HoldExpiryService.cancel_and_release(p.get("id"), db)
        except Exception as e:
            print(f"[ERROR] Active hold cleanup job failed: {e}")


def promote_next_waitlisted(game_id: str, db):
    """Pops the first waitlist candidate and starts a 3-minute payment hold window."""
    next_up = db.fetch_one(
        "SELECT * FROM game_waitlist WHERE game_id = %s AND status = 'waiting' ORDER BY position ASC LIMIT 1 FOR UPDATE",
        (str(game_id),)
    )

    if not next_up:
        return

    game = db.fetch_one(
        "SELECT * FROM games WHERE id = %s FOR UPDATE",
        (str(game_id),)
    )

    current_players = game.get("current_players") or 0
    total_spots = game.get("total_spots") or 0
    if not game or current_players >= total_spots:
        return

    # Promote waitlisted entry
    db.execute_query(
        "UPDATE game_waitlist SET status = 'promoted' WHERE id = %s",
        (next_up.get("id"),)
    )
    
    insert_player = {
        "game_id": str(game_id),
        "user_id": next_up.get("user_id"),
        "status": "pending_payment"
    }
    db.insert("game_players", insert_player)

    # Increment counter
    current_players += 1
    status_val = game.get("status")
    if current_players >= total_spots:
        status_val = "full"

    db.execute_query(
        "UPDATE games SET current_players = %s, status = %s WHERE id = %s",
        (current_players, status_val, str(game_id))
    )

    # Create 3-minute hold key in Redis
    redis_client.setex(f"game:{game_id}:hold:{next_up.get('user_id')}", 180, "reserved")

    # Send live socket notification
    ws_manager.broadcast_game_update(str(game_id), {
        "event": "waitlist_promoted",
        "game_id": str(game_id),
        "user_id": str(next_up.get("user_id")),
        "expires_at": (datetime.utcnow() + timedelta(minutes=3)).isoformat() + "Z"
    })
