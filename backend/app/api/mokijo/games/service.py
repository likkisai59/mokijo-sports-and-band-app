from fastapi import APIRouter, Depends, Request, HTTPException, WebSocket, WebSocketDisconnect, status
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import uuid

from app.models import schemas
from sqlalchemy.orm import Session
from app.auth.authorization import check_user_authorization
from app.core.websocket import ws_manager
from app.services.hold_expiry import redis_client, promote_next_waitlisted, HoldExpiryService
from app.logger import logger

CANCELLATION_TIERS = [
{"hours": 24, "refund_percent": 1.00},
{"hours": 6,  "refund_percent": 0.50},
{"hours": 0,  "refund_percent": 0.00},
]

def serialize_game_player(p, db):
    if not p:
        return None
    p_user = crud.get_user_basic(db, p.get("user_id"))
    return {
        "id": p.get("id"),
        "user_id": p.get("user_id"),
        "user": {
            "id": p_user.get("id") if p_user else p.get("user_id"),
            "first_name": p_user.get("first_name") if p_user else "",
            "last_name": p_user.get("last_name") if p_user else "",
            "email": p_user.get("email") if p_user else ""
        },
        "status": p.get("status"),
        "joined_at": p.get("joined_at").isoformat() if isinstance(p.get("joined_at"), datetime) else p.get("joined_at")
    }

def serialize_game(game, db):
    if not game:
        return None
    s_start = game.get("slot_start")
    s_end = game.get("slot_end")
    created_at = game.get("created_at")
    updated_at = game.get("updated_at")
    return {
        "id": game.get("id"),
        "host_id": game.get("host_id"),
        "venue_id": game.get("venue_id"),
        "sport": game.get("sport"),
        "slot_start": s_start.isoformat() if isinstance(s_start, datetime) else s_start,
        "slot_end": s_end.isoformat() if isinstance(s_end, datetime) else s_end,
        "total_spots": game.get("total_spots"),
        "current_players": game.get("current_players"),
        "price_per_player": float(game.get("price_per_player") or 0.0),
        "join_policy": game.get("join_policy"),
        "visibility": game.get("visibility"),
        "status": game.get("status"),
        "created_at": created_at.isoformat() if isinstance(created_at, datetime) else created_at,
        "updated_at": updated_at.isoformat() if isinstance(updated_at, datetime) else updated_at,
    }

    from app.api.mokijo.games import crud

async def get_games(request: Request, db: Session, sport: Optional[str], current_user: dict):
    try:
        with logger.time_operation("GET_GAMES", request=request):
            games = crud.get_public_games(db, sport)
            return [serialize_game(g, db) for g in games]
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed getting games: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_user_games(request: Request, db: Session, user_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_USER_GAMES", request=request):
            hosted = crud.get_games_by_host(db, user_id)
            joined_players = crud.get_game_players_by_user_and_status(db, user_id, "confirmed")
            joined_ids = [str(g.get("game_id")) for g in joined_players]
            
            joined = []
            if joined_ids:
                joined = crud.get_games_by_ids(db, tuple(joined_ids))

            unique = {}
            for g in (hosted + joined):
                unique[g.get("id")] = g

            return [serialize_game(g, db) for g in unique.values()]
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed getting user games: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def create_game(request: Request, db: Session, payload: schemas.GameCreate, current_user: dict):
    try:
        with logger.time_operation("CREATE_GAME", request=request):
            slot = None
            if payload.venue_id:
                slot = crud.get_available_slot_for_update(db, payload.venue_id, payload.slot_start, payload.slot_end)

            booking_id = None
            if slot:
                crud.update_slot_hold(db, slot.get("id"), payload.slot_start, payload.host_id)

                insert_booking = {
                    "user_id": payload.host_id,
                    "court_id": slot.get("court_id"),
                    "status": "reserved",
                    "amount_paid": 0,
                    "payment_status": "pending",
                    "booking_date": datetime.utcnow()
                }
                booking_id = crud.create_booking(db, insert_booking)
                crud.create_booking_slot(db, booking_id, slot.get("id"))

            g_id = str(uuid.uuid4())
            now = datetime.utcnow()
            insert_game = {
                "id": g_id,
                "host_id": payload.host_id,
                "venue_id": payload.venue_id,
                "sport": payload.sport,
                "slot_start": payload.slot_start,
                "slot_end": payload.slot_end,
                "total_spots": payload.total_spots,
                "current_players": 1,
                "price_per_player": payload.price_per_player,
                "join_policy": payload.join_policy,
                "visibility": payload.visibility,
                "status": "open",
                "created_at": now,
                "updated_at": now,
            }
            crud.create_game(db, insert_game)

            p_id = str(uuid.uuid4())
            insert_player = {
                "id": p_id,
                "game_id": g_id,
                "user_id": payload.host_id,
                "status": "confirmed",
                "joined_at": now,
            }
            crud.create_game_player(db, insert_player)

            new_game = crud.get_game(db, g_id)
            return serialize_game(new_game, db)
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed creating game: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def join_game(request: Request, db: Session, game_id: str, user_id: int, payload: schemas.GameJoinRequest, current_user: dict):
    try:
        with logger.time_operation("JOIN_GAME", request=request):
            game = crud.get_game_for_update(db, str(game_id))
            if not game:
                raise HTTPException(status_code=404, detail="Game not found")

            if game.get("status") != "open":
                raise HTTPException(status_code=400, detail="Game lobby is not open")
            
            # Check slot_start timezone offset
            s_start = game.get("slot_start")
            if s_start.tzinfo is not None:
                now = datetime.now(timezone.utc)
            else:
                now = datetime.utcnow()

            if s_start <= now:
                raise HTTPException(status_code=400, detail="Game has already started")
            if game.get("host_id") == user_id:
                raise HTTPException(status_code=400, detail="Host is already counted as player 1")

            existing = crud.get_active_player_by_game_and_user(db, str(game_id), user_id)
            if existing:
                raise HTTPException(status_code=400, detail="You are already in this game or have a pending request")

            HoldExpiryService.passive_check(game.get("id"), db)

            # Re-fetch game after passive hold release
            game = crud.get_game_for_update(db, str(game_id))
            curr_players = game.get("current_players") or 0
            tot_spots = game.get("total_spots") or 0

            if curr_players >= tot_spots:
                return {
                    "status": "full",
                    "payment_required": False,
                    "message": "Lobby is full. Please join the waitlist."
                }

            policy = game.get("join_policy")
            if policy == "instant":
                p_id = str(uuid.uuid4())
                insert_player = {
                    "id": p_id,
                    "game_id": str(game_id),
                    "user_id": user_id,
                    "status": "pending_payment",
                    "joined_at": now,
                }
                crud.create_game_player(db, insert_player)
                
                curr_players += 1
                status_val = game.get("status")
                if curr_players >= tot_spots:
                    status_val = "full"
                    
                crud.update_game_stats(db, str(game_id), curr_players, status_val)

                redis_client.setex(f"game:{game_id}:hold:{user_id}", 300, "reserved")

                ws_manager.broadcast_game_update(str(game_id), {
                    "event": "player_joined",
                    "game_id": str(game_id),
                    "current_players": curr_players,
                    "spots_left": tot_spots - curr_players,
                    "status": status_val
                })

                return {
                    "status": "pending_payment",
                    "payment_required": True,
                    "hold_expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat() + "Z"
                }

            elif policy == "request_approval":
                p_id = str(uuid.uuid4())
                insert_player = {
                    "id": p_id,
                    "game_id": str(game_id),
                    "user_id": user_id,
                    "status": "pending_approval",
                    "joined_at": now,
                }
                crud.create_game_player(db, insert_player)

                ws_manager.send_host_notification(game.get("host_id"), {
                    "event": "join_request_received",
                    "game_id": str(game_id),
                    "requester_id": str(user_id),
                    "request_id": p_id
                })

                return {
                    "status": "pending_approval",
                    "payment_required": False,
                    "message": "Join request submitted to host for approval."
                }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed joining game: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def respond_join_request(
    self,
    request: Request,
    game_id: str,
    request_id: str,
    host_id: int,
    payload: schemas.JoinRequestRespondBody,
    current_user: dict
):
    try:
        with logger.time_operation("RESPOND_JOIN_REQUEST", request=request):
            game = crud.get_game_for_update(db, str(game_id))
            if not game:
                raise HTTPException(status_code=404, detail="Game not found")

            if game.get("host_id") != host_id:
                raise HTTPException(status_code=403, detail="Only the host can respond to join requests")

            player = crud.get_player_for_update(db, str(request_id), str(game_id))
            if not player or player.get("status") != "pending_approval":
                raise HTTPException(status_code=400, detail="Invalid request id or already processed")

            if payload.action == "reject":
                crud.update_player_status(db, str(request_id), "rejected")
                return {"status": "rejected"}

            elif payload.action == "accept":
                HoldExpiryService.passive_check(game.get("id"), db)

                # Re-fetch game state
                game = crud.get_game_for_update(db, str(game_id))
                curr_players = game.get("current_players") or 0
                tot_spots = game.get("total_spots") or 0

                if curr_players >= tot_spots:
                    crud.update_player_status(db, str(request_id), "rejected")
                    raise HTTPException(status_code=409, detail="Lobby filled up. Request rejected automatically.")

                crud.update_player_status(db, str(request_id), "pending_payment")
                
                curr_players += 1
                status_val = game.get("status")
                if curr_players >= tot_spots:
                    status_val = "full"
                
                crud.update_game_stats(db, str(game_id), curr_players, status_val)

                redis_client.setex(f"game:{game_id}:hold:{player.get('user_id')}", 300, "reserved")

                ws_manager.broadcast_game_update(str(game_id), {
                    "event": "player_joined",
                    "game_id": str(game_id),
                    "current_players": curr_players,
                    "spots_left": tot_spots - curr_players,
                    "status": status_val
                })

                return {
                    "status": "accepted_pending_payment",
                    "hold_expires_at": (datetime.utcnow() + timedelta(minutes=5)).isoformat() + "Z"
                }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed responding to request: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def join_waitlist(request: Request, db: Session, game_id: str, user_id: int, current_user: dict):
    try:
        with logger.time_operation("JOIN_WAITLIST", request=request):
            game = crud.get_game_for_update(db, str(game_id))
            if not game:
                raise HTTPException(status_code=404, detail="Game not found")

            existing = crud.get_waitlist_by_game_and_user(db, str(game_id), user_id)
            if existing:
                raise HTTPException(status_code=400, detail="You are already on the waitlist")

            max_pos_res = {"max_pos": crud.get_max_waitlist_position(db, str(game_id))}
            max_pos = max_pos_res.get("max_pos", 0) if (max_pos_res and max_pos_res.get("max_pos") is not None) else 0

            insert_waitlist = {
                "game_id": str(game_id),
                "user_id": user_id,
                "position": max_pos + 1,
                "status": "waiting"
            }
            w_id = crud.create_waitlist_entry(db, insert_waitlist)
            entry = crud.get_waitlist_entry(db, w_id)
            return entry
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed joining waitlist: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def leave_game(request: Request, db: Session, game_id: str, user_id: int, current_user: dict):
    try:
        with logger.time_operation("LEAVE_GAME", request=request):
            player = crud.get_active_player_by_game_and_user_for_update(db, str(game_id), user_id)
            if not player:
                raise HTTPException(status_code=404, detail="Active player registration not found")

            game = crud.get_game_for_update(db, str(game_id))

            time_left = game.get("slot_start") - datetime.utcnow()
            hours_left = time_left.total_seconds() / 3600.0

            refund_rate = 0.0
            for tier in CANCELLATION_TIERS:
                if hours_left >= tier["hours"]:
                    refund_rate = tier["refund_percent"]
                    break

            redis_client.delete(f"game:{game_id}:hold:{user_id}")

            crud.update_player_cancellation(db, player.get("id"), datetime.utcnow())

            curr_players = game.get("current_players") or 0
            if curr_players > 1:
                curr_players -= 1
            status_val = "open"

            crud.update_game_stats(db, str(game_id), curr_players, status_val)

            promote_next_waitlisted(str(game_id), db)

            ws_manager.broadcast_game_update(str(game_id), {
                "event": "player_left",
                "game_id": str(game_id),
                "current_players": curr_players,
                "spots_left": (game.get("total_spots") or 0) - curr_players,
                "status": status_val
            })

            return {"detail": "Left game successfully.", "refund_rate": refund_rate}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed leaving game: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_game_detail(request: Request, db: Session, game_id: str, current_user: dict):
    try:
        with logger.time_operation("GET_GAME_DETAIL", request=request):
            game = crud.get_game(db, str(game_id))
            if not game:
                raise HTTPException(status_code=404, detail="Game not found")

            players = crud.get_active_players_by_game(db, str(game_id))

            waitlist_count_res = {"count": crud.get_waitlist_count_by_game(db, str(game_id))}
            waitlist_count = waitlist_count_res.get("count", 0) if waitlist_count_res else 0

            player_outs = [serialize_game_player(p, db) for p in players]
            host_user = crud.get_user_basic(db, game.get("host_id"))

            return {
                "id": game.get("id"),
                "host_id": game.get("host_id"),
                "host": {
                    "id": host_user.get("id") if host_user else game.get("host_id"),
                    "first_name": host_user.get("first_name") if host_user else "",
                    "last_name": host_user.get("last_name") if host_user else "",
                    "email": host_user.get("email") if host_user else ""
                },
                "venue_id": game.get("venue_id"),
                "sport": game.get("sport"),
                "slot_start": game.get("slot_start").isoformat() if isinstance(game.get("slot_start"), datetime) else game.get("slot_start"),
                "slot_end": game.get("slot_end").isoformat() if isinstance(game.get("slot_end"), datetime) else game.get("slot_end"),
                "total_spots": game.get("total_spots"),
                "current_players": game.get("current_players"),
                "price_per_player": float(game.get("price_per_player") or 0.0),
                "join_policy": game.get("join_policy"),
                "visibility": game.get("visibility"),
                "status": game.get("status"),
                "players": player_outs,
                "waitlist_count": waitlist_count
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed getting game detail: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def payment_webhook(request: Request, db: Session, payload: dict):
    try:
        with logger.time_operation("PAYMENT_WEBHOOK_GAMES", request=request):
            event = payload.get("event")
            payment_id = payload.get("payment_id")
            game_id = payload.get("game_id")
            user_id = payload.get("user_id")

            player = crud.get_player_by_game_and_user_for_update(db, str(game_id), int(user_id))
            if not player:
                raise HTTPException(status_code=404, detail="Player registration not found")

            if event == "payment.captured":
                crud.update_player_confirmation(db, player.get("id"), payment_id)

                redis_client.delete(f"game:{game_id}:hold:{user_id}")

                ws_manager.broadcast_game_update(str(game_id), {
                    "event": "player_confirmed",
                    "game_id": str(game_id),
                    "user_id": str(user_id)
                })

                game = crud.get_game(db, str(game_id))
                confirmed_count_res = crud.get_confirmed_player_count(db, str(game_id))
                confirmed_count = confirmed_count_res.get("count", 0) if confirmed_count_res else 0

                slot = crud.get_held_slot(db, game.get("venue_id"), game.get("slot_start"), game.get("slot_end"))

                if slot and confirmed_count >= (game.get("total_spots") or 0):
                    crud.update_slot_status(db, slot.get("id"), "BOOKED")
                    booking = crud.get_booking_by_slot(db, slot.get("id"))
                    if booking:
                        crud.update_booking_confirmation(db, booking.get("id"), float((game.get("price_per_player") or 0) * confirmed_count * 100))

            elif event in ["payment.failed", "payment.timed_out"]:
                HoldExpiryService.cancel_and_release(player.get("id"), db)
                redis_client.delete(f"game:{game_id}:hold:{user_id}")

            return {"status": "processed"}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Webhook execution error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def cancel_game_lobby(request: Request, db: Session, game_id: str, host_id: int, current_user: dict):
    try:
        with logger.time_operation("CANCEL_GAME_LOBBY", request=request):
            game = crud.get_game_for_update(db, str(game_id))
            if not game:
                raise HTTPException(status_code=404, detail="Game not found")

            if game.get("host_id") != host_id:
                raise HTTPException(status_code=403, detail="Only the host can cancel the game lobby")

            crud.update_game_status(db, str(game_id), "cancelled")

            if game.get("venue_id"):
                slot = crud.get_slot_by_status(db, game.get("venue_id"), game.get("slot_start"), game.get("slot_end"), ["HELD", "BOOKED"])
                if slot:
                    crud.release_slot(db, slot.get("id"))
                    bookings = crud.get_bookings_by_slot(db, slot.get("id"))
                    booking = bookings[0] if bookings else None
                    if booking:
                        crud.cancel_booking(db, booking.get("id"), 'Game lobby cancelled by host')

            crud.cancel_active_players_by_game(db, str(game_id), datetime.utcnow())

            ws_manager.broadcast_game_update(str(game_id), {
                "event": "game_cancelled",
                "game_id": str(game_id)
            })

            return {"detail": "Game lobby cancelled and refunded successfully."}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed cancel game lobby: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
