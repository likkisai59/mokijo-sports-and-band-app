-- One-shot migration for Trainer MVP
-- Run against the existing database. create_all does NOT alter existing columns.

-- 1) trainers table (create if missing)
CREATE TABLE IF NOT EXISTS trainers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    phone VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    specialization VARCHAR NOT NULL,
    experience VARCHAR,
    aadhar VARCHAR,
    sports TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_trainers_id ON trainers (id);
CREATE INDEX IF NOT EXISTS ix_trainers_email ON trainers (email);

-- 1b) If trainers already existed with an older shape, add MVP columns
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS specialization VARCHAR;
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS experience VARCHAR;
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS aadhar VARCHAR;
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS sports TEXT;
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- 2) courses: allow trainer-owned rows (no club user)
ALTER TABLE courses ALTER COLUMN owner_id DROP NOT NULL;

-- 3) courses: trainer ownership + reschedule metadata
ALTER TABLE courses ADD COLUMN IF NOT EXISTS trainer_id INTEGER REFERENCES trainers(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS reschedule_reason VARCHAR;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMP;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS start_time VARCHAR;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS end_time VARCHAR;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS days TEXT;

-- Trainer enrollments have no club owner
ALTER TABLE course_registrations ALTER COLUMN owner_id DROP NOT NULL;

-- Razorpay orders for trainer-training enrollments
CREATE TABLE IF NOT EXISTS training_enrollment_orders (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER NOT NULL REFERENCES course_registrations(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR NOT NULL UNIQUE,
    razorpay_payment_id VARCHAR,
    razorpay_signature VARCHAR,
    amount INTEGER NOT NULL,
    currency VARCHAR DEFAULT 'INR',
    status VARCHAR DEFAULT 'created',
    created_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_training_enrollment_orders_registration_id ON training_enrollment_orders (registration_id);
CREATE INDEX IF NOT EXISTS ix_training_enrollment_orders_razorpay_order_id ON training_enrollment_orders (razorpay_order_id);

CREATE INDEX IF NOT EXISTS ix_courses_trainer_id ON courses (trainer_id);
