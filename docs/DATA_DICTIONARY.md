# BandConnect — Real Database Data Dictionary

> **Document Type**: Database Architecture Evidence Report
> **Generated From**: Live PostgreSQL inspection + SQLAlchemy model audit + Alembic migration history
> **Database**: `bandconnect` on `localhost:5432` (PostgreSQL)
> **Database URL Env Var**: `DATABASE_URL`
> **Database Revision**: `9f956581e2de` (HEAD — CLEAN)
> **Generated**: 2026-07-15
> **Status**: READ-ONLY DISCOVERY — No code or schema was modified

---

## 1. DOCUMENT INFORMATION

| Property | Value |
|----------|-------|
| Project | BandConnect — Music Band Booking Platform |
| Database Engine | PostgreSQL |
| Database Name | `bandconnect` |
| ORM | SQLAlchemy 2.0 |
| Migration Tool | Alembic |
| Applied Revision | `9f956581e2de` |
| Alembic HEAD | `9f956581e2de` |
| Migration State | **CLEAN** — DB revision equals HEAD |

---

## 2. EXECUTIVE DATABASE SUMMARY

| Metric | Count |
|--------|-------|
| Application Tables (PostgreSQL public schema) | **22** |
| SQLAlchemy Models (concrete) | **18** |
| Junction / Association Tables | **4** |
| PostgreSQL Sequences | **1** (`venue_number_seq`) |
| Total Indexes | **82** |
| Unique Indexes | **20** |
| Foreign Keys | **29** |
| Alembic Migration Files | **15** |

### Live Row Counts (2026-07-15)

| Table | Rows |
|-------|------|
| users | 19 |
| roles | 4 |
| user_roles | 19 |
| refresh_tokens | 11 |
| artist_profiles | 4 |
| artist_genres | 2 |
| artist_languages | 2 |
| venues | 3 |
| categories | 4 |
| cities | 3 |
| states | 3 |
| countries | 1 |
| bookings | 0 |
| notifications | 0 |
| reviews | 0 |
| transactions | 0 |
| areas | 0 |
| audit_logs | 0 |
| system_settings | 0 |

---

## 3. DATABASE ARCHITECTURE OVERVIEW

```
COUNTRY → STATE → CITY → (used by Venue as FK)
                         (ArtistProfile uses plain text city/state — INCONSISTENCY)

USER
  ├── many-to-many → ROLE (via user_roles)
  ├── one-to-one   → ARTIST_PROFILE (UNIQUE on artist_profiles.user_id)
  ├── one-to-many  → VENUE (no unique constraint; one owner can have multiple venues)
  ├── one-to-many  → REFRESH_TOKEN (cascade delete)
  ├── one-to-many  → NOTIFICATION (cascade delete)
  ├── one-to-many  → AUDIT_LOG (set null on delete)
  └── one-to-many  → BOOKING as CLIENT

ARTIST_PROFILE
  ├── many-to-many → CATEGORY (via artist_genres, type='music_genre')
  ├── many-to-many → CATEGORY (via artist_languages, type='language')
  ├── one-to-many  → BOOKING as ARTIST
  ├── one-to-many  → REVIEW as REVIEWED_ARTIST
  └── one-to-many  → TRANSACTION

VENUE
  ├── many-to-one  → CITY (FK, RESTRICT delete)
  ├── many-to-many → CATEGORY (via venue_categories, type='venue_category')
  ├── one-to-many  → BOOKING as VENUE
  ├── one-to-many  → REVIEW as REVIEWED_VENUE
  └── one-to-many  → TRANSACTION

BOOKING
  ├── many-to-one (nullable) → ARTIST_PROFILE
  ├── many-to-one (nullable) → VENUE
  ├── many-to-one (not-null) → USER (client)
  └── one-to-many            → REVIEW (set null on delete)

ROLE → many-to-many → PERMISSION (via role_permissions)
PERMISSION → many-to-one (nullable) → PERMISSION_GROUP
CATEGORY (unified taxonomy — genres, languages, venue categories)
```

---

## 4. MODULE TABLE OWNERSHIP MAP

| Module | Tables |
|--------|--------|
| Authentication | users, roles, permissions, permission_groups, user_roles, role_permissions, refresh_tokens |
| Artist / Band | artist_profiles, artist_genres, artist_languages |
| Venue | venues, venue_categories |
| Location / Taxonomy | countries, states, cities, areas, categories |
| Booking | bookings |
| Notification | notifications |
| Review | reviews |
| Earnings / Transaction | transactions |
| Audit / Settings | audit_logs, system_settings |
| Migration Infrastructure | alembic_version |

---

## 5. COMPLETE TABLE INVENTORY

| Table Name | SQLAlchemy Model | First Migration | Status |
|-----------|-----------------|----------------|--------|
| users | `User` | 3a5d795e03a2 | ACTIVE — CANONICAL |
| roles | `Role` | 3a5d795e03a2 | ACTIVE — CANONICAL |
| permissions | `Permission` | 3a5d795e03a2 | ACTIVE — SUPPORTING |
| permission_groups | `PermissionGroup` | 3a5d795e03a2 | ACTIVE — SUPPORTING |
| user_roles | Junction Table | 3a5d795e03a2 | ACTIVE — CANONICAL |
| role_permissions | Junction Table | 3a5d795e03a2 | ACTIVE — SUPPORTING |
| refresh_tokens | `RefreshToken` | 3a5d795e03a2 | ACTIVE — CANONICAL |
| artist_profiles | `ArtistProfile` | 3a5d795e03a2 | ACTIVE — CANONICAL |
| artist_genres | Junction Table | 3a5d795e03a2 | ACTIVE — CANONICAL |
| artist_languages | Junction Table | 3a5d795e03a2 | ACTIVE — CANONICAL |
| venues | `Venue` | 3a5d795e03a2 | ACTIVE — CANONICAL |
| venue_categories | Junction Table | 3a5d795e03a2 | ACTIVE — CANONICAL |
| categories | `Category` | 3a5d795e03a2 | ACTIVE — CANONICAL |
| countries | `Country` | 3a5d795e03a2 | ACTIVE — CANONICAL |
| states | `State` | 3a5d795e03a2 | ACTIVE — CANONICAL |
| cities | `City` | 3a5d795e03a2 | ACTIVE — CANONICAL |
| areas | `Area` | 3a5d795e03a2 | ACTIVE — SUPPORTING (0 rows) |
| bookings | `Booking` | 47a1ac7dafe1 | ACTIVE — CANONICAL |
| notifications | `Notification` | 8f4d17d6bad4 | ACTIVE — CANONICAL |
| reviews | `Review` | 000c8e994a91 | ACTIVE — CANONICAL |
| transactions | `Transaction` | d251fbf76528 | FOUNDATION ONLY |
| audit_logs | `AuditLog` | 3a5d795e03a2 | ACTIVE — SUPPORTING (unwired) |
| system_settings | `SystemSetting` | 3a5d795e03a2 | ACTIVE — SUPPORTING (0 rows) |
| alembic_version | N/A | N/A | MIGRATION INFRASTRUCTURE |

---

## 6. COMPLETE COLUMN DATA DICTIONARY

---

### TABLE: `users`

**BUSINESS PURPOSE**: Core authentication entity. Every BandConnect account is a `User` row.
**DOMAIN**: Authentication | **MODEL FILE**: `backend/app/features/auth/models.py`

| Column | DB Type | Nullable | Default | PK | FK | Unique | Indexed | Business Meaning |
|--------|---------|----------|---------|----|----|--------|---------|-----------------|
| id | uuid | NOT NULL | uuid4() | YES | — | YES (PK) | YES | Surrogate PK |
| email | varchar(255) | NOT NULL | — | — | — | YES | YES | Unique login credential and communication address |
| password_hash | varchar(255) | NOT NULL | — | — | — | — | — | Bcrypt hash; never stored in plain text |
| name | varchar(150) | NOT NULL | — | — | — | — | — | Legal or display name at registration |
| is_active | boolean | NOT NULL | true | — | — | — | — | false = account suspended |
| is_verified | boolean | NOT NULL | false | — | — | — | — | true after email verification link is clicked |
| last_verification_sent_at | timestamptz | NULL | — | — | — | — | — | Used to enforce 60-second verification email resend cooldown |
| created_at | timestamptz | NOT NULL | now() | — | — | — | — | Account creation timestamp |
| updated_at | timestamptz | NOT NULL | now() | — | — | — | — | Last-modified timestamp |
| deleted_at | timestamptz | NULL | — | — | — | — | — | Soft-delete; NULL = active |

---

### TABLE: `roles`

**BUSINESS PURPOSE**: Named roles defining platform access. Canonical roles: `client`, `artist`, `venue_owner`, `admin`.
**DOMAIN**: Authentication / RBAC | **MODEL FILE**: `backend/app/features/auth/models.py`

| Column | DB Type | Nullable | Default | PK | Unique | Indexed | Business Meaning |
|--------|---------|----------|---------|----|----|---------|-----------------|
| id | uuid | NOT NULL | uuid4() | YES | YES (PK) | YES | Surrogate PK |
| name | varchar(50) | NOT NULL | — | — | YES | YES | Role identifier (e.g., `client`, `artist`, `venue_owner`, `admin`) |
| description | varchar(255) | NULL | — | — | — | — | Human-readable role explanation |
| created_at | timestamptz | NOT NULL | now() | — | — | — | Creation timestamp |
| updated_at | timestamptz | NOT NULL | now() | — | — | — | Last-modified |
| deleted_at | timestamptz | NULL | — | — | — | — | Soft-delete |

---

### TABLE: `permissions`

**BUSINESS PURPOSE**: Granular capability tokens that can be assigned to roles.
**DOMAIN**: Authentication / RBAC | **MODEL FILE**: `backend/app/features/auth/models.py`
> ⚠️ Currently 0 rows seeded.

| Column | DB Type | Nullable | Default | PK | FK | Unique | Business Meaning |
|--------|---------|----------|---------|----|----|--------|-----------------|
| id | uuid | NOT NULL | uuid4() | YES | — | YES (PK) | Surrogate PK |
| name | varchar(100) | NOT NULL | — | — | — | YES | Permission token (e.g., `booking:create`) |
| description | varchar(255) | NULL | — | — | — | — | Capability description |
| group_id | uuid | NULL | — | — | permission_groups.id SET NULL | — | Optional grouping |
| created_at | timestamptz | NOT NULL | now() | — | — | — | Creation timestamp |
| updated_at | timestamptz | NOT NULL | now() | — | — | — | Last-modified |
| deleted_at | timestamptz | NULL | — | — | — | — | Soft-delete |

---

### TABLE: `permission_groups`

**BUSINESS PURPOSE**: Logical groupings of permissions for administrative organization.
> ⚠️ Currently 0 rows.

| Column | DB Type | Nullable | Unique | Business Meaning |
|--------|---------|----------|--------|-----------------|
| id | uuid | NOT NULL | YES (PK) | Surrogate PK |
| name | varchar(100) | NOT NULL | YES | Group name |
| description | varchar(255) | NULL | — | Purpose description |
| created_at | timestamptz | NOT NULL | — | Creation timestamp |
| updated_at | timestamptz | NOT NULL | — | Last-modified |
| deleted_at | timestamptz | NULL | — | Soft-delete |

---

### TABLE: `refresh_tokens`

**BUSINESS PURPOSE**: Persistent JWT refresh token storage for secure session management and revocation.
**DOMAIN**: Authentication | **MODEL FILE**: `backend/app/features/auth/models.py`

| Column | DB Type | Nullable | Default | PK | FK | Unique | Business Meaning |
|--------|---------|----------|---------|----|----|--------|-----------------|
| id | uuid | NOT NULL | uuid4() | YES | — | YES (PK) | Surrogate PK |
| user_id | uuid | NOT NULL | — | — | users.id CASCADE | — | Token owner |
| token_hash | varchar(255) | NOT NULL | — | — | — | YES | Hashed raw token; never stored plain |
| expires_at | timestamptz | NOT NULL | — | — | — | — | Absolute expiry |
| is_revoked | boolean | NOT NULL | false | — | — | — | true when session explicitly logged out |
| created_at | timestamptz | NOT NULL | now() | — | — | — | Token issuance timestamp |
| updated_at | timestamptz | NOT NULL | now() | — | — | — | Last-modified |
| deleted_at | timestamptz | NULL | — | — | — | — | Soft-delete |

---

### TABLE: `artist_profiles`

**BUSINESS PURPOSE**: Complete professional profile for an Artist or Band. One per user (enforced by UNIQUE on user_id).
**DOMAIN**: Artist | **MODEL FILE**: `backend/app/features/artists/models.py`

| Column | DB Type | Nullable | Default | PK | FK | Unique | Indexed | Business Meaning |
|--------|---------|----------|---------|----|----|--------|---------|-----------------|
| id | uuid | NOT NULL | uuid4() | YES | — | YES (PK) | YES | Surrogate PK |
| user_id | uuid | NOT NULL | — | — | users.id CASCADE | YES | YES | Owner user; UNIQUE = one profile per user |
| username | varchar(30) | NULL | — | — | — | YES | YES | Public @handle (without @). Case-sensitive at DB level. |
| display_name | varchar(150) | NULL | — | — | — | — | — | Stage name / band name |
| bio | varchar(2000) | NULL | — | — | — | — | — | Artist description |
| mobile_number | varchar(30) | NULL | — | — | — | — | — | Contact phone; NOT in public API |
| years_of_experience | integer | NOT NULL | 0 | — | — | — | — | Self-reported experience years |
| profile_image | varchar(255) | NULL | — | — | — | — | — | Profile/avatar image URL |
| cover_image | varchar(255) | NULL | — | — | — | — | — | Cover/banner image URL |
| city | varchar(100) | NULL | — | — | — | — | YES | Plain-text city (NOT FK — see Location section) |
| state | varchar(100) | NULL | — | — | — | — | — | Plain-text state |
| band_type | varchar(50) | NOT NULL | Solo | — | — | — | — | Solo, Duo, Trio, 4 Members, 5+ Members |
| total_members | integer | NOT NULL | 1 | — | — | — | — | Exact headcount |
| base_rate | numeric(10,2) | NOT NULL | 0.0 | — | — | — | — | Base performance fee |
| currency | varchar(10) | NOT NULL | INR | — | — | — | — | Currency code |
| travel_radius | numeric(10,2) | NOT NULL | 0.0 | — | — | — | — | Max travel distance (km) |
| travel_charges | numeric(10,2) | NOT NULL | 0.0 | — | — | — | — | Additional travel fee |
| min_booking_hours | numeric(10,2) | NOT NULL | 0.0 | — | — | — | — | Minimum event duration (hours) |
| max_booking_hours | numeric(10,2) | NOT NULL | 0.0 | — | — | — | — | Maximum event duration (hours) |
| rating | numeric(2,1) | NOT NULL | 5.0 | — | — | — | — | Aggregate rating 1.0-5.0 |
| verification_status | varchar(30) | NOT NULL | pending | — | — | — | YES | pending / approved / rejected |
| verification_notes | varchar(255) | NULL | — | — | — | — | — | Admin rejection reason |
| equipment | json | NOT NULL | {} | — | — | — | — | `{"mic": bool, "own_speaker": bool}` |
| availability | json | NOT NULL | {} | — | — | — | — | Weekly schedule, blocked dates, holidays |
| social_links | json | NOT NULL | {} | — | — | — | — | Instagram, Facebook, Twitter, Website URLs |
| achievements | json | NOT NULL | [] | — | — | — | — | List of award strings |
| documents | json | NOT NULL | [] | — | — | — | — | Verification docs; NOT in public API |
| gallery | json | NOT NULL | [] | — | — | — | — | Image URL list |
| videos | json | NOT NULL | [] | — | — | — | — | Video URL list |
| youtube_links | json | NOT NULL | [] | — | — | — | — | YouTube video URLs |
| instagram_reels | json | NOT NULL | [] | — | — | — | — | Instagram reel URLs |
| pricing_details | json | NOT NULL | {} | — | — | — | — | Extended pricing (packages, special offers) |
| created_at | timestamptz | NOT NULL | now() | — | — | — | — | Profile creation |
| updated_at | timestamptz | NOT NULL | now() | — | — | — | — | Last-modified |
| deleted_at | timestamptz | NULL | — | — | — | — | — | Soft-delete |

---

### TABLE: `venues`

**BUSINESS PURPOSE**: Event space listing. One user can own multiple venues (no UNIQUE on user_id).
**DOMAIN**: Venue | **MODEL FILE**: `backend/app/features/venues/models.py`

| Column | DB Type | Nullable | Default | PK | FK | Unique | Indexed | Business Meaning |
|--------|---------|----------|---------|----|----|--------|---------|-----------------|
| id | uuid | NOT NULL | uuid4() | YES | — | YES (PK) | YES | Surrogate PK |
| user_id | uuid | NOT NULL | — | — | users.id CASCADE | — | YES | Owner (venue_owner); no UNIQUE |
| name | varchar(150) | NOT NULL | — | — | — | — | YES | Venue display name (not globally unique) |
| venue_number | varchar(50) | NULL | — | — | — | YES | YES | BCV-XXXXXX system-generated identifier |
| description | varchar(2000) | NULL | — | — | — | — | — | Detailed venue description |
| address | varchar(255) | NOT NULL | — | — | — | — | — | Full street address |
| city_id | uuid | NOT NULL | — | — | cities.id RESTRICT | — | YES | Normalized city FK |
| base_price | numeric(10,2) | NOT NULL | 0.0 | — | — | — | — | Base booking price |
| capacity | integer | NOT NULL | 0 | — | — | — | — | Maximum guest capacity |
| min_capacity | integer | NOT NULL | 0 | — | — | — | — | Minimum guest count |
| venue_type | varchar(50) | NULL | — | — | — | — | — | Marriage Hall, Resort, etc. |
| business_name | varchar(150) | NULL | — | — | — | — | — | Legal business name |
| contact_details | varchar(255) | NULL | — | — | — | — | — | Contact phone/email |
| pincode | varchar(20) | NULL | — | — | — | — | — | Postal code |
| state | varchar(100) | NULL | — | — | — | — | — | Plain-text state (redundant alongside city_id hierarchy) |
| country | varchar(100) | NULL | — | — | — | — | — | Plain-text country (redundant) |
| google_map_location | varchar(255) | NULL | — | — | — | — | — | Google Maps URL/embed |
| verification_status | varchar(30) | NOT NULL | pending | — | — | — | YES | pending / approved / rejected |
| verification_notes | varchar(255) | NULL | — | — | — | — | — | Admin rejection reason |
| facilities | json | NOT NULL | [] | — | — | — | — | ["sound_system", "stage", "valet_parking"] |
| gallery | json | NOT NULL | [] | — | — | — | — | Image URL list |
| pricing_details | json | NOT NULL | {} | — | — | — | — | hourly, half-day, security deposit, etc. |
| availability_rules | json | NOT NULL | {} | — | — | — | — | Weekly schedule, blocked dates, buffer time |
| documents | json | NOT NULL | {} | — | — | — | — | doc_pan, doc_gst, doc_ownership_proof, etc. |
| metadata_fields | json | NOT NULL | {} | — | — | — | — | gst_number, pan_number, indoor_outdoor, etc. |
| created_at | timestamptz | NOT NULL | now() | — | — | — | — | Creation timestamp |
| updated_at | timestamptz | NOT NULL | now() | — | — | — | — | Last-modified |
| deleted_at | timestamptz | NULL | — | — | — | — | — | Soft-delete |

---

### TABLE: `bookings`

**BUSINESS PURPOSE**: Client booking requests for artists or venues. Either or both `artist_profile_id` / `venue_id` can be set.
**DOMAIN**: Booking | **MODEL FILE**: `backend/app/features/bookings/models.py`
> ⚠️ No database CHECK constraint enforces that at least one provider is specified — application-level only.

| Column | DB Type | Nullable | Default | PK | FK | Unique | Indexed | Business Meaning |
|--------|---------|----------|---------|----|----|--------|---------|-----------------|
| id | uuid | NOT NULL | uuid4() | YES | — | YES (PK) | YES | Surrogate PK |
| client_id | uuid | NOT NULL | — | — | users.id CASCADE | — | YES | Client user |
| artist_profile_id | uuid | NULL | — | — | artist_profiles.id CASCADE | — | YES | Target artist; NULL for venue-only bookings |
| venue_id | uuid | NULL | — | — | venues.id CASCADE | — | YES | Target venue; NULL for artist-only bookings |
| event_name | varchar(100) | NOT NULL | — | — | — | — | — | Event name (e.g., "Wedding Reception") |
| event_date | date | NOT NULL | — | — | — | — | YES | Scheduled date |
| start_time | time | NOT NULL | — | — | — | — | — | Start time |
| end_time | time | NOT NULL | — | — | — | — | — | End time |
| location | varchar(255) | NOT NULL | — | — | — | — | — | Event venue address (plain text) |
| proposed_price | numeric(12,2) | NOT NULL | 0.0 | — | — | — | — | Client's offered price |
| counter_price | numeric(12,2) | NULL | — | — | — | — | — | Provider counter-offer; NULL until made |
| status | varchar(30) | NOT NULL | pending | — | — | — | YES | pending/counter_offered/accepted/rejected/cancelled |
| notes | text | NULL | — | — | — | — | — | Client special requirements |
| timeline | json | NOT NULL | [] | — | — | — | — | Append-only audit trail [{status, timestamp, by, message}] |
| created_at | timestamptz | NOT NULL | — | — | — | — | — | Creation timestamp |
| updated_at | timestamptz | NOT NULL | — | — | — | — | — | Last-modified |
| deleted_at | timestamptz | NULL | — | — | — | — | — | Soft-delete |

---

### TABLE: `notifications`

**BUSINESS PURPOSE**: In-platform notifications for users.
**DOMAIN**: Notification | **MODEL FILE**: `backend/app/features/notifications/models.py`
> ⚠️ CRITICAL GAP: NotificationCRUD.create() exists but is NEVER called from any service code. Zero notifications are ever programmatically generated by platform events.

| Column | DB Type | Nullable | Default | Business Meaning |
|--------|---------|----------|---------|-----------------|
| id | uuid | NOT NULL | uuid4() | Surrogate PK |
| user_id | uuid | NOT NULL | — | Recipient user (FK: users.id CASCADE) |
| title | varchar(100) | NOT NULL | — | Notification headline |
| message | varchar(255) | NOT NULL | — | Notification body |
| is_read | boolean | NOT NULL | false | true after user views it |
| created_at | timestamptz | NOT NULL | now() | Delivery timestamp |
| updated_at | timestamptz | NOT NULL | now() | Last-modified |
| deleted_at | timestamptz | NULL | — | Soft-delete |

**NOT STORED** (missing fields): `notification_type`, `related_entity_id`, `action_url`, `metadata`

---

### TABLE: `reviews`

**BUSINESS PURPOSE**: Client-written ratings and comments for artists or venues. Optionally linked to a booking. Providers can reply.
**DOMAIN**: Review | **MODEL FILE**: `backend/app/features/reviews/models.py`

| Column | DB Type | Nullable | Default | PK | FK | Business Meaning |
|--------|---------|----------|---------|----|----|-----------------|
| id | uuid | NOT NULL | uuid4() | YES | — | Surrogate PK |
| client_id | uuid | NOT NULL | — | — | users.id CASCADE | Review author |
| artist_profile_id | uuid | NULL | — | — | artist_profiles.id CASCADE | Reviewed artist; NULL for venue reviews |
| venue_id | uuid | NULL | — | — | venues.id CASCADE | Reviewed venue; NULL for artist reviews |
| booking_id | uuid | NULL | — | — | bookings.id SET NULL | Optional booking link |
| rating | integer | NOT NULL | 5 | — | — | Star rating 1-5 (no CHECK constraint) |
| comment | text | NOT NULL | — | — | — | Review text |
| reply_comment | text | NULL | — | — | — | Provider's reply |
| reply_at | timestamp (NO TZ) | NULL | — | — | — | Reply timestamp (TIMEZONE INCONSISTENCY) |
| images | json | NOT NULL | [] | — | — | Client-uploaded image URLs |
| videos | json | NOT NULL | [] | — | — | Client-uploaded video URLs |
| created_at | timestamptz | NOT NULL | — | — | — | Creation timestamp |
| updated_at | timestamptz | NOT NULL | — | — | — | Last-modified |
| deleted_at | timestamptz | NULL | — | — | — | Soft-delete |

---

### TABLE: `transactions`

**BUSINESS PURPOSE**: Financial transaction ledger. Foundation only — payment gateway not implemented.
**DOMAIN**: Earnings | **MODEL FILE**: `backend/app/features/earnings/models.py`
> 0 rows. Missing: gateway reference, currency, payer identity, platform commission.

| Column | DB Type | Nullable | Business Meaning |
|--------|---------|----------|-----------------|
| id | uuid | NOT NULL | Surrogate PK |
| artist_profile_id | uuid | NULL | Associated artist (FK: artist_profiles.id CASCADE) |
| venue_id | uuid | NULL | Associated venue (FK: venues.id CASCADE) |
| booking_id | uuid | NULL | Source booking (FK: bookings.id SET NULL) |
| amount | numeric(12,2) | NOT NULL | Transaction amount |
| type | varchar(20) | NOT NULL | credit / debit |
| status | varchar(30) | NOT NULL | pending / completed / failed |
| description | varchar(255) | NULL | Human-readable description |
| created_at | timestamptz | NOT NULL | Creation timestamp |
| updated_at | timestamptz | NOT NULL | Last-modified |
| deleted_at | timestamptz | NULL | Soft-delete |

---

### TABLE: `categories`

**BUSINESS PURPOSE**: Unified taxonomy for all categorical data: genres, languages, venue types, event types.
**DOMAIN**: Location / Taxonomy | **MODEL FILE**: `backend/app/features/categories/models.py`

| Column | DB Type | Nullable | Business Meaning |
|--------|---------|----------|-----------------|
| id | uuid | NOT NULL | Surrogate PK |
| name | varchar(100) | NOT NULL | Label (e.g., Rock, Tamil, Marriage Hall). NOT globally unique |
| type | varchar(50) | NOT NULL | Discriminator: music_genre, language, venue_category, event_type |
| description | varchar(255) | NULL | Optional explanation |
| is_active | boolean | NOT NULL | false = hidden from dropdowns |
| created_at | timestamptz | NOT NULL | Creation timestamp |
| updated_at | timestamptz | NOT NULL | Last-modified |
| deleted_at | timestamptz | NULL | Soft-delete |

---

### TABLE: `countries` / `states` / `cities` / `areas`

**BUSINESS PURPOSE**: 4-tier geographic hierarchy: Country → State → City → Area.

**countries**: ISO code (unique), name (unique). FK: none. CASCADE to states.
**states**: name, country_id FK. CASCADE to cities.
**cities**: name, state_id FK. CASCADE to areas. Referenced by venues.city_id (RESTRICT).
**areas**: name, pincode, city_id FK. latitude/longitude/service_radius. 0 rows currently.

---

### TABLE: `audit_logs`

**BUSINESS PURPOSE**: Admin event log. Built but not wired into service code (0 rows).
**MODEL FILE**: `backend/app/features/settings/models.py`

| Column | DB Type | Nullable | Business Meaning |
|--------|---------|----------|-----------------|
| id | uuid | NOT NULL | Surrogate PK |
| user_id | uuid | NULL | Actor (FK: users.id SET NULL) — preserved even if user deleted |
| action | varchar(100) | NOT NULL | Event type (e.g., user.login, booking.approved) |
| ip_address | varchar(45) | NULL | Client IP |
| user_agent | varchar(255) | NULL | HTTP User-Agent |
| payload | json | NOT NULL | Before/after state snapshot |
| created_at | timestamptz | NOT NULL | Event timestamp |
| updated_at | timestamptz | NOT NULL | Last-modified |
| deleted_at | timestamptz | NULL | Soft-delete |

---

### TABLE: `system_settings`

**BUSINESS PURPOSE**: Runtime key-value configuration store.
> ⚠️ DOES NOT extend BaseModel. Uses varchar PK (not UUID). Missing id, created_at, deleted_at. 0 rows.

| Column | DB Type | Nullable | Business Meaning |
|--------|---------|----------|-----------------|
| key | varchar(100) | NOT NULL (PK) | Setting identifier |
| value | json | NOT NULL | Setting value |
| description | varchar(255) | NULL | Explanation |
| updated_at | timestamp (NO TZ) | NULL | Last-modified (TIMEZONE INCONSISTENCY) |

---

### JUNCTION TABLES

| Junction Table | PK | FK 1 | FK 2 | Purpose |
|---------------|----|----|------|---------|
| user_roles | (user_id, role_id) | users.id CASCADE | roles.id CASCADE | User role assignment |
| role_permissions | (role_id, permission_id) | roles.id CASCADE | permissions.id CASCADE | Role permission grant |
| artist_genres | (artist_profile_id, category_id) | artist_profiles.id CASCADE | categories.id CASCADE | Artist music genres |
| artist_languages | (artist_profile_id, category_id) | artist_profiles.id CASCADE | categories.id CASCADE | Artist performance languages |
| venue_categories | (venue_id, category_id) | venues.id CASCADE | categories.id CASCADE | Venue category types |

---

## 7. PRIMARY KEY INVENTORY

| Table | PK Column | Type | Generator |
|-------|-----------|------|-----------|
| users | id | uuid | Python uuid4() |
| roles | id | uuid | Python uuid4() |
| permissions | id | uuid | Python uuid4() |
| permission_groups | id | uuid | Python uuid4() |
| refresh_tokens | id | uuid | Python uuid4() |
| artist_profiles | id | uuid | Python uuid4() |
| venues | id | uuid | Python uuid4() |
| bookings | id | uuid | Python uuid4() |
| notifications | id | uuid | Python uuid4() |
| reviews | id | uuid | Python uuid4() |
| transactions | id | uuid | Python uuid4() |
| categories | id | uuid | Python uuid4() |
| countries | id | uuid | Python uuid4() |
| states | id | uuid | Python uuid4() |
| cities | id | uuid | Python uuid4() |
| areas | id | uuid | Python uuid4() |
| audit_logs | id | uuid | Python uuid4() |
| system_settings | key | varchar(100) | Application / Admin |
| user_roles | (user_id, role_id) | composite uuid | N/A |
| role_permissions | (role_id, permission_id) | composite uuid | N/A |
| artist_genres | (artist_profile_id, category_id) | composite uuid | N/A |
| artist_languages | (artist_profile_id, category_id) | composite uuid | N/A |
| venue_categories | (venue_id, category_id) | composite uuid | N/A |

> ⚠️ `system_settings` uses a string key PK — the only non-UUID PK in the system.

---

## 8. FOREIGN KEY MATRIX

| Child Table | FK Column | Parent Table | Parent PK | Nullable | ON DELETE |
|-------------|-----------|--------------|-----------|----------|-----------|
| artist_genres | artist_profile_id | artist_profiles | id | NOT NULL | CASCADE |
| artist_genres | category_id | categories | id | NOT NULL | CASCADE |
| artist_languages | artist_profile_id | artist_profiles | id | NOT NULL | CASCADE |
| artist_languages | category_id | categories | id | NOT NULL | CASCADE |
| artist_profiles | user_id | users | id | NOT NULL | CASCADE |
| audit_logs | user_id | users | id | NULL | SET NULL |
| bookings | artist_profile_id | artist_profiles | id | NULL | CASCADE |
| bookings | client_id | users | id | NOT NULL | CASCADE |
| bookings | venue_id | venues | id | NULL | CASCADE |
| cities | state_id | states | id | NOT NULL | CASCADE |
| notifications | user_id | users | id | NOT NULL | CASCADE |
| permissions | group_id | permission_groups | id | NULL | SET NULL |
| refresh_tokens | user_id | users | id | NOT NULL | CASCADE |
| reviews | artist_profile_id | artist_profiles | id | NULL | CASCADE |
| reviews | booking_id | bookings | id | NULL | SET NULL |
| reviews | client_id | users | id | NOT NULL | CASCADE |
| reviews | venue_id | venues | id | NULL | CASCADE |
| role_permissions | permission_id | permissions | id | NOT NULL | CASCADE |
| role_permissions | role_id | roles | id | NOT NULL | CASCADE |
| states | country_id | countries | id | NOT NULL | CASCADE |
| transactions | artist_profile_id | artist_profiles | id | NULL | CASCADE |
| transactions | booking_id | bookings | id | NULL | SET NULL |
| transactions | venue_id | venues | id | NULL | CASCADE |
| user_roles | role_id | roles | id | NOT NULL | CASCADE |
| user_roles | user_id | users | id | NOT NULL | CASCADE |
| venue_categories | category_id | categories | id | NOT NULL | CASCADE |
| venue_categories | venue_id | venues | id | NOT NULL | CASCADE |
| venues | city_id | cities | id | NOT NULL | RESTRICT |
| venues | user_id | users | id | NOT NULL | CASCADE |

---

## 9. RELATIONSHIP MATRIX

| Entity A | Entity B | Type | DB Enforced |
|----------|----------|------|------------|
| User | ArtistProfile | ONE-TO-ONE | YES — UNIQUE on artist_profiles.user_id |
| User | Venue | ONE-TO-MANY | NO — no UNIQUE on venues.user_id |
| User | RefreshToken | ONE-TO-MANY | FK CASCADE |
| User | Notification | ONE-TO-MANY | FK CASCADE |
| User | Booking (as client) | ONE-TO-MANY | FK CASCADE |
| ArtistProfile | Booking | ONE-TO-MANY | FK CASCADE (nullable) |
| ArtistProfile | Review | ONE-TO-MANY | FK CASCADE (nullable) |
| ArtistProfile | Transaction | ONE-TO-MANY | FK CASCADE (nullable) |
| Venue | Booking | ONE-TO-MANY | FK CASCADE (nullable) |
| Venue | Review | ONE-TO-MANY | FK CASCADE (nullable) |
| Venue | Transaction | ONE-TO-MANY | FK CASCADE (nullable) |
| Country | State | ONE-TO-MANY | FK CASCADE |
| State | City | ONE-TO-MANY | FK CASCADE |
| City | Area | ONE-TO-MANY | FK CASCADE |
| City | Venue | ONE-TO-MANY | FK RESTRICT |
| Role | Permission | MANY-TO-MANY | Composite PK in role_permissions |
| User | Role | MANY-TO-MANY | Composite PK in user_roles |

---

## 10. AUTH & RBAC DICTIONARY

### Canonical Roles (4 rows in `roles` table)

| Role Name | Business Purpose | Registerable Publicly |
|-----------|-----------------|----------------------|
| `client` | Browses and books artists/venues | YES |
| `artist` | Offers performance services | YES |
| `venue_owner` | Offers event space listings | YES |
| `admin` | Platform operator | NO (service-level block) |

### Architecture Note
- **DB supports multi-role** (many-to-many user_roles junction)
- **Application treats user as single-role** — reads `roles[0]` only; JWT embeds one `role` value
- **Verification tokens**: STATELESS JWT — NOT stored in database
- **Refresh tokens**: STORED in `refresh_tokens` table, hashed

### User Deletion Cascade Behavior

| Related Entity | On User DELETE |
|---------------|---------------|
| refresh_tokens | CASCADE (deleted) |
| user_roles | CASCADE (deleted) |
| notifications | CASCADE (deleted) |
| artist_profiles | CASCADE (deleted) |
| client_bookings | CASCADE (deleted) |
| audit_logs | SET NULL (preserved, actor anonymized) |

---

## 11. ARTIST / BAND IDENTITY DICTIONARY

| Concept | Table | Column | Exists | Status |
|---------|-------|--------|--------|--------|
| @Username / Handle | artist_profiles | username (varchar 30) | YES | STORED; nullable; case-sensitive at DB level |
| Display Name | artist_profiles | display_name | YES | COMPLETE |
| Legal Name | users | name | YES | COMPLETE |
| Genres | artist_genres + categories | category_id | YES | COMPLETE (many-to-many) |
| Languages | artist_languages + categories | category_id | YES | COMPLETE (many-to-many) |
| City | artist_profiles | city (varchar, NOT FK) | YES | PLAIN TEXT ONLY — no FK normalization |
| State | artist_profiles | state (varchar, NOT FK) | YES | PLAIN TEXT ONLY |
| Country | — | NOT STORED | NO | NOT STORED |
| Verification Status | artist_profiles | verification_status | YES | COMPLETE |
| Rating | artist_profiles | rating (numeric 2,1) | YES | COMPLETE |
| Documents | artist_profiles | documents (json) | YES | STORED; NOT in public API responses |
| Profile Views | — | NOT STORED | NO | NOT STORED |
| Review Count | — | NOT STORED | NO | Computed on-the-fly from reviews table |

---

## 12. VENUE IDENTITY DICTIONARY

| Concept | Table | Column | Exists | Status |
|---------|-------|--------|--------|--------|
| Venue Number (BCV) | venues | venue_number (varchar 50) | YES | BCV-XXXXXX format; unique; system-generated |
| Sequence | PostgreSQL | venue_number_seq | YES | start=100001; last_value=100003 |
| Who owns BCV? | venues table | NOT users table | YES | VENUE entity — not Venue Owner account |
| City (normalized) | venues | city_id (FK → cities) | YES | COMPLETE |
| State | venues | state (varchar, plain text) | YES | REDUNDANT alongside city_id hierarchy |
| Country | venues | country (varchar, plain text) | YES | REDUNDANT alongside city_id hierarchy |
| Venue Type | venues | venue_type | YES | COMPLETE |
| Business Name | venues | business_name | YES | COMPLETE |
| Verification Status | venues | verification_status | YES | COMPLETE |
| Documents | venues | documents (json) | YES | NOT in public API |
| Rating | — | NOT STORED | NO | Computed from reviews table |
| One owner, multiple venues? | venues | no UNIQUE on user_id | YES | SUPPORTED — intentional architecture |

### BCV Generation Facts

| Property | Value |
|----------|-------|
| PostgreSQL sequence | `venue_number_seq` |
| Start value | 100001 |
| Increment | 1 |
| Cycling | Disabled (NO CYCLE) |
| Current last_value | 100003 |
| Format | `BCV-XXXXXX` (e.g., `BCV-100001`) |
| Generated at | Venue row creation — NOT at Venue Owner registration |
| Can frontend send venue_number? | NO — not in any request schema |
| Can venue_number be updated? | NO — not in any update endpoint |

---

## 13. BOOKING DICTIONARY

### Booking Answers

| Question | Answer |
|---------|--------|
| Can booking target Artist only? | YES |
| Can booking target Venue only? | YES |
| Can booking target both? | YES |
| Can booking target neither? | YES at DB level (no CHECK constraint); application rejects it |
| DB constraint enforcing provider? | NONE |
| Status enforcement | APPLICATION-ONLY string; no ENUM; no CHECK |
| Is timeline append-only? | YES — JSON column appended, not replaced |
| Duplicate reviews per booking? | YES — no UNIQUE constraint on (booking_id, client_id) |

### Booking Status Values

`pending` → `counter_offered` → `accepted`  
`pending` → `rejected`  
`pending` / `counter_offered` → `cancelled`

---

## 14. LOCATION DICTIONARY

### Geographic Hierarchy

```
Country → State → City (used by venues.city_id RESTRICT FK)
                    ↓
                   Area (exists; 0 rows; not used by any profile table)
```

### Location Storage Inconsistency

| Entity | Method | Columns Used |
|--------|--------|-------------|
| Venue | MIXED — FK + plain text | city_id (FK) + state (varchar) + country (varchar) |
| Artist | Plain text ONLY | city (varchar) + state (varchar) |
| Artist Country | NOT STORED | — |
| Artist Area | NOT STORED | — |

---

## 15. NOTIFICATION DICTIONARY

| Event | Notification Created | Status |
|-------|---------------------|--------|
| Booking created | NO | NOT WIRED |
| Booking accepted | NO | NOT WIRED |
| Booking rejected | NO | NOT WIRED |
| Verification approved | NO | NOT WIRED |
| Verification rejected | NO | NOT WIRED |
| Any event | NO | NOT WIRED |

> `NotificationCRUD.create()` is implemented in `notifications/crud.py` but is never called from any service file.

---

## 16. PAYMENT / TRANSACTION / EARNINGS DICTIONARY

| Aspect | Status |
|--------|--------|
| Transaction table | EXISTS — foundation only, 0 rows |
| Payment gateway | NOT IMPLEMENTED |
| Payer identity | NOT STORED |
| Currency column | NOT STORED |
| Gateway reference | NOT STORED |
| Platform commission | Config env var only |
| Earnings CRUD | EXISTS — returns $0 |

---

## 17. POSTGRESQL SEQUENCE INVENTORY

| Sequence | Start | Increment | Min | Max | Cycle | Last Value |
|----------|-------|-----------|-----|-----|-------|-----------|
| venue_number_seq | 100001 | 1 | 1 | 9223372036854775807 | NO | 100003 |

---

## 18. INDEX INVENTORY

### Unique Indexes

| Table | Index | Columns |
|-------|-------|---------|
| users | ix_users_email | email |
| roles | ix_roles_name | name |
| permissions | ix_permissions_name | name |
| permission_groups | ix_permission_groups_name | name |
| refresh_tokens | ix_refresh_tokens_token_hash | token_hash |
| artist_profiles | ix_artist_profiles_user_id | user_id |
| artist_profiles | ix_artist_profiles_username | username |
| countries | ix_countries_name | name |
| countries | ix_countries_code | code |
| venues | ix_venues_venue_number | venue_number |

### Notable Non-Unique Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| artist_profiles | ix_artist_profiles_city | city | Marketplace city filter |
| artist_profiles | ix_artist_profiles_verification_status | verification_status | Admin queue |
| bookings | ix_bookings_event_date | event_date | Date range queries |
| bookings | ix_bookings_status | status | Status queue filtering |
| venues | ix_venues_verification_status | verification_status | Admin queue |
| notifications | ix_notifications_user_id | user_id | Per-user inbox |

### Missing Indexes (Gaps)

| Missing | Impact |
|---------|--------|
| bookings(client_id, status) composite | High-frequency client dashboard query |
| notifications.is_read | mark-all-as-read does full user scan |
| categories(name, type) composite | Genre/language lookup by both fields |

---

## 19. UNIQUE CONSTRAINT INVENTORY

| Table | Column(s) | Type | Business Reason |
|-------|-----------|------|-----------------|
| users | email | UNIQUE index | One account per email |
| roles | name | UNIQUE index | Role names are global identifiers |
| permissions | name | UNIQUE index | Permission tokens are global |
| permission_groups | name | UNIQUE index | Group names are unique |
| refresh_tokens | token_hash | UNIQUE index | No duplicate token storage |
| artist_profiles | user_id | UNIQUE index | One profile per user (1:1) |
| artist_profiles | username | UNIQUE index | Username uniqueness |
| countries | name | UNIQUE index | Country names unique |
| countries | code | UNIQUE index | ISO codes unique |
| venues | venue_number | UNIQUE index | BCV numbers unique |
| user_roles | (user_id, role_id) | Composite PK | No duplicate role assignments |
| role_permissions | (role_id, permission_id) | Composite PK | No duplicate permission grants |
| artist_genres | (artist_profile_id, category_id) | Composite PK | No duplicate genre assignments |
| artist_languages | (artist_profile_id, category_id) | Composite PK | No duplicate language assignments |
| venue_categories | (venue_id, category_id) | Composite PK | No duplicate category assignments |

---

## 20. ENUM / STATUS INVENTORY

| Field | Table | Storage | Allowed Values | DB Enforced |
|-------|-------|---------|----------------|-------------|
| verification_status | artist_profiles | varchar(30) | pending, approved, rejected | NO |
| verification_status | venues | varchar(30) | pending, approved, rejected | NO |
| status | bookings | varchar(30) | pending, counter_offered, accepted, rejected, cancelled | NO |
| type | transactions | varchar(20) | credit, debit | NO |
| status | transactions | varchar(30) | pending, completed, failed | NO |
| type | categories | varchar(50) | music_genre, language, venue_category, event_type | NO |
| is_active | users, categories | boolean | true, false | DB boolean |
| is_verified | users | boolean | true, false | DB boolean |
| is_revoked | refresh_tokens | boolean | true, false | DB boolean |

> All status columns use `varchar` strings. No PostgreSQL ENUM types. No CHECK constraints. Validation is application-enforced only.

---

## 21. JSON COLUMN INVENTORY

All JSON columns use `json` type (not `jsonb`) — cannot be GIN-indexed or efficiently queried.

| Table | Column | Expected Shape |
|-------|--------|---------------|
| artist_profiles | equipment | `{"mic": bool, "own_speaker": bool}` |
| artist_profiles | availability | `{"weekly_schedule": {...}, "blocked_dates": [...]}` |
| artist_profiles | social_links | `{"instagram": str, "facebook": str}` |
| artist_profiles | achievements | `["Award 1", "Award 2"]` |
| artist_profiles | documents | `[{"title": str, "url": str}]` |
| artist_profiles | gallery | `["url1", "url2"]` |
| artist_profiles | videos | `["url1", "url2"]` |
| artist_profiles | youtube_links | `["url1", "url2"]` |
| artist_profiles | instagram_reels | `["url1", "url2"]` |
| artist_profiles | pricing_details | `{"hourly_rate": num, "packages": [...]}` |
| venues | facilities | `["sound_system", "stage"]` |
| venues | gallery | `["url1", "url2"]` |
| venues | pricing_details | `{"hourly_price": num, "security_deposit": num}` |
| venues | availability_rules | `{"weekly_schedule": {...}, "blocked_dates": [...]}` |
| venues | documents | `{"doc_pan": str, "doc_gst": str}` |
| venues | metadata_fields | `{"gst_number": str, "indoor_outdoor": str}` UNSTRUCTURED |
| bookings | timeline | `[{"status": str, "timestamp": str, "by": str, "message": str}]` |
| reviews | images | `["url1", "url2"]` |
| reviews | videos | `["url1", "url2"]` |
| audit_logs | payload | `{}` UNSTRUCTURED |
| system_settings | value | Any JSON value |

---

## 22. TIMESTAMP / SOFT DELETE MATRIX

| Table | created_at | updated_at | deleted_at | Compliant |
|-------|-----------|-----------|-----------|-----------|
| users | timestamptz | timestamptz | timestamptz | YES |
| roles | timestamptz | timestamptz | timestamptz | YES |
| artist_profiles | timestamptz | timestamptz | timestamptz | YES |
| venues | timestamptz | timestamptz | timestamptz | YES |
| bookings | timestamptz | timestamptz | timestamptz | YES |
| notifications | timestamptz | timestamptz | timestamptz | YES |
| reviews | timestamptz | timestamptz | timestamptz | YES |
| transactions | timestamptz | timestamptz | timestamptz | YES |
| categories | timestamptz | timestamptz | timestamptz | YES |
| countries/states/cities/areas | timestamptz | timestamptz | timestamptz | YES |
| refresh_tokens | timestamptz | timestamptz | timestamptz | YES |
| audit_logs | timestamptz | timestamptz | timestamptz | YES |
| system_settings | MISSING | timestamp (NO TZ) | MISSING | NO — INCONSISTENT |
| reviews.reply_at | — | timestamp (NO TZ) | — | MINOR — no timezone |

---

## 23. CASCADE / DELETE BEHAVIOR RISKS

| Parent Deleted | Cascades To | Risk |
|---------------|------------|------|
| users | artist_profiles → bookings → (timeline lost) | HIGH — booking history lost |
| users | venues → bookings → (timeline lost) | HIGH |
| artist_profiles | bookings | HIGH — booking history lost |
| artist_profiles | transactions | HIGH — earnings lost |
| artist_profiles | reviews | HIGH — reviews deleted |
| venues | bookings | HIGH |
| venues | reviews | HIGH |
| bookings | reviews | LOW — SET NULL (reviews preserved) |
| bookings | transactions | LOW — SET NULL (transactions preserved) |
| cities | venues | SAFE — RESTRICT prevents deletion |
| users | audit_logs | SAFE — SET NULL (log preserved) |

---

## 24. DATABASE ↔ SQLALCHEMY DRIFT AUDIT

| Item | PostgreSQL | SQLAlchemy | Drift | Severity |
|------|-----------|-----------|-------|---------|
| reviews.reply_at | timestamp (no tz) | DateTime (no tz) | Consistent but lacks timezone vs all other timestamptz fields | MEDIUM |
| system_settings.updated_at | timestamp (no tz) | DateTime | No timezone — inconsistent with all other timestamp columns | MEDIUM |
| system_settings: no id/created_at/deleted_at | No BaseModel inheritance | Intentional design | LOW |
| artist_profiles.username | nullable=True, UNIQUE index | Matches | NONE |
| venues.venue_number | nullable=True, UNIQUE index | Matches | NONE |

---

## 25. DATA SENSITIVITY CLASSIFICATION

| Column | Classification | API Exposed | Public |
|--------|---------------|-------------|--------|
| users.password_hash | SENSITIVE AUTH | NEVER | NO |
| refresh_tokens.token_hash | SENSITIVE AUTH | NEVER | NO |
| users.email | PERSONAL DATA | Authenticated only | NO |
| artist_profiles.mobile_number | PERSONAL DATA | Auth endpoints only | NO |
| artist_profiles.documents | VERIFICATION DATA | Admin only | NO |
| venues.documents | VERIFICATION DATA — HIGH | Admin only | NO |
| venues.metadata_fields | INTERNAL | Internal only | NO |
| artist_profiles.username | PUBLIC IDENTIFIER | YES | YES |
| venues.venue_number | PUBLIC IDENTIFIER | YES | YES |
| transactions.amount | FINANCIAL | Authenticated | NO |
| audit_logs.payload | INTERNAL | Admin only | NO |

---

## 26. DATA QUALITY OBSERVATIONS

1. **No CHECK constraints** on status fields — any string value can be stored
2. **Booking provider not DB-enforced** — both artist_profile_id and venue_id can be NULL simultaneously
3. **Duplicate reviews per booking** — no UNIQUE(booking_id, client_id) constraint
4. **Username case-sensitive at DB** — `neonpulse` ≠ `NeonPulse` in UNIQUE index; application must normalize
5. **Location storage inconsistency** — Venue uses FK + plain text; Artist uses plain text only; no country on Artist
6. **Notifications not wired** — NotificationCRUD.create() exists but is never called
7. **reply_at lacks timezone** — minor but inconsistent with all other datetime columns
8. **system_settings.updated_at lacks timezone** — same issue
9. **Redundant id indexes** — `ix_*_id` non-unique index exists alongside PK UNIQUE index on every table
10. **audit_logs has 0 rows** — infrastructure built but no service code triggers it

---

## 27. ARCHITECTURE RISKS

1. **CASCADE DELETE wipes booking history** — Deleting a user or artist/venue profile cascades to booking records including the timeline audit trail
2. **Username case sensitivity** — UNIQUE index is case-sensitive; without app-level lowercasing, duplicate handles possible
3. **Notifications completely unwired** — Users never receive platform event notifications
4. **No booking provider CHECK constraint** — A booking with no artist or venue is valid at the DB level
5. **json vs jsonb** — All JSON columns use `json` (not `jsonb`); no GIN indexing possible; queries must load entire JSON blob
6. **transactions table incomplete** — No currency, no payer, no gateway reference columns; significant migration needed when payment is added
7. **system_settings non-standard** — No UUID PK, no created_at/deleted_at, no timezone on updated_at; cannot be audited like other entities

---

## 28. IMPORTANT IDENTITY QUESTIONS — DEFINITIVE ANSWERS

### ARTIST USERNAME

| Question | Answer |
|---------|--------|
| Stored in | `artist_profiles.username` varchar(30) |
| Nullable | YES — not required at profile creation |
| Unique at DB level | YES — UNIQUE index |
| Case-sensitive at DB level | YES — `NEON` and `neon` can coexist |
| Lowercase normalization in DB | NO — application must enforce |
| Required at registration | NO |
| Shown in marketplace | YES via API; NOT yet displayed in frontend UI |
| URL routing via username | PARTIAL — column/index exists; endpoint not implemented |

### VENUE NUMBER (BCV)

| Question | Answer |
|---------|--------|
| Stored in | `venues.venue_number` varchar(50) |
| Nullable | YES in column definition |
| Unique | YES — UNIQUE index |
| Generated by | PostgreSQL sequence `venue_number_seq` |
| Format | `BCV-XXXXXX` (e.g., BCV-100001) |
| Sequence start | 100001 |
| Sequence last_value | 100003 (3 venues exist) |
| BCV belongs to | VENUE entity — NOT Venue Owner User account |
| Generated at | Venue row creation — NOT at owner registration |
| Can frontend send BCV | NO — not in any request schema |
| Can BCV be changed | NO — no update endpoint accepts venue_number |
| Routing via BCV | YES — column + UNIQUE index in place |

### BOOKING PROVIDER

| Question | Answer |
|---------|--------|
| Booking can target artist | YES |
| Booking can target venue | YES |
| Booking can target both | YES |
| Booking can target neither (DB) | YES — no CHECK constraint |
| Booking can target neither (App) | NO — service layer validates |

---

## 29. MIGRATION CHAIN

| Revision | Down-revision | Description |
|----------|--------------|-------------|
| 3a5d795e03a2 | None (initial) | Full initial schema: users, roles, artist_profiles, venues, categories, locations, etc. |
| 5daef3f2a55a | 3a5d795e03a2 | Add registration fields |
| 47a1ac7dafe1 | 5daef3f2a55a | Create bookings table |
| 8ab5352e83f2 | 47a1ac7dafe1 | Update bookings relational |
| 000c8e994a91 | 8ab5352e83f2 | Create reviews table |
| d251fbf76528 | 000c8e994a91 | Create transactions table |
| 4f818e37a292 | d251fbf76528 | Add venue owner details fields |
| 56bce48b861d | 4f818e37a292 | Add venue registration fields |
| fcfca1fabe4e | 56bce48b861d | Stabilization changes |
| 8f4d17d6bad4 | fcfca1fabe4e | Add notifications and cooldown |
| c3791d4767e6 | 8f4d17d6bad4 | Add social and achievements |
| 29cd4bcead61 | c3791d4767e6 | Add instagram reels |
| f3b3c7e54c9e | 29cd4bcead61 | Add venue documents and metadata |
| 480018cab2a6 | f3b3c7e54c9e | Add artist city/state |
| **9f956581e2de** | 480018cab2a6 | **Add auth identity fields (username + venue_number_seq + BCV)** |

---

## 30. MODULE DATA READINESS SUMMARY

| Module | Schema Status | Notes |
|--------|--------------|-------|
| Authentication | COMPLETE | All tables, FKs, indexes, verification logic in place |
| Artist / Band | COMPLETE | Full column set. Username nullable — not required at creation |
| Venue | COMPLETE | BCV sequence, venue_number, all required columns present |
| Location | MOSTLY COMPLETE | 4-tier hierarchy exists; areas unseeded; location storage inconsistency |
| Admin / Verification | COMPLETE | Verification pipeline on artist_profiles and venues. audit_logs unwired |
| Marketplace | COMPLETE | Both artist and venue marketplace endpoints operational |
| Client | COMPLETE | Client role, booking creation, review writing functional |
| Booking | MOSTLY COMPLETE | Schema complete. No DB CHECK for provider. No status ENUM |
| Notification | PARTIAL | Table correct; no business events create notifications |
| Review | MOSTLY COMPLETE | Schema complete. No duplicate-review protection. reply_at lacks timezone |
| Earnings / Transaction | FOUNDATION ONLY | Table exists. Missing gateway, currency, payer. 0 rows |
| Payment | NOT IMPLEMENTED | No models, no gateway columns, no migration |
| Audit / Settings | PARTIAL | audit_logs schema complete but unwired. system_settings non-standard |
