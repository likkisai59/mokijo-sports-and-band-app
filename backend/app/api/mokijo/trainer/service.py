from fastapi import APIRouter, Depends, Request, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import json
import re

from app.models import schemas
from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization, validate_role_and_permission
from app.core.security import hash_password, verify_password, create_access_token
from app.core.helpers import serialize_course, serialize_course_registration
from app.logger import logger

COURSE_STATUSES = {"draft", "open", "full", "closed", "completed"}
USER_ID_NOTE_RE = re.compile(r"user_id:(\d+)", re.IGNORECASE)


def enrich_registration_for_trainer(registration: dict, db) -> dict:
        data = serialize_course_registration(registration, db)
        registrant_type = "guest"

        if registration.get("member_id"):
            registrant_type = "club_member"
        else:
            notes = registration.get("notes") or ""
            match = USER_ID_NOTE_RE.search(notes)
            if match:
                user_id = int(match.group(1))
                user = crud.get_user_by_id_and_role(db, user_id, "user")
                email = (user.get("email") or "").strip().lower() if user else ""
                member = None
                if email:
                    member = crud.get_club_member_by_email(db, email)
                if member:
                    registrant_type = "club_member"
                elif user and (user.get("club_name") or "").strip():
                    registrant_type = "club_admin"
                else:
                    registrant_type = "user"

        data["registrant_type"] = registrant_type
        return data


from app.api.mokijo.trainer import crud

async def register_trainer(request: Request, db: Session, payload: schemas.TrainerRegister):
    try:
        with logger.time_operation("REGISTER_TRAINER", request=request):
            email_clean = payload.email.replace(" ", "").lower()

            if not payload.first_name.strip() or not payload.last_name.strip():
                raise HTTPException(status_code=400, detail="First name and last name are required.")
            if not payload.specialization.strip():
                raise HTTPException(status_code=400, detail="Specialization is required.")
            if not payload.sports or len(payload.sports) == 0:
                raise HTTPException(status_code=400, detail="Select at least one interested sport.")

            existing = crud.get_trainer_by_email(db, email_clean)
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered as a trainer.")

            insert_trainer = {
                "first_name": payload.first_name.strip(),
                "last_name": payload.last_name.strip(),
                "email": email_clean,
                "phone": payload.phone.strip(),
                "password": hash_password(payload.password.strip()),
                "specialization": payload.specialization.strip(),
                "experience": payload.experience.strip() if payload.experience else None,
                "aadhar": payload.aadhar.strip() if payload.aadhar else None,
                "sports": json.dumps(payload.sports),
                "is_verified": True,
            }
            trainer_id = crud.create_trainer(db, insert_trainer)
            trainer = crud.get_trainer_by_id(db, trainer_id)
            return {
                "message": "Trainer registered successfully!",
                "trainerId": trainer.get("id"),
                "trainerName": f"{trainer.get('first_name')} {trainer.get('last_name')}",
                "trainerEmail": trainer.get("email"),
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to register trainer: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def login_trainer(request: Request, db: Session, credentials: schemas.TrainerLogin):
    try:
        with logger.time_operation("LOGIN_TRAINER", request=request):
            email_clean = credentials.email.replace(" ", "").lower()
            trainer = crud.get_trainer_by_email(db, email_clean)

            if not trainer:
                raise HTTPException(status_code=400, detail="Invalid email or password.")
            if not verify_password(credentials.password.strip(), trainer.get("password")):
                raise HTTPException(status_code=400, detail="Invalid email or password.")

            hashed_pw = trainer.get("password")
            if hashed_pw and not (hashed_pw.startswith("$2b$") or hashed_pw.startswith("$2a$")):
                new_hash = hash_password(credentials.password.strip())
                crud.update_trainer_password(db, trainer.get("id"), new_hash)

            access_token = create_access_token({"sub": str(trainer.get("id")), "role": "trainer"})
            return {
                "message": "Login successful",
                "trainerId": trainer.get("id"),
                "trainerName": f"{trainer.get('first_name')} {trainer.get('last_name')}",
                "trainerEmail": trainer.get("email"),
                "isTrainer": True,
                "access_token": access_token,
                "token_type": "bearer",
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed trainer login: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_trainer_courses(request: Request, db: Session, trainer_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_TRAINER_COURSES", request=request):
            validate_role_and_permission(db, current_user, ["trainer"], trainer_id)
            courses = crud.get_courses_by_trainer(db, trainer_id)
            return [serialize_course(c, db) for c in courses]
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed getting trainer courses: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def create_trainer_course(
        self,
        request: Request,
        trainer_id: int,
        course: schemas.CourseCreate,
        current_user: dict
    ):
        try:
            with logger.time_operation("CREATE_TRAINER_COURSE", request=request):
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)

                trainer = crud.get_trainer_by_id(db, trainer_id)
                if not trainer:
                    raise HTTPException(status_code=404, detail="Trainer not found.")

                if not course.title or not course.title.strip():
                    raise HTTPException(status_code=400, detail="Training title is required")
                if course.capacity is not None and course.capacity <= 0:
                    raise HTTPException(status_code=400, detail="Capacity must be greater than zero")
                if course.fee is not None and course.fee < 0:
                    raise HTTPException(status_code=400, detail="Fee cannot be negative")

                status_val = course.status or "open"
                if status_val not in COURSE_STATUSES:
                    raise HTTPException(status_code=400, detail="Invalid course status")

                instructor = course.instructor
                if not instructor:
                    instructor = f"{trainer.get('first_name')} {trainer.get('last_name')}"

                days_list = [d.strip() for d in (course.days or []) if d and str(d).strip()]
                start_time = (course.start_time or "").strip() or None
                end_time = (course.end_time or "").strip() or None

                # Prefer explicit schedule; otherwise build from days + times
                schedule = (course.schedule or "").strip() or None
                if not schedule and (days_list or start_time or end_time):
                    day_part = "/".join(days_list) if days_list else ""
                    if start_time and end_time:
                        time_part = f"{start_time}–{end_time}"
                    else:
                        time_part = start_time or end_time or ""
                    schedule = " · ".join([p for p in [day_part, time_part] if p]) or None

                insert_data = {
                    "owner_id": None,
                    "trainer_id": trainer_id,
                    "group_id": None,
                    "title": course.title.strip(),
                    "code": course.code,
                    "category": course.category or "Training",
                    "level": course.level,
                    "description": course.description,
                    "instructor": instructor,
                    "start_date": course.start_date,
                    "end_date": course.end_date,
                    "schedule": schedule,
                    "location": course.location,
                    "capacity": course.capacity or 20,
                    "fee": course.fee or 0,
                    "status": status_val,
                    "cover_image": course.cover_image,
                    "start_time": start_time,
                    "end_time": end_time,
                    "days": json.dumps(days_list) if days_list else None,
                }

                course_id = crud.create_course(db, insert_data)
                new_course = crud.get_course_by_id(db, course_id)
                return serialize_course(new_course, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to create trainer course: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

async def update_trainer_course(
        self,
        request: Request,
        trainer_id: int,
        course_id: int,
        course_update: schemas.CourseUpdate,
        current_user: dict
    ):
        try:
            with logger.time_operation("UPDATE_TRAINER_COURSE", request=request):
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)
                course = crud.get_course_by_id_and_trainer(db, course_id, trainer_id)
                if not course:
                    raise HTTPException(status_code=404, detail="Training not found or access denied.")

                update_data = course_update.dict(exclude_unset=True)
                if "status" in update_data and update_data["status"] is not None:
                    if update_data["status"] not in COURSE_STATUSES:
                        raise HTTPException(status_code=400, detail="Invalid course status")
                if "title" in update_data and update_data["title"] is not None:
                    if not str(update_data["title"]).strip():
                        raise HTTPException(status_code=400, detail="Training title is required")
                    update_data["title"] = str(update_data["title"]).strip()
                if "capacity" in update_data and update_data["capacity"] is not None and update_data["capacity"] <= 0:
                    raise HTTPException(status_code=400, detail="Capacity must be greater than zero")
                if "fee" in update_data and update_data["fee"] is not None and update_data["fee"] < 0:
                    raise HTTPException(status_code=400, detail="Fee cannot be negative")

                # Trainers cannot assign a club group
                update_data.pop("group_id", None)

                if update_data:
                    set_clause = ", ".join([f"{k} = %s" for k in update_data.keys()])
                    values = list(update_data.values()) + [course_id, trainer_id]
                    crud.update_course(db, course_id, update_data)

                updated = crud.get_course_by_id_and_trainer(db, course_id, trainer_id)
                return serialize_course(updated, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed updating trainer course: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

async def delete_trainer_course(
        request: Request,
        db: Session,
        trainer_id: int,
        course_id: int,
        current_user: dict
    ):
        try:
            with logger.time_operation("DELETE_TRAINER_COURSE", request=request):
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)
                course = crud.get_course_by_id_and_trainer(db, course_id, trainer_id)
                if not course:
                    raise HTTPException(status_code=404, detail="Training not found or access denied.")

                crud.delete_course(db, course_id)
                return {"message": "Training deleted successfully.", "id": course_id}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed deleting trainer course: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

async def reschedule_trainer_course(
        request: Request,
        db: Session,
        trainer_id: int,
        course_id: int,
        body: schemas.CourseReschedule,
        current_user: dict
    ):
        try:
            with logger.time_operation("RESCHEDULE_TRAINER_COURSE", request=request):
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)
                course = crud.get_course_by_id_and_trainer(db, course_id, trainer_id)
                if not course:
                    raise HTTPException(status_code=404, detail="Training not found or access denied.")

                reason = (body.reason or "").strip()
                if not reason:
                    raise HTTPException(status_code=400, detail="Reschedule reason is required.")

                new_start = body.start_date if body.start_date is not None else course.get("start_date")
                new_end = body.end_date if body.end_date is not None else course.get("end_date")
                new_schedule = body.schedule if body.schedule is not None else course.get("schedule")
                now = datetime.utcnow()

                crud.update_course(db, course_id, {
                    "start_date": new_start,
                    "end_date": new_end,
                    "schedule": new_schedule,
                    "reschedule_reason": reason,
                    "rescheduled_at": now
                })

                updated = crud.get_course_by_id_and_trainer(db, course_id, trainer_id)
                return serialize_course(updated, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed rescheduling trainer course: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

async def get_trainer_registrations(
        request: Request,
        db: Session,
        trainer_id: int,
        current_user: dict,
        course_id: Optional[int] = None,
    ):
        try:
            with logger.time_operation("GET_TRAINER_REGISTRATIONS", request=request):
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)

                if course_id is not None:
                    course = crud.get_course_by_id_and_trainer(db, course_id, trainer_id)
                    if not course:
                        raise HTTPException(status_code=404, detail="Training not found or access denied.")
                    rows = crud.get_course_registrations_by_course(db, course_id)
                else:
                    rows = crud.get_course_registrations_by_trainer(db, trainer_id)

                return [enrich_registration_for_trainer(r, db) for r in (rows or [])]
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed getting trainer registrations: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
