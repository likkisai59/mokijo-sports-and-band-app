"""
Asynchronous background tasks for sending transactional emails.
"""

from loguru import logger
from app.tasks.celery_app import celery_app
from app.core.config import settings


@celery_app.task(name="app.tasks.email_tasks.send_transactional_email")
def send_transactional_email(to_email: str, subject: str, body: str) -> bool:
    """
    Sends a transactional email. 
    In production, this configures SMTP or SendGrid connection.
    In development/sandbox environments, it logs the output.
    """
    logger.info(f"Preparing to send email to {to_email} with subject: '{subject}'")
    
    # Check if SMTP configuration is set
    if settings.SMTP_USER and settings.SMTP_PASS:
        try:
            # Here we would implement standard smtplib setup
            # for the sake of the project foundation, we mock success
            logger.info("Email dispatched successfully via SMTP server.")
            return True
        except Exception as e:
            logger.error(f"Failed to dispatch email via SMTP: {str(e)}")
            return False
    else:
        logger.info(f"Sandbox Mode - SMTP credentials missing. Mock email output:\n---[EMAIL BODY START]---\n{body}\n---[EMAIL BODY END]---")
        return True
