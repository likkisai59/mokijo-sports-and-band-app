from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

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
                    # Handle disconnected clients gracefully
                    pass

manager = ConnectionManager()

# Helper to serialize and broadcast match updates to all clients connected to match_id
async def broadcast_match_update(match_id: int, db: Session):
    match_db = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match_db:
        return
    try:
        # Validate and serialize using MatchResponse schema
        match_data = schemas.MatchResponse.model_validate(match_db).model_dump(mode="json")
        await manager.broadcast(match_id, match_data)
    except Exception as e:
        print(f"Error broadcasting match update for match {match_id}: {e}")


# REST Endpoints for Matches

@router.post("/matches", response_model=schemas.MatchResponse)
def create_match(match: schemas.MatchCreate, db: Session = Depends(get_db)):
    """Create a new match and setup its teams (intra-club or inter-club)."""
    # Verify owner_id exists
    owner = db.query(models.User).filter(models.User.id == match.owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Club Admin (owner) not found")

    if len(match.teams) != 2:
        raise HTTPException(status_code=400, detail="A match must have exactly two teams.")

    # Create the match object
    db_match = models.Match(
        owner_id=match.owner_id,
        title=match.title,
        sport=match.sport,
        match_type=match.match_type,
        venue=match.venue,
        scheduled_at=match.scheduled_at,
        status="scheduled"
    )
    db.add(db_match)
    db.flush() # Flush to get db_match.id

    # Create the teams
    for team in match.teams:
        db_team = models.MatchTeam(
            match_id=db_match.id,
            team_name=team.team_name,
            group_id=team.group_id,
            club_name=team.club_name,
            color=team.color,
            score=0
        )
        db.add(db_team)

    db.commit()
    db.refresh(db_match)
    return db_match


@router.get("/matches", response_model=List[schemas.MatchResponse])
def get_matches(owner_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    """Retrieve all matches, optionally filtered by owner_id or status (e.g. live)."""
    query = db.query(models.Match)
    if owner_id is not None:
        query = query.filter(models.Match.owner_id == owner_id)
    if status is not None:
        query = query.filter(models.Match.status == status)
    
    # Order matches by scheduled time / creation date
    return query.order_by(models.Match.scheduled_at.desc(), models.Match.created_at.desc()).all()


@router.get("/matches/{match_id}", response_model=schemas.MatchResponse)
def get_match(match_id: int, db: Session = Depends(get_db)):
    """Retrieve details for a specific match."""
    db_match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")
    return db_match


@router.patch("/matches/{match_id}", response_model=schemas.MatchResponse)
async def update_match(match_id: int, match_update: schemas.MatchUpdate, db: Session = Depends(get_db)):
    """Update match metadata or change its status (e.g., scheduled -> live -> completed)."""
    db_match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")

    old_status = db_match.status
    update_data = match_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_match, key, value)

    # Automatically log key status transitions as MatchEvents
    if "status" in update_data and update_data["status"] != old_status:
        new_status = update_data["status"]
        event_desc = f"Match status changed to {new_status}."
        if new_status == "live":
            event_desc = "The match has started!"
        elif new_status == "completed":
            # Auto-calculate winner if possible
            if len(db_match.teams) == 2:
                team_a, team_b = db_match.teams[0], db_match.teams[1]
                if team_a.score > team_b.score:
                    db_match.winner_team_id = team_a.id
                    event_desc = f"Match completed. Winner: {team_a.team_name}!"
                elif team_b.score > team_a.score:
                    db_match.winner_team_id = team_b.id
                    event_desc = f"Match completed. Winner: {team_b.team_name}!"
                else:
                    event_desc = "Match completed. It's a draw!"

        db_event = models.MatchEvent(
            match_id=match_id,
            event_type="status_change",
            description=event_desc,
            score_at_event=f"{db_match.teams[0].score} - {db_match.teams[1].score}" if len(db_match.teams) == 2 else "0 - 0"
        )
        db.add(db_event)

    db.commit()
    db.refresh(db_match)

    # Broadcast status update to all live scoreboard viewers
    await broadcast_match_update(match_id, db)
    return db_match


@router.delete("/matches/{match_id}")
def delete_match(match_id: int, db: Session = Depends(get_db)):
    """Delete a match and its associated teams and events."""
    db_match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")

    db.delete(db_match)
    db.commit()
    return {"message": "Match deleted successfully"}


@router.patch("/matches/{match_id}/score", response_model=schemas.MatchResponse)
async def update_score(match_id: int, score_update: schemas.MatchScoreUpdate, db: Session = Depends(get_db)):
    """Update score for a team in a match, and create a corresponding match event (e.g. Goal, Point)."""
    db_match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")

    if db_match.status != "live":
        raise HTTPException(status_code=400, detail="Cannot update score for a match that is not currently live.")

    # Find the specific team
    db_team = db.query(models.MatchTeam).filter(
        models.MatchTeam.id == score_update.team_id,
        models.MatchTeam.match_id == match_id
    ).first()

    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found in this match")

    # Update team score
    db_team.score = score_update.new_score

    # Construct score snapshot for event
    # Assume exactly 2 teams for displaying snapshots like "2 - 1"
    score_snapshot = "0 - 0"
    if len(db_match.teams) == 2:
        score_snapshot = f"{db_match.teams[0].score} - {db_match.teams[1].score}"

    # Log the scoring event
    db_event = models.MatchEvent(
        match_id=match_id,
        team_id=db_team.id,
        event_type=score_update.event_type or "score_update",
        description=score_update.description or f"{db_team.team_name} scored!",
        minute=score_update.minute,
        score_at_event=score_snapshot
    )
    db.add(db_event)

    db.commit()
    db.refresh(db_match)

    # Broadcast updated scores to all connected viewers in real time
    await broadcast_match_update(match_id, db)
    return db_match


@router.post("/matches/{match_id}/events", response_model=schemas.MatchEventResponse)
async def add_match_event(match_id: int, event: schemas.MatchEventCreate, db: Session = Depends(get_db)):
    """Add a custom match timeline event (e.g. Halftime, Timeout, Yellow Card) without changing score."""
    db_match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")

    score_snapshot = "0 - 0"
    if len(db_match.teams) == 2:
        score_snapshot = f"{db_match.teams[0].score} - {db_match.teams[1].score}"

    db_event = models.MatchEvent(
        match_id=match_id,
        team_id=event.team_id,
        event_type=event.event_type,
        description=event.description,
        minute=event.minute,
        score_at_event=score_snapshot
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    # Broadcast the timeline event to viewers
    await broadcast_match_update(match_id, db)
    return db_event


@router.get("/matches/{match_id}/events", response_model=List[schemas.MatchEventResponse])
def get_match_events(match_id: int, db: Session = Depends(get_db)):
    """Retrieve all event logs/timeline for a specific match, sorted from latest to oldest."""
    events = db.query(models.MatchEvent).filter(models.MatchEvent.match_id == match_id).order_by(models.MatchEvent.created_at.desc()).all()
    return events


# Live Scoreboard WebSocket Endpoint

@router.websocket("/ws/scoreboard/{match_id}")
async def websocket_scoreboard(websocket: WebSocket, match_id: int, db: Session = Depends(get_db)):
    """WebSocket endpoint for receiving live scoreboard updates."""
    # Validate match exists before proceeding
    db_match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not db_match:
        await websocket.close(code=4004) # Close connection with match not found code
        return

    await manager.connect(match_id, websocket)
    
    # Send the initial state of the match immediately upon connection
    try:
        match_data = schemas.MatchResponse.model_validate(db_match).model_dump(mode="json")
        await websocket.send_json(match_data)
    except Exception as e:
        print(f"Error sending initial state over websocket: {e}")

    try:
        while True:
            # Keep the connection alive by waiting for client messages/pings
            # The client doesn't need to send data, but we listen for disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(match_id, websocket)
    except Exception as e:
        manager.disconnect(match_id, websocket)
