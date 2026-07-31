from fastapi import APIRouter, Depends, Request, HTTPException, WebSocket, WebSocketDisconnect, status
from typing import List, Optional
from app.models import schemas
from app.api.mokijo.matches import service
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.authorization import check_user_authorization

router = APIRouter()

@router.post("/matches", response_model=schemas.MatchResponse, summary="Create a new match and setup its teams.", tags=["Matches"])
async def create_match(request: Request, match: schemas.MatchCreate, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.create_match(request, db, match, current_user)

@router.get("/matches", response_model=List[schemas.MatchResponse], summary="Retrieve all matches, optionally filtered by owner_id or status.", tags=["Matches"])
async def get_matches(request: Request, owner_id: Optional[int] = None, status: Optional[str] = None, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.get_matches(request, db, owner_id, status, current_user)

@router.get("/matches/{match_id}", response_model=schemas.MatchResponse, summary="Retrieve details for a specific match.", tags=["Matches"])
async def get_match(request: Request, match_id: int, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.get_match(request, db, match_id, current_user)

@router.patch("/matches/{match_id}", response_model=schemas.MatchResponse, summary="Update match metadata or change its status.", tags=["Matches"])
async def update_match(request: Request, match_id: int, match_update: schemas.MatchUpdate, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.update_match(request, db, match_id, match_update, current_user)

@router.delete("/matches/{match_id}", summary="Delete a match and its associated teams and events.", tags=["Matches"])
async def delete_match(request: Request, match_id: int, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.delete_match(request, db, match_id, current_user)

@router.patch("/matches/{match_id}/score", response_model=schemas.MatchResponse, summary="Update score for a team in a match, and create a corresponding match event.", tags=["Matches"])
async def update_score(request: Request, match_id: int, score_update: schemas.MatchScoreUpdate, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.update_score(request, db, match_id, score_update, current_user)

@router.post("/matches/{match_id}/events", response_model=schemas.MatchEventResponse, summary="Add a custom match timeline event without changing score.", tags=["Matches"])
async def add_match_event(request: Request, match_id: int, event: schemas.MatchEventCreate, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.add_match_event(request, db, match_id, event, current_user)

@router.get("/matches/{match_id}/events", response_model=List[schemas.MatchEventResponse], summary="Retrieve all event logs/timeline for a specific match.", tags=["Matches"])
async def get_match_events(request: Request, match_id: int, current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)):
    return await service.get_match_events(request, db, match_id, current_user)

@router.websocket("/ws/scoreboard/{match_id}")
async def websocket_scoreboard(websocket: WebSocket, match_id: int, db: Session = Depends(get_db)):
    await service.manager.connect(match_id, websocket)

    try:
        from app.api.mokijo.matches import crud
        db_match = crud.get_match_by_id(db, match_id)
        if not db_match:
            try:
                await websocket.send_json({"error": "Match not found", "match_id": match_id})
            except Exception:
                pass
            await websocket.close(code=4004)
            return

        teams = crud.get_match_teams(db, match_id)
        events = crud.get_match_events(db, match_id)
        match_data = service.serialize_match(db_match, teams, events)
        await websocket.send_json(match_data)
        
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        service.manager.disconnect(match_id, websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        service.manager.disconnect(match_id, websocket)
