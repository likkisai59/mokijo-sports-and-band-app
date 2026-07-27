"""
Business logic service layers for System Settings and Audit logging.
"""

from typing import Any, Dict
from sqlalchemy.orm import Session
from loguru import logger
from app.features.settings.crud import SystemSettingCRUD, AuditLogCRUD
from app.features.settings.models import SystemSetting, AuditLog
from app.core.exceptions import NotFoundException

# Default configuration templates seeds
DEFAULT_SETTINGS: Dict[str, Dict[str, Any]] = {
    "application_settings": {
        "value": {
            "app_name": "BandConnect",
            "support_email": "support@bandconnect.in",
            "support_phone": "+91 99999 88888",
            "maintenance_mode": False
        },
        "description": "General application contact and maintenance settings"
    },
    "notification_settings": {
        "value": {
            "email_dispatch": True,
            "sms_dispatch": True,
            "push_alerts": False
        },
        "description": "General dispatch channels settings config"
    },
    "storage_settings": {
        "value": {
            "provider": "local",
            "s3_bucket": "bandconnect-assets",
            "s3_region": "ap-south-1"
        },
        "description": "Media assets upload storage settings config"
    },
    "email_templates": {
        "value": {
            "welcome_email": "Dear {{name}},\nWelcome to BandConnect! ...",
            "password_reset": "Reset link: {{url}}",
            "booking_alert": "Gig booking confirm #{{booking_id}}"
        },
        "description": "Email templates configuration text formats"
    },
    "sms_templates": {
        "value": {
            "otp_sms": "Your OTP verification code is {{code}}.",
            "booking_confirm": "Your gig is booked successfully! ID: {{id}}"
        },
        "description": "SMS templates configuration text formats"
    },
    "theme_settings": {
        "value": {
            "primary_color": "#FF6B35",
            "secondary_color": "#1DB954",
            "default_mode": "dark"
        },
        "description": "UI theme system color styling settings configuration"
    },
    "system_preferences": {
        "value": {
            "commission_rate": 10.0,
            "dispute_hold_days": 7
        },
        "description": "Marketplace commissioning fees preferences config"
    }
}


class SettingService:
    """Service layer for modifying configurations and tracking administrative audit changes."""

    def __init__(self):
        self.settings_crud = SystemSettingCRUD()
        self.audit_crud = AuditLogCRUD()

    def get_setting(self, db: Session, key: str) -> SystemSetting:
        """Fetch system setting. Auto-seeds defaults if missing in DB."""
        setting = self.settings_crud.get(db, key)
        if not setting:
            if key in DEFAULT_SETTINGS:
                defaults = DEFAULT_SETTINGS[key]
                setting = self.settings_crud.upsert(
                    db, key, value=defaults["value"], description=defaults["description"]
                )
            else:
                raise NotFoundException(f"Setting key '{key}' not found.")
        return setting

    def update_setting(
        self,
        db: Session,
        key: str,
        value: Any,
        user_id: str,
        ip_address: str = None,
        user_agent: str = None
    ) -> SystemSetting:
        """Updates setting value and logs action to audit logs."""
        setting = self.get_setting(db, key)
        old_value = setting.value
        
        # Save updates
        setting = self.settings_crud.upsert(db, key, value=value)

        # Log event to audit logs
        self.audit_crud.create(
            db,
            obj_in={
                "user_id": user_id,
                "action": "settings_update",
                "ip_address": ip_address,
                "user_agent": user_agent,
                "payload": {
                    "setting_key": key,
                    "before": old_value,
                    "after": value
                }
            }
        )
        logger.info(f"System config key '{key}' updated by user {user_id}")
        return setting

    def log_custom_action(
        self,
        db: Session,
        user_id: str,
        action: str,
        payload: Dict[str, Any],
        ip_address: str = None,
        user_agent: str = None
    ) -> AuditLog:
        """Logs custom administrative action logs."""
        log = self.audit_crud.create(
            db,
            obj_in={
                "user_id": user_id,
                "action": action,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "payload": payload
            }
        )
        return log
