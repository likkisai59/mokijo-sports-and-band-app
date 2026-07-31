from fastapi import APIRouter, Depends, Request, UploadFile, File, Form
from typing import List

from app.models import schemas
from app.api.mokijo.groups import service
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.authorization import check_user_authorization

router = APIRouter()

@router.post("/groups", response_model=schemas.GroupResponse, summary="Create a new club group/team with custom activity type.", tags=["Groups"])
async def create_group(
    request: Request,
    group: schemas.GroupCreate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.create_group(request, db, group, current_user)

@router.post("/groups/import", summary="Import groups and members from an uploaded Excel file.", tags=["Groups"])
async def import_groups_and_members(
    request: Request,
    owner_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.import_groups_and_members(request, db, owner_id, file, current_user)

@router.get("/groups", response_model=List[schemas.GroupResponse], summary="Retrieve all club groups/teams owned by the club administrator.", tags=["Groups"])
async def get_groups(
    request: Request,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_groups(request, db, owner_id, current_user)

@router.get("/groups/{group_id}", response_model=schemas.GroupResponse, summary="Retrieve a specific club group/team by ID or group name.", tags=["Groups"])
async def get_group(
    request: Request,
    group_id: str,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_group(request, db, group_id, owner_id, current_user)

@router.delete("/groups/{group_id}", summary="Delete a specific club group/team and all its associated data.", tags=["Groups"])
async def delete_group(
    request: Request,
    group_id: int,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.delete_group(request, db, group_id, owner_id, current_user)

@router.post("/groups/{group_id}/members", response_model=schemas.MemberResponse, summary="Add a new member to a specific club group/team.", tags=["Groups"])
async def add_member(
    request: Request,
    group_id: int,
    owner_id: int,
    member: schemas.MemberCreate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.add_member(request, db, group_id, owner_id, member, current_user)

@router.post("/groups/{group_id}/members/import", summary="Import members into a specific group from an uploaded Excel file.", tags=["Groups"])
async def import_members(
    request: Request,
    group_id: int,
    owner_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.import_members(request, db, group_id, owner_id, file, current_user)

@router.get("/groups/{group_id}/members", response_model=List[schemas.MemberResponse], summary="Retrieve all members of a specific club group/team.", tags=["Groups"])
async def get_group_members(
    request: Request,
    group_id: str,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_group_members(request, db, group_id, owner_id, current_user)

@router.get("/members", summary="Retrieve all members across all groups for the given club administrator.", tags=["Groups"])
async def get_all_members(
    request: Request,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_all_members(request, db, owner_id, current_user)

@router.get("/members/{member_id}", summary="Retrieve a single member by ID, scoped to the requesting club administrator.", tags=["Groups"])
async def get_member(
    request: Request,
    member_id: int,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.get_member(request, db, member_id, owner_id, current_user)

@router.put("/members/{member_id}", summary="Update a single member's profile fields.", tags=["Groups"])
async def update_member(
    request: Request,
    member_id: int,
    owner_id: int,
    member_update: schemas.MemberUpdate,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.update_member(request, db, member_id, owner_id, member_update, current_user)

@router.delete("/members/{member_id}", summary="Delete a single member and clear references to it in dependent tables.", tags=["Groups"])
async def delete_member(
    request: Request,
    member_id: int,
    owner_id: int,
    current_user: dict = Depends(check_user_authorization),
    db: Session = Depends(get_db)
):
    return await service.delete_member(request, db, member_id, owner_id, current_user)
