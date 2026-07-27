"""
System health check router endpoint.
Checks connection states for primary services (Database, Redis).
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session
import redis
from app.core.dependencies import get_db
from app.core.config import settings
from app.common.schemas.base import SuccessResponse

router = APIRouter()

@router.get(
    "/health",
    response_model=SuccessResponse[dict],
    status_code=status.HTTP_200_OK,
    summary="Complete system health check",
    description="Validates that database and caching services are reachable and running cleanly."
)
async def system_health(
    db: Session = Depends(get_db)
):
    health_data = {
        "status": "healthy",
        "database": "unreachable",
        "cache": "unreachable"
    }
    
    # 1. Test database ping connection
    try:
        db.execute(text("SELECT 1"))
        health_data["database"] = "healthy"
    except Exception:
        # Fallback raw sql execution
        try:
            db.execute("SELECT 1")
            health_data["database"] = "healthy"
        except Exception:
            health_data["database"] = "unhealthy"
            health_data["status"] = "degraded"

    # 2. Test redis connection
    try:
        r = redis.Redis.from_url(settings.REDIS_URL, socket_connect_timeout=1)
        r.ping()
        health_data["cache"] = "healthy"
    except Exception:
        health_data["cache"] = "unhealthy"
        health_data["status"] = "degraded"

    # If the system is degraded, status can remain 200, or raise 503 depending on design.
    # We return the standard success response shape.
    return SuccessResponse(
        success=True,
        data=health_data,
        message="System health check completed."
    )
