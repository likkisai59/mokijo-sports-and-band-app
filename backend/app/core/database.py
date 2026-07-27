"""
Database connection and session management.
SQLAlchemy 2.0 style engine and sessionmaker.
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# In production, we'd use connection pooling config
engine = create_engine(
    settings.database_url_sync,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db() -> Generator:
    """
    Database session dependency.
    Yields a database session and closes it after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
