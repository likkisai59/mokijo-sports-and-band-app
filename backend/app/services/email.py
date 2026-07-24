import smtplib
from email.message import EmailMessage
from app.core.config import EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, FRONTEND_URL

def send_verification_email(to_email: str, token: str) -> bool:
    verify_link = f"{FRONTEND_URL}/verify?token={token}"

    msg = EmailMessage()
    msg["Subject"] = "Verify your Mukijo Club & Sports Email"
    msg["From"] = EMAIL_USER
    msg["To"] = to_email

    msg.set_content(f"Click this link to verify your email: {verify_link}")

    # Premium dark cyber-sports branding template
    html_content = f"""
    <html>
      <body style="font-family: 'Outfit', 'Inter', sans-serif; background: #050508; color: #ffffff; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #0c0c14; padding: 40px; border-radius: 16px; border: 1px solid rgba(0, 240, 255, 0.15); text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
          <h1 style="color: #bffe00; font-size: 32px; font-weight: 800; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 2px;">MUKIJO</h1>
          <p style="color: #00f0ff; font-size: 14px; font-weight: 600; text-transform: uppercase; margin: 0 0 30px 0; letter-spacing: 1px;">Sports & Club Platform</p>
          <div style="height: 1px; background: linear-gradient(90deg, transparent, #00f0ff, transparent); margin-bottom: 30px;"></div>
          <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 20px 0; color: #ffffff;">Verify Your Email Address</h2>
          <p style="color: #a0aec0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Welcome to the ultimate cyber-sports hub! To activate your account and start managing or joining teams and bookings, verify your email by clicking below.
          </p>
          <a href="{verify_link}" style="display: inline-block; padding: 14px 32px; background: #bffe00; color: #050508; font-weight: 700; font-size: 16px; text-decoration: none; border-radius: 8px; text-transform: uppercase; box-shadow: 0 4px 20px rgba(191, 254, 0, 0.4);">
            Verify Account
          </a>
          <p style="color: #718096; font-size: 12px; margin: 40px 0 0 0; line-height: 1.5;">
            If the button above does not work, copy and paste this URL into your browser:<br/>
            <a href="{verify_link}" style="color: #00f0ff; text-decoration: none;">{verify_link}</a>
          </p>
          <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent); margin: 30px 0;"></div>
          <p style="color: #4a5568; font-size: 12px; margin: 0;">
            This link will expire in 24 hours. If you did not create a Mukijo account, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
    """
    msg.add_alternative(html_content, subtype="html")

    try:
        from app.logger import logger
        logger.log_message_sync(message=f"Attempting to send verification email to {to_email}...")
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(msg)
        logger.log_message_sync(message=f"Verification email sent successfully to {to_email}")
        return True
    except Exception as e:
        from app.logger import logger
        logger.log_error_sync(message=f"Failed to send email to {to_email}: {e}")
        return False


def send_signup_verification_email(to_email: str, token: str) -> bool:
    """Send an email verification link for an onboarding signup submission."""
    verify_link = f"{FRONTEND_URL}/verify-signup?token={token}"

    msg = EmailMessage()
    msg["Subject"] = "Verify your email — Mukijo Signup Application"
    msg["From"] = EMAIL_USER
    msg["To"] = to_email

    msg.set_content(f"Click this link to verify your email: {verify_link}")

    html_content = f"""
    <html>
      <body style="font-family: 'Outfit', 'Inter', sans-serif; background: #050508; color: #ffffff; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #0c0c14; padding: 40px; border-radius: 16px; border: 1px solid rgba(0, 240, 255, 0.15); text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
          <h1 style="color: #bffe00; font-size: 32px; font-weight: 800; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 2px;">MUKIJO</h1>
          <p style="color: #00f0ff; font-size: 14px; font-weight: 600; text-transform: uppercase; margin: 0 0 30px 0; letter-spacing: 1px;">Sports &amp; Club Platform</p>
          <div style="height: 1px; background: linear-gradient(90deg, transparent, #00f0ff, transparent); margin-bottom: 30px;"></div>
          <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 20px 0; color: #ffffff;">Verify Your Email Address</h2>
          <p style="color: #a0aec0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Thanks for applying to join a club on Mukijo! Please verify your email address by clicking below.
            Note that your application will still need to be approved by the club administrator before you can log in.
          </p>
          <a href="{verify_link}" style="display: inline-block; padding: 14px 32px; background: #bffe00; color: #050508; font-weight: 700; font-size: 16px; text-decoration: none; border-radius: 8px; text-transform: uppercase; box-shadow: 0 4px 20px rgba(191, 254, 0, 0.4);">
            Verify Email
          </a>
          <p style="color: #718096; font-size: 12px; margin: 40px 0 0 0; line-height: 1.5;">
            If the button above does not work, copy and paste this URL into your browser:<br/>
            <a href="{verify_link}" style="color: #00f0ff; text-decoration: none;">{verify_link}</a>
          </p>
          <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent); margin: 30px 0;"></div>
          <p style="color: #4a5568; font-size: 12px; margin: 0;">
            If you did not submit this application, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
    """
    msg.add_alternative(html_content, subtype="html")

    try:
        from app.logger import logger
        logger.log_message_sync(message=f"Attempting to send signup verification email to {to_email}...")
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(msg)
        logger.log_message_sync(message=f"Signup verification email sent successfully to {to_email}")
        return True
    except Exception as e:
        from app.logger import logger
        logger.log_error_sync(message=f"Failed to send signup verification email to {to_email}: {e}")
        return False


def _send_email(to_email: str, subject: str, html_content: str, text_content: str) -> bool:
    """Shared helper to send HTML emails using existing SMTP config."""
    from app.logger import logger
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = to_email
    msg.set_content(text_content)
    msg.add_alternative(html_content, subtype="html")
    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(msg)
        logger.log_message_sync(message=f"Email '{subject}' sent to {to_email}")
        return True
    except Exception as e:
        logger.log_error_sync(message=f"Failed to send email '{subject}' to {to_email}: {e}")
        return False


def _base_email_wrapper(body_html: str) -> str:
    return f"""
    <html>
      <body style="font-family: 'Outfit', 'Inter', sans-serif; background: #050508; color: #ffffff; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: #0c0c14; padding: 40px; border-radius: 16px; border: 1px solid rgba(0, 240, 255, 0.15); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <h1 style="color: #bffe00; font-size: 28px; font-weight: 800; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 2px;">MUKIJO</h1>
          <p style="color: #00f0ff; font-size: 13px; font-weight: 600; text-transform: uppercase; margin: 0 0 24px 0; letter-spacing: 1px;">Venue Verification System</p>
          <div style="height: 1px; background: linear-gradient(90deg, transparent, #00f0ff, transparent); margin-bottom: 28px;"></div>
          {body_html}
          <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); margin: 28px 0;"></div>
          <p style="color: #4a5568; font-size: 12px; margin: 0;">Mukijo Sports &amp; Club Platform &mdash; Automated notification. Do not reply to this email.</p>
        </div>
      </body>
    </html>
    """


def send_venue_submitted_email(to_email: str, venue_name: str) -> bool:
    """Notify venue owner that their venue has been submitted for verification."""
    body = f"""
      <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 16px 0;">Venue Submitted for Verification</h2>
      <p style="color: #a0aec0; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
        Your venue <strong style="color:#bffe00;">{venue_name}</strong> has been successfully submitted for verification.
        The Mukijo team will review your submission and respond within 2-5 business days.
      </p>
      <div style="background: rgba(191,254,0,0.07); border: 1px solid rgba(191,254,0,0.2); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <p style="color: #bffe00; font-size: 13px; font-weight: 700; margin: 0 0 6px 0; text-transform: uppercase;">What happens next?</p>
        <ul style="color: #a0aec0; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Our team will review your venue details, photos, and documents.</li>
          <li>You will receive an email when a decision is made.</li>
          <li>If more information is needed, we will contact you with specific details.</li>
        </ul>
      </div>
      <p style="color: #718096; font-size: 13px; margin: 0;">You can check your verification status anytime in your Venue Dashboard.</p>
    """
    return _send_email(
        to_email, "Venue Submitted for Verification — Mukijo",
        _base_email_wrapper(body),
        f"Your venue '{venue_name}' has been submitted for verification. The Mukijo team will review it shortly."
    )


def send_venue_approved_email(to_email: str, venue_name: str) -> bool:
    """Notify venue owner that their venue has been approved."""
    body = f"""
      <h2 style="color: #4ade80; font-size: 20px; margin: 0 0 16px 0;">🎉 Venue Approved &mdash; Congratulations!</h2>
      <p style="color: #a0aec0; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
        Great news! Your venue <strong style="color:#bffe00;">{venue_name}</strong> has been <strong style="color:#4ade80;">verified and approved</strong> by the Mukijo team.
      </p>
      <div style="background: rgba(74,222,128,0.07); border: 1px solid rgba(74,222,128,0.2); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <p style="color: #4ade80; font-size: 13px; font-weight: 700; margin: 0 0 6px 0; text-transform: uppercase;">Your venue is now:</p>
        <ul style="color: #a0aec0; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Publicly visible to all users</li>
          <li>Searchable on the platform</li>
          <li>Accepting bookings with the Mukijo Verified badge</li>
        </ul>
      </div>
      <p style="color: #718096; font-size: 13px; margin: 0;">Log in to your Venue Dashboard to manage slots, bookings, and pricing.</p>
    """
    return _send_email(
        to_email, f"✅ Venue Approved: {venue_name} — Mukijo",
        _base_email_wrapper(body),
        f"Congratulations! Your venue '{venue_name}' has been approved and is now publicly visible on Mukijo."
    )


def send_venue_rejected_email(to_email: str, venue_name: str, reason: str) -> bool:
    """Notify venue owner that their venue was rejected."""
    body = f"""
      <h2 style="color: #f87171; font-size: 20px; margin: 0 0 16px 0;">Venue Verification Unsuccessful</h2>
      <p style="color: #a0aec0; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
        Unfortunately, your venue <strong style="color:#bffe00;">{venue_name}</strong> could not be verified at this time.
      </p>
      <div style="background: rgba(248,113,113,0.07); border: 1px solid rgba(248,113,113,0.2); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <p style="color: #f87171; font-size: 13px; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase;">Reason for Rejection:</p>
        <p style="color: #a0aec0; font-size: 14px; line-height: 1.6; margin: 0;">{reason}</p>
      </div>
      <p style="color: #a0aec0; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
        You can update your venue information and resubmit for verification from your Venue Dashboard.
      </p>
      <p style="color: #718096; font-size: 13px; margin: 0;">If you believe this decision is incorrect, please contact Mukijo support.</p>
    """
    return _send_email(
        to_email, f"Venue Verification Update: {venue_name} — Mukijo",
        _base_email_wrapper(body),
        f"Your venue '{venue_name}' verification was unsuccessful. Reason: {reason}. You may update and resubmit."
    )


def send_venue_more_info_email(to_email: str, venue_name: str, message: str) -> bool:
    """Notify venue owner that more information is required."""
    body = f"""
      <h2 style="color: #f59e0b; font-size: 20px; margin: 0 0 16px 0;">Additional Information Required</h2>
      <p style="color: #a0aec0; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
        Our team is reviewing your venue <strong style="color:#bffe00;">{venue_name}</strong> and needs some additional information before we can complete the verification.
      </p>
      <div style="background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.2); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <p style="color: #f59e0b; font-size: 13px; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase;">Information Requested:</p>
        <p style="color: #a0aec0; font-size: 14px; line-height: 1.6; margin: 0;">{message}</p>
      </div>
      <p style="color: #a0aec0; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
        Please log in to your Venue Dashboard, update the required information, and resubmit for verification.
      </p>
      <p style="color: #718096; font-size: 13px; margin: 0;">Your venue will remain under review status until the information is provided and reviewed.</p>
    """
    return _send_email(
        to_email, f"Action Required: {venue_name} Verification — Mukijo",
        _base_email_wrapper(body),
        f"Additional information is required for your venue '{venue_name}': {message}"
    )


def send_venue_suspended_email(to_email: str, venue_name: str, reason: str) -> bool:
    """Notify venue owner that their venue has been suspended."""
    body = f"""
      <h2 style="color: #f87171; font-size: 20px; margin: 0 0 16px 0;">Venue Suspended</h2>
      <p style="color: #a0aec0; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
        Your venue <strong style="color:#bffe00;">{venue_name}</strong> has been <strong style="color:#f87171;">suspended</strong> by the Mukijo platform team.
      </p>
      <div style="background: rgba(248,113,113,0.07); border: 1px solid rgba(248,113,113,0.2); border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <p style="color: #f87171; font-size: 13px; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase;">Reason:</p>
        <p style="color: #a0aec0; font-size: 14px; line-height: 1.6; margin: 0;">{reason}</p>
      </div>
      <p style="color: #a0aec0; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
        Your venue will not accept new bookings while suspended. Existing confirmed bookings are preserved.
        Please contact Mukijo support to resolve this issue.
      </p>
    """
    return _send_email(
        to_email, f"Venue Suspended: {venue_name} — Mukijo",
        _base_email_wrapper(body),
        f"Your venue '{venue_name}' has been suspended. Reason: {reason}. Please contact Mukijo support."
    )