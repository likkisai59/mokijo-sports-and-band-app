# BandConnect — Database Cleanup Report (v3.0)

> **Prepared By**: Chief Database Architect / Principal Software Engineer
> **Audit Date**: 2026-07-16
> **Scope**: Backend database-related files (SQLAlchemy models, schemas, repositories, migrations, database configs)

---

## 1. Audit Summary

The database architecture has been audited to identify unused or duplicate files. All critical project files are active and correctly wired. Temporary search dump files and old developer generation scripts have been purged.

| Metric | Count |
|--------|-------|
| **Total Files Reviewed** | 67 |
| **Files Kept (ACTIVE)** | 65 |
| **Files Deleted (UNUSED)** | 2 |
| **Duplicate Files Removed** | 0 |
| **Reused Abstractions** | 3 |

---

## 2. Active Database Files Kept

### 2.1 Core Database Infrastructure

| File | Module | Reason for Keeping |
|------|--------|---------------------|
| `app/core/config.py` | Core | Loads settings, environment variables, and `DATABASE_URL` for DB connections. |
| `app/core/database.py` | Core | Manages SQLAlchemy engine, session maker (`get_db`), and core declarative base. |
| `app/core/dependencies.py` | Core | Gathers FastAPI dependencies for routing database sessions and performing RBAC checks. |
| `app/core/models_registry.py` | Core | Imports all database models so they are visible to the SQLAlchemy declarative metadata wrapper. Required by Alembic migrations to detect schema changes. |

### 2.2 Reused Common Abstractions

| File | Module | Reason for Keeping |
|------|--------|---------------------|
| `app/common/models/base.py` | Common | Declares abstract `BaseModel` providing `id` (UUID primary key), `created_at`, `updated_at`, and `deleted_at` fields. |
| `app/common/repositories/base.py` | Common | Generic repository pattern implementing default CRUD query operations. |
| `app/common/schemas/base.py` | Common | Provides base Pydantic response structures. |

### 2.3 Feature-Specific Database Files

All models, schemas, repositories, and routing configurations in the following directories have been verified as active:
- **Authentication**: `app/features/auth/models.py` (Users, Roles, Permissions, JWT rotation)
- **Artists**: `app/features/artists/models.py` (Artist profiles, genres, languages, rates)
- **Venues**: `app/features/venues/models.py` (Venue specs, categories, pricing, BCV number sequence)
- **Bookings**: `app/features/bookings/models.py` (Negotiations, statuses, timeline log)
- **Reviews**: `app/features/reviews/models.py` (Rating, replies, review comments)
- **Notifications**: `app/features/notifications/models.py` (Inbox delivery alerts)
- **Locations**: `app/features/locations/models.py` (Normalized Countries, States, Cities, Areas)
- **Earnings**: `app/features/earnings/models.py` (Financial Transaction records)
- **Settings**: `app/features/settings/models.py` (Admin System Settings and Audit Log registry)

---

## 3. Files Deleted (UNUSED)

| File | Module | Reason for Deletion | Verification Reference |
|------|--------|---------------------|------------------------|
| `backend/schema_dump.json` | Infrastructure | Temporary JSON database dump created during discovery. Not referenced by any runtime file or deployment pipeline. Safe to delete. | Searched all backend python files — 0 imports found. |
| `backend/generate_comprehensive_excel.py` | Infrastructure | Old, incomplete Excel generator script from a prior development iteration. Fully replaced by the v3.0 script `gen_dict.py`. | Superceded. Deleted to maintain clean repo workspace. |

---

## 4. Reused Files Analysis

No duplicate helpers were created. All database interactions utilize:
1. **`app/core/dependencies.py`** to obtain database sessions, preventing connection leaks.
2. **`app/common/models/base.py`** to share auditing parameters, preventing model definition bloat.
3. **`app/utils/validators.py`** for shared email, username, and mobile validation, preventing validation mismatch bugs.

---

## 5. Final Database Directory Structure

```
backend/
├── gen_dict.py                # Single Data Dictionary workbook compiler script (ACTIVE)
├── main.py                    # FastAPI startup file
├── seed_demo_data.py          # Development data seeder
├── test.db                    # Local SQLite test database
│
├── alembic/
│   └── versions/              # Migration files tracking schema changes (HEAD: 9f956581e2de)
│
└── app/
    ├── common/
    │   ├── models/base.py     # BaseModel definitions
    │   └── repositories/      # Repository abstractions
    │
    ├── core/
    │   ├── database.py        # SQLAlchemy core engine
    │   ├── dependencies.py    # DI dependency management
    │   └── models_registry.py # Declares models list for Alembic
    │
    └── features/              # Models, schemas, routers for all 10 feature areas
```
