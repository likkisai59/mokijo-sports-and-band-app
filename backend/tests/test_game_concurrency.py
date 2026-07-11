import time
import pytest
import threading
import uuid
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import models
from app.models.models import Base, User, Venue, Game, GamePlayer, GameWaitlist
from app.services.hold_expiry import redis_client


import os

# Setup a clean, independent file-based database to allow thread sharing in SQLite
TEST_DATABASE_URL = "sqlite:///test_concurrency.db"

if os.path.exists("test_concurrency.db"):
    try:
        os.remove("test_concurrency.db")
    except Exception:
        pass

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from sqlalchemy import event

@event.listens_for(engine, "connect")
def do_connect(dbapi_connection, connection_record):
    dbapi_connection.isolation_level = None

@event.listens_for(engine, "begin")
def do_begin(conn):
    conn.exec_driver_sql("BEGIN IMMEDIATE")


@pytest.fixture(scope="function", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Pre-populate sample host user and join candidates
    host = models.User(id=1, first_name="Host", email="host@example.com")
    player1 = models.User(id=2, first_name="Player 1", email="p1@example.com")
    player2 = models.User(id=3, first_name="Player 2", email="p2@example.com")
    venue = models.Venue(id=1, name="Stamina Arena", location="Vuda Colony, Vizag", sports_supported='["badminton","football"]')
    db.add_all([host, player1, player2, venue])
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test_concurrency.db"):
        try:
            os.remove("test_concurrency.db")
        except Exception:
            pass



def test_join_game_concurrency():
    """Verify that when multiple concurrent requests attempt to join a game with 1 slot left, only one succeeds."""
    db = TestingSessionLocal()
    
    # Create a game with total_spots=2 (1 spot for host, 1 spot open for others)
    game_id = str(uuid.uuid4())
    game = models.Game(
        id=game_id,
        host_id=1,
        venue_id=1,
        sport="badminton",
        slot_start=datetime.utcnow() + timedelta(days=1),
        slot_end=datetime.utcnow() + timedelta(days=1, hours=1),
        total_spots=2,
        current_players=1,
        price_per_player=150.0,
        join_policy="instant",
        visibility="public",
        status="open"
    )
    db.add(game)
    
    # Add host as a confirmed player
    host_player = models.GamePlayer(game_id=game_id, user_id=1, status="confirmed")
    db.add(host_player)
    db.commit()
    db.close()

    results = []
    barrier = threading.Barrier(2)  # Synchronize thread start times to maximize race condition probability

    def join_attempt(user_id):
        thread_db = TestingSessionLocal()
        barrier.wait()  # Synchronize execution start
        
        try:
            # 1. Lock game row
            g = thread_db.query(models.Game).filter(models.Game.id == game_id).with_for_update().first()
            
            # Check availability
            if g.current_players >= g.total_spots:
                results.append((user_id, "full"))
                thread_db.commit()
                return

            # Simulate logic inside join_game endpoint
            player = models.GamePlayer(
                game_id=game_id,
                user_id=user_id,
                status="pending_payment"
            )
            thread_db.add(player)
            g.current_players += 1
            if g.current_players >= g.total_spots:
                g.status = "full"
            
            thread_db.commit()
            results.append((user_id, "success"))
        except Exception as e:
            thread_db.rollback()
            results.append((user_id, f"error: {str(e)}"))
        finally:
            thread_db.close()

    t1 = threading.Thread(target=join_attempt, args=(2,))
    t2 = threading.Thread(target=join_attempt, args=(3,))

    t1.start()
    t2.start()
    t1.join()
    t2.join()

    # Assertions:
    # One user must succeed ("success"), and the other must be blocked ("full")
    statuses = [res[1] for res in results]
    assert "success" in statuses, "One player should have successfully joined."
    assert "full" in statuses, "The other player should have been blocked because the lobby became full."

    # Validate final state of database
    verify_db = TestingSessionLocal()
    g_final = verify_db.query(models.Game).filter(models.Game.id == game_id).first()
    assert g_final.current_players == 2
    assert g_final.status == "full"
    
    confirmed_players = verify_db.query(models.GamePlayer).filter(
        models.GamePlayer.game_id == game_id,
        models.GamePlayer.status.in_(["confirmed", "pending_payment"])
    ).count()
    assert confirmed_players == 2
    verify_db.close()
