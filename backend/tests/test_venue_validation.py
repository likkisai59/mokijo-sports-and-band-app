import pytest
import json
from datetime import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.models import MukijoAdmin
from app.core.security import hash_password

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_test_data():
    db = SessionLocal()
    # Check/Create test platform admin
    admin = db.query(MukijoAdmin).filter(MukijoAdmin.email == "testadmin@mukijo.com").first()
    if not admin:
        admin = MukijoAdmin(
            full_name="Test Platform Admin",
            email="testadmin@mukijo.com",
            password=hash_password("AdminPass123"),
            is_active=True
        )
        db.add(admin)
        db.commit()
    db.close()
    yield

def test_venue_verification_workflow(setup_test_data):
    # 1. Login as Platform Admin
    login_res = client.post("/mukijo-admin/login", json={
        "email": "testadmin@mukijo.com",
        "password": "AdminPass123"
    })
    assert login_res.status_code == 200, login_res.text
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Register a new venue owner with their venue (with 3 photos)
    owner_email = f"owner_val_{datetime.now().timestamp()}@test.com"
    owner_reg = client.post("/venue-owner/register", json={
        "owner": {
            "full_name": "Test Owner",
            "email": owner_email,
            "phone": "9876543210",
            "password": "OwnerPassword123"
        },
        "venues": [
            {
                "name": "Validation Test Court",
                "location": "Aesthetic Street 12",
                "sports_supported": '["badminton"]',
                "amenities": '["Parking"]',
                "venue_images": '["https://example.com/img1.jpg", "https://example.com/img2.jpg", "https://example.com/img3.jpg"]'
            }
        ]
    })
    assert owner_reg.status_code == 200, owner_reg.text
    owner_id = owner_reg.json()["ownerId"]

    # Retrieve registered venue
    owner_login = client.post("/venue-owner/login", json={
        "email": owner_email,
        "password": "OwnerPassword123"
    })
    assert owner_login.status_code == 200, owner_login.text
    owner_token = owner_login.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}

    venues_res = client.get(f"/venue-owner/{owner_id}/venues", headers=owner_headers)
    assert venues_res.status_code == 200, venues_res.text
    owner_venues = venues_res.json()
    assert len(owner_venues) > 0
    venue_id = owner_venues[0]["id"]
    assert owner_venues[0]["verification_status"] == "DRAFT"

    # Create slot for the venue to test bookings / holds
    slot_create_res = client.post(f"/venues/{venue_id}/slots", json=[
        {
            "venue_id": venue_id,
            "sport": "badminton",
            "start_time": "2026-07-20T10:00:00",
            "end_time": "2026-07-20T11:00:00",
            "base_price": 500,
            "current_price": 500,
            "is_blocked": False
        }
    ], headers=owner_headers)
    assert slot_create_res.status_code == 200, slot_create_res.text
    slot_id = slot_create_res.json()[0]["id"]

    # 3. Check public search - DRAFT venue must not be visible
    search_res = client.get("/venues", headers=headers)
    assert search_res.status_code == 200
    all_venues = search_res.json()
    assert not any(v["id"] == venue_id for v in all_venues), "DRAFT venue was returned in search results"

    # 4. Attempt to book / hold slot - should be blocked since venue is not verified
    hold_res = client.post("/bookings/hold", json={
        "venue_id": venue_id,
        "slot_ids": [slot_id],
        "user_id": 9
    }, headers=headers)
    assert hold_res.status_code == 400, hold_res.text
    assert "not verified" in hold_res.json()["detail"].lower()

    # 5. Submit verification documents & GPS coordinates
    gps_res = client.post(f"/venues/{venue_id}/gps-location", json={
        "latitude": 12.9716,
        "longitude": 77.5946
    }, headers=owner_headers)
    assert gps_res.status_code == 200, gps_res.text

    # Upload document
    doc_res = client.post(f"/venues/{venue_id}/documents", json={
        "document_type": "business_registration",
        "document_label": "GST",
        "file_path": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "original_filename": "gst.png",
        "file_size": 100,
        "mime_type": "image/png"
    }, headers=owner_headers)
    assert doc_res.status_code == 200, doc_res.text

    # Submit verification application
    submit_res = client.post(f"/venues/{venue_id}/submit-verification", json={
        "contact_phone": "9999999999",
        "contact_email": "court@validation.com",
        "city": "Bengaluru",
        "state_name": "Karnataka",
        "postal_code": "560001"
    }, headers=owner_headers)
    assert submit_res.status_code == 200, submit_res.text
    assert submit_res.json()["verification_status"] == "PENDING_VERIFICATION"

    # 6. Admin starts review
    review_start = client.post(f"/admin/venues/{venue_id}/start-review", json={"notes": "Starting review process"}, headers=headers)
    assert review_start.status_code == 200, review_start.text

    # Check status is UNDER_REVIEW
    detail_res = client.get(f"/admin/venues/{venue_id}/review", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["venue"]["verification_status"] == "UNDER_REVIEW"

    # 7. Non-admin approval attempt - should fail
    fail_approve = client.post(f"/admin/venues/{venue_id}/approve", json={"notes": "Try bypass"}, headers={})
    assert fail_approve.status_code in (401, 403)

    # 8. Admin approves
    approve_res = client.post(f"/admin/venues/{venue_id}/approve", json={"notes": "All looks good"}, headers=headers)
    assert approve_res.status_code == 200, approve_res.text

    # 9. Verify in search results
    search_verified = client.get("/venues", headers=headers)
    assert search_verified.status_code == 200
    all_venues_verified = search_verified.json()
    assert any(v["id"] == venue_id for v in all_venues_verified), "VERIFIED venue not found in search results"
