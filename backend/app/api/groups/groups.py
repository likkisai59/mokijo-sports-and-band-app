from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks, UploadFile, File, Form, status
from fastapi.responses import RedirectResponse
from typing import List, Optional
import json
import pandas as pd
import io

from app.models import schemas
from app.connectors.connection_service import ConnectionService
from app.auth.authorization import check_user_authorization
from app.logger import logger


class GroupsRouting(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        
        self.router.add_api_route(
            path="/groups",
            endpoint=self.create_group,
            methods=["POST"],
            response_model=schemas.GroupResponse,
            summary="Create a new club group/team with custom activity type and age group constraint.",
            tags=["Groups"]
        )
        self.router.add_api_route(
            path="/groups/import",
            endpoint=self.import_groups_and_members,
            methods=["POST"],
            summary="Import groups and members from an uploaded Excel file.",
            tags=["Groups"]
        )
        self.router.add_api_route(
            path="/groups",
            endpoint=self.get_groups,
            methods=["GET"],
            response_model=List[schemas.GroupResponse],
            summary="Retrieve all club groups/teams owned by the club administrator.",
            tags=["Groups"]
        )
        self.router.add_api_route(
            path="/groups/{group_id}",
            endpoint=self.get_group,
            methods=["GET"],
            response_model=schemas.GroupResponse,
            summary="Retrieve a specific club group/team by ID or group name.",
            tags=["Groups"]
        )
        self.router.add_api_route(
            path="/groups/{group_id}",
            endpoint=self.delete_group,
            methods=["DELETE"],
            summary="Delete a specific club group/team and all its associated data.",
            tags=["Groups"]
        )
        self.router.add_api_route(
            path="/groups/{group_id}/members",
            endpoint=self.add_member,
            methods=["POST"],
            response_model=schemas.MemberResponse,
            summary="Add a new member to a specific club group/team.",
            tags=["Groups"]
        )
        self.router.add_api_route(
            path="/groups/{group_id}/members/import",
            endpoint=self.import_members,
            methods=["POST"],
            summary="Import members into a specific group from an uploaded Excel file.",
            tags=["Groups"]
        )
        self.router.add_api_route(
            path="/groups/{group_id}/members",
            endpoint=self.get_group_members,
            methods=["GET"],
            response_model=List[schemas.MemberResponse],
            summary="Retrieve all members of a specific club group/team.",
            tags=["Groups"]
        )
        self.router.add_api_route(
            path="/members",
            endpoint=self.get_all_members,
            methods=["GET"],
            summary="Retrieve all members across all groups for the given club administrator.",
            tags=["Groups"]
        )

    async def create_group(
        self,
        request: Request,
        group: schemas.GroupCreate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Create group router start", step="ROUTER_START", user_info=current_user)
        logic = GroupsLogic()
        return await logic.create_group(request, group, current_user)

    async def import_groups_and_members(
        self,
        request: Request,
        owner_id: int = Form(...),
        file: UploadFile = File(...),
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Import groups and members router start", step="ROUTER_START", user_info=current_user)
        logic = GroupsLogic()
        return await logic.import_groups_and_members(request, owner_id, file, current_user)

    async def get_groups(
        self,
        request: Request,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get groups router start", step="ROUTER_START", user_info=current_user)
        logic = GroupsLogic()
        return await logic.get_groups(request, owner_id, current_user)

    async def get_group(
        self,
        request: Request,
        group_id: str,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get group router start", step="ROUTER_START", user_info=current_user)
        logic = GroupsLogic()
        return await logic.get_group(request, group_id, owner_id, current_user)

    async def delete_group(
        self,
        request: Request,
        group_id: int,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Delete group router start", step="ROUTER_START", user_info=current_user)
        logic = GroupsLogic()
        return await logic.delete_group(request, group_id, owner_id, current_user)

    async def add_member(
        self,
        request: Request,
        group_id: int,
        owner_id: int,
        member: schemas.MemberCreate,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Add member router start", step="ROUTER_START", user_info=current_user)
        logic = GroupsLogic()
        return await logic.add_member(request, group_id, owner_id, member, current_user)

    async def import_members(
        self,
        request: Request,
        group_id: int,
        owner_id: int = Form(...),
        file: UploadFile = File(...),
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Import members router start", step="ROUTER_START", user_info=current_user)
        logic = GroupsLogic()
        return await logic.import_members(request, group_id, owner_id, file, current_user)

    async def get_group_members(
        self,
        request: Request,
        group_id: str,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get group members router start", step="ROUTER_START", user_info=current_user)
        logic = GroupsLogic()
        return await logic.get_group_members(request, group_id, owner_id, current_user)

    async def get_all_members(
        self,
        request: Request,
        owner_id: int,
        current_user: dict = Depends(check_user_authorization)
    ):
        await logger.log_message(request=request, message="Get all members router start", step="ROUTER_START", user_info=current_user)
        logic = GroupsLogic()
        return await logic.get_all_members(request, owner_id, current_user)


class GroupsLogic(ConnectionService):
    def __init__(self) -> None:
        super().__init__()
        logger.log_message_sync(message="GroupsLogic instance created")

    async def create_group(self, request: Request, group: schemas.GroupCreate, current_user: dict):
        try:
            with logger.time_operation("CREATE_GROUP", request=request):
                db = self.db_driver
                insert_data = {
                    "activity": group.activity,
                    "age_group": group.age_group,
                    "group_name": group.group_name,
                    "sub_group": group.sub_group,
                    "description": group.description,
                    "owner_id": group.owner_id
                }
                group_id = db.insert("groups", insert_data)
                
                # Fetch created group with empty members/events lists
                new_group = db.fetch_one("SELECT * FROM groups WHERE id = %s", (group_id,))
                if new_group:
                    new_group["members"] = []
                    new_group["events"] = []
                return new_group
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to create group: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def import_groups_and_members(self, request: Request, owner_id: int, file: UploadFile, current_user: dict):
        if not file.filename.endswith('.xlsx') and not file.filename.endswith('.xls'):
            raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel file.")

        try:
            contents = await file.read()
            df = pd.read_excel(io.BytesIO(contents))
            df = df.where(pd.notnull(df), None)
            records = df.to_dict(orient="records")

            db = self.db_driver
            new_groups_count = 0
            new_members_count = 0
            
            group_name_to_id = {}

            for record in records:
                g_name = str(record.get("group_name", "")).strip()
                if not g_name or not record.get("activity") or not record.get("age_group"):
                    continue

                if g_name not in group_name_to_id:
                    # Check if already exists in DB
                    existing_group = db.fetch_one(
                        "SELECT id FROM groups WHERE group_name = %s AND owner_id = %s LIMIT 1",
                        (g_name, owner_id)
                    )
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
                        g_id = db.insert("groups", insert_group)
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
                    db.insert("members", insert_member)
                    new_members_count += 1

            return {
                "message": f"Successfully imported {new_groups_count} groups and {new_members_count} members.",
                "groups_count": new_groups_count,
                "members_count": new_members_count
            }
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed importing groups: {e}")
            raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

    async def get_groups(self, request: Request, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_GROUPS", request=request):
                db = self.db_driver
                groups = db.fetch_all("SELECT * FROM groups WHERE owner_id = %s", (owner_id,))
                
                # Fetch members and events for each group to construct GroupResponse
                for g in groups:
                    g_id = g.get("id")
                    g["members"] = db.fetch_all("SELECT * FROM members WHERE group_id = %s", (g_id,))
                    g["events"] = db.fetch_all("SELECT * FROM events WHERE group_id = %s", (g_id,))
                return groups
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get groups: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_group(self, request: Request, group_id: str, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_GROUP", request=request):
                db = self.db_driver
                group = None
                
                if group_id.isdigit():
                    group = db.fetch_one(
                        "SELECT * FROM groups WHERE id = %s AND owner_id = %s",
                        (int(group_id), owner_id)
                    )
                
                if not group:
                    group = db.fetch_one(
                        "SELECT * FROM groups WHERE group_name = %s AND owner_id = %s",
                        (group_id, owner_id)
                    )

                if not group:
                    raise HTTPException(status_code=404, detail="Group not found or access denied")
                
                g_id = group.get("id")
                group["members"] = db.fetch_all("SELECT * FROM members WHERE group_id = %s", (g_id,))
                
                events = db.fetch_all("SELECT * FROM events WHERE group_id = %s", (g_id,))
                # event schema serialization (matching helper or basic structure)
                group["events"] = events
                
                return group
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get group: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def delete_group(self, request: Request, group_id: int, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("DELETE_GROUP", request=request):
                db = self.db_driver
                group = db.fetch_one(
                    "SELECT * FROM groups WHERE id = %s AND owner_id = %s",
                    (group_id, owner_id)
                )
                if not group:
                    raise HTTPException(status_code=404, detail="Group not found or access denied")
                
                db.execute_query("DELETE FROM groups WHERE id = %s AND owner_id = %s", (group_id, owner_id))
                return {"message": "Group deleted successfully"}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to delete group: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def add_member(self, request: Request, group_id: int, owner_id: int, member: schemas.MemberCreate, current_user: dict):
        try:
            with logger.time_operation("ADD_MEMBER", request=request):
                db = self.db_driver
                db_group = db.fetch_one(
                    "SELECT * FROM groups WHERE id = %s AND owner_id = %s",
                    (group_id, owner_id)
                )
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
                
                member_id = db.insert("members", insert_data)
                new_member = db.fetch_one("SELECT * FROM members WHERE id = %s", (member_id,))
                return new_member
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to add member: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def import_members(self, request: Request, group_id: int, owner_id: int, file: UploadFile, current_user: dict):
        if not file.filename.endswith('.xlsx') and not file.filename.endswith('.xls'):
            raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel file.")

        try:
            db = self.db_driver
            db_group = db.fetch_one(
                "SELECT * FROM groups WHERE id = %s AND owner_id = %s",
                (group_id, owner_id)
            )
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
                db.insert("members", insert_data)
                new_members_count += 1

            return {"message": f"Successfully imported {new_members_count} members.", "count": new_members_count}
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed importing members: {e}")
            raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

    async def get_group_members(self, request: Request, group_id: str, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_GROUP_MEMBERS", request=request):
                db = self.db_driver
                group = None
                if group_id.isdigit():
                    group = db.fetch_one(
                        "SELECT * FROM groups WHERE id = %s AND owner_id = %s",
                        (int(group_id), owner_id)
                    )
                if not group:
                    group = db.fetch_one(
                        "SELECT * FROM groups WHERE group_name = %s AND owner_id = %s",
                        (group_id, owner_id)
                    )
                
                if not group:
                    raise HTTPException(status_code=404, detail="Access denied or group not found")

                members = db.fetch_all("SELECT * FROM members WHERE group_id = %s", (group.get("id"),))
                return members
        except HTTPException as he:
            raise he
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get group members: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")

    async def get_all_members(self, request: Request, owner_id: int, current_user: dict):
        try:
            with logger.time_operation("GET_ALL_MEMBERS", request=request):
                db = self.db_driver
                members_and_groups = db.fetch_all(
                    "SELECT m.*, g.group_name FROM members m "
                    "JOIN groups g ON m.group_id = g.id WHERE g.owner_id = %s",
                    (owner_id,)
                )
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
        except Exception as e:
            await logger.log_error(request=request, message=f"Failed to get all members: {e}")
            raise HTTPException(status_code=500, detail="Internal server error")
