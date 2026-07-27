import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from loguru import logger

class EmailService:
    @staticmethod
    def _send(to_email: str, subject: str, body: str) -> bool:
        """Central email dispatching implementation."""
        # Clean email string
        to_email = to_email.strip().lower()
        
        # If in development or SMTP settings are missing, mock/log the email
        if not settings.SMTP_USER or not settings.SMTP_PASS:
            logger.info(
                f"\n"
                f"✉️  [Email Sandbox] To: {to_email}\n"
                f"   Subject: {subject}\n"
                f"   ---[EMAIL BODY START]---\n"
                f"   {body}\n"
                f"   ---[EMAIL BODY END]---\n"
            )
            return True
            
        try:
            msg = MIMEMultipart()
            msg["From"] = f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))
            
            # Connect to SMTP
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.FROM_EMAIL, to_email, msg.as_string())
            server.quit()
            
            logger.info(f"Email successfully dispatched via SMTP to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to dispatch email to {to_email} via SMTP: {e}")
            return False

    @classmethod
    def send_verification_email(cls, to_email: str, token: str) -> bool:
        verification_url = f"{settings.APP_URL}/verify-email?token={token}"
        subject = "Verify Your BandConnect Email Address"
        body = (
            f"Hi,\n\n"
            f"Thank you for registering on BandConnect!\n\n"
            f"Please verify your email address by clicking the link below:\n"
            f"{verification_url}\n\n"
            f"This link is valid for 24 hours. If you did not sign up for BandConnect, please ignore this email.\n\n"
            f"Best regards,\n"
            f"The BandConnect Team"
        )
        return cls._send(to_email, subject, body)

    @classmethod
    def send_password_reset_email(cls, to_email: str, token: str) -> bool:
        reset_url = f"{settings.APP_URL}/reset-password?token={token}"
        subject = "Reset Your BandConnect Password"
        body = (
            f"Hi,\n\n"
            f"A request was received to reset the password for your BandConnect account.\n\n"
            f"You can reset your password using the link below:\n"
            f"{reset_url}\n\n"
            f"This link is valid for 1 hour. If you did not request a password reset, please ignore this email.\n\n"
            f"Best regards,\n"
            f"The BandConnect Team"
        )
        return cls._send(to_email, subject, body)

    @classmethod
    def send_booking_requested_email(cls, to_email: str, booking_id: str, client_name: str, event_name: str) -> bool:
        subject = f"New Booking Request: {event_name}"
        body = (
            f"Hi,\n\n"
            f"You have received a new booking request from {client_name} for the event '{event_name}'.\n\n"
            f"Please log in to your dashboard to review and accept/reject or counter this offer.\n"
            f"Booking ID: {booking_id}\n\n"
            f"Best regards,\n"
            f"The BandConnect Team"
        )
        return cls._send(to_email, subject, body)

    @classmethod
    def send_booking_accepted_email(cls, to_email: str, booking_id: str, artist_name: str, event_name: str) -> bool:
        subject = f"Booking Request Approved: {event_name}"
        body = (
            f"Hi,\n\n"
            f"Good news! {artist_name} has accepted your booking request for the event '{event_name}'.\n\n"
            f"Please log in to your dashboard to make the advance payment and secure your reservation.\n"
            f"Booking ID: {booking_id}\n\n"
            f"Best regards,\n"
            f"The BandConnect Team"
        )
        return cls._send(to_email, subject, body)

    @classmethod
    def send_booking_rejected_email(cls, to_email: str, booking_id: str, artist_name: str, event_name: str) -> bool:
        subject = f"Booking Request Declined: {event_name}"
        body = (
            f"Hi,\n\n"
            f"We regret to inform you that {artist_name} has declined your booking request for the event '{event_name}'.\n\n"
            f"You can explore other artists on our marketplace for your event.\n"
            f"Booking ID: {booking_id}\n\n"
            f"Best regards,\n"
            f"The BandConnect Team"
        )
        return cls._send(to_email, subject, body)

    @classmethod
    def send_booking_confirmed_email(cls, to_email: str, booking_id: str, event_name: str) -> bool:
        subject = f"Booking Confirmed: {event_name}"
        body = (
            f"Hi,\n\n"
            f"Your booking for the event '{event_name}' has been successfully confirmed!\n\n"
            f"Payment has been verified and is safely held in escrow. Enjoy your event!\n"
            f"Booking ID: {booking_id}\n\n"
            f"Best regards,\n"
            f"The BandConnect Team"
        )
        return cls._send(to_email, subject, body)

    @classmethod
    def send_event_reminder_email(cls, to_email: str, booking_id: str, event_name: str, date: str) -> bool:
        subject = f"Upcoming Event Reminder: {event_name}"
        body = (
            f"Hi,\n\n"
            f"This is a friendly reminder that you have an upcoming event '{event_name}' scheduled on {date}.\n\n"
            f"Booking ID: {booking_id}\n\n"
            f"Best regards,\n"
            f"The BandConnect Team"
        )
        return cls._send(to_email, subject, body)
