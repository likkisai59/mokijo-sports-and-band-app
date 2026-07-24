from fastapi import APIRouter, Depends, Request, HTTPException, status
from typing import List
from datetime import datetime
import json

from app.models import schemas
from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization, validate_role_and_permission
from app.core.security import hash_password, verify_password, create_access_token
from app.core.helpers import serialize_course
from app.logger import logger

COURSE_STATUSES = {"draft", "open", "full", "closed", "completed"}


class TrainerRouting(ConnectionService):
    def __init__(self) -> None:
        super().__init__()

        self.router.add_api_route(
            path="/trainer/register",
            endpoint=self.register_trainer,
            methods=["POST"],
            summary="Register a new independent trainer account.",
            tags=["Trainer"]
        )
        self.router.add_api_route(
            path="/trainer/login",
            endpoint=self.login_trainer,
            methods=["POST"],
            summary="Authenticate a trainer.",
            tags=["Trainer"]
        )
        self.router.add_api_route(
            path="/trainer/{trainer_id}/courses",
            endpoint=self.get_trainer_courses,
            methods=["GET"],
            response_model=List[schemas.CourseResponse],
            summary="List all trainings created by this trainer.",
            tags=["Trainer"]
        )
        self.router.add_api_route(
            path="/trainer/{trainer_id}/courses",
            endpoint=self.create_trainer_course,
            methods=["POST"],
            response_model=schemas.CourseResponse,
            summary="Create a new training owned by this trainer.",
            tags=["Trainer"]
        )
        self.router.add_api_route(
            path="/trainer/{trainer_id}/courses/{course_id}",
            endpoint=self.update_trainer_course,
            methods=["PUT"],
            response_model=schemas.CourseResponse,
            summary="Update a training owned by this trainer.",
            tags=["Trainer"]
        )
        self.router.add_api_route(
            path="/trainer/{trainer_id}/courses/{course_id}",
            endpoint=self.delete_trainer_course,
            methods=["DELETE"],
            summary="Delete a training owned by this trainer.",
            tags=["Trainer"]
        )
        self.router.add_api_route(
            path="/trainer/{trainer_id}/courses/{course_id}/reschedule",
            endpoint=self.reschedule_trainer_course,
            methods=["POST"],
            response_model=schemas.CourseResponse,
            summary="Reschedule a training (rain or any reason).",
            tags=["Trainer"]
        )

    async def register_trainer(self, request: Request, payload: schemas.TrainerRegister):
        await logger.log_message(request=request, message="Register trainer router start", step="ROUTER_START")
        logic = TrainerLogic()
        return await logic.register_trainer(request, payload)

    async def login_trainer(self, request: Request, credentials: schemas.TrainerLogin):
        await logger.log_message(request=request, message="Login trainer router start", step="ROUTER_START")
        logic = TrainerLogic()
        return await logic.login_trainer(request, credentials)

    async def get_trainer_courses(
        self,
        request: Request,
        trainer_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get trainer courses router start", step="ROUTER_START", user_info=current_user)
        logic = TrainerLogic()
        return await logic.get_trainer_courses(request, trainer_id, current_user)

    async def create_trainer_course(
        self,
        request: Request,
        trainer_id: int,
        course: schemas.CourseCreate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Create trainer course router start", step="ROUTER_START", user_info=current_user)
        logic = TrainerLogic()
        return await logic.create_trainer_course(request, trainer_id, course, current_user)

    async def update_trainer_course(
        self,
        request: Request,
        trainer_id: int,
        course_id: int,
        course_update: schemas.CourseUpdate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Update trainer course router start", step="ROUTER_START", user_info=current_user)
        logic = TrainerLogic()
        return await logic.update_trainer_course(request, trainer_id, course_id, course_update, current_user)

    async def delete_trainer_course(
        self,
        request: Request,
        trainer_id: int,
        course_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Delete trainer course router start", step="ROUTER_START", user_info=current_user)
        logic = TrainerLogic()
        return await logic.delete_trainer_course(request, trainer_id, course_id, current_user)

    async def reschedule_trainer_course(
        self,
        request: Request,
        trainer_id: int,
        course_id: int,
        body: schemas.CourseReschedule,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Reschedule trainer course router start", step="ROUTER_START", user_info=current_user)
        logic = TrainerLogic()
        return await logic.reschedule_trainer_course(request, trainer_id, course_id, body, current_user)


class TrainerLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        logger.log_message_sync(message="TrainerLogic instance created")

    async def register_trainer(self, request: Request, payload: schemas.TrainerRegister):
        try:
            with logger.time_operation("REGISTER_TRAINER", request=request):
                db = self.db_driver
                email_clean = payload.email.replace(" ", "").lower()

                if not payload.first_name.strip() or not payload.last_name.strip():
                    raise HTTPException(status_code=400, detail="First name and last name are required.")
                if not payload.specialization.strip():
                    raise HTTPException(status_code=400, detail="Specialization is required.")
                if not payload.sports or len(payload.sports) == 0:
                    raise HTTPException(status_code=400, detail="Select at least one interested sport.")

                existing = db.fetch_one(
                    "SELECT id FROM trainers WHERE LOWER(email) = %s LIMIT 1",
                    (email_clean,)
                )
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
                trainer_id = db.insert("trainers", insert_trainer)
                trainer = db.fetch_one("SELECT * FROM trainers WHERE id = %s", (trainer_id,))
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

    async def login_trainer(self, request: Request, credentials: schemas.TrainerLogin):
        try:
            with logger.time_operation("LOGIN_TRAINER", request=request):
                db = self.db_driver
                email_clean = credentials.email.replace(" ", "").lower()
                trainer = db.fetch_one(
                    "SELECT * FROM trainers WHERE LOWER(email) = %s LIMIT 1",
                    (email_clean,)
                )

                if not trainer:
                    raise HTTPException(status_code=400, detail="Invalid email or password.")
                if not verify_password(credentials.password.strip(), trainer.get("password")):
                    raise HTTPException(status_code=400, detail="Invalid email or password.")

                hashed_pw = trainer.get("password")
                if hashed_pw and not (hashed_pw.startswith("$2b$") or hashed_pw.startswith("$2a$")):
                    new_hash = hash_password(credentials.password.strip())
                    db.execute_query("UPDATE trainers SET password = %s WHERE id = %s", (new_hash, trainer.get("id")))

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

    async def get_trainer_courses(self, request: Request, trainer_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_TRAINER_COURSES", request=request):
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)
                courses = db.fetch_all(
                    "SELECT * FROM courses WHERE trainer_id = %s ORDER BY id DESC",
                    (trainer_id,)
                )
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
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)

                trainer = db.fetch_one("SELECT * FROM trainers WHERE id = %s LIMIT 1", (trainer_id,))
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

                course_id = db.insert("courses", insert_data)
                new_course = db.fetch_one("SELECT * FROM courses WHERE id = %s", (course_id,))
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
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)
                course = db.fetch_one(
                    "SELECT * FROM courses WHERE id = %s AND trainer_id = %s LIMIT 1",
                    (course_id, trainer_id)
                )
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
                    db.execute_query(
                        f"UPDATE courses SET {set_clause} WHERE id = %s AND trainer_id = %s",
                        tuple(values)
                    )

                updated = db.fetch_one(
                    "SELECT * FROM courses WHERE id = %s AND trainer_id = %s",
                    (course_id, trainer_id)
                )
                return serialize_course(updated, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed updating trainer course: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def delete_trainer_course(
        self,
        request: Request,
        trainer_id: int,
        course_id: int,
        current_user: dict
    ):
        try:
            with logger.time_operation("DELETE_TRAINER_COURSE", request=request):
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)
                course = db.fetch_one(
                    "SELECT * FROM courses WHERE id = %s AND trainer_id = %s LIMIT 1",
                    (course_id, trainer_id)
                )
                if not course:
                    raise HTTPException(status_code=404, detail="Training not found or access denied.")

                db.execute_query(
                    "DELETE FROM courses WHERE id = %s AND trainer_id = %s",
                    (course_id, trainer_id)
                )
                return {"message": "Training deleted successfully.", "id": course_id}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed deleting trainer course: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def reschedule_trainer_course(
        self,
        request: Request,
        trainer_id: int,
        course_id: int,
        body: schemas.CourseReschedule,
        current_user: dict
    ):
        try:
            with logger.time_operation("RESCHEDULE_TRAINER_COURSE", request=request):
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)
                course = db.fetch_one(
                    "SELECT * FROM courses WHERE id = %s AND trainer_id = %s LIMIT 1",
                    (course_id, trainer_id)
                )
                if not course:
                    raise HTTPException(status_code=404, detail="Training not found or access denied.")

                reason = (body.reason or "").strip()
                if not reason:
                    raise HTTPException(status_code=400, detail="Reschedule reason is required.")

                new_start = body.start_date if body.start_date is not None else course.get("start_date")
                new_end = body.end_date if body.end_date is not None else course.get("end_date")
                new_schedule = body.schedule if body.schedule is not None else course.get("schedule")
                now = datetime.utcnow()

                db.execute_query(
                    "UPDATE courses SET start_date = %s, end_date = %s, schedule = %s, "
                    "reschedule_reason = %s, rescheduled_at = %s WHERE id = %s AND trainer_id = %s",
                    (new_start, new_end, new_schedule, reason, now, course_id, trainer_id)
                )

                updated = db.fetch_one(
                    "SELECT * FROM courses WHERE id = %s AND trainer_id = %s",
                    (course_id, trainer_id)
                )
                return serialize_course(updated, db)
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed rescheduling trainer course: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
