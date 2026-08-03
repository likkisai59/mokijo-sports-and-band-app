from fastapi import APIRouter, Depends, Request, WebSocket, WebSocketDisconnect
from typing import List, Optional

from app.models import schemas
from app.api.mokijo.games import service
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.authorization import check_user_authorization
from app.logger import logger

router = APIRouter()

@router.get("/games", response_model=List[schemas.GameResponse], summary="Retrieve all open public game lobbies that haven't started yet.", tags=["Games"])
async def get_games(
    request: Request,
    sport: Optional[str] = None,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_games(request, db, sport, current_user)

@router.get("/users/{user_id}/games", response_model=List[schemas.GameResponse], summary="Retrieve all games where the user is either the host or a registered player.", tags=["Games"])
async def get_user_games(
    request: Request,
    user_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_user_games(request, db, user_id, current_user)

@router.post("/games", response_model=schemas.GameResponse, summary="Create a new game lobby and auto-onboard the host as confirmed player 1.", tags=["Games"])
async def create_game(
    request: Request,
    payload: schemas.GameCreate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.create_game(request, db, payload, current_user)

@router.post("/games/{game_id}/join", response_model=schemas.GameJoinResponse, summary="Join a game lobby instantly (if public join) or place joining request (if host approval required).", tags=["Games"])
async def join_game(
    request: Request,
    game_id: str,
    user_id: int,
    payload: schemas.GameJoinRequest,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.join_game(request, db, game_id, user_id, payload, current_user)

@router.post("/games/{game_id}/waitlist", response_model=schemas.WaitlistEntryOut, summary="Place player on game waitlist if lobby is full.", tags=["Games"])
async def join_waitlist(
    request: Request,
    game_id: str,
    user_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.join_waitlist(request, db, game_id, user_id, current_user)

@router.get("/games/{game_id}", response_model=schemas.GameDetailOut, summary="Retrieve full details of a game lobby including active players list and waitlist count.", tags=["Games"])
async def get_game_detail(
    request: Request,
    game_id: str,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_game_detail(request, db, game_id, current_user)

@router.post("/webhooks/payments/game-join", summary="Capture Razorpay webhook status updates to confirm player slot booking and finalize slot statuses.", tags=["Games"])
async def payment_webhook(
    request: Request,
    payload: dict
,
    db: Session = Depends(get_db)
):
    return await service.payment_webhook(request, db, payload)

@router.delete("/games/{game_id}", summary="Cancel the entire game lobby and trigger refunds for all confirmed players.", tags=["Games"])
async def cancel_game_lobby(
    request: Request,
    game_id: str,
    host_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.cancel_game_lobby(request, db, game_id, host_id, current_user)

