import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.connectors.postgresql import PostgreSQLConnector

client = TestClient(app)
db = PostgreSQLConnector()

@pytest.fixture(autouse=True)
def cleanup_test_users():
    # Clean up before tests
    db.execute_query("DELETE FROM users WHERE email IN ('verify_test_admin@mukijo.com', 'verify_test_user@mukijo.com')")
    yield
    # Clean up after tests
    db.execute_query("DELETE FROM users WHERE email IN ('verify_test_admin@mukijo.com', 'verify_test_user@mukijo.com')")

def test_admin_and_user_verification_flow():
    # 1. Register club admin
    admin_register_payload = {
        "clubName": "Verification Test Club",
        "sport": "Tennis",
        "country": "India",
        "state": "Telangana",
        "city": "Hyderabad",
        "firstName": "Verify",
        "lastName": "Admin",
        "email": "verify_test_admin@mukijo.com",
        "password": "Password123!"
    }
    response = client.post("/register", json=admin_register_payload)
    assert response.status_code == 200
    assert "id" in response.json()

    # 2. Register standard user (with all schema-required fields)
    user_register_payload = {
        "firstName": "Verify",
        "lastName": "User",
        "dob": "2000-01-01",
        "email": "verify_test_user@mukijo.com",
        "password": "Password123!",
        "phone": "9876543210",
        "aadharNumber": "123456789012"
    }
    response = client.post("/user/register", json=user_register_payload)
    assert response.status_code == 200
    assert "userId" in response.json()

    # 3. Set verification tokens in database to test email verification endpoint
    db.execute_query("UPDATE users SET is_verified = false, is_email_verified = false, email_verification_token = 'token_admin_test_123', verification_token = 'token_admin_test_123' WHERE email = 'verify_test_admin@mukijo.com'")
    db.execute_query("UPDATE users SET is_verified = false, is_email_verified = false, email_verification_token = 'token_user_test_123', verification_token = 'token_user_test_123' WHERE email = 'verify_test_user@mukijo.com'")

    # 4. Fetch tokens from database
    admin_row = db.fetch_one("SELECT email_verification_token FROM users WHERE email = %s", ("verify_test_admin@mukijo.com",))
    assert admin_row is not None
    admin_token = admin_row.get("email_verification_token")
    assert admin_token == 'token_admin_test_123'

    user_row = db.fetch_one("SELECT email_verification_token FROM users WHERE email = %s", ("verify_test_user@mukijo.com",))
    assert user_row is not None
    user_token = user_row.get("email_verification_token")
    assert user_token == 'token_user_test_123'

    # 5. Verify admin email using token
    response = client.get(f"/verify?token={admin_token}")
    assert response.status_code == 200
    assert "successfully verified" in response.json()["message"].lower()

    # 6. Verify standard user email using token
    response = client.get(f"/verify?token={user_token}")
    assert response.status_code == 200
    assert "successfully verified" in response.json()["message"].lower()

    # 7. Attempt admin login after verification (should succeed)
    login_payload = {
        "email": "verify_test_admin@mukijo.com",
        "password": "Password123!"
    }
    response = client.post("/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert data["userName"] == "Verify"

    # 8. Attempt standard user login after verification (should succeed)
    user_login_payload = {
        "email": "verify_test_user@mukijo.com",
        "password": "Password123!"
    }
    response = client.post("/user/login", json=user_login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert data["userName"] == "Verify"

def test_resend_verification():
    # 1. Register a test user
    user_register_payload = {
        "firstName": "Verify",
        "lastName": "User",
        "dob": "2000-01-01",
        "email": "verify_test_user@mukijo.com",
        "password": "Password123!",
        "phone": "9876543210",
        "aadharNumber": "123456789012"
    }
    response = client.post("/user/register", json=user_register_payload)
    assert response.status_code == 200

    # Set user as unverified with initial token
    db.execute_query("UPDATE users SET is_verified = false, is_email_verified = false, email_verification_token = 'initial_token_123' WHERE email = 'verify_test_user@mukijo.com'")

    # Get initial token
    initial_row = db.fetch_one("SELECT email_verification_token FROM users WHERE email = %s", ("verify_test_user@mukijo.com",))
    initial_token = initial_row.get("email_verification_token")

    # 2. Resend verification link
    resend_payload = {
        "email": "verify_test_user@mukijo.com"
    }
    response = client.post("/auth/resend-verification", json=resend_payload)
    assert response.status_code == 200
    assert "verification link has been sent" in response.json()["message"].lower()

    # Get new token and verify it has changed
    new_row = db.fetch_one("SELECT email_verification_token FROM users WHERE email = %s", ("verify_test_user@mukijo.com",))
    new_token = new_row.get("email_verification_token")
    assert new_token != initial_token

