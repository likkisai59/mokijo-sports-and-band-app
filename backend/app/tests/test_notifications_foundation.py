import uuid
import pytest
from app.features.auth.models import User, Role
from app.features.notifications.service import notification_service
from app.core.dependencies import get_current_user, require_role
from app.core.exceptions import NotFoundException
from main import app

@pytest.fixture
def test_setup_data(db_session):
    # Ensure client and admin roles exist
    client_role = db_session.query(Role).filter(Role.name == "client").first()
    if not client_role:
        client_role = Role(id=uuid.uuid4(), name="client", description="Client Role")
        db_session.add(client_role)
    
    admin_role = db_session.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        admin_role = Role(id=uuid.uuid4(), name="admin", description="Admin Role")
        db_session.add(admin_role)
        
    db_session.commit()

    # User 1 (Client)
    user1 = User(
        id=uuid.uuid4(),
        email="user1_notif@example.com",
        password_hash="test",
        name="User One",
        is_active=True,
        is_verified=True
    )
    user1.roles.append(client_role)

    # User 2 (Client)
    user2 = User(
        id=uuid.uuid4(),
        email="user2_notif@example.com",
        password_hash="test",
        name="User Two",
        is_active=True,
        is_verified=True
    )
    user2.roles.append(client_role)

    # Admin User
    admin = User(
        id=uuid.uuid4(),
        email="admin_notif@example.com",
        password_hash="test",
        name="Admin User",
        is_active=True,
        is_verified=True
    )
    admin.roles.append(admin_role)

    db_session.add_all([user1, user2, admin])
    db_session.commit()

    return {
        "user1": user1,
        "user2": user2,
        "admin": admin
    }

def test_notification_creation_and_validation(db_session, test_setup_data):
    user1 = test_setup_data["user1"]
    
    # 1. Successful creation via service
    notif = notification_service.create_notification(
        db=db_session,
        recipient_user_id=user1.id,
        recipient_role="client",
        notification_type="SYSTEM",
        title="Welcome",
        message="Hello World",
        reference_type="System",
        reference_id=uuid.uuid4(),
        metadata={"source": "test"}
    )
    assert notif.user_id == user1.id
    assert notif.recipient_role == "client"
    assert notif.title == "Welcome"
    assert notif.notification_metadata == {"source": "test"}

    # 2. Validation: invalid recipient user raises NotFoundException
    with pytest.raises(NotFoundException):
        notification_service.create_notification(
            db=db_session,
            recipient_user_id=uuid.uuid4(),
            title="Fail",
            message="Will fail"
        )

def test_rbac_and_views(client, db_session, test_setup_data):
    user1 = test_setup_data["user1"]
    user2 = test_setup_data["user2"]
    admin = test_setup_data["admin"]

    # Create a notification for user 1
    notif = notification_service.create_notification(
        db=db_session,
        recipient_user_id=user1.id,
        title="User 1 Notification",
        message="Confidential info"
    )

    # A. User 1 can view own notification details
    app.dependency_overrides[get_current_user] = lambda: {"sub": str(user1.id), "role": "client"}
    res = client.get(f"/api/v1/notifications/{notif.id}")
    assert res.status_code == 200
    assert res.json()["data"]["title"] == "User 1 Notification"

    # B. User 2 cannot view User 1's notification details (RBAC check - Forbidden)
    app.dependency_overrides[get_current_user] = lambda: {"sub": str(user2.id), "role": "client"}
    res = client.get(f"/api/v1/notifications/{notif.id}")
    assert res.status_code == 403

    # C. Admin can view User 1's notification details
    app.dependency_overrides[get_current_user] = lambda: {"sub": str(admin.id), "role": "admin"}
    res = client.get(f"/api/v1/notifications/{notif.id}")
    assert res.status_code == 200

    app.dependency_overrides.clear()

def test_unread_count_and_patch_read(client, db_session, test_setup_data):
    user1 = test_setup_data["user1"]

    n1 = notification_service.create_notification(db=db_session, recipient_user_id=user1.id, title="N1", message="M1")
    _n2 = notification_service.create_notification(db=db_session, recipient_user_id=user1.id, title="N2", message="M2")

    app.dependency_overrides[get_current_user] = lambda: {"sub": str(user1.id), "role": "client"}

    # Fetch unread count (should be 2)
    res = client.get("/api/v1/notifications/unread-count")
    assert res.status_code == 200
    assert res.json()["data"]["unread_count"] == 2

    # PATCH read one notification
    res = client.patch(f"/api/v1/notifications/{n1.id}/read")
    assert res.status_code == 200
    assert res.json()["data"]["is_read"] is True

    # Check unread count (should be 1)
    res = client.get("/api/v1/notifications/unread-count")
    assert res.json()["data"]["unread_count"] == 1

    # PATCH read all
    res = client.patch("/api/v1/notifications/read-all")
    assert res.status_code == 200

    # Check unread count (should be 0)
    res = client.get("/api/v1/notifications/unread-count")
    assert res.json()["data"]["unread_count"] == 0

    app.dependency_overrides.clear()

def test_pagination_and_filtering(client, db_session, test_setup_data):
    user1 = test_setup_data["user1"]
    
    # Create 3 notifications for user 1 with different types/roles
    notification_service.create_notification(db=db_session, recipient_user_id=user1.id, title="A", message="M1", recipient_role="artist", notification_type="BOOKING_CREATED")
    notification_service.create_notification(db=db_session, recipient_user_id=user1.id, title="B", message="M2", recipient_role="client", notification_type="SYSTEM")
    notification_service.create_notification(db=db_session, recipient_user_id=user1.id, title="C", message="M3", recipient_role="client", notification_type="BOOKING_ACCEPTED")

    app.dependency_overrides[get_current_user] = lambda: {"sub": str(user1.id), "role": "client"}

    # Paginate (limit 2)
    res = client.get("/api/v1/notifications?limit=2")
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data["notifications"]) == 2
    assert data["total"] == 3

    # Filter by role
    res = client.get("/api/v1/notifications?recipient_role=artist")
    assert len(res.json()["data"]["notifications"]) == 1
    assert res.json()["data"]["notifications"][0]["title"] == "A"

    # Filter by type
    res = client.get("/api/v1/notifications?notification_type=SYSTEM")
    assert len(res.json()["data"]["notifications"]) == 1
    assert res.json()["data"]["notifications"][0]["title"] == "B"

    app.dependency_overrides.clear()

def test_deletes_and_admin_system_create(client, db_session, test_setup_data):
    user1 = test_setup_data["user1"]
    admin = test_setup_data["admin"]

    notif = notification_service.create_notification(db=db_session, recipient_user_id=user1.id, title="T1", message="M1")

    # 1. Admin System notification creation via POST /notifications
    app.dependency_overrides[require_role(["admin"])] = lambda: {"sub": str(admin.id), "role": "admin"}
    app.dependency_overrides[get_current_user] = lambda: {"sub": str(admin.id), "role": "admin"}

    payload = {
        "recipient_user_id": str(user1.id),
        "recipient_role": "client",
        "notification_type": "SYSTEM",
        "title": "Admin Broadcast",
        "message": "Maintenance tonight",
        "metadata": {"urgent": True}
    }
    res = client.post("/api/v1/notifications", json=payload)
    assert res.status_code == 201
    assert res.json()["data"]["title"] == "Admin Broadcast"

    # 2. Delete notification
    app.dependency_overrides[get_current_user] = lambda: {"sub": str(user1.id), "role": "client"}
    res = client.delete(f"/api/v1/notifications/{notif.id}")
    assert res.status_code == 200

    # Ensure it is soft-deleted
    db_session.refresh(notif)
    assert notif.deleted_at is not None

    # 3. Bulk delete all
    res = client.delete("/api/v1/notifications")
    assert res.status_code == 200

    app.dependency_overrides.clear()
