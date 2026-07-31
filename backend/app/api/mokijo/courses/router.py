from fastapi import APIRouter, Depends, Request
from typing import List, Optional

from app.models import schemas
from app.api.mokijo.courses import service
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.authorization import check_user_authorization

router = APIRouter()

@router.get("/courses/summary", summary="Retrieve a summary of course registration counts and active course revenue.", tags=["Courses"])
async def get_courses_summary(
    request: Request,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_courses_summary(request, db, owner_id, current_user)

@router.get("/courses/trainer-trainings", response_model=List[schemas.CourseResponse], summary="Discover independent trainings created by platform trainers.", tags=["Courses"])
async def get_trainer_trainings(
    request: Request,
    owner_id: Optional[int] = None,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_trainer_trainings(request, db, owner_id, current_user)

@router.get("/courses/trainer-trainings/{course_id}", response_model=schemas.TrainerTrainingDetailResponse, summary="Get a single trainer-owned training with public trainer profile.", tags=["Courses"])
async def get_trainer_training_detail(
    request: Request,
    course_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_trainer_training_detail(request, db, course_id, current_user)

@router.post("/courses/trainer-trainings/{course_id}/enroll/order", response_model=schemas.TrainingEnrollOrderResponse, summary="Register for a trainer training and create a Razorpay order (or free enroll).", tags=["Courses"])
async def create_trainer_training_enroll_order(
    request: Request,
    course_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.create_trainer_training_enroll_order(request, db, course_id, current_user)

@router.post("/courses/trainer-trainings/{course_id}/enroll/verify", response_model=schemas.CourseRegistrationResponse, summary="Verify Razorpay payment for a trainer training enrollment.", tags=["Courses"])
async def verify_trainer_training_enroll_payment(
    request: Request,
    course_id: int,
    verification: schemas.TrainingEnrollVerifyRequest,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.verify_trainer_training_enroll_payment(request, db, course_id, verification, current_user)

@router.get("/users/{user_id}/training-registrations", response_model=List[schemas.UserTrainingRegistrationResponse], summary="List trainer trainings the user has registered for.", tags=["Courses"])
async def get_user_training_registrations(
    request: Request,
    user_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_user_training_registrations(request, db, user_id, current_user)

@router.get("/courses", response_model=List[schemas.CourseResponse], summary="Retrieve all courses, optionally filtered by status, group, or member registration email.", tags=["Courses"])
async def get_courses(
    request: Request,
    owner_id: int,
    status: str = "all",
    group_id: Optional[int] = None,
    member_email: Optional[str] = None,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_courses(request, db, owner_id, status, group_id, member_email, current_user)

@router.post("/courses", response_model=schemas.CourseResponse, summary="Create a new course with specific capacity, fee, schedule, and level details.", tags=["Courses"])
async def create_course(
    request: Request,
    course: schemas.CourseCreate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.create_course(request, db, course, current_user)

@router.get("/courses/{course_id}", response_model=schemas.CourseResponse, summary="Retrieve details of a specific course.", tags=["Courses"])
async def get_course(
    request: Request,
    course_id: int,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_course(request, db, course_id, owner_id, current_user)

@router.put("/courses/{course_id}", response_model=schemas.CourseResponse, summary="Update the configuration and details of an existing course.", tags=["Courses"])
async def update_course(
    request: Request,
    course_id: int,
    owner_id: int,
    course_update: schemas.CourseUpdate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.update_course(request, db, course_id, owner_id, course_update, current_user)

@router.delete("/courses/{course_id}", summary="Delete an existing course from the system.", tags=["Courses"])
async def delete_course(
    request: Request,
    course_id: int,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.delete_course(request, db, course_id, owner_id, current_user)

@router.get("/courses/{course_id}/registrations", response_model=List[schemas.CourseRegistrationResponse], summary="Retrieve all member registrations for a specific course.", tags=["Courses"])
async def get_course_registrations(
    request: Request,
    course_id: int,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_course_registrations(request, db, course_id, owner_id, current_user)

@router.post("/courses/{course_id}/registrations", response_model=schemas.CourseRegistrationResponse, summary="Register a club member or guest participant for a specific course.", tags=["Courses"])
async def create_course_registration(
    request: Request,
    course_id: int,
    registration: schemas.CourseRegistrationCreate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.create_course_registration(request, db, course_id, registration, current_user)

@router.put("/course-registrations/{registration_id}", response_model=schemas.CourseRegistrationResponse, summary="Update the status or notes of an existing course registration.", tags=["Courses"])
async def update_course_registration(
    request: Request,
    registration_id: int,
    owner_id: int,
    registration_update: schemas.CourseRegistrationUpdate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.update_course_registration(request, db, registration_id, owner_id, registration_update, current_user)

@router.delete("/course-registrations/{registration_id}", summary="Cancel and delete an existing course registration.", tags=["Courses"])
async def delete_course_registration(
    request: Request,
    registration_id: int,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.delete_course_registration(request, db, registration_id, owner_id, current_user)
