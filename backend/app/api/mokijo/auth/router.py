from fastapi import APIRouter, Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session
from app.models import schemas
from app.api.mokijo.auth import service
from pydantic import BaseModel
from app.core.database import get_db

class MemberLoginRequest(BaseModel):
    email: str
    password: str

router = APIRouter()

@router.post("/register", response_model=schemas.UserResponse, summary="Register a new club administrator and set up their club settings.", tags=["Auth"])
async def register_user(request: Request, user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return await service.register_user(request, db, user, background_tasks)

@router.get("/verify", summary="Verify a club administrator's email using their verification token.", tags=["Auth"])
async def verify_user(request: Request, token: str, db: Session = Depends(get_db)):
    return await service.verify_user(request, db, token)

@router.post("/login", summary="Authenticate a club administrator and return their session details.", tags=["Auth"])
async def login_user(request: Request, user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    return await service.login_user(request, db, user_data)

@router.post("/user/login", summary="Authenticate a standard user and return their session details.", tags=["Auth"])
async def login_standard_user(request: Request, user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    return await service.login_standard_user(request, db, user_data)

@router.post("/user/register", summary="Register a new standard user in the system.", tags=["Auth"])
async def register_standard_user(request: Request, payload: schemas.StandardUserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return await service.register_standard_user(request, db, payload, background_tasks)

@router.get("/clubs", summary="Retrieve a list of all registered clubs in the system.", tags=["Auth"])
async def get_clubs(request: Request, db: Session = Depends(get_db)):
    return await service.get_clubs(request, db)

@router.post("/login-member", summary="Authenticate a club member and return their session and dashboard details.", tags=["Auth"])
async def login_member(request: Request, req: MemberLoginRequest, db: Session = Depends(get_db)):
    return await service.login_member(request, db, req)

@router.post("/resend-verification", summary="Resend email verification token.", tags=["Auth"])
async def resend_verification(request: Request, payload: schemas.ResendVerificationPayload, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return await service.resend_verification(request, db, payload, background_tasks)

@router.get("/profile/member/{member_id}", response_model=schemas.MemberProfileResponse, summary="Retrieve profile details for a club member.", tags=["Auth"])
async def get_member_profile(request: Request, member_id: int, db: Session = Depends(get_db)):
    return await service.get_member_profile(request, db, member_id)

@router.put("/profile/member/{member_id}", response_model=schemas.MemberProfileResponse, summary="Update profile details for a club member.", tags=["Auth"])
async def update_member_profile(request: Request, member_id: int, payload: schemas.MemberProfileUpdate, db: Session = Depends(get_db)):
    return await service.update_member_profile(request, db, member_id, payload)
