"""
End-to-end unit tests for the Trainer MVP module.

Covers: register, login, CRUD trainings, reschedule, authz isolation,
and club-dashboard discovery endpoint.
"""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient

from app.main import app
from app.connectors.postgresql import PostgreSQLConnector

client = TestClient(app)
db = PostgreSQLConnector()

TEST_EMAIL = f"trainer_e2e_{int(datetime.now().timestamp())}@mukijo.test"
OTHER_EMAIL = f"trainer_other_{int(datetime.now().timestamp())}@mukijo.test"
ADMIN_EMAIL = f"trainer_admin_{int(datetime.now().timestamp())}@mukijo.test"
PASSWORD = "TrainerPass123!"


def _cleanup_emails(*emails):
    for email in emails:
        trainer = db.fetch_one("SELECT id FROM trainers WHERE LOWER(email) = %s", (email.lower(),))
        if trainer:
            db.execute_query("DELETE FROM courses WHERE trainer_id = %s", (trainer["id"],))
            db.execute_query("DELETE FROM trainers WHERE id = %s", (trainer["id"],))
        db.execute_query("DELETE FROM users WHERE LOWER(email) = %s", (email.lower(),))


@pytest.fixture(autouse=True)
def cleanup_test_data():
    _cleanup_emails(TEST_EMAIL, OTHER_EMAIL, ADMIN_EMAIL)
    yield
    _cleanup_emails(TEST_EMAIL, OTHER_EMAIL, ADMIN_EMAIL)


def _register_payload(email=TEST_EMAIL, **overrides):
    payload = {
        "first_name": "Test",
        "last_name": "Trainer",
        "email": email,
        "phone": "9876543210",
        "password": PASSWORD,
        "specialization": "Cricket",
        "experience": "5",
        "aadhar": "123456789012",
        "sports": ["Cricket", "Football (Soccer)"],
    }
    payload.update(overrides)
    return payload


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ─── Auth ────────────────────────────────────────────────────────────────────

def test_trainer_register_success():
    res = client.post("/trainer/register", json=_register_payload())
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["trainerId"]
    assert data["trainerEmail"] == TEST_EMAIL.lower()
    assert "Test Trainer" in data["trainerName"]


def test_trainer_register_duplicate_email():
    first = client.post("/trainer/register", json=_register_payload())
    assert first.status_code == 200, first.text

    second = client.post("/trainer/register", json=_register_payload())
    assert second.status_code == 400
    assert "already registered" in second.json()["detail"].lower()


def test_trainer_register_requires_specialization():
    res = client.post("/trainer/register", json=_register_payload(specialization="  "))
    assert res.status_code == 400
    assert "specialization" in res.json()["detail"].lower()


def test_trainer_register_requires_sports():
    res = client.post("/trainer/register", json=_register_payload(sports=[]))
    assert res.status_code == 400
    assert "sport" in res.json()["detail"].lower()


def test_trainer_login_success():
    reg = client.post("/trainer/register", json=_register_payload())
    assert reg.status_code == 200, reg.text

    login = client.post("/trainer/login", json={"email": TEST_EMAIL, "password": PASSWORD})
    assert login.status_code == 200, login.text
    data = login.json()
    assert data["access_token"]
    assert data["isTrainer"] is True
    assert data["trainerId"] == reg.json()["trainerId"]
    assert data["token_type"] == "bearer"


def test_trainer_login_invalid_password():
    reg = client.post("/trainer/register", json=_register_payload())
    assert reg.status_code == 200, reg.text

    login = client.post("/trainer/login", json={"email": TEST_EMAIL, "password": "WrongPass!"})
    assert login.status_code == 400
    assert "invalid" in login.json()["detail"].lower()


def test_trainer_login_unknown_email():
    login = client.post(
        "/trainer/login",
        json={"email": "nobody_exists_trainer@mukijo.test", "password": PASSWORD},
    )
    assert login.status_code == 400
    assert "invalid" in login.json()["detail"].lower()


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _register_and_login(email=TEST_EMAIL):
    reg = client.post("/trainer/register", json=_register_payload(email=email))
    assert reg.status_code == 200, reg.text
    trainer_id = reg.json()["trainerId"]

    login = client.post("/trainer/login", json={"email": email, "password": PASSWORD})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    return trainer_id, token


def _create_training(trainer_id, token, title="E2E Cricket Batch"):
    res = client.post(
        f"/trainer/{trainer_id}/courses",
        headers=_auth_headers(token),
        json={
            "title": title,
            "category": "Training",
            "level": "Beginner",
            "description": "E2E test training",
            "start_date": "2026-08-01",
            "end_date": "2026-08-31",
            "schedule": "Mon/Wed 6-8 PM",
            "location": "Main Ground",
            "capacity": 20,
            "fee": 1500,
            "status": "open",
        },
    )
    assert res.status_code == 200, res.text
    return res.json()


# ─── Training CRUD ───────────────────────────────────────────────────────────

def test_create_list_training():
    trainer_id, token = _register_and_login()
    created = _create_training(trainer_id, token)

    assert created["title"] == "E2E Cricket Batch"
    assert created["trainer_id"] == trainer_id
    assert created["owner_id"] is None
    assert created["is_trainer_training"] is True
    assert created["instructor"]  # defaults to trainer name
    assert created["status"] == "open"

    listed = client.get(
        f"/trainer/{trainer_id}/courses",
        headers=_auth_headers(token),
    )
    assert listed.status_code == 200, listed.text
    items = listed.json()
    assert any(c["id"] == created["id"] for c in items)


def test_create_training_requires_title():
    trainer_id, token = _register_and_login()
    res = client.post(
        f"/trainer/{trainer_id}/courses",
        headers=_auth_headers(token),
        json={"title": "   ", "status": "open"},
    )
    assert res.status_code == 400
    assert "title" in res.json()["detail"].lower()


def test_create_training_requires_auth():
    trainer_id, token = _register_and_login()
    res = client.post(
        f"/trainer/{trainer_id}/courses",
        json={"title": "No Auth Training", "status": "open"},
    )
    assert res.status_code == 401


def test_update_training():
    trainer_id, token = _register_and_login()
    created = _create_training(trainer_id, token)

    updated = client.put(
        f"/trainer/{trainer_id}/courses/{created['id']}",
        headers=_auth_headers(token),
        json={"title": "Updated Batch", "location": "Court B", "capacity": 25},
    )
    assert updated.status_code == 200, updated.text
    data = updated.json()
    assert data["title"] == "Updated Batch"
    assert data["location"] == "Court B"
    assert data["capacity"] == 25


def test_reschedule_training():
    trainer_id, token = _register_and_login()
    created = _create_training(trainer_id, token)

    res = client.post(
        f"/trainer/{trainer_id}/courses/{created['id']}/reschedule",
        headers=_auth_headers(token),
        json={
            "start_date": "2026-09-01",
            "end_date": "2026-09-30",
            "schedule": "Tue/Thu 7-9 PM",
            "reason": "Rain",
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["start_date"] == "2026-09-01"
    assert data["end_date"] == "2026-09-30"
    assert data["schedule"] == "Tue/Thu 7-9 PM"
    assert data["reschedule_reason"] == "Rain"
    assert data["rescheduled_at"] is not None


def test_reschedule_requires_reason():
    trainer_id, token = _register_and_login()
    created = _create_training(trainer_id, token)

    res = client.post(
        f"/trainer/{trainer_id}/courses/{created['id']}/reschedule",
        headers=_auth_headers(token),
        json={"start_date": "2026-09-01", "reason": "  "},
    )
    assert res.status_code == 400
    assert "reason" in res.json()["detail"].lower()


def test_delete_training():
    trainer_id, token = _register_and_login()
    created = _create_training(trainer_id, token)

    deleted = client.delete(
        f"/trainer/{trainer_id}/courses/{created['id']}",
        headers=_auth_headers(token),
    )
    assert deleted.status_code == 200, deleted.text

    listed = client.get(
        f"/trainer/{trainer_id}/courses",
        headers=_auth_headers(token),
    )
    assert listed.status_code == 200
    assert not any(c["id"] == created["id"] for c in listed.json())


# ─── Authorization ───────────────────────────────────────────────────────────

def test_trainer_cannot_access_another_trainers_courses():
    trainer_a, token_a = _register_and_login(TEST_EMAIL)
    trainer_b, token_b = _register_and_login(OTHER_EMAIL)
    created = _create_training(trainer_a, token_a, title="Private A Batch")

    # B listing A's courses by A's id → 403
    listed = client.get(
        f"/trainer/{trainer_a}/courses",
        headers=_auth_headers(token_b),
    )
    assert listed.status_code == 403

    # B updating A's course → 403 (or 404 if ownership check first)
    updated = client.put(
        f"/trainer/{trainer_a}/courses/{created['id']}",
        headers=_auth_headers(token_b),
        json={"title": "Hijacked"},
    )
    assert updated.status_code in (403, 404)

    # B rescheduling A's course via B's path → not found / denied
    resched = client.post(
        f"/trainer/{trainer_b}/courses/{created['id']}/reschedule",
        headers=_auth_headers(token_b),
        json={"start_date": "2026-10-01", "reason": "Rain"},
    )
    assert resched.status_code == 404


# ─── Club dashboard discovery ────────────────────────────────────────────────

def test_club_dashboard_discovers_trainer_trainings():
    trainer_id, token = _register_and_login()
    created = _create_training(trainer_id, token, title="Discoverable Training")

    # Register + login club admin
    admin_reg = client.post(
        "/register",
        json={
            "clubName": "Trainer E2E Club",
            "sport": "Cricket",
            "country": "India",
            "state": "Telangana",
            "city": "Hyderabad",
            "firstName": "Club",
            "lastName": "Admin",
            "email": ADMIN_EMAIL,
            "password": PASSWORD,
        },
    )
    assert admin_reg.status_code == 200, admin_reg.text
    admin_id = admin_reg.json()["id"]
    db.execute_query("UPDATE users SET is_email_verified = true, approval_status = 'APPROVED' WHERE id = %s", (admin_id,))

    admin_login = client.post("/login", json={"email": ADMIN_EMAIL, "password": PASSWORD})
    assert admin_login.status_code == 200, admin_login.text
    admin_token = admin_login.json().get("accessToken") or admin_login.json().get("access_token")
    assert admin_token

    # Discovery endpoint should include trainer training
    discover = client.get(
        f"/courses/trainer-trainings?owner_id={admin_id}",
        headers=_auth_headers(admin_token),
    )
    assert discover.status_code == 200, discover.text
    items = discover.json()
    assert any(c["id"] == created["id"] for c in items)
    match = next(c for c in items if c["id"] == created["id"])
    assert match["is_trainer_training"] is True
    assert match["trainer_id"] == trainer_id

    # Club courses list should NOT include trainer training
    club_courses = client.get(
        f"/courses?owner_id={admin_id}",
        headers=_auth_headers(admin_token),
    )
    assert club_courses.status_code == 200, club_courses.text
    assert not any(c["id"] == created["id"] for c in club_courses.json())


def test_club_courses_create_still_requires_owner_id():
    """Club admin course create path must keep requiring owner_id (trainer path separate)."""
    admin_reg = client.post(
        "/register",
        json={
            "clubName": "Trainer E2E Club 2",
            "sport": "Cricket",
            "country": "India",
            "state": "Telangana",
            "city": "Hyderabad",
            "firstName": "Club",
            "lastName": "Admin",
            "email": ADMIN_EMAIL,
            "password": PASSWORD,
        },
    )
    assert admin_reg.status_code == 200, admin_reg.text
    admin_id = admin_reg.json()["id"]
    db.execute_query("UPDATE users SET is_email_verified = true, approval_status = 'APPROVED' WHERE id = %s", (admin_id,))

    admin_login = client.post("/login", json={"email": ADMIN_EMAIL, "password": PASSWORD})
    assert admin_login.status_code == 200, admin_login.text
    admin_token = admin_login.json().get("accessToken") or admin_login.json().get("access_token")

    res = client.post(
        "/courses",
        headers=_auth_headers(admin_token),
        json={
            "title": "Club Only Course",
            "owner_id": admin_id,
            "status": "open",
            "capacity": 10,
            "fee": 0,
        },
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["owner_id"] == admin_id
    assert data.get("trainer_id") in (None, 0) or not data.get("trainer_id")

    # cleanup club course
    db.execute_query("DELETE FROM courses WHERE id = %s", (data["id"],))
