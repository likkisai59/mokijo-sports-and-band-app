"""
Pytest configuration and global testing fixtures.
Sets up an in-memory testing SQLite database or test PostgreSQL schema.
"""

from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import all models to ensure Base.metadata contains complete schema for create_all
import app.features.auth.models  # noqa
import app.features.artists.models  # noqa
import app.features.venues.models  # noqa
import app.features.bookings.models  # noqa
import app.features.messaging.conversation.models  # noqa
import app.features.messaging.message.models  # noqa
import app.features.notifications.models  # noqa
import app.features.reviews.models  # noqa

from app.core.database import Base, get_db as db_get_db
from app.core.dependencies import get_db as dep_get_db
from main import app as fastapi_app

# Use synchronous sqlite database for unit testing speed
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

@pytest.fixture(autouse=True)
def clear_connection_manager():
    """Ensure WebSocket connection manager active connections are cleared before each test."""
    from app.features.notifications.connection_manager import connection_manager
    connection_manager.active_connections.clear()
    yield
    connection_manager.active_connections.clear()

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Create test tables before suite runs, drop after completion."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session() -> Generator:
    """Yield database session for test isolation."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session) -> Generator[TestClient, None, None]:
    """TestClient yielding endpoint test calls with mocked DB dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    fastapi_app.dependency_overrides[dep_get_db] = override_get_db
    fastapi_app.dependency_overrides[db_get_db] = override_get_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()
