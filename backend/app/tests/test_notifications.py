import uuid
from app.features.auth.models import User
from app.features.notifications.models import Notification
from app.core.dependencies import get_current_user
from main import app

def test_notifications_endpoints(client, db_session):
    # 1. Create a mock user
    user = User(
        id=uuid.uuid4(),
        email="notif_test@example.com",
        password_hash="test",
        name="Notif Tester",
        is_active=True,
        is_verified=True
    )
    db_session.add(user)
    db_session.commit()

    # 2. Add some test notifications
    n1 = Notification(
        id=uuid.uuid4(),
        user_id=user.id,
        title="Test Notification 1",
        message="Message 1 details",
        is_read=False
    )
    n2 = Notification(
        id=uuid.uuid4(),
        user_id=user.id,
        title="Test Notification 2",
        message="Message 2 details",
        is_read=False
    )
    db_session.add(n1)
    db_session.add(n2)
    db_session.commit()

    # 3. Override get_current_user dependency for authenticated testing
    async def override_get_current_user():
        return {"sub": str(user.id), "role": "client"}

    app.dependency_overrides[get_current_user] = override_get_current_user

    try:
        # 4. Fetch notifications
        response = client.get("/api/v1/notifications")
        assert response.status_code == 200
        data = response.json()["data"]
        assert len(data["notifications"]) == 2
        assert data["total"] == 2

        # 5. Mark one notification as read
        read_response = client.put(f"/api/v1/notifications/{n1.id}/read")
        assert read_response.status_code == 200
        assert read_response.json()["data"]["is_read"] is True

        # Refresh database state
        db_session.refresh(n1)
        assert n1.is_read is True

        # 6. Mark all as read
        read_all_response = client.put("/api/v1/notifications/read-all")
        assert read_all_response.status_code == 200
        
        db_session.refresh(n2)
        assert n2.is_read is True

    finally:
        app.dependency_overrides.pop(get_current_user, None)
