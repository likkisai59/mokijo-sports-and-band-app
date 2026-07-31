from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.api.mokijo.dashboard import service
from app.auth.authorization import check_user_authorization
from app.core.database import get_db

router = APIRouter()

@router.get("/dashboard/overview", summary="Retrieve overview metrics and list of upcoming events/recent registrations for the admin dashboard.", tags=["Dashboard"])
async def get_dashboard_overview(
    request: Request,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_dashboard_overview(request, db, owner_id, current_user)

@router.get("/dashboard/coach", summary="Retrieve coach-specific metrics: squad players, upcoming events, and attendance rating.", tags=["Dashboard"])
async def get_coach_dashboard(
    request: Request,
    owner_id: int,
    coach_email: str,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_coach_dashboard(request, db, owner_id, coach_email, current_user)

@router.get("/debug/overview", summary="Debug endpoint — shows raw DB values to diagnose count issues.", tags=["Dashboard"])
async def debug_overview(
    request: Request,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.debug_overview(request, db, owner_id, current_user)
