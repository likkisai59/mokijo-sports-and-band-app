import json

from fastapi import Depends, HTTPException, Request

from app.models import schemas
from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization, validate_role_and_permission
from app.core.security import hash_password, verify_password, create_access_token
from app.core.helpers import serialize_course, serialize_course_registration
from app.logger import logger


SPORTS_LIST = [
    "Tennis",
    "Cricket",
    "Football (Soccer)",
    "Basketball",
    "Badminton",
    "Swimming",
]


def ensure_trainer_schema(db):
    """Apply additive schema changes safely for existing databases."""
    statements = [
        """
        CREATE TABLE IF NOT EXISTS trainers (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR NOT NULL,
            last_name VARCHAR NOT NULL,
            dob VARCHAR,
            gender VARCHAR,
            email VARCHAR UNIQUE NOT NULL,
            phone VARCHAR NOT NULL,
            aadhar_number VARCHAR,
            experience_years INTEGER,
            sports TEXT,
            password VARCHAR NOT NULL,
            is_verified BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        "ALTER TABLE courses ALTER COLUMN owner_id DROP NOT NULL",
        "ALTER TABLE courses ADD COLUMN IF NOT EXISTS trainer_id INTEGER REFERENCES trainers(id)",
        "ALTER TABLE courses ADD COLUMN IF NOT EXISTS reschedule_reason VARCHAR",
        "ALTER TABLE courses ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMP",
        "ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_image TEXT",
        "ALTER TABLE course_registrations ALTER COLUMN owner_id DROP NOT NULL",
        "ALTER TABLE course_registrations ADD COLUMN IF NOT EXISTS trainer_id INTEGER REFERENCES trainers(id)",
        "ALTER TABLE course_registrations ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)",
    ]
    for stmt in statements:
        try:
            db.execute_query(stmt)
        except Exception:
            # Column/table may already exist or dialect may differ slightly
            pass


class TrainerRouting(ConnectionService):
    def __init__(self) -> None:
        super().__init__()

        self.router.add_api_route(
            path="/trainer/register",
            endpoint=self.register_trainer,
            methods=["POST"],
            summary="Register a new trainer account.",
            tags=["Trainer"],
        )
        self.router.add_api_route(
            path="/trainer/login",
            endpoint=self.login_trainer,
            methods=["POST"],
            summary="Authenticate a trainer.",
            tags=["Trainer"],
        )
        self.router.add_api_route(
            path="/trainer/{trainer_id}/courses",
            endpoint=self.list_trainer_courses,
            methods=["GET"],
            summary="List trainings created by a trainer.",
            tags=["Trainer"],
        )
        self.router.add_api_route(
            path="/trainer/{trainer_id}/courses",
            endpoint=self.create_trainer_course,
            methods=["POST"],
            summary="Create a training owned by a trainer.",
            tags=["Trainer"],
        )
        self.router.add_api_route(
            path="/trainer/{trainer_id}/courses/{course_id}",
            endpoint=self.update_trainer_course,
            methods=["PUT"],
            summary="Update a trainer-owned training.",
            tags=["Trainer"],
        )
        self.router.add_api_route(
            path="/trainer/{trainer_id}/courses/{course_id}",
            endpoint=self.delete_trainer_course,
            methods=["DELETE"],
            summary="Delete a trainer-owned training.",
            tags=["Trainer"],
        )
        self.router.add_api_route(
            path="/trainer/{trainer_id}/stats",
            endpoint=self.get_trainer_stats,
            methods=["GET"],
            summary="Dashboard stats for a trainer.",
            tags=["Trainer"],
        )
        self.router.add_api_route(
            path="/trainer/{trainer_id}/candidates",
            endpoint=self.list_trainer_candidates,
            methods=["GET"],
            summary="List registered candidates across trainer trainings.",
            tags=["Trainer"],
        )
        self.router.add_api_route(
            path="/trainings/public",
            endpoint=self.list_public_trainings,
            methods=["GET"],
            summary="List open trainer trainings visible to all roles.",
            tags=["Trainer"],
        )
        self.router.add_api_route(
            path="/trainings/{course_id}",
            endpoint=self.get_public_training,
            methods=["GET"],
            summary="Get a single open trainer training.",
            tags=["Trainer"],
        )
        self.router.add_api_route(
            path="/trainings/{course_id}/register",
            endpoint=self.register_for_training,
            methods=["POST"],
            summary="Register the current user/member for a trainer training.",
            tags=["Trainer"],
        )
        self.router.add_api_route(
            path="/trainings/{course_id}/my-registration",
            endpoint=self.get_my_registration,
            methods=["GET"],
            summary="Get current user's registration for a training.",
            tags=["Trainer"],
        )
        self.router.add_api_route(
            path="/trainings/payments/create",
            endpoint=self.create_training_payment,
            methods=["POST"],
            summary="Create a payment request for a training registration (Razorpay).",
            tags=["Trainer"],
        )

    async def register_trainer(self, request: Request, payload: schemas.TrainerRegister):
        logic = TrainerLogic()
        return await logic.register_trainer(request, payload)

    async def login_trainer(self, request: Request, credentials: schemas.TrainerLogin):
        logic = TrainerLogic()
        return await logic.login_trainer(request, credentials)

    async def list_trainer_courses(
        self, request: Request, trainer_id: int, current_user: dict = Depends(check_user_authorization)
    ):
        logic = TrainerLogic()
        return await logic.list_trainer_courses(request, trainer_id, current_user)

    async def create_trainer_course(
        self,
        request: Request,
        trainer_id: int,
        payload: schemas.TrainerTrainingCreate,
        current_user: dict = Depends(check_user_authorization),
    ):
        logic = TrainerLogic()
        return await logic.create_trainer_course(request, trainer_id, payload, current_user)

    async def update_trainer_course(
        self,
        request: Request,
        trainer_id: int,
        course_id: int,
        payload: schemas.TrainerTrainingUpdate,
        current_user: dict = Depends(check_user_authorization),
    ):
        logic = TrainerLogic()
        return await logic.update_trainer_course(request, trainer_id, course_id, payload, current_user)

    async def delete_trainer_course(
        self,
        request: Request,
        trainer_id: int,
        course_id: int,
        current_user: dict = Depends(check_user_authorization),
    ):
        logic = TrainerLogic()
        return await logic.delete_trainer_course(request, trainer_id, course_id, current_user)

    async def get_trainer_stats(
        self, request: Request, trainer_id: int, current_user: dict = Depends(check_user_authorization)
    ):
        logic = TrainerLogic()
        return await logic.get_trainer_stats(request, trainer_id, current_user)

    async def list_trainer_candidates(
        self, request: Request, trainer_id: int, current_user: dict = Depends(check_user_authorization)
    ):
        logic = TrainerLogic()
        return await logic.list_trainer_candidates(request, trainer_id, current_user)

    async def list_public_trainings(
        self, request: Request, current_user: dict = Depends(check_user_authorization)
    ):
        logic = TrainerLogic()
        return await logic.list_public_trainings(request, current_user)

    async def get_public_training(
        self, request: Request, course_id: int, current_user: dict = Depends(check_user_authorization)
    ):
        logic = TrainerLogic()
        return await logic.get_public_training(request, course_id, current_user)

    async def register_for_training(
        self,
        request: Request,
        course_id: int,
        payload: schemas.PublicTrainingRegister,
        current_user: dict = Depends(check_user_authorization),
    ):
        logic = TrainerLogic()
        return await logic.register_for_training(request, course_id, payload, current_user)

    async def get_my_registration(
        self, request: Request, course_id: int, current_user: dict = Depends(check_user_authorization)
    ):
        logic = TrainerLogic()
        return await logic.get_my_registration(request, course_id, current_user)

    async def create_training_payment(
        self,
        request: Request,
        payload: schemas.TrainingPaymentCreate,
        current_user: dict = Depends(check_user_authorization),
    ):
        logic = TrainerLogic()
        return await logic.create_training_payment(request, payload, current_user)


class TrainerLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        ensure_trainer_schema(self.db_driver)

    async def register_trainer(self, request: Request, payload: schemas.TrainerRegister):
        try:
            with logger.time_operation("REGISTER_TRAINER", request=request):
                db = self.db_driver
                ensure_trainer_schema(db)
                email_clean = payload.email.replace(" ", "").lower()

                existing = db.fetch_one(
                    "SELECT id FROM trainers WHERE LOWER(email) = %s LIMIT 1",
                    (email_clean,),
                )
                if existing:
                    raise HTTPException(status_code=400, detail="Email already registered as a trainer.")

                sports = payload.sports or []
                if not sports:
                    raise HTTPException(status_code=400, detail="Select at least one sport.")

                insert_data = {
                    "first_name": payload.first_name.strip(),
                    "last_name": payload.last_name.strip(),
                    "dob": payload.dob,
                    "gender": payload.gender,
                    "email": email_clean,
                    "phone": payload.phone.strip(),
                    "aadhar_number": payload.aadhar_number,
                    "experience_years": payload.experience_years,
                    "sports": json.dumps(sports),
                    "password": hash_password(payload.password.strip()),
                    "is_verified": True,
                }
                trainer_id = db.insert("trainers", insert_data)
                trainer = db.fetch_one("SELECT * FROM trainers WHERE id = %s", (trainer_id,))
                return {
                    "message": "Trainer registered successfully. Please sign in.",
                    "trainerId": trainer.get("id"),
                    "trainerName": f"{trainer.get('first_name')} {trainer.get('last_name')}".strip(),
                }
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to register trainer: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def login_trainer(self, request: Request, credentials: schemas.TrainerLogin):
        try:
            with logger.time_operation("LOGIN_TRAINER", request=request):
                db = self.db_driver
                ensure_trainer_schema(db)
                email_clean = credentials.email.replace(" ", "").lower()
                trainer = db.fetch_one(
                    "SELECT * FROM trainers WHERE LOWER(email) = %s LIMIT 1",
                    (email_clean,),
                )
                if not trainer or not verify_password(credentials.password.strip(), trainer.get("password")):
                    raise HTTPException(status_code=400, detail="Invalid email or password.")

                hashed_pw = trainer.get("password")
                if hashed_pw and not (hashed_pw.startswith("$2b$") or hashed_pw.startswith("$2a$")):
                    new_hash = hash_password(credentials.password.strip())
                    db.execute_query(
                        "UPDATE trainers SET password = %s WHERE id = %s",
                        (new_hash, trainer.get("id")),
                    )

                access_token = create_access_token({"sub": str(trainer.get("id")), "role": "trainer"})
                return {
                    "message": "Login successful",
                    "trainerId": trainer.get("id"),
                    "trainerName": f"{trainer.get('first_name')} {trainer.get('last_name')}".strip(),
                    "trainerEmail": trainer.get("email"),
                    "isTrainer": True,
                    "access_token": access_token,
                    "token_type": "bearer",
                }
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed trainer login: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def list_trainer_courses(self, request: Request, trainer_id: int, current_user: dict):
        try:
            with logger.time_operation("LIST_TRAINER_COURSES", request=request):
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)
                courses = db.fetch_all(
                    "SELECT * FROM courses WHERE trainer_id = %s ORDER BY id DESC",
                    (trainer_id,),
                )
                return [serialize_course(c, db) for c in courses]
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to list trainer courses: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def create_trainer_course(
        self, request: Request, trainer_id: int, payload: schemas.TrainerTrainingCreate, current_user: dict
    ):
        try:
            with logger.time_operation("CREATE_TRAINER_COURSE", request=request):
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)
                trainer = db.fetch_one("SELECT * FROM trainers WHERE id = %s", (trainer_id,))
                if not trainer:
                    raise HTTPException(status_code=404, detail="Trainer not found")

                instructor = f"{trainer.get('first_name')} {trainer.get('last_name')}".strip()
                insert_data = {
                    "owner_id": None,
                    "trainer_id": trainer_id,
                    "group_id": None,
                    "title": payload.title.strip(),
                    "code": None,
                    "category": payload.category or "Training",
                    "level": payload.level,
                    "description": payload.description,
                    "instructor": instructor,
                    "start_date": payload.start_date,
                    "end_date": payload.end_date,
                    "schedule": payload.schedule,
                    "location": payload.location,
                    "capacity": payload.capacity if payload.capacity is not None else 20,
                    "fee": payload.fee if payload.fee is not None else 0,
                    "status": payload.status or "open",
                    "cover_image": payload.cover_image,
                }
                course_id = db.insert("courses", insert_data)
                course = db.fetch_one("SELECT * FROM courses WHERE id = %s", (course_id,))
                return serialize_course(course, db)
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to create trainer course: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def update_trainer_course(
        self,
        request: Request,
        trainer_id: int,
        course_id: int,
        payload: schemas.TrainerTrainingUpdate,
        current_user: dict,
    ):
        try:
            with logger.time_operation("UPDATE_TRAINER_COURSE", request=request):
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)
                course = db.fetch_one(
                    "SELECT * FROM courses WHERE id = %s AND trainer_id = %s",
                    (course_id, trainer_id),
                )
                if not course:
                    raise HTTPException(status_code=404, detail="Training not found")

                update_data = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
                if update_data:
                    sets = ", ".join([f"{k} = %s" for k in update_data.keys()])
                    db.execute_query(
                        f"UPDATE courses SET {sets} WHERE id = %s AND trainer_id = %s",
                        (*update_data.values(), course_id, trainer_id),
                    )
                updated = db.fetch_one("SELECT * FROM courses WHERE id = %s", (course_id,))
                return serialize_course(updated, db)
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to update trainer course: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def delete_trainer_course(self, request: Request, trainer_id: int, course_id: int, current_user: dict):
        try:
            with logger.time_operation("DELETE_TRAINER_COURSE", request=request):
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)
                course = db.fetch_one(
                    "SELECT * FROM courses WHERE id = %s AND trainer_id = %s",
                    (course_id, trainer_id),
                )
                if not course:
                    raise HTTPException(status_code=404, detail="Training not found")
                db.execute_query("DELETE FROM course_registrations WHERE course_id = %s", (course_id,))
                db.execute_query("DELETE FROM courses WHERE id = %s", (course_id,))
                return {"message": "Training deleted successfully"}
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to delete trainer course: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_trainer_stats(self, request: Request, trainer_id: int, current_user: dict):
        try:
            with logger.time_operation("TRAINER_STATS", request=request):
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)
                courses = db.fetch_all("SELECT * FROM courses WHERE trainer_id = %s", (trainer_id,))
                course_ids = [c.get("id") for c in courses]
                total_registered = 0
                seats_left = 0
                open_count = 0
                if course_ids:
                    placeholders = ", ".join(["%s"] * len(course_ids))
                    regs = db.fetch_all(
                        f"SELECT * FROM course_registrations WHERE course_id IN ({placeholders}) AND status != 'cancelled'",
                        tuple(course_ids),
                    )
                    # Count only confirmed candidates (paid, or waived for free trainings)
                    total_registered = len(
                        [
                            r
                            for r in regs
                            if r.get("payment_status") in ("paid", "waived")
                        ]
                    )
                    for c in courses:
                        capacity = c.get("capacity") or 0
                        count = len(
                            [
                                r
                                for r in regs
                                if r.get("course_id") == c.get("id")
                                and r.get("payment_status") in ("paid", "waived")
                            ]
                        )
                        seats_left += max(capacity - count, 0)
                        if (c.get("status") or "open") == "open":
                            open_count += 1
                return {
                    "total_trainings": len(courses),
                    "open_trainings": open_count,
                    "total_registered": total_registered,
                    "seats_left": seats_left,
                }
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed trainer stats: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def list_trainer_candidates(self, request: Request, trainer_id: int, current_user: dict):
        try:
            with logger.time_operation("TRAINER_CANDIDATES", request=request):
                db = self.db_driver
                validate_role_and_permission(db, current_user, ["trainer"], trainer_id)
                regs = db.fetch_all(
                    """
                    SELECT r.* FROM course_registrations r
                    JOIN courses c ON c.id = r.course_id
                    WHERE c.trainer_id = %s
                    ORDER BY r.registered_at DESC NULLS LAST, r.id DESC
                    """,
                    (trainer_id,),
                )
                return [serialize_course_registration(r, db) for r in regs]
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed trainer candidates: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def list_public_trainings(self, request: Request, current_user: dict):
        try:
            with logger.time_operation("PUBLIC_TRAININGS", request=request):
                db = self.db_driver
                role = current_user.get("role")
                if role not in ("admin", "club_admin", "user", "team_member"):
                    raise HTTPException(status_code=403, detail="Access denied.")
                courses = db.fetch_all(
                    """
                    SELECT * FROM courses
                    WHERE trainer_id IS NOT NULL
                      AND COALESCE(status, 'open') IN ('open', 'full')
                    ORDER BY id DESC
                    """
                )
                return [serialize_course(c, db) for c in courses]
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed public trainings: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_public_training(self, request: Request, course_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_PUBLIC_TRAINING", request=request):
                db = self.db_driver
                role = current_user.get("role")
                if role not in ("admin", "club_admin", "user", "team_member", "trainer"):
                    raise HTTPException(status_code=403, detail="Access denied.")
                course = db.fetch_one(
                    "SELECT * FROM courses WHERE id = %s AND trainer_id IS NOT NULL",
                    (course_id,),
                )
                if not course:
                    raise HTTPException(status_code=404, detail="Training not found")
                return serialize_course(course, db)
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed get training: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    def _resolve_participant(self, db, current_user: dict, payload: schemas.PublicTrainingRegister):
        role = current_user.get("role")
        user_id = current_user.get("id")
        member_id = None
        payment_owner_id = None
        name = (payload.participant_name or "").strip()
        email = (payload.participant_email or "").strip().lower() or None
        phone = (payload.participant_phone or "").strip() or None

        if role == "team_member":
            member = db.fetch_one("SELECT * FROM members WHERE id = %s", (user_id,))
            if not member:
                raise HTTPException(status_code=404, detail="Member profile not found")
            member_id = member.get("id")
            name = name or f"{member.get('first_name') or ''} {member.get('last_name') or ''}".strip()
            email = email or (member.get("email") or "").lower() or None
            phone = phone or member.get("phone")
            group = db.fetch_one("SELECT owner_id FROM groups WHERE id = %s", (member.get("group_id"),))
            if not group:
                raise HTTPException(status_code=400, detail="Member is not assigned to a club.")
            payment_owner_id = group.get("owner_id")
        elif role in ("admin", "club_admin", "user"):
            user = db.fetch_one("SELECT * FROM users WHERE id = %s", (user_id,))
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            name = name or f"{user.get('first_name') or ''} {user.get('last_name') or ''}".strip() or user.get("email")
            email = email or (user.get("email") or "").lower() or None
            phone = phone or user.get("phone")
            payment_owner_id = user_id
        else:
            raise HTTPException(status_code=403, detail="This role cannot register for trainings.")

        if not name:
            raise HTTPException(status_code=400, detail="Participant name is required.")

        return {
            "member_id": member_id,
            "user_id": user_id if role != "team_member" else None,
            "payment_owner_id": payment_owner_id,
            "participant_name": name,
            "participant_email": email,
            "participant_phone": phone,
        }

    async def register_for_training(
        self, request: Request, course_id: int, payload: schemas.PublicTrainingRegister, current_user: dict
    ):
        try:
            with logger.time_operation("REGISTER_FOR_TRAINING", request=request):
                db = self.db_driver
                course = db.fetch_one(
                    "SELECT * FROM courses WHERE id = %s AND trainer_id IS NOT NULL",
                    (course_id,),
                )
                if not course:
                    raise HTTPException(status_code=404, detail="Training not found")
                if (course.get("status") or "open") not in ("open", "full"):
                    raise HTTPException(status_code=400, detail="This training is not open for registration.")

                participant = self._resolve_participant(db, current_user, payload)

                # Prevent duplicate registrations
                if participant["member_id"]:
                    existing = db.fetch_one(
                        "SELECT * FROM course_registrations WHERE course_id = %s AND member_id = %s AND status != 'cancelled'",
                        (course_id, participant["member_id"]),
                    )
                elif participant["user_id"]:
                    existing = db.fetch_one(
                        "SELECT * FROM course_registrations WHERE course_id = %s AND user_id = %s AND status != 'cancelled'",
                        (course_id, participant["user_id"]),
                    )
                else:
                    existing = None

                if existing:
                    return serialize_course_registration(existing, db)

                reg_count = db.fetch_one(
                    "SELECT COUNT(*) as count FROM course_registrations WHERE course_id = %s AND status != 'cancelled'",
                    (course_id,),
                )
                capacity = course.get("capacity") or 0
                count = (reg_count or {}).get("count", 0)
                if capacity and count >= capacity:
                    raise HTTPException(status_code=400, detail="This training is full.")

                fee = course.get("fee") or 0
                payment_status = "waived" if fee <= 0 else "unpaid"

                insert_data = {
                    "owner_id": None,
                    "trainer_id": course.get("trainer_id"),
                    "course_id": course_id,
                    "member_id": participant["member_id"],
                    "user_id": participant["user_id"],
                    "participant_name": participant["participant_name"],
                    "participant_email": participant["participant_email"],
                    "participant_phone": participant["participant_phone"],
                    "status": "registered",
                    "payment_status": payment_status,
                    "notes": None,
                }
                reg_id = db.insert("course_registrations", insert_data)
                registration = db.fetch_one("SELECT * FROM course_registrations WHERE id = %s", (reg_id,))
                return serialize_course_registration(registration, db)
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed training registration: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_my_registration(self, request: Request, course_id: int, current_user: dict):
        try:
            with logger.time_operation("MY_TRAINING_REG", request=request):
                db = self.db_driver
                role = current_user.get("role")
                user_id = current_user.get("id")
                if role == "team_member":
                    registration = db.fetch_one(
                        "SELECT * FROM course_registrations WHERE course_id = %s AND member_id = %s AND status != 'cancelled' ORDER BY id DESC LIMIT 1",
                        (course_id, user_id),
                    )
                elif role in ("admin", "club_admin", "user"):
                    registration = db.fetch_one(
                        "SELECT * FROM course_registrations WHERE course_id = %s AND user_id = %s AND status != 'cancelled' ORDER BY id DESC LIMIT 1",
                        (course_id, user_id),
                    )
                else:
                    raise HTTPException(status_code=403, detail="Access denied.")
                if not registration:
                    return None
                return serialize_course_registration(registration, db)
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed get my registration: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def create_training_payment(
        self, request: Request, payload: schemas.TrainingPaymentCreate, current_user: dict
    ):
        try:
            with logger.time_operation("TRAINING_PAYMENT_CREATE", request=request):
                db = self.db_driver
                role = current_user.get("role")
                if role not in ("admin", "club_admin", "user", "team_member"):
                    raise HTTPException(status_code=403, detail="Access denied.")

                registration = db.fetch_one(
                    "SELECT * FROM course_registrations WHERE id = %s",
                    (payload.registration_id,),
                )
                if not registration:
                    raise HTTPException(status_code=404, detail="Registration not found")

                # Ownership check
                user_id = current_user.get("id")
                if role == "team_member" and registration.get("member_id") != user_id:
                    raise HTTPException(status_code=403, detail="Not your registration.")
                if role in ("admin", "club_admin", "user") and registration.get("user_id") != user_id:
                    raise HTTPException(status_code=403, detail="Not your registration.")

                if registration.get("payment_status") == "paid":
                    raise HTTPException(status_code=400, detail="Already paid.")

                course = db.fetch_one("SELECT * FROM courses WHERE id = %s", (registration.get("course_id"),))
                if not course or not course.get("trainer_id"):
                    raise HTTPException(status_code=404, detail="Training not found")

                fee = course.get("fee") or 0
                if fee <= 0:
                    raise HTTPException(status_code=400, detail="This training has no fee.")

                participant = self._resolve_participant(
                    db,
                    current_user,
                    schemas.PublicTrainingRegister(
                        participant_name=registration.get("participant_name"),
                        participant_email=registration.get("participant_email"),
                        participant_phone=registration.get("participant_phone"),
                    ),
                )

                insert_data = {
                    "owner_id": participant["payment_owner_id"],
                    "group_id": None,
                    "member_id": participant["member_id"],
                    "title": f"Training Fee: {course.get('title')}",
                    "description": f"course_registration_id:{registration.get('id')}|course_id:{course.get('id')}",
                    "category": "Training Fee",
                    "amount": fee,
                    "due_date": None,
                    "status": "pending",
                    "payment_method": None,
                    "paid_at": None,
                }
                payment_id = db.insert("payments", insert_data)
                payment = db.fetch_one("SELECT * FROM payments WHERE id = %s", (payment_id,))
                return {
                    "id": payment.get("id"),
                    "owner_id": payment.get("owner_id"),
                    "title": payment.get("title"),
                    "amount": payment.get("amount"),
                    "status": payment.get("status"),
                    "description": payment.get("description"),
                    "category": payment.get("category"),
                }
        except HTTPException:
            raise
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed training payment create: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
