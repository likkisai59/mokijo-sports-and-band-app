from fastapi import APIRouter, Depends, Request, HTTPException, WebSocket, WebSocketDisconnect, status
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import uuid

from app.models import schemas
from app.connectors.connection_service import ConnectionService
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
    p_user = db.fetch_one("SELECT id, first_name, last_name, email FROM users WHERE id = %s LIMIT 1", (p.get("user_id"),))
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


class GamesRouting(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        
        self.router.add_api_route(
            path="/games",
            endpoint=self.get_games,
            methods=["GET"],
            response_model=List[schemas.GameResponse],
            summary="Retrieve all open public game lobbies that haven't started yet.",
            tags=["Games"]
        )
        self.router.add_api_route(
            path="/users/{user_id}/games",
            endpoint=self.get_user_games,
            methods=["GET"],
            response_model=List[schemas.GameResponse],
            summary="Retrieve all games where the user is either the host or a registered player.",
            tags=["Games"]
        )
        self.router.add_api_route(
            path="/games",
            endpoint=self.create_game,
            methods=["POST"],
            response_model=schemas.GameResponse,
            summary="Create a new game lobby and auto-onboard the host as confirmed player 1.",
            tags=["Games"]
        )
        self.router.add_api_route(
            path="/games/{game_id}/join",
            endpoint=self.join_game,
            methods=["POST"],
            response_model=schemas.GameJoinResponse,
            summary="Join a game lobby instantly (if public join) or place joining request (if host approval required).",
            tags=["Games"]
        )
        self.router.add_api_route(
            path="/games/{game_id}/join-requests/{request_id}/respond",
            endpoint=self.respond_join_request,
            methods=["POST"],
            summary="Allow hosts to accept/reject joining requests. Triggers spot reservation hold upon acceptance.",
            tags=["Games"]
        )
        self.router.add_api_route(
            path="/games/{game_id}/waitlist",
            endpoint=self.join_waitlist,
            methods=["POST"],
            response_model=schemas.WaitlistEntryOut,
            summary="Place player on game waitlist if lobby is full.",
            tags=["Games"]
        )
        self.router.add_api_route(
            path="/games/{game_id}/players/me",
            endpoint=self.leave_game,
            methods=["DELETE"],
            summary="Cancel own registration in a game lobby. Calculates refund rate based on cancellation window tiers.",
            tags=["Games"]
        )
        self.router.add_api_route(
            path="/games/{game_id}",
            endpoint=self.get_game_detail,
            methods=["GET"],
            response_model=schemas.GameDetailOut,
            summary="Retrieve full details of a game lobby including active players list and waitlist count.",
            tags=["Games"]
        )
        self.router.add_api_route(
            path="/webhooks/payments/game-join",
            endpoint=self.payment_webhook,
            methods=["POST"],
            summary="Capture Razorpay webhook status updates to confirm player slot booking and finalize slot statuses.",
            tags=["Games"]
        )
        self.router.add_api_route(
            path="/games/{game_id}",
            endpoint=self.cancel_game_lobby,
            methods=["DELETE"],
            summary="Cancel the entire game lobby and trigger refunds for all confirmed players.",
            tags=["Games"]
        )
        
        # Register the WebSocket route
        self.router.add_api_websocket_route(
            path="/ws/game/{game_id}",
            endpoint=self.websocket_endpoint
        )

    async def get_games(self, request: Request, sport: Optional[str] = None, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Get games router start", step="ROUTER_START", user_info=current_user)
        logic = GamesLogic()
        return await logic.get_games(request, sport, current_user)

    async def get_user_games(self, request: Request, user_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Get user games router start", step="ROUTER_START", user_info=current_user)
        logic = GamesLogic()
        return await logic.get_user_games(request, user_id, current_user)

    async def create_game(self, request: Request, payload: schemas.GameCreate, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Create game router start", step="ROUTER_START", user_info=current_user)
        logic = GamesLogic()
        return await logic.create_game(request, payload, current_user)

    async def join_game(self, request: Request, game_id: str, user_id: int, payload: schemas.GameJoinRequest, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Join game router start", step="ROUTER_START", user_info=current_user)
        logic = GamesLogic()
        return await logic.join_game(request, game_id, user_id, payload, current_user)

    async def respond_join_request(
        self,
        request: Request,
        game_id: str,
        request_id: str,
        host_id: int,
        payload: schemas.JoinRequestRespondBody,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Respond join request router start", step="ROUTER_START", user_info=current_user)
        logic = GamesLogic()
        return await logic.respond_join_request(request, game_id, request_id, host_id, payload, current_user)

    async def join_waitlist(self, request: Request, game_id: str, user_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Join waitlist router start", step="ROUTER_START", user_info=current_user)
        logic = GamesLogic()
        return await logic.join_waitlist(request, game_id, user_id, current_user)

    async def leave_game(self, request: Request, game_id: str, user_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Leave game router start", step="ROUTER_START", user_info=current_user)
        logic = GamesLogic()
        return await logic.leave_game(request, game_id, user_id, current_user)

    async def get_game_detail(self, request: Request, game_id: str, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Get game detail router start", step="ROUTER_START", user_info=current_user)
        logic = GamesLogic()
        return await logic.get_game_detail(request, game_id, current_user)

    async def payment_webhook(self, request: Request, payload: dict):
        await logger.log_message(request=request, message="Payment webhook router start", step="ROUTER_START")
        logic = GamesLogic()
        return await logic.payment_webhook(request, payload)

    async def cancel_game_lobby(self, request: Request, game_id: str, host_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Cancel game lobby router start", step="ROUTER_START", user_info=current_user)
        logic = GamesLogic()
        return await logic.cancel_game_lobby(request, game_id, host_id, current_user)

    async def websocket_endpoint(self, websocket: WebSocket, game_id: str, is_host: bool = False, user_id: Optional[str] = None):
        await ws_manager.connect(websocket, game_id, is_host, user_id)
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            ws_manager.disconnect(websocket, game_id, is_host, user_id)


class GamesLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        logger.log_message_sync(message="GamesLogic instance created")

    async def get_games(self, request: Request, sport: Optional[str], current_user: dict):
        try:
            with logger.time_operation("GET_GAMES", request=request):
                db = self.db_driver
                query = "SELECT * FROM games WHERE status = 'open' AND visibility = 'public' AND slot_start > NOW()"
                params = []
                if sport and sport != "all":
                    query += " AND sport = %s"
                    params.append(sport)
                
                games = db.fetch_all(query, tuple(params))
                return [serialize_game(g, db) for g in games]
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting games: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_user_games(self, request: Request, user_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_USER_GAMES", request=request):
                db = self.db_driver
                hosted = db.fetch_all("SELECT * FROM games WHERE host_id = %s", (user_id,))
                joined_players = db.fetch_all(
                    "SELECT game_id FROM game_players WHERE user_id = %s AND status = 'confirmed'",
                    (user_id,)
                )
                joined_ids = [str(g.get("game_id")) for g in joined_players]
                
                joined = []
                if joined_ids:
                    placeholders = ", ".join(["%s"] * len(joined_ids))
                    joined = db.fetch_all(f"SELECT * FROM games WHERE id IN ({placeholders})", tuple(joined_ids))

                unique = {}
                for g in (hosted + joined):
                    unique[g.get("id")] = g

                return [serialize_game(g, db) for g in unique.values()]
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting user games: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def create_game(self, request: Request, payload: schemas.GameCreate, current_user: dict):
        try:
            with logger.time_operation("CREATE_GAME", request=request):
                db = self.db_driver
                slot = None
                if payload.venue_id:
                    slot = db.fetch_one(
                        "SELECT * FROM slots WHERE venue_id = %s AND start_time = %s AND end_time = %s AND status = 'AVAILABLE' LIMIT 1 FOR UPDATE",
                        (payload.venue_id, payload.slot_start, payload.slot_end)
                    )

                booking_id = None
                if slot:
                    db.execute_query(
                        "UPDATE slots SET status = 'HELD', held_until = %s, held_by_user_id = %s WHERE id = %s",
                        (payload.slot_start, payload.host_id, slot.get("id"))
                    )

                    insert_booking = {
                        "user_id": payload.host_id,
                        "court_id": slot.get("court_id"),
                        "status": "reserved",
                        "amount_paid": 0,
                        "payment_status": "pending",
                        "booking_date": datetime.utcnow()
                    }
                    booking_id = db.insert("bookings", insert_booking)
                    db.insert("booking_slots", {"booking_id": booking_id, "slot_id": slot.get("id")})

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
                db.insert("games", insert_game)

                p_id = str(uuid.uuid4())
                insert_player = {
                    "id": p_id,
                    "game_id": g_id,
                    "user_id": payload.host_id,
                    "status": "confirmed",
                    "joined_at": now,
                }
                db.insert("game_players", insert_player)

                new_game = db.fetch_one("SELECT * FROM games WHERE id = %s", (g_id,))
                return serialize_game(new_game, db)
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed creating game: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def join_game(self, request: Request, game_id: str, user_id: int, payload: schemas.GameJoinRequest, current_user: dict):
        try:
            with logger.time_operation("JOIN_GAME", request=request):
                db = self.db_driver
                game = db.fetch_one("SELECT * FROM games WHERE id = %s FOR UPDATE", (str(game_id),))
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

                existing = db.fetch_one(
                    "SELECT id FROM game_players WHERE game_id = %s AND user_id = %s AND status IN ('confirmed', 'pending_payment', 'pending_approval') LIMIT 1",
                    (str(game_id), user_id)
                )
                if existing:
                    raise HTTPException(status_code=400, detail="You are already in this game or have a pending request")

                HoldExpiryService.passive_check(game.get("id"), db)

                # Re-fetch game after passive hold release
                game = db.fetch_one("SELECT * FROM games WHERE id = %s FOR UPDATE", (str(game_id),))
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
                    db.insert("game_players", insert_player)
                    
                    curr_players += 1
                    status_val = game.get("status")
                    if curr_players >= tot_spots:
                        status_val = "full"
                        
                    db.execute_query(
                        "UPDATE games SET current_players = %s, status = %s WHERE id = %s",
                        (curr_players, status_val, str(game_id))
                    )

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
                    db.insert("game_players", insert_player)

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
                db = self.db_driver
                game = db.fetch_one("SELECT * FROM games WHERE id = %s FOR UPDATE", (str(game_id),))
                if not game:
                    raise HTTPException(status_code=404, detail="Game not found")

                if game.get("host_id") != host_id:
                    raise HTTPException(status_code=403, detail="Only the host can respond to join requests")

                player = db.fetch_one(
                    "SELECT * FROM game_players WHERE id = %s AND game_id = %s FOR UPDATE",
                    (str(request_id), str(game_id))
                )
                if not player or player.get("status") != "pending_approval":
                    raise HTTPException(status_code=400, detail="Invalid request id or already processed")

                if payload.action == "reject":
                    db.execute_query("UPDATE game_players SET status = 'rejected' WHERE id = %s", (str(request_id),))
                    return {"status": "rejected"}

                elif payload.action == "accept":
                    HoldExpiryService.passive_check(game.get("id"), db)

                    # Re-fetch game state
                    game = db.fetch_one("SELECT * FROM games WHERE id = %s FOR UPDATE", (str(game_id),))
                    curr_players = game.get("current_players") or 0
                    tot_spots = game.get("total_spots") or 0

                    if curr_players >= tot_spots:
                        db.execute_query("UPDATE game_players SET status = 'rejected' WHERE id = %s", (str(request_id),))
                        raise HTTPException(status_code=409, detail="Lobby filled up. Request rejected automatically.")

                    db.execute_query("UPDATE game_players SET status = 'pending_payment' WHERE id = %s", (str(request_id),))
                    
                    curr_players += 1
                    status_val = game.get("status")
                    if curr_players >= tot_spots:
                        status_val = "full"
                    
                    db.execute_query(
                        "UPDATE games SET current_players = %s, status = %s WHERE id = %s",
                        (curr_players, status_val, str(game_id))
                    )

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

    async def join_waitlist(self, request: Request, game_id: str, user_id: int, current_user: dict):
        try:
            with logger.time_operation("JOIN_WAITLIST", request=request):
                db = self.db_driver
                game = db.fetch_one("SELECT * FROM games WHERE id = %s FOR UPDATE", (str(game_id),))
                if not game:
                    raise HTTPException(status_code=404, detail="Game not found")

                existing = db.fetch_one(
                    "SELECT id FROM game_waitlist WHERE game_id = %s AND user_id = %s AND status = 'waiting' LIMIT 1",
                    (str(game_id), user_id)
                )
                if existing:
                    raise HTTPException(status_code=400, detail="You are already on the waitlist")

                max_pos_res = db.fetch_one(
                    "SELECT MAX(position) as max_pos FROM game_waitlist WHERE game_id = %s AND status = 'waiting'",
                    (str(game_id),)
                )
                max_pos = max_pos_res.get("max_pos", 0) if (max_pos_res and max_pos_res.get("max_pos") is not None) else 0

                insert_waitlist = {
                    "game_id": str(game_id),
                    "user_id": user_id,
                    "position": max_pos + 1,
                    "status": "waiting"
                }
                w_id = db.insert("game_waitlist", insert_waitlist)
                entry = db.fetch_one("SELECT * FROM game_waitlist WHERE id = %s", (w_id,))
                return entry
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed joining waitlist: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def leave_game(self, request: Request, game_id: str, user_id: int, current_user: dict):
        try:
            with logger.time_operation("LEAVE_GAME", request=request):
                db = self.db_driver
                player = db.fetch_one(
                    "SELECT * FROM game_players WHERE game_id = %s AND user_id = %s AND status IN ('confirmed', 'pending_payment') LIMIT 1 FOR UPDATE",
                    (str(game_id), user_id)
                )
                if not player:
                    raise HTTPException(status_code=404, detail="Active player registration not found")

                game = db.fetch_one("SELECT * FROM games WHERE id = %s FOR UPDATE", (str(game_id),))

                time_left = game.get("slot_start") - datetime.utcnow()
                hours_left = time_left.total_seconds() / 3600.0

                refund_rate = 0.0
                for tier in CANCELLATION_TIERS:
                    if hours_left >= tier["hours"]:
                        refund_rate = tier["refund_percent"]
                        break

                redis_client.delete(f"game:{game_id}:hold:{user_id}")

                db.execute_query(
                    "UPDATE game_players SET status = 'cancelled', cancelled_at = %s WHERE id = %s",
                    (datetime.utcnow(), player.get("id"))
                )

                curr_players = game.get("current_players") or 0
                if curr_players > 1:
                    curr_players -= 1
                status_val = "open"

                db.execute_query(
                    "UPDATE games SET current_players = %s, status = %s WHERE id = %s",
                    (curr_players, status_val, str(game_id))
                )

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

    async def get_game_detail(self, request: Request, game_id: str, current_user: dict):
        try:
            with logger.time_operation("GET_GAME_DETAIL", request=request):
                db = self.db_driver
                game = db.fetch_one("SELECT * FROM games WHERE id = %s LIMIT 1", (str(game_id),))
                if not game:
                    raise HTTPException(status_code=404, detail="Game not found")

                players = db.fetch_all(
                    "SELECT * FROM game_players WHERE game_id = %s AND status IN ('confirmed', 'pending_payment')",
                    (str(game_id),)
                )

                waitlist_count_res = db.fetch_one(
                    "SELECT COUNT(*) as count FROM game_waitlist WHERE game_id = %s AND status = 'waiting'",
                    (str(game_id),)
                )
                waitlist_count = waitlist_count_res.get("count", 0) if waitlist_count_res else 0

                player_outs = [serialize_game_player(p, db) for p in players]
                host_user = db.fetch_one("SELECT id, first_name, last_name, email FROM users WHERE id = %s LIMIT 1", (game.get("host_id"),))

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

    async def payment_webhook(self, request: Request, payload: dict):
        try:
            with logger.time_operation("PAYMENT_WEBHOOK_GAMES", request=request):
                db = self.db_driver
                event = payload.get("event")
                payment_id = payload.get("payment_id")
                game_id = payload.get("game_id")
                user_id = payload.get("user_id")

                player = db.fetch_one(
                    "SELECT * FROM game_players WHERE game_id = %s AND user_id = %s LIMIT 1 FOR UPDATE",
                    (str(game_id), int(user_id))
                )
                if not player:
                    raise HTTPException(status_code=404, detail="Player registration not found")

                if event == "payment.captured":
                    db.execute_query(
                        "UPDATE game_players SET status = 'confirmed', payment_id = %s WHERE id = %s",
                        (payment_id, player.get("id"))
                    )

                    redis_client.delete(f"game:{game_id}:hold:{user_id}")

                    ws_manager.broadcast_game_update(str(game_id), {
                        "event": "player_confirmed",
                        "game_id": str(game_id),
                        "user_id": str(user_id)
                    })

                    game = db.fetch_one("SELECT * FROM games WHERE id = %s LIMIT 1", (str(game_id),))
                    confirmed_count_res = db.fetch_one(
                        "SELECT COUNT(*) as count FROM game_players WHERE game_id = %s AND status = 'confirmed'",
                        (str(game_id),)
                    )
                    confirmed_count = confirmed_count_res.get("count", 0) if confirmed_count_res else 0

                    slot = db.fetch_one(
                        "SELECT * FROM slots WHERE venue_id = %s AND start_time = %s AND end_time = %s AND status = 'HELD' LIMIT 1",
                        (game.get("venue_id"), game.get("slot_start"), game.get("slot_end"))
                    )

                    if slot and confirmed_count >= (game.get("total_spots") or 0):
                        db.execute_query("UPDATE slots SET status = 'BOOKED' WHERE id = %s", (slot.get("id"),))
                        booking = db.fetch_one(
                            "SELECT DISTINCT b.* FROM bookings b JOIN booking_slots bs ON b.id = bs.booking_id "
                            "WHERE bs.slot_id = %s AND b.status = 'reserved' LIMIT 1",
                            (slot.get("id"),)
                        )
                        if booking:
                            db.execute_query(
                                "UPDATE bookings SET status = 'confirmed', payment_status = 'paid', amount_paid = %s WHERE id = %s",
                                (int((game.get("price_per_player") or 0) * confirmed_count * 100), booking.get("id"))
                            )

                elif event in ["payment.failed", "payment.timed_out"]:
                    HoldExpiryService.cancel_and_release(player.get("id"), db)
                    redis_client.delete(f"game:{game_id}:hold:{user_id}")

                return {"status": "processed"}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Webhook execution error: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def cancel_game_lobby(self, request: Request, game_id: str, host_id: int, current_user: dict):
        try:
            with logger.time_operation("CANCEL_GAME_LOBBY", request=request):
                db = self.db_driver
                game = db.fetch_one("SELECT * FROM games WHERE id = %s FOR UPDATE", (str(game_id),))
                if not game:
                    raise HTTPException(status_code=404, detail="Game not found")

                if game.get("host_id") != host_id:
                    raise HTTPException(status_code=403, detail="Only the host can cancel the game lobby")

                db.execute_query("UPDATE games SET status = 'cancelled' WHERE id = %s", (str(game_id),))

                if game.get("venue_id"):
                    slot = db.fetch_one(
                        "SELECT * FROM slots WHERE venue_id = %s AND start_time = %s AND end_time = %s AND status IN ('HELD', 'BOOKED') LIMIT 1",
                        (game.get("venue_id"), game.get("slot_start"), game.get("slot_end"))
                    )
                    if slot:
                        db.execute_query("UPDATE slots SET status = 'AVAILABLE', held_until = NULL, held_by_user_id = NULL WHERE id = %s", (slot.get("id"),))
                        booking = db.fetch_one(
                            "SELECT DISTINCT b.* FROM bookings b JOIN booking_slots bs ON b.id = bs.booking_id "
                            "WHERE bs.slot_id = %s AND b.status IN ('reserved', 'confirmed') LIMIT 1",
                            (slot.get("id"),)
                        )
                        if booking:
                            db.execute_query(
                                "UPDATE bookings SET status = 'cancelled', cancellation_reason = 'Game lobby cancelled by host' WHERE id = %s",
                                (booking.get("id"),)
                            )

                db.execute_query(
                    "UPDATE game_players SET status = 'cancelled', cancelled_at = %s WHERE game_id = %s AND status IN ('confirmed', 'pending_payment')",
                    (datetime.utcnow(), str(game_id))
                )

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
