"""
Database migration & column sync script for BandConnect tables.
Ensures all columns defined in band_models.py exist in PostgreSQL.
"""
from sqlalchemy import text
from app.core.database import engine

def sync_band_tables():
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # 1. Band Accounts
            conn.execute(text("""
                ALTER TABLE band_accounts ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
                ALTER TABLE band_accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
                ALTER TABLE band_accounts ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
                ALTER TABLE band_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
            """))

            # 2. Band Artist Profiles
            conn.execute(text("""
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS bio TEXT NULL;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS base_rate FLOAT DEFAULT 0.0;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS rating FLOAT DEFAULT 5.0;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) DEFAULT 'pending';
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS verification_notes VARCHAR(255) NULL;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS display_name VARCHAR(150) NULL;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS username VARCHAR(50) NULL;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(30) NULL;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS years_of_experience INTEGER DEFAULT 0;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255) NULL;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS cover_image VARCHAR(255) NULL;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS band_type VARCHAR(50) DEFAULT 'Solo';
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS total_members INTEGER DEFAULT 1;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS travel_radius FLOAT DEFAULT 0.0;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS travel_charges FLOAT DEFAULT 0.0;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS min_booking_hours FLOAT DEFAULT 0.0;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS max_booking_hours FLOAT DEFAULT 0.0;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS equipment JSON DEFAULT '[]'::json;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS availability JSON DEFAULT '{}'::json;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS social_links JSON DEFAULT '{}'::json;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS achievements JSON DEFAULT '[]'::json;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS documents JSON DEFAULT '[]'::json;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS gallery JSON DEFAULT '[]'::json;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS videos JSON DEFAULT '[]'::json;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS youtube_links JSON DEFAULT '[]'::json;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS instagram_reels JSON DEFAULT '[]'::json;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS pricing_details JSON DEFAULT '{}'::json;
                ALTER TABLE band_artist_profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
            """))

            # 3. Band Venues
            conn.execute(text("""
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS description TEXT NULL;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS city_id INTEGER NULL;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS base_price FLOAT DEFAULT 0.0;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS min_capacity INTEGER DEFAULT 0;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS venue_type VARCHAR(50) NULL;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS business_name VARCHAR(150) NULL;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS contact_details VARCHAR(255) NULL;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS pincode VARCHAR(20) NULL;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS country VARCHAR(100) NULL;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS google_map_location VARCHAR(255) NULL;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) DEFAULT 'pending';
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS verification_notes VARCHAR(255) NULL;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS facilities JSON DEFAULT '[]'::json;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS gallery JSON DEFAULT '[]'::json;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS pricing_details JSON DEFAULT '{}'::json;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS availability_rules JSON DEFAULT '{}'::json;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS documents JSON DEFAULT '{}'::json;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS metadata_fields JSON DEFAULT '{}'::json;
                ALTER TABLE band_venues ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
            """))

            trans.commit()
        except Exception as e:
            trans.rollback()
            raise e
