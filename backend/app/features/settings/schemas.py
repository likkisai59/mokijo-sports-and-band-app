"""
Pydantic validation schemas for System Settings and Audit logs.
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from app.common.schemas.base import BaseSchema


class SystemSettingResponse(BaseSchema):
    key: str
    value: Any
    description: Optional[str] = None
    updated_at: str


class SystemSettingUpdate(BaseSchema):
    value: Any


class AuditLogResponse(BaseSchema):
    id: UUID
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    action: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    payload: Dict[str, Any] = {}
    created_at: str


class PaginatedAuditLogList(BaseSchema):
    items: List[AuditLogResponse]
    total: int
