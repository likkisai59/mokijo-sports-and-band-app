from fastapi import APIRouter, Depends, Request, HTTPException, WebSocket, WebSocketDisconnect, status
from typing import List, Optional
from datetime import datetime

from app.models import schemas
from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization
from app.logger import logger


# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        # Maps match_id (int) to a list of active WebSocket clients
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, match_id: int, websocket: WebSocket):
        await websocket.accept()
        if match_id not in self.active_connections:
            self.active_connections[match_id] = []
        self.active_connections[match_id].append(websocket)

    def disconnect(self, match_id: int, websocket: WebSocket):
        if match_id in self.active_connections:
            if websocket in self.active_connections[match_id]:
                self.active_connections[match_id].remove(websocket)
            if not self.active_connections[match_id]:
                del self.active_connections[match_id]

    async def broadcast(self, match_id: int, message: dict):
        if match_id in self.active_connections:
            for connection in self.active_connections[match_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()


def serialize_team(team):
    if not team:
        return None
    return {
        "id": team.get("id"),
        "match_id": team.get("match_id"),
        "team_name": team.get("team_name"),
        "group_id": team.get("group_id"),
        "club_name": team.get("club_name"),
        "color": team.get("color"),
        "score": team.get("score")
    }


def serialize_event(event):
    if not event:
        return None
    created = event.get("created_at")
    return {
        "id": event.get("id"),
        "match_id": event.get("match_id"),
        "team_id": event.get("team_id"),
        "event_type": event.get("event_type"),
        "description": event.get("description"),
        "minute": event.get("minute"),
        "score_at_event": event.get("score_at_event"),
        "created_at": created.isoformat() if isinstance(created, datetime) else created
    }


def serialize_match(match, teams, events=None):
    if not match:
        return None
    sched = match.get("scheduled_at")
    created = match.get("created_at")
    return {
        "id": match.get("id"),
        "owner_id": match.get("owner_id"),
        "title": match.get("title"),
        "sport": match.get("sport"),
        "match_type": match.get("match_type"),
        "venue": match.get("venue"),
        "scheduled_at": sched.isoformat() if isinstance(sched, datetime) else sched,
        "status": match.get("status"),
        "winner_team_id": match.get("winner_team_id"),
        "created_at": created.isoformat() if isinstance(created, datetime) else created,
        "teams": [serialize_team(t) for t in teams] if teams else [],
        "events": [serialize_event(e) for e in events] if events else []
    }


async def broadcast_match_update(match_id: int, db):
    match_db = db.fetch_one("SELECT * FROM matches WHERE id = %s", (match_id,))
    if not match_db:
        return
    try:
        teams = db.fetch_all("SELECT * FROM match_teams WHERE match_id = %s ORDER BY id ASC", (match_id,))
        events = db.fetch_all("SELECT * FROM match_events WHERE match_id = %s ORDER BY created_at DESC", (match_id,))
        match_data = serialize_match(match_db, teams, events)
        await manager.broadcast(match_id, match_data)
    except Exception as e:
        print(f"Error broadcasting match update for match {match_id}: {e}")


class MatchesRouting(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        
        self.router.add_api_route(
            path="/matches",
            endpoint=self.create_match,
            methods=["POST"],
            response_model=schemas.MatchResponse,
            summary="Create a new match and setup its teams.",
            tags=["Matches"]
        )
        self.router.add_api_route(
            path="/matches",
            endpoint=self.get_matches,
            methods=["GET"],
            response_model=List[schemas.MatchResponse],
            summary="Retrieve all matches, optionally filtered by owner_id or status.",
            tags=["Matches"]
        )
        self.router.add_api_route(
            path="/matches/{match_id}",
            endpoint=self.get_match,
            methods=["GET"],
            response_model=schemas.MatchResponse,
            summary="Retrieve details for a specific match (public for live scoreboard viewing).",
            tags=["Matches"]
        )
        self.router.add_api_route(
            path="/matches/{match_id}",
            endpoint=self.update_match,
            methods=["PATCH"],
            response_model=schemas.MatchResponse,
            summary="Update match metadata or change its status.",
            tags=["Matches"]
        )
        self.router.add_api_route(
            path="/matches/{match_id}",
            endpoint=self.delete_match,
            methods=["DELETE"],
            summary="Delete a match and its associated teams and events.",
            tags=["Matches"]
        )
        self.router.add_api_route(
            path="/matches/{match_id}/score",
            endpoint=self.update_score,
            methods=["PATCH"],
            response_model=schemas.MatchResponse,
            summary="Update score for a team in a match, and create a corresponding match event.",
            tags=["Matches"]
        )
        self.router.add_api_route(
            path="/matches/{match_id}/events",
            endpoint=self.add_match_event,
            methods=["POST"],
            response_model=schemas.MatchEventResponse,
            summary="Add a custom match timeline event without changing score.",
            tags=["Matches"]
        )
        self.router.add_api_route(
            path="/matches/{match_id}/events",
            endpoint=self.get_match_events,
            methods=["GET"],
            response_model=List[schemas.MatchEventResponse],
            summary="Retrieve all event logs/timeline for a specific match.",
            tags=["Matches"]
        )
        
        # Register scoreboard Websocket endpoint
        self.router.add_api_websocket_route(
            path="/ws/scoreboard/{match_id}",
            endpoint=self.websocket_scoreboard
        )

    async def create_match(self, request: Request, match: schemas.MatchCreate, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Create match router start", step="ROUTER_START", user_info=current_user)
        logic = MatchesLogic()
        return await logic.create_match(request, match, current_user)

    async def get_matches(
        self,
        request: Request,
        owner_id: Optional[int] = None,
        status: Optional[str] = None,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get matches router start", step="ROUTER_START", user_info=current_user)
        logic = MatchesLogic()
        return await logic.get_matches(request, owner_id, status, current_user)

    async def get_match(self, request: Request, match_id: int):
        # Public: scoreboard pages load match data without requiring login.
        await logger.log_message(request=request, message="Get match router start", step="ROUTER_START")
        logic = MatchesLogic()
        return await logic.get_match(request, match_id, current_user={})

    async def update_match(self, request: Request, match_id: int, match_update: schemas.MatchUpdate, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Update match router start", step="ROUTER_START", user_info=current_user)
        logic = MatchesLogic()
        return await logic.update_match(request, match_id, match_update, current_user)

    async def delete_match(self, request: Request, match_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Delete match router start", step="ROUTER_START", user_info=current_user)
        logic = MatchesLogic()
        return await logic.delete_match(request, match_id, current_user)

    async def update_score(self, request: Request, match_id: int, score_update: schemas.MatchScoreUpdate, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Update score router start", step="ROUTER_START", user_info=current_user)
        logic = MatchesLogic()
        return await logic.update_score(request, match_id, score_update, current_user)

    async def add_match_event(self, request: Request, match_id: int, event: schemas.MatchEventCreate, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Add match event router start", step="ROUTER_START", user_info=current_user)
        logic = MatchesLogic()
        return await logic.add_match_event(request, match_id, event, current_user)

    async def get_match_events(self, request: Request, match_id: int, current_user: dict = Depends(check_user_authorization)):
        await logger.log_message(request=request, message="Get match events router start", step="ROUTER_START", user_info=current_user)
        logic = MatchesLogic()
        return await logic.get_match_events(request, match_id, current_user)

    async def websocket_scoreboard(self, websocket: WebSocket, match_id: int):
        # Accept first so the browser handshake can complete (closing before accept fails WS).
        await websocket.accept()

        db = self.db_driver
        db_match = db.fetch_one("SELECT * FROM matches WHERE id = %s", (match_id,))
        if not db_match:
            await websocket.close(code=4004)
            return

        if match_id not in manager.active_connections:
            manager.active_connections[match_id] = []
        manager.active_connections[match_id].append(websocket)

        try:
            teams = db.fetch_all("SELECT * FROM match_teams WHERE match_id = %s ORDER BY id ASC", (match_id,))
            events = db.fetch_all("SELECT * FROM match_events WHERE match_id = %s ORDER BY created_at DESC", (match_id,))
            match_data = serialize_match(db_match, teams, events)
            await websocket.send_json(match_data)
        except Exception as e:
            print(f"Error sending initial state over websocket: {e}")

        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(match_id, websocket)
        except Exception:
            manager.disconnect(match_id, websocket)


class MatchesLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        logger.log_message_sync(message="MatchesLogic instance created")

    async def create_match(self, request: Request, match: schemas.MatchCreate, current_user: dict):
        try:
            with logger.time_operation("CREATE_MATCH", request=request):
                db = self.db_driver
                owner = db.fetch_one("SELECT id FROM users WHERE id = %s LIMIT 1", (match.owner_id,))
                if not owner:
                    raise HTTPException(status_code=404, detail="Club Admin (owner) not found")

                if len(match.teams) != 2:
                    raise HTTPException(status_code=400, detail="A match must have exactly two teams.")

                insert_match = {
                    "owner_id": match.owner_id,
                    "title": match.title,
                    "sport": match.sport,
                    "match_type": match.match_type,
                    "venue": match.venue,
                    "scheduled_at": match.scheduled_at,
                    "status": "scheduled",
                    "created_at": datetime.utcnow()
                }
                match_id = db.insert("matches", insert_match)

                for team in match.teams:
                    insert_team = {
                        "match_id": match_id,
                        "team_name": team.team_name,
                        "group_id": team.group_id,
                        "club_name": team.club_name,
                        "color": team.color,
                        "score": 0
                    }
                    db.insert("match_teams", insert_team)

                db_match = db.fetch_one("SELECT * FROM matches WHERE id = %s", (match_id,))
                teams = db.fetch_all("SELECT * FROM match_teams WHERE match_id = %s ORDER BY id ASC", (match_id,))
                return serialize_match(db_match, teams)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to create match: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_matches(self, request: Request, owner_id: Optional[int], status: Optional[str], current_user: dict):
        try:
            with logger.time_operation("GET_MATCHES", request=request):
                db = self.db_driver
                query = "SELECT * FROM matches"
                params = []
                clauses = []
                if owner_id is not None:
                    clauses.append("owner_id = %s")
                    params.append(owner_id)
                if status is not None:
                    clauses.append("status = %s")
                    params.append(status)
                
                if clauses:
                    query += " WHERE " + " AND ".join(clauses)
                query += " ORDER BY scheduled_at DESC, created_at DESC"

                matches = db.fetch_all(query, tuple(params))
                res = []
                for m in matches:
                    teams = db.fetch_all("SELECT * FROM match_teams WHERE match_id = %s ORDER BY id ASC", (m.get("id"),))
                    res.append(serialize_match(m, teams))
                return res
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting matches: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_match(self, request: Request, match_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_MATCH_BY_ID", request=request):
                db = self.db_driver
                db_match = db.fetch_one("SELECT * FROM matches WHERE id = %s", (match_id,))
                if not db_match:
                    raise HTTPException(status_code=404, detail="Match not found")
                teams = db.fetch_all("SELECT * FROM match_teams WHERE match_id = %s ORDER BY id ASC", (match_id,))
                events = db.fetch_all("SELECT * FROM match_events WHERE match_id = %s ORDER BY created_at DESC", (match_id,))
                return serialize_match(db_match, teams, events)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting match: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def update_match(self, request: Request, match_id: int, match_update: schemas.MatchUpdate, current_user: dict):
        try:
            with logger.time_operation("UPDATE_MATCH", request=request):
                db = self.db_driver
                db_match = db.fetch_one("SELECT * FROM matches WHERE id = %s FOR UPDATE", (match_id,))
                if not db_match:
                    raise HTTPException(status_code=404, detail="Match not found")

                old_status = db_match.get("status")
                update_data = match_update.model_dump(exclude_unset=True)

                if update_data:
                    set_clauses = []
                    params = []
                    for key, val in update_data.items():
                        set_clauses.append(f"{key} = %s")
                        params.append(val)
                    params.append(match_id)
                    db.execute_query(
                        f"UPDATE matches SET {', '.join(set_clauses)} WHERE id = %s",
                        tuple(params)
                    )

                # Re-fetch match to get updated fields
                db_match = db.fetch_one("SELECT * FROM matches WHERE id = %s", (match_id,))
                teams = db.fetch_all("SELECT * FROM match_teams WHERE match_id = %s ORDER BY id ASC", (match_id,))

                # Automatically log key status transitions as MatchEvents
                if "status" in update_data and update_data["status"] != old_status:
                    new_status = update_data["status"]
                    event_desc = f"Match status changed to {new_status}."
                    winner_id = None
                    if new_status == "live":
                        event_desc = "The match has started!"
                    elif new_status == "completed":
                        if len(teams) == 2:
                            team_a, team_b = teams[0], teams[1]
                            if (team_a.get("score") or 0) > (team_b.get("score") or 0):
                                winner_id = team_a.get("id")
                                db.execute_query("UPDATE matches SET winner_team_id = %s WHERE id = %s", (winner_id, match_id))
                                event_desc = f"Match completed. Winner: {team_a.get('team_name')}!"
                            elif (team_b.get("score") or 0) > (team_a.get("score") or 0):
                                winner_id = team_b.get("id")
                                db.execute_query("UPDATE matches SET winner_team_id = %s WHERE id = %s", (winner_id, match_id))
                                event_desc = f"Match completed. Winner: {team_b.get('team_name')}!"
                            else:
                                event_desc = "Match completed. It's a draw!"
                        db_match = db.fetch_one("SELECT * FROM matches WHERE id = %s", (match_id,))

                    score_at = f"{teams[0].get('score') or 0} - {teams[1].get('score') or 0}" if len(teams) == 2 else "0 - 0"
                    insert_event = {
                        "match_id": match_id,
                        "event_type": "status_change",
                        "description": event_desc,
                        "score_at_event": score_at,
                        "created_at": datetime.utcnow()
                    }
                    db.insert("match_events", insert_event)

                await broadcast_match_update(match_id, db)
                events = db.fetch_all("SELECT * FROM match_events WHERE match_id = %s ORDER BY created_at DESC", (match_id,))
                return serialize_match(db_match, teams, events)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed updating match: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def delete_match(self, request: Request, match_id: int, current_user: dict):
        try:
            with logger.time_operation("DELETE_MATCH", request=request):
                db = self.db_driver
                db_match = db.fetch_one("SELECT id FROM matches WHERE id = %s LIMIT 1", (match_id,))
                if not db_match:
                    raise HTTPException(status_code=404, detail="Match not found")

                db.execute_query("DELETE FROM matches WHERE id = %s", (match_id,))
                return {"message": "Match deleted successfully"}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed deleting match: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def update_score(self, request: Request, match_id: int, score_update: schemas.MatchScoreUpdate, current_user: dict):
        try:
            with logger.time_operation("UPDATE_SCORE", request=request):
                db = self.db_driver
                db_match = db.fetch_one("SELECT * FROM matches WHERE id = %s FOR UPDATE", (match_id,))
                if not db_match:
                    raise HTTPException(status_code=404, detail="Match not found")

                if db_match.get("status") != "live":
                    raise HTTPException(status_code=400, detail="Cannot update score for a match that is not currently live.")

                db_team = db.fetch_one(
                    "SELECT * FROM match_teams WHERE id = %s AND match_id = %s LIMIT 1 FOR UPDATE",
                    (score_update.team_id, match_id)
                )
                if not db_team:
                    raise HTTPException(status_code=404, detail="Team not found in this match")

                db.execute_query(
                    "UPDATE match_teams SET score = %s WHERE id = %s",
                    (score_update.new_score, db_team.get("id"))
                )

                # Re-fetch teams
                teams = db.fetch_all("SELECT * FROM match_teams WHERE match_id = %s ORDER BY id ASC", (match_id,))
                score_snapshot = "0 - 0"
                if len(teams) == 2:
                    score_snapshot = f"{teams[0].get('score') or 0} - {teams[1].get('score') or 0}"

                insert_event = {
                    "match_id": match_id,
                    "team_id": db_team.get("id"),
                    "event_type": score_update.event_type or "score_update",
                    "description": score_update.description or f"{db_team.get('team_name')} scored!",
                    "minute": score_update.minute,
                    "score_at_event": score_snapshot,
                    "created_at": datetime.utcnow()
                }
                db.insert("match_events", insert_event)

                await broadcast_match_update(match_id, db)
                events = db.fetch_all("SELECT * FROM match_events WHERE match_id = %s ORDER BY created_at DESC", (match_id,))
                return serialize_match(db_match, teams, events)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed updating score: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def add_match_event(self, request: Request, match_id: int, event: schemas.MatchEventCreate, current_user: dict):
        try:
            with logger.time_operation("ADD_MATCH_EVENT", request=request):
                db = self.db_driver
                db_match = db.fetch_one("SELECT * FROM matches WHERE id = %s LIMIT 1", (match_id,))
                if not db_match:
                    raise HTTPException(status_code=404, detail="Match not found")

                teams = db.fetch_all("SELECT * FROM match_teams WHERE match_id = %s ORDER BY id ASC", (match_id,))
                score_snapshot = "0 - 0"
                if len(teams) == 2:
                    score_snapshot = f"{teams[0].get('score') or 0} - {teams[1].get('score') or 0}"

                insert_event = {
                    "match_id": match_id,
                    "team_id": event.team_id,
                    "event_type": event.event_type,
                    "description": event.description,
                    "minute": event.minute,
                    "score_at_event": score_snapshot,
                    "created_at": datetime.utcnow()
                }
                event_id = db.insert("match_events", insert_event)
                new_event = db.fetch_one("SELECT * FROM match_events WHERE id = %s", (event_id,))

                await broadcast_match_update(match_id, db)
                return serialize_event(new_event)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed adding match event: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_match_events(self, request: Request, match_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_MATCH_EVENTS", request=request):
                db = self.db_driver
                events = db.fetch_all("SELECT * FROM match_events WHERE match_id = %s ORDER BY created_at DESC", (match_id,))
                return [serialize_event(e) for e in events]
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting events: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
