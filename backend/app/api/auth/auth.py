from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
import uuid
import json
from datetime import datetime, timedelta
import secrets
from app.core.security import hash_password, verify_password, create_access_token
from app.services.email import send_verification_email


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
        self.router.add_api_route(
            path="/auth/resend-verification",
            endpoint=self.resend_verification,
            methods=["POST"],
            summary="Resend email verification token.",
            tags=["Auth"]
        )

    async def register_user(self, request: Request, user: schemas.UserCreate, background_tasks: BackgroundTasks):
        await logger.log_message(request=request, message="Register user router start", step="ROUTER_START")
        logic = AuthLogic()
        return await logic.register_user(request, user, background_tasks)

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

    async def register_standard_user(self, request: Request, payload: schemas.StandardUserRegister, background_tasks: BackgroundTasks):
        await logger.log_message(request=request, message="Register standard user router start", step="ROUTER_START")
        logic = AuthLogic()
        return await logic.register_standard_user(request, payload, background_tasks)

    async def get_clubs(self, request: Request):
        await logger.log_message(request=request, message="Get clubs router start", step="ROUTER_START")
        logic = AuthLogic()
        return await logic.get_clubs(request)

    async def login_member(self, request: Request, req: MemberLoginRequest):
        await logger.log_message(request=request, message="Login member router start", step="ROUTER_START")
        logic = AuthLogic()
        return await logic.login_member(request, req)

    async def resend_verification(self, request: Request, payload: schemas.ResendVerificationPayload, background_tasks: BackgroundTasks):
        await logger.log_message(request=request, message="Resend verification router start", step="ROUTER_START")
        logic = AuthLogic()
        return await logic.resend_verification(request, payload, background_tasks)


class AuthLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        logger.log_message_sync(message="AuthLogic instance created")

    async def register_user(self, request: Request, user: schemas.UserCreate, background_tasks: BackgroundTasks):
        try:
            with logger.time_operation("REGISTER_USER", request=request):
                db = self.db_driver
                from app.core.validators import (
                    validate_club_name_or_raise,
                    validate_person_name_or_raise,
                    validate_email_or_raise,
                    validate_strong_password_or_raise,
                    validate_phone_or_raise,
                    validate_aadhaar_or_raise,
                )

                club_name = validate_club_name_or_raise(user.clubName)
                first_name = validate_person_name_or_raise(user.firstName, "First name")
                last_name = validate_person_name_or_raise(user.lastName, "Last name")
                email_clean = validate_email_or_raise(user.email)
                validate_strong_password_or_raise(user.password.strip() if user.password else "")
                phone_clean = validate_phone_or_raise(user.phone)
                aadhar_clean = validate_aadhaar_or_raise(user.aadharNumber, required=True)
                
                existing = db.fetch_one("SELECT id FROM users WHERE LOWER(email) = %s LIMIT 1", (email_clean,))
                if existing:
                    raise HTTPException(status_code=400, detail="Email already registered")

                hashed_password = hash_password(user.password.strip())
                token = secrets.token_urlsafe(32)
                expires_at = datetime.utcnow() + timedelta(hours=24)

                insert_data = {
                    "club_name": club_name,
                    "country": user.country,
                    "state": user.state,
                    "member_count": user.memberCount,
                    "sport": user.sport,
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email_clean,
                    "password": hashed_password,
                    "phone": phone_clean,
                    "aadhar_number": aadhar_clean,
                    "hear_about": user.hearAbout,
                    "is_verified": False,
                    "verification_token": token,
                    "is_email_verified": False,
                    "email_verification_token": token,
                    "email_verification_token_expires_at": expires_at
                }
                
                user_id = db.insert("users", insert_data)
                new_user = db.fetch_one("SELECT * FROM users WHERE id = %s", (user_id,))
                
                background_tasks.add_task(send_verification_email, email_clean, token)
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
                # Check email_verification_token or fallback verification_token
                user = db.fetch_one("SELECT * FROM users WHERE email_verification_token = %s OR verification_token = %s LIMIT 1", (token, token))
                if not user:
                    raise HTTPException(status_code=400, detail="Invalid verification link.")

                expires_at = user.get("email_verification_token_expires_at")
                if expires_at:
                    now = datetime.now(expires_at.tzinfo) if expires_at.tzinfo else datetime.utcnow()
                    if expires_at < now:
                        raise HTTPException(status_code=400, detail="Verification link has expired. Please request a new verification email.")

                db.execute_query(
                    "UPDATE users SET is_verified = TRUE, verification_token = NULL, is_email_verified = TRUE, email_verification_token = NULL, email_verification_token_expires_at = NULL WHERE id = %s",
                    (user.get("id"),)
                )
                return {"message": "Your email has been successfully verified!"}
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
                if not user or not verify_password(password_clean, user.get("password")):
                    raise HTTPException(status_code=400, detail="Invalid email or password")

                # Migrate plain text password to hashed format if needed
                current_pw = user.get("password") or ""
                if not (current_pw.startswith("$2b$") or current_pw.startswith("$2a$")):
                    hashed = hash_password(password_clean)
                    db.execute_query("UPDATE users SET password = %s WHERE id = %s", (hashed, user.get("id")))

                # Check if email is verified
                if not user.get("is_email_verified"):
                    raise HTTPException(status_code=403, detail="Your email is not verified. Please verify your email first.")

                sub_claim = json.dumps({
                    "id": user.get("id"),
                    "userId": user.get("id"),
                    "username": user.get("first_name"),
                    "role": "admin"
                })
                token_data = {"sub": sub_claim}
                access_token = create_access_token(data=token_data)

                return {
                    "message": "Login successful",
                    "userName": user.get("first_name"),
                    "userId": user.get("id"),
                    "clubName": user.get("club_name"),
                    "accessToken": access_token
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
                
                if not user or not verify_password(password_clean, user.get("password")):
                    logger.log_warning_sync(f"Invalid credentials for standard user: '{email_clean}'")
                    raise HTTPException(status_code=400, detail="Invalid email or password")

                # Migrate plain text password to hashed format if needed
                current_pw = user.get("password") or ""
                if not (current_pw.startswith("$2b$") or current_pw.startswith("$2a$")):
                    hashed = hash_password(password_clean)
                    db.execute_query("UPDATE users SET password = %s WHERE id = %s", (hashed, user.get("id")))

                # Check if email is verified
                if not user.get("is_email_verified"):
                    raise HTTPException(status_code=403, detail="Your email is not verified. Please verify your email first.")

                sub_claim = json.dumps({
                    "id": user.get("id"),
                    "userId": user.get("id"),
                    "username": user.get("first_name"),
                    "role": "user"
                })
                token_data = {"sub": sub_claim}
                access_token = create_access_token(data=token_data)

                return {
                    "message": "Login successful",
                    "userName": user.get("first_name"),
                    "userId": user.get("id"),
                    "userEmail": user.get("email"),
                    "clubName": user.get("club_name"),
                    "accessToken": access_token
                }
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed standard login: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def register_standard_user(self, request: Request, payload: schemas.StandardUserRegister, background_tasks: BackgroundTasks):
        try:
            with logger.time_operation("REGISTER_STANDARD_USER", request=request):
                db = self.db_driver
                email_clean = payload.email.replace(" ", "").lower() if payload.email else ""
                
                existing = db.fetch_one("SELECT id FROM users WHERE LOWER(email) = %s LIMIT 1", (email_clean,))
                if existing:
                    raise HTTPException(status_code=400, detail="Email already registered")

                hashed_password = hash_password(payload.password.strip())
                token = secrets.token_urlsafe(32)
                expires_at = datetime.utcnow() + timedelta(hours=24)

                insert_data = {
                    "first_name": payload.firstName,
                    "last_name": payload.lastName,
                    "dob": payload.dob,
                    "email": email_clean,
                    "password": hashed_password,
                    "phone": payload.phone,
                    "aadhar_number": payload.aadharNumber,
                    "is_verified": False,
                    "verification_token": token,
                    "is_email_verified": False,
                    "email_verification_token": token,
                    "email_verification_token_expires_at": expires_at
                }
                
                user_id = db.insert("users", insert_data)
                
                background_tasks.add_task(send_verification_email, email_clean, token)
                return {"message": "User registered successfully", "userId": user_id}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to register standard user: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def resend_verification(self, request: Request, payload: schemas.ResendVerificationPayload, background_tasks: BackgroundTasks):
        try:
            with logger.time_operation("RESEND_VERIFICATION", request=request):
                db = self.db_driver
                email_clean = payload.email.replace(" ", "").lower() if payload.email else ""
                
                user = db.fetch_one("SELECT * FROM users WHERE LOWER(email) = %s LIMIT 1", (email_clean,))
                if not user:
                    return {"message": "If the email is registered, a new verification link has been sent."}

                if user.get("is_email_verified"):
                    return {"message": "This email is already verified. Please sign in."}

                token = secrets.token_urlsafe(32)
                expires_at = datetime.utcnow() + timedelta(hours=24)

                db.execute_query(
                    "UPDATE users SET verification_token = %s, email_verification_token = %s, email_verification_token_expires_at = %s WHERE id = %s",
                    (token, token, expires_at, user.get("id"))
                )

                background_tasks.add_task(send_verification_email, email_clean, token)
                return {"message": "A new verification link has been sent to your email."}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to resend verification email: {e}")
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
                    current_pw = member.get("password")
                    is_hashed = current_pw.startswith("$2b$") or current_pw.startswith("$2a$")
                    if is_hashed:
                        if not verify_password(password_clean, current_pw):
                            raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
                    else:
                        if current_pw != password_clean:
                            raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
                        # Migrate plain text password to hashed format
                        hashed = hash_password(password_clean)
                        db.execute_query("UPDATE members SET password = %s WHERE id = %s", (hashed, member.get("id")))
                else:
                    # Fallback default password
                    db_phone = member.get("phone") or ""
                    db_phone_digits = "".join(c for c in db_phone if c.isdigit())
                    input_phone_digits = "".join(c for c in password_clean if c.isdigit())

                    is_match = False
                    if db_phone_digits and input_phone_digits:
                        if db_phone_digits == input_phone_digits:
                            is_match = True
                        elif len(db_phone_digits) >= 10 and len(input_phone_digits) >= 10:
                            is_match = db_phone_digits[-10:] == input_phone_digits[-10:]

                    if not is_match:
                        raise HTTPException(
                            status_code=401,
                            detail="Incorrect password. Please use your registered phone number if you have not set a password."
                        )

                group = db.fetch_one("SELECT * FROM groups WHERE id = %s", (member.get("group_id"),))
                if not group:
                    raise HTTPException(status_code=400, detail="Member has not been assigned to a club group yet.")

                owner = db.fetch_one("SELECT * FROM users WHERE id = %s", (group.get("owner_id"),))
                if not owner:
                    raise HTTPException(status_code=400, detail="Associated club owner not found.")

                sub_claim = json.dumps({
                    "id": member.get("id"),
                    "userId": owner.get("id"),
                    "username": f"{member.get('first_name')} {member.get('last_name')}",
                    "role": "team_member"
                })
                token_data = {"sub": sub_claim}
                access_token = create_access_token(data=token_data)

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
                    "approvalStatus": "accepted",
                    "accessToken": access_token
                }
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to login member: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
