from fastapi import APIRouter, Depends, Request, HTTPException, WebSocket, WebSocketDisconnect, status
from typing import List, Optional
from datetime import datetime

from app.models import schemas
from sqlalchemy.orm import Session
from app.auth.authorization import check_user_authorization
from app.logger import logger
from app.api.mokijo.matches import crud

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        # Maps match_id (int) to a list of active WebSocket clients
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, match_id: int, websocket: WebSocket):
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

async def broadcast_match_update(match_id: int, db: Session):
    match_db = crud.get_match_by_id(db, match_id)
    if not match_db:
        return
    try:
        teams = crud.get_match_teams(db, match_id)
        events = crud.get_match_events(db, match_id)
        match_data = serialize_match(match_db, teams, events)
        await manager.broadcast(match_id, match_data)
    except Exception as e:
        await logger.log_error(request=None, message=f"Broadcast failed for match {match_id}: {e}")

async def create_match(request: Request, db: Session, match: schemas.MatchCreate, current_user: dict):
    try:
        with logger.time_operation("CREATE_MATCH", request=request):
            owner_id = getattr(match, "owner_id", None) or current_user.get("id") or current_user.get("userId")
            if isinstance(owner_id, str) and owner_id.isdigit():
                owner_id = int(owner_id)

            insert_match = {
                "owner_id": owner_id,
                "title": match.title,
                "sport": match.sport,
                "match_type": match.match_type or "intra_club",
                "venue": match.venue,
                "scheduled_at": match.scheduled_at,
                "status": getattr(match, "status", None) or "scheduled"
            }
            match_id = crud.create_match(db, insert_match)
            if match.teams:
                for team in match.teams:
                    insert_team = {
                        "match_id": match_id,
                        "team_name": team.team_name,
                        "group_id": team.group_id,
                        "club_name": team.club_name,
                        "color": team.color,
                        "score": 0
                    }
                    crud.create_match_team(db, insert_team)

            db_match = crud.get_match_by_id(db, match_id)
            teams = crud.get_match_teams(db, match_id)
            return serialize_match(db_match, teams)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to create match: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_matches(request: Request, db: Session, owner_id: Optional[int], status: Optional[str], current_user: dict):
    try:
        with logger.time_operation("GET_MATCHES", request=request):
            effective_owner_id = owner_id or current_user.get("id") or current_user.get("userId")
            if isinstance(effective_owner_id, str) and effective_owner_id.isdigit():
                effective_owner_id = int(effective_owner_id)
            matches = crud.get_matches(db, effective_owner_id, status)
            res = []
            for m in matches:
                teams = crud.get_match_teams(db, m.get("id"))
                res.append(serialize_match(m, teams))
            return res
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get matches: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_match(request: Request, db: Session, match_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_MATCH", request=request):
            db_match = crud.get_match_by_id(db, match_id)
            if not db_match:
                raise HTTPException(status_code=404, detail="Match not found")
            
            teams = crud.get_match_teams(db, match_id)
            events = crud.get_match_events(db, match_id)
            return serialize_match(db_match, teams, events)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get match: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def update_match(request: Request, db: Session, match_id: int, match_update: schemas.MatchUpdate, current_user: dict):
    try:
        with logger.time_operation("UPDATE_MATCH", request=request):
            db_match = crud.get_match_for_update(db, match_id)
            if not db_match:
                raise HTTPException(status_code=404, detail="Match not found")
            
            update_data = match_update.dict(exclude_unset=True)
            crud.update_match(db, match_id, update_data)
            
            await broadcast_match_update(match_id, db)
            
            updated_match = crud.get_match_by_id(db, match_id)
            teams = crud.get_match_teams(db, match_id)
            events = crud.get_match_events(db, match_id)
            return serialize_match(updated_match, teams, events)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to update match: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def delete_match(request: Request, db: Session, match_id: int, current_user: dict):
    try:
        with logger.time_operation("DELETE_MATCH", request=request):
            db_match = crud.get_match_by_id(db, match_id)
            if not db_match:
                raise HTTPException(status_code=404, detail="Match not found")
            
            crud.delete_match(db, match_id)
            return {"message": "Match successfully deleted"}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to delete match: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def update_score(request: Request, db: Session, match_id: int, score_update: schemas.MatchScoreUpdate, current_user: dict):
    try:
        with logger.time_operation("UPDATE_SCORE", request=request):
            team_db = crud.get_match_team_for_update(db, score_update.team_id, match_id)
            if not team_db:
                raise HTTPException(status_code=404, detail="Team not found in this match")
            
            crud.update_team_score(db, score_update.team_id, score_update.new_score)
            
            event_data = {
                "match_id": match_id,
                "team_id": score_update.team_id,
                "event_type": "score_update",
                "description": f"Score changed to {score_update.new_score}",
                "minute": score_update.minute,
                "score_at_event": score_update.new_score
            }
            crud.create_match_event(db, event_data)
            
            await broadcast_match_update(match_id, db)
            
            updated_match = crud.get_match_by_id(db, match_id)
            teams = crud.get_match_teams(db, match_id)
            events = crud.get_match_events(db, match_id)
            return serialize_match(updated_match, teams, events)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to update score: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def add_match_event(request: Request, db: Session, match_id: int, event: schemas.MatchEventCreate, current_user: dict):
    try:
        with logger.time_operation("ADD_MATCH_EVENT", request=request):
            db_match = crud.get_match_by_id(db, match_id)
            if not db_match:
                raise HTTPException(status_code=404, detail="Match not found")
            
            event_data = {
                "match_id": match_id,
                "team_id": event.team_id,
                "event_type": event.event_type,
                "description": event.description,
                "minute": event.minute,
                "score_at_event": event.score_at_event
            }
            event_id = crud.create_match_event(db, event_data)
            
            await broadcast_match_update(match_id, db)
            
            new_event = crud.get_match_event_by_id(db, event_id)
            return serialize_event(new_event)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to add match event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_match_events(request: Request, db: Session, match_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_MATCH_EVENTS", request=request):
            events = crud.get_match_events(db, match_id)
            return [serialize_event(e) for e in events]
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get match events: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
