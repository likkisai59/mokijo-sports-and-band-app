from datetime import timedelta
from app.features.auth.models import User
from app.core.security import create_access_token

def test_email_verification_flow(client, db_session):
    # 1. Create an unverified user
    payload = {
        "email": "verify_test@example.com",
        "name": "Verify Tester",
        "password": "TestPassword123!",
        "role_name": "client"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    
    # Query database to confirm user is unverified
    user = db_session.query(User).filter(User.email == "verify_test@example.com").first()
    assert user is not None
    assert user.is_verified is False

    # 2. Generate a valid token manually for testing endpoint
    token = create_access_token(
        subject=str(user.id),
        role="verify",
        email=user.email,
        expires_delta=timedelta(hours=1)
    )

    # 3. Post verification token to endpoint
    verify_response = client.post("/api/v1/auth/verify-email", json={"token": token})
    assert verify_response.status_code == 200
    res_data = verify_response.json()
    assert res_data["success"] is True
    assert res_data["data"]["already_verified"] is False
    assert res_data["data"]["access_token"] is not None
    assert res_data["data"]["user"] is not None

    # Confirm user is now verified
    db_session.refresh(user)
    assert user.is_verified is True

    # 4. Second click on same verification link should return already_verified: True without auto-login tokens
    reverify_response = client.post("/api/v1/auth/verify-email", json={"token": token})
    assert reverify_response.status_code == 200
    re_res_data = reverify_response.json()
    assert re_res_data["success"] is True
    assert re_res_data["data"]["already_verified"] is True
    assert re_res_data["data"]["access_token"] is None

def test_email_verification_invalid_token(client):
    # Try verifying with an invalid token
    response = client.post("/api/v1/auth/verify-email", json={"token": "invalidtokenvalue"})
    assert response.status_code == 401
    assert "invalid" in response.json()["error"]["message"].lower() or "malformed" in response.json()["error"]["message"].lower()

def test_email_verification_expired_token(client, db_session):
    # 1. Create user
    user = User(
        email="verify_expired@example.com",
        name="Expired Tester",
        password_hash="hashedpwd",
        is_active=True,
        is_verified=False
    )
    db_session.add(user)
    db_session.commit()

    # 2. Generate expired token
    token = create_access_token(
        subject=str(user.id),
        role="verify",
        email=user.email,
        expires_delta=timedelta(seconds=-1)
    )

    # 3. Request verification
    response = client.post("/api/v1/auth/verify-email", json={"token": token})
    assert response.status_code == 401
