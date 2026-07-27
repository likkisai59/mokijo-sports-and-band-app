"""
Database CRUD repository operations for settings and audit logging logs.
"""

from typing import Optional, Tuple, List
from sqlalchemy.orm import Session, joinedload
from app.common.repositories.base import BaseRepository
from app.features.settings.models import SystemSetting, AuditLog


class SystemSettingCRUD:
    """CRUD operations dealing with SystemSetting key-value configurations."""

    def get(self, db: Session, key: str) -> Optional[SystemSetting]:
        return db.query(SystemSetting).filter(SystemSetting.key == key).first()

    def get_all(self, db: Session) -> List[SystemSetting]:
        return db.query(SystemSetting).all()

    def upsert(self, db: Session, key: str, value: any, description: Optional[str] = None) -> SystemSetting:
        setting = self.get(db, key)
        if setting:
            setting.value = value
            if description:
                setting.description = description
        else:
            setting = SystemSetting(key=key, value=value, description=description)
            db.add(setting)
        db.commit()
        db.refresh(setting)
        return setting


class AuditLogCRUD(BaseRepository[AuditLog]):
    def __init__(self):
        super().__init__(AuditLog)

    def get_filtered_logs(
        self,
        db: Session,
        action: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[AuditLog], int]:
        """Fetch audit logs details with pagination and action filtering."""
        query = db.query(AuditLog).join(AuditLog.user).options(joinedload(AuditLog.user))

        if action:
            query = query.filter(AuditLog.action.ilike(f"%{action}%"))

        total_count = query.count()
        results = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
        return results, total_count
