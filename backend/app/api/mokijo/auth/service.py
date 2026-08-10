from fastapi import Request, HTTPException, BackgroundTasks
import json
from datetime import datetime, timedelta
import secrets
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.security import hash_password, verify_password, create_access_token
from app.services.email import send_verification_email
from app.core.config import get_settings
from app.models import schemas
from app.core.helpers import normalize_email
from app.logger import logger
from app.api.mokijo.auth import crud

settings = get_settings()

class MemberLoginRequest(BaseModel):
    email: str
    password: str

async def register_user(request: Request, db: Session, user: schemas.UserCreate, background_tasks: BackgroundTasks):
    try:
        with logger.time_operation("REGISTER_USER", request=request):
            email_clean = user.email.replace(" ", "").lower() if user.email else ""
            
            existing = crud.get_user_id_by_email(db, email_clean)
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")

            hashed_password = hash_password(user.password.strip())

            if user.clubId and user.clubId.strip():
                assigned_club_id = user.clubId.strip()
            else:
                max_user = crud.get_max_user_id(db)
                next_num = (max_user.get("max_id") or 0) + 1 if max_user else 1
                assigned_club_id = f"MKJ-{next_num:03d}"

            insert_data = {
                "club_id": assigned_club_id,
                "club_name": user.clubName,
                "club_logo": user.clubLogo,
                "country": user.country,
                "state": user.state,
                "member_count": user.memberCount,
                "sport": user.sport,
                "first_name": user.firstName,
                "last_name": user.lastName,
                "email": email_clean,
                "password": hashed_password,
                "phone": user.phone,
                "aadhar_number": user.aadharNumber,
                "hear_about": user.hearAbout,
                "is_verified": True,
                "verification_token": None,
                "is_email_verified": True,
                "email_verification_token": None,
                "email_verification_token_expires_at": None,
                "approval_status": "PENDING_APPROVAL",
            }
            
            user_id = crud.create_user(db, insert_data)
            new_user = crud.get_user_by_id(db, user_id)
            return new_user
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to register user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def verify_user(request: Request, db: Session, token: str):
    try:
        with logger.time_operation("VERIFY_USER", request=request):
            user = crud.get_user_by_verification_token(db, token)
            if not user:
                raise HTTPException(status_code=400, detail="Invalid verification link.")

            expires_at = user.email_verification_token_expires_at
            if expires_at:
                now = datetime.now(expires_at.tzinfo) if expires_at.tzinfo else datetime.utcnow()
                if expires_at < now:
                    raise HTTPException(status_code=400, detail="Verification link has expired. Please request a new verification email.")

            crud.update_user_verification_status(db, user.id)
            return {"message": "Your email has been successfully verified!"}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to verify user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def login_user(request: Request, db: Session, user_data: schemas.UserLogin):
    try:
        with logger.time_operation("LOGIN_USER", request=request):
            email_clean = user_data.email.replace(" ", "").lower() if user_data.email else ""
            password_clean = user_data.password.strip() if user_data.password else ""
            
            user = crud.get_user_by_email(db, email_clean)
            if not user or not verify_password(password_clean, user.password):
                raise HTTPException(status_code=400, detail="Invalid email or password")

            status = user.approval_status
            if status == "PENDING_APPROVAL":
                raise HTTPException(status_code=403, detail="Your club registration is currently pending approval by Super Admin.")
            elif status == "REJECTED":
                reason = user.rejection_reason
                msg = f"Your club registration request was rejected by Super Admin. {f'Reason: {reason}' if reason else ''}"
                raise HTTPException(status_code=403, detail=msg.strip())

            current_pw = user.password or ""
            if not (current_pw.startswith("$2b$") or current_pw.startswith("$2a$")):
                hashed = hash_password(password_clean)
                crud.update_user_password(db, user.id, hashed)

            sub_claim = json.dumps({
                "id": user.id,
                "userId": user.id,
                "username": user.first_name,
                "role": "admin"
            })
            token_data = {"sub": sub_claim}
            access_token = create_access_token(data=token_data)

            return {
                "message": "Login successful",
                "userName": user.first_name,
                "userId": user.id,
                "clubId": user.club_id or f"MKJ-{user.id:03d}",
                "clubName": user.club_name,
                "clubLogo": getattr(user, "club_logo", None),
                "accessToken": access_token
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        await logger.log_error(request=request, message=f"Failed to login user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def login_standard_user(request: Request, db: Session, user_data: schemas.UserLogin):
    try:
        with logger.time_operation("LOGIN_STANDARD_USER", request=request):
            email_clean = user_data.email.replace(" ", "").lower() if user_data.email else ""
            password_clean = user_data.password.strip() if user_data.password else ""
            
            user = crud.get_user_by_email(db, email_clean)
            logger.log_message_sync(f"Standard user login attempt for email: '{email_clean}'")
            
            if not user or not verify_password(password_clean, user.password):
                logger.log_warning_sync(f"Invalid credentials for standard user: '{email_clean}'")
                raise HTTPException(status_code=400, detail="Invalid email or password")

            current_pw = user.password or ""
            if not (current_pw.startswith("$2b$") or current_pw.startswith("$2a$")):
                hashed = hash_password(password_clean)
                crud.update_user_password(db, user.id, hashed)

            sub_claim = json.dumps({
                "id": user.id,
                "userId": user.id,
                "username": user.first_name,
                "role": "user"
            })
            token_data = {"sub": sub_claim}
            access_token = create_access_token(data=token_data)

            return {
                "message": "Login successful",
                "userName": user.first_name,
                "userId": user.id,
                "userEmail": user.email,
                "clubName": user.club_name,
                "accessToken": access_token
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed standard login: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def register_standard_user(request: Request, db: Session, payload: schemas.StandardUserRegister, background_tasks: BackgroundTasks):
    try:
        with logger.time_operation("REGISTER_STANDARD_USER", request=request):
            email_clean = payload.email.replace(" ", "").lower() if payload.email else ""
            
            existing = crud.get_user_id_by_email(db, email_clean)
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")

            hashed_password = hash_password(payload.password.strip())

            insert_data = {
                "first_name": payload.firstName,
                "last_name": payload.lastName,
                "dob": payload.dob,
                "email": email_clean,
                "password": hashed_password,
                "phone": payload.phone,
                "aadhar_number": payload.aadharNumber,
                "is_verified": True,
                "verification_token": None,
                "is_email_verified": True,
                "email_verification_token": None,
                "email_verification_token_expires_at": None,
            }
            
            user_id = crud.create_user(db, insert_data)
            return {"message": "User registered successfully", "userId": user_id}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to register standard user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def resend_verification(request: Request, db: Session, payload: schemas.ResendVerificationPayload, background_tasks: BackgroundTasks):
    try:
        with logger.time_operation("RESEND_VERIFICATION", request=request):
            email_clean = payload.email.replace(" ", "").lower() if payload.email else ""
            
            user = crud.get_user_by_email(db, email_clean)
            if not user:
                return {"message": "If the email is registered, a new verification link has been sent."}

            if user.is_email_verified:
                return {"message": "This email is already verified. Please sign in."}

            token = secrets.token_urlsafe(32)
            expires_at = datetime.utcnow() + timedelta(hours=24)

            crud.update_user_verification_tokens(db, user.id, token, expires_at)

            background_tasks.add_task(send_verification_email, email_clean, token)
            return {"message": "A new verification link has been sent to your email."}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to resend verification email: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_clubs(request: Request, db: Session):
    try:
        with logger.time_operation("GET_CLUBS", request=request):
            users = crud.get_clubs(db)
            return [
                {
                    "id": u.id,
                    "club_id": u.club_id or f"MKJ-{u.id:03d}",
                    "club_name": u.club_name,
                    "sport": u.sport,
                    "country": u.country,
                    "state": u.state
                }
                for u in users
            ]
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get clubs: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def login_member(request: Request, db: Session, req: MemberLoginRequest):
    try:
        with logger.time_operation("LOGIN_MEMBER", request=request):
            email_clean = normalize_email(req.email)
            password_clean = req.password.strip() if req.password else ""

            if not email_clean or not password_clean:
                raise HTTPException(status_code=400, detail="Email and password are required.")

            member = crud.find_approved_member_by_email(db, email_clean)
            if not member:
                if crud.has_pending_submission_for_email(db, email_clean):
                    raise HTTPException(
                        status_code=403,
                        detail="Club admin has to approve your application before you can log in."
                    )
                raise HTTPException(status_code=404, detail="Member email not registered with any club.")

            if member.password:
                current_pw = member.password
                is_hashed = current_pw.startswith("$2b$") or current_pw.startswith("$2a$")
                if is_hashed:
                    if not verify_password(password_clean, current_pw):
                        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
                else:
                    if current_pw != password_clean:
                        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
                    hashed = hash_password(password_clean)
                    crud.update_member_password(db, member.id, hashed)
            else:
                db_phone = member.phone or ""
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

            group = crud.get_group_by_id(db, member.group_id)
            if not group:
                raise HTTPException(status_code=400, detail="Member has not been assigned to a club group yet.")

            owner = crud.get_user_by_id(db, group.owner_id)
            if not owner:
                raise HTTPException(status_code=400, detail="Associated club owner not found.")

            sub_claim = json.dumps({
                "id": member.id,
                "userId": owner.id,
                "username": f"{member.first_name} {member.last_name}",
                "role": "team_member"
            })
            token_data = {"sub": sub_claim}
            access_token = create_access_token(data=token_data)

            return {
                "userName": f"{member.first_name} {member.last_name}",
                "userId": owner.id,
                "clubName": owner.club_name,
                "isMember": True,
                "memberRole": member.role,
                "memberId": member.id,
                "userEmail": member.email,
                "userPhone": member.phone or "",
                "groupName": group.group_name,
                "approvalStatus": "accepted",
                "accessToken": access_token
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to login member: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_member_profile(request: Request, db: Session, member_id: int):
    try:
        with logger.time_operation("GET_MEMBER_PROFILE", request=request):
            member = crud.get_member_by_id(db, member_id)
            if not member:
                raise HTTPException(status_code=404, detail="Member profile not found.")

            group_name = ""
            club_name = ""
            if member.group_id:
                group = crud.get_group_by_id(db, member.group_id)
                if group:
                    group_name = group.group_name or ""
                    if group.owner_id:
                        owner = crud.get_user_by_id(db, group.owner_id)
                        if owner:
                            club_name = owner.club_name or ""

            return {
                "id": member.id,
                "first_name": member.first_name or "",
                "last_name": member.last_name or "",
                "email": member.email or "",
                "phone": member.phone or "",
                "role": member.role or "Member",
                "group_id": member.group_id,
                "group_name": group_name,
                "club_name": club_name
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get member profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def update_member_profile(request: Request, db: Session, member_id: int, payload: schemas.MemberProfileUpdate):
    try:
        with logger.time_operation("UPDATE_MEMBER_PROFILE", request=request):
            member = crud.get_member_by_id(db, member_id)
            if not member:
                raise HTTPException(status_code=404, detail="Member profile not found.")

            update_data = {}
            if payload.first_name is not None and payload.first_name.strip():
                update_data["first_name"] = payload.first_name.strip()
            if payload.last_name is not None and payload.last_name.strip():
                update_data["last_name"] = payload.last_name.strip()
            if payload.email is not None and payload.email.strip():
                email_clean = normalize_email(payload.email)
                existing = crud.get_member_id_by_email_exclude_current(db, email_clean, member_id)
                if existing:
                    raise HTTPException(status_code=400, detail="Email is already used by another member.")
                update_data["email"] = email_clean
            if payload.phone is not None and payload.phone.strip():
                update_data["phone"] = payload.phone.strip()
            if payload.password is not None and payload.password.strip():
                update_data["password"] = hash_password(payload.password.strip())
            if payload.role is not None and payload.role.strip():
                update_data["role"] = payload.role.strip()

            if update_data:
                crud.update_member(db, member_id, update_data)

            if member.group_id:
                if payload.group_name is not None and payload.group_name.strip():
                    crud.update_group_name(db, member.group_id, payload.group_name.strip())
                if payload.club_name is not None and payload.club_name.strip():
                    group = crud.get_group_owner_id(db, member.group_id)
                    if group and group.get("owner_id"):
                        crud.update_club_name(db, group.get("owner_id"), payload.club_name.strip())

            return await get_member_profile(request, db, member_id)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to update member profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_club_admin_profile(request: Request, db: Session, user_id: int):
    try:
        with logger.time_operation("GET_CLUB_ADMIN_PROFILE", request=request):
            user = crud.get_user_by_id(db, user_id)
            if not user:
                raise HTTPException(status_code=404, detail="Club Admin profile not found.")
            
            return {
                "id": user.id,
                "club_id": user.club_id or f"MKJ-{user.id:03d}",
                "club_name": user.club_name or "",
                "club_logo": getattr(user, "club_logo", None) or "",
                "country": user.country or "",
                "state": user.state or "",
                "member_count": user.member_count or "",
                "sport": user.sport or "",
                "first_name": user.first_name or "",
                "last_name": user.last_name or "",
                "email": user.email or "",
                "phone": user.phone or "",
                "aadhar_number": user.aadhar_number or "",
                "hear_about": user.hear_about or "",
                "approval_status": user.approval_status or "APPROVED"
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get club admin profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def update_club_admin_profile(request: Request, db: Session, user_id: int, payload: schemas.ClubAdminProfileUpdate):
    try:
        with logger.time_operation("UPDATE_CLUB_ADMIN_PROFILE", request=request):
            user = crud.get_user_by_id(db, user_id)
            if not user:
                raise HTTPException(status_code=404, detail="Club Admin profile not found.")

            update_data = {}
            if payload.club_name is not None and payload.club_name.strip():
                update_data["club_name"] = payload.club_name.strip()
            if payload.club_logo is not None:
                update_data["club_logo"] = payload.club_logo
            if payload.country is not None:
                update_data["country"] = payload.country.strip()
            if payload.state is not None:
                update_data["state"] = payload.state.strip()
            if payload.member_count is not None:
                update_data["member_count"] = payload.member_count.strip()
            if payload.sport is not None:
                update_data["sport"] = payload.sport.strip()
            if payload.first_name is not None and payload.first_name.strip():
                update_data["first_name"] = payload.first_name.strip()
            if payload.last_name is not None and payload.last_name.strip():
                update_data["last_name"] = payload.last_name.strip()
            if payload.phone is not None and payload.phone.strip():
                update_data["phone"] = payload.phone.strip()
            if payload.hear_about is not None:
                update_data["hear_about"] = payload.hear_about.strip()
            if payload.password is not None and payload.password.strip():
                update_data["password"] = hash_password(payload.password.strip())

            if update_data:
                crud.update_user_profile(db, user_id, update_data)

            return await get_club_admin_profile(request, db, user_id)
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to update club admin profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

