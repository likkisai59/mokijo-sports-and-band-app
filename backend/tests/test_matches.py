import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

from app.main import app
from app.core.database import Base, get_db
from app.models import models

# In-memory SQLite for testing matches
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_matches.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override get_db dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    
    # Seed owner admin user
    db = TestingSessionLocal()
    user = models.User(
        id=99,
        club_name="Test Club",
        first_name="Admin",
        last_name="Owner",
        email="owner@test.com",
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.close()
    
    yield
    
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test_matches.db"):
        try:
            os.remove("test_matches.db")
        except Exception:
            pass


def test_create_and_manage_match():
    client = TestClient(app)
    
    # 1. Create a match
    match_payload = {
        "owner_id": 99,
        "title": "Local Derby",
        "sport": "Football",
        "match_type": "intra_club",
        "venue": "Pitch A",
        "teams": [
            {"team_name": "Reds", "color": "#FF0000"},
            {"team_name": "Blues", "color": "#0000FF"}
        ]
    }
    
    response = client.post("/matches", json=match_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Local Derby"
    assert data["status"] == "scheduled"
    assert len(data["teams"]) == 2
    assert data["teams"][0]["team_name"] == "Reds"
    
    match_id = data["id"]
    team_a_id = data["teams"][0]["id"]
    team_b_id = data["teams"][1]["id"]
    
    # 2. Get list of matches
    response = client.get("/matches?owner_id=99")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    
    # 3. Connect to WebSocket
    with client.websocket_connect(f"/ws/scoreboard/{match_id}") as websocket:
        # Should receive the initial state immediately
        initial_data = websocket.receive_json()
        assert initial_data["id"] == match_id
        assert initial_data["status"] == "scheduled"
        
        # 4. Start the match (live)
        response = client.patch(f"/matches/{match_id}", json={"status": "live"})
        assert response.status_code == 200
        
        # WebSocket should receive status update broadcast
        status_update = websocket.receive_json()
        assert status_update["status"] == "live"
        assert len(status_update["events"]) >= 1
        
        # 5. Update score
        score_payload = {
            "team_id": team_a_id,
            "new_score": 1,
            "event_type": "goal",
            "description": "Reds scores a majestic header!"
        }
        response = client.patch(f"/matches/{match_id}/score", json=score_payload)
        assert response.status_code == 200
        assert response.json()["teams"][0]["score"] == 1
        
        # WebSocket should receive score update broadcast
        score_broadcast = websocket.receive_json()
        assert score_broadcast["teams"][0]["score"] == 1
        assert any(e["event_type"] == "goal" for e in score_broadcast["events"])
        
        # 6. Complete the match
        response = client.patch(f"/matches/{match_id}", json={"status": "completed"})
        assert response.status_code == 200
        assert response.json()["status"] == "completed"
        assert response.json()["winner_team_id"] == team_a_id
