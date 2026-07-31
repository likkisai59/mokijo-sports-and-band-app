from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks, UploadFile, File, Form, status
from fastapi.responses import RedirectResponse
from typing import List, Optional
import json
import pandas as pd
import io

from app.models import schemas
from sqlalchemy.orm import Session
from app.auth.authorization import check_user_authorization, validate_role_and_permission
from app.logger import logger


from app.api.mokijo.groups import crud

async def create_group(request: Request, db: Session, group: schemas.GroupCreate, current_user: dict):
    try:
        with logger.time_operation("CREATE_GROUP", request=request):
            validate_role_and_permission(db, current_user, ["admin"], group.owner_id)
            insert_data = {
                "activity": group.activity,
                "age_group": group.age_group or "All Ages",
                "group_name": group.group_name,
                "sub_group": group.sub_group,
                "description": group.description,
                "owner_id": group.owner_id
            }
            group_id = crud.create_group(db, insert_data)
            
            # Fetch created group with empty members/events lists
            new_group = crud.get_group_by_id(db, group_id)
            if new_group:
                new_group["members"] = []
                new_group["events"] = []
            return new_group
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to create group: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def import_groups_and_members(request: Request, db: Session, owner_id: int, file: UploadFile, current_user: dict):
    if not file.filename.endswith('.xlsx') and not file.filename.endswith('.xls'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel file.")

    try:
        validate_role_and_permission(db, current_user, ["admin"], owner_id)
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        df = df.where(pd.notnull(df), None)
        records = df.to_dict(orient="records")
        new_groups_count = 0
        new_members_count = 0
        
        group_name_to_id = {}

        for record in records:
            g_name = str(record.get("group_name", "")).strip()
            if not g_name or not record.get("activity") or not record.get("age_group"):
                continue

            if g_name not in group_name_to_id:
                # Check if already exists in DB
                existing_group = crud.get_group_by_name_and_owner(db, g_name, owner_id)
                if existing_group:
                    g_id = existing_group.get("id")
                else:
                    insert_group = {
                        "activity": str(record.get("activity")),
                        "age_group": str(record.get("age_group")),
                        "group_name": g_name,
                        "sub_group": str(record.get("sub_group")) if record.get("sub_group") else None,
                        "description": str(record.get("description")) if record.get("description") else None,
                        "owner_id": owner_id
                    }
                    g_id = crud.create_group(db, insert_group)
                    new_groups_count += 1
                
                group_name_to_id[g_name] = g_id

            target_group_id = group_name_to_id[g_name]

            first_name = record.get("first_name")
            email = record.get("email")

            if first_name and email:
                insert_member = {
                    "group_id": target_group_id,
                    "first_name": str(first_name),
                    "last_name": str(record.get("last_name")) if record.get("last_name") else "",
                    "email": str(email),
                    "phone": str(record.get("phone")) if record.get("phone") else "",
                    "role": str(record.get("role")) if record.get("role") else "Member"
                }
                crud.create_member(db, insert_member)
                new_members_count += 1

        return {
            "message": f"Successfully imported {new_groups_count} groups and {new_members_count} members.",
            "groups_count": new_groups_count,
            "members_count": new_members_count
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed importing groups: {e}")
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

async def get_groups(request: Request, db: Session, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_GROUPS", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member"], owner_id)
            groups = crud.get_groups_by_owner(db, owner_id)
            
            # Fetch members and events for each group to construct GroupResponse
            for g in groups:
                g_id = g.get("id")
                g["members"] = crud.get_members_by_group(db, g_id)
                g["events"] = crud.get_events_by_group(db, g_id)
            return groups
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get groups: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_group(request: Request, db: Session, group_id: str, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_GROUP", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member"], owner_id)
            group = None
            
            if group_id.isdigit():
                group = crud.get_group_by_id_and_owner(db, int(group_id), owner_id)
            
            if not group:
                group = crud.get_group_by_name_and_owner(db, group_id, owner_id)

            if not group:
                raise HTTPException(status_code=404, detail="Group not found or access denied")
            
            g_id = group.get("id")
            group["members"] = crud.get_members_by_group(db, g_id)
            
            events = crud.get_events_by_group(db, g_id)
            # event schema serialization (matching helper or basic structure)
            group["events"] = events
            
            return group
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get group: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def delete_group(request: Request, db: Session, group_id: int, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("DELETE_GROUP", request=request):
            validate_role_and_permission(db, current_user, ["admin"], owner_id)
            group = crud.get_group_by_id_and_owner(db, group_id, owner_id)
            if not group:
                raise HTTPException(status_code=404, detail="Group not found or access denied")
            
            # Execute all updates and deletes in a single transaction to reduce commits & connections
            crud.clean_group_references(db, group_id)
            crud.delete_group(db, group_id)

            return {"message": "Group deleted successfully"}


    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to delete group: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def add_member(request: Request, db: Session, group_id: int, owner_id: int, member: schemas.MemberCreate, current_user: dict):
    try:
        with logger.time_operation("ADD_MEMBER", request=request):
            validate_role_and_permission(db, current_user, ["admin"], owner_id)
            db_group = crud.get_group_by_id_and_owner(db, group_id, owner_id)
            if not db_group:
                raise HTTPException(status_code=404, detail="Group not found or access denied")

            insert_data = {
                "group_id": group_id,
                "first_name": member.first_name,
                "last_name": member.last_name,
                "email": member.email,
                "phone": member.phone,
                "role": member.role
            }
            
            member_id = crud.create_member(db, insert_data)
            new_member = crud.get_member_by_id(db, member_id)
            return new_member
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to add member: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def import_members(request: Request, db: Session, group_id: int, owner_id: int, file: UploadFile, current_user: dict):
    if not file.filename.endswith('.xlsx') and not file.filename.endswith('.xls'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel file.")

    try:
        validate_role_and_permission(db, current_user, ["admin"], owner_id)
        db_group = crud.get_group_by_id_and_owner(db, group_id, owner_id)
        if not db_group:
            raise HTTPException(status_code=404, detail="Group not found or access denied")

        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        df = df.where(pd.notnull(df), None)
        records = df.to_dict(orient="records")

        new_members_count = 0
        for record in records:
            if not record.get("first_name") or not record.get("last_name") or not record.get("email"):
                continue

            insert_data = {
                "group_id": group_id,
                "first_name": str(record.get("first_name")),
                "last_name": str(record.get("last_name")),
                "email": str(record.get("email")),
                "phone": str(record.get("phone")) if record.get("phone") else "",
                "role": str(record.get("role")) if record.get("role") else "Member"
            }
            crud.create_member(db, insert_data)
            new_members_count += 1

        return {"message": f"Successfully imported {new_members_count} members.", "count": new_members_count}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed importing members: {e}")
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

async def get_group_members(request: Request, db: Session, group_id: str, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_GROUP_MEMBERS", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member"], owner_id)
            group = None
            if group_id.isdigit():
                group = crud.get_group_by_id_and_owner(db, int(group_id), owner_id)
            if not group:
                group = crud.get_group_by_name_and_owner(db, group_id, owner_id)
            
            if not group:
                raise HTTPException(status_code=404, detail="Access denied or group not found")

            members = crud.get_members_by_group(db, group.get("id"))
            return members
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get group members: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_all_members(request: Request, db: Session, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_ALL_MEMBERS", request=request):
            validate_role_and_permission(db, current_user, ["admin", "team_member"], owner_id)
            members_and_groups = crud.get_members_by_owner(db, owner_id)
            return [
                {
                    "id": m.get("id"),
                    "group_id": m.get("group_id"),
                    "first_name": m.get("first_name"),
                    "last_name": m.get("last_name"),
                    "email": m.get("email"),
                    "phone": m.get("phone"),
                    "role": m.get("role"),
                    "group_name": m.get("group_name")
                }
                for m in members_and_groups
            ]
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get all members: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def get_member(request: Request, db: Session, member_id: int, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("GET_MEMBER", request=request):
            validate_role_and_permission(db, current_user, ["admin"], owner_id)
            member = crud.get_member_by_id_and_owner(db, member_id, owner_id)
            if not member:
                raise HTTPException(status_code=404, detail="Member not found or access denied")
            return member
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to get member: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def update_member(request: Request, db: Session, member_id: int, owner_id: int, member: schemas.MemberUpdate, current_user: dict):
    try:
        with logger.time_operation("UPDATE_MEMBER", request=request):
            validate_role_and_permission(db, current_user, ["admin"], owner_id)
            existing = crud.get_member_by_id_and_owner(db, member_id, owner_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Member not found or access denied")

            update_data = member.dict(exclude_unset=True)
            update_data = {k: v for k, v in update_data.items() if v is not None}

            if "first_name" in update_data and not update_data["first_name"].strip():
                raise HTTPException(status_code=400, detail="First name is required")

            if update_data:
                set_clauses = []
                params = []
                for key, val in update_data.items():
                    set_clauses.append(f"{key} = %s")
                    params.append(val)
                params.append(member_id)
                crud.update_member(db, member_id, update_data)

            updated = crud.get_member_by_id_and_owner(db, member_id, owner_id)
            return updated
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to update member: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def delete_member(request: Request, db: Session, member_id: int, owner_id: int, current_user: dict):
    try:
        with logger.time_operation("DELETE_MEMBER", request=request):
            validate_role_and_permission(db, current_user, ["admin"], owner_id)
            existing = crud.get_member_by_id_and_owner(db, member_id, owner_id)
            if not existing:
                raise HTTPException(status_code=404, detail="Member not found or access denied")

            crud.clean_member_references(db, member_id)
            crud.delete_member(db, member_id)

            return {"message": "Member deleted successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        await logger.log_error(request=request, message=f"Failed to delete member: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
