import time
import uuid
import redis
from datetime import datetime, timedelta
from sqlalchemy import func
from app.models import models
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

try:
    redis_client = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
    redis_client.ping()
    print("[INFO] Redis server connected successfully.")
except Exception:
    redis_client = InMemoryCache()
    print("[WARNING] Redis is not running. Using InMemoryCache fallback for holds.")


class HoldExpiryService:
    @staticmethod
    def passive_check(game_id: str, db):
        """Checks pending hold states inline during new join attempts and clears expired ones."""
        expired_players = db.query(models.GamePlayer).filter(
            models.GamePlayer.game_id == str(game_id),
            models.GamePlayer.status == "pending_payment"
        ).all()

        for player in expired_players:
            hold_key = f"game:{game_id}:hold:{player.user_id}"
            if not redis_client.exists(hold_key):
                HoldExpiryService.cancel_and_release(player.id, db)

    @staticmethod
    def cancel_and_release(player_id: str, db):
        """Cancels a pending hold reservation and releases the spot to the waitlist."""
        # Row lock the player record
        player = db.query(models.GamePlayer).filter(
            models.GamePlayer.id == str(player_id)
        ).with_for_update().first()

        if not player or player.status != "pending_payment":
            return

        game = db.query(models.Game).filter(
            models.Game.id == player.game_id
        ).with_for_update().first()

        if not game:
            return

        # Transition player registration
        player.status = "cancelled"
        player.cancelled_at = datetime.utcnow()
        
        # Decrement slot counter
        if game.current_players > 1:
            game.current_players -= 1
        
        # Open up lobby if it was marked full
        if game.status == "full":
            game.status = "open"

        db.commit()

        # Promote the next candidate from the waitlist
        promote_next_waitlisted(game.id, db)

        # Notify websocket listeners
        ws_manager.broadcast_game_update(str(game.id), {
            "event": "player_left",
            "game_id": str(game.id),
            "current_players": game.current_players,
            "spots_left": game.total_spots - game.current_players,
            "status": game.status
        })

    @staticmethod
    def active_cleanup_job():
        """Scans the DB for all pending_payment entries and clears those whose Redis holds have expired."""
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            pending_players = db.query(models.GamePlayer).filter(
                models.GamePlayer.status == "pending_payment"
            ).all()

            for p in pending_players:
                hold_key = f"game:{p.game_id}:hold:{p.user_id}"
                if not redis_client.exists(hold_key):
                    HoldExpiryService.cancel_and_release(p.id, db)
        except Exception as e:
            print(f"[ERROR] Active hold cleanup job failed: {e}")
        finally:
            db.close()


def promote_next_waitlisted(game_id: str, db):
    """Pops the first waitlist candidate and starts a 3-minute payment hold window."""
    next_up = db.query(models.GameWaitlist).filter(
        models.GameWaitlist.game_id == str(game_id),
        models.GameWaitlist.status == "waiting"
    ).order_by(models.GameWaitlist.position.asc()).with_for_update().first()

    if not next_up:
        return

    game = db.query(models.Game).filter(
        models.Game.id == str(game_id)
    ).with_for_update().first()

    if not game or game.current_players >= game.total_spots:
        return

    # Promote waitlisted entry
    next_up.status = "promoted"
    player = models.GamePlayer(
        game_id=str(game_id),
        user_id=next_up.user_id,
        status="pending_payment"
    )
    db.add(player)

    # Increment counter
    game.current_players += 1
    if game.current_players >= game.total_spots:
        game.status = "full"

    db.commit()

    # Create 3-minute hold key in Redis
    redis_client.setex(f"game:{game_id}:hold:{next_up.user_id}", 180, "reserved")

    # Send live socket notification
    ws_manager.broadcast_game_update(str(game_id), {
        "event": "waitlist_promoted",
        "game_id": str(game_id),
        "user_id": str(next_up.user_id),
        "expires_at": (datetime.utcnow() + timedelta(minutes=3)).isoformat() + "Z"
    })
