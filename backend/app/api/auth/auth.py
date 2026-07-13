from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
import uuid
import json

from app.core.config import get_settings
from app.models import schemas
from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization
from app.core.helpers import normalize_email, find_approved_member_by_email, has_pending_submission_for_email
from app.logger import logger

settings = get_settings()


class MemberLoginRequest(BaseModel):
    email: str
    password: str


class AuthRouting(ConnectionService):
    def __init__(self) -> None:
        super().__init__()

        self.router.add_api_route(
            path="/register",
            endpoint=self.register_user,
            methods=["POST"],
            response_model=schemas.UserResponse,
            summary="Register a new club administrator and set up their club settings.",
            tags=["Auth"]
        )
        self.router.add_api_route(
            path="/verify",
            endpoint=self.verify_user,
            methods=["GET"],
            summary="Verify a club administrator's email using their verification token.",
            tags=["Auth"]
        )
        self.router.add_api_route(
            path="/login",
            endpoint=self.login_user,
            methods=["POST"],
            summary="Authenticate a club administrator and return their session details.",
            tags=["Auth"]
        )
        self.router.add_api_route(
            path="/user/login",
            endpoint=self.login_standard_user,
            methods=["POST"],
            summary="Authenticate a standard user and return their session details.",
            tags=["Auth"]
        )
        self.router.add_api_route(
            path="/user/register",
            endpoint=self.register_standard_user,
            methods=["POST"],
            summary="Register a new standard user in the system.",
            tags=["Auth"]
        )
        self.router.add_api_route(
            path="/clubs",
            endpoint=self.get_clubs,
            methods=["GET"],
            summary="Retrieve a list of all registered clubs in the system.",
            tags=["Auth"]
        )
        self.router.add_api_route(
            path="/login-member",
            endpoint=self.login_member,
            methods=["POST"],
            summary="Authenticate a club member and return their session and dashboard details.",
            tags=["Auth"]
        )

    async def register_user(self, request: Request, user: schemas.UserCreate, background_tasks: BackgroundTasks):
        await logger.log_message(request=request, message="Register user router start", step="ROUTER_START")
        logic = AuthLogic()
        return await logic.register_user(request, user)

    async def verify_user(self, request: Request, token: str):
        await logger.log_message(request=request, message="Verify user router start", step="ROUTER_START")
        logic = AuthLogic()
        return await logic.verify_user(request, token)

    async def login_user(self, request: Request, user_data: schemas.UserLogin):
        await logger.log_message(request=request, message="Login user router start", step="ROUTER_START")
        logic = AuthLogic()
        return await logic.login_user(request, user_data)

    async def login_standard_user(self, request: Request, user_data: schemas.UserLogin):
        await logger.log_message(request=request, message="Login standard user router start", step="ROUTER_START")
        logic = AuthLogic()
        return await logic.login_standard_user(request, user_data)

    async def register_standard_user(self, request: Request, payload: schemas.StandardUserRegister):
        await logger.log_message(request=request, message="Register standard user router start", step="ROUTER_START")
        logic = AuthLogic()
        return await logic.register_standard_user(request, payload)

    async def get_clubs(self, request: Request):
        await logger.log_message(request=request, message="Get clubs router start", step="ROUTER_START")
        logic = AuthLogic()
        return await logic.get_clubs(request)

    async def login_member(self, request: Request, req: MemberLoginRequest):
        await logger.log_message(request=request, message="Login member router start", step="ROUTER_START")
        logic = AuthLogic()
        return await logic.login_member(request, req)


class AuthLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        logger.log_message_sync(message="AuthLogic instance created")

    async def register_user(self, request: Request, user: schemas.UserCreate):
        try:
            with logger.time_operation("REGISTER_USER", request=request):
                db = self.db_driver
                email_clean = user.email.replace(" ", "").lower() if user.email else ""
                
                existing = db.fetch_one("SELECT id FROM users WHERE LOWER(email) = %s LIMIT 1", (email_clean,))
                if existing:
                    raise HTTPException(status_code=400, detail="Email already registered")

                insert_data = {
                    "club_name": user.clubName,
                    "country": user.country,
                    "state": user.state,
                    "member_count": user.memberCount,
                    "sport": user.sport,
                    "first_name": user.firstName,
                    "last_name": user.lastName,
                    "email": email_clean,
                    "password": user.password.strip() if user.password else "",
                    "phone": user.phone,
                    "aadhar_number": user.aadharNumber,
                    "hear_about": user.hearAbout,
                    "is_verified": True,
                    "verification_token": None
                }
                
                user_id = db.insert("users", insert_data)
                new_user = db.fetch_one("SELECT * FROM users WHERE id = %s", (user_id,))
                return new_user
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to register user: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def verify_user(self, request: Request, token: str):
        try:
            with logger.time_operation("VERIFY_USER", request=request):
                db = self.db_driver
                user = db.fetch_one("SELECT * FROM users WHERE verification_token = %s LIMIT 1", (token,))
                if not user:
                    raise HTTPException(status_code=400, detail="Invalid verification token")

                db.execute_query(
                    "UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = %s",
                    (user.get("id"),)
                )
                return RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard?verified=true")
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to verify user: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def login_user(self, request: Request, user_data: schemas.UserLogin):
        try:
            with logger.time_operation("LOGIN_USER", request=request):
                db = self.db_driver
                email_clean = user_data.email.replace(" ", "").lower() if user_data.email else ""
                password_clean = user_data.password.strip() if user_data.password else ""
                
                user = db.fetch_one("SELECT * FROM users WHERE LOWER(email) = %s LIMIT 1", (email_clean,))
                if not user or user.get("password") != password_clean:
                    raise HTTPException(status_code=400, detail="Invalid email or password")

                return {
                    "message": "Login successful",
                    "userName": user.get("first_name"),
                    "userId": user.get("id"),
                    "clubName": user.get("club_name")
                }
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to login user: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def login_standard_user(self, request: Request, user_data: schemas.UserLogin):
        try:
            with logger.time_operation("LOGIN_STANDARD_USER", request=request):
                db = self.db_driver
                email_clean = user_data.email.replace(" ", "").lower() if user_data.email else ""
                password_clean = user_data.password.strip() if user_data.password else ""
                
                user = db.fetch_one("SELECT * FROM users WHERE LOWER(email) = %s LIMIT 1", (email_clean,))
                logger.log_message_sync(f"Standard user login attempt for email: '{email_clean}'")
                
                if not user:
                    logger.log_warning_sync(f"User not found for email: '{email_clean}'")
                    raise HTTPException(status_code=400, detail="Invalid email or password")

                if user.get("password") != password_clean:
                    logger.log_warning_sync(f"Password mismatch for user email: '{email_clean}'")
                    raise HTTPException(status_code=400, detail="Invalid email or password")

                return {
                    "message": "Login successful",
                    "userName": user.get("first_name"),
                    "userId": user.get("id"),
                    "userEmail": user.get("email"),
                    "clubName": user.get("club_name")
                }
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed standard login: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def register_standard_user(self, request: Request, payload: schemas.StandardUserRegister):
        try:
            with logger.time_operation("REGISTER_STANDARD_USER", request=request):
                db = self.db_driver
                email_clean = payload.email.replace(" ", "").lower() if payload.email else ""
                
                existing = db.fetch_one("SELECT id FROM users WHERE LOWER(email) = %s LIMIT 1", (email_clean,))
                if existing:
                    raise HTTPException(status_code=400, detail="Email already registered")

                insert_data = {
                    "first_name": payload.firstName,
                    "last_name": payload.lastName,
                    "dob": payload.dob,
                    "email": email_clean,
                    "password": payload.password.strip() if payload.password else "",
                    "phone": payload.phone,
                    "aadhar_number": payload.aadharNumber,
                    "is_verified": True
                }
                
                user_id = db.insert("users", insert_data)
                return {"message": "User registered successfully", "userId": user_id}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to register standard user: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_clubs(self, request: Request):
        try:
            with logger.time_operation("GET_CLUBS", request=request):
                db = self.db_driver
                users = db.fetch_all("SELECT * FROM users WHERE club_name IS NOT NULL")
                return [
                    {
                        "id": u.get("id"),
                        "club_name": u.get("club_name"),
                        "sport": u.get("sport"),
                        "country": u.get("country"),
                        "state": u.get("state")
                    }
                    for u in users
                ]
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get clubs: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def login_member(self, request: Request, req: MemberLoginRequest):
        try:
            with logger.time_operation("LOGIN_MEMBER", request=request):
                db = self.db_driver
                email_clean = normalize_email(req.email)
                password_clean = req.password.strip() if req.password else ""

                if not email_clean or not password_clean:
                    raise HTTPException(status_code=400, detail="Email and password are required.")

                member = find_approved_member_by_email(db, email_clean)
                if not member:
                    if has_pending_submission_for_email(db, email_clean):
                        raise HTTPException(
                            status_code=403,
                            detail="Club admin has to approve your application before you can log in."
                        )
                    raise HTTPException(status_code=404, detail="Member email not registered with any club.")

                # Password verification
                if member.get("password"):
                    if member.get("password") != password_clean:
                        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
                else:
                    # Fallback default password
                    if member.get("phone") and member.get("phone") != password_clean:
                        raise HTTPException(status_code=401, detail="Incorrect password. Please use your registered phone number if you have not set a password.")

                group = db.fetch_one("SELECT * FROM groups WHERE id = %s", (member.get("group_id"),))
                if not group:
                    raise HTTPException(status_code=400, detail="Member has not been assigned to a club group yet.")

                owner = db.fetch_one("SELECT * FROM users WHERE id = %s", (group.get("owner_id"),))
                if not owner:
                    raise HTTPException(status_code=400, detail="Associated club owner not found.")

                return {
                    "userName": f"{member.get('first_name')} {member.get('last_name')}",
                    "userId": owner.get("id"),
                    "clubName": owner.get("club_name"),
                    "isMember": True,
                    "memberRole": member.get("role"),
                    "memberId": member.get("id"),
                    "userEmail": member.get("email"),
                    "userPhone": member.get("phone") or "",
                    "groupName": group.get("group_name"),
                    "approvalStatus": "accepted"
                }
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to login member: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
