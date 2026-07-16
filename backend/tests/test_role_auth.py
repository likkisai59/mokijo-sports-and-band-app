import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.connectors.postgresql import PostgreSQLConnector

client = TestClient(app)
db = PostgreSQLConnector()

@pytest.fixture(autouse=True)
def cleanup_test_data():
    # Cleanup before tests
    db.execute_query("DELETE FROM members WHERE email = 'test_member@mukijo.com'")
    db.execute_query("DELETE FROM groups WHERE group_name = 'Auth Test Group'")
    db.execute_query("DELETE FROM users WHERE email IN ('role_test_admin@mukijo.com', 'other_admin@mukijo.com')")
    yield
    # Cleanup after tests
    db.execute_query("DELETE FROM members WHERE email = 'test_member@mukijo.com'")
    db.execute_query("DELETE FROM groups WHERE group_name = 'Auth Test Group'")
    db.execute_query("DELETE FROM users WHERE email IN ('role_test_admin@mukijo.com', 'other_admin@mukijo.com')")

def test_role_authentication_and_authorization():
    # 1. Register club admin
    admin_register_payload = {
        "clubName": "Auth Test Club",
        "sport": "Basketball",
        "country": "India",
        "state": "Telangana",
        "city": "Hyderabad",
        "firstName": "Auth",
        "lastName": "Admin",
        "email": "role_test_admin@mukijo.com",
        "password": "Password123"
    }
    response = client.post("/register", json=admin_register_payload)
    assert response.status_code == 200
    admin_id = response.json()["id"]

    # 2. Register other admin (to test cross-owner restrictions)
    other_admin_payload = {
        "clubName": "Other Test Club",
        "sport": "Basketball",
        "country": "India",
        "state": "Telangana",
        "city": "Hyderabad",
        "firstName": "Other",
        "lastName": "Admin",
        "email": "other_admin@mukijo.com",
        "password": "Password123"
    }
    response = client.post("/register", json=other_admin_payload)
    assert response.status_code == 200
    other_admin_id = response.json()["id"]

    # Verify both admins
    db.execute_query("UPDATE users SET is_email_verified = true WHERE email IN ('role_test_admin@mukijo.com', 'other_admin@mukijo.com')")

    # 3. Log in as Auth Admin and get token
    login_payload = {
        "email": "role_test_admin@mukijo.com",
        "password": "Password123"
    }
    response = client.post("/login", json=login_payload)
    assert response.status_code == 200
    admin_token = response.json()["accessToken"]

    # Log in as Other Admin and get token
    other_login_payload = {
        "email": "other_admin@mukijo.com",
        "password": "Password123"
    }
    response = client.post("/login", json=other_login_payload)
    assert response.status_code == 200
    other_admin_token = response.json()["accessToken"]

    # 4. Auth Admin creates a group
    group_payload = {
        "activity": "Basketball Training",
        "age_group": "Under 18",
        "group_name": "Auth Test Group",
        "sub_group": "A Team",
        "description": "Test Group for Role Auth",
        "owner_id": admin_id
    }
    response = client.post(
        "/groups",
        json=group_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    group_id = response.json()["id"]

    # 5. Try to access or delete group using other_admin_token (should return 403)
    response = client.delete(
        f"/groups/{group_id}?owner_id={admin_id}",
        headers={"Authorization": f"Bearer {other_admin_token}"}
    )
    assert response.status_code == 403

    # 6. Auth Admin adds a member to the group
    member_payload = {
        "first_name": "Test",
        "last_name": "Member",
        "email": "test_member@mukijo.com",
        "phone": "9999999999",
        "role": "player"
    }
    response = client.post(
        f"/groups/{group_id}/members?owner_id={admin_id}",
        json=member_payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    member_id = response.json()["id"]

    # 7. Log in as Team Member (defaults password to phone number)
    member_login_payload = {
        "email": "test_member@mukijo.com",
        "password": "9999999999"
    }
    response = client.post("/login-member", json=member_login_payload)
    assert response.status_code == 200
    member_token = response.json()["accessToken"]

    # 8. Team Member calls get_groups for the club (should succeed since they are in a group owned by admin_id)
    response = client.get(
        f"/groups?owner_id={admin_id}",
        headers={"Authorization": f"Bearer {member_token}"}
    )
    assert response.status_code == 200
    assert len(response.json()) > 0

    # 9. Team Member calls get_groups for other admin's club (should fail with 403)
    response = client.get(
        f"/groups?owner_id={other_admin_id}",
        headers={"Authorization": f"Bearer {member_token}"}
    )
    assert response.status_code == 403

    # 10. Team Member attempts admin-only operation (create a group) -> should fail with 403
    forbidden_group_payload = {
        "activity": "Unauthorized Basketball",
        "age_group": "Under 18",
        "group_name": "Unauthorized Group",
        "owner_id": admin_id
    }
    response = client.post(
        "/groups",
        json=forbidden_group_payload,
        headers={"Authorization": f"Bearer {member_token}"}
    )
    assert response.status_code == 403
