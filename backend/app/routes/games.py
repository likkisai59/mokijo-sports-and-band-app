import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.websocket import ws_manager
from app.services.hold_expiry import redis_client, promote_next_waitlisted

router = APIRouter()

CANCELLATION_TIERS = [
    {"hours": 24, "refund_percent": 1.00},
    {"hours": 6,  "refund_percent": 0.50},
    {"hours": 0,  "refund_percent": 0.00},
]


@router.get("/games", response_model=List[schemas.GameResponse])
def get_games(sport: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieve all open public game lobbies that haven't started yet."""
    query = db.query(models.Game).filter(
        models.Game.status == "open",
        models.Game.visibility == "public",
        models.Game.slot_start > func.now()
    )
    if sport and sport != "all":
        query = query.filter(models.Game.sport == sport)
    return query.all()


@router.get("/users/{user_id}/games", response_model=List[schemas.GameResponse])
def get_user_games(user_id: int, db: Session = Depends(get_db)):
    """Retrieve all games where the user is either the host or a registered player."""
    hosted = db.query(models.Game).filter(models.Game.host_id == user_id).all()
    joined_player_queries = db.query(models.GamePlayer.game_id).filter(
        models.GamePlayer.user_id == user_id,
        models.GamePlayer.status == "confirmed"
    ).all()
    joined_ids = [str(g[0]) for g in joined_player_queries]
    
    joined = []
    if joined_ids:
        joined = db.query(models.Game).filter(models.Game.id.in_(joined_ids)).all()
        
    # Deduplicate in python
    unique_games = {g.id: g for g in hosted + joined}.values()
    return list(unique_games)


@router.post("/games", response_model=schemas.GameResponse)
def create_game(payload: schemas.GameCreate, db: Session = Depends(get_db)):
    """Create a new game lobby and auto-onboard the host as confirmed player 1."""
    # Find matching available slot to hold it if a venue was selected
    slot = None
    if payload.venue_id:
        slot = db.query(models.Slot).filter(
            models.Slot.venue_id == payload.venue_id,
            models.Slot.start_time == payload.slot_start,
            models.Slot.end_time == payload.slot_end,
            models.Slot.status == "AVAILABLE"
        ).first()

    booking_id = None
    if slot:
        # Put temporary slot hold
        slot.status = "HELD"
        slot.held_until = payload.slot_start
        slot.held_by_user_id = payload.host_id

        # Create temporary held booking
        booking = models.Booking(
            user_id=payload.host_id,
            court_id=slot.court_id,
            status="reserved",
            amount_paid=0,
            payment_status="pending"
        )
        booking.slots.append(slot)
        db.add(booking)
        db.flush()  # populate booking ID
        booking_id = booking.id

    game = models.Game(
        host_id=payload.host_id,
        venue_id=payload.venue_id,
        sport=payload.sport,
        slot_start=payload.slot_start,
        slot_end=payload.slot_end,
        total_spots=payload.total_spots,
        current_players=1,  # host count
        price_per_player=payload.price_per_player,
        join_policy=payload.join_policy,
        visibility=payload.visibility,
        status="open"
    )
    db.add(game)
    db.flush()

    # Host is automatically confirmed
    host_player = models.GamePlayer(
        game_id=game.id,
        user_id=payload.host_id,
        status="confirmed"
    )
    db.add(host_player)
    db.commit()
    db.refresh(game)
    return game


@router.post("/games/{game_id}/join", response_model=schemas.GameJoinResponse)
def join_game(game_id: str, user_id: int, payload: schemas.GameJoinRequest, db: Session = Depends(get_db)):
    """Join a game lobby instantly (if public join) or place joining request (if host approval required)."""
    # 1. Lock game row (concurrency guard)
    game = db.query(models.Game).filter(models.Game.id == str(game_id)).with_for_update().first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if game.status != "open":
        raise HTTPException(status_code=400, detail="Game lobby is not open")
    if game.slot_start <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Game has already started")
    if game.host_id == user_id:
        raise HTTPException(status_code=400, detail="Host is already counted as player 1")

    # Check for active player row
    existing = db.query(models.GamePlayer).filter(
        models.GamePlayer.game_id == str(game_id),
        models.GamePlayer.user_id == user_id,
        models.GamePlayer.status.in_(["confirmed", "pending_payment", "pending_approval"])
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You are already in this game or have a pending request")

    # Run passive hold release
    from app.services.hold_expiry import HoldExpiryService
    HoldExpiryService.passive_check(game.id, db)

    # 3. Check spots
    if game.current_players >= game.total_spots:
        return schemas.GameJoinResponse(
            status="full",
            payment_required=False,
            message="Lobby is full. Please join the waitlist."
        )

    if game.join_policy == "instant":
        player = models.GamePlayer(
            game_id=str(game_id),
            user_id=user_id,
            status="pending_payment"
        )
        db.add(player)
        
        # Increment immediately to hold the spot during payment
        game.current_players += 1
        if game.current_players >= game.total_spots:
            game.status = "full"
            
        db.commit()

        # Set Redis Hold key for 5 minutes
        redis_client.setex(f"game:{game_id}:hold:{user_id}", 300, "reserved")

        # Broadcast update
        ws_manager.broadcast_game_update(str(game.id), {
            "event": "player_joined",
            "game_id": str(game.id),
            "current_players": game.current_players,
            "spots_left": game.total_spots - game.current_players,
            "status": game.status
        })

        return schemas.GameJoinResponse(
            status="pending_payment",
            payment_required=True,
            hold_expires_at=datetime.utcnow() + timedelta(minutes=5)
        )

    elif game.join_policy == "request_approval":
        player = models.GamePlayer(
            game_id=str(game_id),
            user_id=user_id,
            status="pending_approval"
        )
        db.add(player)
        db.commit()

        # Notify host privately on game:{game_id}:host socket
        ws_manager.send_host_notification(game.host_id, {
            "event": "join_request_received",
            "game_id": str(game.id),
            "requester_id": str(user_id),
            "request_id": str(player.id)
        })

        return schemas.GameJoinResponse(
            status="pending_approval",
            payment_required=False,
            message="Join request submitted to host for approval."
        )


@router.post("/games/{game_id}/join-requests/{request_id}/respond")
def respond_join_request(game_id: str, request_id: str, host_id: int, payload: schemas.JoinRequestRespondBody, db: Session = Depends(get_db)):
    """Allow hosts to accept/reject joining requests. Triggers spot reservation hold upon acceptance."""
    game = db.query(models.Game).filter(models.Game.id == str(game_id)).with_for_update().first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if game.host_id != host_id:
        raise HTTPException(status_code=403, detail="Only the host can respond to join requests")

    player = db.query(models.GamePlayer).filter(
        models.GamePlayer.id == str(request_id),
        models.GamePlayer.game_id == str(game_id)
    ).with_for_update().first()

    if not player or player.status != "pending_approval":
        raise HTTPException(status_code=400, detail="Invalid request id or already processed")

    if payload.action == "reject":
        player.status = "rejected"
        db.commit()
        return {"status": "rejected"}

    elif payload.action == "accept":
        # Re-check slot space
        from app.services.hold_expiry import HoldExpiryService
        HoldExpiryService.passive_check(game.id, db)

        if game.current_players >= game.total_spots:
            player.status = "rejected"
            db.commit()
            raise HTTPException(status_code=409, detail="Lobby filled up. Request rejected automatically.")

        player.status = "pending_payment"
        game.current_players += 1
        if game.current_players >= game.total_spots:
            game.status = "full"
        db.commit()

        # Set Redis Hold key for 5 minutes
        redis_client.setex(f"game:{game_id}:hold:{player.user_id}", 300, "reserved")

        # Broadcast update
        ws_manager.broadcast_game_update(str(game.id), {
            "event": "player_joined",
            "game_id": str(game.id),
            "current_players": game.current_players,
            "spots_left": game.total_spots - game.current_players,
            "status": game.status
        })

        return {
            "status": "accepted_pending_payment",
            "hold_expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat() + "Z"
        }


@router.post("/games/{game_id}/waitlist", response_model=schemas.WaitlistEntryOut)
def join_waitlist(game_id: str, user_id: int, db: Session = Depends(get_db)):
    """Place player on game waitlist if lobby is full."""
    game = db.query(models.Game).filter(models.Game.id == str(game_id)).with_for_update().first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    existing = db.query(models.GameWaitlist).filter(
        models.GameWaitlist.game_id == str(game_id),
        models.GameWaitlist.user_id == user_id,
        models.GameWaitlist.status == "waiting"
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You are already on the waitlist")

    max_pos = db.query(func.max(models.GameWaitlist.position)).filter(
        models.GameWaitlist.game_id == str(game_id),
        models.GameWaitlist.status == "waiting"
    ).scalar() or 0

    entry = models.GameWaitlist(
        game_id=str(game_id),
        user_id=user_id,
        position=max_pos + 1,
        status="waiting"
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/games/{game_id}/players/me")
def leave_game(game_id: str, user_id: int, db: Session = Depends(get_db)):
    """Cancel own registration in a game lobby. Calculates refund rate based on cancellation window tiers."""
    player = db.query(models.GamePlayer).filter(
        models.GamePlayer.game_id == str(game_id),
        models.GamePlayer.user_id == user_id,
        models.GamePlayer.status.in_(["confirmed", "pending_payment"])
    ).with_for_update().first()

    if not player:
        raise HTTPException(status_code=404, detail="Active player registration not found")

    game = db.query(models.Game).filter(models.Game.id == str(game_id)).with_for_update().first()

    time_left = game.slot_start - datetime.utcnow()
    hours_left = time_left.total_seconds() / 3600.0

    refund_rate = 0.0
    for tier in CANCELLATION_TIERS:
        if hours_left >= tier["hours"]:
            refund_rate = tier["refund_percent"]
            break

    # Release Redis hold key if it exists
    redis_client.delete(f"game:{game_id}:hold:{user_id}")

    player.status = "cancelled"
    player.cancelled_at = datetime.utcnow()

    # Decrement counter
    if game.current_players > 1:
        game.current_players -= 1
    game.status = "open"
    db.commit()

    # Promote next candidate
    promote_next_waitlisted(game.id, db)

    # Broadcast update
    ws_manager.broadcast_game_update(str(game.id), {
        "event": "player_left",
        "game_id": str(game.id),
        "current_players": game.current_players,
        "spots_left": game.total_spots - game.current_players,
        "status": game.status
    })

    return {"detail": "Left game successfully.", "refund_rate": refund_rate}


@router.get("/games/{game_id}", response_model=schemas.GameDetailOut)
def get_game_detail(game_id: str, db: Session = Depends(get_db)):
    """Retrieve full details of a game lobby including active players list and waitlist count."""
    game = db.query(models.Game).filter(models.Game.id == str(game_id)).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    players = db.query(models.GamePlayer).filter(
        models.GamePlayer.game_id == str(game_id),
        models.GamePlayer.status.in_(["confirmed", "pending_payment"])
    ).all()

    waitlist_count = db.query(models.GameWaitlist).filter(
        models.GameWaitlist.game_id == str(game_id),
        models.GameWaitlist.status == "waiting"
    ).count()

    # Build response manually to fill User object relation
    player_outs = []
    for p in players:
        p_user = db.query(models.User).filter(models.User.id == p.user_id).first()
        player_outs.append(schemas.GamePlayerOut(
            id=p.id,
            user_id=p.user_id,
            user=schemas.UserMinOut(
                id=p_user.id,
                first_name=p_user.first_name,
                last_name=p_user.last_name,
                email=p_user.email
            ),
            status=p.status,
            joined_at=p.joined_at
        ))

    host_user = db.query(models.User).filter(models.User.id == game.host_id).first()

    return schemas.GameDetailOut(
        id=game.id,
        host_id=game.host_id,
        host=schemas.UserMinOut(
            id=host_user.id,
            first_name=host_user.first_name,
            last_name=host_user.last_name,
            email=host_user.email
        ),
        venue_id=game.venue_id,
        sport=game.sport,
        slot_start=game.slot_start,
        slot_end=game.slot_end,
        total_spots=game.total_spots,
        current_players=game.current_players,
        price_per_player=game.price_per_player,
        join_policy=game.join_policy,
        visibility=game.visibility,
        status=game.status,
        players=player_outs,
        waitlist_count=waitlist_count
    )


@router.post("/webhooks/payments/game-join")
def payment_webhook(payload: dict, db: Session = Depends(get_db)):
    """Capture Razorpay webhook status updates to confirm player slot booking and finalize slot statuses (Model B)."""
    event = payload.get("event")
    payment_id = payload.get("payment_id")
    game_id = payload.get("game_id")
    user_id = payload.get("user_id")

    player = db.query(models.GamePlayer).filter(
        models.GamePlayer.game_id == str(game_id),
        models.GamePlayer.user_id == int(user_id)
    ).with_for_update().first()

    if not player:
        raise HTTPException(status_code=404, detail="Player registration not found")

    if event == "payment.captured":
        player.status = "confirmed"
        player.payment_id = payment_id
        db.commit()

        # Remove Redis hold key
        redis_client.delete(f"game:{game_id}:hold:{user_id}")

        # Broadcast confirmation
        ws_manager.broadcast_game_update(str(game_id), {
            "event": "player_confirmed",
            "game_id": str(game_id),
            "user_id": str(user_id)
        })

        # Model B: Check if lobby meets threshold criteria (e.g. min_players met or is full) to finalize slot status
        game = db.query(models.Game).filter(models.Game.id == str(game_id)).first()
        confirmed_count = db.query(models.GamePlayer).filter(
            models.GamePlayer.game_id == str(game_id),
            models.GamePlayer.status == "confirmed"
        ).count()

        # Find any temporary Booking linked to host slot
        slot = db.query(models.Slot).filter(
            models.Slot.venue_id == game.venue_id,
            models.Slot.start_time == game.slot_start,
            models.Slot.end_time == game.slot_end,
            models.Slot.status == "HELD"
        ).first()

        if slot and confirmed_count >= game.total_spots:
            # Confirm slot booking
            slot.status = "BOOKED"
            booking = db.query(models.Booking).join(models.Booking.slots).filter(
                models.Slot.id == slot.id,
                models.Booking.status == "reserved"
            ).first()
            if booking:
                booking.status = "confirmed"
                booking.payment_status = "paid"
                booking.amount_paid = int(game.price_per_player * confirmed_count * 100) # in paise
            db.commit()

    elif event in ["payment.failed", "payment.timed_out"]:
        from app.services.hold_expiry import HoldExpiryService
        HoldExpiryService.cancel_and_release(player.id, db)
        redis_client.delete(f"game:{game_id}:hold:{user_id}")

    return {"status": "processed"}


@router.delete("/games/{game_id}")
def cancel_game_lobby(game_id: str, host_id: int, db: Session = Depends(get_db)):
    """Cancel the entire game lobby and trigger refunds for all confirmed players."""
    game = db.query(models.Game).filter(models.Game.id == str(game_id)).with_for_update().first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
        
    if game.host_id != host_id:
        raise HTTPException(status_code=403, detail="Only the host can cancel the game lobby")

    game.status = "cancelled"
    
    # 1. Release database venue slot hold
    if game.venue_id:
        slot = db.query(models.Slot).filter(
            models.Slot.venue_id == game.venue_id,
            models.Slot.start_time == game.slot_start,
            models.Slot.end_time == game.slot_end,
            models.Slot.status.in_(["HELD", "BOOKED"])
        ).first()
        
        if slot:
            slot.status = "AVAILABLE"
            booking = db.query(models.Booking).join(models.Booking.slots).filter(
                models.Slot.id == slot.id,
                models.Booking.status.in_(["reserved", "confirmed"])
            ).first()
            if booking:
                booking.status = "cancelled"
                booking.cancellation_reason = "Game lobby cancelled by host"

    # 2. Cancel and refund all confirmed players
    players = db.query(models.GamePlayer).filter(
        models.GamePlayer.game_id == str(game_id),
        models.GamePlayer.status.in_(["confirmed", "pending_payment"])
    ).all()

    for p in players:
        p.status = "cancelled"
        p.cancelled_at = datetime.utcnow()

    db.commit()

    # Broadcast event
    ws_manager.broadcast_game_update(str(game_id), {
        "event": "game_cancelled",
        "game_id": str(game_id)
    })

    return {"detail": "Game lobby cancelled and refunded successfully."}


from fastapi import WebSocket, WebSocketDisconnect

@router.websocket("/ws/game/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: str, is_host: bool = False, user_id: Optional[str] = None):
    await ws_manager.connect(websocket, game_id, is_host, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, game_id, is_host, user_id)

