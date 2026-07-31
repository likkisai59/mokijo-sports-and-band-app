from fastapi import APIRouter, Depends, Request
from typing import List, Optional

from app.models import schemas
from app.api.mokijo.trainer import service
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.authorization import check_user_authorization

router = APIRouter()

@router.post("/trainer/register", summary="Register a new independent trainer account.", tags=["Trainer"])
async def register_trainer(
    request: Request,
    payload: schemas.TrainerRegister
,
    db: Session = Depends(get_db)
):
    return await service.register_trainer(request, db, payload)

@router.post("/trainer/login", summary="Authenticate a trainer.", tags=["Trainer"])
async def login_trainer(
    request: Request,
    credentials: schemas.TrainerLogin
,
    db: Session = Depends(get_db)
):
    return await service.login_trainer(request, db, credentials)

@router.get("/trainer/{trainer_id}/courses", response_model=List[schemas.CourseResponse], summary="List all trainings created by this trainer.", tags=["Trainer"])
async def get_trainer_courses(
    request: Request,
    trainer_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_trainer_courses(request, db, trainer_id, current_user)

@router.post("/trainer/{trainer_id}/courses", response_model=schemas.CourseResponse, summary="Create a new training owned by this trainer.", tags=["Trainer"])
async def create_trainer_course(
    request: Request,
    trainer_id: int,
    course: schemas.CourseCreate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.create_trainer_course(request, db, trainer_id, course, current_user)

@router.put("/trainer/{trainer_id}/courses/{course_id}", response_model=schemas.CourseResponse, summary="Update a training owned by this trainer.", tags=["Trainer"])
async def update_trainer_course(
    request: Request,
    trainer_id: int,
    course_id: int,
    course_update: schemas.CourseUpdate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.update_trainer_course(request, db, trainer_id, course_id, course_update, current_user)

@router.delete("/trainer/{trainer_id}/courses/{course_id}", summary="Delete a training owned by this trainer.", tags=["Trainer"])
async def delete_trainer_course(
    request: Request,
    trainer_id: int,
    course_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.delete_trainer_course(request, db, trainer_id, course_id, current_user)

@router.post("/trainer/{trainer_id}/courses/{course_id}/reschedule", response_model=schemas.CourseResponse, summary="Reschedule a training (rain or any reason).", tags=["Trainer"])
async def reschedule_trainer_course(
    request: Request,
    trainer_id: int,
    course_id: int,
    body: schemas.CourseReschedule,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.reschedule_trainer_course(request, db, trainer_id, course_id, body, current_user)

@router.get("/trainer/{trainer_id}/registrations", response_model=List[schemas.CourseRegistrationResponse], summary="List all registrations across this trainer's trainings (optional course_id filter).", tags=["Trainer"])
async def get_trainer_registrations(
    request: Request,
    trainer_id: int,
    course_id: Optional[int] = None,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_trainer_registrations(request, db, trainer_id, current_user, course_id)

@router.get("/trainer/{trainer_id}/courses/{course_id}/registrations", response_model=List[schemas.CourseRegistrationResponse], summary="List registrations for one training owned by this trainer.", tags=["Trainer"])
async def get_trainer_course_registrations(
    request: Request,
    trainer_id: int,
    course_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_trainer_registrations(request, db, trainer_id, current_user, course_id)
