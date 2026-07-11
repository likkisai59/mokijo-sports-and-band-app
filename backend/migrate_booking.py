import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    if not DATABASE_URL:
        print("DATABASE_URL is not set")
        return
    print(f"Connecting to database: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        # 1. Create courts table
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS courts (
                    id SERIAL PRIMARY KEY,
                    venue_id INTEGER REFERENCES venues(id) ON DELETE CASCADE,
                    name VARCHAR NOT NULL,
                    sport_type VARCHAR NOT NULL,
                    capacity INTEGER DEFAULT 4,
                    price_per_hour INTEGER
                );
            """))
            print("Table 'courts' created successfully or already exists.")
        except Exception as e:
            print("Error creating 'courts' table:", e)

        # 2. Add columns to slots table
        slot_cols = [
            ("court_id", "INTEGER REFERENCES courts(id) ON DELETE SET NULL"),
            ("status", "VARCHAR DEFAULT 'AVAILABLE'"),
            ("held_until", "TIMESTAMP"),
            ("held_by_user_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL")
        ]
        for col, col_type in slot_cols:
            try:
                conn.execute(text(f"ALTER TABLE slots ADD COLUMN IF NOT EXISTS {col} {col_type};"))
                print(f"Column '{col}' added to slots successfully or already exists.")
            except Exception as e:
                print(f"Error adding '{col}' to slots:", e)

        # 3. Add columns to venues table
        venue_cols = [
            ("description", "TEXT"),
            ("base_price_per_hour", "INTEGER DEFAULT 0")
        ]
        for col, col_type in venue_cols:
            try:
                conn.execute(text(f"ALTER TABLE venues ADD COLUMN IF NOT EXISTS {col} {col_type};"))
                print(f"Column '{col}' added to venues successfully or already exists.")
            except Exception as e:
                print(f"Error adding '{col}' to venues:", e)

        # 4. Add columns to bookings table
        booking_cols = [
            ("court_id", "INTEGER REFERENCES courts(id) ON DELETE SET NULL"),
            ("payment_id", "VARCHAR"),
            ("cancelled_at", "TIMESTAMP"),
            ("cancellation_reason", "VARCHAR")
        ]
        for col, col_type in booking_cols:
            try:
                conn.execute(text(f"ALTER TABLE bookings ADD COLUMN IF NOT EXISTS {col} {col_type};"))
                print(f"Column '{col}' added to bookings successfully or already exists.")
            except Exception as e:
                print(f"Error adding '{col}' to bookings:", e)

        # 5. Make slot_id nullable in bookings
        try:
            conn.execute(text("ALTER TABLE bookings ALTER COLUMN slot_id DROP NOT NULL;"))
            print("Dropped NOT NULL constraint from 'slot_id' in bookings.")
        except Exception as e:
            print("Note on slot_id constraint modification:", e)

        # 6. Create reviews table
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS reviews (
                    id SERIAL PRIMARY KEY,
                    venue_id INTEGER REFERENCES venues(id) ON DELETE CASCADE,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
                    rating INTEGER NOT NULL,
                    comment TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            print("Table 'reviews' created successfully or already exists.")
        except Exception as e:
            print("Error creating 'reviews' table:", e)

        # 7. Create booking_slots join table
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS booking_slots (
                    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
                    slot_id INTEGER REFERENCES slots(id) ON DELETE CASCADE,
                    PRIMARY KEY (booking_id, slot_id)
                );
            """))
            print("Table 'booking_slots' created successfully or already exists.")
        except Exception as e:
            print("Error creating 'booking_slots' table:", e)

        conn.commit()
    print("Database migration finished.")

if __name__ == "__main__":
    migrate()
