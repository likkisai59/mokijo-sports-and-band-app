"""
Celery worker and scheduler application setup.
"""

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "bandconnect_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

# Auto-discover tasks from the tasks module
celery_app.autodiscover_tasks(
    packages=[
        "app.tasks.email_tasks",
        "app.tasks.notification_tasks"
    ],
    force=True
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
)
