import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.connectors.connection_service import ConnectionService

client = TestClient(app)
cs = ConnectionService()
db = cs.db_driver

TEST_ADMIN_EMAIL = "superadmin_test_club@mukijo.com"


@pytest.fixture(autouse=True)
def cleanup_superadmin_test_data():
    # Clean up test club before and after test
    db.execute_query("DELETE FROM users WHERE LOWER(email) = %s", (TEST_ADMIN_EMAIL.lower(),))
    yield
    db.execute_query("DELETE FROM users WHERE LOWER(email) = %s", (TEST_ADMIN_EMAIL.lower(),))


def test_superadmin_login_valid_credentials():
    response = client.post(
        "/superadmin/login",
        json={"username": "superadmin", "password": "superadmin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("userRole") == "superadmin"
    assert "accessToken" in data


def test_superadmin_login_invalid_credentials():
    response = client.post(
        "/superadmin/login",
        json={"username": "superadmin", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "Invalid SuperAdmin credentials" in response.json().get("detail", "")


def test_superadmin_dashboard_stats_endpoint():
    response = client.get("/superadmin/dashboard-stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_clubs" in data
    assert "pending_clubs" in data
    assert "approved_clubs" in data
    assert "total_members" in data


def test_superadmin_pending_and_approved_clubs_endpoints():
    pending_res = client.get("/superadmin/pending-clubs")
    assert pending_res.status_code == 200
    assert isinstance(pending_res.json(), list)

    approved_res = client.get("/superadmin/approved-clubs")
    assert approved_res.status_code == 200
    assert isinstance(approved_res.json(), list)

    all_res = client.get("/superadmin/all-clubs")
    assert all_res.status_code == 200
    assert isinstance(all_res.json(), list)


def test_end_to_end_club_approval_workflow():
    # 1. Register a new Club Admin
    register_payload = {
        "clubName": "SuperAdmin Flow Test Club",
        "sport": "Basketball",
        "country": "India",
        "state": "Telangana",
        "firstName": "FlowTest",
        "lastName": "Admin",
        "email": TEST_ADMIN_EMAIL,
        "password": "Password123!",
        "phone": "+91 9998887776"
    }
    reg_response = client.post("/register", json=register_payload)
    assert reg_response.status_code == 200
    new_user_id = reg_response.json().get("id")
    assert new_user_id is not None

    # 2. Attempt login before approval -> Should be blocked (403)
    login_attempt = client.post(
        "/login",
        json={"email": TEST_ADMIN_EMAIL, "password": "Password123!"}
    )
    assert login_attempt.status_code == 403
    assert "pending approval" in login_attempt.json().get("detail", "").lower()

    # 3. Check Pending Approvals endpoint -> Test club must be in pending list
    pending_list = client.get("/superadmin/pending-clubs").json()
    pending_ids = [c["id"] for c in pending_list]
    assert new_user_id in pending_ids

    # 4. Super Admin Approves the Club
    approve_res = client.post(f"/superadmin/approve-club/{new_user_id}")
    assert approve_res.status_code == 200
    assert approve_res.json().get("approval_status") == "APPROVED"

    # 5. Check Pending list -> Test club must be REMOVED from pending list
    updated_pending = client.get("/superadmin/pending-clubs").json()
    updated_pending_ids = [c["id"] for c in updated_pending]
    assert new_user_id not in updated_pending_ids

    # 6. Check Approved list -> Test club must be PRESENT in approved list
    approved_list = client.get("/superadmin/approved-clubs").json()
    approved_ids = [c["id"] for c in approved_list]
    assert new_user_id in approved_ids

    # 7. Attempt login after approval -> Should succeed (200 OK)
    login_success = client.post(
        "/login",
        json={"email": TEST_ADMIN_EMAIL, "password": "Password123!"}
    )
    assert login_success.status_code == 200
    assert "accessToken" in login_success.json()
