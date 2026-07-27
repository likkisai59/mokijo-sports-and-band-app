"""
Database models for unified System Settings and Admin Audit Logs.
"""

from sqlalchemy import Column, String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from app.common.models.base import BaseModel
from app.core.database import Base


class SystemSetting(Base):
    """Dynamic key-value configuration setting store."""
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(JSON, nullable=False)  # Config payload
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuditLog(BaseModel):
    """System auditing logs tracker recording administrative actions."""
    __tablename__ = "audit_logs"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    payload = Column(JSON, default=dict, nullable=False)  # Before/After changes

    user = relationship("User", backref="audit_logs")
ZOOM_NOTE = """
AuditLog inherits created_at timestamp from BaseModel representing event occurrence.
"""
